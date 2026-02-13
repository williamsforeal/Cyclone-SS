# Meta Ads Spy - Student Setup Guide

## Quick Start (5 minutes)

### Step 1: Upload to Replit
1. Go to [replit.com](https://replit.com) and sign in
2. Click **+ Create Repl**
3. Select **Import from ZIP**
4. Upload the `meta-ads-spy-replit.zip` file
5. Name your project (e.g., "meta-ads-spy")
6. Click **Import**

### Step 2: Add Your API Keys
You need two API keys to use all features:

#### Apify API Key (for scraping ads)
1. Go to [apify.com](https://apify.com) and create a free account
2. Click your profile icon → **Settings** → **Integrations**
3. Copy your **Personal API Token**

#### Gemini API Key (for AI analysis)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API Key**
4. Copy the generated key

#### Add Keys to Replit
1. In your Replit project, click the **Secrets** tool (lock icon) in the left sidebar
2. Add two secrets:
   - Key: `APIFY_TOKEN` → Value: *paste your Apify token*
   - Key: `GEMINI_API_KEY` → Value: *paste your Gemini key*

### Step 3: Run the App
1. Click the green **Run** button at the top
2. Wait for the server to start (you'll see "Meta Ad Library Monitor running")
3. Click the URL in the Webview panel to open your app

---

## Features Overview

### Getting Started — Scrape Your First Ads
The app comes pre-loaded with 55 DTC brands but no ads yet. Your first step is to scrape some ads:
1. Select a brand from the dropdown
2. Click the **Scrape** button
3. Wait ~30 seconds for the scrape to complete
4. Ad images are automatically downloaded and stored locally in your project

### Browsing Ads
Once you've scraped some ads, you can:
- **Filter by brand**: Use the dropdown to select one or multiple brands
- **Filter by media type**: Show only videos or images
- **Sort ads**: Top Ranked (by impressions), Newest First, or Oldest First
- **View ad details**: Click any ad card to see full details and the original Meta Ad Library link

### Bookmarking Ads
- Click the bookmark icon on any ad to save it for later
- Bookmarked ads are protected and won't be deleted when you re-scrape
- Filter to show only bookmarked ads using the bookmark toggle

### AI Analysis
Analyze ads to automatically tag them with:
- **Asset Type**: UGC, Founder, Product Demo, Lifestyle, etc.
- **Visual Format**: Single image, Carousel, Video testimonial, etc.
- **Messaging Angle**: Problem/Solution, Social Proof, FOMO, etc.
- **Hook Tactic**: Question, Bold Claim, Curiosity Gap, etc.
- **Offer Type**: Discount, Free Shipping, Bundle, etc.

**To analyze ads:**
1. Click "Analyze New" button in the header (shows count of unanalyzed ads)
2. Or click "Analyze" on individual ad cards
3. Use AI tag filters to find ads by category

### Scraping New Ads
**Scrape a single brand:**
1. Select a brand from the dropdown
2. Click the **Scrape** button
3. Wait for scraping to complete (~30 seconds per brand)

**Scrape all brands:**
1. Click **Scrape All** in the header
2. Confirm in the modal
3. This processes all 55 brands sequentially (takes ~30 minutes)

### Scheduled Weekly Scrapes
Set up automatic scraping to keep your ad library fresh:
1. Click the **Settings** gear icon
2. Toggle **Enable Weekly Scrape**
3. Select day and time
4. Optionally enable **Auto-analyze new ads**
5. Click **Save**

---

## Managing Brands

### Add a New Brand
1. Find the brand's Facebook page
2. Go to Meta Ad Library: `facebook.com/ads/library`
3. Search for the brand and click their page
4. Copy the URL (it contains the page ID)
5. Click **+ Add Brand** in the app
6. Enter the brand name and paste the URL

### Remove a Brand
1. Select the brand from the dropdown
2. Click the **Delete** button (trash icon)
3. Confirm deletion

---

## Cost Information

### Apify (Scraping)
- Free tier: $5/month in credits
- Cost: ~$0.005 per ad scraped (20 ads fetched per brand)
- One full scrape of 55 brands ≈ $0.55

### Gemini (AI Analysis)
- Free tier: 60 requests per minute
- Analyzing all 600 ads is free within rate limits

---

## Troubleshooting

### "Failed to scrape" error
- Check your Apify API key is correct in Secrets
- Verify you have Apify credits remaining
- The brand's Facebook page URL may have changed

### "Failed to analyze" error
- Check your Gemini API key is correct in Secrets
- You may have hit the rate limit - wait a minute and try again

### App won't start
- Make sure both Secrets are added (even if you only want to browse)
- Check the Console tab for error messages
- Try clicking **Stop** then **Run** again

### Ads not loading
- **Disable ad blockers** - Ad blockers can interfere with the app's API calls. Try disabling your ad blocker for the Replit domain.
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Check that the server is running (green "Run" button)

---

## Testing Your Setup

1. **Test scraping**: Select a brand, click Scrape, verify ads appear with images
2. **Test browsing**: Filter by brand, sort, and verify ads display correctly
3. **Test bookmarking**: Click bookmark on an ad, refresh, verify it's still bookmarked
4. **Test AI analysis**: Click "Analyze" on one ad, verify tags appear

---

## Questions?
Reach out to your instructor if you run into issues not covered here.
