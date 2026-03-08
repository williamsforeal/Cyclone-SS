#!/bin/bash
# =============================================================================
# Create Cyclone-SS n8n GCE VM
# Usage: bash scripts/vm/create-n8n-vm.sh
# Cost: ~$35/month (e2-standard-2, always on)
# After creation: bash scripts/vm/deploy-env.sh <VM_EXTERNAL_IP>
# =============================================================================
set -euo pipefail

VM_NAME="cyclone-n8n"
ZONE="us-central1-a"
MACHINE_TYPE="e2-standard-2"   # 2 vCPU, 8GB RAM
BOOT_DISK_SIZE="50GB"
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"
PROJECT="gen-lang-client-0234791928"
TAG="n8n-server"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- GCP Environment Validation (always verify project first) ---
echo "=== Verifying GCP project ==="
ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$ACTIVE_PROJECT" != "$PROJECT" ]; then
  echo "Setting project to $PROJECT..."
  gcloud config set project "$PROJECT"
fi
echo "  Project: $PROJECT ✓"
echo ""

echo "=== Creating n8n VM ==="
echo "  VM:      $VM_NAME"
echo "  Zone:    $ZONE"
echo "  Machine: $MACHINE_TYPE"
echo "  Disk:    $BOOT_DISK_SIZE"
echo ""

# Check if VM already exists
if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT" &>/dev/null; then
  STATUS=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT" --format="value(status)")
  echo "VM '$VM_NAME' already exists (status: $STATUS)."
  if [ "$STATUS" = "TERMINATED" ] || [ "$STATUS" = "SUSPENDED" ]; then
    echo "Starting it..."
    gcloud compute instances start "$VM_NAME" --zone="$ZONE" --project="$PROJECT"
  fi
  VM_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
  echo ""
  echo "VM is running. External IP: $VM_IP"
  echo "Run: bash scripts/vm/deploy-env.sh $VM_IP"
  exit 0
fi

# Create firewall rule if it doesn't exist
if ! gcloud compute firewall-rules describe allow-n8n --project="$PROJECT" &>/dev/null; then
  echo "Creating firewall rule for port 5678..."
  gcloud compute firewall-rules create allow-n8n \
    --project="$PROJECT" \
    --allow=tcp:5678 \
    --target-tags="$TAG" \
    --description="Allow n8n webhook traffic on port 5678"
  echo "Firewall rule created. ✓"
fi

# Create the VM
echo "Creating VM..."
gcloud compute instances create "$VM_NAME" \
  --project="$PROJECT" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --boot-disk-size="$BOOT_DISK_SIZE" \
  --boot-disk-type=pd-ssd \
  --image-family="$IMAGE_FAMILY" \
  --image-project="$IMAGE_PROJECT" \
  --metadata-from-file=startup-script="$SCRIPT_DIR/n8n-startup.sh" \
  --tags="$TAG" \
  --scopes=default

echo ""
echo "=== VM Created ==="
echo ""

# Get external IP
VM_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
echo "  External IP: $VM_IP"
echo ""
echo "The startup script is installing Docker and starting n8n (~2-3 minutes)."
echo ""
echo "Monitor startup progress:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --strict-host-key-checking=no -- tail -f /var/log/n8n-startup.log"
echo ""
echo "Once ready, push your .env and start n8n:"
echo "  bash scripts/vm/deploy-env.sh $VM_IP"
echo ""
echo "Then access n8n at: http://$VM_IP:5678"
