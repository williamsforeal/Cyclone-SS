# CLAUDE.md Schema Template

Use this template when generating the CLAUDE.md schema file for a new DTC Brand Brain. Customize the bracketed sections based on the user's answers to the setup questions.

## Template Content

```markdown
# DTC Brand Brain — [Brand Name]

## What This Is

A personal knowledge base for [Brand Name], built and maintained by Claude. This is where every piece of information about the brand lives — ads, customers, competitors, performance data, strategy notes, and brand guidelines.

The goal is simple: instead of hunting through Google Drive, Notion, Slack, and 12 different spreadsheets, ask the knowledge base and get a grounded answer in seconds.

## The Brand

**Brand Name:** [Brand Name]
**Products:** [Product list]
**Target Customer:** [Customer description]

## How It's Organized

This knowledge base follows Andrej Karpathy's LLM knowledge base methodology, adapted for DTC operators.

### Folder Rules

- **raw/** contains unprocessed source material. NEVER modify these files. This is the junk drawer where everything lives in its original form.
  - `raw/ads/` — ad exports, creative files, performance CSVs from Meta/Google/TikTok
  - `raw/customers/` — reviews, survey responses, customer interviews, support tickets
  - `raw/competitors/` — competitor ad screenshots, landing pages, messaging notes
  - `raw/brand/` — brand guidelines, voice docs, positioning statements
  - `raw/performance/` — weekly/monthly reports, analytics exports
  - `raw/notes/` — meeting notes, strategy docs, random ideas

- **wiki/** contains the organized knowledge base. Claude maintains this entirely. Rarely edit by hand — add notes to `raw/notes/` instead and let Claude incorporate them.

- **outputs/** contains generated reports, Q&A answers, and analyses. Save useful outputs here so they compound into future queries.

### Wiki Rules

- Every topic gets its own .md file in `wiki/`
- Every wiki file starts with a one-paragraph summary at the top
- Link related topics using `[[topic-name]]` format
- Maintain `INDEX.md` in `wiki/` as the master index — every article listed with a one-line description
- Every claim in the wiki must be traceable to a source file in `raw/`
- When new raw sources are added, update the relevant wiki articles — don't just create new ones

## My Strategic Questions

These are the questions I most often want to answer using this knowledge base. Keep these in mind when compiling and updating the wiki.

1. [Question 1 — e.g., "Which hooks are actually working right now?"]
2. [Question 2 — e.g., "What customer objections come up most often in reviews?"]
3. [Question 3 — e.g., "Where are my competitors winning and where are they weak?"]
4. [Question 4 — e.g., "Why did CPA spike last week?"]
5. [Question 5 — e.g., "What angles haven't I tested yet?"]

## My Interests

The knowledge base should focus on:

- Creative performance and what makes ads work for this brand specifically
- Customer language — the exact words customers use to describe their problems and desired outcomes
- Competitor intelligence — what's working for other brands in the category and why
- Brand voice consistency — every piece of creative should match the brand's actual voice
- Performance patterns — trends across campaigns, not just single-week metrics

## Health Check Schedule

Run a monthly health check on the first of every month. The health check:

- Flags contradictions between articles
- Finds topics mentioned but never explained
- Lists any claims not backed by a source in `raw/`
- Suggests new article candidates based on gaps
- Imputes missing data with web search where appropriate
```
