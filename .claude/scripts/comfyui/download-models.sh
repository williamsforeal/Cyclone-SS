#!/bin/bash
# =============================================================================
# Download Flux Dev model to the ComfyUI VM
# Run this ONCE after the VM is set up
# Usage: bash scripts/comfyui/download-models.sh
# =============================================================================
set -euo pipefail

VM_NAME="comfyui-gpu"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"

echo "=== Downloading models to ComfyUI VM ==="
echo "This will download Flux Dev fp8 (~17GB) to the VM."
echo ""

gcloud compute ssh "$VM_NAME" --zone="$ZONE" --project="$PROJECT" -- bash -s << 'REMOTE'
set -euo pipefail
MODELS_DIR="/opt/comfyui/models"

echo ">>> Downloading Flux Dev fp8 checkpoint..."
mkdir -p "$MODELS_DIR/checkpoints"
cd "$MODELS_DIR/checkpoints"
if [ ! -f "flux1-dev-fp8.safetensors" ]; then
  # Flux Dev fp8 from Hugging Face (community quantized, ~17GB)
  apt-get install -y wget 2>/dev/null || true
  wget -c "https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors" \
    -O flux1-dev-fp8.safetensors
  echo ">>> Flux Dev fp8 downloaded."
else
  echo ">>> Flux Dev fp8 already exists, skipping."
fi

echo ""
echo ">>> Downloading CLIP models for Flux..."
mkdir -p "$MODELS_DIR/clip"
cd "$MODELS_DIR/clip"
if [ ! -f "clip_l.safetensors" ]; then
  wget -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"
  echo ">>> clip_l downloaded."
fi
if [ ! -f "t5xxl_fp8_e4m3fn.safetensors" ]; then
  wget -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors"
  echo ">>> t5xxl_fp8 downloaded."
fi

echo ""
echo ">>> Downloading Flux VAE..."
mkdir -p "$MODELS_DIR/vae"
cd "$MODELS_DIR/vae"
if [ ! -f "ae.safetensors" ]; then
  wget -c "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors"
  echo ">>> Flux VAE downloaded."
fi

echo ""
echo "=== Model download complete ==="
ls -lh "$MODELS_DIR/checkpoints/"
ls -lh "$MODELS_DIR/clip/"
ls -lh "$MODELS_DIR/vae/"
REMOTE

echo ""
echo "=== Done ==="
echo "Models are on the VM. Restart ComfyUI to pick them up:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE -- 'cd /opt/comfyui && docker compose restart'"
