"""
CLOUD RUN ENTRY POINT
Receives Pub/Sub push notifications when files land in GCS,
then hands off to the transcript extraction engine.

Pub/Sub push envelope format:
{
  "message": {
    "data": "<base64-encoded GCS notification JSON>",
    "messageId": "...",
    "publishTime": "..."
  },
  "subscription": "projects/.../subscriptions/..."
}

GCS notification (decoded from data field):
{
  "bucket": "jake-ecom-knowledge",
  "name": "coaching-transcripts/my-call.txt",
  ...
}
"""

import base64
import json
import logging
import os

from flask import Flask, request
from transcript_extraction_engine import process_gcs_event

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route("/", methods=["POST"])
def handle_pubsub():
    """
    Receives Pub/Sub push message → extracts GCS event → processes transcript.
    Must return 2xx for Pub/Sub to consider the message acknowledged.
    Returning 4xx/5xx causes Pub/Sub to retry (with exponential backoff).
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
    logger.info(f"Received GCS event: bucket={bucket_name}, file={file_name}")

    # Only act on OBJECT_FINALIZE events (new file created/overwritten)
    # GCS notifies on all events if not filtered at the Pub/Sub level
    event_type = pubsub_message.get("attributes", {}).get("eventType", "")
    if event_type and event_type != "OBJECT_FINALIZE":
        logger.info(f"Ignoring event type: {event_type}")
        return "Ignored", 200

    try:
        result = process_gcs_event(gcs_event)
        logger.info(f"Processing complete: {result}")
        return json.dumps(result or {"status": "skipped"}), 200

    except Exception as e:
        logger.error(f"Processing failed: {e}", exc_info=True)
        # Return 500 so Pub/Sub retries the message
        return f"Processing error: {str(e)}", 500


@app.route("/health", methods=["GET"])
def health():
    """Health check for Cloud Run."""
    return "OK", 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
