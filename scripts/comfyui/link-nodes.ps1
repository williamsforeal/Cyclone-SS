# Operates on the Cyclone-SS repo's comfyui/ submodule layout.
# Junction-links each custom_nodes submodule into ComfyUI/custom_nodes/
# Repo-relative: works from any drive as long as the repo structure is intact.
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$base = Join-Path $repoRoot "comfyui"
$targetDir = Join-Path $base "ComfyUI\custom_nodes"

if (-not (Test-Path $targetDir)) {
    Write-Host "ERROR: $targetDir does not exist." -ForegroundColor Red
    Write-Host "Run 'git submodule update --init --recursive' first to populate comfyui/ComfyUI/" -ForegroundColor Yellow
    exit 1
}

$nodes = @("ComfyUI-Manager","comfyui-custom-scripts","efficiency-nodes-comfyui","comfyui-impact-pack","comfyui-workflows")
foreach ($node in $nodes) {
    $source = Join-Path $base "custom_nodes\$node"
    $link = Join-Path $targetDir $node
    if (Test-Path $link) { Write-Host "Already exists: $node"; continue }
    if (-not (Test-Path $source)) { Write-Host "SKIP: source missing $source" -ForegroundColor Yellow; continue }
    New-Item -ItemType Junction -Path $link -Target $source | Out-Null
    Write-Host "Linked: $node"
}
