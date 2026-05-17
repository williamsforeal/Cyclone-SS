What You're Building: The Command Layer
Your current setup has two local agent teams:

PC → Cyclone (CTO) → Atlas, Forge, Signal, Muse
Laptop → Pulse (CTO) → Hunt, Parse, Sentinel, Relay

You need a cloud-level tier above both — an overseer that never sleeps, never loses context, and reports to you via Slack. Call it Nexus.
YOU (Slack)
    ↕
NEXUS — GCE VM on Google Cloud (OpenClaw + Slack bot)
    ├── Cyclone (PC team CTO) — ws://192.168.50.86:7337
    ├── Pulse (Laptop team CTO) — ws://192.168.50.19:7337
    ├── Linear (source of truth — solves your context loss problem)
    ├── Airtable (data layer)
    └── Aardvark/Codex (branching new work)

The Real Problem You're Solving First
The ComfyUI issue getting fixed 5-6 times is a memory architecture failure, not an agent failure. The fix is making Linear your external brain:

Every task = a Linear issue
Before any agent starts work → it reads the Linear issue history
After completing → it writes what was done, what failed, what's next
Context resets don't matter because the agent re-reads Linear first


Phase 1: Provision the GCE VM (Nexus)
bash# Run from your local gcloud CLI or Cloud Shell
gcloud compute instances create nexus \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=openclaw,slack-bot \
  --metadata=startup-script='#!/bin/bash
    apt-get update -y
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs git
    npm install -g openclaw@latest'
Reserve a static IP so your local agents can always reach Nexus:
bashgcloud compute addresses create nexus-ip --region=us-central1
gcloud compute instances add-access-config nexus \
  --access-config-name="External NAT" \
  --address=$(gcloud compute addresses describe nexus-ip \
    --region=us-central1 --format='value(address)')
Firewall rule for OpenClaw gateway port:
bashgcloud compute firewall-rules create allow-openclaw \
  --allow=tcp:7337 \
  --target-tags=openclaw \
  --source-ranges=YOUR_HOME_IP/32  # lock to your Spectrum IP

Phase 2: Nexus OpenClaw Config
SSH into the VM and create ~/.openclaw/openclaw.json:
json{
  "gateway": {
    "port": 7337,
    "bind": "0.0.0.0",
    "auth": {
      "type": "token",
      "token": "$OPENCLAW_GATEWAY_TOKEN"
    }
  },
  "channels": {
    "slack": {
      "botToken": "$SLACK_BOT_TOKEN",
      "appToken": "$SLACK_APP_TOKEN",
      "socketMode": true,
      "allowedUsers": ["$YOUR_SLACK_USER_ID"]
    }
  },
  "agents": {
    "list": [
      {
        "id": "nexus",
        "name": "Nexus",
        "description": "Cloud overseer. Coordinates PC and Laptop agent teams. Source of truth: Linear.",
        "model": "claude-opus-4-5",
        "tools": { "profile": "full" }
      }
    ]
  },
  "hooks": {
    "token": "$OPENCLAW_HOOKS_TOKEN"
  }
}
Secrets go in /etc/environment or loaded via Secret Manager:
bash# Never hardcode — pull from GCP Secret Manager
export OPENCLAW_GATEWAY_TOKEN=$(gcloud secrets versions access latest \
  --secret="openclaw-gateway-token")
export SLACK_BOT_TOKEN=$(gcloud secrets versions access latest \
  --secret="slack-bot-token")
export LINEAR_API_KEY=$(gcloud secrets versions access latest \
  --secret="linear-api-key")

Phase 3: Nexus System Prompt (Solves Context Loss)
This is the SKILL.md / system prompt that makes Nexus actually useful. Create ~/.openclaw/skills/nexus-overseer/SKILL.md:
markdown# Nexus — Cloud Overseer Agent

## Identity
You are Nexus. You run on Google Cloud and coordinate two local agent teams:
- PC Team: Cyclone (CTO), Atlas, Forge, Signal, Muse — at ws://192.168.50.86:7337
- Laptop Team: Pulse (CTO), Hunt, Parse, Sentinel, Relay — at ws://192.168.50.19:7337

## Memory Protocol (NON-NEGOTIABLE)
Before starting ANY task:
1. Search Linear for related issues
2. Read the full issue history including comments
3. State what was previously attempted and what the current status is

After completing ANY task:
1. Update the Linear issue with: what was done, what worked, what failed, what's next
2. Tag the issue appropriately (Done / Blocked / In Progress)

## Communication
- Report to Jake via Slack only
- Surface blockers immediately — do not retry a failed approach more than twice
- Daily 8am digest: what each team completed yesterday, what's queued today

## Escalation Rules
- If Cyclone is unreachable → alert Jake on Slack
- If Pulse is unreachable → alert Jake on Slack  
- If same issue appears 3x in Linear → flag as systemic, propose architectural fix

## Aardvark / Codex Integration
When Jake says "branch this" or "spin up Codex on this":
1. Create a new Linear issue for the branch
2. Provide Aardvark/Codex the Linear issue URL as context
3. Track output back to the same issue

Phase 4: Slack App Setup

Go to api.slack.com/apps → Create New App → From scratch → Name it "Nexus"
Socket Mode → Enable it → Generate App-Level Token → save as SLACK_APP_TOKEN
OAuth & Permissions → Bot Token Scopes: chat:write, channels:history, app_mentions:read, commands
Event Subscriptions → Subscribe to app_mention, message.im
Install to workspace → copy Bot Token → save as SLACK_BOT_TOKEN
Store both in Secret Manager:

bashecho -n "xapp-..." | gcloud secrets create slack-app-token --data-file=-
echo -n "xoxb-..." | gcloud secrets create slack-bot-token --data-file=-

Phase 5: Bridging Local Agents to Nexus
Your local agents need to be reachable from the cloud VM. Since you're on Spectrum (no static home IP by default), use a reverse tunnel from your laptop:
bash# On laptop — run as a systemd service
ssh -R 7337:localhost:7337 \
    -i ~/.ssh/nexus_key \
    -N \
    nexus-vm-external-ip
Create /etc/systemd/system/nexus-tunnel.service:
ini[Unit]
Description=Nexus Reverse Tunnel
After=network.target

[Service]
ExecStart=/usr/bin/ssh -R 7337:localhost:7337 \
    -i /home/user/.ssh/nexus_key \
    -o ServerAliveInterval=30 \
    -o ExitOnForwardFailure=yes \
    -N nexus-vm-ip
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
bashsystemctl enable nexus-tunnel
systemctl start nexus-tunnel

Immediate Priority Order
StepWhatWhy1Set up Linear workspace + connect to NexusSolves context loss — this is the root problem2Provision GCE VM + install OpenClawThe cloud brain3Create Slack app + connect to NexusYour command interface4Write Nexus system prompt with memory protocolBehavior definition5Reverse tunnel laptop → GCEAllows cloud to reach local agents6Wire Aardvark/Codex to Linear issuesNew branch tracking