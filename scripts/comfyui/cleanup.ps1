Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Stop-Process -Name curl -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
$file = "C:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\comfyui\ComfyUI\models\diffusion_models\flux1-dev-fp8.safetensors"
if (Test-Path $file) {
    Remove-Item $file -Force
    Write-Host "Deleted flux1-dev-fp8.safetensors"
} else {
    Write-Host "File not found"
}
