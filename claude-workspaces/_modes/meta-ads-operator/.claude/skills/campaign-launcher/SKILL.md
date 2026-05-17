---
name: campaign-launcher
description: Use this skill when the user asks Claude to plan, structure, or launch a Meta ad campaign — from pre-launch brief through PAUSED ad creation via Meta Ads MCP. Encodes the AI Com Academy testing framework, ad set structure, and the coach-approval gates that govern Jake's launches.
---

# Campaign Launcher

**Purpose:** Translate strategy → executable Meta campaign structure following AI Com Academy testing framework.

---

## PRE-LAUNCH CHECKLIST

Before any campaign brief is written:

- [ ] Brand pack loaded
- [ ] Offer brief confirmed (price, bonuses, guarantee, expiration)
- [ ] At least 2 avatars defined (or 1 avatar + 2 angles)
- [ ] At least 3 hook concepts per avatar/angle (= 6-9 ads total minimum)
- [ ] Coach has reviewed strategy
- [ ] Store / PDP is launch-ready (run `launch-qa` skill if needed)
- [ ] Pixel and CAPI installed and firing
- [ ] Unit economics computed:
  - AOV: $X
  - Gross margin: Y%
  - Break-even CPA: $Z
  - Target ROAS: ratio

If any of these are missing → don't launch yet, list what's blocking.

---

## CAMPAIGN STRUCTURE TEMPLATE

```
Campaign: <Brand> | <Offer Name> | <Phase>
  Objective: Sales
  Budget: <coach-approved daily budget>
  Duration: <test period — typically 7 days minimum>

  Ad Set 1: <Avatar/Angle 1>
    Targeting: <Audience>
    Placements: <Auto or manual per coach>
    Ads:
      Ad 1: <Hook 1> — <Format>
      Ad 2: <Hook 2> — <Format>
      Ad 3: <Hook 3> — <Format>

  Ad Set 2: <Avatar/Angle 2>
    ...

  Ad Set 3: <Avatar/Angle 3>
    ...
```

---

## AVATAR/ANGLE → AD SET MAPPING

Each ad set isolates ONE variable so post-launch attribution is clean.

Examples:

**Palm Aura — three avatars:**
- Ad Set A: Crafters & Makers (knitters, ceramic artists, hand-intensive hobbies)
- Ad Set B: Remote Workers / Keyboard Athletes
- Ad Set C: 50+ Morning Stiffness sufferers

Each ad set gets 3-5 ads using hooks tailored to that avatar.

**Pit Smith — angles within one core avatar:**
- Ad Set A: "Clean grate, less scrubbing" (functional angle)
- Ad Set B: "Father's Day gift" (gifting angle)
- Ad Set C: "Pitmaster identity" (aspirational angle)

---

## HOOK QUALITY GATES

Before locking a hook for testing:

1. **Pattern interrupt OR curiosity OR pain-first OR proof-led.** Pick one. Don't blend.
2. **Reads in 3 seconds on mobile.** No second-line overflow on 375px.
3. **No saturated competitor phrasing.** Check via TrendTrack / GetHookd first.
4. **Compliant with Meta policies.** Especially for health (Palm Aura) — no cure claims, no medical-grade promises.
5. **Aligns with the avatar's Eugene Schwartz awareness level.** Problem-aware audience needs different hook than product-aware.

---

## META ADS MCP — LAUNCH SEQUENCE

When ready to launch via MCP:

```
1. ads_get_ad_accounts → confirm account access
2. ads_get_user_pages → confirm correct FB Page
3. ads_create_campaign (PAUSED)
   - Objective: OUTCOME_SALES
   - Status: PAUSED
4. For each ad set:
   a. ads_create_ad_set (PAUSED)
      - Targeting per spec
      - Budget per spec
      - Placement per coach guidance
   b. For each ad:
      ads_create_creative → ads_create_ad (PAUSED)
5. Verify all entities created
6. Report structure back to Jake
7. Wait for explicit "activate" before any ads_activate_entity call
```

**NEVER** create campaigns/ad sets/ads in non-PAUSED state from this skill. Activation is a separate, explicit action.

---

## HANDOFF TO POST-LAUNCH

Once a campaign is live, switch to `post-launch-analysis` skill for Day 3 / 7 / 14 reviews.
