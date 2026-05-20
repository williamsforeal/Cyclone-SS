"""
METRICS INGESTION (No AI — pure JSON parsing)
Processes KaloData and SimilarWeb Apify exports → BigQuery bomb_ecom.scrape_product_metrics.

These scrapers return structured numeric data (revenue, traffic, etc.)
that doesn't need Gemini analysis — just field mapping and insert.
"""

import hashlib
import json
import os
from datetime import datetime
from google.cloud import bigquery, storage

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "gen-lang-client-0234791928")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
DATASET_ID = "bomb_ecom"
BUCKET_NAME = os.environ.get("GCS_BUCKET", "jake-ecom-knowledge")

bq_client = bigquery.Client(project=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


def _hash_id(*parts: str) -> str:
    combined = "|".join(str(p).lower().strip() for p in parts)
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]


def _extract_candidate_id(file_name: str) -> int | None:
    import re
    match = re.search(r'candidate[_-](\d+)', file_name)
    return int(match.group(1)) if match else None


def _insert(table_name: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
    errors = bq_client.insert_rows_json(table_ref, rows)
    if errors:
        print(f"BQ errors for {table_name}: {errors}")
        raise Exception(f"Failed to insert into {table_name}: {errors}")
    return len(rows)


# ════════════════════════════════════════════════════════════════
# KALODATA (TikTok product metrics)
# ════════════════════════════════════════════════════════════════

def process_kalodata(event: dict) -> dict:
    """
    GCS event for kalodata-exports/*.json
    KaloData returns TikTok product data: revenue, orders, growth, AOV, etc.
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    if not file_name.endswith(".json"):
        return {"status": "skipped"}

    print(f"[kalodata] Processing: {file_name}")

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    raw_json = blob.download_as_text()
    items = json.loads(raw_json)

    if not isinstance(items, list):
        items = [items]

    candidate_id = _extract_candidate_id(file_name)
    run_id = file_name.split("/")[-1].replace(".json", "")
    now = datetime.now().isoformat()

    rows = []
    for item in items:
        rows.append({
            "id": _hash_id(str(candidate_id), "kalodata", now),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "kalodata",
            "product_name": item.get("productName") or item.get("name") or item.get("title"),
            "product_url": item.get("productUrl") or item.get("url"),

            # Revenue & orders
            "revenue_7d": _float(item.get("revenue7d") or item.get("revenue_7d")),
            "revenue_30d": _float(item.get("revenue30d") or item.get("revenue_30d")),
            "revenue_90d": _float(item.get("revenue90d") or item.get("revenue_90d")),
            "orders_7d": _int(item.get("orders7d") or item.get("orders_7d")),
            "orders_30d": _int(item.get("orders30d") or item.get("orders_30d")),
            "growth_rev_7d_pct": _float(item.get("growthRev7dPct") or item.get("growth_rev_7d_pct") or item.get("revenueGrowth")),
            "aov": _float(item.get("aov") or item.get("averageOrderValue")),
            "launch_age_days": _int(item.get("launchAgeDays") or item.get("launch_age_days") or item.get("daysOnMarket")),
            "seller_count": _int(item.get("sellerCount") or item.get("sellers")),
            "video_count": _int(item.get("videoCount") or item.get("videos")),

            "raw_json": json.dumps(item),
            "scraped_at": now,
        })

    count = _insert("scrape_product_metrics", rows)

    # Move to processed
    processed_path = file_name.replace("kalodata-exports/", "kalodata-exports/processed/")
    bucket.rename_blob(blob, processed_path)

    print(f"[kalodata] Loaded {count} rows to scrape_product_metrics")
    return {"pipeline": "kalodata", "file": file_name, "items": len(items), "rows": count}


# ════════════════════════════════════════════════════════════════
# SIMILARWEB (Traffic validation)
# ════════════════════════════════════════════════════════════════

def process_similarweb(event: dict) -> dict:
    """
    GCS event for similarweb-exports/*.json
    SimilarWeb returns traffic data: monthly visits, countries, channels, etc.
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    if not file_name.endswith(".json"):
        return {"status": "skipped"}

    print(f"[similarweb] Processing: {file_name}")

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    raw_json = blob.download_as_text()
    items = json.loads(raw_json)

    if not isinstance(items, list):
        items = [items]

    candidate_id = _extract_candidate_id(file_name)
    run_id = file_name.split("/")[-1].replace(".json", "")
    now = datetime.now().isoformat()

    rows = []
    for item in items:
        # SimilarWeb field names vary by actor — handle common variants
        top_countries = item.get("topCountries") or item.get("top_countries") or []
        if isinstance(top_countries, list) and top_countries and isinstance(top_countries[0], dict):
            top_countries = [c.get("country") or c.get("name", "") for c in top_countries]

        channels = item.get("trafficSources") or item.get("traffic_channels") or item.get("channels")
        if isinstance(channels, dict):
            channels = json.dumps(channels)
        elif channels is None:
            channels = None

        rows.append({
            "id": _hash_id(str(candidate_id), "similarweb", now),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "similarweb",
            "product_name": item.get("siteName") or item.get("domain") or item.get("name"),
            "product_url": item.get("url") or item.get("domain"),

            "monthly_visits": _int(item.get("monthlyVisits") or item.get("monthly_visits") or item.get("totalVisits")),
            "top_countries": top_countries if isinstance(top_countries, list) else [],
            "traffic_channels": channels,
            "bounce_rate": _float(item.get("bounceRate") or item.get("bounce_rate")),
            "avg_visit_duration": _float(item.get("avgVisitDuration") or item.get("avg_visit_duration")),

            "raw_json": json.dumps(item),
            "scraped_at": now,
        })

    count = _insert("scrape_product_metrics", rows)

    processed_path = file_name.replace("similarweb-exports/", "similarweb-exports/processed/")
    bucket.rename_blob(blob, processed_path)

    print(f"[similarweb] Loaded {count} rows to scrape_product_metrics")
    return {"pipeline": "similarweb", "file": file_name, "items": len(items), "rows": count}


# ════════════════════════════════════════════════════════════════
# TYPE HELPERS (scrape data is messy — handle None/string gracefully)
# ════════════════════════════════════════════════════════════════

def _float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _int(val) -> int | None:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None
