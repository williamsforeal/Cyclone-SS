Get-Process -Name python, curl -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 5

# Set COMFYUI_ROOT in your .env or as a user env var. Default: C:\ComfyUI
$comfyRoot = if ($env:COMFYUI_ROOT) { $env:COMFYUI_ROOT } else { "C:\ComfyUI" }
$file = Join-Path $comfyRoot "models\diffusion_models\flux1-dev-fp8.safetensors"

if (Test-Path $file) {
    Remove-Item $file -Force -ErrorAction Stop
    Write-Host "DELETED"
} else {
    Write-Host "ALREADY GONE"
}
