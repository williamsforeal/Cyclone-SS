#!/bin/bash
# =============================================================================
# Cyclone-SS n8n VM Startup Script
# Runs on first boot to install Docker and start n8n + postgres
# =============================================================================
set -euo pipefail

LOG="/var/log/n8n-startup.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== n8n startup script began at $(date) ==="

APP_DIR="/opt/cyclone-ss"

# ---------- 1. Install dependencies ----------
echo ">>> Installing dependencies..."
apt-get update -y
apt-get install -y git ca-certificates curl gnupg

# ---------- 2. Install Docker ----------
if ! command -v docker &>/dev/null; then
  echo ">>> Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo ">>> Docker installed."
else
  echo ">>> Docker already installed."
fi

# ---------- 3. Create app directory ----------
# The repo files are pushed via deploy-env.sh (gcloud compute scp).
# Git clone from GitHub requires auth which isn't available at startup.
mkdir -p "$APP_DIR/workflows"
echo ">>> App directory ready at $APP_DIR"
echo ">>> Waiting for deploy-env.sh to push docker-compose.yml and .env..."

# ---------- 4. Skip container start ----------
# Containers will be started by deploy-env.sh after .env and docker-compose.yml
# are pushed to the VM. The startup script only handles OS-level setup.

# ---------- 6. Create systemd service for auto-restart on reboot ----------
cat > /etc/systemd/system/cyclone-n8n.service << 'SERVICE'
[Unit]
Description=Cyclone-SS n8n Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cyclone-ss
ExecStart=/usr/bin/docker compose up -d postgres n8n
ExecStop=/usr/bin/docker compose stop

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable cyclone-n8n.service
echo ">>> Systemd service enabled."

echo ""
echo "=== n8n startup script completed at $(date) ==="
echo ">>> Next step: run deploy-env.sh from your local machine to push your .env"
echo ">>> Then access n8n at http://$(curl -s ifconfig.me):5678"
