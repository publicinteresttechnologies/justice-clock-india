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
from datetime import datetime, timezone
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
    if "CRIMINAL APPEAL" in text:
        return "Criminal Appeal"
    if "CIVIL APPEAL" in text:
        return "Civil Appeal"
    if "SLP" in text and "CRIMINAL" in text:
        return "SLP Criminal"
    if "SLP" in text:
        return "SLP Civil"
    if "WRIT" in text:
        return "Writ Petition"
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


def normalize(row: dict) -> dict | None:
    title = first_text(row, "title", "case_title", "caseTitle", "name")
    case_id = first_text(row, "case_id", "id", "path")
    case_number = first_text(row, "case_number", "case_no", "caseNumber", "citation")
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

    source_path = first_text(row, "path", "source_path")
    source_url = first_text(row, "metadata_url", "source_url") or SOURCE_URL.format(
        year=decision_date[:4]
    )

    return {
        "id": f"sc-meta-{case_id or re.sub(r'[^A-Za-z0-9]+', '-', title)[:80]}",
        "caseTitle": title,
        "caseNumber": case_number,
        "diaryNumber": first_text(row, "diary_number", "diary_no", "cnr"),
        "diaryYear": start_year if start_signal in {"date", "diary-number"} else "",
        "caseType": explicit_case_type or infer_case_type(case_number, title),
        "caseYear": start_year if start_signal == "structured-year" else "",
        "decisionDate": decision_date,
        "judgmentDate": decision_date,
        "uploadDate": "",
        "disposalNature": first_text(row, "disposal_nature", "outcome"),
        "judges": "; ".join(judges),
        "authoringJudge": first_text(row, "author_judge", "authoring_judge"),
        "benchSize": str(len(judges)),
        "subjectTags": "; ".join(
            item
            for item in [
                "supreme court",
                "public judgment metadata",
                f"start signal: {start_signal}" if start_signal else "no start-year signal",
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
        "notes": [
            "This is public judgment metadata, not a live court service.",
            "PDFs and tar archives are not committed to the app repository.",
            "Full judgment text should be fetched later only for targeted research questions.",
        ],
    }
    SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    PUBLIC_SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"OK: wrote {len(records)} Supreme Court records to {IMPORT_CSV}")
    print(f"OK: wrote research CSV to {research_csv}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Supreme Court metadata import failed.", file=sys.stderr)
        print(exc, file=sys.stderr)
        sys.exit(1)
