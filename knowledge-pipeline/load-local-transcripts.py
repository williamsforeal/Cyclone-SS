"""
LOCAL TRANSCRIPT LOADER (v2 — Normalized Schema)
Reads .txt transcript files from a local folder → Gemini extraction → BigQuery bomb_ecom.

Bypasses the GCS/Pub/Sub/Cloud Run pipeline entirely.
Use this to seed BigQuery with your first batch of data.

Run from Cloud Shell or locally with gcloud auth:
    python3 knowledge-pipeline/load-local-transcripts.py \
        --folder ~/transcripts/discord

    python3 knowledge-pipeline/load-local-transcripts.py \
        --file ~/transcripts/product-research-call.txt --dry-run
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Add parent dir so we can import the extraction engine
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transcript_extraction_engine import (
    extract_from_transcript,
    load_to_bigquery,
    create_bigquery_tables,
)


def load_file(file_path: Path, dry_run: bool = False) -> dict:
    """Process a single transcript file → BigQuery. Returns table counts."""
    print(f"\n{'='*60}")
    print(f"  File: {file_path.name}")
    print(f"{'='*60}")

    text = file_path.read_text(encoding="utf-8", errors="ignore")
    word_count = len(text.split())
    print(f"  Words: {word_count:,}")

    if word_count < 50:
        print(f"  Skipping — too short to be a real transcript.")
        return {}

    print(f"  Extracting via Gemini (v2 normalized schema)...")
    extraction = extract_from_transcript(text, file_path.name)

    # Print extraction summary
    for key in ("products", "niches", "patterns", "psychology", "caseStudies"):
        count = len(extraction.get(key, []))
        if count > 0:
            print(f"  {key}: {count}")

    total_items = sum(len(extraction.get(k, [])) for k in ("products", "niches", "patterns", "psychology", "caseStudies"))
    if total_items == 0:
        print(f"  No items extracted — skipping BQ load.")
        return {}

    # Preview first product if available
    products = extraction.get("products", [])
    if products:
        first = products[0]
        print(f"\n  Sample product:")
        print(f"    Name:    {first.get('productName')}")
        print(f"    Niche:   {first.get('niche')}")
        print(f"    Verdict: {first.get('verdict')}")

    if dry_run:
        print(f"\n  [DRY RUN] Would load to BigQuery bomb_ecom tables.")
        print(f"  Full extraction:")
        print(json.dumps(extraction, indent=2))
        return {"dry_run": total_items}

    doc_title = file_path.stem
    counts = load_to_bigquery(
        extraction,
        doc_id=file_path.name,
        doc_title=doc_title,
        raw_text=text,
    )
    print(f"  ✓ Loaded to BigQuery bomb_ecom")
    return counts


def main():
    parser = argparse.ArgumentParser(description="Load transcripts into BigQuery bomb_ecom (v2 normalized)")
    parser.add_argument("--folder", help="Folder containing .txt transcript files")
    parser.add_argument("--file",   help="Single .txt transcript file to process")
    parser.add_argument("--dry-run", action="store_true",
                        help="Extract only — don't write to BigQuery, print JSON instead")
    parser.add_argument("--setup",  action="store_true",
                        help="Create BigQuery tables then exit (run this first)")
    args = parser.parse_args()

    # ── Setup mode: just create the tables ───────────────────────
    if args.setup:
        print("Creating BigQuery bomb_ecom tables (v2 normalized schema)...")
        create_bigquery_tables()
        print("Done. Run again without --setup to load transcripts.")
        return

    if not args.folder and not args.file:
        parser.print_help()
        sys.exit(1)

    # ── Ensure BQ tables exist ───────────────────────────────────
    print("Ensuring BigQuery tables exist...")
    create_bigquery_tables()

    # ── Collect files to process ────────────────────────────────
    files = []
    if args.file:
        files = [Path(args.file)]
    elif args.folder:
        folder = Path(args.folder)
        files = sorted([
            f for ext in ("*.txt", "*.md")
            for f in folder.glob(ext)
        ])
        if not files:
            print(f"No .txt or .md files found in {folder}")
            sys.exit(1)
        print(f"Found {len(files)} files in {folder}")

    # ── Process each file ───────────────────────────────────────
    all_counts = {}
    for f in files:
        counts = load_file(f, dry_run=args.dry_run)
        for table, n in counts.items():
            all_counts[table] = all_counts.get(table, 0) + n

    # ── Summary ─────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Files processed: {len(files)}")
    if not args.dry_run and all_counts:
        print(f"  Rows by table:")
        for table, n in sorted(all_counts.items()):
            print(f"    bomb_ecom.{table}: {n}")
        print(f"  Total rows: {sum(all_counts.values())}")
        print(f"  View: https://console.cloud.google.com/bigquery")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
