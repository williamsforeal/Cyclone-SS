#!/bin/bash
# =============================================================================
# Deploy .env to the n8n VM and restart n8n
# Usage: bash scripts/vm/deploy-env.sh <VM_EXTERNAL_IP>
# Run this after create-n8n-vm.sh, and any time you update your .env
# =============================================================================
set -euo pipefail

VM_IP="${1:-}"
VM_NAME="cyclone-n8n"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"
APP_DIR="/opt/cyclone-ss"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$VM_IP" ]; then
  echo "Usage: bash scripts/vm/deploy-env.sh <VM_EXTERNAL_IP>"
  echo ""
  echo "To find your VM's IP:"
  echo "  gcloud compute instances list --project=$PROJECT"
  exit 1
fi

if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "Error: .env not found at $REPO_ROOT/.env"
  echo "Create it from .env.example and fill in your values first."
  exit 1
fi

echo "=== Deploying .env to $VM_NAME ($VM_IP) ==="
echo ""

# Copy essential files to VM
echo ">>> Copying docker-compose.yml, .env, and workflows to VM..."
tar czf /tmp/cyclone-deploy.tar.gz -C "$REPO_ROOT" docker-compose.yml .env .env.example workflows/
gcloud compute scp /tmp/cyclone-deploy.tar.gz "$VM_NAME:/tmp/cyclone-deploy.tar.gz" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --strict-host-key-checking=no
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --strict-host-key-checking=no \
  --command="sudo tar xzf /tmp/cyclone-deploy.tar.gz -C $APP_DIR && rm /tmp/cyclone-deploy.tar.gz && echo 'Files deployed.'"
rm -f /tmp/cyclone-deploy.tar.gz

# Update WEBHOOK_URL to point to this VM's public IP
echo ">>> Setting WEBHOOK_URL to http://$VM_IP:5678/..."
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --strict-host-key-checking=no \
  --command="sed -i 's|^WEBHOOK_URL=.*|WEBHOOK_URL=http://$VM_IP:5678/|' $APP_DIR/.env && echo 'WEBHOOK_URL updated.'"

# Start or restart n8n + postgres
echo ">>> Starting n8n + postgres..."
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --strict-host-key-checking=no \
  --command="cd $APP_DIR && sudo docker compose up -d postgres n8n && echo 'Containers running.'"

echo ""
echo "=== Done ==="
echo ""
echo "  n8n is running at: http://$VM_IP:5678"
echo ""
echo "Log in with the credentials from your .env:"
echo "  User: N8N_BASIC_AUTH_USER"
echo "  Pass: N8N_BASIC_AUTH_PASSWORD"
