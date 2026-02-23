import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { db } from "./db";
import {
  productCandidates, competitorIntel, trendItems, productCriteriaChecks, WINNING_CRITERIA_KEYS, uploadedMedia,
  scrapeSources, scrapeRuns, rawScrapeData, filteredInsights, weeklyRollups,
  nichePainPoints, consumerPhrases, competitorMessaging, creativeOutputs, consumerIntelJobs,
  adVaultBrands, adVault, adVaultScrapeJobs, adVaultSnapshots,
  transcriptProducts, gateResults,
} from "@shared/schema";
import { eq, desc, and, sql, count, avg, inArray, gte, lte, isNull } from "drizzle-orm";
import { z } from "zod";
import * as competitorAirtable from "./lib/competitor-airtable";
import { scoreFromCandidateRow, evaluateProduct, type ScoringResult } from "./lib/scoring-engine";
import { generateNarrative } from "./lib/vertex-narrative";
import { scrapeTikTokByKeyword, scrapeTikTokComments } from "./lib/tiktok-scraper";

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, name);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP images and MP4 videos are allowed"));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

const SCORE_FIELDS = [
  "scoreViralTraction", "scoreSolvesRealProblem", "scoreUniqueness",
  "scoreCompetitorBenchmark", "scoreHighDemand", "scoreTiktokTrend",
  "scoreAdMetrics", "scoreContentAvailability", "scoreSupplierSpeed",
] as const;

const clampScore = (v: unknown): number => Math.max(0, Math.min(10, Number(v) || 0));

const candidateCreateSchema = z.object({
  name: z.string().min(1),
  sourceUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  supplierCost: z.number().nullable().optional(),
  sellingPrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["evaluating", "approved", "rejected", "testing"]).optional(),
  scoreViralTraction: z.number().min(0).max(10).optional(),
  scoreSolvesRealProblem: z.number().min(0).max(10).optional(),
  scoreUniqueness: z.number().min(0).max(10).optional(),
  scoreCompetitorBenchmark: z.number().min(0).max(10).optional(),
  scoreHighDemand: z.number().min(0).max(10).optional(),
  scoreTiktokTrend: z.number().min(0).max(10).optional(),
  scoreAdMetrics: z.number().min(0).max(10).optional(),
  scoreContentAvailability: z.number().min(0).max(10).optional(),
  scoreSupplierSpeed: z.number().min(0).max(10).optional(),
  isViral: z.boolean().optional(),
  solvesProblem: z.boolean().optional(),
  notSaturated: z.boolean().optional(),
});

const competitorCreateSchema = z.object({
  competitorName: z.string().nullable().optional(),
  competitorUrl: z.string().nullable().optional(),
  adCount: z.number().nullable().optional(),
  monthlyTraffic: z.string().nullable().optional(),
  weaknesses: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
import {
  TABLES,
  fetchTable,
  fetchAllRecords,
  fetchRecord,
  createRecords,
  updateRecord,
  updateRecords,
  flattenRecords,
  flattenRecord,
  checkHealth,
} from "./lib/airtable";

async function triggerN8nWebhook(path: string, payload: Record<string, any>) {
  const webhookBase = process.env.N8N_WEBHOOK_URL;
  if (!webhookBase) {
    return { triggered: false, reason: "N8N_WEBHOOK_URL not configured" };
  }
  try {
    const url = webhookBase.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { triggered: true, status: response.status };
  } catch (err: any) {
    return { triggered: false, reason: err.message };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const health = await checkHealth();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ connected: false, error: error.message, tables: [] });
    }
  });

  app.get("/api/airtable/products", async (_req: Request, res: Response) => {
    try {
      const records = await fetchAllRecords(TABLES.products);
      res.json(flattenRecords(records));
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/ad-concepts", async (req: Request, res: Response) => {
    try {
      const filters: string[] = [];
      if (req.query.avatar) filters.push(`{Avatar Target}="${req.query.avatar}"`);
      if (req.query.angle) filters.push(`{Angle}="${req.query.angle}"`);
      if (req.query.status) filters.push(`{Image Prompt Status}="${req.query.status}"`);
      if (req.query.adType) filters.push(`{Ad Type}="${req.query.adType}"`);
      if (req.query.awarenessLevel) filters.push(`{Awareness Level}="${req.query.awarenessLevel}"`);

      const formula = filters.length ? `AND(${filters.join(",")})` : "";

      const params: Record<string, string> = {};
      if (formula) {
        params.filterByFormula = formula;
      }

      const records = await fetchAllRecords(TABLES.adCopy, params);
      res.json(flattenRecords(records));
    } catch (error: any) {
      console.error("Error fetching ad concepts:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/ad-concepts/:recordId", async (req: Request, res: Response) => {
    try {
      const { recordId } = req.params;
      const data = await fetchRecord(TABLES.adCopy, recordId);
      res.json(flattenRecord(data));
    } catch (error: any) {
      console.error("Error fetching ad concept:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/airtable/ad-concepts/bulk/update", async (req: Request, res: Response) => {
    try {
      const { records } = req.body;
      if (!records || !Array.isArray(records)) {
        res.status(400).json({ error: "records array required" });
        return;
      }
      const results = await updateRecords(TABLES.adCopy, records);
      res.json(flattenRecords(results));
    } catch (error: any) {
      console.error("Error bulk updating ad concepts:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/airtable/ad-concepts/:recordId", async (req: Request, res: Response) => {
    try {
      const { recordId } = req.params;
      const data = await updateRecord(TABLES.adCopy, recordId, req.body);
      res.json(flattenRecord(data));
    } catch (error: any) {
      console.error("Error updating ad concept:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/images", async (_req: Request, res: Response) => {
    try {
      const records = await fetchAllRecords(TABLES.images);
      res.json(flattenRecords(records));
    } catch (error: any) {
      console.error("Error fetching images:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/images/:adCopyRecordId", async (req: Request, res: Response) => {
    try {
      const { adCopyRecordId } = req.params;
      const formula = `FIND("${adCopyRecordId}", ARRAYJOIN({Ad Copy}))`;
      const records = await fetchAllRecords(TABLES.images, { filterByFormula: formula });
      res.json(flattenRecords(records));
    } catch (error: any) {
      console.error("Error fetching images for ad copy:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/jobs", async (req: Request, res: Response) => {
    try {
      const filters: string[] = [];
      if (req.query.status) filters.push(`{Status}="${req.query.status}"`);
      if (req.query.jobType) filters.push(`{Job Type}="${req.query.jobType}"`);

      const params: Record<string, string> = {};
      if (filters.length) {
        params.filterByFormula = filters.length > 1 ? `AND(${filters.join(",")})` : filters[0];
      }

      const records = await fetchAllRecords(TABLES.jobs, params);
      res.json(flattenRecords(records));
    } catch (error: any) {
      console.error("Error fetching jobs:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/airtable/jobs/:recordId", async (req: Request, res: Response) => {
    try {
      const data = await fetchRecord(TABLES.jobs, req.params.recordId);
      res.json(flattenRecord(data));
    } catch (error: any) {
      console.error("Error fetching job:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/product-candidates", async (_req: Request, res: Response) => {
    try {
      const candidates = await db.select().from(productCandidates).orderBy(desc(productCandidates.totalScore));
      res.json(candidates);
    } catch (error: any) {
      console.error("Error fetching product candidates:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/product-candidates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [candidate] = await db.select().from(productCandidates).where(eq(productCandidates.id, id));
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error: any) {
      console.error("Error fetching product candidate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/product-candidates", async (req: Request, res: Response) => {
    try {
      const parsed = candidateCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const data: Record<string, any> = { ...parsed.data };
      SCORE_FIELDS.forEach((f) => { data[f] = clampScore(data[f]); });
      data.totalScore = SCORE_FIELDS.reduce((sum, f) => sum + (data[f] as number), 0);
      if (data.supplierCost && data.sellingPrice && data.sellingPrice > 0) {
        data.margin = ((data.sellingPrice - data.supplierCost) / data.sellingPrice) * 100;
      }
      const [candidate] = await db.insert(productCandidates).values(data).returning();
      res.json(candidate);
    } catch (error: any) {
      console.error("Error creating product candidate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/product-candidates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = candidateCreateSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const [existing] = await db.select().from(productCandidates).where(eq(productCandidates.id, id));
      if (!existing) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      const updates: Record<string, any> = { ...parsed.data };
      SCORE_FIELDS.forEach((f) => {
        if (f in updates) {
          updates[f] = clampScore(updates[f]);
        }
      });
      const merged = { ...existing, ...updates };
      updates.totalScore = SCORE_FIELDS.reduce((sum, f) => sum + clampScore(merged[f as keyof typeof merged]), 0);
      const cost = updates.supplierCost ?? existing.supplierCost;
      const price = updates.sellingPrice ?? existing.sellingPrice;
      if (cost && price && price > 0) {
        updates.margin = ((price - cost) / price) * 100;
      }
      const [updated] = await db.update(productCandidates).set(updates).where(eq(productCandidates.id, id)).returning();
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating product candidate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/product-candidates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(competitorIntel).where(eq(competitorIntel.candidateId, id));
      await db.delete(productCriteriaChecks).where(eq(productCriteriaChecks.candidateId, id));
      const [deleted] = await db.delete(productCandidates).where(eq(productCandidates.id, id)).returning();
      if (!deleted) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting product candidate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/product-candidates/:id/competitors", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const competitors = await db.select().from(competitorIntel).where(eq(competitorIntel.candidateId, id));
      res.json(competitors);
    } catch (error: any) {
      console.error("Error fetching competitors:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/product-candidates/:id/competitors", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const parsed = competitorCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const [competitor] = await db.insert(competitorIntel).values({ ...parsed.data, candidateId }).returning();
      res.json(competitor);
    } catch (error: any) {
      console.error("Error adding competitor:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/competitors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(competitorIntel).where(eq(competitorIntel.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting competitor:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/scrape/tiktok-trends", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("scrape/tiktok-trends", req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/scrape/competitor-ads", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("scrape/competitor-ads", req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/scrape/product-data", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("scrape/product-data", req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/scrape/ig-transcripts", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("bomb-scrape-ig-transcripts", req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/scrape/ig-competitors", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("bomb-scrape-instagram", req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Receives scraping results back from n8n after Apify actors complete
  app.post("/api/webhook/scrape-results", async (req: Request, res: Response) => {
    try {
      const { type, platform, candidateId, items } = req.body;

      if (!type || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields: type, items[]" });
      }

      if (type === "trend") {
        const rows = items.map((item: any) => ({
          platform: platform || "tiktok",
          title: item.title || item.text || "Untitled",
          url: item.url || null,
          notes: item.notes || item.summary || null,
          pinned: false,
        }));
        await db.insert(trendItems).values(rows);
        return res.json({ success: true, inserted: rows.length, type: "trend" });
      }

      if (type === "competitor") {
        if (!candidateId) {
          return res.status(400).json({ error: "candidateId required for type=competitor" });
        }
        const rows = items.map((item: any) => ({
          candidateId: Number(candidateId),
          competitorName: item.name || item.competitorName || "Unknown",
          competitorUrl: item.url || item.competitorUrl || null,
          adCount: item.adCount || null,
          monthlyTraffic: item.monthlyTraffic || null,
          weaknesses: item.weaknesses || null,
          notes: item.notes || null,
        }));
        await db.insert(competitorIntel).values(rows);
        return res.json({ success: true, inserted: rows.length, type: "competitor" });
      }

      return res.status(400).json({ error: `Unknown type: ${type}. Use "trend" or "competitor"` });
    } catch (error: any) {
      console.error("Error in scrape-results webhook:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/concept/generate", async (req: Request, res: Response) => {
    try {
      const { conceptIds, productId, avatarId } = req.body;
      const result = await triggerN8nWebhook("concept/generate", {
        conceptIds,
        productId,
        avatarId,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error triggering concept.generate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/assets/generate", async (req: Request, res: Response) => {
    try {
      const { conceptIds, visualDirection } = req.body;
      const result = await triggerN8nWebhook("assets/generate", {
        conceptIds,
        visualDirection,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error triggering assets.generate:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/research/ingest", async (req: Request, res: Response) => {
    try {
      const { productId, competitors } = req.body;
      const result = await triggerN8nWebhook("research/ingest", {
        productId,
        competitors,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error triggering research.ingest:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/metrics/ingest", async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.body;
      const result = await triggerN8nWebhook("metrics/ingest", {
        dateFrom,
        dateTo,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error triggering metrics.ingest:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/campaign/launch", async (req: Request, res: Response) => {
    try {
      const { campaign, adSets } = req.body;
      const result = await triggerN8nWebhook("campaign/launch", {
        campaign,
        adSets,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error triggering campaign.launch:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook/generate", async (req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("generate", req.body);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error processing webhook:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Trend Items ─────────────────────────────────────────────────
  const trendCreateSchema = z.object({
    platform: z.enum(["kalodata", "instagram", "reddit", "x"]),
    title: z.string().min(1),
    url: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    pinned: z.boolean().optional(),
  });

  app.get("/api/trend-items", async (req: Request, res: Response) => {
    try {
      const platform = req.query.platform as string | undefined;
      const items = platform
        ? await db.select().from(trendItems).where(eq(trendItems.platform, platform)).orderBy(desc(trendItems.createdAt))
        : await db.select().from(trendItems).orderBy(desc(trendItems.createdAt));
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trend-items", async (req: Request, res: Response) => {
    try {
      const parsed = trendCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const [item] = await db.insert(trendItems).values(parsed.data).returning();
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/trend-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = trendCreateSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const [updated] = await db.update(trendItems).set(parsed.data).where(eq(trendItems.id, id)).returning();
      if (!updated) {
        res.status(404).json({ error: "Trend item not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/trend-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(trendItems).where(eq(trendItems.id, id)).returning();
      if (!deleted) {
        res.status(404).json({ error: "Trend item not found" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Product Criteria Checks ─────────────────────────────────────
  const criteriaCheckSchema = z.object({
    candidateId: z.number(),
    criterionKey: z.string(),
    checked: z.boolean().optional(),
    comment: z.string().nullable().optional(),
  });

  app.get("/api/product-candidates/:id/criteria", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const checks = await db.select().from(productCriteriaChecks).where(eq(productCriteriaChecks.candidateId, candidateId));
      res.json(checks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/product-candidates/:id/criteria", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const parsed = criteriaCheckSchema.omit({ candidateId: true }).safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const validKeys: readonly string[] = WINNING_CRITERIA_KEYS;
      if (!validKeys.includes(parsed.data.criterionKey)) {
        res.status(400).json({ error: `Invalid criterion key: ${parsed.data.criterionKey}` });
        return;
      }
      const existing = await db.select().from(productCriteriaChecks).where(
        and(
          eq(productCriteriaChecks.candidateId, candidateId),
          eq(productCriteriaChecks.criterionKey, parsed.data.criterionKey)
        )
      );
      if (existing.length > 0) {
        const [updated] = await db.update(productCriteriaChecks)
          .set({ checked: parsed.data.checked, comment: parsed.data.comment })
          .where(eq(productCriteriaChecks.id, existing[0].id))
          .returning();
        res.json(updated);
      } else {
        const [check] = await db.insert(productCriteriaChecks)
          .values({ candidateId, ...parsed.data })
          .returning();
        res.json(check);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const [record] = await db.insert(uploadedMedia).values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }).returning();
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/uploads", async (_req: Request, res: Response) => {
    try {
      const files = await db.select().from(uploadedMedia).orderBy(desc(uploadedMedia.uploadedAt));
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/uploads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [file] = await db.select().from(uploadedMedia).where(eq(uploadedMedia.id, id));
      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      const filePath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.delete(uploadedMedia).where(eq(uploadedMedia.id, id));
      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Notion Integration ---
  app.get("/api/notion/status", async (_req: Request, res: Response) => {
    try {
      const { getNotionStatus } = await import("./lib/notion");
      const status = await getNotionStatus();
      res.json(status);
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  app.get("/api/notion/pages", async (req: Request, res: Response) => {
    try {
      const { searchNotionPages } = await import("./lib/notion");
      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const pages = await searchNotionPages(query);
      res.json(pages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Weather (Open-Meteo, no key required) ---
  let weatherCache: { data: any; ts: number } | null = null;
  const WEATHER_TTL = 30 * 60 * 1000; // 30 min

  app.get("/api/weather", async (req: Request, res: Response) => {
    try {
      const lat = typeof req.query.lat === "string" ? req.query.lat : "40.7128";
      const lon = typeof req.query.lon === "string" ? req.query.lon : "-74.0060";
      const cacheKey = `${lat},${lon}`;

      if (weatherCache && weatherCache.data._key === cacheKey && Date.now() - weatherCache.ts < WEATHER_TTL) {
        return res.json(weatherCache.data);
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Weather API error");
      const raw = await resp.json();

      const wmoDescriptions: Record<number, { label: string; icon: string }> = {
        0: { label: "Clear", icon: "sun" },
        1: { label: "Mainly Clear", icon: "sun" },
        2: { label: "Partly Cloudy", icon: "cloud-sun" },
        3: { label: "Overcast", icon: "cloud" },
        45: { label: "Foggy", icon: "cloud-fog" },
        48: { label: "Rime Fog", icon: "cloud-fog" },
        51: { label: "Light Drizzle", icon: "cloud-drizzle" },
        53: { label: "Drizzle", icon: "cloud-drizzle" },
        55: { label: "Heavy Drizzle", icon: "cloud-drizzle" },
        61: { label: "Light Rain", icon: "cloud-rain" },
        63: { label: "Rain", icon: "cloud-rain" },
        65: { label: "Heavy Rain", icon: "cloud-rain" },
        71: { label: "Light Snow", icon: "snowflake" },
        73: { label: "Snow", icon: "snowflake" },
        75: { label: "Heavy Snow", icon: "snowflake" },
        77: { label: "Snow Grains", icon: "snowflake" },
        80: { label: "Light Showers", icon: "cloud-rain" },
        81: { label: "Showers", icon: "cloud-rain" },
        82: { label: "Heavy Showers", icon: "cloud-rain" },
        85: { label: "Snow Showers", icon: "snowflake" },
        86: { label: "Heavy Snow Showers", icon: "snowflake" },
        95: { label: "Thunderstorm", icon: "cloud-lightning" },
        96: { label: "Thunderstorm w/ Hail", icon: "cloud-lightning" },
        99: { label: "Thunderstorm w/ Heavy Hail", icon: "cloud-lightning" },
      };

      const code = raw.current?.weather_code ?? 0;
      const desc = wmoDescriptions[code] || { label: "Unknown", icon: "cloud" };

      const result = {
        _key: cacheKey,
        temp: Math.round(raw.current?.temperature_2m ?? 0),
        feelsLike: Math.round(raw.current?.apparent_temperature ?? 0),
        humidity: raw.current?.relative_humidity_2m ?? 0,
        windSpeed: Math.round(raw.current?.wind_speed_10m ?? 0),
        condition: desc.label,
        icon: desc.icon,
        unit: "F",
      };

      weatherCache = { data: result, ts: Date.now() };
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- S3 Integration ---
  app.get("/api/s3/templates", async (req: Request, res: Response) => {
    try {
      const { listTemplates } = await import("./lib/s3");
      const prefix = typeof req.query.prefix === "string" ? req.query.prefix : undefined;
      const templates = await listTemplates(prefix);
      res.json(templates);
    } catch (error: any) {
      console.error("Error listing S3 templates:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/s3/renders", async (req: Request, res: Response) => {
    try {
      const { listRenders } = await import("./lib/s3");
      const prefix = typeof req.query.prefix === "string" ? req.query.prefix : undefined;
      const renders = await listRenders(prefix);
      res.json(renders);
    } catch (error: any) {
      console.error("Error listing S3 renders:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const ALLOWED_S3_PREFIXES = ["templates/", "renders/"];

  function isValidS3Key(key: string): boolean {
    const normalized = key.replace(/\.\./g, "");
    return ALLOWED_S3_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }

  app.get("/api/s3/signed-url", async (req: Request, res: Response) => {
    try {
      const key = typeof req.query.key === "string" ? req.query.key : "";
      if (!key) {
        res.status(400).json({ error: "Missing 'key' query parameter" });
        return;
      }
      if (!isValidS3Key(key)) {
        res.status(403).json({ error: "Key must start with 'templates/' or 'renders/'" });
        return;
      }
      const { getSignedUrl } = await import("./lib/s3");
      const url = await getSignedUrl(key);
      res.json({ url });
    } catch (error: any) {
      console.error("Error generating signed URL:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/s3/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const s3Key = typeof req.body.key === "string" ? req.body.key : `templates/${req.file.filename}`;
      if (!isValidS3Key(s3Key)) {
        fs.unlinkSync(req.file.path);
        res.status(403).json({ error: "Key must start with 'templates/' or 'renders/'" });
        return;
      }
      const { uploadToS3 } = await import("./lib/s3");
      const buffer = fs.readFileSync(req.file.path);
      const result = await uploadToS3(buffer, s3Key, req.file.mimetype);
      fs.unlinkSync(req.file.path);
      res.json(result);
    } catch (error: any) {
      console.error("Error uploading to S3:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/s3/objects", async (req: Request, res: Response) => {
    try {
      const key = typeof req.query.key === "string" ? req.query.key : "";
      if (!key) {
        res.status(400).json({ error: "Missing 'key' query parameter" });
        return;
      }
      if (!isValidS3Key(key)) {
        res.status(403).json({ error: "Key must start with 'templates/' or 'renders/'" });
        return;
      }
      const { deleteFromS3 } = await import("./lib/s3");
      await deleteFromS3(key);
      res.json({ deleted: true });
    } catch (error: any) {
      console.error("Error deleting S3 object:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Meta Ad Intelligence (Competitor Ads) ────────────────────────────────

  app.get("/api/meta-brands", async (_req: Request, res: Response) => {
    try {
      const brands = await competitorAirtable.fetchBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/meta-brands", async (req: Request, res: Response) => {
    try {
      const { brand_name, facebook_page_url } = req.body;
      if (!brand_name || !facebook_page_url) {
        res.status(400).json({ error: "brand_name and facebook_page_url are required" });
        return;
      }
      const brand = await competitorAirtable.createBrand({ brand_name, facebook_page_url });
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/meta-brands/:id", async (req: Request, res: Response) => {
    try {
      await competitorAirtable.deleteBrand(String(req.params.id));
      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/meta-ads", async (req: Request, res: Response) => {
    try {
      const brandRecordId = typeof req.query.brandId === "string" ? req.query.brandId : undefined;
      const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
      const status = rawStatus as competitorAirtable.MetaAd["status"] | undefined;
      const ads = await competitorAirtable.fetchAds({ brandRecordId, status });
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // n8n calls this after Apify run + AI analysis completes
  app.post("/api/meta-ads/ingest", async (req: Request, res: Response) => {
    try {
      const { jobId, ads } = req.body;
      if (!Array.isArray(ads) || ads.length === 0) {
        res.status(400).json({ error: "ads array is required" });
        return;
      }
      await competitorAirtable.upsertAds(ads);
      if (jobId) {
        await competitorAirtable.updateJobStatus(String(jobId), "Done");
      }
      res.json({ success: true, inserted: ads.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/meta-ads/:id/analyze", async (req: Request, res: Response) => {
    try {
      const adId = String(req.params.id);
      // Updating status to Analyzing — full analysis fields set by n8n callback
      await competitorAirtable.updateAdAnalysis(adId, {
        hook_excerpt: "",
        visual_notes: "",
        analysis_json: "",
        status: "Analyzed",
      });
      triggerN8nWebhook("bomb-meta-ad-analyze", { adId }).catch(console.error);
      res.json({ success: true, status: "Analyzing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/meta-scrape/brand/:id", async (req: Request, res: Response) => {
    try {
      const brandId = String(req.params.id);
      const brands = await competitorAirtable.fetchBrands();
      const brand = brands.find((b) => b.id === brandId);
      if (!brand) {
        res.status(404).json({ error: "Brand not found" });
        return;
      }
      const job = await competitorAirtable.createAdFetchJob({
        status: "Queued",
        brands: [brandId],
        lookback_window: "last30d",
        top_n: 20,
        run_now: true,
      });
      triggerN8nWebhook("bomb-meta-ad-scrape", {
        brandId,
        jobId: job.id,
        pageId: brand.facebook_page_url.split("view_all_page_id=")[1] || brandId,
        limit: 20,
      }).catch(console.error);
      res.json({ success: true, jobId: job.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/meta-scrape/all", async (_req: Request, res: Response) => {
    try {
      const brands = await competitorAirtable.fetchBrands();
      if (brands.length === 0) {
        res.status(400).json({ error: "No brands to scrape" });
        return;
      }
      // Queue scrape for each brand (fire and forget)
      for (const brand of brands) {
        const job = await competitorAirtable.createAdFetchJob({
          status: "Queued",
          brands: [brand.id || ""],
          lookback_window: "last30d",
          top_n: 20,
          run_now: true,
        });
        triggerN8nWebhook("bomb-meta-ad-scrape", {
          brandId: brand.id,
          jobId: job.id,
          pageId: brand.facebook_page_url.split("view_all_page_id=")[1] || brand.id,
          limit: 20,
        }).catch(console.error);
      }
      res.json({ success: true, brandCount: brands.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP A: SCRAPE MANAGEMENT (5 endpoints)
  // ============================================================

  // List all scrape sources (Apify actor registry)
  app.get("/api/scrape-sources", async (_req: Request, res: Response) => {
    try {
      const sources = await db.select().from(scrapeSources).orderBy(scrapeSources.name);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a new scrape source
  app.post("/api/scrape-sources", async (req: Request, res: Response) => {
    try {
      const { actorId, name, platform, category, defaultInput, isActive } = req.body;
      if (!actorId || !name) {
        res.status(400).json({ error: "actorId and name are required" });
        return;
      }
      const [source] = await db.insert(scrapeSources).values({
        actorId, name, platform, category, defaultInput, isActive: isActive ?? true,
      }).returning();
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger a scrape run for a source
  app.post("/api/scrape-sources/:id/run", async (req: Request, res: Response) => {
    try {
      const sourceId = parseInt(req.params.id);
      const [source] = await db.select().from(scrapeSources).where(eq(scrapeSources.id, sourceId));
      if (!source) {
        res.status(404).json({ error: "Scrape source not found" });
        return;
      }
      const { candidateId, inputOverrides } = req.body;
      const mergedInput = { ...((source.defaultInput as Record<string, any>) || {}), ...(inputOverrides || {}) };

      // Create the run record
      const [run] = await db.insert(scrapeRuns).values({
        sourceId,
        candidateId: candidateId || null,
        status: "pending",
        startedAt: new Date(),
      }).returning();

      // Fire n8n webhook to trigger the actual Apify run
      triggerN8nWebhook("bomb-scrape-run", {
        runId: run.id,
        actorId: source.actorId,
        input: mergedInput,
        candidateId,
        platform: source.platform,
      }).catch(console.error);

      res.json({ success: true, run });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List scrape runs (with optional filters)
  app.get("/api/scrape-runs", async (req: Request, res: Response) => {
    try {
      const { sourceId, status, candidateId } = req.query;
      const conditions = [];
      if (sourceId) conditions.push(eq(scrapeRuns.sourceId, Number(sourceId)));
      if (status) conditions.push(eq(scrapeRuns.status, String(status)));
      if (candidateId) conditions.push(eq(scrapeRuns.candidateId, Number(candidateId)));

      const runs = conditions.length
        ? await db.select().from(scrapeRuns).where(and(...conditions)).orderBy(desc(scrapeRuns.createdAt)).limit(100)
        : await db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.createdAt)).limit(100);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single scrape run with its raw data
  app.get("/api/scrape-runs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [run] = await db.select().from(scrapeRuns).where(eq(scrapeRuns.id, id));
      if (!run) {
        res.status(404).json({ error: "Scrape run not found" });
        return;
      }
      const rawData = await db.select().from(rawScrapeData).where(eq(rawScrapeData.runId, id));
      res.json({ ...run, rawData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP B: DATA INGESTION (2 endpoints — n8n callbacks)
  // ============================================================

  // n8n posts a fully scored product (from the full pipeline)
  app.post("/api/ingest/scored-product", async (req: Request, res: Response) => {
    try {
      const { candidateId, scoringData, kalodataData, metaAdsData, amazonData, similarwebData, economicsData } = req.body;
      if (!candidateId) {
        res.status(400).json({ error: "candidateId is required" });
        return;
      }

      const [existing] = await db.select().from(productCandidates).where(eq(productCandidates.id, Number(candidateId)));
      if (!existing) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Run the deterministic scoring engine
      const productData = {
        ...existing,
        ...(scoringData || {}),
        kalodata: kalodataData || existing.kalodataData,
        metaAds: metaAdsData || existing.metaAdsData,
        amazon: amazonData || existing.amazonData,
        similarweb: similarwebData || existing.similarwebData,
        economics: economicsData || existing.economicsData,
        manual: (existing.manualScores as Record<string, any>) || {},
      };
      const result = scoreFromCandidateRow(productData);

      // Generate AI narrative
      const narrative = await generateNarrative({
        productName: existing.name,
        category: existing.category || undefined,
        score: result.score,
        decision: result.decision,
        amazonData: amazonData as any,
        metaAdsData: metaAdsData as any,
      });

      // Persist
      const updates: Record<string, any> = {
        scoringVersion: 2,
        totalScore: result.score,
        decision: result.decision,
        big3Pass: result.big3Pass,
        primaryAngle: narrative.primaryAngle,
        aiReasoning: narrative.reasoning,
        scoreBreakdown: result.breakdown,
        hardGateResults: null,
        lastScoredAt: new Date(),
      };
      if (kalodataData) updates.kalodataData = kalodataData;
      if (metaAdsData) updates.metaAdsData = metaAdsData;
      if (amazonData) updates.amazonData = amazonData;
      if (similarwebData) updates.similarwebData = similarwebData;
      if (economicsData) updates.economicsData = economicsData;

      // Set category subtotals
      for (const cat of result.categoryScores) {
        if (cat.key === "painIntensity") updates.painIntensityTotal = cat.points;
        if (cat.key === "marketProof") updates.marketProofTotal = cat.points;
        if (cat.key === "economics") updates.economicsTotal = cat.points;
        if (cat.key === "competitiveMoat") updates.competitiveMoatTotal = cat.points;
        if (cat.key === "contentPotential") updates.contentPotentialTotal = cat.points;
      }

      // Set individual sub-scores from breakdown
      for (const item of result.breakdown) {
        const fieldMap: Record<string, string> = {
          pain_frequency: "painFrequency",
          emotional_intensity: "emotionalIntensity",
          amazon_pain_density: "amazonPainDensity",
          search_demand_problem: "searchDemandProblem",
          competitor_ad_activity: "competitorAdActivity",
          traffic_validation: "trafficValidation",
          amazon_review_volume: "amazonReviewVolume",
          trend_momentum: "trendMomentum",
          profit_margin_score: "profitMarginScore",
          shipping_feasibility: "shippingFeasibility",
          upsell_potential: "upsellPotential",
          aov_expansion_potential: "aovExpansionPotential",
          uniqueness_factor: "uniquenessFactor",
          improvement_opportunity: "improvementOpportunity",
          brandability_score: "brandabilityScore",
          ugc_content_availability: "ugcContentAvailability",
          demonstrability_score: "demonstrabilityScore",
          consumer_language_richness: "consumerLanguageRichness",
        };
        if (fieldMap[item.id]) updates[fieldMap[item.id]] = item.points;
      }

      const [updated] = await db.update(productCandidates).set(updates).where(eq(productCandidates.id, Number(candidateId))).returning();
      res.json({ success: true, candidate: updated, scoring: result });
    } catch (error: any) {
      console.error("[ingest/scored-product] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // n8n posts raw Apify scrape items
  app.post("/api/ingest/scrape-results", async (req: Request, res: Response) => {
    try {
      const { runId, sourceId, platform, items } = req.body;
      if (!runId || !sourceId || !Array.isArray(items)) {
        res.status(400).json({ error: "runId, sourceId, and items[] are required" });
        return;
      }

      // Store each item as raw scrape data
      const rows = items.map((item: any) => ({
        runId: Number(runId),
        sourceId: Number(sourceId),
        platform: platform || "unknown",
        rawJson: item,
      }));
      await db.insert(rawScrapeData).values(rows);

      // Update the run record
      await db.update(scrapeRuns).set({
        status: "complete",
        itemsCount: items.length,
        completedAt: new Date(),
      }).where(eq(scrapeRuns.id, Number(runId)));

      res.json({ success: true, inserted: rows.length });
    } catch (error: any) {
      console.error("[ingest/scrape-results] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // n8n posts AI-extracted product data from a Google Doc
  app.post("/api/ingest/product-from-doc", async (req: Request, res: Response) => {
    try {
      const {
        productName, description, keywords = [], rankInFolder,
        sourceDocTitle, sourceDocUrl, aliexpressKeyword,
      } = req.body;

      if (!productName) {
        res.status(400).json({ error: "productName is required" });
        return;
      }

      // Upsert: update if name matches, otherwise insert
      const existing = await db.select().from(productCandidates)
        .where(eq(productCandidates.name, productName))
        .limit(1);

      let candidate;
      if (existing.length > 0) {
        [candidate] = await db.update(productCandidates)
          .set({
            notes: description || existing[0].notes,
            sourceUrl: sourceDocUrl || existing[0].sourceUrl,
          })
          .where(eq(productCandidates.id, existing[0].id))
          .returning();
      } else {
        [candidate] = await db.insert(productCandidates).values({
          name: productName,
          notes: description || null,
          sourceUrl: sourceDocUrl || null,
          status: "evaluating",
        }).returning();
      }

      // Trigger AliExpress scrape if keyword provided
      let scrapeRunId: number | null = null;
      if (aliexpressKeyword) {
        const [aliSource] = await db.select().from(scrapeSources)
          .where(eq(scrapeSources.platform, "aliexpress"))
          .limit(1);

        if (aliSource) {
          const [run] = await db.insert(scrapeRuns).values({
            sourceId: aliSource.id,
            candidateId: candidate.id,
            status: "pending",
            startedAt: new Date(),
          }).returning();
          scrapeRunId = run.id;

          triggerN8nWebhook("bomb-scrape-run", {
            runId: run.id,
            actorId: aliSource.actorId,
            input: { keyword: aliexpressKeyword, maxItems: 20, sortBy: "orders" },
            candidateId: candidate.id,
            platform: "aliexpress",
          }).catch(console.error);
        }
      }

      // SerpAPI search demand (non-blocking)
      const SERP_API_KEY = process.env.SERP_API_KEY || "";
      if (SERP_API_KEY && keywords.length > 0) {
        fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keywords[0])}&api_key=${SERP_API_KEY}&num=10`)
          .then((r) => r.json())
          .then(async (serpData: any) => {
            const searchDemand = {
              query: keywords[0],
              organic_count: serpData.organic_results?.length ?? 0,
              top_results: (serpData.organic_results || []).slice(0, 3).map((r: any) => ({
                title: r.title, link: r.link,
              })),
              related_searches: (serpData.related_searches || []).slice(0, 5).map((r: any) => r.query),
              fetched_at: new Date().toISOString(),
            };
            await db.update(productCandidates)
              .set({ kalodataData: searchDemand })
              .where(eq(productCandidates.id, candidate.id));
          })
          .catch(console.error);
      }

      res.json({
        success: true,
        candidateId: candidate.id,
        scrapeRunId,
        isNew: existing.length === 0,
      });
    } catch (error: any) {
      console.error("[ingest/product-from-doc] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Pipeline trigger — proxies to n8n webhooks or internal scrape API
  app.post("/api/pipeline/trigger", async (req: Request, res: Response) => {
    try {
      const { workflow, payload = {} } = req.body;
      const N8N_URL = process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook";

      const webhookMap: Record<string, string> = {
        "import-drive":   `${N8N_URL}/bomb-import-from-drive`,
        "consumer-intel": `${N8N_URL}/bomb-consumer-intel-scrape`,
        "creative":       `${N8N_URL}/bomb-creative-generate`,
      };

      if (workflow === "aliexpress") {
        // Find AliExpress source and trigger run for all candidates missing COGS
        const [aliSource] = await db.select().from(scrapeSources)
          .where(eq(scrapeSources.platform, "aliexpress"))
          .limit(1);

        if (!aliSource) {
          res.status(404).json({ error: "AliExpress scrape source not registered. POST to /api/scrape-sources first." });
          return;
        }

        const candidates = await db.select({ id: productCandidates.id, name: productCandidates.name })
          .from(productCandidates)
          .where(isNull(productCandidates.economicsData))
          .limit(20);

        const runIds: number[] = [];
        for (const c of candidates) {
          const [run] = await db.insert(scrapeRuns).values({
            sourceId: aliSource.id,
            candidateId: c.id,
            status: "pending",
            startedAt: new Date(),
          }).returning();
          runIds.push(run.id);
          triggerN8nWebhook("bomb-scrape-run", {
            runId: run.id,
            actorId: aliSource.actorId,
            input: { keyword: c.name, maxItems: 20, sortBy: "orders" },
            candidateId: c.id,
            platform: "aliexpress",
          }).catch(console.error);
        }

        res.json({ success: true, workflow, candidatesQueued: candidates.length, runIds });
        return;
      }

      const url = webhookMap[workflow];
      if (!url) {
        res.status(400).json({ error: `Unknown workflow: ${workflow}. Valid: import-drive, aliexpress, consumer-intel, creative` });
        return;
      }

      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await result.json().catch(() => ({}));
      res.json({ success: result.ok, workflow, status: result.status, data });
    } catch (error: any) {
      console.error("[pipeline/trigger] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP C: INSIGHTS FOR CHARTS (4 endpoints)
  // ============================================================

  // Summary stats for dashboard KPIs
  app.get("/api/insights/summary", async (_req: Request, res: Response) => {
    try {
      const [sourcesCount] = await db.select({ count: count() }).from(scrapeSources);
      const [runsCount] = await db.select({ count: count() }).from(scrapeRuns);
      const [activeRuns] = await db.select({ count: count() }).from(scrapeRuns).where(eq(scrapeRuns.status, "running"));
      const [insightsCount] = await db.select({ count: count() }).from(filteredInsights);
      const [avgScore] = await db.select({ avg: avg(productCandidates.totalScore) }).from(productCandidates).where(eq(productCandidates.scoringVersion, 2));

      res.json({
        totalScrapeSources: sourcesCount?.count ?? 0,
        totalScrapeRuns: runsCount?.count ?? 0,
        activeRuns: activeRuns?.count ?? 0,
        totalInsights: insightsCount?.count ?? 0,
        avgProductScore: avgScore?.avg ? Math.round(Number(avgScore.avg)) : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trend data for line charts (weekly rollups)
  app.get("/api/insights/trends", async (req: Request, res: Response) => {
    try {
      const { sourceId, metricName, weeks } = req.query;
      const conditions = [];
      if (sourceId) conditions.push(eq(weeklyRollups.sourceId, Number(sourceId)));
      if (metricName) conditions.push(eq(weeklyRollups.metricName, String(metricName)));

      const limit = Math.min(Number(weeks) || 12, 52);
      const data = conditions.length
        ? await db.select().from(weeklyRollups).where(and(...conditions)).orderBy(desc(weeklyRollups.weekStart)).limit(limit)
        : await db.select().from(weeklyRollups).orderBy(desc(weeklyRollups.weekStart)).limit(limit);

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Score distribution breakdown (for histograms)
  app.get("/api/insights/breakdown", async (_req: Request, res: Response) => {
    try {
      const candidates = await db.select({
        id: productCandidates.id,
        name: productCandidates.name,
        totalScore: productCandidates.totalScore,
        decision: productCandidates.decision,
        painIntensityTotal: productCandidates.painIntensityTotal,
        marketProofTotal: productCandidates.marketProofTotal,
        economicsTotal: productCandidates.economicsTotal,
        competitiveMoatTotal: productCandidates.competitiveMoatTotal,
        contentPotentialTotal: productCandidates.contentPotentialTotal,
      }).from(productCandidates).where(eq(productCandidates.scoringVersion, 2)).orderBy(desc(productCandidates.totalScore));

      // Count by decision band
      const bands = { APPROVE: 0, TEST: 0, WATCHLIST: 0, REJECT: 0 };
      for (const c of candidates) {
        const d = c.decision as keyof typeof bands;
        if (d in bands) bands[d]++;
      }

      res.json({ candidates, decisionBands: bands });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Competitor ad intelligence summary
  app.get("/api/insights/competitors", async (_req: Request, res: Response) => {
    try {
      const messaging = await db.select().from(competitorMessaging).orderBy(desc(competitorMessaging.createdAt)).limit(50);

      // Group by messaging angle
      const angleDistribution: Record<string, number> = {};
      const awarenessDistribution: Record<string, number> = {};
      for (const m of messaging) {
        if (m.messagingAngle) angleDistribution[m.messagingAngle] = (angleDistribution[m.messagingAngle] || 0) + 1;
        if (m.awarenessLevel) awarenessDistribution[m.awarenessLevel] = (awarenessDistribution[m.awarenessLevel] || 0) + 1;
      }

      const gaps = messaging.filter(m => m.gapOpportunity).map(m => ({
        candidateId: m.candidateId,
        gap: m.gapOpportunity,
        weakness: m.weaknessIdentified,
      }));

      res.json({ angleDistribution, awarenessDistribution, gaps, total: messaging.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP D: CONSUMER INTELLIGENCE (10 endpoints)
  // ============================================================

  // Get pain points for a candidate
  app.get("/api/product-candidates/:id/pain-points", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const points = await db.select().from(nichePainPoints)
        .where(eq(nichePainPoints.candidateId, candidateId))
        .orderBy(desc(nichePainPoints.emotionalIntensity));
      res.json(points);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manually add a pain point
  app.post("/api/product-candidates/:id/pain-points", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const { painPointText, rawQuote, source, sourceUrl, subreddit, painCategory, motivationType, emotionalIntensity, urgencyLevel, triggerTypes, adAngleRelevance } = req.body;
      if (!painPointText) {
        res.status(400).json({ error: "painPointText is required" });
        return;
      }
      const [point] = await db.insert(nichePainPoints).values({
        candidateId,
        painPointText,
        rawQuote: rawQuote || null,
        source: source || "manual",
        sourceUrl: sourceUrl || null,
        subreddit: subreddit || null,
        painCategory: painCategory || null,
        motivationType: motivationType || null,
        emotionalIntensity: emotionalIntensity || 0,
        urgencyLevel: urgencyLevel || null,
        triggerTypes: triggerTypes || null,
        adAngleRelevance: adAngleRelevance || null,
      }).returning();
      res.json(point);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get consumer phrases for a candidate
  app.get("/api/product-candidates/:id/phrases", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const { type } = req.query;
      const conditions = [eq(consumerPhrases.candidateId, candidateId)];
      if (type) conditions.push(eq(consumerPhrases.phraseType, String(type)));

      const phrases = await db.select().from(consumerPhrases)
        .where(and(...conditions))
        .orderBy(desc(consumerPhrases.frequency));
      res.json(phrases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get competitor messaging for a candidate
  app.get("/api/product-candidates/:id/competitor-messaging", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const messaging = await db.select().from(competitorMessaging)
        .where(eq(competitorMessaging.candidateId, candidateId))
        .orderBy(desc(competitorMessaging.createdAt));
      res.json(messaging);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get creative outputs for a candidate (with optional type filter)
  app.get("/api/product-candidates/:id/creative-outputs", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const { type } = req.query;
      const conditions = [eq(creativeOutputs.candidateId, candidateId)];
      if (type) conditions.push(eq(creativeOutputs.outputType, String(type)));

      const outputs = await db.select().from(creativeOutputs)
        .where(and(...conditions))
        .orderBy(desc(creativeOutputs.createdAt));
      res.json(outputs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve a creative output
  app.post("/api/product-candidates/:id/creative-outputs/:outputId/approve", async (req: Request, res: Response) => {
    try {
      const outputId = parseInt(req.params.outputId);
      const [updated] = await db.update(creativeOutputs)
        .set({ isApproved: true })
        .where(eq(creativeOutputs.id, outputId))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Creative output not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark a creative output as used in an ad
  app.post("/api/product-candidates/:id/creative-outputs/:outputId/use", async (req: Request, res: Response) => {
    try {
      const outputId = parseInt(req.params.outputId);
      const { adId } = req.body;
      const [updated] = await db.update(creativeOutputs)
        .set({ usedInAdId: adId ? Number(adId) : null, isApproved: true })
        .where(eq(creativeOutputs.id, outputId))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Creative output not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger full scoring for a candidate
  app.post("/api/product-candidates/:id/score", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const [candidate] = await db.select().from(productCandidates).where(eq(productCandidates.id, candidateId));
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Build product data for scoring engine
      const productData: Record<string, any> = { ...candidate };
      if (candidate.kalodataData) productData.kalodata = candidate.kalodataData;
      if (candidate.metaAdsData) productData.metaAds = candidate.metaAdsData;
      if (candidate.amazonData) productData.amazon = candidate.amazonData;
      if (candidate.similarwebData) productData.similarweb = candidate.similarwebData;
      if (candidate.economicsData) productData.economics = candidate.economicsData;
      if (candidate.manualScores) productData.manual = candidate.manualScores;
      productData.market = candidate.category;
      productData.shipping = { easyToShip: true }; // default

      const result = evaluateProduct(productData);

      // Generate AI narrative if scored
      let narrative = { primaryAngle: "", reasoning: "" };
      if (result.stage === "scored" && result.scoring) {
        // Collect pain points for richer narrative
        const painPoints = await db.select().from(nichePainPoints)
          .where(eq(nichePainPoints.candidateId, candidateId))
          .orderBy(desc(nichePainPoints.emotionalIntensity))
          .limit(5);

        const phrases = await db.select().from(consumerPhrases)
          .where(eq(consumerPhrases.candidateId, candidateId))
          .limit(5);

        narrative = await generateNarrative({
          productName: candidate.name,
          category: candidate.category || undefined,
          score: result.scoring.score,
          decision: result.scoring.decision,
          painPoints: painPoints.map(p => ({
            painPointText: p.painPointText,
            emotionalIntensity: p.emotionalIntensity || 0,
            rawQuote: p.rawQuote || undefined,
          })),
          consumerPhrases: phrases.map(p => ({
            phrase: p.phrase,
            phraseType: p.phraseType,
          })),
          amazonData: candidate.amazonData as any,
          metaAdsData: candidate.metaAdsData as any,
        });
      }

      // Persist scoring results
      const updates: Record<string, any> = {
        scoringVersion: 2,
        lastScoredAt: new Date(),
      };

      if (result.scoring) {
        updates.totalScore = result.scoring.score;
        updates.decision = result.scoring.decision;
        updates.big3Pass = result.scoring.big3Pass;
        updates.scoreBreakdown = result.scoring.breakdown;
        updates.primaryAngle = narrative.primaryAngle;
        updates.aiReasoning = narrative.reasoning;

        for (const cat of result.scoring.categoryScores) {
          if (cat.key === "painIntensity") updates.painIntensityTotal = cat.points;
          if (cat.key === "marketProof") updates.marketProofTotal = cat.points;
          if (cat.key === "economics") updates.economicsTotal = cat.points;
          if (cat.key === "competitiveMoat") updates.competitiveMoatTotal = cat.points;
          if (cat.key === "contentPotential") updates.contentPotentialTotal = cat.points;
        }

        for (const item of result.scoring.breakdown) {
          const fieldMap: Record<string, string> = {
            pain_frequency: "painFrequency", emotional_intensity: "emotionalIntensity",
            amazon_pain_density: "amazonPainDensity", search_demand_problem: "searchDemandProblem",
            competitor_ad_activity: "competitorAdActivity", traffic_validation: "trafficValidation",
            amazon_review_volume: "amazonReviewVolume", trend_momentum: "trendMomentum",
            profit_margin_score: "profitMarginScore", shipping_feasibility: "shippingFeasibility",
            upsell_potential: "upsellPotential", aov_expansion_potential: "aovExpansionPotential",
            uniqueness_factor: "uniquenessFactor", improvement_opportunity: "improvementOpportunity",
            brandability_score: "brandabilityScore", ugc_content_availability: "ugcContentAvailability",
            demonstrability_score: "demonstrabilityScore", consumer_language_richness: "consumerLanguageRichness",
          };
          if (fieldMap[item.id]) updates[fieldMap[item.id]] = item.points;
        }
      } else {
        updates.decision = result.decision;
      }

      if (result.gateResult) updates.hardGateResults = result.gateResult.details;

      const [updated] = await db.update(productCandidates).set(updates).where(eq(productCandidates.id, candidateId)).returning();
      res.json({ success: true, candidate: updated, evaluation: result, narrative });
    } catch (error: any) {
      console.error("[score] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Get score breakdown for a candidate
  app.get("/api/product-candidates/:id/score-breakdown", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const [candidate] = await db.select().from(productCandidates).where(eq(productCandidates.id, candidateId));
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json({
        score: candidate.totalScore,
        scoringVersion: candidate.scoringVersion,
        decision: candidate.decision,
        big3Pass: candidate.big3Pass,
        primaryAngle: candidate.primaryAngle,
        aiReasoning: candidate.aiReasoning,
        categories: [
          { key: "painIntensity", label: "Pain Intensity", points: candidate.painIntensityTotal, maxPoints: 25 },
          { key: "marketProof", label: "Market Proof", points: candidate.marketProofTotal, maxPoints: 25 },
          { key: "economics", label: "Economics & Logistics", points: candidate.economicsTotal, maxPoints: 20 },
          { key: "competitiveMoat", label: "Competitive Moat", points: candidate.competitiveMoatTotal, maxPoints: 15 },
          { key: "contentPotential", label: "Content & Creative", points: candidate.contentPotentialTotal, maxPoints: 15 },
        ],
        breakdown: candidate.scoreBreakdown,
        hardGates: candidate.hardGateResults,
        lastScoredAt: candidate.lastScoredAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP E: CONSUMER INTEL WEBHOOKS (5 endpoints — n8n callbacks)
  // ============================================================

  // Trigger consumer intel scrape pipeline (sends to n8n WF6)
  app.post("/api/webhook/consumer-intel/scrape", async (req: Request, res: Response) => {
    try {
      const { candidateId, productName, keywords, subreddits, amazonAsins } = req.body;
      if (!candidateId) {
        res.status(400).json({ error: "candidateId is required" });
        return;
      }

      // Create tracking jobs
      const [scrapeJob] = await db.insert(consumerIntelJobs).values({
        candidateId: Number(candidateId),
        jobType: "reddit_scrape",
        status: "pending",
        config: { keywords, subreddits, amazonAsins },
      }).returning();

      // Fire n8n webhook
      const result = await triggerN8nWebhook("bomb-consumer-intel-scrape", {
        candidateId,
        productName: productName || "",
        keywords: keywords || [],
        subreddits: subreddits || [],
        amazonAsins: amazonAsins || [],
        jobId: scrapeJob.id,
      });

      if (result.triggered) {
        await db.update(consumerIntelJobs).set({ status: "running", startedAt: new Date() }).where(eq(consumerIntelJobs.id, scrapeJob.id));
      }

      res.json({ success: true, jobId: scrapeJob.id, webhook: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Receives raw scrape data from n8n WF6
  app.post("/api/webhook/consumer-intel/raw-data", async (req: Request, res: Response) => {
    try {
      const { jobId, candidateId, platform, items } = req.body;
      if (!candidateId || !Array.isArray(items)) {
        res.status(400).json({ error: "candidateId and items[] are required" });
        return;
      }

      // Store raw data
      for (const item of items) {
        await db.insert(rawScrapeData).values({
          runId: 0, // No formal run for webhook-triggered data
          sourceId: 0,
          platform: platform || "mixed",
          rawJson: item,
        });
      }

      // Update job
      if (jobId) {
        await db.update(consumerIntelJobs).set({
          status: "completed",
          completedAt: new Date(),
          result: { itemCount: items.length },
        }).where(eq(consumerIntelJobs.id, Number(jobId)));
      }

      // Auto-trigger analysis (WF7)
      triggerN8nWebhook("bomb-consumer-intel-analyze", {
        candidateId,
        itemCount: items.length,
      }).catch(console.error);

      res.json({ success: true, stored: items.length });
    } catch (error: any) {
      console.error("[consumer-intel/raw-data] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Receives analyzed data from n8n WF7 (pain points, phrases, competitor messaging)
  app.post("/api/webhook/consumer-intel/analyzed", async (req: Request, res: Response) => {
    try {
      const { candidateId, painPoints, phrases, competitorMessages, objections } = req.body;
      if (!candidateId) {
        res.status(400).json({ error: "candidateId is required" });
        return;
      }

      let inserted = { painPoints: 0, phrases: 0, competitorMessages: 0 };

      // Insert pain points
      if (Array.isArray(painPoints)) {
        for (const p of painPoints) {
          await db.insert(nichePainPoints).values({
            candidateId: Number(candidateId),
            source: p.source || "reddit",
            sourceUrl: p.sourceUrl || null,
            subreddit: p.subreddit || null,
            painPointText: p.painPointText || p.text,
            rawQuote: p.rawQuote || null,
            frequency: p.frequency || 1,
            painCategory: p.painCategory || null,
            motivationType: p.motivationType || null,
            emotionalIntensity: p.emotionalIntensity || 0,
            urgencyLevel: p.urgencyLevel || null,
            triggerTypes: p.triggerTypes || null,
            adAngleRelevance: p.adAngleRelevance || null,
          });
          inserted.painPoints++;
        }
      }

      // Insert consumer phrases
      if (Array.isArray(phrases)) {
        for (const p of phrases) {
          await db.insert(consumerPhrases).values({
            candidateId: Number(candidateId),
            source: p.source || "reddit",
            sourceUrl: p.sourceUrl || null,
            phrase: p.phrase,
            context: p.context || null,
            frequency: p.frequency || 1,
            phraseType: p.phraseType || "complaint",
            emotionalValence: p.emotionalValence || null,
            emotionalIntensity: p.emotionalIntensity || 0,
            useableAs: p.useableAs || null,
            clusterLabel: p.clusterLabel || null,
            clusterId: p.clusterId || null,
          });
          inserted.phrases++;
        }
      }

      // Insert competitor messaging analysis
      if (Array.isArray(competitorMessages)) {
        for (const m of competitorMessages) {
          await db.insert(competitorMessaging).values({
            candidateId: Number(candidateId),
            source: m.source || "meta_ad",
            sourceUrl: m.sourceUrl || null,
            headline: m.headline || null,
            primaryClaim: m.primaryClaim || null,
            proofMechanism: m.proofMechanism || null,
            ctaText: m.ctaText || null,
            messagingAngle: m.messagingAngle || null,
            awarenessLevel: m.awarenessLevel || null,
            adRunDuration: m.adRunDuration || null,
            estimatedReach: m.estimatedReach || null,
            weaknessIdentified: m.weaknessIdentified || null,
            gapOpportunity: m.gapOpportunity || null,
            analysisJson: m.analysisJson || null,
          });
          inserted.competitorMessages++;
        }
      }

      // Also insert objections as pain points with special category
      if (Array.isArray(objections)) {
        for (const o of objections) {
          await db.insert(nichePainPoints).values({
            candidateId: Number(candidateId),
            source: o.source || "reddit",
            painPointText: `OBJECTION: ${o.objection || o.text}`,
            rawQuote: o.rawQuote || null,
            frequency: o.frequency || 1,
            painCategory: "functional",
            motivationType: "pain_avoidance",
            emotionalIntensity: o.emotionalIntensity || 5,
          });
          inserted.painPoints++;
        }
      }

      // Auto-trigger scoring update
      triggerN8nWebhook("bomb-scoring-update", { candidateId }).catch(() => {});

      res.json({ success: true, inserted });
    } catch (error: any) {
      console.error("[consumer-intel/analyzed] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger creative generation (sends to n8n WF8)
  app.post("/api/webhook/consumer-intel/generate-creative", async (req: Request, res: Response) => {
    try {
      const { candidateId } = req.body;
      if (!candidateId) {
        res.status(400).json({ error: "candidateId is required" });
        return;
      }

      const [job] = await db.insert(consumerIntelJobs).values({
        candidateId: Number(candidateId),
        jobType: "creative_generation",
        status: "pending",
      }).returning();

      const result = await triggerN8nWebhook("bomb-creative-generate", {
        candidateId,
        jobId: job.id,
      });

      if (result.triggered) {
        await db.update(consumerIntelJobs).set({ status: "running", startedAt: new Date() }).where(eq(consumerIntelJobs.id, job.id));
      }

      res.json({ success: true, jobId: job.id, webhook: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Receives creative outputs from n8n WF8
  app.post("/api/webhook/consumer-intel/creative-outputs", async (req: Request, res: Response) => {
    try {
      const { candidateId, jobId, batchId, outputs } = req.body;
      if (!candidateId || !Array.isArray(outputs)) {
        res.status(400).json({ error: "candidateId and outputs[] are required" });
        return;
      }

      let inserted = 0;
      for (const o of outputs) {
        await db.insert(creativeOutputs).values({
          candidateId: Number(candidateId),
          batchId: batchId || `batch-${Date.now()}`,
          outputType: o.outputType || o.type,
          content: o.content,
          contentStructured: o.contentStructured || null,
          sourcePainPointIds: o.sourcePainPointIds || null,
          sourcePhraseIds: o.sourcePhraseIds || null,
          sourceCompetitorIds: o.sourceCompetitorIds || null,
          targetEmotion: o.targetEmotion || null,
          persuasionPrinciple: o.persuasionPrinciple || null,
          awarenessLevel: o.awarenessLevel || null,
          targetSegment: o.targetSegment || null,
          qualityScore: o.qualityScore || null,
        });
        inserted++;
      }

      // Update job
      if (jobId) {
        await db.update(consumerIntelJobs).set({
          status: "completed",
          completedAt: new Date(),
          result: { outputCount: inserted },
        }).where(eq(consumerIntelJobs.id, Number(jobId)));
      }

      res.json({ success: true, inserted });
    } catch (error: any) {
      console.error("[consumer-intel/creative-outputs] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GROUP F: CONSUMER INTEL JOBS (1 endpoint)
  // ============================================================

  // List consumer intel jobs for a candidate
  app.get("/api/consumer-intel-jobs", async (req: Request, res: Response) => {
    try {
      const { candidateId, status, jobType } = req.query;
      const conditions = [];
      if (candidateId) conditions.push(eq(consumerIntelJobs.candidateId, Number(candidateId)));
      if (status) conditions.push(eq(consumerIntelJobs.status, String(status)));
      if (jobType) conditions.push(eq(consumerIntelJobs.jobType, String(jobType)));

      const jobs = conditions.length
        ? await db.select().from(consumerIntelJobs).where(and(...conditions)).orderBy(desc(consumerIntelJobs.createdAt)).limit(50)
        : await db.select().from(consumerIntelJobs).orderBy(desc(consumerIntelJobs.createdAt)).limit(50);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // AD VAULT (Meta Ad Library Monitor — ported from meta-ads-spy)
  // ============================================================

  const META_AD_SCRAPER_ID = "JJghSZmShuco4j9gJ";
  const APIFY_TOKEN = process.env.APIFY_TOKEN || "";
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

  // --- Helpers ---

  function getWeekStart(d = new Date()): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split("T")[0];
  }

  function buildAdLibraryUrl(pageId: string): string {
    return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=${pageId}`;
  }

  // 3-pass dedup logic (adArchiveID → media fingerprint → headline)
  function transformApifyResults(apifyResults: any[], brandId: number) {
    const getMediaFingerprint = (url: string | null) => {
      if (!url) return "";
      const match = url.match(/\/(\d{10,}_\d+[^\/\?]*)/);
      if (match) return match[1];
      return url.slice(-150);
    };

    const extractUrl = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        return val.videoHdUrl || val.video_hd_url || val.videoSdUrl || val.video_sd_url ||
          val.videoPreviewImageUrl || val.video_preview_image_url ||
          val.resizedImageUrl || val.resized_image_url ||
          val.originalImageUrl || val.original_image_url || val.url || null;
      }
      return null;
    };

    // Pass 1: dedupe by adArchiveID
    const seenIds = new Set<string>();
    const uniqueById = apifyResults.filter((item) => {
      const adId = item.adArchiveID || item.adArchiveId || item.adid;
      if (!adId) return true;
      if (seenIds.has(adId)) return false;
      seenIds.add(adId);
      return true;
    });

    // Pass 2: dedupe by media fingerprint
    const mediaGrouped = new Map<string, { item: any; ts: number }>();
    for (const item of uniqueById) {
      const snapshot = item.snapshot || {};
      const firstVideo = snapshot.videos?.[0];
      const videoUrl = firstVideo?.video_hd_url || firstVideo?.video_sd_url || "";
      const firstImage = snapshot.images?.[0];
      const imageUrl = typeof firstImage === "string" ? firstImage : (firstImage?.resizedImageUrl || firstImage?.url || "");
      const fp = getMediaFingerprint(videoUrl || imageUrl);

      let ts = 0;
      if (item.startDateFormatted) ts = new Date(item.startDateFormatted).getTime();
      else if (typeof item.startDate === "number") ts = item.startDate * 1000;

      if (fp) {
        const key = `media:${fp}`;
        const existing = mediaGrouped.get(key);
        if (!existing || (ts > 0 && ts < existing.ts)) mediaGrouped.set(key, { item, ts });
      } else {
        const adId = item.adArchiveID || item.adArchiveId || `unique_${Date.now()}_${Math.random()}`;
        mediaGrouped.set(`id:${adId}`, { item, ts });
      }
    }
    const afterMedia = Array.from(mediaGrouped.values()).map((v) => v.item);

    // Pass 3: dedupe by headline
    const headlineGrouped = new Map<string, { item: any; ts: number }>();
    for (const item of afterMedia) {
      const snapshot = item.snapshot || {};
      const cards = snapshot.cards || [];
      const firstCard = cards[0] || {};
      const headline = (firstCard.title || snapshot.title || snapshot.link_description || "").trim().toLowerCase();

      let ts = 0;
      if (item.startDateFormatted) ts = new Date(item.startDateFormatted).getTime();
      else if (typeof item.startDate === "number") ts = item.startDate * 1000;

      if (headline) {
        const key = `headline:${headline}`;
        const existing = headlineGrouped.get(key);
        if (!existing || (ts > 0 && ts < existing.ts)) headlineGrouped.set(key, { item, ts });
      } else {
        const adId = item.adArchiveID || `unique_${Date.now()}_${Math.random()}`;
        headlineGrouped.set(`id:${adId}`, { item, ts });
      }
    }
    const uniqueResults = Array.from(headlineGrouped.values()).map((v) => v.item).slice(0, 10);

    return uniqueResults.map((item: any, index: number) => {
      const adArchiveId = String(item.adArchiveID || item.adArchiveId || item.adid || `apify_${Date.now()}_${index}`);
      const snapshot = item.snapshot || {};
      const cards = snapshot.cards || [];
      const firstCard = cards[0] || {};

      let creativeUrl: string | null = null;
      let videoUrl: string | null = null;
      let creativeType = "image";

      if (firstCard.videoHdUrl || firstCard.videoSdUrl) {
        videoUrl = extractUrl(firstCard.videoHdUrl) || extractUrl(firstCard.videoSdUrl);
        creativeUrl = extractUrl(firstCard.videoPreviewImageUrl) || extractUrl(firstCard.resizedImageUrl) || extractUrl(firstCard.originalImageUrl);
        creativeType = "video";
      } else if (firstCard.resizedImageUrl || firstCard.originalImageUrl) {
        creativeUrl = extractUrl(firstCard.resizedImageUrl) || extractUrl(firstCard.originalImageUrl);
      } else if (snapshot.videos?.length > 0) {
        videoUrl = extractUrl(snapshot.videos[0]);
        creativeUrl = snapshot.videos[0]?.videoPreviewImageUrl || extractUrl(snapshot.images?.[0]) || null;
        creativeType = "video";
      } else if (snapshot.images?.length > 0) {
        creativeUrl = extractUrl(snapshot.images[0]);
      }

      let adCopy = "";
      if (typeof firstCard.body === "string") adCopy = firstCard.body;
      else if (firstCard.body?.text) adCopy = firstCard.body.text;
      else if (typeof snapshot.body === "string") adCopy = snapshot.body;
      else if (snapshot.body?.text) adCopy = snapshot.body.text;

      const headline = firstCard.title || snapshot.title || "";
      const ctaType = firstCard.ctaText || firstCard.ctaType || snapshot.ctaText || "";

      let startDate: string | null = null;
      if (item.startDateFormatted) startDate = item.startDateFormatted.split("T")[0];
      else if (typeof item.startDate === "number") startDate = new Date(item.startDate * 1000).toISOString().split("T")[0];

      return {
        adId: adArchiveId,
        brandId,
        rank: index + 1,
        creativeType,
        creativeUrl: typeof creativeUrl === "string" ? creativeUrl : null,
        videoUrl: typeof videoUrl === "string" ? videoUrl : null,
        adCopy,
        headline,
        ctaType,
        startDate,
        adLibraryLink: `https://www.facebook.com/ads/library/?id=${adArchiveId}`,
      };
    });
  }

  // Gemini AI 5-tag analysis (reuses Vertex AI or Gemini API key)
  async function analyzeAdCreativeAI(ad: any): Promise<Record<string, string>> {
    if (!GEMINI_API_KEY) {
      const types = ["UGC", "High Production", "Static Image", "Animation"];
      const formats = ["Talking Head", "Product Demo", "Unboxing", "Before/After", "Text Overlay"];
      const angles = ["Problem/Solution", "Social Proof", "FOMO", "Aspiration", "Value Proposition"];
      const hooks = ["Pattern Interrupt", "Question", "Bold Claim", "Curiosity Gap", "Text Hook"];
      const offers = ["Percentage Off", "Free Shipping", "Bundle Deal", "No Offer"];
      const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      return { asset_type: pick(types), visual_format: pick(formats), messaging_angle: pick(angles), hook_tactic: pick(hooks), offer_type: pick(offers) };
    }

    const prompt = `Analyze this DTC ad creative. Return a JSON object with these 5 categories:
1. "asset_type": ONE from: "UGC", "High Production", "Static Image", "Animation", "Screen Recording", "Stock Footage"
2. "visual_format": ONE from: "Talking Head", "Product Demo", "Unboxing", "Before/After", "Split Screen", "Text Overlay", "Lifestyle", "Testimonial Compilation", "Tutorial", "Behind the Scenes", "Product on White", "User Review", "Skit", "ASMR", "Green Screen"
3. "messaging_angle": ONE from: "Problem/Solution", "Social Proof", "FOMO", "Aspiration", "Value Proposition", "Fear/Pain Point", "Curiosity", "Authority/Expert", "Comparison", "Transformation", "Humor", "Urgency", "Exclusivity", "Community"
4. "hook_tactic": ONE from: "Pattern Interrupt", "Question", "Bold Claim", "Curiosity Gap", "Controversy", "Relatable Scenario", "Shocking Stat", "Direct Address", "Visual Surprise", "Sound Effect", "Text Hook", "Celebrity/Influencer", "Unboxing Reveal"
5. "offer_type": ONE from: "Percentage Off", "Dollar Amount Off", "Free Shipping", "BOGO", "Free Trial", "Free Gift", "Bundle Deal", "Subscribe & Save", "Limited Time", "No Offer"

Context: Ad copy: ${ad.adCopy || "N/A"} | Headline: ${ad.headline || "N/A"} | CTA: ${ad.ctaType || "N/A"} | Type: ${ad.creativeType || "image"}

Return ONLY valid JSON with these 5 keys.`;

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return { asset_type: "Unknown", visual_format: "Unknown", messaging_angle: "Unknown", hook_tactic: "Unknown", offer_type: "Unknown" };
    } catch (err: any) {
      console.error("Gemini analysis error:", err.message);
      return { asset_type: "Unknown", visual_format: "Unknown", messaging_angle: "Unknown", hook_tactic: "Unknown", offer_type: "Unknown" };
    }
  }

  // --- Ad Vault Brands ---

  app.get("/api/ad-vault/brands", async (_req: Request, res: Response) => {
    try {
      const brands = await db.select({
        id: adVaultBrands.id,
        brandName: adVaultBrands.brandName,
        websiteUrl: adVaultBrands.websiteUrl,
        fbPageUrl: adVaultBrands.fbPageUrl,
        pageId: adVaultBrands.pageId,
        vertical: adVaultBrands.vertical,
        status: adVaultBrands.status,
        lastScraped: adVaultBrands.lastScraped,
        createdAt: adVaultBrands.createdAt,
      }).from(adVaultBrands).where(eq(adVaultBrands.status, "active")).orderBy(adVaultBrands.brandName);

      // Add ad_count and evergreen_count for each brand
      const result = [];
      for (const brand of brands) {
        const [adCountResult] = await db.select({ count: count() }).from(adVault).where(eq(adVault.brandId, brand.id));
        const [evergreenResult] = await db.select({ count: count() }).from(adVault).where(and(eq(adVault.brandId, brand.id), gte(adVault.weeksInTop10, 4)));
        result.push({ ...brand, adCount: adCountResult?.count || 0, evergreenCount: evergreenResult?.count || 0 });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ad-vault/brands", async (req: Request, res: Response) => {
    try {
      const { brand_name, website_url, ad_library_url, vertical } = req.body;
      if (!brand_name || !ad_library_url) return res.status(400).json({ error: "brand_name and ad_library_url required" });

      const pageIdMatch = ad_library_url.match(/view_all_page_id=(\d+)/);
      if (!pageIdMatch) return res.status(400).json({ error: "Could not extract page_id from URL" });
      const pageId = pageIdMatch[1];

      const [brand] = await db.insert(adVaultBrands).values({
        brandName: brand_name,
        websiteUrl: website_url || null,
        fbPageUrl: ad_library_url,
        pageId,
        vertical: vertical || null,
      }).returning();

      res.json({ success: true, id: brand.id, pageId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/ad-vault/brands/:id", async (req: Request, res: Response) => {
    try {
      const updates: Record<string, any> = {};
      const fields = ["brandName", "websiteUrl", "fbPageUrl", "pageId", "vertical", "status"] as const;
      for (const f of fields) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      }
      updates.updatedAt = new Date();
      await db.update(adVaultBrands).set(updates).where(eq(adVaultBrands.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ad-vault/brands/:id", async (req: Request, res: Response) => {
    try {
      const brandId = Number(req.params.id);
      await db.delete(adVaultSnapshots).where(eq(adVaultSnapshots.brandId, brandId));
      await db.delete(adVault).where(eq(adVault.brandId, brandId));
      await db.delete(adVaultScrapeJobs).where(eq(adVaultScrapeJobs.brandId, brandId));
      await db.delete(adVaultBrands).where(eq(adVaultBrands.id, brandId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Ad Vault Ads ---

  app.get("/api/ad-vault/ads", async (req: Request, res: Response) => {
    try {
      const { brand_ids, evergreen_only, min_weeks, date_from, date_to, media_type, sort = "newest", limit: lim = "50", offset: off = "0",
        ai_asset_type, ai_visual_format, ai_messaging_angle, ai_hook_tactic, ai_offer_type } = req.query;

      const conditions: any[] = [];

      if (brand_ids) {
        const ids = (Array.isArray(brand_ids) ? brand_ids : [brand_ids]).map(Number);
        conditions.push(inArray(adVault.brandId, ids));
      }
      if (date_from) conditions.push(gte(adVault.startDate, String(date_from)));
      if (date_to) conditions.push(lte(adVault.startDate, String(date_to)));
      if (media_type) conditions.push(eq(adVault.creativeType, String(media_type)));
      if (ai_asset_type) conditions.push(eq(adVault.aiAssetType, String(ai_asset_type)));
      if (ai_visual_format) conditions.push(eq(adVault.aiVisualFormat, String(ai_visual_format)));
      if (ai_messaging_angle) conditions.push(eq(adVault.aiMessagingAngle, String(ai_messaging_angle)));
      if (ai_hook_tactic) conditions.push(eq(adVault.aiHookTactic, String(ai_hook_tactic)));
      if (ai_offer_type) conditions.push(eq(adVault.aiOfferType, String(ai_offer_type)));
      if (evergreen_only === "true" || min_weeks) {
        conditions.push(gte(adVault.weeksInTop10, min_weeks ? Number(min_weeks) : 4));
      }

      const orderBy = sort === "rank" ? adVault.rank : sort === "oldest" ? adVault.startDate : desc(adVault.startDate);

      let query = db.select({
        id: adVault.id, adId: adVault.adId, brandId: adVault.brandId, dateScraped: adVault.dateScraped,
        rank: adVault.rank, creativeType: adVault.creativeType, creativeUrl: adVault.creativeUrl,
        storedCreativeUrl: adVault.storedCreativeUrl, videoUrl: adVault.videoUrl,
        adCopy: adVault.adCopy, headline: adVault.headline, ctaType: adVault.ctaType,
        startDate: adVault.startDate, adLibraryLink: adVault.adLibraryLink,
        aiAssetType: adVault.aiAssetType, aiVisualFormat: adVault.aiVisualFormat,
        aiMessagingAngle: adVault.aiMessagingAngle, aiHookTactic: adVault.aiHookTactic,
        aiOfferType: adVault.aiOfferType,
        firstSeen: adVault.firstSeen, lastSeen: adVault.lastSeen,
        weeksInTop10: adVault.weeksInTop10, bookmarked: adVault.bookmarked,
        brandName: adVaultBrands.brandName, vertical: adVaultBrands.vertical,
      }).from(adVault)
        .innerJoin(adVaultBrands, eq(adVault.brandId, adVaultBrands.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(Number(lim))
        .offset(Number(off));

      const ads = await query;
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ad-vault/ads/bookmarked", async (_req: Request, res: Response) => {
    try {
      const ads = await db.select({
        id: adVault.id, adId: adVault.adId, brandId: adVault.brandId,
        rank: adVault.rank, creativeType: adVault.creativeType, creativeUrl: adVault.creativeUrl,
        storedCreativeUrl: adVault.storedCreativeUrl, videoUrl: adVault.videoUrl,
        adCopy: adVault.adCopy, headline: adVault.headline, ctaType: adVault.ctaType,
        startDate: adVault.startDate, adLibraryLink: adVault.adLibraryLink,
        aiAssetType: adVault.aiAssetType, aiVisualFormat: adVault.aiVisualFormat,
        aiMessagingAngle: adVault.aiMessagingAngle, aiHookTactic: adVault.aiHookTactic,
        aiOfferType: adVault.aiOfferType,
        weeksInTop10: adVault.weeksInTop10, bookmarked: adVault.bookmarked,
        brandName: adVaultBrands.brandName, vertical: adVaultBrands.vertical,
      }).from(adVault)
        .innerJoin(adVaultBrands, eq(adVault.brandId, adVaultBrands.id))
        .where(eq(adVault.bookmarked, true))
        .orderBy(desc(adVault.updatedAt));
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ad-vault/ads/:id", async (req: Request, res: Response) => {
    try {
      const [ad] = await db.select().from(adVault)
        .innerJoin(adVaultBrands, eq(adVault.brandId, adVaultBrands.id))
        .where(eq(adVault.id, Number(req.params.id)));
      if (!ad) return res.status(404).json({ error: "Ad not found" });
      res.json({ ...ad.ad_vault, brandName: ad.ad_vault_brands.brandName, vertical: ad.ad_vault_brands.vertical });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Analyze single ad
  app.post("/api/ad-vault/ads/:id/analyze", async (req: Request, res: Response) => {
    try {
      const [existing] = await db.select().from(adVault).where(eq(adVault.id, Number(req.params.id)));
      if (!existing) return res.status(404).json({ error: "Ad not found" });

      const analysis = await analyzeAdCreativeAI(existing);
      await db.update(adVault).set({
        aiAssetType: analysis.asset_type,
        aiVisualFormat: analysis.visual_format,
        aiMessagingAngle: analysis.messaging_angle,
        aiHookTactic: analysis.hook_tactic,
        aiOfferType: analysis.offer_type,
        aiRawResponse: analysis,
        updatedAt: new Date(),
      }).where(eq(adVault.id, existing.id));

      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch analyze unanalyzed ads
  app.post("/api/ad-vault/ads/analyze-batch", async (_req: Request, res: Response) => {
    try {
      const unanalyzed = await db.select().from(adVault).where(isNull(adVault.aiAssetType)).orderBy(desc(adVault.createdAt));
      if (unanalyzed.length === 0) return res.json({ analyzed: 0, message: "No unanalyzed ads" });

      // Start async, return immediately
      res.json({ message: `Analyzing ${unanalyzed.length} ads in background`, total: unanalyzed.length });

      (async () => {
        let analyzed = 0;
        for (const ad of unanalyzed) {
          try {
            const analysis = await analyzeAdCreativeAI(ad);
            await db.update(adVault).set({
              aiAssetType: analysis.asset_type,
              aiVisualFormat: analysis.visual_format,
              aiMessagingAngle: analysis.messaging_angle,
              aiHookTactic: analysis.hook_tactic,
              aiOfferType: analysis.offer_type,
              aiRawResponse: analysis,
              updatedAt: new Date(),
            }).where(eq(adVault.id, ad.id));
            analyzed++;
            // Rate limiting
            await new Promise((r) => setTimeout(r, 500));
          } catch (err: any) {
            console.error(`Failed to analyze ad ${ad.id}:`, err.message);
          }
        }
        console.log(`Batch analysis complete: ${analyzed}/${unanalyzed.length}`);
      })();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle bookmark
  app.post("/api/ad-vault/ads/:id/bookmark", async (req: Request, res: Response) => {
    try {
      const [ad] = await db.select({ id: adVault.id, bookmarked: adVault.bookmarked }).from(adVault).where(eq(adVault.id, Number(req.params.id)));
      if (!ad) return res.status(404).json({ error: "Ad not found" });
      const newVal = !ad.bookmarked;
      await db.update(adVault).set({ bookmarked: newVal, updatedAt: new Date() }).where(eq(adVault.id, ad.id));
      res.json({ bookmarked: newVal });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Ad Vault Scraping ---

  app.post("/api/ad-vault/scrape/brand/:id", async (req: Request, res: Response) => {
    try {
      const [brand] = await db.select().from(adVaultBrands).where(eq(adVaultBrands.id, Number(req.params.id)));
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      if (!brand.pageId) return res.status(400).json({ error: "Brand has no page_id" });

      if (!APIFY_TOKEN) {
        // Mock mode: create completed job
        const [job] = await db.insert(adVaultScrapeJobs).values({
          jobType: "ad_scrape", brandId: brand.id, status: "complete",
          inputParams: { page_id: brand.pageId }, resultCount: 0,
          completedAt: new Date(),
        }).returning();
        return res.json({ jobId: job.id, mock: true });
      }

      const adLibraryUrl = buildAdLibraryUrl(brand.pageId);
      const input = { startUrls: [{ url: adLibraryUrl }], resultsLimit: 20, activeStatus: "active" };

      const resp = await fetch(`https://api.apify.com/v2/acts/${META_AD_SCRAPER_ID}/runs?token=${APIFY_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!resp.ok) throw new Error(`Apify ${resp.status}: ${await resp.text()}`);
      const data = await resp.json();

      const [job] = await db.insert(adVaultScrapeJobs).values({
        jobType: "ad_scrape", brandId: brand.id, status: "running",
        apifyRunId: data.data.id, inputParams: input,
      }).returning();

      res.json({ jobId: job.id, apifyRunId: data.data.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ad-vault/scrape/all", async (_req: Request, res: Response) => {
    try {
      const brands = await db.select().from(adVaultBrands)
        .where(and(eq(adVaultBrands.status, "active"), sql`${adVaultBrands.pageId} IS NOT NULL`));

      const jobs = [];
      for (const brand of brands) {
        if (!APIFY_TOKEN) {
          const [job] = await db.insert(adVaultScrapeJobs).values({
            jobType: "ad_scrape", brandId: brand.id, status: "complete",
            inputParams: {}, resultCount: 0, completedAt: new Date(),
          }).returning();
          jobs.push({ brandId: brand.id, brandName: brand.brandName, jobId: job.id, mock: true });
        } else {
          const adLibraryUrl = buildAdLibraryUrl(brand.pageId!);
          const input = { startUrls: [{ url: adLibraryUrl }], resultsLimit: 20, activeStatus: "active" };
          try {
            const resp = await fetch(`https://api.apify.com/v2/acts/${META_AD_SCRAPER_ID}/runs?token=${APIFY_TOKEN}`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
            });
            const data = await resp.json();
            const [job] = await db.insert(adVaultScrapeJobs).values({
              jobType: "ad_scrape", brandId: brand.id, status: "running",
              apifyRunId: data.data?.id, inputParams: input,
            }).returning();
            jobs.push({ brandId: brand.id, brandName: brand.brandName, jobId: job.id, apifyRunId: data.data?.id });
          } catch (err: any) {
            jobs.push({ brandId: brand.id, brandName: brand.brandName, error: err.message });
          }
        }
      }
      res.json({ success: true, brandCount: brands.length, jobs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poll scrape job status — fetches results when complete
  app.get("/api/ad-vault/scrape/status/:jobId", async (req: Request, res: Response) => {
    try {
      const [job] = await db.select().from(adVaultScrapeJobs).where(eq(adVaultScrapeJobs.id, Number(req.params.jobId)));
      if (!job) return res.status(404).json({ error: "Job not found" });

      if (job.status === "complete" || job.status === "error") {
        return res.json({ status: job.status, resultCount: job.resultCount });
      }

      if (!job.apifyRunId) return res.json({ status: job.status });

      // Poll Apify
      const pollResp = await fetch(`https://api.apify.com/v2/actor-runs/${job.apifyRunId}?token=${APIFY_TOKEN}`);
      const pollData = await pollResp.json();
      const apifyStatus = pollData.data?.status;

      if (apifyStatus === "SUCCEEDED") {
        const resultsResp = await fetch(`https://api.apify.com/v2/actor-runs/${job.apifyRunId}/dataset/items?token=${APIFY_TOKEN}`);
        const apifyResults = await resultsResp.json();
        const transformed = transformApifyResults(apifyResults, job.brandId!);
        const today = new Date().toISOString().split("T")[0];
        const weekStart = getWeekStart();

        // Upsert ads
        let processedCount = 0;
        for (const ad of transformed) {
          const [existing] = await db.select().from(adVault).where(eq(adVault.adId, ad.adId));

          if (existing) {
            const lastWeek = existing.lastSeen ? getWeekStart(new Date(existing.lastSeen)) : null;
            const weeksInTop10 = (lastWeek && lastWeek !== weekStart) ? (existing.weeksInTop10 || 1) + 1 : (existing.weeksInTop10 || 1);

            await db.update(adVault).set({
              lastSeen: today, rank: ad.rank, weeksInTop10,
              creativeUrl: ad.creativeUrl || existing.creativeUrl,
              videoUrl: ad.videoUrl || existing.videoUrl,
              updatedAt: new Date(),
            }).where(eq(adVault.id, existing.id));
          } else {
            await db.insert(adVault).values({
              adId: ad.adId, brandId: ad.brandId, dateScraped: today, rank: ad.rank,
              creativeType: ad.creativeType, creativeUrl: ad.creativeUrl, videoUrl: ad.videoUrl,
              adCopy: ad.adCopy, headline: ad.headline, ctaType: ad.ctaType,
              startDate: ad.startDate, adLibraryLink: ad.adLibraryLink,
              firstSeen: today, lastSeen: today, weeksInTop10: 1,
            });
          }

          // Weekly snapshot
          try {
            await db.insert(adVaultSnapshots).values({
              brandId: ad.brandId, adId: ad.adId, weekStart, rank: ad.rank,
            });
          } catch (e) { /* duplicate OK */ }

          processedCount++;
        }

        // Update brand last_scraped
        await db.update(adVaultBrands).set({ lastScraped: new Date(), updatedAt: new Date() }).where(eq(adVaultBrands.id, job.brandId!));

        // Update job
        await db.update(adVaultScrapeJobs).set({
          status: "complete", resultCount: processedCount,
          results: transformed, completedAt: new Date(),
        }).where(eq(adVaultScrapeJobs.id, job.id));

        return res.json({ status: "complete", resultCount: processedCount });
      }

      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyStatus)) {
        await db.update(adVaultScrapeJobs).set({
          status: "error", errorMessage: `Apify ${apifyStatus}`, completedAt: new Date(),
        }).where(eq(adVaultScrapeJobs.id, job.id));
        return res.json({ status: "error", error: `Job ${apifyStatus}` });
      }

      res.json({ status: "running" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Ad Vault Analytics ---

  app.get("/api/ad-vault/analytics/evergreen", async (req: Request, res: Response) => {
    try {
      const minWeeks = Number(req.query.min_weeks || 4);
      const ads = await db.select({
        id: adVault.id, adId: adVault.adId, brandId: adVault.brandId,
        rank: adVault.rank, creativeType: adVault.creativeType, creativeUrl: adVault.creativeUrl,
        adCopy: adVault.adCopy, headline: adVault.headline,
        aiAssetType: adVault.aiAssetType, aiMessagingAngle: adVault.aiMessagingAngle,
        weeksInTop10: adVault.weeksInTop10, firstSeen: adVault.firstSeen, lastSeen: adVault.lastSeen,
        brandName: adVaultBrands.brandName, vertical: adVaultBrands.vertical,
      }).from(adVault)
        .innerJoin(adVaultBrands, eq(adVault.brandId, adVaultBrands.id))
        .where(gte(adVault.weeksInTop10, minWeeks))
        .orderBy(desc(adVault.weeksInTop10));
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ad-vault/analytics/by-vertical", async (_req: Request, res: Response) => {
    try {
      const stats = await db.select({
        vertical: adVaultBrands.vertical,
        brandCount: count(adVaultBrands.id),
      }).from(adVaultBrands).where(eq(adVaultBrands.status, "active")).groupBy(adVaultBrands.vertical);

      // Enrich with ad counts
      const result = [];
      for (const row of stats) {
        const brands = await db.select({ id: adVaultBrands.id }).from(adVaultBrands)
          .where(and(eq(adVaultBrands.status, "active"), eq(adVaultBrands.vertical, row.vertical || "")));
        const brandIds = brands.map((b) => b.id);
        let adCount = 0;
        let avgWeeks = 0;
        if (brandIds.length > 0) {
          const [adResult] = await db.select({ count: count(), avgWeeks: avg(adVault.weeksInTop10) }).from(adVault).where(inArray(adVault.brandId, brandIds));
          adCount = adResult?.count || 0;
          avgWeeks = Number(adResult?.avgWeeks || 0);
        }
        result.push({ vertical: row.vertical, brandCount: row.brandCount, adCount, avgWeeksInTop10: avgWeeks });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import brands (JSON or CSV)
  app.post("/api/ad-vault/import/brands", async (req: Request, res: Response) => {
    try {
      const { brands } = req.body;
      if (!Array.isArray(brands)) return res.status(400).json({ error: "Expected array" });

      const inserted = [];
      const errors = [];
      for (const b of brands) {
        try {
          const pageIdMatch = b.fb_page_url?.match(/view_all_page_id=(\d+)/);
          const [brand] = await db.insert(adVaultBrands).values({
            brandName: b.brand_name, websiteUrl: b.website_url || null,
            fbPageUrl: b.fb_page_url || "", pageId: pageIdMatch?.[1] || b.page_id || null,
            vertical: b.vertical || null,
          }).returning();
          inserted.push({ id: brand.id, brandName: brand.brandName });
        } catch (e: any) {
          errors.push({ brandName: b.brand_name, error: e.message });
        }
      }
      res.json({ success: true, inserted, errors });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unanalyzed count
  app.get("/api/ad-vault/ads/unanalyzed/count", async (_req: Request, res: Response) => {
    try {
      const [result] = await db.select({ count: count() }).from(adVault).where(isNull(adVault.aiAssetType));
      res.json({ count: result?.count || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // TRANSCRIPT PRODUCTS — Google Drive extraction pipeline
  // ============================================================

  // List extracted transcript products with optional assessment filter
  app.get("/api/transcripts/products", async (req: Request, res: Response) => {
    try {
      const { assessment } = req.query;
      let query = db.select().from(transcriptProducts).orderBy(desc(transcriptProducts.createdAt));
      if (assessment && typeof assessment === "string") {
        query = query.where(eq(transcriptProducts.assessment, assessment)) as any;
      }
      const rows = await query;
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Return already-processed Google Doc IDs (for n8n dedup)
  app.get("/api/transcripts/processed-ids", async (_req: Request, res: Response) => {
    try {
      const rows = await db.select({ docId: transcriptProducts.docId }).from(transcriptProducts);
      res.json(rows.map(r => r.docId));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // n8n posts extracted products from a transcript (multi-product)
  app.post("/api/transcripts/ingest", async (req: Request, res: Response) => {
    try {
      const { docId, docTitle, docUrl, products } = req.body;
      if (!docId || !Array.isArray(products)) {
        res.status(400).json({ error: "docId and products[] are required" });
        return;
      }

      const results = [];
      for (const p of products) {
        // Check if this doc+product combo already exists
        const existing = await db.select().from(transcriptProducts)
          .where(and(
            eq(transcriptProducts.docId, `${docId}__${p.productName}`),
          )).limit(1);

        if (existing.length > 0) {
          results.push({ productName: p.productName, status: "skipped_duplicate" });
          continue;
        }

        // Insert transcript product
        const [tp] = await db.insert(transcriptProducts).values({
          docId: `${docId}__${p.productName}`,  // Unique per doc+product combo
          docTitle,
          docUrl,
          productName: p.productName,
          mentionContext: p.mentionContext,
          extractionConfidence: p.confidence,
          assessment: p.assessment || "watch",
          reasoning: p.reasoning,
        }).returning();

        // Auto-promote "investigate" products to product_candidates
        if (p.assessment === "investigate") {
          const [candidate] = await db.insert(productCandidates).values({
            name: p.productName,
            sourceUrl: docUrl,
            notes: `Extracted from transcript: ${docTitle}. ${p.reasoning || ""}`,
            status: "evaluating",
          }).returning();

          await db.update(transcriptProducts)
            .set({ candidateId: candidate.id })
            .where(eq(transcriptProducts.id, tp.id));

          results.push({ productName: p.productName, status: "promoted", candidateId: candidate.id });
        } else {
          results.push({ productName: p.productName, status: "recorded", assessment: p.assessment });
        }
      }

      res.json({ success: true, docId, results });
    } catch (error: any) {
      console.error("[transcripts/ingest] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Manually promote a transcript product to a candidate
  app.patch("/api/transcripts/products/:id/promote", async (req: Request, res: Response) => {
    try {
      const tpId = Number(req.params.id);
      const [tp] = await db.select().from(transcriptProducts).where(eq(transcriptProducts.id, tpId));
      if (!tp) { res.status(404).json({ error: "Transcript product not found" }); return; }
      if (tp.candidateId) { res.json({ success: true, candidateId: tp.candidateId, message: "Already promoted" }); return; }

      const [candidate] = await db.insert(productCandidates).values({
        name: tp.productName,
        sourceUrl: tp.docUrl,
        notes: `Promoted from transcript: ${tp.docTitle}. ${tp.reasoning || ""}`,
        status: "evaluating",
      }).returning();

      await db.update(transcriptProducts)
        .set({ candidateId: candidate.id, assessment: "investigate" })
        .where(eq(transcriptProducts.id, tpId));

      res.json({ success: true, candidateId: candidate.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger n8n to re-scan Google Drive folder
  app.post("/api/transcripts/reprocess", async (_req: Request, res: Response) => {
    try {
      const result = await triggerN8nWebhook("bomb-import-from-drive", {});
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // GATE VALIDATION PIPELINE
  // ============================================================

  // Get gate results for a candidate
  app.get("/api/candidates/:id/gates", async (req: Request, res: Response) => {
    try {
      const candidateId = Number(req.params.id);
      const gates = await db.select().from(gateResults)
        .where(eq(gateResults.candidateId, candidateId))
        .orderBy(gateResults.gateOrder);
      res.json(gates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger full gate validation pipeline for a candidate
  app.post("/api/candidates/:id/validate", async (req: Request, res: Response) => {
    try {
      const candidateId = Number(req.params.id);
      const { startAtGate } = req.body || {};

      const [candidate] = await db.select().from(productCandidates)
        .where(eq(productCandidates.id, candidateId));
      if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

      const result = await triggerN8nWebhook("bomb-validate-candidate", {
        candidateId,
        candidateName: candidate.name,
        startAtGate: startAtGate || 1,
      });

      res.json({ success: true, candidateId, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger a single gate for a candidate
  app.post("/api/candidates/:id/gate/:gateName", async (req: Request, res: Response) => {
    try {
      const candidateId = Number(req.params.id);
      const { gateName } = req.params;
      const validGates = ["kalodata", "amazon", "aliexpress", "meta_ads"];
      if (!validGates.includes(gateName)) {
        res.status(400).json({ error: `Invalid gate: ${gateName}. Valid: ${validGates.join(", ")}` });
        return;
      }

      const [candidate] = await db.select().from(productCandidates)
        .where(eq(productCandidates.id, candidateId));
      if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

      const result = await triggerN8nWebhook("bomb-validate-candidate", {
        candidateId,
        candidateName: candidate.name,
        singleGate: gateName,
      });

      res.json({ success: true, candidateId, gate: gateName, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // n8n posts gate results back after validation
  app.post("/api/ingest/gate-result", async (req: Request, res: Response) => {
    try {
      const { candidateId, gateName, gateOrder, passed, rawData, criteriaChecked, errorMessage, runId } = req.body;

      if (!candidateId || !gateName || gateOrder == null) {
        res.status(400).json({ error: "candidateId, gateName, gateOrder are required" });
        return;
      }

      // Upsert: replace if same candidate+gate already exists
      const existing = await db.select().from(gateResults)
        .where(and(
          eq(gateResults.candidateId, Number(candidateId)),
          eq(gateResults.gateName, gateName),
        )).limit(1);

      let result;
      if (existing.length > 0) {
        [result] = await db.update(gateResults)
          .set({ passed, rawData, criteriaChecked, errorMessage, runId, createdAt: new Date() })
          .where(eq(gateResults.id, existing[0].id))
          .returning();
      } else {
        [result] = await db.insert(gateResults).values({
          candidateId: Number(candidateId),
          gateName,
          gateOrder: Number(gateOrder),
          passed,
          rawData,
          criteriaChecked,
          errorMessage,
          runId,
        }).returning();
      }

      // Update candidate jsonb fields based on gate
      const dataFieldMap: Record<string, string> = {
        kalodata: "kalodataData",
        amazon: "amazonData",
        aliexpress: "economicsData",
        meta_ads: "metaAdsData",
      };
      const field = dataFieldMap[gateName];
      if (field && rawData) {
        await db.update(productCandidates)
          .set({ [field]: rawData } as any)
          .where(eq(productCandidates.id, Number(candidateId)));
      }

      // If gate failed, update candidate decision
      if (passed === false) {
        const allGates = await db.select().from(gateResults)
          .where(eq(gateResults.candidateId, Number(candidateId)));
        const failedAt = gateOrder;
        await db.update(productCandidates)
          .set({
            decision: failedAt <= 2 ? "REJECT" : "WATCHLIST",
            hardGateResults: allGates.map(g => ({ gate: g.gateName, passed: g.passed })),
          })
          .where(eq(productCandidates.id, Number(candidateId)));
      }

      res.json({ success: true, gateResultId: result.id, passed });
    } catch (error: any) {
      console.error("[ingest/gate-result] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // TIKTOK SCRAPER (from bev4/tiktok-scraper)
  // ============================================================

  // Scrape TikTok videos by keyword
  app.post("/api/tiktok/scrape", async (req: Request, res: Response) => {
    try {
      const { keyword, maxResults = 20, candidateId } = req.body;
      if (!keyword) { res.status(400).json({ error: "keyword is required" }); return; }

      // Create a scrape run record
      const [tiktokSource] = await db.select().from(scrapeSources)
        .where(eq(scrapeSources.platform, "tiktok")).limit(1);

      let sourceId = tiktokSource?.id;
      if (!sourceId) {
        // Auto-create the TikTok scrape source
        const [newSource] = await db.insert(scrapeSources).values({
          actorId: "clockworks/tiktok-scraper",
          name: "TikTok Trend Scraper",
          platform: "tiktok",
          category: "social",
          defaultInput: { resultsPerPage: 20 },
        }).returning();
        sourceId = newSource.id;
      }

      const [run] = await db.insert(scrapeRuns).values({
        sourceId,
        candidateId: candidateId || null,
        status: "running",
        startedAt: new Date(),
      }).returning();

      // Run the scrape (async — respond immediately, update DB when done)
      res.json({ success: true, runId: run.id, message: "TikTok scrape started" });

      try {
        const videos = await scrapeTikTokByKeyword(keyword, maxResults);

        // Store raw results
        for (const video of videos) {
          await db.insert(rawScrapeData).values({
            runId: run.id,
            sourceId,
            platform: "tiktok",
            rawJson: video,
          });
        }

        // Also create trend items from top videos
        for (const video of videos.slice(0, 10)) {
          const existing = await db.select().from(trendItems)
            .where(eq(trendItems.url, video.videoUrl)).limit(1);
          if (existing.length === 0) {
            await db.insert(trendItems).values({
              platform: "tiktok",
              title: video.description.slice(0, 200) || `TikTok by ${video.author}`,
              url: video.videoUrl,
              notes: `${video.views.toLocaleString()} views, ${video.likes.toLocaleString()} likes`,
              sourceActorId: "clockworks/tiktok-scraper",
              rawRunId: run.id,
              trendVelocity: video.views > 0 ? video.likes / video.views : 0,
            });
          }
        }

        await db.update(scrapeRuns).set({
          status: "complete",
          itemsCount: videos.length,
          completedAt: new Date(),
        }).where(eq(scrapeRuns.id, run.id));
      } catch (err: any) {
        await db.update(scrapeRuns).set({
          status: "failed",
          errorMessage: err.message,
          completedAt: new Date(),
        }).where(eq(scrapeRuns.id, run.id));
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scrape comments from a TikTok video
  app.post("/api/tiktok/comments", async (req: Request, res: Response) => {
    try {
      const { videoUrl, candidateId, maxComments = 50 } = req.body;
      if (!videoUrl) { res.status(400).json({ error: "videoUrl is required" }); return; }

      const comments = await scrapeTikTokComments(videoUrl, maxComments);

      // If candidateId provided, store as consumer phrases
      if (candidateId) {
        for (const comment of comments) {
          await db.insert(consumerPhrases).values({
            candidateId: Number(candidateId),
            source: "tiktok",
            sourceUrl: videoUrl,
            phrase: comment.text,
            frequency: 1,
            phraseType: "complaint", // Will be refined by AI later
            emotionalValence: "neutral",
          });
        }
      }

      res.json({ success: true, count: comments.length, comments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pipeline summary — counts at each stage for funnel visualization
  app.get("/api/pipeline/summary", async (_req: Request, res: Response) => {
    try {
      const [transcriptCount] = await db.select({ count: count() }).from(transcriptProducts);
      const [extractedCount] = await db.select({ count: count() }).from(transcriptProducts)
        .where(eq(transcriptProducts.assessment, "investigate"));
      const [candidateCount] = await db.select({ count: count() }).from(productCandidates);

      // Gate pass counts
      const gateCounts: Record<string, number> = {};
      for (const gate of ["kalodata", "amazon", "aliexpress", "meta_ads"]) {
        const [result] = await db.select({ count: count() }).from(gateResults)
          .where(and(eq(gateResults.gateName, gate), eq(gateResults.passed, true)));
        gateCounts[gate] = result?.count || 0;
      }

      // Decision distribution
      const decisions = await db.select({
        decision: productCandidates.decision,
        count: count(),
      }).from(productCandidates)
        .where(sql`${productCandidates.decision} IS NOT NULL`)
        .groupBy(productCandidates.decision);

      res.json({
        transcripts: transcriptCount?.count || 0,
        extracted: extractedCount?.count || 0,
        candidates: candidateCount?.count || 0,
        gates: gateCounts,
        decisions: Object.fromEntries(decisions.map(d => [d.decision, d.count])),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
