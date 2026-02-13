# Abundria Creative Intelligence — Vertex AI Knowledge Base
# Upload Instructions for Google Cloud Data Store

## Structure (15 files, 5 folders)

```
vertex-knowledge-base/
├── 01_Brand_OS/
│   ├── tone-guidelines.md          # Voice, visual rules, creative constraints
│   └── compliance-blacklist.json   # Banned/approved medical terminology
├── 02_Product_Intelligence/
│   ├── palmaura-specs.md           # Full product spec, UMP, UMS, offer stack
│   └── six-beliefs.json            # 6 pre-purchase beliefs framework
├── 03_Psychographic_Mapping/
│   ├── avatar-desk-warrior.md      # 25-45, remote workers, RSI fear
│   ├── avatar-stubborn-provider.md # 35-55, manual labor, pride-driven
│   ├── avatar-aging-independent.md # 55+, women, arthritis, independence
│   └── avatar-creator-gamer.md     # 18-35, gamers/creators, RSI
├── 04_Creative_Frameworks/
│   ├── static-visual-matrix.md     # 4 ad formats (X-Ray, Waffle, Comparison, Identity Mirror)
│   ├── copy-formulas.md            # PAS, Us vs Them, StoryBrand, AIDA + hook library
│   ├── ad-type-templates.json      # Airtable Ad Type mapping + field schema
│   ├── visual-qa-rubric.md         # Visual QA scoring criteria for generated + competitor ads
│   └── creative-diagnosis-framework.md  # How to deconstruct winning ads → learned concepts
└── 05_Market_Intelligence/
    ├── competitor-analysis.md      # Lunix, Breo, Comfier, Bob & Brad teardowns
    ├── learned-concepts.json       # Running library of extracted creative insights
    └── winning-ads/
        └── winner-template.json    # Schema for documenting winning ads
```

## Upload Steps

### Option A: Google Cloud Console (GUI)
1. Go to Cloud Storage → Create Bucket → name: `abundria-creative-kb`
2. Upload all 5 folders maintaining structure
3. Go to Vertex AI → Agent Builder → Data Stores → Create
4. Name: `abundria-creative-kb`
5. Type: Unstructured documents
6. Source: Cloud Storage → select your bucket
7. Wait for indexing (~5-10 minutes)

### Option B: gsutil CLI (from Cloud Shell)
```bash
# Create bucket
gsutil mb -l us-central1 gs://abundria-creative-kb

# Upload all files
gsutil -m cp -r vertex-knowledge-base/* gs://abundria-creative-kb/

# Verify
gsutil ls -r gs://abundria-creative-kb/
```

### Option C: From local machine with gcloud CLI
```bash
gcloud storage cp -r ./vertex-knowledge-base/* gs://abundria-creative-kb/
```

## After Upload: Connect to Agent

1. In Vertex AI Agent Builder → your agent → Tools → Add Data Store
2. Select `abundria-creative-kb`
3. Enable "Grounding with own data"
4. Test with: "Generate an ad concept for Desk Warrior, Problem Aware, Pain angle"
5. Agent should retrieve relevant avatar + visual matrix + copy formula docs

## Visual Analysis Layer (NEW)

The `visual-qa-rubric.md` and `creative-diagnosis-framework.md` power the agent's ability to:
- **Analyze competitor ads** from Meta Ad Library via Gemini Vision
- **Score generated images** before they go to Airtable
- **Extract learned concepts** from winning ads automatically

These feed the `learned-concepts.json` library which grows over time as new winning patterns are identified.

## Metadata Tags (for Vertex AI Vector Search)
Each file contains header comments with metadata tags:
- `entity_type`: avatar | product | competitor | framework | compliance
- `content_type`: strategy | copy_template | visual_directive | compliance_rule | market_data
- `avatar_tags`: desk_warrior | stubborn_provider | aging_independent | creator_gamer

These can be extracted into structured metadata when migrating to Vertex AI Vector Search for hybrid semantic + keyword filtering.
