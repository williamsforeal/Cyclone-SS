import type { ScrapeJob, ScrapeSource, ScrapeDestination } from "@shared/types/scrape";
import { db } from "../db";
import { jobs } from "@shared/schema";

export async function triggerN8nWebhook(
  path: string,
  payload: Record<string, any>,
  headers: Record<string, string> = {},
) {
  const webhookBase = process.env.N8N_WEBHOOK_URL;
  if (!webhookBase) {
    return { triggered: false, reason: "N8N_WEBHOOK_URL not configured" };
  }
  try {
    const url = webhookBase.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    return { triggered: true, status: response.status };
  } catch (err: any) {
    return { triggered: false, reason: err.message };
  }
}

const scrapePathForSource = (source: ScrapeSource): string =>
  source.type === "firecrawl" ? "scrape-firecrawl" : "scrape-apify";

export async function dispatchScrape(args: {
  source: ScrapeSource;
  destination: ScrapeDestination;
  triggered_by?: ScrapeJob["triggered_by"];
}): Promise<{ job_id: number; status: "pending" | "failed"; reason?: string }> {
  const triggered_by = args.triggered_by ?? "manual";
  const callbackBase = process.env.APP_BASE_URL ?? "http://localhost:5000";
  const callback_url = `${callbackBase.replace(/\/$/, "")}/api/scrape/callback`;
  const path = scrapePathForSource(args.source);
  const name = `scrape:${args.source.type}:${args.destination.kind}`;

  const [inserted] = await db
    .insert(jobs)
    .values({
      name,
      stage: "scrape",
      status: "pending",
      payload: {
        source: args.source,
        destination: args.destination,
        triggered_by,
      },
      webhookUrl: path,
      startedAt: new Date(),
    })
    .returning({ id: jobs.id });

  const job_id = inserted.id;
  const token = process.env.N8N_WEBHOOK_TOKEN;
  const result = await triggerN8nWebhook(
    path,
    {
      job_id,
      source: args.source,
      destination: args.destination,
      triggered_by,
      callback_url,
      created_at: new Date().toISOString(),
    } satisfies ScrapeJob,
    token ? { "X-Webhook-Token": token } : {},
  );

  if (!result.triggered || (result.status && result.status >= 400)) {
    return { job_id, status: "failed", reason: result.reason ?? `status ${result.status}` };
  }

  return { job_id, status: "pending" };
}
