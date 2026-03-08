# Strategy

---

## Current Focus Period

**Q1 2026** — Get Bomb Ecom OS to a working end-to-end demo and ship PalmAura ad campaigns.

---

## Strategic Priorities

1. **Complete the AI pipeline (WF1–WF5)** — Five n8n workflows: Research, Ad Copy, Image Generation, Ad Concept, Ad Clone. The core engine of Bomb Ecom OS. WF1–WF3 are the critical path.

2. **Get OpenClaw team fully operational** — 5-agent Discord dev team (Cyclone/Atlas/Forge/Signal/Muse) on Linux. Phase 1 (Cyclone + Atlas) in progress. Goal: delegate build tasks to agents instead of doing everything manually.

3. **Ship PalmAura campaigns** — Use the platform for real ad creatives. PalmAura is both a revenue source and proof the OS works. Target: ad families across 4 avatars (Desk Warrior, Stubborn Provider, Aging Independent, Creator/Gamer).

4. **Product-agnostic refactor** — Static Scaler and image pipeline are currently PalmAura-hardcoded. Refactor to accept any product as input with swappable brand profiles, avatars, and copy frameworks.

5. **Populate the knowledge base** — Fill `~/projects/bomb-ecom/knowledge/` with creative frameworks (Schwartz, Ogilvy, Motion Methodology), brand profiles, compliance rules, and competitor analysis. This is what makes agents smart vs generic.

---

## What Success Looks Like

- WF1 (Research) → WF2 (Copy) → WF3 (Images) running end-to-end for any product
- OpenClaw team completing a full build task autonomously (Forge builds a workflow from Cyclone's spec)
- PalmAura has 10+ live ad variants across 2+ avatars
- Bomb Ecom OS demonstrated for a second brand/product

---

## Key Decisions / Open Questions

- **Gemini vs Claude for agents:** Switched to Gemini API key for OpenClaw — need to confirm model strings and output quality differences
- **Vertex AI vs direct APIs:** Vertex consolidates billing but adds latency; direct APIs simpler for n8n nodes
- **GCE VM vs Cloud Run for n8n:** GCE cheaper for always-on; Cloud Run cold starts hurt webhook reliability
- **Knowledge base format:** Markdown files (works great with Claude Code's Read tool) vs vector DB (more complex, no clear benefit yet)

---

_Update this as priorities shift. Claude uses this to help drive work in the right direction._
