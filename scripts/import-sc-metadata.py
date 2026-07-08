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
RESEARCH_CSV = ROOT / "data" / "research" / "sc-judgments-2000-2024.csv"
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
    parser.add_argument("--from-year", type=int, default=2000)
    parser.add_argument("--to-year", type=int, default=2024)
    parser.add_argument("--min-records", type=int, default=1000)
    return parser.parse_args()


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


def infer_case_type(case_number: str) -> str:
    text = case_number.upper()
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
    return "Supreme Court judgment"


def normalize(row: dict) -> dict | None:
    title = first_text(row, "title", "case_title", "caseTitle", "name")
    case_id = first_text(row, "case_id", "id", "path")
    case_number = first_text(row, "case_number", "case_no", "caseNumber", "citation")
    decision_date = date_text(first_text(row, "decision_date", "judgment_date", "date"))
    judges_text = first_text(row, "judges", "judge", "coram", "bench")
    judges = split_judges(judges_text)

    if not title or not decision_date or not judges:
        return None

    case_year = first_text(row, "year", "case_year")
    if not case_year:
        case_year = re.search(r"\b(19[5-9]\d|20\d{2})\b", case_number or title)
        case_year = case_year.group(1) if case_year else decision_date[:4]

    source_path = first_text(row, "path", "source_path")
    source_url = first_text(row, "metadata_url", "source_url") or SOURCE_URL.format(
        year=decision_date[:4]
    )

    return {
        "id": f"sc-meta-{case_id or re.sub(r'[^A-Za-z0-9]+', '-', title)[:80]}",
        "caseTitle": title,
        "caseNumber": case_number,
        "diaryNumber": first_text(row, "cnr", "diary_number"),
        "diaryYear": "",
        "caseType": infer_case_type(case_number),
        "caseYear": case_year,
        "decisionDate": decision_date,
        "judgmentDate": decision_date,
        "uploadDate": "",
        "disposalNature": first_text(row, "disposal_nature", "outcome"),
        "judges": "; ".join(judges),
        "authoringJudge": first_text(row, "author_judge", "authoring_judge"),
        "benchSize": str(len(judges)),
        "subjectTags": "supreme court; public judgment metadata",
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
    pd = require_pyarrow()
    records: list[dict] = []

    for year in range(args.from_year, args.to_year + 1):
        path = download_parquet(year)
        frame = pd.read_parquet(path)
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

    write_csv(IMPORT_CSV, records, CSV_HEADERS)
    research_headers = CSV_HEADERS + ["sourcePath"]
    research_records = [{**record, "sourcePath": record.get("_sourcePath", "")} for record in records]
    write_csv(RESEARCH_CSV, research_records, research_headers)

    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceName": SOURCE_NAME,
        "sourceUrl": "https://indian-supreme-court-judgments.s3.amazonaws.com/",
        "court": "Supreme Court of India",
        "records": len(records),
        "years": f"{args.from_year}-{args.to_year}",
        "notes": [
            "This is public judgment metadata, not a live court service.",
            "PDFs and tar archives are not committed to the app repository.",
        ],
    }
    SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    PUBLIC_SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"OK: wrote {len(records)} Supreme Court records to {IMPORT_CSV}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Supreme Court metadata import failed.", file=sys.stderr)
        print(exc, file=sys.stderr)
        sys.exit(1)
