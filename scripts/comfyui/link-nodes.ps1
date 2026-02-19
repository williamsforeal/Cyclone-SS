$base = "C:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\comfyui"
$targetDir = "$base\ComfyUI\custom_nodes"
$nodes = @("ComfyUI-Manager","comfyui-custom-scripts","efficiency-nodes-comfyui","comfyui-impact-pack","comfyui-workflows")
foreach ($node in $nodes) {
    $source = "$base\custom_nodes\$node"
    $link = "$targetDir\$node"
    if (Test-Path $link) { Write-Host "Already exists: $node"; continue }
    New-Item -ItemType Junction -Path $link -Target $source | Out-Null
    Write-Host "Linked: $node"
}
