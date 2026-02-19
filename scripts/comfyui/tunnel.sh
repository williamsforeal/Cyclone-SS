#!/bin/bash
# =============================================================================
# SSH tunnel to ComfyUI on GCE VM
# Forwards localhost:8188 → VM:8188 (ComfyUI UI)
# Usage: bash scripts/comfyui/tunnel.sh
# Then open: http://localhost:8188
# =============================================================================
set -euo pipefail

VM_NAME="comfyui-gpu"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"

echo "=== Opening SSH tunnel to ComfyUI ==="
echo "  Local:  http://localhost:8188"
echo "  VM:     $VM_NAME ($ZONE)"
echo ""
echo "Press Ctrl+C to close the tunnel."
echo ""

gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  -- -L 8188:localhost:8188 -N
