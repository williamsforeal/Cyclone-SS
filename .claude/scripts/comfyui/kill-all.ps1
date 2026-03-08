Get-Process -Name python, curl -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 5
$file = "C:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\comfyui\ComfyUI\models\diffusion_models\flux1-dev-fp8.safetensors"
if (Test-Path $file) {
    Remove-Item $file -Force -ErrorAction Stop
    Write-Host "DELETED"
} else {
    Write-Host "ALREADY GONE"
}
