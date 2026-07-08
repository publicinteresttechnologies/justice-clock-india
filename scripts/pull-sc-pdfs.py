#!/usr/bin/env python3
"""Pull Supreme Court judgment PDFs from the public S3 corpus.

This script downloads PDFs into ignored raw storage and writes a manifest. It is
not intended to run during app builds and it must not commit PDF binaries to git.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "research" / "sc-judgments-1950-2024.csv"
DEFAULT_OUTPUT_DIR = ROOT / "data" / "raw" / "sc-pdfs"
DEFAULT_MANIFEST = ROOT / "data" / "research" / "sc-pdf-manifest.jsonl"
SOURCE_BASE = "https://indian-supreme-court-judgments.s3.amazonaws.com/"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--start-year", type=int, default=None)
    parser.add_argument("--end-year", type=int, default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--sleep", type=float, default=0.15)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument(
        "--require-pdf-url",
        action="store_true",
        help="Skip rows where a PDF URL cannot be derived from sourcePath.",
    )
    return parser.parse_args()


def safe_filename(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-")
    return value[:180] or "judgment"


def year_from_row(row: dict[str, str]) -> int | None:
    for key in ("decisionDate", "judgmentDate", "caseYear"):
        value = row.get(key, "")
        match = re.search(r"\b(19[5-9]\d|20\d{2})\b", value)
        if match:
            return int(match.group(1))
    return None


def derive_pdf_url(row: dict[str, str]) -> str:
    source_url = row.get("sourceUrl", "").strip()
    if source_url.lower().endswith(".pdf"):
        return source_url

    source_path = row.get("sourcePath", "").strip()
    year = year_from_row(row)
    if source_path and year:
        filename = Path(source_path).name
        if filename.lower().endswith(".pdf"):
            return f"{SOURCE_BASE}data/pdf/year={year}/english/{quote(filename)}"

    return ""


def load_rows(path: Path, start_year: int | None, end_year: int | None) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input CSV not found: {path}")

    rows: list[dict[str, str]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            year = year_from_row(row)
            if start_year is not None and (year is None or year < start_year):
                continue
            if end_year is not None and (year is None or year > end_year):
                continue
            rows.append(row)
    return rows


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, dest: Path, overwrite: bool) -> tuple[str, int, str]:
    if dest.exists() and not overwrite:
        return "exists", dest.stat().st_size, sha256_file(dest)

    dest.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": "justice-clock-india/0.1 research importer"})
    with urlopen(request, timeout=90) as response:
        content_type = response.headers.get("content-type", "")
        data = response.read()

    if not data.startswith(b"%PDF"):
        # Some S3 objects may not report content type reliably. The magic bytes are safer.
        raise RuntimeError(f"Downloaded file is not a PDF: content-type={content_type}")

    dest.write_bytes(data)
    return "downloaded", len(data), sha256_file(dest)


def main() -> None:
    args = parse_args()
    rows = load_rows(args.input, args.start_year, args.end_year)
    if args.limit is not None:
        rows = rows[: args.limit]

    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    pulled = 0
    skipped = 0
    failed = 0

    with args.manifest.open("a", encoding="utf-8") as manifest:
        for index, row in enumerate(rows, start=1):
            year = year_from_row(row)
            pdf_url = derive_pdf_url(row)
            case_id = row.get("id") or row.get("caseNumber") or str(index)
            title = row.get("caseTitle", "")

            if not pdf_url:
                skipped += 1
                entry = {
                    "status": "skipped_no_pdf_url",
                    "caseId": case_id,
                    "title": title,
                    "year": year,
                    "checkedAt": datetime.now(timezone.utc).isoformat(),
                }
                manifest.write(json.dumps(entry, ensure_ascii=False) + "\n")
                if args.require_pdf_url:
                    continue
                continue

            filename = safe_filename(f"{case_id}.pdf")
            dest = args.output_dir / f"year={year or 'unknown'}" / filename

            try:
                status, size, digest = download(pdf_url, dest, args.overwrite)
                pulled += 1
                entry = {
                    "status": status,
                    "caseId": case_id,
                    "title": title,
                    "year": year,
                    "pdfUrl": pdf_url,
                    "localPath": str(dest.relative_to(ROOT)),
                    "bytes": size,
                    "sha256": digest,
                    "checkedAt": datetime.now(timezone.utc).isoformat(),
                }
            except (HTTPError, URLError, TimeoutError, RuntimeError) as exc:
                failed += 1
                entry = {
                    "status": "failed",
                    "caseId": case_id,
                    "title": title,
                    "year": year,
                    "pdfUrl": pdf_url,
                    "error": str(exc),
                    "checkedAt": datetime.now(timezone.utc).isoformat(),
                }

            manifest.write(json.dumps(entry, ensure_ascii=False) + "\n")
            manifest.flush()

            if index % 100 == 0:
                print(f"Processed {index}/{len(rows)} rows; pulled={pulled}; skipped={skipped}; failed={failed}")
            if args.sleep:
                time.sleep(args.sleep)

    print(f"Done. rows={len(rows)} pulled={pulled} skipped={skipped} failed={failed}")
    print(f"PDFs: {args.output_dir}")
    print(f"Manifest: {args.manifest}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Supreme Court PDF pull failed.", file=sys.stderr)
        print(exc, file=sys.stderr)
        sys.exit(1)
