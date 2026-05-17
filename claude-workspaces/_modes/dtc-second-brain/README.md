# Mode — DTC Second Brain

For building a self-organizing knowledge base per brand using Karpathy's `raw/` + `wiki/` + `outputs/` method.

## When to use this mode

- New brand that has 3+ months of data scattered across tools
- Existing brand that's growing past the point of holding everything in head
- Pre-launch when you have research, briefs, and competitor intel but no central place
- Whenever a strategic question requires data from 5+ sources

## What loads with this mode

Skills:
- `brand-brain-schema` — Canonical structure + cross-link rules
- `wiki-compiler` — The compile workflow (/compile-wiki)
- `monthly-health-check` — Audit + drift detection (/health-check)

Reference:
- `article-templates/` — Templates for each of the 6 wiki articles

## How to start

1. Decide which brand needs a brain (Pitsmith vs Abundria vs Cold Plunge)
2. Scaffold the folders: `mkdir -p raw/{ads,customers,competitors,brand,performance,notes} wiki outputs/{briefs,question-answers,health-checks}`
3. Drop 15-20 files into raw/ — real data, no organizing, no renaming
4. Type `/compile-wiki` to build the first wiki
5. Read `wiki/INDEX.md`
6. Start asking questions

## Anti-patterns to avoid

- Treating `wiki/` as something to hand-edit. Don't. Drop a file in `raw/notes/` and recompile.
- Adding ungrounded "industry knowledge" claims. Per Hallucination Protocol — wiki claims trace back to `raw/` or they don't go in.
- Letting the brain stale. If 60+ days have passed since last compile and raw/ has new files, recompile.
- Asking the same question repeatedly without saving the answer. Save → next compile picks it up.

## Outputs go to

- `wiki/` — Synthesized intelligence
- `outputs/briefs/` — Generated creative briefs
- `outputs/question-answers/` — Strategic Q&A
- `outputs/health-checks/` — Monthly audit reports
