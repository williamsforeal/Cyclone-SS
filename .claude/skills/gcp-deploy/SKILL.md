---
name: gcp-deploy
description: Google Cloud Platform deployment rules for Cyclone-SS. Use when deploying to GCE VMs, Cloud Run, or pushing Docker images to GCR. Enforces security rules, correct project targeting, and IAM best practices.
---

# GCP Deployment Skill

## Skill 1: Environment Validation (ALWAYS DO THIS FIRST)

Before executing any GCP deployment command:

```bash
gcloud config list
```

Verify `project = gen-lang-client-0234791928`. If not set:

```bash
gcloud config set project gen-lang-client-0234791928
```

**Never proceed if project ID is missing or incorrect.**

---

## Skill 2: Secure Docker Build & Push to GCR

Tag format: `gcr.io/gen-lang-client-0234791928/[SERVICE_NAME]:[TAG]`

```bash
# Authenticate Docker with GCP
gcloud auth configure-docker

# Build and tag
docker build -t gcr.io/gen-lang-client-0234791928/[SERVICE_NAME]:[TAG] .

# Push
docker push gcr.io/gen-lang-client-0234791928/[SERVICE_NAME]:[TAG]
```

**CRITICAL SECURITY RULE:** Never use `COPY key.json` inside a Dockerfile. Secrets go through:
- GCP Secret Manager (preferred for production)
- Runtime environment variables (acceptable)
- Never baked into the image

---

## Skill 3: Cloud Run Deployment

```bash
gcloud run deploy [SERVICE_NAME] \
  --image gcr.io/gen-lang-client-0234791928/[SERVICE_NAME]:[TAG] \
  --region us-central1 \
  --service-account [SA_EMAIL]
```

- **Private APIs** (backend only, called by Replit UI): append `--no-allow-unauthenticated`
- **Public APIs**: omit the flag
- Always use `--service-account` with a least-privilege service account — never deploy as the default compute SA

---

## Skill 4: GCE VM Operations

```bash
# List all VMs
gcloud compute instances list --project=gen-lang-client-0234791928

# SSH (direct, no IAP needed if VM has external IP)
gcloud compute ssh [VM_NAME] --zone=us-central1-a --strict-host-key-checking=no

# SSH with IAP tunnel (if no external IP or firewall blocks port 22)
gcloud compute ssh [VM_NAME] --zone=us-central1-a --tunnel-through-iap

# SCP a file to VM
gcloud compute scp [LOCAL_FILE] [VM_NAME]:[REMOTE_PATH] --zone=us-central1-a

# Start / Stop VM
gcloud compute instances start [VM_NAME] --zone=us-central1-a
gcloud compute instances stop [VM_NAME] --zone=us-central1-a
```

---

## Common Failure: Permission Denied on Cloud Run

**Symptom:** `Permission Denied` or `Service Agent lacks permissions`

**Fix:**
1. Go to GCP Console → IAM & Admin → IAM
2. Find your active Google account email
3. Add both roles:
   - `Cloud Run Admin`
   - `Service Account User` ← mandatory when specifying `--service-account`

---

## Project Reference

- **Project ID:** `gen-lang-client-0234791928`
- **Region:** `us-central1`
- **Zone:** `us-central1-a`
- **GCR base:** `gcr.io/gen-lang-client-0234791928/`
