/**
 * Meta Ad Library Monitor + TikTok Product Research
 *
 * Monitor top-performing Facebook ads for DTC brands, sorted by impressions.
 * Discover trending TikTok Shop products for validation against Meta ads.
 * Scrapes Meta Ad Library and TikTok Shop via Apify, analyzes creatives with Gemini AI.
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
      ai_format TEXT,
      ai_hook TEXT,
      ai_visual_style TEXT,
      ai_angle TEXT,
      ai_raw_response TEXT,
      ai_asset_type TEXT,
      ai_visual_format TEXT,
      ai_messaging_angle TEXT,
      ai_hook_tactic TEXT,
      ai_offer_type TEXT,
      bookmarked INTEGER DEFAULT 0,
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

    -- Settings: App configuration
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =============================================
    -- TIKTOK PRODUCT RESEARCH TABLES
    -- =============================================

    -- TikTok Products: Trending products discovered from TikTok Shop
    CREATE TABLE IF NOT EXISTS tiktok_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE NOT NULL,
      title TEXT,
      description TEXT,
      price REAL,
      original_price REAL,
      currency TEXT DEFAULT 'USD',
      sold_count TEXT,
      sold_count_num INTEGER DEFAULT 0,
      rating REAL,
      review_count INTEGER DEFAULT 0,
      seller_name TEXT,
      seller_url TEXT,
      product_url TEXT,
      image_url TEXT,
      stored_image_url TEXT,
      category TEXT,
      search_keyword TEXT,
      region TEXT DEFAULT 'US',
      meta_brand_id INTEGER,
      meta_validation_status TEXT DEFAULT 'pending',
      notes TEXT,
      bookmarked INTEGER DEFAULT 0,
      first_seen DATE,
      last_seen DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TikTok Scrape Jobs: Track TikTok scrape operations
    CREATE TABLE IF NOT EXISTS tiktok_scrape_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_type TEXT NOT NULL,
      search_keyword TEXT,
      category TEXT,
      region TEXT DEFAULT 'US',
      status TEXT DEFAULT 'pending',
      apify_run_id TEXT,
      input_params TEXT,
      result_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- TikTok Saved Searches: Saved search queries for re-running
    CREATE TABLE IF NOT EXISTS tiktok_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      keyword TEXT NOT NULL,
      category TEXT,
      region TEXT DEFAULT 'US',
      is_scheduled INTEGER DEFAULT 0,
      last_run DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_brands_page_id ON brands(page_id);
    CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_brand_id ON ad_vault(brand_id);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_ad_id ON ad_vault(ad_id);
    CREATE INDEX IF NOT EXISTS idx_ad_vault_last_seen ON ad_vault(last_seen);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON scrape_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_snapshots_week ON weekly_snapshots(week_start);
    CREATE INDEX IF NOT EXISTS idx_tiktok_products_product_id ON tiktok_products(product_id);
    CREATE INDEX IF NOT EXISTS idx_tiktok_products_keyword ON tiktok_products(search_keyword);
    CREATE INDEX IF NOT EXISTS idx_tiktok_products_bookmarked ON tiktok_products(bookmarked);
    CREATE INDEX IF NOT EXISTS idx_tiktok_jobs_status ON tiktok_scrape_jobs(status);
  `);
}

initDatabase();

// Ensure creatives directory exists
fs.mkdirSync(path.join(__dirname, 'public', 'creatives'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'public', 'tiktok-images'), { recursive: true });

// Clean up orphaned data on startup
function cleanupOrphanedData() {
  try {
    const orphanedAds = db.prepare(`
      DELETE FROM ad_vault WHERE brand_id NOT IN (SELECT id FROM brands)
    `).run();
    const orphanedSnapshots = db.prepare(`
      DELETE FROM weekly_snapshots WHERE brand_id NOT IN (SELECT id FROM brands)
    `).run();
    const orphanedJobs = db.prepare(`
      DELETE FROM scrape_jobs WHERE brand_id NOT IN (SELECT id FROM brands)
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
let tiktokScheduledTask = null;

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
    day: getSetting('schedule_day', '1'),
    hour: getSetting('schedule_hour', '6'),
    autoAnalyze: getSetting('auto_analyze', 'false') === 'true'
  };
}

function getTikTokScheduleSettings() {
  return {
    enabled: getSetting('tiktok_schedule_enabled', 'false') === 'true',
    day: getSetting('tiktok_schedule_day', '1'),
    hour: getSetting('tiktok_schedule_hour', '7')
  };
}

function setupScheduledScrape() {
  if (scheduledTask) { scheduledTask.stop(); scheduledTask = null; }

  const settings = getScheduleSettings();
  if (!settings.enabled) {
    console.log('Meta scheduled scraping is disabled');
    return;
  }

  const cronExpression = `0 ${settings.hour} * * ${settings.day}`;
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Starting scheduled Meta weekly scrape...');
    try { await runScheduledScrapeAll(); } catch (error) { console.error('Scheduled scrape failed:', error); }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  console.log(`Meta scheduled scraping: ${days[settings.day]} at ${settings.hour}:00`);
}

function setupTikTokScheduledScrape() {
  if (tiktokScheduledTask) { tiktokScheduledTask.stop(); tiktokScheduledTask = null; }

  const settings = getTikTokScheduleSettings();
  if (!settings.enabled) {
    console.log('TikTok scheduled scraping is disabled');
    return;
  }

  const cronExpression = `0 ${settings.hour} * * ${settings.day}`;
  tiktokScheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Starting scheduled TikTok scrape...');
    try { await runScheduledTikTokScrape(); } catch (error) { console.error('TikTok scheduled scrape failed:', error); }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  console.log(`TikTok scheduled scraping: ${days[settings.day]} at ${settings.hour}:00`);
}

async function runScheduledScrapeAll() {
  const settings = getScheduleSettings();
  const brands = db.prepare(`
    SELECT * FROM brands WHERE status = 'active' AND page_id IS NOT NULL AND page_id != ''
  `).all();

  if (brands.length === 0) { console.log('No brands to scrape'); return; }

  console.log(`Starting scheduled scrape for ${brands.length} brands...`);
  let successCount = 0, errorCount = 0;

  for (const brand of brands) {
    try {
      const jobResult = await startAdLibraryScrape(brand);
      if (jobResult.apifyRunId) {
        let status = 'RUNNING';
        while (status === 'RUNNING' || status === 'READY') {
          await new Promise(resolve => setTimeout(resolve, 5000));
          status = await pollApifyJob(jobResult.apifyRunId);
        }
        if (status === 'SUCCEEDED') {
          const results = await getApifyResults(jobResult.apifyRunId);
          const transformed = transformApifyResults(results, brand.id);
          for (const ad of transformed) {
            try {
              const storedUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);
              db.prepare(`
                INSERT OR REPLACE INTO ad_vault
                (ad_id, brand_id, date_scraped, rank, creative_type, creative_url, stored_creative_url, ad_copy, headline, cta_type, start_date, ad_library_link, first_seen, last_seen, weeks_in_top10, video_url)
                VALUES (?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT first_seen FROM ad_vault WHERE ad_id = ?), date('now')), date('now'), COALESCE((SELECT weeks_in_top10 FROM ad_vault WHERE ad_id = ?), 0) + 1, ?)
              `).run(ad.ad_id, brand.id, ad.rank, ad.creative_type, ad.creative_url, storedUrl, ad.ad_copy, ad.headline, ad.cta_type, ad.start_date, ad.ad_library_link, ad.ad_id, ad.ad_id, ad.video_url);
            } catch (e) { /* ignore duplicates */ }
          }
          successCount++;
        } else { errorCount++; }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) { errorCount++; console.error(`Failed to scrape ${brand.brand_name}:`, error.message); }
  }

  console.log(`Scheduled scrape complete: ${successCount} succeeded, ${errorCount} failed`);
  if (settings.autoAnalyze) { await runBatchAnalysis(); }
}

async function runScheduledTikTokScrape() {
  const searches = db.prepare('SELECT * FROM tiktok_searches WHERE is_scheduled = 1').all();
  if (searches.length === 0) { console.log('No scheduled TikTok searches'); return; }

  for (const search of searches) {
    try {
      console.log(`Running TikTok search: "${search.keyword}"...`);
      const result = await startTikTokScrape(search.keyword, { region: search.region, category: search.category });
      if (result.apifyRunId) {
        let status = 'RUNNING';
        while (status === 'RUNNING' || status === 'READY') {
          await new Promise(resolve => setTimeout(resolve, 5000));
          status = await pollApifyJob(result.apifyRunId);
        }
        if (status === 'SUCCEEDED') {
          const results = await getApifyResults(result.apifyRunId);
          const transformed = transformTikTokResults(results, search.keyword);
          await processTikTokProducts(search.keyword, transformed);
        }
      }
      db.prepare('UPDATE tiktok_searches SET last_run = CURRENT_TIMESTAMP WHERE id = ?').run(search.id);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) { console.error(`TikTok search failed for "${search.keyword}":`, error.message); }
  }
}

async function runBatchAnalysis() {
  const unanalyzedAds = db.prepare(`
    SELECT * FROM ad_vault WHERE ai_asset_type IS NULL OR ai_asset_type = '' ORDER BY created_at DESC
  `).all();
  if (unanalyzedAds.length === 0) { console.log('No unanalyzed ads'); return; }

  let analyzed = 0;
  for (const ad of unanalyzedAds) {
    try {
      const analysis = await analyzeAdCreative(ad);
      db.prepare(`
        UPDATE ad_vault SET ai_asset_type = ?, ai_visual_format = ?, ai_messaging_angle = ?,
            ai_hook_tactic = ?, ai_offer_type = ?, ai_raw_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(analysis.asset_type, analysis.visual_format, analysis.messaging_angle, analysis.hook_tactic, analysis.offer_type, JSON.stringify(analysis), ad.id);
      analyzed++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) { console.error(`Failed to analyze ad ${ad.id}:`, err.message); }
  }
  console.log(`Auto-analysis complete: ${analyzed} ads analyzed`);
}

setupScheduledScrape();
setupTikTokScheduledScrape();

// ============================================
// CONFIGURATION
// ============================================
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const META_AD_SCRAPER_ID = 'JJghSZmShuco4j9gJ';
const TIKTOK_SCRAPER_ID = process.env.TIKTOK_SCRAPER_ID || 'pratikdani/tiktok-shop-search-scraper';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function buildAdLibraryUrl(pageId) {
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
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg';
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

async function downloadTikTokImage(productId, imageUrl) {
  if (!imageUrl) return null;
  try {
    const dir = path.join(__dirname, 'public', 'tiktok-images');
    fs.mkdirSync(dir, { recursive: true });
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `${productId}.${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return `/tiktok-images/${filename}`;
  } catch (error) {
    console.error(`Failed to download TikTok image for ${productId}:`, error.message);
    return null;
  }
}

function parseSoldCount(soldStr) {
  if (!soldStr) return 0;
  if (typeof soldStr === 'number') return soldStr;
  const str = String(soldStr).toLowerCase().replace(/[,\s]/g, '').replace('sold', '').trim();
  const match = str.match(/([\d.]+)\s*(k|m)?/i);
  if (!match) return 0;
  let num = parseFloat(match[1]);
  if (match[2] === 'k') num *= 1000;
  if (match[2] === 'm') num *= 1000000;
  return Math.round(num);
}

// ============================================
// PAGE ID RESOLUTION
// ============================================

async function resolvePageId(fbPageUrl) {
  try {
    const response = await fetch(fbPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await response.text();
    const patterns = [/"pageID":"(\d+)"/, /page_id=(\d+)/, /"page_id":"(\d+)"/, /fb:\/\/page\/(\d+)/, /"entity_id":"(\d+)"/];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch (error) {
    console.error('Page ID resolution error:', error);
    return null;
  }
}

const SCRAPECREATORS_API_KEY = process.env.SCRAPECREATORS_API_KEY || '';

async function resolvePageIdByName(brandName) {
  try {
    const response = await fetch(
      `https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(brandName)}`,
      { headers: { 'x-api-key': SCRAPECREATORS_API_KEY } }
    );
    const data = await response.json();
    if (!data.success || !data.searchResults || data.searchResults.length === 0) return null;
    const verified = data.searchResults.find(r => r.verification === 'BLUE_VERIFIED');
    return verified ? verified.page_id : data.searchResults[0].page_id;
  } catch (error) {
    console.error('ScrapeCreators API error:', error);
    return null;
  }
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

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
      ad_copy: `Discover why ${Math.floor(Math.random() * 100000) + 10000}+ customers love our product.`,
      headline: ['Transform Your Routine', 'The Wait Is Over', 'As Seen On TikTok', 'Best Seller Alert'][i % 4],
      cta_type: ctaTypes[i % ctaTypes.length],
      start_date: startDate.toISOString().split('T')[0],
      ai_format: formats[i % formats.length],
      ai_hook: 'Opens with bold text overlay',
      ai_visual_style: styles[i % styles.length],
      ai_angle: angles[i % angles.length],
      weeks_in_top10: Math.floor(Math.random() * 12) + 1
    });
  }
  return mockAds;
}

function getMockAdAnalysis() {
  const assetTypes = ['UGC', 'High Production', 'Static Image', 'Animation'];
  const visualFormats = ['Talking Head', 'Product Demo', 'Unboxing', 'Before/After', 'Text Overlay'];
  const messagingAngles = ['Problem/Solution', 'Social Proof', 'FOMO', 'Aspiration', 'Value Proposition'];
  const hookTactics = ['Pattern Interrupt', 'Question', 'Bold Claim', 'Curiosity Gap', 'Text Hook'];
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

function getMockTikTokProducts(keyword, count = 20) {
  const mockProducts = [];
  const categories = ['Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Electronics', 'Fashion'];
  const sellers = ['TrendShop Official', 'GlowUp Store', 'FitLife Direct', 'HomeVibes', 'TechDaily'];

  for (let i = 0; i < count; i++) {
    const price = (Math.random() * 80 + 5).toFixed(2);
    const originalPrice = (parseFloat(price) * (1 + Math.random() * 0.5)).toFixed(2);
    const soldNum = Math.floor(Math.random() * 50000) + 100;
    mockProducts.push({
      product_id: `mock_tt_${Date.now()}_${i}`,
      title: `${keyword} - ${['Premium', 'Viral', 'Trending', 'Best Seller', 'Top Rated'][i % 5]} ${['Product', 'Solution', 'Kit', 'Device', 'Set'][i % 5]}`,
      description: `Trending ${keyword} product with ${soldNum}+ happy customers`,
      price: parseFloat(price),
      original_price: parseFloat(originalPrice),
      currency: 'USD',
      sold_count: soldNum > 1000 ? `${(soldNum / 1000).toFixed(1)}k sold` : `${soldNum} sold`,
      sold_count_num: soldNum,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      review_count: Math.floor(Math.random() * 5000) + 10,
      seller_name: sellers[i % sellers.length],
      product_url: `https://shop.tiktok.com/mock/${i}`,
      image_url: `https://picsum.photos/seed/tt${i}/400/400`,
      category: categories[i % categories.length],
      search_keyword: keyword,
      region: 'US'
    });
  }
  return mockProducts;
}

// ============================================
// APIFY SCRAPING FUNCTIONS (META)
// ============================================

async function startAdLibraryScrape(brand) {
  if (!APIFY_TOKEN) {
    const mockAds = getMockAds(brand.id, 10);
    const job = db.prepare(`
      INSERT INTO scrape_jobs (job_type, brand_id, status, input_params, results, result_count, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run('ad_scrape', brand.id, 'complete', JSON.stringify({ page_id: brand.page_id }), JSON.stringify(mockAds), mockAds.length);
    return { jobId: job.lastInsertRowid, mock: true };
  }

  const adLibraryUrl = buildAdLibraryUrl(brand.page_id);
  const input = { startUrls: [{ url: adLibraryUrl }], resultsLimit: 20, activeStatus: 'active' };

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${META_AD_SCRAPER_ID}/runs?token=${APIFY_TOKEN}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
    );
    if (!response.ok) throw new Error(`Apify API error: ${response.status}`);
    const data = await response.json();
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
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${apifyRunId}?token=${APIFY_TOKEN}`);
    const data = await response.json();
    return data.data.status;
  } catch (error) { return 'FAILED'; }
}

async function getApifyResults(apifyRunId) {
  try {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${apifyRunId}/dataset/items?token=${APIFY_TOKEN}`);
    return await response.json();
  } catch (error) { return []; }
}

// ============================================
// TIKTOK SHOP SCRAPING FUNCTIONS
// ============================================

async function startTikTokScrape(keyword, options = {}) {
  const { region = 'US', category = '', limit = 30 } = options;

  if (!APIFY_TOKEN) {
    const mockProducts = getMockTikTokProducts(keyword, 20);
    const job = db.prepare(`
      INSERT INTO tiktok_scrape_jobs (job_type, search_keyword, category, region, status, result_count, completed_at)
      VALUES (?, ?, ?, ?, 'complete', ?, CURRENT_TIMESTAMP)
    `).run('keyword_search', keyword, category, region, mockProducts.length);

    // Process mock products
    await processTikTokProducts(keyword, mockProducts);
    return { jobId: job.lastInsertRowid, mock: true, resultCount: mockProducts.length };
  }

  const input = {
    keyword: keyword,
    country: region,
    maxItems: limit
  };

  try {
    console.log(`Starting TikTok scrape for "${keyword}" (region: ${region})...`);
    const response = await fetch(
      `https://api.apify.com/v2/acts/${TIKTOK_SCRAPER_ID}/runs?token=${APIFY_TOKEN}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log(`TikTok Apify run started: ${data.data.id}`);

    const job = db.prepare(`
      INSERT INTO tiktok_scrape_jobs (job_type, search_keyword, category, region, apify_run_id, status, input_params)
      VALUES (?, ?, ?, ?, ?, 'running', ?)
    `).run('keyword_search', keyword, category, region, data.data.id, JSON.stringify(input));

    return { jobId: job.lastInsertRowid, apifyRunId: data.data.id };
  } catch (error) {
    console.error('TikTok Apify error:', error);
    const job = db.prepare(`
      INSERT INTO tiktok_scrape_jobs (job_type, search_keyword, category, region, status, error_message, completed_at)
      VALUES (?, ?, ?, ?, 'error', ?, CURRENT_TIMESTAMP)
    `).run('keyword_search', keyword, category, region, error.message);
    return { jobId: job.lastInsertRowid, error: error.message };
  }
}

function transformTikTokResults(apifyResults, keyword) {
  if (!Array.isArray(apifyResults)) return [];

  const seen = new Set();
  return apifyResults.filter(item => {
    // Deduplicate by product ID
    const id = item.product_id || item.productId || item.id || item.item_id || '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map(item => {
    const productId = String(item.product_id || item.productId || item.id || item.item_id || `tt_${Date.now()}_${Math.random()}`);
    const title = item.title || item.product_title || item.name || item.productName || '';
    const description = item.description || item.product_description || '';

    // Price extraction — handle various formats
    let price = 0, originalPrice = 0;
    if (item.price !== undefined) {
      price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : Number(item.price);
    } else if (item.finalPrice !== undefined) {
      price = Number(item.finalPrice);
    } else if (item.current_price !== undefined) {
      price = Number(item.current_price);
    }
    if (item.original_price !== undefined) {
      originalPrice = typeof item.original_price === 'string' ? parseFloat(item.original_price.replace(/[^0-9.]/g, '')) : Number(item.original_price);
    } else if (item.originalPrice !== undefined) {
      originalPrice = Number(item.originalPrice);
    }

    const soldCount = item.sold_count || item.soldCount || item.sales || item.sold || '';
    const soldCountNum = parseSoldCount(soldCount);

    const rating = Number(item.rating || item.star_rating || item.average_rating || 0);
    const reviewCount = Number(item.review_count || item.reviewCount || item.reviews || 0);

    const sellerName = item.seller_name || item.sellerName || item.shop_name || item.shopName || '';
    const sellerUrl = item.seller_url || item.sellerUrl || item.shop_url || item.shopUrl || '';
    const productUrl = item.product_url || item.productUrl || item.url || item.link || '';
    const imageUrl = item.image_url || item.imageUrl || item.cover || item.thumbnail || item.image || '';
    const category = item.category || item.product_category || '';
    const currency = item.currency || 'USD';

    return {
      product_id: productId,
      title,
      description,
      price: price || 0,
      original_price: originalPrice || price || 0,
      currency,
      sold_count: String(soldCount),
      sold_count_num: soldCountNum,
      rating,
      review_count: reviewCount,
      seller_name: sellerName,
      seller_url: sellerUrl,
      product_url: productUrl,
      image_url: imageUrl,
      category,
      search_keyword: keyword,
      region: 'US'
    };
  });
}

async function processTikTokProducts(keyword, products) {
  const today = new Date().toISOString().split('T')[0];
  const processed = [];

  for (const p of products) {
    const existing = db.prepare('SELECT * FROM tiktok_products WHERE product_id = ?').get(p.product_id);

    if (existing) {
      // Update existing product
      let storedUrl = existing.stored_image_url;
      if (!storedUrl && p.image_url) {
        storedUrl = await downloadTikTokImage(p.product_id, p.image_url);
      }
      db.prepare(`
        UPDATE tiktok_products SET
          title = COALESCE(?, title), price = COALESCE(?, price), original_price = COALESCE(?, original_price),
          sold_count = COALESCE(?, sold_count), sold_count_num = COALESCE(?, sold_count_num),
          rating = COALESCE(?, rating), review_count = COALESCE(?, review_count),
          image_url = COALESCE(?, image_url), stored_image_url = COALESCE(?, stored_image_url),
          last_seen = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).run(p.title, p.price, p.original_price, p.sold_count, p.sold_count_num,
        p.rating, p.review_count, p.image_url, storedUrl, today, p.product_id);
      processed.push({ ...existing, updated: true });
    } else {
      // Insert new product
      const storedUrl = await downloadTikTokImage(p.product_id, p.image_url);
      db.prepare(`
        INSERT INTO tiktok_products (
          product_id, title, description, price, original_price, currency,
          sold_count, sold_count_num, rating, review_count,
          seller_name, seller_url, product_url, image_url, stored_image_url,
          category, search_keyword, region, first_seen, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        p.product_id, p.title, p.description, p.price, p.original_price, p.currency,
        p.sold_count, p.sold_count_num, p.rating, p.review_count,
        p.seller_name, p.seller_url, p.product_url, p.image_url, storedUrl,
        p.category, keyword, p.region, today, today
      );
      processed.push({ ...p, isNew: true });
    }
  }
  return processed;
}

function crossReferenceMeta(productTitle) {
  if (!productTitle) return null;
  // Search brands table for matching brand names (fuzzy)
  const words = productTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    const brand = db.prepare('SELECT * FROM brands WHERE LOWER(brand_name) LIKE ?').get(`%${word}%`);
    if (brand) return brand;
  }
  return null;
}

// ============================================
// AI ANALYSIS (Gemini)
// ============================================

async function analyzeAdCreative(ad) {
  if (ad.ai_asset_type && ad.ai_visual_format && ad.ai_messaging_angle && ad.ai_hook_tactic && ad.ai_offer_type) {
    return { asset_type: ad.ai_asset_type, visual_format: ad.ai_visual_format, messaging_angle: ad.ai_messaging_angle, hook_tactic: ad.ai_hook_tactic, offer_type: ad.ai_offer_type };
  }

  if (!GEMINI_API_KEY) return getMockAdAnalysis();

  const prompt = `Analyze this DTC ad creative. Return a JSON object with these 5 categories:
1. "asset_type": ONE from: "UGC", "High Production", "Static Image", "Animation", "Screen Recording", "Stock Footage"
2. "visual_format": ONE from: "Talking Head", "Product Demo", "Unboxing", "Before/After", "Split Screen", "Text Overlay", "Lifestyle", "Testimonial Compilation", "Tutorial", "Behind the Scenes", "Product on White", "User Review", "Skit", "ASMR", "Green Screen"
3. "messaging_angle": ONE from: "Problem/Solution", "Social Proof", "FOMO", "Aspiration", "Value Proposition", "Fear/Pain Point", "Curiosity", "Authority/Expert", "Comparison", "Transformation", "Humor", "Urgency", "Exclusivity", "Community"
4. "hook_tactic": ONE from: "Pattern Interrupt", "Question", "Bold Claim", "Curiosity Gap", "Controversy", "Relatable Scenario", "Shocking Stat", "Direct Address", "Visual Surprise", "Sound Effect", "Text Hook", "Celebrity/Influencer", "Unboxing Reveal"
5. "offer_type": ONE from: "Percentage Off", "Dollar Amount Off", "Free Shipping", "BOGO", "Free Trial", "Free Gift", "Bundle Deal", "Subscribe & Save", "Limited Time", "No Offer"

Ad copy: ${ad.ad_copy || 'N/A'}
Headline: ${ad.headline || 'N/A'}
CTA: ${ad.cta_type || 'N/A'}

Return ONLY valid JSON with these 5 keys.`;

  try {
    const parts = [];
    // Try to include image
    if (ad.creative_url && !isVideoFileUrl(ad.creative_url)) {
      try {
        const imageResponse = await fetch(ad.creative_url);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          parts.push({ inlineData: { mimeType: imageResponse.headers.get('content-type') || 'image/jpeg', data: Buffer.from(imageBuffer).toString('base64') } });
        }
      } catch (e) { /* skip image */ }
    }
    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) }
    );
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('No valid JSON in response');
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return getMockAdAnalysis();
  }
}

// ============================================
// AD PROCESSING FUNCTIONS (META)
// ============================================

function transformApifyResults(apifyResults, brandId) {
  const extractBodyText = (body) => {
    if (!body) return '';
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && body.text) return body.text;
    return '';
  };

  const getMediaFingerprint = (url) => {
    if (!url) return '';
    const match = url.match(/\/(\d{10,}_\d+[^\/\?]*)/);
    if (match) return match[1];
    return url.slice(-150);
  };

  // Dedupe by adArchiveID
  const seenIds = new Set();
  const uniqueById = apifyResults.filter(item => {
    const adId = item.adArchiveID || item.adArchiveId || item.adid;
    if (!adId) return true;
    if (seenIds.has(adId)) return false;
    seenIds.add(adId);
    return true;
  });

  // Dedupe by media fingerprint
  const mediaGrouped = new Map();
  for (const item of uniqueById) {
    const snapshot = item.snapshot || {};
    const firstVideo = snapshot.videos?.[0];
    const videoUrl = firstVideo?.video_hd_url || firstVideo?.video_sd_url || '';
    const firstImage = snapshot.images?.[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.resizedImageUrl || firstImage?.url || '');
    const mediaFingerprint = getMediaFingerprint(videoUrl || imageUrl);

    let startTimestamp = 0;
    if (item.startDateFormatted) startTimestamp = new Date(item.startDateFormatted).getTime();
    else if (typeof item.startDate === 'number') startTimestamp = item.startDate * 1000;

    if (mediaFingerprint) {
      const key = `media:${mediaFingerprint}`;
      const existing = mediaGrouped.get(key);
      if (!existing || (startTimestamp > 0 && startTimestamp < existing.startTimestamp)) {
        mediaGrouped.set(key, { item, startTimestamp });
      }
    } else {
      const adId = item.adArchiveID || item.adArchiveId || item.adid || `unique_${Date.now()}_${Math.random()}`;
      mediaGrouped.set(`id:${adId}`, { item, startTimestamp });
    }
  }
  const afterMediaDedup = Array.from(mediaGrouped.values()).map(v => v.item);

  // Dedupe by headline
  const headlineGrouped = new Map();
  for (const item of afterMediaDedup) {
    const snapshot = item.snapshot || {};
    const cards = snapshot.cards || [];
    const firstCard = cards[0] || {};
    const headline = (firstCard.title || snapshot.title || snapshot.link_description || '').trim().toLowerCase();

    let startTimestamp = 0;
    if (item.startDateFormatted) startTimestamp = new Date(item.startDateFormatted).getTime();
    else if (typeof item.startDate === 'number') startTimestamp = item.startDate * 1000;

    if (headline) {
      const key = `headline:${headline}`;
      const existing = headlineGrouped.get(key);
      if (!existing || (startTimestamp > 0 && startTimestamp < existing.startTimestamp)) {
        headlineGrouped.set(key, { item, startTimestamp });
      }
    } else {
      const adId = item.adArchiveID || item.adArchiveId || item.adid || `unique_${Date.now()}_${Math.random()}`;
      headlineGrouped.set(`id:${adId}`, { item, startTimestamp });
    }
  }

  const uniqueResults = Array.from(headlineGrouped.values()).map(v => v.item).slice(0, 10);

  return uniqueResults.map((item, index) => {
    const adId = item.adArchiveID || item.adArchiveId || item.adid || `apify_${Date.now()}_${index}`;
    const snapshot = item.snapshot || {};
    const cards = snapshot.cards || [];
    const firstCard = cards[0] || {};

    let creativeUrl = null, videoUrl = null, creativeType = 'image';
    const extractUrl = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return val.videoHdUrl || val.video_hd_url || val.videoSdUrl || val.video_sd_url || val.resizedImageUrl || val.resized_image_url || val.url || null;
      return null;
    };

    if (firstCard.videoHdUrl || firstCard.videoSdUrl) {
      videoUrl = extractUrl(firstCard.videoHdUrl) || extractUrl(firstCard.videoSdUrl);
      creativeUrl = extractUrl(firstCard.videoPreviewImageUrl) || extractUrl(firstCard.resizedImageUrl);
      creativeType = 'video';
    } else if (firstCard.resizedImageUrl || firstCard.originalImageUrl) {
      creativeUrl = extractUrl(firstCard.resizedImageUrl) || extractUrl(firstCard.originalImageUrl);
    } else if (snapshot.videos?.length > 0) {
      videoUrl = extractUrl(snapshot.videos[0]);
      creativeUrl = extractUrl(snapshot.images?.[0]);
      creativeType = 'video';
    } else if (snapshot.images?.length > 0) {
      creativeUrl = extractUrl(snapshot.images[0]);
    }

    if (creativeUrl && typeof creativeUrl !== 'string') creativeUrl = null;
    if (videoUrl && typeof videoUrl !== 'string') videoUrl = null;

    let adCopy = '';
    if (typeof firstCard.body === 'string') adCopy = firstCard.body;
    else if (firstCard.body?.text) adCopy = firstCard.body.text;
    else if (typeof snapshot.body === 'string') adCopy = snapshot.body;
    else if (snapshot.body?.text) adCopy = snapshot.body.text;

    let startDate = null;
    if (item.startDateFormatted) startDate = item.startDateFormatted.split('T')[0];
    else if (typeof item.startDate === 'number') startDate = new Date(item.startDate * 1000).toISOString().split('T')[0];

    return {
      ad_id: String(adId),
      brand_id: brandId,
      rank: index + 1,
      creative_type: creativeType,
      creative_url: creativeUrl,
      video_url: videoUrl,
      ad_copy: adCopy,
      headline: firstCard.title || snapshot.title || '',
      cta_type: firstCard.ctaText || firstCard.ctaType || snapshot.ctaText || '',
      start_date: startDate,
      ad_library_link: `https://www.facebook.com/ads/library/?id=${adId}`
    };
  });
}

async function processScrapedAds(brandId, scrapedAds) {
  const weekStart = getWeekStart();
  const today = new Date().toISOString().split('T')[0];
  const newAdIds = scrapedAds.map(ad => ad.ad_id);

  if (newAdIds.length > 0) {
    const placeholders = newAdIds.map(() => '?').join(',');
    const adsToDelete = db.prepare(`
      SELECT ad_id, stored_creative_url FROM ad_vault
      WHERE brand_id = ? AND ad_id NOT IN (${placeholders}) AND (bookmarked = 0 OR bookmarked IS NULL)
    `).all(brandId, ...newAdIds);

    db.prepare(`
      DELETE FROM ad_vault WHERE brand_id = ? AND ad_id NOT IN (${placeholders}) AND (bookmarked = 0 OR bookmarked IS NULL)
    `).run(brandId, ...newAdIds);

    for (const oldAd of adsToDelete) {
      if (oldAd.stored_creative_url) {
        try { fs.unlinkSync(path.join(__dirname, 'public', oldAd.stored_creative_url)); } catch (e) { /* ignore */ }
      }
    }
  }

  const processedAds = [];
  for (const ad of scrapedAds) {
    const existing = db.prepare('SELECT * FROM ad_vault WHERE ad_id = ?').get(ad.ad_id);
    if (existing) {
      const lastSeenDate = existing.last_seen ? new Date(existing.last_seen + 'T00:00:00') : null;
      const lastWeek = lastSeenDate ? getWeekStart(lastSeenDate) : null;
      const weeksInTop10 = (lastWeek && lastWeek !== weekStart) ? existing.weeks_in_top10 + 1 : existing.weeks_in_top10;
      let storedUrl = existing.stored_creative_url;
      if (!storedUrl && ad.creative_url) storedUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);

      db.prepare(`
        UPDATE ad_vault SET last_seen = ?, rank = ?, weeks_in_top10 = ?,
            creative_url = COALESCE(?, creative_url), creative_type = COALESCE(?, creative_type),
            video_url = COALESCE(?, video_url), stored_creative_url = COALESCE(?, stored_creative_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE ad_id = ?
      `).run(today, ad.rank, weeksInTop10, ad.creative_url, ad.creative_type, ad.video_url, storedUrl, ad.ad_id);
      processedAds.push({ ...existing, rank: ad.rank, isNew: false });
    } else {
      const storedCreativeUrl = await downloadCreativeImage(ad.ad_id, ad.creative_url);
      const allParams = [
        String(ad.ad_id), brandId, today, ad.rank || 0, String(ad.creative_type || 'image'),
        ad.creative_url || null, ad.video_url || null, storedCreativeUrl,
        String(ad.ad_copy || ''), String(ad.headline || ''), String(ad.cta_type || ''),
        ad.start_date || null, String(ad.ad_library_link || ''),
        null, null, null, null, today, today, 1
      ];
      for (let i = 0; i < allParams.length; i++) {
        if (allParams[i] !== null && typeof allParams[i] === 'object') allParams[i] = JSON.stringify(allParams[i]);
      }
      const result = db.prepare(`
        INSERT INTO ad_vault (ad_id, brand_id, date_scraped, rank, creative_type, creative_url, video_url, stored_creative_url,
          ad_copy, headline, cta_type, start_date, ad_library_link, ai_format, ai_hook, ai_visual_style, ai_angle,
          first_seen, last_seen, weeks_in_top10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...allParams);
      processedAds.push({ ...ad, id: result.lastInsertRowid, isNew: true });
    }

    db.prepare(`INSERT OR REPLACE INTO weekly_snapshots (brand_id, ad_id, week_start, rank) VALUES (?, ?, ?, ?)`)
      .run(brandId, ad.ad_id, weekStart, ad.rank);
  }

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
    const brands = db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM ad_vault WHERE brand_id = b.id) as ad_count,
        (SELECT COUNT(*) FROM ad_vault WHERE brand_id = b.id AND weeks_in_top10 >= 4) as evergreen_count
      FROM brands b WHERE b.status = 'active' ORDER BY b.brand_name
    `).all();
    res.json(brands);
  } catch (error) { res.status(500).json({ error: 'Failed to get brands' }); }
});

app.post('/api/brands', async (req, res) => {
  try {
    const { brand_name, website_url, ad_library_url, vertical } = req.body;
    if (!brand_name || !ad_library_url) return res.status(400).json({ error: 'Brand name and Ad Library URL are required' });

    const pageIdMatch = ad_library_url.match(/view_all_page_id=(\d+)/);
    if (!pageIdMatch) return res.status(400).json({ error: 'Could not extract Page ID from URL' });

    const page_id = pageIdMatch[1];
    const result = db.prepare(`INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical) VALUES (?, ?, ?, ?, ?)`)
      .run(brand_name, website_url, ad_library_url, page_id, vertical);

    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);
    if (brand) {
      const scrapeResult = await startAdLibraryScrape(brand);
      res.json({ success: true, id: result.lastInsertRowid, brandId: result.lastInsertRowid, page_id, scrapeJobId: scrapeResult.jobId });
    } else {
      res.json({ success: true, id: result.lastInsertRowid, page_id });
    }
  } catch (error) { res.status(500).json({ error: 'Failed to create brand' }); }
});

app.put('/api/brands/:id', (req, res) => {
  try {
    const { brand_name, website_url, fb_page_url, page_id, vertical, status } = req.body;
    db.prepare(`UPDATE brands SET brand_name = COALESCE(?, brand_name), website_url = COALESCE(?, website_url),
      fb_page_url = COALESCE(?, fb_page_url), page_id = COALESCE(?, page_id), vertical = COALESCE(?, vertical),
      status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(brand_name, website_url, fb_page_url, page_id, vertical, status, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to update brand' }); }
});

app.delete('/api/brands/:id', (req, res) => {
  try {
    const brandId = req.params.id;
    db.prepare('DELETE FROM weekly_snapshots WHERE brand_id = ?').run(brandId);
    db.prepare('DELETE FROM ad_vault WHERE brand_id = ?').run(brandId);
    db.prepare('DELETE FROM scrape_jobs WHERE brand_id = ?').run(brandId);
    db.prepare('DELETE FROM brands WHERE id = ?').run(brandId);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete brand' }); }
});

app.post('/api/brands/:id/resolve-page-id', async (req, res) => {
  try {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    const pageId = await resolvePageId(brand.fb_page_url);
    if (pageId) {
      db.prepare('UPDATE brands SET page_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(pageId, brand.id);
      res.json({ success: true, pageId });
    } else {
      res.status(400).json({ error: 'Could not resolve Page ID' });
    }
  } catch (error) { res.status(500).json({ error: 'Failed to resolve Page ID' }); }
});

// ============================================
// ROUTES - ADS API
// ============================================

app.get('/api/ads', (req, res) => {
  try {
    const { brand_ids, evergreen_only, min_weeks, date_from, date_to, media_type, sort = 'newest', limit = 50, offset = 0,
      ai_asset_type, ai_visual_format, ai_messaging_angle, ai_hook_tactic, ai_offer_type } = req.query;

    let query = `SELECT a.*, b.brand_name, b.vertical FROM ad_vault a JOIN brands b ON a.brand_id = b.id WHERE 1=1`;
    const params = [];

    const brandIdArray = brand_ids ? (Array.isArray(brand_ids) ? brand_ids : [brand_ids]) : [];
    if (brandIdArray.length > 0) {
      query += ` AND a.brand_id IN (${brandIdArray.map(() => '?').join(',')})`;
      params.push(...brandIdArray);
    }
    if (date_from) { query += ' AND a.start_date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND a.start_date <= ?'; params.push(date_to); }
    if (media_type) { query += ' AND a.creative_type = ?'; params.push(media_type); }

    const aiFilters = [
      { param: ai_asset_type, column: 'ai_asset_type' }, { param: ai_visual_format, column: 'ai_visual_format' },
      { param: ai_messaging_angle, column: 'ai_messaging_angle' }, { param: ai_hook_tactic, column: 'ai_hook_tactic' },
      { param: ai_offer_type, column: 'ai_offer_type' }
    ];
    for (const { param, column } of aiFilters) {
      if (param) {
        const values = Array.isArray(param) ? param : [param];
        query += ` AND a.${column} IN (${values.map(() => '?').join(',')})`;
        params.push(...values);
      }
    }
    if (evergreen_only === 'true' || min_weeks) {
      query += ' AND a.weeks_in_top10 >= ?';
      params.push(parseInt(min_weeks) || 4);
    }

    if (sort === 'rank') query += ' ORDER BY a.rank ASC, a.start_date DESC';
    else query += ` ORDER BY a.start_date ${sort === 'oldest' ? 'ASC' : 'DESC'}, a.rank ASC`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    res.json(db.prepare(query).all(...params));
  } catch (error) { res.status(500).json({ error: 'Failed to get ads' }); }
});

app.get('/api/ads/bookmarked', (req, res) => {
  try {
    res.json(db.prepare(`SELECT a.*, b.brand_name, b.vertical FROM ad_vault a JOIN brands b ON a.brand_id = b.id WHERE a.bookmarked = 1 ORDER BY a.updated_at DESC`).all());
  } catch (error) { res.status(500).json({ error: 'Failed to get bookmarked ads' }); }
});

app.get('/api/ads/:id', (req, res) => {
  try {
    const ad = db.prepare(`SELECT a.*, b.brand_name, b.vertical, b.website_url FROM ad_vault a JOIN brands b ON a.brand_id = b.id WHERE a.id = ?`).get(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json(ad);
  } catch (error) { res.status(500).json({ error: 'Failed to get ad' }); }
});

app.post('/api/ads/:id/analyze', async (req, res) => {
  try {
    const ad = db.prepare('SELECT * FROM ad_vault WHERE id = ?').get(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    const analysis = await analyzeAdCreative(ad);
    db.prepare(`UPDATE ad_vault SET ai_asset_type = ?, ai_visual_format = ?, ai_messaging_angle = ?,
        ai_hook_tactic = ?, ai_offer_type = ?, ai_raw_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(analysis.asset_type, analysis.visual_format, analysis.messaging_angle, analysis.hook_tactic, analysis.offer_type, JSON.stringify(analysis), ad.id);
    res.json(analysis);
  } catch (error) { res.status(500).json({ error: 'Failed to analyze ad' }); }
});

app.get('/api/ads/unanalyzed/count', (req, res) => {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ad_vault WHERE ai_asset_type IS NULL OR ai_asset_type = ''`).get();
    res.json({ count: result.count });
  } catch (error) { res.status(500).json({ error: 'Failed to get count' }); }
});

app.post('/api/ads/analyze-batch', async (req, res) => {
  try {
    const unanalyzedAds = db.prepare(`SELECT * FROM ad_vault WHERE ai_asset_type IS NULL OR ai_asset_type = '' ORDER BY created_at DESC`).all();
    if (unanalyzedAds.length === 0) return res.json({ analyzed: 0 });

    res.json({ message: `Analyzing ${unanalyzedAds.length} ads in background...`, total: unanalyzedAds.length });
    runBatchAnalysis().catch(err => console.error('Batch analysis error:', err));
  } catch (error) { res.status(500).json({ error: 'Failed to batch analyze ads' }); }
});

app.post('/api/ads/:id/bookmark', (req, res) => {
  try {
    const ad = db.prepare('SELECT id, bookmarked FROM ad_vault WHERE id = ?').get(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    const newStatus = ad.bookmarked ? 0 : 1;
    db.prepare('UPDATE ad_vault SET bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, ad.id);
    res.json({ bookmarked: newStatus === 1 });
  } catch (error) { res.status(500).json({ error: 'Failed to toggle bookmark' }); }
});

// ============================================
// ROUTES - META SCRAPE API
// ============================================

app.post('/api/scrape/brand/:id', async (req, res) => {
  try {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    if (!brand.page_id) return res.status(400).json({ error: 'Brand does not have a Page ID' });
    res.json(await startAdLibraryScrape(brand));
  } catch (error) { res.status(500).json({ error: 'Failed to start scrape' }); }
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
  } catch (error) { res.status(500).json({ error: 'Failed to start scrape' }); }
});

app.get('/api/scrape/status/:jobId', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM scrape_jobs WHERE id = ?').get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'complete' || job.status === 'error') return res.json({ status: job.status, resultCount: job.result_count });

    if (job.apify_run_id) {
      const apifyStatus = await pollApifyJob(job.apify_run_id);
      if (apifyStatus === 'SUCCEEDED') {
        const apifyResults = await getApifyResults(job.apify_run_id);
        const transformedAds = transformApifyResults(apifyResults, job.brand_id);
        const processedAds = await processScrapedAds(job.brand_id, transformedAds);
        db.prepare(`UPDATE scrape_jobs SET status = 'complete', results = ?, result_count = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(JSON.stringify(processedAds), processedAds.length, job.id);
        return res.json({ status: 'complete', resultCount: processedAds.length });
      }
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(apifyStatus)) {
        db.prepare(`UPDATE scrape_jobs SET status = 'error', error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(`Apify job ${apifyStatus}`, job.id);
        return res.json({ status: 'error', error: `Job ${apifyStatus}` });
      }
      return res.json({ status: 'running' });
    }
    res.json({ status: job.status });
  } catch (error) { res.status(500).json({ error: 'Status check failed' }); }
});

// ============================================
// ROUTES - TIKTOK API
// ============================================

// Start a TikTok product search
app.post('/api/tiktok/scrape', async (req, res) => {
  try {
    const { keyword, category, region } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });
    const result = await startTikTokScrape(keyword, { region, category });
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed to start TikTok scrape' }); }
});

// Poll TikTok scrape job status
app.get('/api/tiktok/scrape/status/:jobId', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM tiktok_scrape_jobs WHERE id = ?').get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'complete' || job.status === 'error') return res.json({ status: job.status, resultCount: job.result_count });

    if (job.apify_run_id) {
      const apifyStatus = await pollApifyJob(job.apify_run_id);
      if (apifyStatus === 'SUCCEEDED') {
        const apifyResults = await getApifyResults(job.apify_run_id);
        const transformed = transformTikTokResults(apifyResults, job.search_keyword);
        const processed = await processTikTokProducts(job.search_keyword, transformed);
        db.prepare(`UPDATE tiktok_scrape_jobs SET status = 'complete', result_count = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(processed.length, job.id);
        return res.json({ status: 'complete', resultCount: processed.length });
      }
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(apifyStatus)) {
        db.prepare(`UPDATE tiktok_scrape_jobs SET status = 'error', error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(`Apify job ${apifyStatus}`, job.id);
        return res.json({ status: 'error', error: `Job ${apifyStatus}` });
      }
      return res.json({ status: 'running' });
    }
    res.json({ status: job.status });
  } catch (error) { res.status(500).json({ error: 'Status check failed' }); }
});

// List TikTok products with filters
app.get('/api/tiktok/products', (req, res) => {
  try {
    const { keyword, category, region, sort = 'sold', bookmarked_only, validated_only, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM tiktok_products WHERE 1=1';
    const params = [];

    if (keyword) { query += ' AND search_keyword LIKE ?'; params.push(`%${keyword}%`); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (region) { query += ' AND region = ?'; params.push(region); }
    if (bookmarked_only === 'true') { query += ' AND bookmarked = 1'; }
    if (validated_only === 'true') { query += " AND meta_validation_status = 'validated'"; }

    switch (sort) {
      case 'price_low': query += ' ORDER BY price ASC'; break;
      case 'price_high': query += ' ORDER BY price DESC'; break;
      case 'rating': query += ' ORDER BY rating DESC'; break;
      case 'newest': query += ' ORDER BY created_at DESC'; break;
      default: query += ' ORDER BY sold_count_num DESC'; break;
    }
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    res.json(db.prepare(query).all(...params));
  } catch (error) { res.status(500).json({ error: 'Failed to get TikTok products' }); }
});

// Get single TikTok product
app.get('/api/tiktok/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM tiktok_products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) { res.status(500).json({ error: 'Failed to get product' }); }
});

// Toggle bookmark on TikTok product
app.post('/api/tiktok/products/:id/bookmark', (req, res) => {
  try {
    const product = db.prepare('SELECT id, bookmarked FROM tiktok_products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const newStatus = product.bookmarked ? 0 : 1;
    db.prepare('UPDATE tiktok_products SET bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, product.id);
    res.json({ bookmarked: newStatus === 1 });
  } catch (error) { res.status(500).json({ error: 'Failed to toggle bookmark' }); }
});

// Cross-reference TikTok product with Meta brands
app.post('/api/tiktok/products/:id/validate', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM tiktok_products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const brand = crossReferenceMeta(product.title);
    if (brand) {
      db.prepare('UPDATE tiktok_products SET meta_brand_id = ?, meta_validation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(brand.id, 'validated', product.id);
      const adCount = db.prepare('SELECT COUNT(*) as count FROM ad_vault WHERE brand_id = ?').get(brand.id);
      res.json({ validated: true, brand_name: brand.brand_name, brand_id: brand.id, ad_count: adCount.count });
    } else {
      db.prepare("UPDATE tiktok_products SET meta_validation_status = 'no_match', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(product.id);
      res.json({ validated: false, message: 'No matching Meta brand found' });
    }
  } catch (error) { res.status(500).json({ error: 'Failed to validate product' }); }
});

// Update notes on TikTok product
app.put('/api/tiktok/products/:id/notes', (req, res) => {
  try {
    const { notes } = req.body;
    db.prepare('UPDATE tiktok_products SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(notes, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to update notes' }); }
});

// ============================================
// ROUTES - TIKTOK SAVED SEARCHES
// ============================================

app.get('/api/tiktok/searches', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM tiktok_searches ORDER BY created_at DESC').all());
  } catch (error) { res.status(500).json({ error: 'Failed to get searches' }); }
});

app.post('/api/tiktok/searches', (req, res) => {
  try {
    const { name, keyword, category, region } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });
    const result = db.prepare('INSERT INTO tiktok_searches (name, keyword, category, region) VALUES (?, ?, ?, ?)').run(name || keyword, keyword, category || '', region || 'US');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) { res.status(500).json({ error: 'Failed to save search' }); }
});

app.delete('/api/tiktok/searches/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tiktok_searches WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete search' }); }
});

app.post('/api/tiktok/searches/:id/run', async (req, res) => {
  try {
    const search = db.prepare('SELECT * FROM tiktok_searches WHERE id = ?').get(req.params.id);
    if (!search) return res.status(404).json({ error: 'Search not found' });
    const result = await startTikTokScrape(search.keyword, { region: search.region, category: search.category });
    db.prepare('UPDATE tiktok_searches SET last_run = CURRENT_TIMESTAMP WHERE id = ?').run(search.id);
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed to run search' }); }
});

app.put('/api/tiktok/searches/:id/schedule', (req, res) => {
  try {
    const { is_scheduled } = req.body;
    db.prepare('UPDATE tiktok_searches SET is_scheduled = ? WHERE id = ?').run(is_scheduled ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to update schedule' }); }
});

// ============================================
// ROUTES - ANALYTICS API
// ============================================

app.get('/api/analytics/evergreen', (req, res) => {
  try {
    const { min_weeks = 4 } = req.query;
    res.json(db.prepare(`SELECT a.*, b.brand_name, b.vertical FROM ad_vault a JOIN brands b ON a.brand_id = b.id
      WHERE a.weeks_in_top10 >= ? ORDER BY a.weeks_in_top10 DESC, a.rank ASC`).all(parseInt(min_weeks)));
  } catch (error) { res.status(500).json({ error: 'Failed to get evergreen ads' }); }
});

app.get('/api/analytics/by-vertical', (req, res) => {
  try {
    res.json(db.prepare(`SELECT b.vertical, COUNT(DISTINCT b.id) as brand_count, COUNT(a.id) as ad_count,
      AVG(a.weeks_in_top10) as avg_weeks_in_top10
      FROM brands b LEFT JOIN ad_vault a ON a.brand_id = b.id WHERE b.status = 'active'
      GROUP BY b.vertical ORDER BY ad_count DESC`).all());
  } catch (error) { res.status(500).json({ error: 'Failed to get vertical stats' }); }
});

// ============================================
// ROUTES - IMPORT/EXPORT
// ============================================

app.post('/api/import/brands', (req, res) => {
  try {
    const { brands } = req.body;
    if (!Array.isArray(brands)) return res.status(400).json({ error: 'Expected array of brands' });
    const inserted = [], errors = [];
    for (const brand of brands) {
      try {
        const result = db.prepare(`INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical) VALUES (?, ?, ?, ?, ?)`)
          .run(brand.brand_name, brand.website_url, brand.fb_page_url, brand.page_id, brand.vertical);
        inserted.push({ id: result.lastInsertRowid, brand_name: brand.brand_name });
      } catch (e) { errors.push({ brand_name: brand.brand_name, error: e.message }); }
    }
    res.json({ success: true, inserted, errors });
  } catch (error) { res.status(500).json({ error: 'Failed to import brands' }); }
});

app.get('/api/export/ads', (req, res) => {
  try {
    const ads = db.prepare(`SELECT a.ad_id, b.brand_name, b.vertical, a.rank, a.creative_type, a.ad_copy, a.headline, a.cta_type,
      a.ai_format, a.ai_hook, a.ai_visual_style, a.ai_angle, a.first_seen, a.last_seen, a.weeks_in_top10, a.ad_library_link
      FROM ad_vault a JOIN brands b ON a.brand_id = b.id ORDER BY b.brand_name, a.rank`).all();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=meta_ads_export.json');
    res.json(ads);
  } catch (error) { res.status(500).json({ error: 'Failed to export ads' }); }
});

// ============================================
// ROUTES - SETTINGS API
// ============================================

app.get('/api/settings/schedule', (req, res) => {
  try { res.json({ meta: getScheduleSettings(), tiktok: getTikTokScheduleSettings() }); }
  catch (error) { res.status(500).json({ error: 'Failed to get settings' }); }
});

app.post('/api/settings/schedule', (req, res) => {
  try {
    const { enabled, day, hour, autoAnalyze } = req.body;
    setSetting('schedule_enabled', enabled ? 'true' : 'false');
    setSetting('schedule_day', String(day));
    setSetting('schedule_hour', String(hour));
    setSetting('auto_analyze', autoAnalyze ? 'true' : 'false');
    setupScheduledScrape();
    res.json({ success: true, settings: getScheduleSettings() });
  } catch (error) { res.status(500).json({ error: 'Failed to update settings' }); }
});

app.post('/api/settings/tiktok-schedule', (req, res) => {
  try {
    const { enabled, day, hour } = req.body;
    setSetting('tiktok_schedule_enabled', enabled ? 'true' : 'false');
    setSetting('tiktok_schedule_day', String(day));
    setSetting('tiktok_schedule_hour', String(hour));
    setupTikTokScheduledScrape();
    res.json({ success: true, settings: getTikTokScheduleSettings() });
  } catch (error) { res.status(500).json({ error: 'Failed to update TikTok schedule' }); }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\nMeta Ad Monitor + TikTok Research running at http://localhost:${PORT}`);
  console.log(`Apify: ${APIFY_TOKEN ? 'Connected' : 'Demo mode (mock data)'}`);
  console.log(`Gemini AI: ${GEMINI_API_KEY ? 'Connected' : 'Mock analysis'}`);
  console.log(`TikTok Scraper: ${TIKTOK_SCRAPER_ID}`);
  console.log('');
});
