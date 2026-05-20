"""
CLOUD RUN ENTRY POINT (v2 — Multi-Pipeline Router)
Receives Pub/Sub push notifications when files land in GCS,
then routes to the correct processing engine based on folder prefix.

ROUTING:
  coaching-transcripts/*.txt  → Gemini transcript extraction → bomb_ecom.stg_transcript_*
  reddit-scrapes/*.json       → Gemini pain point analysis   → bomb_ecom.scrape_pain_points + phrases + objections
  amazon-scrapes/*.json       → Gemini review analysis       → bomb_ecom.scrape_pain_points + desired_outcomes + motivations
  kalodata-exports/*.json     → JSON parse (no AI)           → bomb_ecom.scrape_product_metrics
  similarweb-exports/*.json   → JSON parse (no AI)           → bomb_ecom.scrape_product_metrics
"""

import base64
import json
import logging
import os

from flask import Flask, request
from transcript_extraction_engine import process_gcs_event as process_transcript
from scrape_extraction_engine import process_reddit_scrape, process_amazon_scrape
from metrics_ingestion import process_kalodata, process_similarweb

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Folder prefix → handler mapping
ROUTE_MAP = {
    "coaching-transcripts/": ("transcript", process_transcript),
    "reddit-scrapes/":       ("reddit",     process_reddit_scrape),
    "amazon-scrapes/":       ("amazon",     process_amazon_scrape),
    "kalodata-exports/":     ("kalodata",   process_kalodata),
    "similarweb-exports/":   ("similarweb", process_similarweb),
}


@app.route("/", methods=["POST"])
def handle_pubsub():
    """
    Receives Pub/Sub push message → extracts GCS event → routes to correct engine.
    Must return 2xx for Pub/Sub to consider the message acknowledged.
    """
    envelope = request.get_json(silent=True)

    if not envelope:
        logger.error("No JSON body received")
        return "Bad request: missing body", 400

    if "message" not in envelope:
        logger.error("Not a valid Pub/Sub envelope")
        return "Bad request: no Pub/Sub message field", 400

    pubsub_message = envelope["message"]

    # Decode the base64-encoded GCS notification
    try:
        data_bytes = base64.b64decode(pubsub_message.get("data", ""))
        gcs_event = json.loads(data_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to decode Pub/Sub data: {e}")
        return "Bad request: could not decode message data", 400

    file_name = gcs_event.get("name", "")
    bucket_name = gcs_event.get("bucket", "")
    logger.info(f"GCS event: bucket={bucket_name}, file={file_name}")

    # Only act on OBJECT_FINALIZE events
    event_type = pubsub_message.get("attributes", {}).get("eventType", "")
    if event_type and event_type != "OBJECT_FINALIZE":
        logger.info(f"Ignoring event type: {event_type}")
        return "Ignored", 200

    # Skip hidden files and processed/ subfolder
    if "/processed/" in file_name or file_name.endswith("/.keep"):
        logger.info(f"Skipping: {file_name}")
        return "Skipped", 200

    # Route based on folder prefix
    handler = None
    pipeline_name = None
    for prefix, (name, fn) in ROUTE_MAP.items():
        if file_name.startswith(prefix):
            pipeline_name = name
            handler = fn
            break

    if not handler:
        logger.info(f"No handler for path: {file_name}")
        return json.dumps({"status": "skipped", "reason": "no matching pipeline"}), 200

    logger.info(f"Routing to [{pipeline_name}] pipeline: {file_name}")

    try:
        result = handler(gcs_event)
        logger.info(f"[{pipeline_name}] complete: {result}")
        return json.dumps(result or {"status": "done"}), 200

    except Exception as e:
        logger.error(f"[{pipeline_name}] failed: {e}", exc_info=True)
        return f"Processing error: {str(e)}", 500


@app.route("/health", methods=["GET"])
def health():
    """Health check for Cloud Run."""
    return "OK", 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
