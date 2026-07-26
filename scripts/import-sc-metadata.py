#!/usr/bin/env python3
"""Manual Supreme Court metadata importer.

Downloads public Supreme Court metadata parquet files from the open S3 mirror,
normalizes lightweight metadata into Justice Clock CSV format, and writes
research summary artifacts. This is intentionally not part of `npm run build`.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
IMPORT_CSV = ROOT / "data" / "imports" / "judgments.csv"
SUMMARY_JSON = ROOT / "data" / "research" / "sc-corpus-summary.json"
PUBLIC_SUMMARY_JSON = ROOT / "public" / "data" / "sc-corpus-summary.json"
SOURCE_URL = (
    "https://indian-supreme-court-judgments.s3.amazonaws.com/"
    "metadata/parquet/year={year}/metadata.parquet"
)
SOURCE_NAME = "Indian Supreme Court Judgments public S3 metadata"
CASE_TYPE_PARSER_VERSION = 2

CSV_HEADERS = [
    "id",
    "caseTitle",
    "caseNumber",
    "diaryNumber",
    "diaryYear",
    "caseType",
    "caseYear",
    "decisionDate",
    "judgmentDate",
    "uploadDate",
    "disposalNature",
    "judges",
    "authoringJudge",
    "benchSize",
    "subjectTags",
    "sourceName",
    "sourceUrl",
    "confidence",
    "sample",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-year", "--from-year", dest="start_year", type=int, default=1950)
    parser.add_argument("--end-year", "--to-year", dest="end_year", type=int, default=2024)
    parser.add_argument("--fail-under", "--min-records", dest="min_records", type=int, default=30000)
    return parser.parse_args()


def research_csv_path(start_year: int, end_year: int) -> Path:
    return ROOT / "data" / "research" / f"sc-judgments-{start_year}-{end_year}.csv"


def require_pyarrow():
    try:
        import pandas as pd  # type: ignore
        import pyarrow  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            "pandas and pyarrow are required. Install them in the workflow before "
            "running scripts/import-sc-metadata.py."
        ) from exc
    return pd


def download_parquet(year: int) -> Path:
    raw_dir = ROOT / "data" / "raw" / "sc-metadata" / str(year)
    raw_dir.mkdir(parents=True, exist_ok=True)
    path = raw_dir / "metadata.parquet"
    if path.exists():
        return path

    url = SOURCE_URL.format(year=year)
    try:
        with urlopen(url, timeout=60) as response:
            path.write_bytes(response.read())
    except (HTTPError, URLError) as exc:
        raise RuntimeError(f"Unable to download {url}: {exc}") from exc
    return path


def first_text(row: dict, *names: str) -> str:
    for name in names:
        value = row.get(name)
        if value is not None and str(value).strip() and str(value).lower() != "nan":
            return str(value).strip()
    return ""


def decode_html(value: str) -> str:
    if not value:
        return ""
    text = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def detail_field(raw_html: str, label: str) -> str:
    if not raw_html:
        return ""
    escaped = re.escape(label)
    patterns = [
        rf"{escaped}\s*:?\s*</span>\s*<font[^>]*>([\s\S]*?)</font>",
        rf"{escaped}\s*:?\s*</[^>]+>\s*<[^>]+>([\s\S]*?)</[^>]+>",
    ]
    for pattern in patterns:
        match = re.search(pattern, raw_html, flags=re.IGNORECASE)
        if match:
            return decode_html(match.group(1))
    return ""


def date_text(value: str) -> str:
    if not value:
        return ""
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", value)
    if match:
        return match.group(0)
    match = re.search(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})", value)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return ""


def split_judges(value: str) -> list[str]:
    return [item.strip() for item in re.split(r";|,|\band\b", value) if item.strip()]


def infer_case_type(*values: str) -> str:
    text = " ".join(value for value in values if value).upper()
    text = re.sub(r"[._/()\[\]-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if re.search(r"\bCRIMINAL APPEAL\b|\bCRL A\b|\bCR A\b", text):
        return "Criminal Appeal"
    if re.search(r"\bCIVIL APPEAL\b|\bC A\b", text):
        return "Civil Appeal"

    if re.search(r"SPECIAL LEAVE (?:PETITION|TO APPEAL).*(?:CRIMINAL|CRL)", text) or re.search(
        r"\bSLP\s*(?:CRL|CRIMINAL)\b", text
    ):
        return "SLP Criminal"
    if re.search(r"SPECIAL LEAVE (?:PETITION|TO APPEAL).*(?:CIVIL|\bC\b)", text) or re.search(
        r"\bSLP\s*(?:C|CIVIL)\b", text
    ):
        return "SLP Civil"
    if "SPECIAL LEAVE PETITION" in text or "SPECIAL LEAVE TO APPEAL" in text or re.search(
        r"\bSLP\b", text
    ):
        return "SLP (Unspecified)"

    if "WRIT PETITION" in text or re.search(r"\bW P\b", text):
        if re.search(r"(?:WRIT PETITION|\bW P\b).*(?:CRIMINAL|CRL)", text):
            return "Writ Petition Criminal"
        if re.search(r"(?:WRIT PETITION|\bW P\b).*(?:CIVIL|\bC\b)", text):
            return "Writ Petition Civil"
        return "Writ Petition"

    petition_patterns = [
        ("REVIEW PETITION", r"\bR P\b", "Review Petition"),
        ("CONTEMPT PETITION", r"\bCONT(?:EMPT)? P(?:ET)?\b|\bCONMT PET\b", "Contempt Petition"),
        ("TRANSFER PETITION", r"\bT P\b", "Transfer Petition"),
        ("CURATIVE PETITION", r"\bCURATIVE PET\b", "Curative Petition"),
    ]
    for phrase, abbreviation, label in petition_patterns:
        if phrase in text or re.search(abbreviation, text):
            marker = rf"(?:{re.escape(phrase)}|{abbreviation})"
            if re.search(marker + r".*(?:CRIMINAL|CRL)", text):
                return f"{label} Criminal"
            if re.search(marker + r".*(?:CIVIL|\bC\b)", text):
                return f"{label} Civil"
            return label

    if "ARBITRATION PETITION" in text or re.search(r"\bARB(?:ITRATION)? P\b", text):
        return "Arbitration Petition"
    if "MISCELLANEOUS APPLICATION" in text or re.search(r"\bM A\b", text):
        return "Miscellaneous Application"
    if "INTERLOCUTORY APPLICATION" in text or re.search(r"\bI A\b", text):
        return "Interlocutory Application"
    if "ORIGINAL SUIT" in text or "CIVIL ORIGINAL" in text or re.search(r"\bO S\b", text):
        return "Original Suit"
    if "ELECTION PETITION" in text:
        return "Election Petition"
    if "SPECIAL REFERENCE" in text or "PRESIDENTIAL REFERENCE" in text:
        return "Reference"
    if "CRIMINAL MISCELLANEOUS" in text or re.search(r"\bCRL M P\b", text):
        return "Criminal Miscellaneous Petition"
    if "CIVIL MISCELLANEOUS" in text or re.search(r"\bC M P\b", text):
        return "Civil Miscellaneous Petition"
    if re.search(r"\bCRIMINAL PETITION\b", text):
        return "Criminal Petition"
    if re.search(r"\bCIVIL PETITION\b", text):
        return "Civil Petition"
    if re.search(r"\bAPPEAL\b", text):
        return "Appeal (Unspecified)"
    return "Unclassified"


def year_from_date(value: str) -> str:
    normalized = date_text(value)
    return normalized[:4] if normalized else ""


def plausible_start_year(value: str) -> str:
    if not value:
        return ""
    match = re.search(r"\b(19[5-9]\d|20\d{2})\b", value)
    return match.group(1) if match else ""


def first_start_year(row: dict) -> tuple[str, str]:
    date_year = year_from_date(
        first_text(
            row,
            "filing_date",
            "registration_date",
            "registered_on",
            "institution_date",
            "diary_date",
        )
    )
    if date_year:
        return date_year, "date"

    structured_year = first_text(
        row,
        "diary_year",
        "filing_year",
        "registration_year",
        "institution_year",
        "case_year",
    )
    structured_year = plausible_start_year(structured_year)
    if structured_year:
        return structured_year, "structured-year"

    diary_number = first_text(row, "diary_number", "diary_no", "cnr")
    diary_year = plausible_start_year(diary_number)
    if diary_year:
        return diary_year, "diary-number"

    return "", ""


def unique_join(*values: str) -> str:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        cleaned = value.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            output.append(cleaned)
    return " | ".join(output)


def normalize(row: dict) -> dict | None:
    raw_html = first_text(row, "raw_html")
    title = first_text(row, "title", "case_title", "caseTitle", "name")
    case_id = first_text(row, "case_id", "id", "path")
    raw_case_number = first_text(row, "case_number", "case_no", "caseNumber") or detail_field(
        raw_html, "Case No"
    )
    citation = first_text(row, "citation")
    neutral_citation = first_text(row, "nc_display", "neutral_citation")
    decision_date = date_text(first_text(row, "decision_date", "judgment_date", "date"))
    judges_text = first_text(row, "judges", "judge", "coram", "bench")
    judges = split_judges(judges_text)

    if not title or not decision_date or not judges:
        return None

    start_year, start_signal = first_start_year(row)
    explicit_case_type = first_text(
        row,
        "case_type",
        "caseType",
        "case_category",
        "category",
        "docket_type",
        "matter_type",
    )
    case_type = infer_case_type(explicit_case_type, raw_case_number)
    if explicit_case_type and case_type == "Unclassified":
        case_type = explicit_case_type

    source_path = first_text(row, "path", "source_path")
    source_url = first_text(row, "metadata_url", "source_url") or SOURCE_URL.format(
        year=decision_date[:4]
    )

    return {
        "id": f"sc-meta-{case_id or re.sub(r'[^A-Za-z0-9]+', '-', title)[:80]}",
        "caseTitle": title,
        "caseNumber": unique_join(raw_case_number, neutral_citation, citation),
        "diaryNumber": first_text(row, "diary_number", "diary_no") or detail_field(
            raw_html, "Diary No"
        ),
        "diaryYear": start_year if start_signal in {"date", "diary-number"} else "",
        "caseType": case_type,
        "caseYear": start_year if start_signal == "structured-year" else "",
        "decisionDate": decision_date,
        "judgmentDate": decision_date,
        "uploadDate": "",
        "disposalNature": first_text(row, "disposal_nature", "outcome", "description"),
        "judges": "; ".join(judges),
        "authoringJudge": first_text(row, "author_judge", "authoring_judge"),
        "benchSize": str(len(judges)),
        "subjectTags": "; ".join(
            item
            for item in [
                "supreme court",
                "public judgment metadata",
                f"start signal: {start_signal}" if start_signal else "no start-year signal",
                "case type parsed from source case number" if raw_case_number else "case type unavailable",
            ]
            if item
        ),
        "sourceName": SOURCE_NAME,
        "sourceUrl": source_url,
        "confidence": "medium",
        "sample": "false",
        "_sourcePath": source_path,
    }


def write_csv(path: Path, records: list[dict], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)


def main() -> None:
    args = parse_args()
    if args.end_year < args.start_year:
        raise SystemExit("end year must be greater than or equal to start year")

    pd = require_pyarrow()
    records: list[dict] = []
    raw_rows_by_year: dict[str, int] = {}

    for year in range(args.start_year, args.end_year + 1):
        path = download_parquet(year)
        frame = pd.read_parquet(path)
        raw_rows_by_year[str(year)] = len(frame)
        for row in frame.to_dict(orient="records"):
            record = normalize(row)
            if record:
                records.append(record)
        print(f"OK: loaded {len(frame)} raw metadata rows for {year}")

    deduped = {record["id"]: record for record in records}
    records = sorted(deduped.values(), key=lambda item: item["judgmentDate"])
    if len(records) < args.min_records:
        raise SystemExit(
            f"Only {len(records)} usable Supreme Court records loaded; expected at least {args.min_records}."
        )

    research_csv = research_csv_path(args.start_year, args.end_year)
    write_csv(IMPORT_CSV, records, CSV_HEADERS)
    research_headers = CSV_HEADERS + ["sourcePath"]
    research_records = [{**record, "sourcePath": record.get("_sourcePath", "")} for record in records]
    write_csv(research_csv, research_records, research_headers)

    case_type_counts = Counter(record["caseType"] for record in records)
    unclassified_records = case_type_counts.get("Unclassified", 0)
    classified_records = len(records) - unclassified_records
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceName": SOURCE_NAME,
        "sourceUrl": "https://indian-supreme-court-judgments.s3.amazonaws.com/",
        "court": "Supreme Court of India",
        "records": len(records),
        "years": f"{args.start_year}-{args.end_year}",
        "researchCsv": str(research_csv.relative_to(ROOT)),
        "appCsv": str(IMPORT_CSV.relative_to(ROOT)),
        "rawRowsByYear": raw_rows_by_year,
        "caseTypeClassification": {
            "parserVersion": CASE_TYPE_PARSER_VERSION,
            "classifiedRecords": classified_records,
            "unclassifiedRecords": unclassified_records,
            "classificationRate": round(classified_records / len(records), 6),
            "counts": dict(case_type_counts.most_common()),
            "method": "Parsed from the source raw_html Case No field; explicit structured case-type fields are used when present.",
        },
        "notes": [
            "This is public judgment metadata, not a live court service.",
            "The upstream parquet schema does not expose a dedicated case-type field across the corpus; case type is parsed from the source Case No text embedded in raw_html.",
            "PDFs and tar archives are not committed to the app repository.",
            "Full judgment text should be fetched later only for targeted research questions.",
        ],
    }
    SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    PUBLIC_SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"OK: wrote {len(records)} Supreme Court records to {IMPORT_CSV}")
    print(
        f"OK: classified {classified_records}/{len(records)} records "
        f"({classified_records / len(records):.2%}); unclassified={unclassified_records}"
    )
    print(f"OK: wrote research CSV to {research_csv}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Supreme Court metadata import failed.", file=sys.stderr)
        print(exc, file=sys.stderr)
        sys.exit(1)
