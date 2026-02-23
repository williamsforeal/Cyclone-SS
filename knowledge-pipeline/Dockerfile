# ── Build stage ─────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run sets PORT env var (default 8080).
# Gunicorn config:
#   --workers 1        Single worker (CPU-bound work is in Gemini API, not here)
#   --threads 8        Allow concurrent requests within the worker
#   --timeout 600      Long timeout: large transcripts + Gemini latency can take minutes
#   --preload          Load app before forking (catches import errors at startup)
ENV PORT=8080
EXPOSE 8080

CMD ["gunicorn", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "1", \
     "--threads", "8", \
     "--timeout", "600", \
     "--preload", \
     "main:app"]
