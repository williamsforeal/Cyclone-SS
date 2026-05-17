export type ScrapeSource =
  | {
      type: "apify";
      actor_id: string;
      input: Record<string, unknown>;
    }
  | {
      type: "firecrawl";
      url: string;
      mode: "scrape" | "crawl" | "extract";
      options?: {
        formats?: Array<"markdown" | "html" | "json" | "links">;
        jsonSchema?: Record<string, unknown>;
        limit?: number;
      };
    };

export type ScrapeDestination =
  | { kind: "competitor_ads"; brand_handle: string }
  | { kind: "product_intel"; product_id: string }
  | { kind: "trend_items"; niche: string }
  | { kind: "customer_reviews"; product_id: string };

export interface ScrapeJob {
  job_id: number;
  source: ScrapeSource;
  destination: ScrapeDestination;
  triggered_by: "manual" | "schedule" | "agent";
  callback_url: string;
  created_at: string;
}

export type ScrapedItem = {
  source_run_id: string;
  source_url?: string;
  scraped_at: string;
  payload:
    | {
        kind: "competitor_ad";
        brand: string;
        copy: { headline?: string; body: string; cta?: string };
        creative_url?: string;
        metrics?: { likes?: number; comments?: number; estimated_spend?: number };
      }
    | {
        kind: "product_page";
        brand?: string;
        price?: number;
        title: string;
        description_md: string;
        image_urls: string[];
        claims?: string[];
      }
    | {
        kind: "trend_item";
        platform: "tiktok" | "instagram" | "reels";
        creator: string;
        caption: string;
        metrics: { views: number; likes: number; comments: number; shares: number };
      }
    | {
        kind: "review";
        rating: number;
        title?: string;
        body: string;
        verified: boolean;
        date?: string;
      };
  raw: Record<string, unknown>;
};

export interface ScrapeJobResult {
  job_id: number;
  status: "success" | "failed";
  item_count: number;
  airtable_record_ids?: string[];
  errors?: string[];
}

export type ScrapePresetInput =
  | { preset: "competitor_meta_ads"; brand: string }
  | { preset: "product_page_intel"; url: string; product_id: string }
  | { preset: "tiktok_trends"; niche: string }
  | { preset: "amazon_reviews"; product_id: string; asin: string };
