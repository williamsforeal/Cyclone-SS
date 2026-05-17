"""
ComfyUI API Bridge
Lets Claude Code queue workflows, check status, and retrieve results
from a running ComfyUI instance. Zero dependencies (stdlib only).
"""

import json
import sys
import uuid
import time
import urllib.request
import urllib.error
import urllib.parse
import os

COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8188")


def _request(method, path, data=None):
    """Make an HTTP request to ComfyUI."""
    url = f"{COMFYUI_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        print(f"Connection failed: {e}")
        print("Is ComfyUI running? Launch it with: scripts\\launch-comfyui.bat")
        sys.exit(1)


def ping():
    """Check if ComfyUI is reachable."""
    try:
        _request("GET", "/system_stats")
        print("ComfyUI is running at", COMFYUI_URL)
        return True
    except SystemExit:
        return False


def queue_prompt(workflow_path, overrides=None):
    """
    Queue a ComfyUI workflow JSON for execution.

    workflow_path: path to a .json workflow file (API format)
    overrides:     dict of {node_id: {param: value}} to override before queuing
    """
    with open(workflow_path, "r") as f:
        workflow = json.load(f)

    if overrides:
        for node_id, params in overrides.items():
            if node_id in workflow:
                for key, val in params.items():
                    if "inputs" in workflow[node_id] and key in workflow[node_id]["inputs"]:
                        workflow[node_id]["inputs"][key] = val
                        print(f"  Override: node {node_id}.{key} = {val}")

    client_id = str(uuid.uuid4())
    payload = {"prompt": workflow, "client_id": client_id}

    result = _request("POST", "/prompt", payload)
    prompt_id = result.get("prompt_id", "unknown")
    print(f"Queued prompt: {prompt_id}")
    return prompt_id


def get_queue():
    """Show current queue status."""
    data = _request("GET", "/queue")
    running = len(data.get("queue_running", []))
    pending = len(data.get("queue_pending", []))
    print(f"Queue: {running} running, {pending} pending")
    return data


def get_history(prompt_id=None, max_items=5):
    """Get execution history. Optionally filter by prompt_id."""
    if prompt_id:
        data = _request("GET", f"/history/{prompt_id}")
    else:
        data = _request("GET", "/history")

    if not data:
        print("No history found.")
        return data

    # Show summary
    items = list(data.items())[:max_items]
    for pid, info in items:
        status = info.get("status", {})
        completed = status.get("completed", False)
        outputs = info.get("outputs", {})
        image_count = sum(
            len(node.get("images", []))
            for node in outputs.values()
        )
        state = "done" if completed else "running"
        print(f"  {pid[:12]}... [{state}] - {image_count} images")

    return data


def get_outputs(prompt_id):
    """Get output image filenames for a completed prompt."""
    data = _request("GET", f"/history/{prompt_id}")
    if prompt_id not in data:
        print(f"Prompt {prompt_id} not found in history.")
        return []

    outputs = data[prompt_id].get("outputs", {})
    images = []
    for node_id, node_output in outputs.items():
        for img in node_output.get("images", []):
            images.append(img)
            print(f"  Image: {img['filename']} (subfolder: {img.get('subfolder', '')})")

    return images


def download_image(filename, subfolder="", save_dir="."):
    """Download a generated image from ComfyUI."""
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder})
    url = f"{COMFYUI_URL}/view?{params}"
    save_path = os.path.join(save_dir, filename)

    urllib.request.urlretrieve(url, save_path)
    print(f"  Saved: {save_path}")
    return save_path


def wait_for_result(prompt_id, timeout=300, poll_interval=2):
    """Poll until a prompt completes, then return outputs."""
    print(f"Waiting for prompt {prompt_id[:12]}...")
    start = time.time()
    while time.time() - start < timeout:
        data = _request("GET", f"/history/{prompt_id}")
        if prompt_id in data:
            status = data[prompt_id].get("status", {})
            if status.get("completed", False):
                print("Prompt completed!")
                return get_outputs(prompt_id)
        time.sleep(poll_interval)

    print(f"Timeout after {timeout}s")
    return []


def list_nodes():
    """List all available ComfyUI node types."""
    data = _request("GET", "/object_info")
    categories = {}
    for name, info in data.items():
        cat = info.get("category", "uncategorized")
        categories.setdefault(cat, []).append(name)

    for cat in sorted(categories):
        print(f"\n[{cat}]")
        for node in sorted(categories[cat]):
            print(f"  {node}")

    print(f"\nTotal: {len(data)} node types")
    return data


# --- CLI ---
if __name__ == "__main__":
    commands = {
        "ping": (ping, "Check if ComfyUI is running"),
        "queue": (lambda: queue_prompt(sys.argv[2], json.loads(sys.argv[3]) if len(sys.argv) > 3 else None),
                  "Queue a workflow: queue <file.json> [overrides_json]"),
        "status": (get_queue, "Show queue status"),
        "history": (lambda: get_history(sys.argv[2] if len(sys.argv) > 2 else None),
                    "Show history: history [prompt_id]"),
        "outputs": (lambda: get_outputs(sys.argv[2]), "Get outputs: outputs <prompt_id>"),
        "download": (lambda: download_image(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""),
                     "Download image: download <filename> [subfolder]"),
        "wait": (lambda: wait_for_result(sys.argv[2]), "Wait for result: wait <prompt_id>"),
        "nodes": (list_nodes, "List all available node types"),
    }

    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        print("ComfyUI Bridge - API client for Claude Code")
        print(f"Usage: python {sys.argv[0]} <command>\n")
        for cmd, (_, desc) in commands.items():
            print(f"  {cmd:12s} {desc}")
        sys.exit(0)

    cmd = sys.argv[1]
    commands[cmd][0]()
