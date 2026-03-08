# Plan: Deploy n8n + ComfyUI to GCE VMs

## Context
The Cyclone-SS / Bomb Ecom OS stack needs to run in Google Cloud so:
- n8n webhooks have a stable public URL to receive traffic 24/7 (can't work from a laptop)
- ComfyUI GPU image generation can run on a T4 GPU when needed

Two separate VMs are needed:
1. **n8n VM** — always-on, e2-standard-2, cheap (~$35/mo), runs n8n + postgres
2. **ComfyUI GPU VM** — on-demand, n1-standard-8 + T4 (~$0.40/hr), start/stop manually

ComfyUI already has scripts (`scripts/comfyui/create-vm.sh`, `vm-startup.sh`). The gap is the n8n VM setup.

---

## What Gets Created

### New files
- `.claude/skills/gcp-deploy/SKILL.md` — Claude skill encoding GCP deployment rules (do first)
- `scripts/vm/create-n8n-vm.sh` — creates the n8n GCE VM + firewall rule
- `scripts/vm/n8n-startup.sh` — VM startup script (installs Docker, clones repo, starts n8n)
- `scripts/vm/deploy-env.sh` — helper to scp `.env` to VM and restart n8n

### No changes to existing files
- `docker-compose.yml` stays as-is; we just run `docker compose up -d postgres n8n` (skip bom-ecom)
- `.env.example` stays as-is

---

## Step-by-Step Implementation

### Step 0: `.claude/skills/gcp-deploy/SKILL.md`
Package the GCP deployment rules from `Gcloud Skills.md` as a Claude skill so it auto-loads during any GCP work:
- Always run `gcloud config list` first, verify project = `gen-lang-client-0234791928`
- Docker images tagged as `gcr.io/gen-lang-client-0234791928/[SERVICE]:[TAG]`
- Never `COPY key.json` in Dockerfiles — use Secret Manager or env vars
- Cloud Run deploys use `--service-account` + `--no-allow-unauthenticated` for private APIs
- Permission Denied fix: add Cloud Run Admin + Service Account User roles in IAM

### Step 1: `scripts/vm/n8n-startup.sh`
Runs on first boot on the new VM. Does:
1. Install Docker + docker-compose-plugin (apt)
2. Install git
3. Clone `https://github.com/williamsforeal/Cyclone-SS.git` into `/opt/cyclone-ss`
4. Create an empty `.env` placeholder (user will push real values via deploy-env.sh)
5. Run `docker compose up -d postgres n8n` (skips bom-ecom)
6. Create a systemd service (`cyclone-n8n.service`) so n8n restarts on VM reboot

### Step 2: `scripts/vm/create-n8n-vm.sh`
```
VM_NAME="cyclone-n8n"
MACHINE_TYPE="e2-standard-2"   # 2 vCPU, 8GB RAM
BOOT_DISK_SIZE="50GB"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0234791928"
```
- Creates the VM with `--metadata-from-file=startup-script=scripts/vm/n8n-startup.sh`
- Creates firewall rule `allow-n8n` (tcp:5678, target-tag: n8n-server)
- Prints the VM external IP at the end
- Prints next steps: run deploy-env.sh with the IP

### Step 3: `scripts/vm/deploy-env.sh`
Helper script that:
1. Takes VM external IP as argument: `bash scripts/vm/deploy-env.sh <VM_IP>`
2. `gcloud compute scp .env cyclone-n8n:/opt/cyclone-ss/.env --zone=us-central1-a`
3. SSHes in and updates `WEBHOOK_URL=http://<VM_IP>:5678/` in the .env
4. Restarts n8n: `docker compose restart n8n`
5. Prints the n8n URL

---

## Deployment Flow (after implementation)

```bash
# 1. Create the VM (one-time, ~3 min)
bash scripts/vm/create-n8n-vm.sh

# 2. Wait for startup script to finish (~2 min)
gcloud compute ssh cyclone-n8n --zone=us-central1-a -- tail -f /var/log/n8n-startup.log

# 3. Push your .env and start n8n
bash scripts/vm/deploy-env.sh <VM_EXTERNAL_IP>

# 4. Access n8n at http://<VM_EXTERNAL_IP>:5678
```

For ComfyUI GPU (on-demand):
```bash
bash scripts/comfyui/create-vm.sh   # start
bash scripts/comfyui/stop-vm.sh     # stop when done
```

---

## Critical Files
- `docker-compose.yml` — services definition (read, not modified)
- `.env` / `.env.example` — env vars needed on VM (read, not modified)
- `scripts/comfyui/create-vm.sh` — reference/pattern for new VM script
- `scripts/comfyui/vm-startup.sh` — reference/pattern for new startup script
- `bom-ecom/Dockerfile` — not needed for this deployment

## Verification
1. After `create-n8n-vm.sh`: VM appears in `gcloud compute instances list` with RUNNING status
2. After startup: `docker ps` on VM shows `n8n` and `postgres` containers running
3. After `deploy-env.sh`: `http://<VM_IP>:5678` loads n8n login page
4. Webhook test: trigger a test webhook in n8n and confirm it receives traffic
5. Reboot test: `sudo reboot` on VM, confirm n8n comes back up automatically
