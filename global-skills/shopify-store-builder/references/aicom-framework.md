# AI Com Academy — Website Build Framework
**Source:** AI Com Website Build transcript (video lessons) + Scale DTC course  
**Extracted for:** Claude Code workspace reference — do not modify this file

---

## CORE PRINCIPLES (direct from transcript)

1. **Sell the result, not the product.** "When you're selling something, you're not selling the product. You're selling the end result. You don't want to sell features. You want to sell benefits."

2. **Go off what's already working first.** "You can just go off of what is working for the top competitors. If you do want to do your own thing, take what they did, throw it into ChatGPT, and let it flip around."

3. **Strict layout — don't improvise.** "There is a strict layout that I follow for all these pages." — Deviating from proven layout costs conversions.

4. **Compare-at price creates instant sale perception.** "This makes it seem like our product is on sale. The psychology is immediate."

5. **Benefits must be short + strong.** "Keep bullet points under 5 words. All on one line. Extremely strong. Really sell the main points."

6. **Shop Pay = keep for higher-ticket items.** "For cheaper products, you don't want this on your screen — it clutters. For more expensive products, I'd actually keep it." (keep at $79+)

7. **Trust icons under buy button are non-negotiable.** "These are things I've spent a lot of money and time testing. They make the biggest difference."

8. **Single review under ATC converts.** "When it looks like a social media picture, it performs better." Place 1 review with photo directly below trust icons.

9. **Collapsible rows reduce cognitive load.** For How It Works, Shipping, Materials — don't show everything upfront. Let them expand.

10. **Video testimonials outperform static.** If UGC video is available, upload via Files → copy link → use in section. Real UGC beats polished assets in most DTC categories.

11. **Results slider / stats section.** "I'm just going to rip theirs. We're not designing this website to win an award — we're designing it to convert." Use competitor-validated stats frames; update with real data after launch.

12. **FAQ is product-specific, not store FAQ.** "This is specifically about the product itself — hitting the objections the customer might have."

13. **Offer > layout.** "In the next video, we're going to go super, super deep into creating the offer." Layout is the skeleton. The offer is what converts.

---

## PRODUCT SETUP SEQUENCE (Admin)

```
1. Clean title (short, no supplier junk)
2. Remove bad images → set featured image
3. Remove unnecessary variants
4. Set price + compare-at price (Bulk Edit → add Compare Price column)
5. Create custom product template in theme editor
6. Assign product to that template
7. Set Publishing → Online Store → Done
```

---

## ABOVE-FOLD HERO FORMULA

```
[Urgency / Social Proof line]        ← above title
[Product Title]                      ← sized to fit 1 line
[Price + Compare-at]                 ← always show the "sale"
[5 emoji bullets]                    ← 4–5 words max each
[Buy Button]                         ← single CTA
[Shipping line]                      ← below button
[3 trust icons]                      ← under button
[1 social review with photo]         ← directly below trust
```

---

## OFFER BUILDING PRINCIPLES (AI Com)

- "We want to build out an offer. Brand here gets it right — buy this and then you get all this stuff for free. That's super smart."
- Bundle structure: Main product + 3–4 free gifts + digital bonus
- Compare-at should reflect the total perceived value of everything bundled
- The offer makes the price feel like a deal — not the discount itself
- Label bonuses with their standalone value ("a $49 value, yours free")

---

## WHAT COACHES CHECK IN STORE REVIEW (AI Com — #store-reviews channel)

Based on transcript review notes:
- Above-fold section screenshot — does it communicate the promise clearly?
- Emoji benefits — are they strong? Benefit-focused? Under 5 words?
- Offer — is there a bundle or bonus structure?
- Images — clean, professional, or AI-generated? No supplier garbage
- Pricing — compare-at set? Is it believable?
- Trust — guarantee, reviews, shipping line present?
- FAQ — product-specific? Hitting real objections?
- Mobile — does it look good on phone?

---

## SCALE DTC COURSE INTEGRATION NOTES

**Meta Ads Analyzer (Claude Code / Replit):**
- Vibe-coded Node/Express app — analyze creative performance with AI
- Runs locally on port 5000 or on Replit
- Requires: META_ACCESS_TOKEN + GEMINI_API_KEY as environment secrets
- Init prompt: `npm install --include=dev && npm rebuild better-sqlite3 && PORT=5000 NODE_ENV=production DATABASE_URL=file:./dev.db npm start`
- Analyzes: asset type, messaging angle, hook tactic, funnel stage
- Kill/Scale logic: Top funnel = hook rate + CTR | Bottom funnel = ROAS + CPA

**Higgs field (AI Image Gen):**
- Used for product hero images, bundle flat lays, lifestyle shots
- Outputs go into Shopify product images (upload to Files, then set in product media)
- Critical asset: full bundle flat lay — justifies premium price point on first glance

**Apify (Research Scraping):**
- TikTok scraper: clockworks/free-tiktok-scraper — 100k users — $3/1000 videos
- Instagram scraper: apify/instagram-scraper — sort by reels — profile + keyword
- Transcript scraper: scrape-creators/tiktok-transcript-scraper
- Export to CSV → Google Sheets → feed to Gemini/Claude for VOC analysis

**Customer Research → Copy Workflow:**
1. Reddit Answers (pain amplifiers: "waste of money", "regret", "tried everything")
2. Export complaints → feed to Gemini gem or Claude
3. Outputs: pain points, dream outcome, insider language, hooks, avatar summary
4. Feed outputs into brand-pack.md as copy source for PDP sections
