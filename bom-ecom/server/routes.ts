import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { db } from "./db";
import { productCandidates, competitorIntel, trendItems, productCriteriaChecks, WINNING_CRITERIA_KEYS, uploadedMedia } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import * as competitorAirtable from "./lib/competitor-airtable";

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

  return httpServer;
}
