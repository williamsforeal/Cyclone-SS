#!/bin/bash
# =============================================================================
# Create ComfyUI GCE VM with NVIDIA T4 GPU
# Usage: bash scripts/comfyui/create-vm.sh
# Cost: ~$0.35/hr (T4) + ~$0.05/hr (n1-standard-4) = ~$0.40/hr when running
# IMPORTANT: Stop the VM when not in use to avoid charges!
# =============================================================================
set -euo pipefail

VM_NAME="comfyui-gpu"
ZONE="us-central1-a"
MACHINE_TYPE="n1-standard-8"  # 8 vCPU, 30GB RAM — needed for model loading
GPU_TYPE="nvidia-tesla-t4"
GPU_COUNT=1
BOOT_DISK_SIZE="100GB"  # Enough for OS + models + Docker images
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"
PROJECT="gen-lang-client-0234791928"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Creating ComfyUI GPU VM ==="
echo "  VM:       $VM_NAME"
echo "  Zone:     $ZONE"
echo "  Machine:  $MACHINE_TYPE"
echo "  GPU:      $GPU_COUNT x $GPU_TYPE"
echo "  Disk:     $BOOT_DISK_SIZE"
echo ""

# Check if VM already exists
if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT" &>/dev/null; then
  echo "VM '$VM_NAME' already exists. Starting it..."
  gcloud compute instances start "$VM_NAME" --zone="$ZONE" --project="$PROJECT"
  echo "VM started. Run: bash scripts/comfyui/tunnel.sh"
  exit 0
fi

echo "Creating new VM..."
gcloud compute instances create "$VM_NAME" \
  --project="$PROJECT" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --accelerator="type=$GPU_TYPE,count=$GPU_COUNT" \
  --maintenance-policy=TERMINATE \
  --boot-disk-size="$BOOT_DISK_SIZE" \
  --boot-disk-type=pd-ssd \
  --image-family="$IMAGE_FAMILY" \
  --image-project="$IMAGE_PROJECT" \
  --metadata-from-file=startup-script="$SCRIPT_DIR/vm-startup.sh" \
  --scopes=default,storage-ro \
  --tags=comfyui

echo ""
echo "=== VM Created ==="
echo ""
echo "The startup script is installing NVIDIA drivers, Docker, and ComfyUI."
echo "This takes 5-10 minutes on first boot."
echo ""
echo "Monitor progress:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE -- tail -f /var/log/comfyui-startup.log"
echo ""
echo "When ready, start the SSH tunnel:"
echo "  bash scripts/comfyui/tunnel.sh"
echo ""
echo "REMINDER: Stop the VM when done to save money:"
echo "  bash scripts/comfyui/stop-vm.sh"
