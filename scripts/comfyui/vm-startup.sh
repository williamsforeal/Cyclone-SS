#!/bin/bash
# =============================================================================
# ComfyUI GCE VM Startup Script
# Runs on first boot to install NVIDIA drivers, Docker, and ComfyUI
# =============================================================================
set -euo pipefail

LOG="/var/log/comfyui-startup.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== ComfyUI startup script began at $(date) ==="

# ---------- 1. Install NVIDIA GPU drivers ----------
if ! command -v nvidia-smi &>/dev/null; then
  echo ">>> Installing NVIDIA drivers..."
  apt-get update -y
  apt-get install -y linux-headers-$(uname -r) build-essential
  # Use the Google driver installer for GCE
  curl -fsSL https://raw.githubusercontent.com/GoogleCloudPlatform/compute-gpu-installation/main/linux/install_gpu_driver.py -o /tmp/install_gpu_driver.py
  python3 /tmp/install_gpu_driver.py
  echo ">>> NVIDIA drivers installed."
else
  echo ">>> NVIDIA drivers already installed."
fi
nvidia-smi

# ---------- 2. Install Docker + NVIDIA Container Toolkit ----------
if ! command -v docker &>/dev/null; then
  echo ">>> Installing Docker..."
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo ">>> Docker installed."
fi

if ! dpkg -l | grep -q nvidia-container-toolkit; then
  echo ">>> Installing NVIDIA Container Toolkit..."
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
  curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' > /etc/apt/sources.list.d/nvidia-container-toolkit.list
  apt-get update -y
  apt-get install -y nvidia-container-toolkit
  nvidia-ctk runtime configure --runtime=docker
  systemctl restart docker
  echo ">>> NVIDIA Container Toolkit installed."
fi

# ---------- 3. Create ComfyUI workspace ----------
COMFY_DIR="/opt/comfyui"
mkdir -p "$COMFY_DIR"/{models/checkpoints,models/clip,models/vae,models/loras,models/controlnet,output,input,custom_nodes}

# ---------- 4. Clone ComfyUI + custom nodes (if not already present) ----------
if [ ! -d "$COMFY_DIR/ComfyUI" ]; then
  echo ">>> Cloning ComfyUI..."
  cd "$COMFY_DIR"
  git clone https://github.com/williamsforeal/ComfyUI.git

  echo ">>> Cloning custom nodes..."
  cd "$COMFY_DIR/ComfyUI/custom_nodes"
  git clone https://github.com/williamsforeal/ComfyUI-Manager.git
  git clone https://github.com/williamsforeal/comfyui-custom-scripts.git
  git clone https://github.com/williamsforeal/efficiency-nodes-comfyui.git
  git clone https://github.com/williamsforeal/comfyui-impact-pack.git
  git clone https://github.com/williamsforeal/comfyui-workflows.git
  echo ">>> All repos cloned."
fi

# ---------- 5. Create docker-compose for ComfyUI ----------
cat > "$COMFY_DIR/docker-compose.yml" << 'COMPOSE'
services:
  comfyui:
    image: ghcr.io/ai-dock/comfyui:pytorch-latest
    container_name: comfyui
    restart: unless-stopped
    ports:
      - "8188:8188"
    volumes:
      - ./ComfyUI/custom_nodes:/opt/ComfyUI/custom_nodes
      - ./models:/opt/ComfyUI/models
      - ./output:/opt/ComfyUI/output
      - ./input:/opt/ComfyUI/input
    environment:
      - CLI_ARGS=--listen 0.0.0.0 --port 8188
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
COMPOSE

# ---------- 6. Pull and start ComfyUI ----------
echo ">>> Starting ComfyUI container..."
cd "$COMFY_DIR"
docker compose pull
docker compose up -d

echo "=== ComfyUI startup script completed at $(date) ==="
echo ">>> ComfyUI should be available at http://localhost:8188"
echo ">>> Use SSH tunnel to access: gcloud compute ssh comfyui-gpu -- -L 8188:localhost:8188"
