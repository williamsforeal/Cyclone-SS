# =============================================================================
# Download ALL ComfyUI models for Bomb Ecom OS ad creative pipeline
# Total: ~50 GB — run once, models persist on disk
# Usage: powershell -ExecutionPolicy Bypass -File scripts\comfyui\download-all-models.ps1
# =============================================================================

$base = "C:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\comfyui\ComfyUI\models"

# Create all directories
$dirs = @(
    "$base\diffusion_models",
    "$base\clip",
    "$base\vae",
    "$base\controlnet",
    "$base\ipadapter",
    "$base\pulid",
    "$base\upscale_models",
    "$base\style_models"
)
foreach ($d in $dirs) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

function Download-Model {
    param([string]$url, [string]$dest)
    $file = Split-Path $dest -Leaf
    if (Test-Path $dest) {
        Write-Host "[SKIP] $file already exists" -ForegroundColor Yellow
        return
    }
    Write-Host "[DOWNLOADING] $file ..." -ForegroundColor Cyan
    $ProgressPreference = 'SilentlyContinue'
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        $size = [math]::Round((Get-Item $dest).Length / 1GB, 2)
        Write-Host "[DONE] $file ($size GB)" -ForegroundColor Green
    } catch {
        Write-Host "[FAILED] $file - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor White
Write-Host " Bomb Ecom OS - ComfyUI Model Downloader"
Write-Host "============================================" -ForegroundColor White
Write-Host ""

# ---------- 1. BASE MODEL: Flux Dev fp8 ----------
Write-Host "--- [1/10] FLUX.1 Dev fp8 (Base Model) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Kijai/flux-fp8/resolve/main/flux1-dev-fp8.safetensors" `
    "$base\diffusion_models\flux1-dev-fp8.safetensors"

# ---------- 2. TEXT ENCODERS ----------
Write-Host "--- [2/10] Text Encoders (CLIP + T5) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" `
    "$base\clip\clip_l.safetensors"

Download-Model `
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors" `
    "$base\clip\t5xxl_fp8_e4m3fn.safetensors"

# ---------- 3. VAE ----------
Write-Host "--- [3/10] Flux VAE ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors" `
    "$base\vae\ae.safetensors"

# ---------- 4. IP-ADAPTER (Style/Ad Cloning) ----------
Write-Host "--- [4/10] InstantX IP-Adapter (Ad Style Cloning) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Kijai/FLUX.1-dev-IP-Adapter-safetensors/resolve/main/instantx_flux1_dev_ip_adapter_bf16.safetensors" `
    "$base\ipadapter\instantx_flux1_dev_ip_adapter_bf16.safetensors"

# ---------- 5. CONTROLNET (Pose/Composition) ----------
Write-Host "--- [5/10] ControlNet Union Pro 2.0 (Pose Matching) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro-2.0/resolve/main/diffusion_pytorch_model.safetensors" `
    "$base\controlnet\flux-controlnet-union-pro-2.0.safetensors"

# ---------- 6. PULID (Face Identity) ----------
Write-Host "--- [6/10] PuLID Flux (Face Identity for UGC) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/guozinan/PuLID/resolve/main/pulid_flux_v0.9.1.safetensors" `
    "$base\pulid\pulid_flux_v0.9.1.safetensors"

# ---------- 7. FLUX REDUX (Image Variation) ----------
Write-Host "--- [7/10] FLUX.1 Redux (Image Variations) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Comfy-Org/flux1-redux-dev/resolve/main/flux1-redux-dev.safetensors" `
    "$base\style_models\flux1-redux-dev.safetensors"

# ---------- 8. FLUX KONTEXT (Text-Guided Editing) ----------
Write-Host "--- [8/10] FLUX.1 Kontext (Product Swap / Editing) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/resolve/main/split_files/diffusion_models/flux1-kontext-dev_fp8_scaled.safetensors" `
    "$base\diffusion_models\flux1-kontext-dev_fp8_scaled.safetensors"

# ---------- 9. FLUX FILL (Inpainting) ----------
Write-Host "--- [9/10] FLUX.1 Fill (Inpainting / Product Swap) ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Comfy-Org/flux1-fill-dev/resolve/main/flux1-fill-dev-fp8-e4m3fn.safetensors" `
    "$base\diffusion_models\flux1-fill-dev-fp8.safetensors"

# ---------- 10. UPSCALERS ----------
Write-Host "--- [10/10] Upscalers ---" -ForegroundColor Magenta
Download-Model `
    "https://huggingface.co/Kim2091/UltraSharp/resolve/main/4x-UltraSharp.safetensors" `
    "$base\upscale_models\4x-UltraSharp.safetensors"

Download-Model `
    "https://huggingface.co/Comfy-Org/Real-ESRGAN_repackaged/resolve/main/RealESRGAN_x4plus.safetensors" `
    "$base\upscale_models\RealESRGAN_x4plus.safetensors"

# ---------- SUMMARY ----------
Write-Host ""
Write-Host "============================================" -ForegroundColor White
Write-Host " Download Complete! Model Inventory:" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor White
Write-Host ""

$folders = @("diffusion_models","clip","vae","controlnet","ipadapter","pulid","upscale_models","style_models")
foreach ($f in $folders) {
    $path = "$base\$f"
    if (Test-Path $path) {
        $files = Get-ChildItem $path -File
        foreach ($file in $files) {
            $size = [math]::Round($file.Length / 1GB, 2)
            Write-Host "  [$f] $($file.Name) - $size GB"
        }
    }
}

Write-Host ""
Write-Host "Restart ComfyUI to pick up new models:" -ForegroundColor Yellow
Write-Host "  scripts\comfyui\launch-local.bat" -ForegroundColor Yellow
