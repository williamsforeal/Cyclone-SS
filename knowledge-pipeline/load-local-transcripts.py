"""
LOCAL TRANSCRIPT LOADER
Reads .txt transcript files from a local folder → Gemini extraction → BigQuery.

Bypasses the GCS/Pub/Sub/Cloud Run pipeline entirely.
Use this to seed BigQuery with your first batch of data.

Run from Cloud Shell:
    python3 load-local-transcripts.py --folder ./transcripts

Or point it at a specific file:
    python3 load-local-transcripts.py --file my-call.txt
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Add parent dir so we can import the extraction engine
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transcript_extraction_engine import (
    extract_insights_from_transcript,
    load_to_bigquery,
    create_bigquery_table
)


def load_file(file_path: Path, dry_run: bool = False):
    """Process a single transcript file → BigQuery."""
    print(f"\n{'='*60}")
    print(f"  File: {file_path.name}")
    print(f"{'='*60}")

    text = file_path.read_text(encoding="utf-8", errors="ignore")
    word_count = len(text.split())
    print(f"  Words: {word_count:,}")

    if word_count < 50:
        print(f"  Skipping — too short to be a real transcript.")
        return 0

    print(f"  Extracting insights via Gemini...")
    insights = extract_insights_from_transcript(text, file_path.name)
    print(f"  Extracted: {len(insights)} insights")

    if not insights:
        print(f"  No insights found — skipping BQ load.")
        return 0

    # Preview first insight
    print(f"\n  Sample insight:")
    first = insights[0]
    print(f"    Category:    {first.get('category')}")
    print(f"    Confidence:  {first.get('confidence')}")
    print(f"    Text:        {first.get('insight_text', '')[:100]}...")

    if dry_run:
        print(f"\n  [DRY RUN] Would load {len(insights)} rows to BigQuery.")
        print(f"  Full output:")
        print(json.dumps(insights, indent=2))
        return len(insights)

    rows_loaded = load_to_bigquery(insights, source_filename=file_path.name)
    print(f"  ✓ Loaded {rows_loaded} rows to BigQuery")
    return rows_loaded


def main():
    parser = argparse.ArgumentParser(description="Load transcripts into BigQuery")
    parser.add_argument("--folder", help="Folder containing .txt transcript files")
    parser.add_argument("--file",   help="Single .txt transcript file to process")
    parser.add_argument("--dry-run", action="store_true",
                        help="Extract only — don't write to BigQuery, print JSON instead")
    parser.add_argument("--setup",  action="store_true",
                        help="Create BigQuery table then exit (run this first)")
    args = parser.parse_args()

    # ── Setup mode: just create the table ───────────────────────
    if args.setup:
        print("Creating BigQuery table...")
        create_bigquery_table()
        print("Done. Run again without --setup to load transcripts.")
        return

    if not args.folder and not args.file:
        parser.print_help()
        sys.exit(1)

    # ── Ensure BQ table exists ───────────────────────────────────
    print("Ensuring BigQuery table exists...")
    create_bigquery_table()

    # ── Collect files to process ────────────────────────────────
    files = []
    if args.file:
        files = [Path(args.file)]
    elif args.folder:
        folder = Path(args.folder)
        files = sorted(folder.glob("*.txt"))
        if not files:
            print(f"No .txt files found in {folder}")
            sys.exit(1)
        print(f"Found {len(files)} transcript files in {folder}")

    # ── Process each file ───────────────────────────────────────
    total_insights = 0
    for f in files:
        count = load_file(f, dry_run=args.dry_run)
        total_insights += count

    # ── Summary ─────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Files processed: {len(files)}")
    print(f"  Total insights:  {total_insights}")
    if not args.dry_run:
        print(f"  BigQuery table:  ecom_os.coaching_insights")
        print(f"  View in console: https://console.cloud.google.com/bigquery")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
