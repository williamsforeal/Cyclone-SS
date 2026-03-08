#!/bin/bash
# =============================================================================
# Check ComfyUI VM status
# Usage: bash scripts/comfyui/status.sh
# =============================================================================
set -euo pipefail

VM_NAME="comfyui-gpu"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"

echo "=== ComfyUI VM Status ==="
gcloud compute instances describe "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --format="table(name,status,networkInterfaces[0].accessConfigs[0].natIP,machineType.basename(),guestAccelerators[0].acceleratorType.basename())" 2>/dev/null || echo "VM not found. Create it with: bash scripts/comfyui/create-vm.sh"

echo ""
echo "=== Quick Commands ==="
echo "  Create/Start:  bash scripts/comfyui/create-vm.sh"
echo "  SSH Tunnel:    bash scripts/comfyui/tunnel.sh"
echo "  Stop (save $): bash scripts/comfyui/stop-vm.sh"
echo "  Download Flux: bash scripts/comfyui/download-models.sh"
echo "  SSH into VM:   gcloud compute ssh $VM_NAME --zone=$ZONE"
