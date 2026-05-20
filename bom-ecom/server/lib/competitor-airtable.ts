/**
 * competitor-airtable.ts
 * filepath: bom-ecom/server/lib/competitor-airtable.ts
 *
 * Airtable client for the Meta Ad Intelligence base (appTXrjxnh0XRggsp).
 * Separate from the main Bomb Ecom OS Airtable base (appvPrfjiuXIhdNuW).
 *
 * Tables:
 *   - Brands       (tblFVM7R5bdVjJ6ZJ): DTC brands being monitored
 *   - Ad Fetch Jobs (tblTfQFRzKIzdyWd5): Scrape job queue
 *   - Ads (Ad Intelligence) (tblrQjmINznO4rgtk): Scraped ads + AI analysis
 */

// TODO: Import Airtable SDK or use fetch-based client (matches existing airtable.ts pattern)
// import Airtable from 'airtable';

const COMPETITOR_BASE_ID = process.env.AIRTABLE_COMPETITOR_BASE_ID || 'appTXrjxnh0XRggsp';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';

const TABLE_IDS = {
  brands: 'tblFVM7R5bdVjJ6ZJ',
  adFetchJobs: 'tblTfQFRzKIzdyWd5',
  ads: 'tblrQjmINznO4rgtk',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetaBrand {
  id?: string;          // Airtable record ID
  brand_name: string;
  facebook_page_url: string;
  created_at?: string;
}

export interface AdFetchJob {
  id?: string;
  status: 'Queued' | 'Running' | 'Done' | 'Error';
  brands: string[];     // Airtable record IDs
  lookback_window: 'last24h' | 'last7d' | 'last14d' | 'last30d' | 'all';
  top_n: number;
  run_now: boolean;
  created_at?: string;
}

export interface MetaAd {
  id?: string;
  ad_id: string;
  ad_archive_id: string;
  page_id: string;
  page_name: string;
  start_date?: string;
  end_date?: string;
  platform: 'facebook' | 'instagram';
  display_format: 'video' | 'carousel' | 'image' | 'dco' | 'dpa';
  permalink_url?: string;
  media_url?: string;
  ad_text?: string;
  text_hook?: string;       // First 50 chars (computed by Airtable formula)
  hook_excerpt?: string;    // AI-written hook summary
  visual_notes?: string;    // AI visual description
  analysis_json?: string;   // Full AI analysis JSON (5 tags)
  status: 'Not Analyzed' | 'Analyzing' | 'Analyzed';
  is_active: boolean;
  brand: string[];          // Airtable record IDs
  job?: string[];           // Airtable record IDs
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function airtableFetch(path: string, options: RequestInit = {}) {
  // TODO: Implement rate limiting + exponential backoff (matches existing airtable.ts pattern)
  const url = `https://api.airtable.com/v0/${COMPETITOR_BASE_ID}/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function fetchBrands(): Promise<MetaBrand[]> {
  // TODO: Implement pagination for >100 brands
  const data = await airtableFetch(TABLE_IDS.brands);
  return (data.records || []).map((r: any) => ({ id: r.id, ...r.fields }));
}

export async function createBrand(brand: Omit<MetaBrand, 'id'>): Promise<MetaBrand> {
  const data = await airtableFetch(TABLE_IDS.brands, {
    method: 'POST',
    body: JSON.stringify({ fields: brand }),
  });
  return { id: data.id, ...data.fields };
}

export async function deleteBrand(recordId: string): Promise<void> {
  await airtableFetch(`${TABLE_IDS.brands}/${recordId}`, { method: 'DELETE' });
}

// ─── Ad Fetch Jobs ────────────────────────────────────────────────────────────

export async function createAdFetchJob(job: Omit<AdFetchJob, 'id'>): Promise<AdFetchJob> {
  const data = await airtableFetch(TABLE_IDS.adFetchJobs, {
    method: 'POST',
    body: JSON.stringify({ fields: job }),
  });
  return { id: data.id, ...data.fields };
}

export async function updateJobStatus(recordId: string, status: AdFetchJob['status']): Promise<void> {
  await airtableFetch(`${TABLE_IDS.adFetchJobs}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { status } }),
  });
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

export async function fetchAds(options: {
  brandRecordId?: string;
  status?: MetaAd['status'];
  maxRecords?: number;
} = {}): Promise<MetaAd[]> {
  // TODO: Build filterByFormula from options
  const params = new URLSearchParams();
  if (options.maxRecords) params.set('maxRecords', String(options.maxRecords));
  // TODO: Add filterByFormula for brand and status filters
  const data = await airtableFetch(`${TABLE_IDS.ads}?${params}`);
  return (data.records || []).map((r: any) => ({ id: r.id, ...r.fields }));
}

export async function upsertAds(ads: Omit<MetaAd, 'id'>[]): Promise<void> {
  // TODO: Batch upsert in groups of 10 (Airtable limit)
  // Use PATCH with performUpsert on ad_archive_id field
  for (let i = 0; i < ads.length; i += 10) {
    const batch = ads.slice(i, i + 10);
    await airtableFetch(TABLE_IDS.ads, {
      method: 'POST',
      body: JSON.stringify({ records: batch.map(ad => ({ fields: ad })) }),
    });
  }
}

export async function updateAdAnalysis(recordId: string, analysis: {
  hook_excerpt: string;
  visual_notes: string;
  analysis_json: string;
  status: 'Analyzed';
}): Promise<void> {
  await airtableFetch(`${TABLE_IDS.ads}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: analysis }),
  });
}
