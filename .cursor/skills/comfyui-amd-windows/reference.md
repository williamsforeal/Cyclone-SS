# ComfyUI Reference — GCP VM, Diagnosis, Workflow Automation

## GCP VM Full Setup

### Create VM

```bash
# From repo root
bash scripts/comfyui/create-vm.sh
```

- **VM name:** comfyui-gpu
- **Zone:** us-central1-a
- **GPU:** 1x NVIDIA T4
- **Project:** gen-lang-client-0234791928

### Monitor Startup

```bash
gcloud compute ssh comfyui-gpu --zone=us-central1-a --project=gen-lang-client-0234791928 -- tail -f /var/log/comfyui-startup.log
```

### SSH Tunnel

```bash
bash scripts/comfyui/tunnel.sh
# ComfyUI at http://localhost:8188
```

### Stop VM

```bash
bash scripts/comfyui/stop-vm.sh
```

**Cost:** ~$0.40/hr when running. Stop when not in use.

---

## Diagnosis Checklist

### Windows PowerShell

```powershell
python --version
where python
pip --version
where pip
py -3.11 --version
nvidia-smi   # Expected: fail (no NVIDIA)
```

### WSL Ubuntu

```bash
python3 --version
which python3
pwd
ls /mnt/c/Users/Jake
```

### Venv Verification

```powershell
py -3.11 -m venv test_venv
.\test_venv\Scripts\activate
python -c "import sys; print(sys.executable)"
deactivate
Remove-Item -Recurse test_venv
```

---

## ComfyUI API Format

Submit workflow:

```bash
curl -X POST "http://localhost:8188/prompt" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": $(cat comfyui/workflows/txt2img_api.json)}"
```

Response: `{"prompt_id": "...", "number": 1}`

Poll result:

```bash
curl "http://localhost:8188/history/{prompt_id}"
```

Download image:

```bash
curl "http://localhost:8188/view?filename=ComfyUI_00001_.png" -o output.png
```

---

## run_workflow.py Pattern

```python
#!/usr/bin/env python3
"""Submit ComfyUI workflow, poll for completion, download output."""
import json
import sys
import time
import urllib.request

COMFYUI_URL = "http://127.0.0.1:8188"

def queue(workflow_path, overrides=None):
    with open(workflow_path) as f:
        w = json.load(f)
    if overrides:
        for nid, params in overrides.items():
            if nid in w and "inputs" in w[nid]:
                w[nid]["inputs"].update(params)
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=json.dumps({"prompt": w}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)["prompt_id"]

def wait(prompt_id, timeout=300):
    start = time.time()
    while time.time() - start < timeout:
        req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
        with urllib.request.urlopen(req) as r:
            data = json.load(r)
        if prompt_id in data and data[prompt_id].get("status", {}).get("completed"):
            return data[prompt_id]["outputs"]
        time.sleep(2)
    raise TimeoutError(f"Prompt {prompt_id} did not complete")

if __name__ == "__main__":
    wf = sys.argv[1]
    pid = queue(wf)
    print(f"Queued: {pid}")
    outputs = wait(pid)
    print("Done:", outputs)
```

---

## Environment Strategy

| Use Case | Tool | Notes |
|----------|------|-------|
| ComfyUI (AMD) | venv, Python 3.11 | Per-project venv in ComfyUI dir |
| General Python | venv | One venv per project |
| Conda | Optional | Not required; venv is sufficient |

---

## Known Facts (User Context)

- WSL Ubuntu 24.04.x
- Node in WSL (nvm, node v24+)
- ComfyUI cloned in repo (and possibly WSL)
- Goal: ComfyUI running, n8n-triggered, code-driven workflows
