#!/bin/bash
# =============================================================================
# Stop the ComfyUI GPU VM to save money
# Usage: bash scripts/comfyui/stop-vm.sh
# =============================================================================
set -euo pipefail

VM_NAME="comfyui-gpu"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"

echo "=== Stopping ComfyUI VM ==="
gcloud compute instances stop "$VM_NAME" --zone="$ZONE" --project="$PROJECT"
echo "VM stopped. No GPU charges while stopped."
echo "Disk storage still incurs ~$0.17/day for 100GB SSD."
echo ""
echo "To restart: bash scripts/comfyui/create-vm.sh"
