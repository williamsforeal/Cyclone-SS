/**
 * Meta Ad Library Monitor
 *
 * Monitor top-performing Facebook ads for DTC brands, sorted by impressions.
 * Scrapes Meta Ad Library weekly, analyzes creatives with Gemini AI.
 *
 * CUSTOMIZATION GUIDE:
 * - To change AI analysis prompts, edit analyzeAdCreative()
 * - To add new fields, update the database schema in initDatabase()
 * - To modify the UI, edit views/index.html
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ============================================
// DATABASE SETUP
// ============================================
const db = new Database('./db/meta_ads.db');
db.pragma('foreign_keys = OFF');

function initDatabase() {
  db.exec(`
    -- Brands: DTC brands we're monitoring
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      website_url TEXT,
      fb_page_url TEXT NOT NULL,
      page_id TEXT,
      vertical TEXT,
      status TEXT DEFAULT 'active',
      last_scraped DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ad Vault: Top ads collected from each brand
    CREATE TABLE IF NOT EXISTS ad_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id TEXT UNIQUE NOT NULL,
      brand_id INTEGER REFERENCES brands(id),
      date_scraped DATE NOT NULL,
      rank INTEGER,
      creative_type TEXT,
      creative_url TEXT,
      stored_creative_url TEXT,
      ad_copy TEXT,
      headline TEXT,
      cta_type TEXT,
      start_date DATE,
      ad_library_link TEXT,
      video_url TEXT,
      -- AI Analysis fields
      ai_format TEXT,
      ai_hook TEXT,
      ai_visual_style TEXT,
      ai_angle TEXT,
      ai_raw_response TEXT,
      -- Tracking
      first_seen DATE,
      last_seen DATE,
      weeks_in_top10 INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Scrape Jobs: Track async scraping operations
    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_type TEXT NOT NULL,
      brand_id INTEGER REFERENCES brands(id),
      status TEXT DEFAULT 'pending',
      apify_run_id TEXT,
      input_params TEXT,
      results TEXT,
      result_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- Weekly Snapshots: Track which ads were in top 10 each week
    CREATE TABLE IF NOT EXISTS weekly_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER REFERENCES brands(id),
      ad_id TEXT REFERENCES ad_vault(ad_id),
      week_start DATE NOT NULL,
      rank INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(brand_id, ad_id, week_start)
    );

    -- Indexes for faster lookups
    CREATE INDEX IF NOT EXISTS idx_brands_page_id ON brands(page_id);
    CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_brand_id ON ad_vault(brand_id);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_ad_id ON ad_vault(ad_id);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_last_seen ON ad_vault(last_seen);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON scrape_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_snapshots_week ON weekly_snapshots(week_start);

    -- Settings: App configuration
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add video_url column if it doesn't exist
  try {
    db.exec(`ALTER TABLE ad_vault ADD COLUMN video_url TEXT`);
    console.log('Added video_url column to ad_vault table');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Add new AI tag columns (expanded taxonomy)
  const newAiColumns = [
    'ai_asset_type TEXT',      // UGC, High Production, Static Image, Animation
    'ai_visual_format TEXT',   // Talking head, Product demo, Unboxing, Split screen, etc.
    'ai_messaging_angle TEXT', // Problem/Solution, Social proof, FOMO, Aspiration, etc.
    'ai_hook_tactic TEXT',     // Pattern interrupt, Question, Bold claim, Curiosity, etc.
    'ai_offer_type TEXT'       // Percentage off, Free shipping, BOGO, Free trial, No offer
  ];

  for (const colDef of newAiColumns) {
    try {
      db.exec(`ALTER TABLE ad_vault ADD COLUMN ${colDef}`);
      console.log(`Added ${colDef.split(' ')[0]} column to ad_vault table`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  // Migration: Add bookmarked column
  try {
    db.exec(`ALTER TABLE ad_vault ADD COLUMN bookmarked INTEGER DEFAULT 0`);
    console.log('Added bookmarked column to ad_vault table');
  } catch (e) {
    // Column already exists, ignore
  }
}

initDatabase();

// Ensure creatives directory exists for local image storage
fs.mkdirSync(path.join(__dirname, 'public', 'creatives'), { recursive: true });

// Clean up orphaned data on startup
function cleanupOrphanedData() {
  try {
    // Delete ads that reference non-existent brands
    const orphanedAds = db.prepare(`
      DELETE FROM ad_vault
      WHERE brand_id NOT IN (SELECT id FROM brands)
    `).run();

    // Delete weekly snapshots that reference non-existent brands
    const orphanedSnapshots = db.prepare(`
      DELETE FROM weekly_snapshots
      WHERE brand_id NOT IN (SELECT id FROM brands)
    `).run();

    // Delete scrape jobs that reference non-existent brands
    const orphanedJobs = db.prepare(`
      DELETE FROM scrape_jobs
      WHERE brand_id NOT IN (SELECT id FROM brands)
    `).run();

    const totalCleaned = orphanedAds.changes + orphanedSnapshots.changes + orphanedJobs.changes;
    if (totalCleaned > 0) {
      console.log(`Cleaned up orphaned data: ${orphanedAds.changes} ads, ${orphanedSnapshots.changes} snapshots, ${orphanedJobs.changes} jobs`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

cleanupOrphanedData();

// ============================================
// SCHEDULED SCRAPING
// ============================================
let scheduledTask = null;

function getSetting(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(key, value);
}

function getScheduleSettings() {
  return {
    enabled: getSetting('schedule_enabled', 'false') === 'true',
    day: getSetting('schedule_day', '1'), // 0=Sunday, 1=Monday, etc.
    hour: getSetting('schedule_hour', '6'), // Hour of day (0-23)
    autoAnalyze: getSetting('auto_analyze', 'false') === 'true'
  };
}

function setupScheduledScrape() {
  // Cancel existing scheduled task if any
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  const settings = getScheduleSettings();
  if (!settings.enabled) {
    console.log('Scheduled scraping is disabled');
    return;
  }

  // Create cron expression: minute hour * * dayOfWeek
  // Run at the specified hour on the specified day
  const cronExpression = `0 ${settings.hour} * * ${settings.day}`;

  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Starting scheduled weekly scrape...');
    try {
      await runScheduledScrapeAll();
    } catch (error) {
      console.error('Scheduled scrape failed:', error);
    }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  console.log(`Scheduled scraping enabled: ${days[settings.day]} at ${settings.hour}:00`);
}

async function runScheduledScrapeAll() {
  const settings = getScheduleSettings();

  // Get all active brands with page IDs
  const brands = db.prepare(`
    SELECT * FROM brands WHERE status = 'active' AND page_id IS NOT NULL AND page_id != ''
  `).all();

  if (brands.length === 0) {
    console.log('No brands to scrape');
    return;
  }

  console.log(`Starting scheduled scrape for ${brands.length} brands...`);

  let successCount = 0;
  let errorCount = 0;

  for (const brand of brands) {
    try {
      console.log(`Scraping ${brand.brand_name}...`);

      // Start the scrape job
      const jobResult = await startAdLibraryScrape(brand);

      if (jobResult.apifyRunId) {
        // Poll until complete
        let status = 'RUNNING';
        while (status === 'RUNNING' || status === 'READY') {
          await new Promise(resolve => setTimeout(resolve, 5000));
          status = await pollApifyJob(jobResult.apifyRunId);
        }

        if (status === 'SUCCEEDED') {
          // Get and process results
          const results = await getApifyResults(jobResult.apifyRunId);
          const transformed = transformApifyResults(results, brand.id);

          // Store ads (reuse existing logic)
          for (const ad of transformed) {
            try {
              // Download creative image locally
              const storedUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);

              db.prepare(`
                INSERT OR REPLACE INTO ad_vault
                (ad_id, brand_id, date_scraped, rank, creative_type, creative_url, stored_creative_url, ad_copy, headline, cta_type, start_date, ad_library_link, first_seen, last_seen, weeks_in_top10, video_url)
                VALUES (?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT first_seen FROM ad_vault WHERE ad_id = ?), date('now')), date('now'), COALESCE((SELECT weeks_in_top10 FROM ad_vault WHERE ad_id = ?), 0) + 1, ?)
              `).run(
                ad.ad_id, brand.id, ad.rank, ad.creative_type, ad.creative_url, storedUrl,
                ad.ad_copy, ad.headline, ad.cta_type, ad.start_date, ad.ad_library_link,
                ad.ad_id, ad.ad_id, ad.video_url
              );
            } catch (e) {
              // Ignore duplicate errors
            }
          }

          successCount++;
          console.log(`Scraped ${brand.brand_name}: ${transformed.length} ads`);
        } else {
          errorCount++;
          console.error(`Scrape failed for ${brand.brand_name}: ${status}`);
        }
      }

      // Delay between brands
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      errorCount++;
      console.error(`Failed to scrape ${brand.brand_name}:`, error.message);
    }
  }

  console.log(`Scheduled scrape complete: ${successCount} succeeded, ${errorCount} failed`);

  // Auto-analyze if enabled
  if (settings.autoAnalyze) {
    console.log('Starting auto-analysis of new ads...');
    await runBatchAnalysis();
  }
}

async function runBatchAnalysis() {
  const unanalyzedAds = db.prepare(`
    SELECT * FROM ad_vault
    WHERE ai_asset_type IS NULL OR ai_asset_type = ''
    ORDER BY created_at DESC
  `).all();

  if (unanalyzedAds.length === 0) {
    console.log('No unanalyzed ads found');
    return;
  }

  console.log(`Analyzing ${unanalyzedAds.length} ads...`);

  let analyzed = 0;
  for (const ad of unanalyzedAds) {
    try {
      const analysis = await analyzeAdCreative(ad);

      db.prepare(`
        UPDATE ad_vault
        SET ai_asset_type = ?, ai_visual_format = ?, ai_messaging_angle = ?,
            ai_hook_tactic = ?, ai_offer_type = ?,
            ai_raw_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        analysis.asset_type,
        analysis.visual_format,
        analysis.messaging_angle,
        analysis.hook_tactic,
        analysis.offer_type,
        JSON.stringify(analysis),
        ad.id
      );

      analyzed++;
      if (analyzed % 10 === 0) {
        console.log(`Analyzed ${analyzed}/${unanalyzedAds.length} ads`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`Failed to analyze ad ${ad.id}:`, err.message);
    }
  }

  console.log(`Auto-analysis complete: ${analyzed} ads analyzed`);
}

// Initialize scheduled scraping on startup
setupScheduledScrape();

// ============================================
// CONFIGURATION
// ============================================
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Apify actor for Meta Ad Library scraping
const META_AD_SCRAPER_ID = 'JJghSZmShuco4j9gJ';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function buildAdLibraryUrl(pageId) {
  // Construct URL that shows ads sorted by impressions (high to low)
  // Using the exact format Meta uses - not URL encoding the brackets
  return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=${pageId}`;
}

function isVideoFileUrl(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

async function downloadCreativeImage(adId, imageUrl) {
  if (!imageUrl || isVideoFileUrl(imageUrl)) return null;

  try {
    const creativesDir = path.join(__dirname, 'public', 'creatives');
    fs.mkdirSync(creativesDir, { recursive: true });

    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png'
              : contentType.includes('webp') ? 'webp'
              : contentType.includes('gif') ? 'gif'
              : 'jpg';

    const filename = `${adId}.${ext}`;
    const filepath = path.join(creativesDir, filename);

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    return `/creatives/${filename}`;
  } catch (error) {
    console.error(`Failed to download image for ad ${adId}:`, error.message);
    return null;
  }
}

// ============================================
// PAGE ID RESOLUTION
// ============================================

async function resolvePageId(fbPageUrl) {
  // Try to extract page ID from Facebook page URL
  // Method 1: Direct fetch and parse HTML for pageID
  try {
    const response = await fetch(fbPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // Try various patterns to find page ID
    const patterns = [
      /"pageID":"(\d+)"/,
      /page_id=(\d+)/,
      /"page_id":"(\d+)"/,
      /fb:\/\/page\/(\d+)/,
      /"entity_id":"(\d+)"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Page ID resolution error:', error);
    return null;
  }
}

// ScrapeCreators API for resolving page IDs by company name
const SCRAPECREATORS_API_KEY = process.env.SCRAPECREATORS_API_KEY || '';

async function resolvePageIdByName(brandName) {
  try {
    const response = await fetch(
      `https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(brandName)}`,
      {
        headers: {
          'x-api-key': SCRAPECREATORS_API_KEY
        }
      }
    );

    const data = await response.json();

    if (!data.success || !data.searchResults || data.searchResults.length === 0) {
      return null;
    }

    // Find the best match - prefer verified pages with most likes
    const results = data.searchResults;

    // First try to find a BLUE_VERIFIED result
    const verified = results.find(r => r.verification === 'BLUE_VERIFIED');
    if (verified) {
      return verified.page_id;
    }

    // Otherwise return the first result (usually highest relevance)
    return results[0].page_id;
  } catch (error) {
    console.error('ScrapeCreators API error:', error);
    return null;
  }
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

function getMockBrands() {
  return [
    { id: 1, brand_name: 'Gymshark', website_url: 'https://gymshark.com', fb_page_url: 'https://facebook.com/Gymshark', page_id: '269498423082199', vertical: 'Apparel', status: 'active' },
    { id: 2, brand_name: 'MVMT', website_url: 'https://mvmt.com', fb_page_url: 'https://facebook.com/mvmtwatches', page_id: '485188501530691', vertical: 'Accessories', status: 'active' },
    { id: 3, brand_name: 'Allbirds', website_url: 'https://allbirds.com', fb_page_url: 'https://facebook.com/allbirds', page_id: '1610766509216498', vertical: 'Footwear', status: 'active' }
  ];
}

function getMockAds(brandId, count = 10) {
  const mockAds = [];
  const ctaTypes = ['Shop Now', 'Learn More', 'Sign Up', 'Get Offer', 'Buy Now'];
  const formats = ['UGC', 'Polished Studio', 'Static Graphic', 'Meme', 'Carousel'];
  const styles = ['Green screen talking head', 'ASMR unboxing', 'Before/After split', 'Product showcase', 'Lifestyle shot'];
  const angles = ['Social Proof', 'FOMO', 'Problem/Solution', 'Aspiration', 'Value Proposition'];

  const today = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysAgo);

    mockAds.push({
      ad_id: `mock_ad_${brandId}_${Date.now()}_${i}`,
      brand_id: brandId,
      rank: i + 1,
      creative_type: Math.random() > 0.3 ? 'video' : 'image',
      creative_url: `https://picsum.photos/seed/ad${brandId}${i}/400/400`,
      ad_copy: `Discover why ${Math.floor(Math.random() * 100000) + 10000}+ customers love our product. Limited time offer - ${Math.floor(Math.random() * 50) + 10}% off your first order!`,
      headline: ['Transform Your Routine', 'The Wait Is Over', 'As Seen On TikTok', 'Best Seller Alert'][i % 4],
      cta_type: ctaTypes[i % ctaTypes.length],
      start_date: startDate.toISOString().split('T')[0],
      ai_format: formats[i % formats.length],
      ai_hook: 'Opens with bold text overlay and quick cuts',
      ai_visual_style: styles[i % styles.length],
      ai_angle: angles[i % angles.length],
      weeks_in_top10: Math.floor(Math.random() * 12) + 1
    });
  }

  return mockAds;
}

function getMockAdAnalysis() {
  // New expanded taxonomy
  const assetTypes = ['UGC', 'High Production', 'Static Image', 'Animation'];
  const visualFormats = ['Talking Head', 'Product Demo', 'Unboxing', 'Before/After', 'Text Overlay', 'Lifestyle', 'Testimonial Compilation'];
  const messagingAngles = ['Problem/Solution', 'Social Proof', 'FOMO', 'Aspiration', 'Value Proposition', 'Transformation'];
  const hookTactics = ['Pattern Interrupt', 'Question', 'Bold Claim', 'Curiosity Gap', 'Relatable Scenario', 'Text Hook'];
  const offerTypes = ['Percentage Off', 'Free Shipping', 'Free Gift', 'Bundle Deal', 'No Offer'];

  return {
    asset_type: assetTypes[Math.floor(Math.random() * assetTypes.length)],
    visual_format: visualFormats[Math.floor(Math.random() * visualFormats.length)],
    messaging_angle: messagingAngles[Math.floor(Math.random() * messagingAngles.length)],
    hook_tactic: hookTactics[Math.floor(Math.random() * hookTactics.length)],
    offer_type: offerTypes[Math.floor(Math.random() * offerTypes.length)],
    _mock: true
  };
}

// ============================================
// APIFY SCRAPING FUNCTIONS
// ============================================

async function startAdLibraryScrape(brand) {
  if (!APIFY_TOKEN) {
    console.log('No APIFY_TOKEN configured, using mock data');
    const mockAds = getMockAds(brand.id, 10);

    const job = db.prepare(`
      INSERT INTO scrape_jobs (job_type, brand_id, status, input_params, results, result_count, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run('ad_scrape', brand.id, 'complete', JSON.stringify({ page_id: brand.page_id }), JSON.stringify(mockAds), mockAds.length);

    return { jobId: job.lastInsertRowid, mock: true };
  }

  // Build Ad Library URL with impression sorting
  const adLibraryUrl = buildAdLibraryUrl(brand.page_id);

  // Configure input for the Meta Ad Library scraper actor (JJghSZmShuco4j9gJ)
  // Request 20 results to account for duplicates - we'll dedupe down to 10 unique ads
  // Cost: $5 per 1,000 ads on Apify Starter plan
  const input = {
    startUrls: [{ url: adLibraryUrl }],
    resultsLimit: 20,  // Fetch 20 to dedupe down to 10 (balance cost vs coverage)
    activeStatus: 'active'
  };

  console.log(`Starting Apify scrape for ${brand.brand_name} with URL: ${adLibraryUrl}`);

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${META_AD_SCRAPER_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Apify run started: ${data.data.id}`);

    const job = db.prepare(`
      INSERT INTO scrape_jobs (job_type, brand_id, apify_run_id, status, input_params)
      VALUES (?, ?, ?, ?, ?)
    `).run('ad_scrape', brand.id, data.data.id, 'running', JSON.stringify(input));

    return { jobId: job.lastInsertRowid, apifyRunId: data.data.id };
  } catch (error) {
    console.error('Apify scrape error:', error);

    const job = db.prepare(`
      INSERT INTO scrape_jobs (job_type, brand_id, status, input_params, error_message, completed_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run('ad_scrape', brand.id, 'error', JSON.stringify(input), error.message);

    return { jobId: job.lastInsertRowid, error: error.message };
  }
}

async function pollApifyJob(apifyRunId) {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${apifyRunId}?token=${APIFY_TOKEN}`
    );
    const data = await response.json();
    return data.data.status;
  } catch (error) {
    console.error('Poll error:', error);
    return 'FAILED';
  }
}

async function getApifyResults(apifyRunId) {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${apifyRunId}/dataset/items?token=${APIFY_TOKEN}`
    );
    return await response.json();
  } catch (error) {
    console.error('Get results error:', error);
    return [];
  }
}

// ============================================
// AI ANALYSIS FUNCTIONS (Gemini)
// ============================================

async function analyzeAdCreative(ad) {
  // Check if we already have the new expanded analysis
  if (ad.ai_asset_type && ad.ai_visual_format && ad.ai_messaging_angle && ad.ai_hook_tactic && ad.ai_offer_type) {
    return {
      asset_type: ad.ai_asset_type,
      visual_format: ad.ai_visual_format,
      messaging_angle: ad.ai_messaging_angle,
      hook_tactic: ad.ai_hook_tactic,
      offer_type: ad.ai_offer_type,
      // Keep legacy fields for backward compatibility
      format: ad.ai_format,
      hook: ad.ai_hook,
      visual_style: ad.ai_visual_style,
      angle: ad.ai_angle
    };
  }

  if (!GEMINI_API_KEY) {
    console.log('No GEMINI_API_KEY configured, using mock analysis');
    return getMockAdAnalysis();
  }

  const isVideo = ad.creative_type === 'video' && ad.video_url;

  // Expanded AI tagging prompt based on Motion's taxonomy
  const prompt = `Analyze this DTC ${isVideo ? 'video' : 'image'} ad creative. Return a JSON object with these 5 categories:

1. "asset_type": Choose ONE from: "UGC", "High Production", "Static Image", "Animation", "Screen Recording", "Stock Footage"

2. "visual_format": Choose ONE that best describes the visual format: "Talking Head", "Product Demo", "Unboxing", "Before/After", "Split Screen", "Text Overlay", "Lifestyle", "Testimonial Compilation", "Tutorial", "Behind the Scenes", "Product on White", "User Review", "Skit", "ASMR", "Green Screen"

3. "messaging_angle": Choose ONE primary messaging angle: "Problem/Solution", "Social Proof", "FOMO", "Aspiration", "Value Proposition", "Fear/Pain Point", "Curiosity", "Authority/Expert", "Comparison", "Transformation", "Humor", "Urgency", "Exclusivity", "Community"

4. "hook_tactic": Choose ONE hook tactic used in the first 3 seconds: "Pattern Interrupt", "Question", "Bold Claim", "Curiosity Gap", "Controversy", "Relatable Scenario", "Shocking Stat", "Direct Address", "Visual Surprise", "Sound Effect", "Text Hook", "Celebrity/Influencer", "Unboxing Reveal"

5. "offer_type": Choose ONE: "Percentage Off", "Dollar Amount Off", "Free Shipping", "BOGO", "Free Trial", "Free Gift", "Bundle Deal", "Subscribe & Save", "Limited Time", "No Offer"

Additional context from the ad:
- Ad copy: ${ad.ad_copy || 'N/A'}
- Headline: ${ad.headline || 'N/A'}
- CTA button: ${ad.cta_type || 'N/A'}

Return ONLY valid JSON with these 5 keys, no other text.`;

  try {
    const parts = [];

    if (isVideo) {
      // VIDEO ANALYSIS: Download and send video to Gemini
      try {
        console.log(`Fetching video for analysis: ${ad.video_url}`);
        const videoResponse = await fetch(ad.video_url);
        if (videoResponse.ok) {
          const videoBuffer = await videoResponse.arrayBuffer();
          const base64Video = Buffer.from(videoBuffer).toString('base64');
          const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

          // Check size - Gemini inline limit is 20MB
          const sizeInMB = videoBuffer.byteLength / (1024 * 1024);
          console.log(`Video fetched: ${sizeInMB.toFixed(2)} MB, type: ${contentType}`);

          if (sizeInMB < 20) {
            // Add video as inline data (per Gemini docs)
            parts.push({
              inlineData: {
                mimeType: contentType,
                data: base64Video
              }
            });
            console.log('Video added as inline data for analysis');
          } else {
            console.log('Video too large for inline, falling back to thumbnail');
            // Fall back to thumbnail image if video is too large
            if (ad.creative_url) {
              const imageResponse = await fetch(ad.creative_url);
              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString('base64');
                parts.push({
                  inlineData: {
                    mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
                    data: base64Image
                  }
                });
              }
            }
          }
        }
      } catch (videoError) {
        console.error('Failed to fetch video:', videoError.message);
        // Fall back to thumbnail
        if (ad.creative_url) {
          try {
            const imageResponse = await fetch(ad.creative_url);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              parts.push({
                inlineData: {
                  mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
                  data: Buffer.from(imageBuffer).toString('base64')
                }
              });
            }
          } catch (e) { /* ignore */ }
        }
      }
    } else {
      // IMAGE ANALYSIS: Download and send image to Gemini
      if (ad.creative_url) {
        try {
          console.log(`Fetching image for analysis: ${ad.creative_url}`);
          const imageResponse = await fetch(ad.creative_url);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

            parts.push({
              inlineData: {
                mimeType: contentType,
                data: base64Image
              }
            });
            console.log(`Image fetched successfully, size: ${base64Image.length} chars`);
          }
        } catch (imgError) {
          console.error('Failed to fetch image:', imgError.message);
        }
      }
    }

    // Add the text prompt after the media (per Gemini docs best practice)
    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No valid JSON in response');
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return getMockAdAnalysis();
  }
}

// ============================================
// AD PROCESSING FUNCTIONS
// ============================================

// Transform Apify actor results to our internal format
function transformApifyResults(apifyResults, brandId) {
  // Helper to extract text from various body formats
  const extractBodyText = (body) => {
    if (!body) return '';
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && body.text) return body.text;
    return '';
  };

  // Helper to extract media fingerprint from URL
  const getMediaFingerprint = (url) => {
    if (!url) return '';
    // Try to extract the unique file identifier from Facebook CDN URLs
    // URLs look like: https://scontent-xxx.fbcdn.net/v/t39.35426-6/123456789_987654321...
    const match = url.match(/\/(\d{10,}_\d+[^\/\?]*)/);
    if (match) return match[1];
    // Fallback: use last 150 chars which are more likely to be unique
    return url.slice(-150);
  };

  // First pass: dedupe by adArchiveID (remove exact duplicates)
  const seenIds = new Set();
  const uniqueById = apifyResults.filter(item => {
    const adId = item.adArchiveID || item.adArchiveId || item.adid;
    if (!adId) return true; // Keep items without ID
    if (seenIds.has(adId)) return false;
    seenIds.add(adId);
    return true;
  });
  console.log(`ID dedup: ${apifyResults.length} -> ${uniqueById.length} ads`);

  // Second pass: dedupe by media (same video/image = same creative, keep oldest)
  // Only group by media if we actually have a media URL
  const mediaGrouped = new Map();

  for (const item of uniqueById) {
    const snapshot = item.snapshot || {};

    // Get media fingerprint
    const firstVideo = snapshot.videos?.[0];
    const videoUrl = firstVideo?.video_hd_url || firstVideo?.video_sd_url || '';
    const firstImage = snapshot.images?.[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.resizedImageUrl || firstImage?.url || '');
    const mediaFingerprint = getMediaFingerprint(videoUrl || imageUrl);

    // Get start date for comparison (keep oldest)
    let startTimestamp = 0;
    if (item.startDateFormatted) {
      startTimestamp = new Date(item.startDateFormatted).getTime();
    } else if (typeof item.startDate === 'number') {
      startTimestamp = item.startDate * 1000;
    }

    // Only dedupe by media if we have a valid media fingerprint
    // Otherwise keep the ad as unique (don't dedupe by headline alone)
    if (mediaFingerprint) {
      const key = `media:${mediaFingerprint}`;
      const existing = mediaGrouped.get(key);
      if (!existing || (startTimestamp > 0 && startTimestamp < existing.startTimestamp)) {
        mediaGrouped.set(key, { item, startTimestamp });
      }
    } else {
      // No media - keep as unique (use adArchiveID or index as key)
      const adId = item.adArchiveID || item.adArchiveId || item.adid || `unique_${Date.now()}_${Math.random()}`;
      mediaGrouped.set(`id:${adId}`, { item, startTimestamp });
    }
  }

  const afterMediaDedup = Array.from(mediaGrouped.values()).map(v => v.item);
  console.log(`Media dedup: ${uniqueById.length} -> ${afterMediaDedup.length} ads`);

  // Third pass: dedupe by headline within same brand
  // This catches cases like AG1 where same ad runs multiple times with different adArchiveIDs
  // but identical headline (unlike Perfect Jean which has different headlines per ad)
  const headlineGrouped = new Map();

  for (const item of afterMediaDedup) {
    const snapshot = item.snapshot || {};
    const cards = snapshot.cards || [];
    const firstCard = cards[0] || {};

    const headline = (firstCard.title || snapshot.title || snapshot.link_description || '').trim().toLowerCase();

    // Get start date for comparison (keep oldest)
    let startTimestamp = 0;
    if (item.startDateFormatted) {
      startTimestamp = new Date(item.startDateFormatted).getTime();
    } else if (typeof item.startDate === 'number') {
      startTimestamp = item.startDate * 1000;
    }

    // Group by headline - if same headline, keep the oldest version
    if (headline) {
      const key = `headline:${headline}`;
      const existing = headlineGrouped.get(key);
      if (!existing || (startTimestamp > 0 && startTimestamp < existing.startTimestamp)) {
        headlineGrouped.set(key, { item, startTimestamp });
      }
    } else {
      // No headline - keep as unique
      const adId = item.adArchiveID || item.adArchiveId || item.adid || `unique_${Date.now()}_${Math.random()}`;
      headlineGrouped.set(`id:${adId}`, { item, startTimestamp });
    }
  }

  const uniqueResults = Array.from(headlineGrouped.values()).map(v => v.item);
  console.log(`Headline dedup: ${afterMediaDedup.length} -> ${uniqueResults.length} ads`);

  // Limit to top 10 unique ads
  const top10Unique = uniqueResults.slice(0, 10);
  console.log(`Keeping top ${top10Unique.length} of ${uniqueResults.length} unique ads`);

  return top10Unique.map((item, index) => {
    // The actor returns: adArchiveID, snapshot.cards[], startDate, etc.
    const adId = item.adArchiveID || item.adArchiveId || item.adid || `apify_${Date.now()}_${index}`;

    // Get snapshot and cards
    const snapshot = item.snapshot || {};
    const cards = snapshot.cards || [];
    const firstCard = cards[0] || {};

    // Extract creative URL (image or video) - using correct field names from Apify
    // The Apify response may have URLs directly as strings or nested in objects
    let creativeUrl = null;  // For display (thumbnail for videos, image for images)
    let videoUrl = null;     // Actual video URL for video analysis
    let creativeType = 'image';

    // Helper to extract string URL from potentially nested structure
    const extractUrl = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (typeof val === 'object') {
        // Try common URL property names (both camelCase and snake_case)
        return val.videoHdUrl || val.video_hd_url ||
               val.videoSdUrl || val.video_sd_url ||
               val.videoPreviewImageUrl || val.video_preview_image_url ||
               val.resizedImageUrl || val.resized_image_url ||
               val.originalImageUrl || val.original_image_url ||
               val.url || null;
      }
      return null;
    };

    // Helper to extract preview image URL from video object
    const extractVideoPreviewUrl = (videoObj) => {
      if (!videoObj) return null;
      if (typeof videoObj === 'object') {
        return videoObj.videoPreviewImageUrl || videoObj.video_preview_image_url || null;
      }
      return null;
    };

    // Check for video first (camelCase field names from Apify)
    if (firstCard.videoHdUrl || firstCard.videoSdUrl) {
      // Store the actual video URL for AI analysis
      videoUrl = extractUrl(firstCard.videoHdUrl) || extractUrl(firstCard.videoSdUrl);
      // Use the preview image for display in the grid (thumbnail)
      creativeUrl = extractUrl(firstCard.videoPreviewImageUrl) || extractUrl(firstCard.resizedImageUrl) || extractUrl(firstCard.originalImageUrl);
      creativeType = 'video';
    } else if (firstCard.resizedImageUrl || firstCard.originalImageUrl) {
      // Image URLs (camelCase)
      creativeUrl = extractUrl(firstCard.resizedImageUrl) || extractUrl(firstCard.originalImageUrl);
      creativeType = 'image';
    } else if (snapshot.videos && snapshot.videos.length > 0) {
      // Fallback to snapshot.videos array - video objects contain video_hd_url, video_sd_url, video_preview_image_url
      const firstVideo = snapshot.videos[0];
      videoUrl = extractUrl(firstVideo);
      // Extract preview image from the video object itself, or fall back to snapshot.images
      creativeUrl = extractVideoPreviewUrl(firstVideo) || extractUrl(snapshot.images?.[0]) || null;
      creativeType = 'video';
    } else if (snapshot.images && snapshot.images.length > 0) {
      // Fallback to snapshot.images array
      creativeUrl = extractUrl(snapshot.images[0]);
    }

    // Final safety check - ensure URLs are strings
    if (creativeUrl && typeof creativeUrl !== 'string') {
      console.error('creativeUrl is not a string:', creativeUrl);
      creativeUrl = null;
    }
    if (videoUrl && typeof videoUrl !== 'string') {
      console.error('videoUrl is not a string:', videoUrl);
      videoUrl = null;
    }

    // Extract ad copy/text - ensure we get a string, not an object
    let adCopy = '';
    if (typeof firstCard.body === 'string') {
      adCopy = firstCard.body;
    } else if (firstCard.body?.text) {
      adCopy = firstCard.body.text;
    } else if (typeof snapshot.body === 'string') {
      adCopy = snapshot.body;
    } else if (snapshot.body?.text) {
      adCopy = snapshot.body.text;
    }
    const headline = firstCard.title || snapshot.title || '';
    const ctaType = firstCard.ctaText || firstCard.ctaType || snapshot.ctaText || '';

    // Extract start date (when the ad started running)
    // Apify provides startDate as Unix timestamp and startDateFormatted as ISO string
    let startDate = null;
    if (item.startDateFormatted) {
      // Use the formatted date directly (e.g., "2025-08-18T07:00:00.000Z")
      startDate = item.startDateFormatted.split('T')[0];
    } else if (typeof item.startDate === 'number') {
      // Convert Unix timestamp to date
      startDate = new Date(item.startDate * 1000).toISOString().split('T')[0];
    } else if (item.startDate) {
      startDate = item.startDate;
    }

    // Build Ad Library link
    const adLibraryLink = `https://www.facebook.com/ads/library/?id=${adId}`;

    return {
      ad_id: String(adId),
      brand_id: brandId,
      rank: index + 1,
      creative_type: creativeType,
      creative_url: creativeUrl,
      video_url: videoUrl,  // Actual video URL for video ads
      ad_copy: adCopy,
      headline: headline,
      cta_type: ctaType,
      start_date: startDate,
      ad_library_link: adLibraryLink,
      // AI fields will be populated later
      ai_format: null,
      ai_hook: null,
      ai_visual_style: null,
      ai_angle: null
    };
  });
}

async function processScrapedAds(brandId, scrapedAds) {
  const weekStart = getWeekStart();
  const today = new Date().toISOString().split('T')[0];

  // Get the ad_ids from the new scrape
  const newAdIds = scrapedAds.map(ad => ad.ad_id);

  // Delete old ads for this brand that aren't in the new top 10
  // BUT preserve bookmarked ads - users explicitly saved those
  if (newAdIds.length > 0) {
    const placeholders = newAdIds.map(() => '?').join(',');

    // Get images to clean up before deleting old ads
    const adsToDelete = db.prepare(`
      SELECT ad_id, stored_creative_url FROM ad_vault
      WHERE brand_id = ? AND ad_id NOT IN (${placeholders})
        AND (bookmarked = 0 OR bookmarked IS NULL)
    `).all(brandId, ...newAdIds);

    const deleted = db.prepare(`
      DELETE FROM ad_vault
      WHERE brand_id = ? AND ad_id NOT IN (${placeholders}) AND (bookmarked = 0 OR bookmarked IS NULL)
    `).run(brandId, ...newAdIds);
    console.log(`Cleaned up ${deleted.changes} old ads for brand ${brandId} (preserved bookmarked ads)`);

    // Clean up local image files for deleted ads
    for (const oldAd of adsToDelete) {
      if (oldAd.stored_creative_url) {
        const filePath = path.join(__dirname, 'public', oldAd.stored_creative_url);
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }
  }

  const processedAds = [];

  for (const ad of scrapedAds) {
    // Check if ad already exists
    const existing = db.prepare('SELECT * FROM ad_vault WHERE ad_id = ?').get(ad.ad_id);

    if (existing) {
      // Update existing ad - increment weeks_in_top10 if new week
      // Parse date string as local date (not UTC) by using YYYY-MM-DD with T00:00:00
      const lastSeenDate = existing.last_seen ? new Date(existing.last_seen + 'T00:00:00') : null;
      const lastWeek = lastSeenDate ? getWeekStart(lastSeenDate) : null;
      const weeksInTop10 = (lastWeek && lastWeek !== weekStart) ? existing.weeks_in_top10 + 1 : existing.weeks_in_top10;

      // Download image locally if not already stored
      let storedUrl = existing.stored_creative_url;
      if (!storedUrl && ad.creative_url) {
        storedUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);
      }

      db.prepare(`
        UPDATE ad_vault
        SET last_seen = ?, rank = ?, weeks_in_top10 = ?,
            creative_url = COALESCE(?, creative_url),
            creative_type = COALESCE(?, creative_type),
            video_url = COALESCE(?, video_url),
            stored_creative_url = COALESCE(?, stored_creative_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE ad_id = ?
      `).run(today, ad.rank, weeksInTop10, ad.creative_url, ad.creative_type, ad.video_url, storedUrl, ad.ad_id);

      processedAds.push({ ...existing, rank: ad.rank, last_seen: today, weeks_in_top10: weeksInTop10, isNew: false });
    } else {
      // Insert new ad - ensure all values are primitives
      const adValues = {
        ad_id: String(ad.ad_id || ''),
        brand_id: brandId,
        date_scraped: today,
        rank: ad.rank || 0,
        creative_type: String(ad.creative_type || 'image'),
        creative_url: ad.creative_url || null,
        video_url: ad.video_url || null,
        ad_copy: String(ad.ad_copy || ''),
        headline: String(ad.headline || ''),
        cta_type: String(ad.cta_type || ''),
        start_date: ad.start_date || null,
        ad_library_link: String(ad.ad_library_link || ''),
        ai_format: ad.ai_format || null,
        ai_hook: ad.ai_hook || null,
        ai_visual_style: ad.ai_visual_style || null,
        ai_angle: ad.ai_angle || null
      };

      // Download creative image locally
      const storedCreativeUrl = await downloadCreativeImage(adValues.ad_id, adValues.creative_url);

      // Debug: check for any object values
      const allParams = [
        adValues.ad_id, adValues.brand_id, adValues.date_scraped, adValues.rank,
        adValues.creative_type, adValues.creative_url, adValues.video_url, storedCreativeUrl,
        adValues.ad_copy, adValues.headline, adValues.cta_type, adValues.start_date, adValues.ad_library_link,
        adValues.ai_format, adValues.ai_hook, adValues.ai_visual_style, adValues.ai_angle,
        today, today, 1
      ];

      for (let i = 0; i < allParams.length; i++) {
        const val = allParams[i];
        if (val !== null && typeof val === 'object') {
          console.error(`Parameter ${i} is an object:`, val);
          allParams[i] = JSON.stringify(val);
        }
      }

      const result = db.prepare(`
        INSERT INTO ad_vault (
          ad_id, brand_id, date_scraped, rank, creative_type, creative_url, video_url, stored_creative_url,
          ad_copy, headline, cta_type, start_date, ad_library_link,
          ai_format, ai_hook, ai_visual_style, ai_angle,
          first_seen, last_seen, weeks_in_top10
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...allParams);

      processedAds.push({ ...ad, id: result.lastInsertRowid, first_seen: today, last_seen: today, isNew: true });
    }

    // Record in weekly snapshot
    db.prepare(`
      INSERT OR REPLACE INTO weekly_snapshots (brand_id, ad_id, week_start, rank)
      VALUES (?, ?, ?, ?)
    `).run(brandId, ad.ad_id, weekStart, ad.rank);
  }

  // Update brand's last_scraped timestamp
  db.prepare('UPDATE brands SET last_scraped = CURRENT_TIMESTAMP WHERE id = ?').run(brandId);

  return processedAds;
}

// ============================================
// ROUTES - PAGES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ============================================
// ROUTES - BRANDS API
// ============================================

app.get('/api/brands', (req, res) => {
  try {
    let brands = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM ad_vault WHERE brand_id = b.id) as ad_count,
        (SELECT COUNT(*) FROM ad_vault WHERE brand_id = b.id AND weeks_in_top10 >= 4) as evergreen_count
      FROM brands b
      WHERE b.status = 'active'
      ORDER BY b.brand_name
    `).all();

    // Return actual brands (empty array if none exist)
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to get brands' });
  }
});

app.post('/api/brands', async (req, res) => {
  try {
    const { brand_name, website_url, ad_library_url, vertical } = req.body;

    if (!brand_name || !ad_library_url) {
      return res.status(400).json({ error: 'Brand name and Ad Library URL are required' });
    }

    // Extract page_id from Ad Library URL
    const pageIdMatch = ad_library_url.match(/view_all_page_id=(\d+)/);
    if (!pageIdMatch) {
      return res.status(400).json({ error: 'Could not extract Page ID from Ad Library URL. Make sure the URL contains view_all_page_id=' });
    }
    const page_id = pageIdMatch[1];

    const result = db.prepare(`
      INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical)
      VALUES (?, ?, ?, ?, ?)
    `).run(brand_name, website_url, ad_library_url, page_id, vertical);

    const brandId = result.lastInsertRowid;

    // Automatically trigger initial scrape for the new brand
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(brandId);
    if (brand) {
      console.log(`Auto-scraping new brand: ${brand_name}`);
      const scrapeResult = await startAdLibraryScrape(brand);
      res.json({
        success: true,
        id: brandId,
        brandId: brandId,  // Include brandId explicitly for frontend scraping status
        page_id,
        scrapeJobId: scrapeResult.jobId,
        message: 'Brand created and scrape started'
      });
    } else {
      res.json({ success: true, id: brandId, page_id });
    }
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

app.put('/api/brands/:id', (req, res) => {
  try {
    const { brand_name, website_url, fb_page_url, page_id, vertical, status } = req.body;

    db.prepare(`
      UPDATE brands
      SET brand_name = COALESCE(?, brand_name),
          website_url = COALESCE(?, website_url),
          fb_page_url = COALESCE(?, fb_page_url),
          page_id = COALESCE(?, page_id),
          vertical = COALESCE(?, vertical),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(brand_name, website_url, fb_page_url, page_id, vertical, status, req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

app.delete('/api/brands/:id', (req, res) => {
  try {
    const brandId = req.params.id;

    // Delete associated data first (foreign key references)
    db.prepare('DELETE FROM weekly_snapshots WHERE brand_id = ?').run(brandId);
    db.prepare('DELETE FROM ad_vault WHERE brand_id = ?').run(brandId);
    db.prepare('DELETE FROM scrape_jobs WHERE brand_id = ?').run(brandId);

    // Then delete the brand itself
    db.prepare('DELETE FROM brands WHERE id = ?').run(brandId);

    console.log(`Deleted brand ${brandId} and all associated data`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

app.post('/api/brands/:id/resolve-page-id', async (req, res) => {
  try {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const pageId = await resolvePageId(brand.fb_page_url);

    if (pageId) {
      db.prepare('UPDATE brands SET page_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(pageId, brand.id);
      res.json({ success: true, pageId });
    } else {
      res.status(400).json({ error: 'Could not resolve Page ID. Try entering it manually.' });
    }
  } catch (error) {
    console.error('Resolve page ID error:', error);
    res.status(500).json({ error: 'Failed to resolve Page ID' });
  }
});

// ============================================
// ROUTES - ADS API
// ============================================

app.get('/api/ads', (req, res) => {
  try {
    const {
      brand_ids, evergreen_only, min_weeks, date_from, date_to, media_type, sort = 'newest', limit = 50, offset = 0,
      ai_asset_type, ai_visual_format, ai_messaging_angle, ai_hook_tactic, ai_offer_type
    } = req.query;

    let query = `
      SELECT a.*, b.brand_name, b.vertical
      FROM ad_vault a
      JOIN brands b ON a.brand_id = b.id
      WHERE 1=1
    `;
    const params = [];

    // Support multiple brand IDs (brand_ids can be a single value or array)
    const brandIdArray = brand_ids ? (Array.isArray(brand_ids) ? brand_ids : [brand_ids]) : [];
    if (brandIdArray.length > 0) {
      const placeholders = brandIdArray.map(() => '?').join(',');
      query += ` AND a.brand_id IN (${placeholders})`;
      params.push(...brandIdArray);
    }

    // Filter by start_date range (when the ad started running)
    if (date_from) {
      query += ' AND a.start_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND a.start_date <= ?';
      params.push(date_to);
    }

    // Filter by media type (video or image)
    if (media_type) {
      query += ' AND a.creative_type = ?';
      params.push(media_type);
    }

    // AI tag filters - support multiple values per category
    const aiFilters = [
      { param: ai_asset_type, column: 'ai_asset_type' },
      { param: ai_visual_format, column: 'ai_visual_format' },
      { param: ai_messaging_angle, column: 'ai_messaging_angle' },
      { param: ai_hook_tactic, column: 'ai_hook_tactic' },
      { param: ai_offer_type, column: 'ai_offer_type' }
    ];

    for (const { param, column } of aiFilters) {
      if (param) {
        const values = Array.isArray(param) ? param : [param];
        const placeholders = values.map(() => '?').join(',');
        query += ` AND a.${column} IN (${placeholders})`;
        params.push(...values);
      }
    }

    // Keep evergreen/min_weeks filter for the Evergreen view
    if (evergreen_only === 'true' || min_weeks) {
      const weeks = min_weeks ? parseInt(min_weeks) : 4;
      query += ' AND a.weeks_in_top10 >= ?';
      params.push(weeks);
    }

    // Sort order - rank sorts by impression ranking, date sorts by start_date
    if (sort === 'rank') {
      // Sort by rank (1 = highest impressions) then by date for ties
      query += ` ORDER BY a.rank ASC, a.start_date DESC LIMIT ? OFFSET ?`;
    } else {
      const sortDirection = sort === 'oldest' ? 'ASC' : 'DESC';
      query += ` ORDER BY a.start_date ${sortDirection}, a.rank ASC LIMIT ? OFFSET ?`;
    }
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    let ads = db.prepare(query).all(...params);

    // Return actual results (empty array if no matches - no mock data fallback)
    res.json(ads);
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// Get all bookmarked ads - MUST be before /api/ads/:id to avoid route conflict
app.get('/api/ads/bookmarked', (req, res) => {
  try {
    const ads = db.prepare(`
      SELECT a.*, b.brand_name, b.vertical
      FROM ad_vault a
      JOIN brands b ON a.brand_id = b.id
      WHERE a.bookmarked = 1
      ORDER BY a.updated_at DESC
    `).all();

    res.json(ads);
  } catch (error) {
    console.error('Get bookmarked ads error:', error);
    res.status(500).json({ error: 'Failed to get bookmarked ads' });
  }
});

app.get('/api/ads/:id', (req, res) => {
  try {
    const ad = db.prepare(`
      SELECT a.*, b.brand_name, b.vertical, b.website_url
      FROM ad_vault a
      JOIN brands b ON a.brand_id = b.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json(ad);
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ error: 'Failed to get ad' });
  }
});

app.post('/api/ads/:id/analyze', async (req, res) => {
  try {
    const ad = db.prepare('SELECT * FROM ad_vault WHERE id = ?').get(req.params.id);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const analysis = await analyzeAdCreative(ad);

    // Update ad with new expanded AI tag fields
    db.prepare(`
      UPDATE ad_vault
      SET ai_asset_type = ?, ai_visual_format = ?, ai_messaging_angle = ?,
          ai_hook_tactic = ?, ai_offer_type = ?,
          ai_raw_response = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      analysis.asset_type,
      analysis.visual_format,
      analysis.messaging_angle,
      analysis.hook_tactic,
      analysis.offer_type,
      JSON.stringify(analysis),
      ad.id
    );

    res.json(analysis);
  } catch (error) {
    console.error('Analyze ad error:', error);
    res.status(500).json({ error: 'Failed to analyze ad' });
  }
});

// Get count of unanalyzed ads
app.get('/api/ads/unanalyzed/count', (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM ad_vault
      WHERE ai_asset_type IS NULL OR ai_asset_type = ''
    `).get();
    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unanalyzed count error:', error);
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// Batch analyze unanalyzed ads
app.post('/api/ads/analyze-batch', async (req, res) => {
  try {
    // Get all unanalyzed ads
    const unanalyzedAds = db.prepare(`
      SELECT * FROM ad_vault
      WHERE ai_asset_type IS NULL OR ai_asset_type = ''
      ORDER BY created_at DESC
    `).all();

    if (unanalyzedAds.length === 0) {
      return res.json({ analyzed: 0, message: 'No unanalyzed ads found' });
    }

    console.log(`Starting batch analysis of ${unanalyzedAds.length} ads...`);

    let analyzed = 0;
    let errors = 0;

    for (const ad of unanalyzedAds) {
      try {
        const analysis = await analyzeAdCreative(ad);

        db.prepare(`
          UPDATE ad_vault
          SET ai_asset_type = ?, ai_visual_format = ?, ai_messaging_angle = ?,
              ai_hook_tactic = ?, ai_offer_type = ?,
              ai_raw_response = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          analysis.asset_type,
          analysis.visual_format,
          analysis.messaging_angle,
          analysis.hook_tactic,
          analysis.offer_type,
          JSON.stringify(analysis),
          ad.id
        );

        analyzed++;
        console.log(`Analyzed ${analyzed}/${unanalyzedAds.length}: Ad ${ad.id}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to analyze ad ${ad.id}:`, err.message);
        errors++;
      }
    }

    console.log(`Batch analysis complete: ${analyzed} analyzed, ${errors} errors`);
    res.json({ analyzed, errors, total: unanalyzedAds.length });
  } catch (error) {
    console.error('Batch analyze error:', error);
    res.status(500).json({ error: 'Failed to batch analyze ads' });
  }
});

// Toggle bookmark status for an ad
app.post('/api/ads/:id/bookmark', (req, res) => {
  try {
    const ad = db.prepare('SELECT id, bookmarked FROM ad_vault WHERE id = ?').get(req.params.id);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const newStatus = ad.bookmarked ? 0 : 1;
    db.prepare('UPDATE ad_vault SET bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, ad.id);

    res.json({ bookmarked: newStatus === 1 });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// ============================================
// ROUTES - SCRAPE API
// ============================================

app.post('/api/scrape/brand/:id', async (req, res) => {
  try {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (!brand.page_id) {
      return res.status(400).json({ error: 'Brand does not have a Page ID. Please resolve it first.' });
    }

    const result = await startAdLibraryScrape(brand);
    res.json(result);
  } catch (error) {
    console.error('Scrape brand error:', error);
    res.status(500).json({ error: 'Failed to start scrape' });
  }
});

app.post('/api/scrape/all', async (req, res) => {
  try {
    const brands = db.prepare('SELECT * FROM brands WHERE status = ? AND page_id IS NOT NULL').all('active');

    const jobs = [];
    for (const brand of brands) {
      const result = await startAdLibraryScrape(brand);
      jobs.push({ brandId: brand.id, brandName: brand.brand_name, ...result });
    }

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Scrape all error:', error);
    res.status(500).json({ error: 'Failed to start scrape' });
  }
});

app.get('/api/scrape/status/:jobId', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM scrape_jobs WHERE id = ?').get(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // If already complete, return status
    if (job.status === 'complete' || job.status === 'error') {
      return res.json({ status: job.status, resultCount: job.result_count });
    }

    // Poll Apify if running
    if (job.apify_run_id) {
      const apifyStatus = await pollApifyJob(job.apify_run_id);
      console.log(`Apify job ${job.apify_run_id} status: ${apifyStatus}`);

      if (apifyStatus === 'SUCCEEDED') {
        const apifyResults = await getApifyResults(job.apify_run_id);
        console.log(`Got ${apifyResults.length} results from Apify`);

        // Transform Apify results to our format
        const transformedAds = transformApifyResults(apifyResults, job.brand_id);

        // Process and save to database
        const processedAds = await processScrapedAds(job.brand_id, transformedAds);

        db.prepare(`
          UPDATE scrape_jobs
          SET status = 'complete', results = ?, result_count = ?, completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(processedAds), processedAds.length, job.id);

        return res.json({ status: 'complete', resultCount: processedAds.length });
      }

      if (apifyStatus === 'FAILED' || apifyStatus === 'ABORTED' || apifyStatus === 'TIMED-OUT') {
        db.prepare(`
          UPDATE scrape_jobs
          SET status = 'error', error_message = ?, completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(`Apify job ${apifyStatus}`, job.id);

        return res.json({ status: 'error', error: `Job ${apifyStatus}` });
      }

      // Job is still running (RUNNING, READY, etc.)
      return res.json({ status: 'running' });
    }

    // No Apify run ID means mock mode - job should already be complete
    res.json({ status: job.status });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

app.get('/api/scrape/results/:jobId', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM scrape_jobs WHERE id = ?').get(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'complete') {
      return res.json({ status: job.status });
    }

    const results = JSON.parse(job.results || '[]');

    res.json({
      status: 'complete',
      results,
      totalCount: results.length
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// ============================================
// ROUTES - ANALYTICS API
// ============================================

app.get('/api/analytics/evergreen', (req, res) => {
  try {
    const { min_weeks = 4 } = req.query;

    const ads = db.prepare(`
      SELECT a.*, b.brand_name, b.vertical
      FROM ad_vault a
      JOIN brands b ON a.brand_id = b.id
      WHERE a.weeks_in_top10 >= ?
      ORDER BY a.weeks_in_top10 DESC, a.rank ASC
    `).all(parseInt(min_weeks));

    res.json(ads);
  } catch (error) {
    console.error('Evergreen analytics error:', error);
    res.status(500).json({ error: 'Failed to get evergreen ads' });
  }
});

app.get('/api/analytics/by-vertical', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        b.vertical,
        COUNT(DISTINCT b.id) as brand_count,
        COUNT(a.id) as ad_count,
        AVG(a.weeks_in_top10) as avg_weeks_in_top10
      FROM brands b
      LEFT JOIN ad_vault a ON a.brand_id = b.id
      WHERE b.status = 'active'
      GROUP BY b.vertical
      ORDER BY ad_count DESC
    `).all();

    res.json(stats);
  } catch (error) {
    console.error('Vertical analytics error:', error);
    res.status(500).json({ error: 'Failed to get vertical stats' });
  }
});

app.get('/api/analytics/weekly-snapshot', (req, res) => {
  try {
    const { brand_id, weeks = 4 } = req.query;

    let query = `
      SELECT
        ws.week_start,
        ws.ad_id,
        ws.rank,
        a.headline,
        a.ai_format,
        b.brand_name
      FROM weekly_snapshots ws
      JOIN ad_vault a ON ws.ad_id = a.ad_id
      JOIN brands b ON ws.brand_id = b.id
      WHERE ws.week_start >= date('now', '-' || ? || ' weeks')
    `;
    const params = [weeks];

    if (brand_id) {
      query += ' AND ws.brand_id = ?';
      params.push(brand_id);
    }

    query += ' ORDER BY ws.week_start DESC, ws.rank ASC';

    const snapshots = db.prepare(query).all(...params);

    res.json(snapshots);
  } catch (error) {
    console.error('Weekly snapshot error:', error);
    res.status(500).json({ error: 'Failed to get weekly snapshots' });
  }
});

// ============================================
// ROUTES - IMPORT/EXPORT
// ============================================

app.post('/api/import/brands', (req, res) => {
  try {
    const { brands } = req.body;

    if (!Array.isArray(brands)) {
      return res.status(400).json({ error: 'Expected array of brands' });
    }

    const inserted = [];
    const errors = [];

    for (const brand of brands) {
      try {
        const result = db.prepare(`
          INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical)
          VALUES (?, ?, ?, ?, ?)
        `).run(brand.brand_name, brand.website_url, brand.fb_page_url, brand.page_id, brand.vertical);

        inserted.push({ id: result.lastInsertRowid, brand_name: brand.brand_name });
      } catch (e) {
        errors.push({ brand_name: brand.brand_name, error: e.message });
      }
    }

    res.json({ success: true, inserted, errors });
  } catch (error) {
    console.error('Import brands error:', error);
    res.status(500).json({ error: 'Failed to import brands' });
  }
});

// Bulk CSV import for brands with page ID resolution
app.post('/api/import/brands-csv', async (req, res) => {
  try {
    const { csv } = req.body;

    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'Expected CSV string in body' });
    }

    // Parse CSV
    const lines = csv.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());

    // Validate header
    const requiredColumns = ['Brand Name', 'Category', 'Facebook Page URL'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      return res.status(400).json({ error: `Missing columns: ${missingColumns.join(', ')}` });
    }

    // Map column indices
    const brandNameIdx = header.indexOf('Brand Name');
    const categoryIdx = header.indexOf('Category');
    const websiteIdx = header.indexOf('Website Domain');
    const fbUrlIdx = header.indexOf('Facebook Page URL');

    // Category to vertical mapping
    const categoryMap = {
      'Health/Supplements': 'Health',
      'Health': 'Health',
      'Apparel': 'Apparel',
      'Beauty': 'Beauty',
      'Home Goods': 'Home',
      'Home': 'Home',
      'Food/Bev': 'Food',
      'Food & Beverage': 'Food',
      'Food': 'Food',
      'Tech': 'Tech',
      'Accessories': 'Accessories',
      'Footwear': 'Footwear'
    };

    const inserted = [];
    const errors = [];
    const skipped = [];

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV parsing (simple - assumes no commas in fields)
      const values = line.split(',').map(v => v.trim());

      const brandName = values[brandNameIdx];
      const category = values[categoryIdx];
      const websiteDomain = websiteIdx >= 0 ? values[websiteIdx] : '';
      const fbPageUrl = values[fbUrlIdx];

      if (!brandName || !fbPageUrl) {
        errors.push({ brand_name: brandName || `Row ${i}`, error: 'Missing brand name or Facebook URL' });
        continue;
      }

      // Check for duplicate
      const existing = db.prepare('SELECT id FROM brands WHERE brand_name = ?').get(brandName);
      if (existing) {
        skipped.push({ brand_name: brandName, reason: 'Already exists' });
        continue;
      }

      // Map category to vertical
      const vertical = categoryMap[category] || 'Other';

      // Construct website URL
      const websiteUrl = websiteDomain ? `https://${websiteDomain}` : '';

      try {
        // Resolve page ID using ScrapeCreators API (by brand name)
        console.log(`Resolving page ID for ${brandName}...`);
        const pageId = await resolvePageIdByName(brandName);

        if (!pageId) {
          errors.push({ brand_name: brandName, error: 'Could not resolve Facebook page ID' });
          continue;
        }

        // Construct proper Ad Library URL with impressions sorting
        const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=${pageId}`;

        // Insert brand
        const result = db.prepare(`
          INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical, status)
          VALUES (?, ?, ?, ?, ?, 'active')
        `).run(brandName, websiteUrl, adLibraryUrl, pageId, vertical);

        inserted.push({
          id: result.lastInsertRowid,
          brand_name: brandName,
          page_id: pageId,
          vertical
        });

        console.log(`✓ Added ${brandName} (page_id: ${pageId})`);

        // Small delay to avoid rate limiting from Facebook
        await new Promise(r => setTimeout(r, 500));

      } catch (e) {
        console.error(`Error processing ${brandName}:`, e.message);
        errors.push({ brand_name: brandName, error: e.message });
      }
    }

    res.json({
      success: true,
      inserted,
      skipped,
      errors,
      summary: {
        total: lines.length - 1,
        inserted: inserted.length,
        skipped: skipped.length,
        errors: errors.length
      }
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import brands from CSV' });
  }
});

app.get('/api/export/ads', (req, res) => {
  try {
    const ads = db.prepare(`
      SELECT
        a.ad_id,
        b.brand_name,
        b.vertical,
        a.rank,
        a.creative_type,
        a.ad_copy,
        a.headline,
        a.cta_type,
        a.ai_format,
        a.ai_hook,
        a.ai_visual_style,
        a.ai_angle,
        a.first_seen,
        a.last_seen,
        a.weeks_in_top10,
        a.ad_library_link
      FROM ad_vault a
      JOIN brands b ON a.brand_id = b.id
      ORDER BY b.brand_name, a.rank
    `).all();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=meta_ads_export.json');
    res.json(ads);
  } catch (error) {
    console.error('Export ads error:', error);
    res.status(500).json({ error: 'Failed to export ads' });
  }
});

// ============================================
// SETTINGS API
// ============================================

// Test endpoint to manually trigger scheduled scrape (for testing only)
app.post('/api/test/run-scheduled-scrape', async (req, res) => {
  try {
    console.log('Manual trigger of scheduled scrape...');
    res.json({ message: 'Scheduled scrape started. Check server logs for progress.' });

    // Run asynchronously so we don't block the response
    runScheduledScrapeAll().catch(err => {
      console.error('Scheduled scrape error:', err);
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Failed to start scheduled scrape' });
  }
});

// Test endpoint to manually trigger batch analysis (for testing only)
app.post('/api/test/run-batch-analysis', async (req, res) => {
  try {
    console.log('Manual trigger of batch analysis...');
    res.json({ message: 'Batch analysis started. Check server logs for progress.' });

    // Run asynchronously
    runBatchAnalysis().catch(err => {
      console.error('Batch analysis error:', err);
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Failed to start batch analysis' });
  }
});

// Test endpoint to download all ad images locally (for backfilling)
app.post('/api/test/download-all-images', async (req, res) => {
  try {
    const adsToDownload = db.prepare(`
      SELECT id, ad_id, creative_url FROM ad_vault
      WHERE creative_url IS NOT NULL
        AND (stored_creative_url IS NULL OR stored_creative_url = '')
    `).all();

    res.json({
      message: `Starting download for ${adsToDownload.length} ads. Check server logs for progress.`
    });

    // Run asynchronously so we don't block the response
    (async () => {
      let downloaded = 0;
      let failed = 0;
      for (const ad of adsToDownload) {
        const storedUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);
        if (storedUrl) {
          db.prepare('UPDATE ad_vault SET stored_creative_url = ? WHERE id = ?')
            .run(storedUrl, ad.id);
          downloaded++;
        } else {
          failed++;
        }
        if ((downloaded + failed) % 50 === 0) {
          console.log(`Image download progress: ${downloaded} downloaded, ${failed} failed, ${adsToDownload.length - downloaded - failed} remaining`);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      console.log(`Image download complete: ${downloaded} downloaded, ${failed} failed`);
    })();
  } catch (error) {
    console.error('Download images error:', error);
    res.status(500).json({ error: 'Failed to start image download' });
  }
});

// Get schedule settings
app.get('/api/settings/schedule', (req, res) => {
  try {
    const settings = getScheduleSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get schedule settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update schedule settings
app.post('/api/settings/schedule', (req, res) => {
  try {
    const { enabled, day, hour, autoAnalyze } = req.body;

    setSetting('schedule_enabled', enabled ? 'true' : 'false');
    setSetting('schedule_day', String(day));
    setSetting('schedule_hour', String(hour));
    setSetting('auto_analyze', autoAnalyze ? 'true' : 'false');

    // Restart the scheduler with new settings
    setupScheduledScrape();

    res.json({ success: true, settings: getScheduleSettings() });
  } catch (error) {
    console.error('Update schedule settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n📊 Meta Ad Library Monitor running at http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${APIFY_TOKEN ? '✅ Live (Apify connected)' : '🔸 Demo (using mock data)'}`);
  console.log(`🤖 AI: ${GEMINI_API_KEY ? '✅ Gemini connected' : '🔸 Mock analysis'}`);
  console.log(`\n💡 Add APIFY_TOKEN and GEMINI_API_KEY to Secrets for live data\n`);
});
