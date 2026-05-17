---
name: comfyui-bridge
description: Use when the user wants to queue a ComfyUI workflow, check generation status, or interact with the local ComfyUI instance.
---

# ComfyUI Bridge

Interact with a local ComfyUI instance from Claude Code. Queue workflows, check status, get results.

## Usage
```
/comfyui <command> [args]
```

Commands:
- `/comfyui ping` — Check if ComfyUI is running
- `/comfyui queue <workflow.json>` — Queue a workflow for execution
- `/comfyui status` — Show queue status
- `/comfyui history` — Show recent execution history
- `/comfyui nodes` — List all available node types
- `/comfyui wait <prompt_id>` — Wait for a prompt to finish and show outputs
- `/comfyui download <prompt_id>` — Download all output images from a completed prompt

## Instructions

You are a ComfyUI automation assistant. You use the bridge script at `scripts/comfyui_bridge.py` to control a local ComfyUI instance at `http://127.0.0.1:8188`.

### Environment
- ComfyUI portable (AMD) is installed at: `C:\Users\Jake\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable\`
- Launch script: `scripts\launch-comfyui.bat`
- Bridge script: `scripts\comfyui_bridge.py`
- ComfyUI API: `http://127.0.0.1:8188`
- Python (embedded): `C:\Users\Jake\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable\python_embeded\python.exe`
- If system Python is not available, use the ComfyUI embedded Python to run the bridge script

### Step 1: Parse the Command
- Extract the command from the user's input (ping, queue, status, history, nodes, wait, download)
- If no command given, show available commands

### Step 2: Check ComfyUI is Running
- Run the bridge script with the `ping` command first:
```bash
python scripts/comfyui_bridge.py ping
```
- If ComfyUI is not running, tell the user to launch it:
  - Option A: Run `scripts\launch-comfyui.bat` in a separate terminal tab
  - Option B: Use Cursor's Simple Browser at `http://127.0.0.1:8188`

### Step 3: Execute the Command

**ping** — Check connectivity:
```bash
python scripts/comfyui_bridge.py ping
```

**queue** — Queue a workflow JSON file:
```bash
python scripts/comfyui_bridge.py queue <path-to-workflow.json>
```
- The workflow must be in ComfyUI **API format** (node IDs as keys, not the UI save format)
- To convert: save from ComfyUI using "Save (API Format)" or export via Developer Mode
- Optional: pass a JSON string of overrides as a third argument to modify node inputs:
```bash
python scripts/comfyui_bridge.py queue workflow.json "{\"3\": {\"seed\": 12345}}"
```

**status** — Show running and pending prompts:
```bash
python scripts/comfyui_bridge.py status
```

**history** — Show recent executions:
```bash
python scripts/comfyui_bridge.py history
```
Or for a specific prompt:
```bash
python scripts/comfyui_bridge.py history <prompt_id>
```

**nodes** — List all installed node types (useful for building workflows):
```bash
python scripts/comfyui_bridge.py nodes
```

**wait** — Wait for a queued prompt to complete, then show output images:
```bash
python scripts/comfyui_bridge.py wait <prompt_id>
```

**download** — Download a generated image by filename:
```bash
python scripts/comfyui_bridge.py download <filename>
```

### Step 4: Report Results
- Show the command output to the user
- For queued prompts: display the prompt_id and suggest using `/comfyui wait <prompt_id>`
- For completed prompts: list output images and offer to download them
- For errors: explain what went wrong and suggest fixes

## Workflow Tips for the User
1. **Design visually** in ComfyUI browser UI at `http://127.0.0.1:8188`
2. **Enable Dev Mode**: Settings > Enable Dev Mode Options
3. **Export API format**: Click "Save (API Format)" to get a JSON Claude Code can queue
4. **Save workflow JSONs** in the `workflows/comfyui/` directory for reuse
5. **Override parameters** at queue time — change seeds, prompts, image paths without editing the JSON

## Error Handling
- **Connection refused**: ComfyUI is not running — launch it with `scripts\launch-comfyui.bat`
- **Invalid workflow format**: The JSON needs to be API format, not UI format
- **Node not found**: A required custom node is not installed in ComfyUI
- **Out of memory**: Close other applications or reduce image resolution