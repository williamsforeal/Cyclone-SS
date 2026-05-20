Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Stop-Process -Name curl -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Set COMFYUI_ROOT in your .env or as a user env var. Default: C:\ComfyUI
$comfyRoot = if ($env:COMFYUI_ROOT) { $env:COMFYUI_ROOT } else { "C:\ComfyUI" }
$file = Join-Path $comfyRoot "models\diffusion_models\flux1-dev-fp8.safetensors"

if (Test-Path $file) {
    Remove-Item $file -Force
    Write-Host "Deleted flux1-dev-fp8.safetensors from $comfyRoot"
} else {
    Write-Host "File not found at $file"
}
