#!/usr/bin/env python3
"""
Submit a ComfyUI workflow JSON, poll for completion, optionally download outputs.
Usage: python run_workflow.py --workflow path/to/workflow.json [--overrides '{"6":{"inputs":{"text":"custom prompt"}}}']
"""
import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request

COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8188")


def _request(method, path, data=None):
    url = f"{COMFYUI_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workflow", "-w", required=True, help="Path to workflow JSON (API format)")
    ap.add_argument("--overrides", "-o", default="{}", help="JSON overrides: {node_id: {param: value}}")
    ap.add_argument("--timeout", "-t", type=int, default=300, help="Poll timeout seconds")
    ap.add_argument("--output-dir", "-d", default=".", help="Directory to save output images")
    args = ap.parse_args()

    with open(args.workflow) as f:
        workflow = json.load(f)

    overrides = json.loads(args.overrides)
    for nid, params in overrides.items():
        if nid in workflow and "inputs" in workflow[nid]:
            workflow[nid]["inputs"].update(params)

    result = _request("POST", "/prompt", {"prompt": workflow})
    prompt_id = result.get("prompt_id")
    if not prompt_id:
        print("Error:", result, file=sys.stderr)
        sys.exit(1)
    print(f"Queued: {prompt_id}")

    start = time.time()
    while time.time() - start < args.timeout:
        data = _request("GET", f"/history/{prompt_id}")
        if prompt_id in data and data[prompt_id].get("status", {}).get("completed"):
            outputs = data[prompt_id].get("outputs", {})
            for node_out in outputs.values():
                for img in node_out.get("images", []):
                    fn = img.get("filename", "")
                    sub = img.get("subfolder", "")
                    params = urllib.parse.urlencode({"filename": fn, "subfolder": sub})
                    url = f"{COMFYUI_URL}/view?{params}"
                    path = os.path.join(args.output_dir, fn)
                    urllib.request.urlretrieve(url, path)
                    print(f"Saved: {path}")
            return
        time.sleep(2)

    print(f"Timeout after {args.timeout}s", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
