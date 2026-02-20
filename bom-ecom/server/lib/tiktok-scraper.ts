/**
 * TikTok Scraper Service
 *
 * Extracted from bev4/tiktok-scraperzip — Apify actor integration for
 * TikTok trend discovery and comment scraping.
 *
 * Actors used:
 *   - clockworks/tiktok-scraper (keyword search → videos)
 *   - clockworks~tiktok-comments-scraper (video URL → comments)
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN;

export interface TikTokVideo {
  videoId: string;
  author: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  videoUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  subtitleUrl: string;
  publishedAt: string;
}

export interface TikTokComment {
  text: string;
  likes: number;
  author: string;
}

/**
 * Scrape TikTok videos by keyword using Apify clockworks/tiktok-scraper
 */
export async function scrapeTikTokByKeyword(
  keyword: string,
  maxResults = 20,
): Promise<TikTokVideo[]> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN not configured");
  }

  // Start the actor run
  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQueries: [keyword],
        resultsPerPage: maxResults,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      }),
    },
  );

  if (!startResponse.ok) {
    throw new Error(`Apify API error: ${startResponse.status}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;

  // Poll until complete
  let status = "RUNNING";
  while (status === "RUNNING" || status === "READY") {
    await new Promise((r) => setTimeout(r, 5000));
    const pollResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`,
    );
    const pollData = await pollResponse.json();
    status = pollData.data.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`TikTok scrape failed with status: ${status}`);
  }

  // Fetch results
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`,
  );
  const items = await resultsResponse.json();

  return transformTikTokResults(items);
}

/**
 * Transform raw Apify TikTok results to our internal format
 */
function transformTikTokResults(items: any[]): TikTokVideo[] {
  return items.map((item) => {
    const videoId =
      item.id ||
      item.videoId ||
      `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const authorName = item.authorMeta?.name || item.author || "Unknown";
    const tiktokUrl =
      item.webVideoUrl ||
      `https://www.tiktok.com/@${authorName}/video/${videoId}`;
    const downloadUrl =
      item.videoMeta?.downloadAddr || item.downloadUrl || "";

    // Extract English subtitle link
    const subtitleLinks = item.videoMeta?.subtitleLinks || [];
    const engSubtitle = subtitleLinks.find((l: any) =>
      l.language?.toLowerCase().includes("eng"),
    );
    const subtitleUrl =
      engSubtitle?.downloadLink || subtitleLinks[0]?.downloadLink || "";

    // Publish date
    let publishedAt = item.createTimeISO || "";
    if (!publishedAt && item.createTime) {
      publishedAt = new Date(item.createTime * 1000).toISOString();
    }

    return {
      videoId,
      author: authorName.startsWith("@") ? authorName : `@${authorName}`,
      description: item.text || item.description || "",
      views: item.playCount || item.views || 0,
      likes: item.diggCount || item.likes || 0,
      comments: item.commentCount || item.comments || 0,
      shares: item.shareCount || item.shares || 0,
      videoUrl: tiktokUrl,
      downloadUrl,
      thumbnailUrl:
        item.videoMeta?.coverUrl ||
        item.covers?.default ||
        item.thumbnail ||
        "",
      subtitleUrl,
      publishedAt,
    };
  });
}

/**
 * Scrape comments from a TikTok video using Apify clockworks~tiktok-comments-scraper
 * Runs synchronously (waits for results).
 */
export async function scrapeTikTokComments(
  videoUrl: string,
  maxComments = 50,
): Promise<TikTokComment[]> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN not configured");
  }

  const response = await fetch(
    `https://api.apify.com/v2/acts/clockworks~tiktok-comments-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postURLs: [videoUrl],
        maxComments,
        maxRepliesPerComment: 0,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Apify comments API error: ${response.status}`);
  }

  const data = await response.json();

  return data
    .map((item: any) => ({
      text: item.text || item.comment || "",
      likes: item.diggCount || item.likes || 0,
      author: item.uniqueId || item.author || "",
    }))
    .filter((c: TikTokComment) => c.text.length > 0);
}
