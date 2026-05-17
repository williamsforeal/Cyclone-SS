import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  imageUrl: text("image_url"),
  status: text("status").default("active"),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productId: integer("product_id"),
  objective: text("objective"),
  offer: text("offer"),
  targetAudience: text("target_audience"),
  budget: real("budget"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").default("draft"),
  spend: real("spend").default(0),
  roas: real("roas"),
  cac: real("cac"),
  ctr: real("ctr"),
  cvr: real("cvr"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const adSets = pgTable("ad_sets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  name: text("name").notNull(),
  avatarTarget: text("avatar_target"),
  awarenessLevel: text("awareness_level"),
  angle: text("angle"),
  status: text("status").default("draft"),
  budget: real("budget"),
});

export const insertAdSetSchema = createInsertSchema(adSets).omit({ id: true });
export type InsertAdSet = z.infer<typeof insertAdSetSchema>;
export type AdSet = typeof adSets.$inferSelect;

export const creativeStatusEnum = ["draft", "generated", "approved", "testing", "winner", "retired"] as const;
export type CreativeStatus = typeof creativeStatusEnum[number];

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  adSetId: integer("ad_set_id"),
  campaignId: integer("campaign_id"),
  name: text("name").notNull(),
  concept: text("concept"),
  headline: text("headline"),
  hook: text("hook"),
  cta: text("cta"),
  adType: text("ad_type"),
  avatarTarget: text("avatar_target"),
  awarenessLevel: text("awareness_level"),
  angle: text("angle"),
  visualMotif: text("visual_motif"),
  headlineType: text("headline_type"),
  status: text("status").default("draft"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  promptUsed: text("prompt_used"),
  tags: text("tags").array(),
  spend: real("spend"),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  conversions: integer("conversions"),
  ctr: real("ctr"),
  cvr: real("cvr"),
  roas: real("roas"),
  whyItWon: text("why_it_won"),
  whenToReuse: text("when_to_reuse"),
  whenNotToReuse: text("when_not_to_reuse"),
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAdSchema = createInsertSchema(ads).omit({ id: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  adId: integer("ad_id"),
  experimentId: integer("experiment_id"),
  name: text("name"),
  url: text("url"),
  promptUsed: text("prompt_used"),
  referenceImageUrl: text("reference_image_url"),
  variant: text("variant"),
  status: text("status").default("pending"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertImageSchema = createInsertSchema(images).omit({ id: true, createdAt: true });
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

export const jobStatusEnum = ["pending", "running", "success", "failed", "retrying"] as const;
export type JobStatus = typeof jobStatusEnum[number];

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stage: text("stage"),
  status: text("status").default("pending"),
  payload: jsonb("payload"),
  output: jsonb("output"),
  errorMessage: text("error_message"),
  webhookUrl: text("webhook_url"),
  duration: integer("duration"),
  retryCount: integer("retry_count").default(0),
  relatedRecordId: text("related_record_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  campaignId: integer("campaign_id"),
  hypothesis: text("hypothesis"),
  primaryMetric: text("primary_metric"),
  status: text("status").default("draft"),
  variantAId: integer("variant_a_id"),
  variantBId: integer("variant_b_id"),
  variantCId: integer("variant_c_id"),
  variantAName: text("variant_a_name"),
  variantBName: text("variant_b_name"),
  variantCName: text("variant_c_name"),
  variantAResult: jsonb("variant_a_result"),
  variantBResult: jsonb("variant_b_result"),
  variantCResult: jsonb("variant_c_result"),
  winnerId: integer("winner_id"),
  winnerVariant: text("winner_variant"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertExperimentSchema = createInsertSchema(experiments).omit({ id: true, createdAt: true });
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type Experiment = typeof experiments.$inferSelect;

export const performanceNotes = pgTable("performance_notes", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  value: real("value"),
  period: text("period"),
  notes: text("notes"),
  source: text("source").default("manual"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPerformanceNoteSchema = createInsertSchema(performanceNotes).omit({ id: true, createdAt: true });
export type InsertPerformanceNote = z.infer<typeof insertPerformanceNoteSchema>;
export type PerformanceNote = typeof performanceNotes.$inferSelect;

export const candidateStatusEnum = ["evaluating", "approved", "rejected", "testing"] as const;
export type CandidateStatus = typeof candidateStatusEnum[number];

export const productCandidates = pgTable("product_candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sourceUrl: text("source_url"),
  category: text("category"),
  supplierCost: real("supplier_cost"),
  sellingPrice: real("selling_price"),
  margin: real("margin"),
  notes: text("notes"),
  status: text("status").default("evaluating"),
  scoreViralTraction: integer("score_viral_traction").default(0),
  scoreSolvesRealProblem: integer("score_solves_real_problem").default(0),
  scoreUniqueness: integer("score_uniqueness").default(0),
  scoreCompetitorBenchmark: integer("score_competitor_benchmark").default(0),
  scoreHighDemand: integer("score_high_demand").default(0),
  scoreTiktokTrend: integer("score_tiktok_trend").default(0),
  scoreAdMetrics: integer("score_ad_metrics").default(0),
  scoreContentAvailability: integer("score_content_availability").default(0),
  scoreSupplierSpeed: integer("score_supplier_speed").default(0),
  totalScore: integer("total_score").default(0),
  isViral: boolean("is_viral").default(false),
  solvesProblem: boolean("solves_problem").default(false),
  notSaturated: boolean("not_saturated").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertProductCandidateSchema = createInsertSchema(productCandidates).omit({ id: true, createdAt: true });
export type InsertProductCandidate = z.infer<typeof insertProductCandidateSchema>;
export type ProductCandidate = typeof productCandidates.$inferSelect;

export const competitorIntel = pgTable("competitor_intel", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  competitorName: text("competitor_name"),
  competitorUrl: text("competitor_url"),
  adCount: integer("ad_count"),
  monthlyTraffic: text("monthly_traffic"),
  weaknesses: text("weaknesses"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCompetitorIntelSchema = createInsertSchema(competitorIntel).omit({ id: true, createdAt: true });
export type InsertCompetitorIntel = z.infer<typeof insertCompetitorIntelSchema>;
export type CompetitorIntel = typeof competitorIntel.$inferSelect;

export const platformEnum = ["kalodata", "instagram", "reddit", "x"] as const;
export type Platform = typeof platformEnum[number];

export const trendItems = pgTable("trend_items", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  notes: text("notes"),
  pinned: boolean("pinned").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertTrendItemSchema = createInsertSchema(trendItems).omit({ id: true, createdAt: true });
export type InsertTrendItem = z.infer<typeof insertTrendItemSchema>;
export type TrendItem = typeof trendItems.$inferSelect;

export const WINNING_CRITERIA_KEYS = [
  "solves_painful_problem",
  "new_unique_solution",
  "competitor_running_ads",
  "high_traffic_or_amazon",
  "high_profit_margins",
  "potential_for_upsells",
  "easy_to_ship",
  "room_for_improvement",
] as const;
export type WinningCriterionKey = typeof WINNING_CRITERIA_KEYS[number];

export const productCriteriaChecks = pgTable("product_criteria_checks", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  criterionKey: text("criterion_key").notNull(),
  checked: boolean("checked").default(false),
  comment: text("comment"),
});

export const insertProductCriteriaCheckSchema = createInsertSchema(productCriteriaChecks).omit({ id: true });
export type InsertProductCriteriaCheck = z.infer<typeof insertProductCriteriaCheckSchema>;
export type ProductCriteriaCheck = typeof productCriteriaChecks.$inferSelect;

export const uploadedMedia = pgTable("uploaded_media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUploadedMediaSchema = createInsertSchema(uploadedMedia).omit({ id: true, uploadedAt: true });
export type InsertUploadedMedia = z.infer<typeof insertUploadedMediaSchema>;
export type UploadedMedia = typeof uploadedMedia.$inferSelect;

export * from "./models/chat";
