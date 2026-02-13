# Meta Ad Library Monitor

Monitor top-performing Facebook ads for 100+ DTC brands, sorted by impressions.

## What It Does

1. **Track Brands** - Add DTC brands with their Facebook Page URLs
2. **Scrape Ads** - Fetch top 10 ads sorted by impressions from Meta Ad Library
3. **AI Analysis** - Analyze ad creatives with Gemini AI (format, hook, style, angle)
4. **Evergreen Tracking** - Identify ads that stay in Top 10 for 4+ weeks
5. **Analytics** - View performance by vertical and track trends over time

## Quick Start

1. Click "Use Template" (or import the zip)
2. Add your API keys in the Secrets tab:
   - `APIFY_TOKEN` - Get from [apify.com](https://apify.com)
   - `GEMINI_API_KEY` - Get from [ai.google.dev](https://ai.google.dev)
3. Click "Run"
4. Your tool is live!

**Note:** The app works with realistic mock data if you don't add API keys.

## Features

### Brand Management
- Add brands with Facebook Page URL
- Auto-resolve Page IDs from vanity URLs
- Organize brands by vertical (Apparel, Health, Beauty, etc.)
- Bulk import brands via JSON

### Ad Vault
- View all scraped ads in a grid layout
- Filter by brand, vertical, format, and duration
- See weeks in Top 10 at a glance
- Click any ad for detailed view + AI analysis

### Evergreen Winners
- Automatically track ads that stay in Top 10 for 4+ weeks
- Filter by minimum weeks (4, 8, 12+)
- Identify proven winning creatives

### AI Analysis
Each ad is analyzed for:
- **Format** - UGC, Polished Studio, Static Graphic, Meme
- **Hook** - Description of the first 3 seconds
- **Visual Style** - e.g., "Green screen talking head"
- **Angle** - Psychological lever (Social Proof, FOMO, Problem/Solution)

### Analytics Dashboard
- Total brands and ads tracked
- Evergreen ad count
- Average weeks in Top 10
- Performance breakdown by vertical

## How It Works

### The "Impression Sort" Logic

The Meta Ad Library now supports sorting by impressions. We construct URLs like:

```
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id={{PAGE_ID}}&sort_data[direction]=desc&sort_data[mode]=imp
```

Key parameter: `sort_data[mode]=imp` shows highest impression ads first.

### Page ID Resolution

The Meta Ad Library requires numeric Page IDs, not vanity URLs. The app:
1. Fetches the Facebook page
2. Extracts `pageID` from HTML/meta tags
3. Stores it for future scrapes

### Weekly Tracking

- Each scrape records the current Top 10
- Existing ads get their `weeks_in_top10` incremented
- New ads are added to the vault
- Weekly snapshots enable trend analysis

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brands` | GET | List all brands |
| `/api/brands` | POST | Add a new brand |
| `/api/brands/:id` | PUT | Update a brand |
| `/api/brands/:id` | DELETE | Remove a brand |
| `/api/brands/:id/resolve-page-id` | POST | Auto-resolve Page ID |
| `/api/ads` | GET | List ads (with filters) |
| `/api/ads/:id` | GET | Get single ad details |
| `/api/ads/:id/analyze` | POST | Run AI analysis |
| `/api/scrape/brand/:id` | POST | Scrape single brand |
| `/api/scrape/all` | POST | Scrape all brands |
| `/api/analytics/evergreen` | GET | Get evergreen ads |
| `/api/analytics/by-vertical` | GET | Stats by vertical |
| `/api/import/brands` | POST | Bulk import brands |
| `/api/export/ads` | GET | Export all ads as JSON |

## File Structure

```
├── server.js          # Main application logic
├── views/
│   └── index.html     # Single-page app UI
├── db/
│   └── meta_ads.db    # SQLite database (auto-created)
├── package.json       # Dependencies
├── .replit            # Replit configuration
└── replit.nix         # Environment setup
```

## Database Schema

### brands
- `id`, `brand_name`, `website_url`, `fb_page_url`
- `page_id` - Numeric Meta Page ID
- `vertical` - Business category
- `status`, `last_scraped`, timestamps

### ad_vault
- `id`, `ad_id` (unique Meta ad identifier)
- `brand_id`, `date_scraped`, `rank`
- `creative_type`, `creative_url`, `ad_copy`, `headline`, `cta_type`
- AI fields: `ai_format`, `ai_hook`, `ai_visual_style`, `ai_angle`
- Tracking: `first_seen`, `last_seen`, `weeks_in_top10`

### weekly_snapshots
- Historical record of which ads were in Top 10 each week

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APIFY_TOKEN` | Yes* | Apify API token for live scraping |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key for AI analysis |
| `META_AD_SCRAPER_ID` | No | Custom Apify actor ID |
| `PORT` | No | Server port (default: 5000) |

*App runs in demo mode with mock data if not provided

## Customization

### Change AI Analysis Prompts
Edit `analyzeAdCreative()` in `server.js` to modify what Gemini analyzes.

### Add More Verticals
Update the `brandVertical` select options in `views/index.html`.

### Modify Database Schema
Update `initDatabase()` in `server.js` and restart.

### Schedule Weekly Scrapes
Add node-cron scheduling:

```javascript
const cron = require('node-cron');

// Run every Monday at 4:00 AM
cron.schedule('0 4 * * 1', async () => {
  // Trigger /api/scrape/all
});
```

## Developer Notes

1. **Anti-Scraping**: Meta Ad Library can be aggressive with anti-bot measures. Apify's residential proxies help.

2. **CDN Expiration**: Meta's creative URLs expire. Consider uploading to persistent storage (S3, Cloudinary).

3. **Rate Limiting**: Add delays between brand scrapes to avoid blocks.

4. **Page ID Changes**: Facebook pages rarely change IDs, but re-resolve if scrapes fail.

---

Built for DTC marketers and creative strategists who want to monitor winning Facebook ads.
