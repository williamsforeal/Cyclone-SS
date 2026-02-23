---
name: comfyui-amd-windows
description: Setup and run ComfyUI on Windows with AMD GPU (DirectML), WSL CPU fallback, or GCP NVIDIA VM. Use when setting up ComfyUI, fixing AMD/CUDA driver errors, running workflows via API, or integrating with n8n.
---

# ComfyUI on Windows + AMD GPU

## Decision Tree: Which Path?

| Path | When to Use | GPU | Setup |
|------|-------------|-----|-------|
| **A: Windows native** | AMD GPU on Windows | DirectML | Recommended |
| **B: WSL CPU-only** | No GPU or debugging | None | Slow |
| **C: GCP GPU VM** | Production, high volume | NVIDIA T4 | See [reference.md](reference.md) |

**Critical:** Do NOT use WSL for AMD GPU acceleration. ROCm on WSL is not the normal ComfyUI path. Use **Windows PowerShell** with DirectML.

---

## Path A: Windows Native (AMD DirectML) — Recommended

### Prerequisites

- Python 3.11 x64 (not 3.13; most stable for ComfyUI + torch)
- Install: Add to PATH, disable path length limit

### Setup (copy/paste)

```powershell
cd C:\AI\ComfyUI
py -3.11 -m venv venv
.\venv\Scripts\activate
python --version   # Should show 3.11.x

python -m pip install --upgrade pip setuptools wheel
pip install torch-directml
pip install -r requirements.txt
```

**If `pip install -r requirements.txt` tries to replace torch:** Pin DirectML:

```powershell
pip install torch-directml --force-reinstall
pip install -r requirements.txt --no-deps
pip install -r requirements.txt
```

### Run

```powershell
python main.py --directml --listen 0.0.0.0 --port 8188
```

Open: http://127.0.0.1:8188

### Sanity Checks

```powershell
python -c "import torch; print('torch:', torch.__version__)"
python -c "import torch_directml; print('directml ok')"
```

---

## Reset Protocol (Wrong Torch/CUDA Installed)

1. Deactivate venv: `deactivate`
2. Remove venv: `Remove-Item -Recurse -Force venv`
3. Recreate: `py -3.11 -m venv venv`
4. Activate and install DirectML first, then requirements

---

## Path C: GCP GPU VM (NVIDIA)

Project: `gen-lang-client-0234791928`. Follow the gcp-deploy skill for security rules (no secrets in images, least privilege).

```bash
# Create VM (first time)
bash scripts/comfyui/create-vm.sh

# Start tunnel when VM is ready
bash scripts/comfyui/tunnel.sh

# Stop when done
bash scripts/comfyui/stop-vm.sh
```

ComfyUI runs in Docker on the VM. Access via `http://localhost:8188` through the tunnel.

---

## Run Workflows from Code

Use `scripts/comfyui_bridge.py`:

```bash
python scripts/comfyui_bridge.py ping
python scripts/comfyui_bridge.py queue comfyui/workflows/txt2img_api.json
python scripts/comfyui_bridge.py wait <prompt_id>
python scripts/comfyui_bridge.py outputs <prompt_id>
```

Set `COMFYUI_URL` if not localhost (e.g. tunnel or remote).

**CLI wrapper** (submit + poll + download):

```bash
python .cursor/skills/comfyui-amd-windows/scripts/run_workflow.py --workflow comfyui/workflows/txt2img_api.json --overrides '{"6":{"inputs":{"text":"your prompt here"}}}'
```

---

## n8n Integration

- **File watcher:** Watch `ComfyUI/output/` for new images
- **API:** POST to `http://localhost:8188/prompt` with `{"prompt": <workflow_json>}`

See `workflows/comfyui-trigger.json` for n8n workflow template.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Found no NVIDIA driver" | You have CUDA torch in a non-NVIDIA setup. Use Path A (DirectML) or Path C (GCP). |
| `py -3.11` fails | Install Python 3.11 x64 from python.org, add to PATH. |
| `pip install -r requirements.txt` replaces torch | Install torch-directml first, then `pip install -r requirements.txt --no-deps` before full install. |
| Port 8188 in use | Kill existing ComfyUI or use `--port 8189`. |
| WSL launching wrong distro | Use `wsl -d Ubuntu` or run ComfyUI on Windows. |

---

## Repo Structure

```
scripts/
  comfyui_bridge.py      # API client (queue, status, download)
  comfyui/
    launch-local.bat     # Windows DirectML launcher
    create-vm.sh         # GCP GPU VM
    tunnel.sh            # SSH tunnel to VM
    stop-vm.sh           # Stop VM
workflows/
  comfyui/               # Vertex-to-ComfyUI workflows
  comfyui-trigger.json   # n8n trigger template
comfyui/
  workflows/txt2img_api.json
```

---

## Additional Resources

- Full GCP VM setup and troubleshooting: [reference.md](reference.md)
- Vertex AI integration: `workflows/comfyui/COMFYUI-INTEGRATION-GUIDE.md`
