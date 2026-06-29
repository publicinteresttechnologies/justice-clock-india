#!/usr/bin/env python3
"""Import Supreme Court of India judgment metadata from the public AWS Open Data corpus.

This imports metadata, not the full PDF archive. The PDF/tar paths are preserved so
research questions can fetch full judgments on demand without committing tens of GB
of binaries to the app repository.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import pandas as pd

BUCKET = "indian-supreme-court-judgments"
BASE_URL = f"https://{BUCKET}.s3.amazonaws.com"
SOURCE_REPO = "https://github.com/vanga/indian-supreme-court-judgments"
SOURCE_REGISTRY = "https://registry.opendata.aws/indian-supreme-court-judgments/"

APP_COLUMNS = [
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

RESEARCH_COLUMNS = [
    "source_year",
    "case_id",
    "title",
    "petitioner",
    "respondent",
    "description",
    "judge",
    "author_judge",
    "citation",
    "cnr",
    "decision_date",
    "disposal_nature",
    "court",
    "available_languages",
    "nc_display",
    "path",
    "raw_html_present",
    "scraped_at",
    "metadata_parquet_url",
    "metadata_json_prefix_url",
    "english_pdf_url",
    "english_tar_prefix_url",
    "regional_pdf_prefix_url",
]


def text(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except TypeError:
        pass
    if isinstance(value, (list, tuple, set)):
        return "; ".join(text(item) for item in value if text(item))
    return str(value).strip()


def date_only(value: Any) -> str:
    raw = text(value)
    if not raw:
        return ""
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", raw)
    if match:
        return match.group(1)
    parsed = pd.to_datetime(raw, errors="coerce")
    if pd.isna(parsed):
        return ""
    return parsed.strftime("%Y-%m-%d")


def year_from(value: Any) -> str:
    match = re.search(r"\b(19[5-9]\d|20\d{2})\b", text(value))
    return match.group(1) if match else ""


def slug(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").lower()
    return cleaned[:120] or "unknown"


def bench_size(judges: str) -> str:
    if not judges:
        return ""
    pieces = [part.strip() for part in re.split(r"[;|,]", judges) if part.strip()]
    return str(len(pieces)) if pieces else ""


def parquet_url(year: int) -> str:
    return f"{BASE_URL}/metadata/parquet/year={year}/metadata.parquet"


def metadata_json_prefix_url(year: int) -> str:
    return f"{BASE_URL}/metadata/json/year={year}/"


def english_tar_prefix_url(year: int) -> str:
    return f"{BASE_URL}/data/tar/year={year}/english/"


def regional_pdf_prefix_url(year: int) -> str:
    return f"{BASE_URL}/data/pdf/year={year}/regional/"


def english_pdf_url(year: int, pdf_path: str) -> str:
    path = text(pdf_path)
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    filename = Path(path).name
    if not filename.lower().endswith(".pdf"):
        return ""
    return f"{BASE_URL}/data/pdf/year={year}/english/{filename}"


def read_parquet_year(year: int) -> pd.DataFrame:
    url = parquet_url(year)
    request = Request(url, headers={"User-Agent": "justice-clock-india-data-import/1.0"})
    with urlopen(request, timeout=120) as response:
        payload = response.read()
    frame = pd.read_parquet(io.BytesIO(payload))
    frame["_source_year"] = year
    frame["_metadata_parquet_url"] = url
    return frame


def row_value(row: pd.Series, *names: str) -> str:
    for name in names:
        if name in row:
            value = text(row[name])
            if value:
                return value
    return ""


def to_research_row(row: pd.Series, year: int) -> dict[str, str]:
    pdf_path = row_value(row, "path")
    return {
        "source_year": str(year),
        "case_id": row_value(row, "case_id"),
        "title": row_value(row, "title"),
        "petitioner": row_value(row, "petitioner"),
        "respondent": row_value(row, "respondent"),
        "description": row_value(row, "description"),
        "judge": row_value(row, "judge"),
        "author_judge": row_value(row, "author_judge"),
        "citation": row_value(row, "citation"),
        "cnr": row_value(row, "cnr"),
        "decision_date": date_only(row_value(row, "decision_date")),
        "disposal_nature": row_value(row, "disposal_nature"),
        "court": row_value(row, "court"),
        "available_languages": row_value(row, "available_languages"),
        "nc_display": row_value(row, "nc_display"),
        "path": pdf_path,
        "raw_html_present": "true" if row_value(row, "raw_html") else "false",
        "scraped_at": row_value(row, "scraped_at"),
        "metadata_parquet_url": parquet_url(year),
        "metadata_json_prefix_url": metadata_json_prefix_url(year),
        "english_pdf_url": english_pdf_url(year, pdf_path),
        "english_tar_prefix_url": english_tar_prefix_url(year),
        "regional_pdf_prefix_url": regional_pdf_prefix_url(year),
    }


def to_app_row(research_row: dict[str, str], sequence: int) -> dict[str, str]:
    decision_date = research_row["decision_date"]
    case_id = research_row["case_id"] or research_row["cnr"] or f"{research_row['source_year']}-{sequence}"
    title = research_row["title"] or "Untitled Supreme Court judgment"
    citation = research_row["citation"] or research_row["nc_display"]
    year = research_row["source_year"] or year_from(decision_date) or year_from(title)
    tags = ["supreme court", "judgment corpus", "aws open data", "2000-2024"]
    if citation:
        tags.append(citation)
    if research_row["available_languages"]:
        tags.append(f"languages: {research_row['available_languages']}")

    return {
        "id": f"sc-corpus-{slug(case_id)}",
        "caseTitle": title,
        "caseNumber": citation or case_id,
        "diaryNumber": research_row["cnr"],
        "diaryYear": year_from(research_row["cnr"]),
        "caseType": "Supreme Court judgment",
        "caseYear": year,
        "decisionDate": decision_date,
        "judgmentDate": decision_date,
        "uploadDate": "",
        "disposalNature": research_row["disposal_nature"],
        "judges": research_row["judge"],
        "authoringJudge": research_row["author_judge"],
        "benchSize": bench_size(research_row["judge"]),
        "subjectTags": "; ".join(tags),
        "sourceName": "Indian Supreme Court Judgments corpus / AWS Open Data",
        "sourceUrl": research_row["english_pdf_url"] or SOURCE_REGISTRY,
        "confidence": "medium-high",
        "sample": "false",
    }


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-year", type=int, default=2000)
    parser.add_argument("--end-year", type=int, default=2024)
    parser.add_argument("--fail-under", type=int, default=10000)
    args = parser.parse_args()

    years = list(range(args.start_year, args.end_year + 1))
    frames: list[pd.DataFrame] = []
    failed: dict[str, str] = {}

    for year in years:
        try:
            frame = read_parquet_year(year)
            frames.append(frame)
            print(f"OK: loaded {year}: {len(frame)} metadata records")
        except (HTTPError, URLError, TimeoutError, Exception) as exc:
            failed[str(year)] = str(exc)
            print(f"WARN: failed {year}: {exc}", file=sys.stderr)

    if not frames:
        raise SystemExit("No Supreme Court metadata parquet files loaded.")

    research_rows: list[dict[str, str]] = []
    app_rows: list[dict[str, str]] = []
    year_counts: dict[str, int] = {}
    disposal_counts: dict[str, int] = {}

    sequence = 0
    for frame in frames:
        year = int(frame["_source_year"].iloc[0])
        year_count = 0
        for _, row in frame.iterrows():
            research = to_research_row(row, year)
            if not research["title"] or not research["decision_date"]:
                continue
            sequence += 1
            year_count += 1
            research_rows.append(research)
            app_rows.append(to_app_row(research, sequence))
            disposal = research["disposal_nature"] or "missing"
            disposal_counts[disposal] = disposal_counts.get(disposal, 0) + 1
        year_counts[str(year)] = year_count

    if len(app_rows) < args.fail_under:
        raise SystemExit(f"Expected at least {args.fail_under} usable records, found {len(app_rows)}.")

    write_csv(Path("data/imports/judgments.csv"), APP_COLUMNS, app_rows)
    write_csv(Path("data/research/sc-judgments-2000-2024.csv"), RESEARCH_COLUMNS, research_rows)

    summary = {
        "name": "Supreme Court of India judgment metadata corpus",
        "source": {
            "name": "Indian Supreme Court Judgments corpus / AWS Open Data",
            "repository": SOURCE_REPO,
            "registry": SOURCE_REGISTRY,
            "bucket": f"s3://{BUCKET}/",
            "baseHttpsUrl": BASE_URL,
            "license": "CC BY 4.0 according to source repository README",
        },
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "coverage": {
            "startYear": args.start_year,
            "endYear": args.end_year,
            "requestedYears": years,
            "failedYears": failed,
        },
        "counts": {
            "usableRecords": len(app_rows),
            "researchRows": len(research_rows),
            "yearsLoaded": len(year_counts),
            "byYear": year_counts,
            "topDisposalNatures": sorted(
                disposal_counts.items(), key=lambda item: item[1], reverse=True
            )[:50],
        },
        "files": {
            "appImportCsv": "data/imports/judgments.csv",
            "researchCsv": "data/research/sc-judgments-2000-2024.csv",
        },
        "notes": [
            "This import stores metadata and source links only; it does not commit the PDF/tar archives.",
            "Full judgment PDFs remain accessible from the public S3 corpus using the preserved path and year fields.",
            "Use the research CSV for original research extraction and the app CSV for the existing site schema.",
        ],
    }

    Path("data/research").mkdir(parents=True, exist_ok=True)
    Path("public/data").mkdir(parents=True, exist_ok=True)
    Path("data/research/sc-corpus-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    Path("public/data/sc-corpus-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"OK: wrote {len(app_rows)} app judgment records to data/imports/judgments.csv")
    print(f"OK: wrote {len(research_rows)} research rows to data/research/sc-judgments-2000-2024.csv")
    print("OK: wrote corpus summary to data/research/sc-corpus-summary.json and public/data/sc-corpus-summary.json")


if __name__ == "__main__":
    main()
