import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real, jsonb, numeric, date } from "drizzle-orm/pg-core";
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

  // --- Legacy scoring (v1, max 90) — kept for backwards compat ---
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

  // --- Enhanced scoring (v2, max 100) — 16 sub-scores across 5 categories ---
  scoringVersion: integer("scoring_version").default(1),

  // Category 1: Pain Intensity (25 pts max)
  painFrequency: integer("pain_frequency").default(0),              // 0-8: Reddit complaint posts/month
  emotionalIntensity: integer("emotional_intensity").default(0),    // 0-7: Avg sentiment negativity
  amazonPainDensity: integer("amazon_pain_density").default(0),     // 0-5: % of 1-2 star with unresolved problems
  searchDemandProblem: integer("search_demand_problem").default(0), // 0-5: Keyword volume for problem terms

  // Category 2: Market Proof (25 pts max)
  competitorAdActivity: integer("competitor_ad_activity").default(0),  // 0-8: Active Meta ads count
  trafficValidation: integer("traffic_validation").default(0),        // 0-7: SimilarWeb visits or Amazon BSR
  amazonReviewVolume: integer("amazon_review_volume").default(0),     // 0-5: Total reviews on top 3 listings
  trendMomentum: integer("trend_momentum").default(0),                // 0-5: KaLoData/TikTok acceleration

  // Category 3: Economics & Logistics (20 pts max)
  profitMarginScore: integer("profit_margin_score").default(0),       // 0-7: Unit profit tier
  shippingFeasibility: integer("shipping_feasibility").default(0),    // 0-5: Weight/fragility
  upsellPotential: integer("upsell_potential").default(0),            // 0-4: Cross-sell opportunities
  aovExpansionPotential: integer("aov_expansion_potential").default(0), // 0-4: Subscription/tier potential

  // Category 4: Competitive Moat (15 pts max)
  uniquenessFactor: integer("uniqueness_factor").default(0),            // 0-5: Differentiation level
  improvementOpportunity: integer("improvement_opportunity").default(0), // 0-5: Gaps from competitor reviews
  brandabilityScore: integer("brandability_score").default(0),          // 0-5: Brand/story potential

  // Category 5: Content & Creative (15 pts max)
  ugcContentAvailability: integer("ugc_content_availability").default(0),    // 0-5: Existing UGC
  demonstrabilityScore: integer("demonstrability_score").default(0),         // 0-5: Visual demo appeal
  consumerLanguageRichness: integer("consumer_language_richness").default(0), // 0-5: Emotional language density

  // Category subtotals (computed)
  painIntensityTotal: integer("pain_intensity_total").default(0),
  marketProofTotal: integer("market_proof_total").default(0),
  economicsTotal: integer("economics_total").default(0),
  competitiveMoatTotal: integer("competitive_moat_total").default(0),
  contentPotentialTotal: integer("content_potential_total").default(0),

  // Decision outputs
  decision: text("decision"),          // APPROVE | TEST | WATCHLIST | REJECT
  big3Pass: boolean("big3_pass").default(false),
  primaryAngle: text("primary_angle"), // AI-generated 1-sentence emotional hook
  aiReasoning: text("ai_reasoning"),   // AI-generated 2-sentence assessment
  scoreBreakdown: jsonb("score_breakdown"),   // Full component breakdown
  hardGateResults: jsonb("hard_gate_results"), // Pass/fail for each of 8 gates

  // Raw data per source (jsonb for flexibility)
  kalodataData: jsonb("kalodata_data"),     // revenue7d/30d/90d, orders, growth, AOV, launchAgeDays
  metaAdsData: jsonb("meta_ads_data"),      // activeAdsTotal, advertisersCount, hasNewCreatives14d
  amazonData: jsonb("amazon_data"),         // monthlyUnits, rating, reviewCount
  similarwebData: jsonb("similarweb_data"), // monthlyVisits, topCountries, channels
  economicsData: jsonb("economics_data"),   // unitProfit, grossMarginPct, price, cogs, shippingCost
  manualScores: jsonb("manual_scores"),     // painTotal20, mechanismUniqueness5, etc.

  lastScoredAt: timestamp("last_scored_at"),
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
  sourceActorId: text("source_actor_id"),   // Apify actor that found this competitor
  rawRunId: integer("raw_run_id"),          // FK to scrapeRuns
  aiSentimentScore: real("ai_sentiment_score"), // Vertex AI sentiment analysis
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
  sourceActorId: text("source_actor_id"),   // Apify actor that found this trend
  rawRunId: integer("raw_run_id"),          // FK to scrapeRuns
  trendVelocity: real("trend_velocity"),    // Rate of growth (derived metric)
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

// ============================================================
// SCRAPE INFRASTRUCTURE TABLES
// ============================================================

export const scrapeSources = pgTable("scrape_sources", {
  id: serial("id").primaryKey(),
  actorId: text("actor_id").notNull(),          // Apify actor ID (e.g., "JJghSZmShuco4j9gJ")
  name: text("name").notNull(),                  // Human-readable name
  platform: text("platform"),                    // "meta" | "tiktok" | "instagram" | "amazon" | "reddit" | "aliexpress" | "similarweb" | "youtube" | "shopify"
  category: text("category"),                    // "social" | "ecommerce" | "research" | "automation" | "custom"
  defaultInput: jsonb("default_input"),          // Default input config for this actor
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertScrapeSourceSchema = createInsertSchema(scrapeSources).omit({ id: true, createdAt: true });
export type InsertScrapeSource = z.infer<typeof insertScrapeSourceSchema>;
export type ScrapeSource = typeof scrapeSources.$inferSelect;

export const scrapeRunStatusEnum = ["pending", "running", "complete", "failed"] as const;
export type ScrapeRunStatus = typeof scrapeRunStatusEnum[number];

export const scrapeRuns = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),      // FK to scrapeSources
  candidateId: integer("candidate_id"),           // FK to productCandidates (nullable)
  status: text("status").default("pending"),
  apifyRunId: text("apify_run_id"),
  itemsCount: integer("items_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertScrapeRunSchema = createInsertSchema(scrapeRuns).omit({ id: true, createdAt: true });
export type InsertScrapeRun = z.infer<typeof insertScrapeRunSchema>;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;

export const rawScrapeData = pgTable("raw_scrape_data", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull(),            // FK to scrapeRuns
  sourceId: integer("source_id").notNull(),      // FK to scrapeSources
  platform: text("platform"),
  rawJson: jsonb("raw_json").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertRawScrapeDataSchema = createInsertSchema(rawScrapeData).omit({ id: true, createdAt: true });
export type InsertRawScrapeData = z.infer<typeof insertRawScrapeDataSchema>;
export type RawScrapeData = typeof rawScrapeData.$inferSelect;

export const filteredInsights = pgTable("filtered_insights", {
  id: serial("id").primaryKey(),
  rawDataId: integer("raw_data_id"),             // FK to rawScrapeData
  candidateId: integer("candidate_id"),           // FK to productCandidates
  insightType: text("insight_type"),             // "trend" | "competitor" | "pain_point" | "ad_creative"
  platform: text("platform"),
  sentimentScore: real("sentiment_score"),
  tags: text("tags").array(),
  summary: text("summary"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertFilteredInsightSchema = createInsertSchema(filteredInsights).omit({ id: true, createdAt: true });
export type InsertFilteredInsight = z.infer<typeof insertFilteredInsightSchema>;
export type FilteredInsight = typeof filteredInsights.$inferSelect;

export const weeklyRollups = pgTable("weekly_rollups", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id"),                // FK to scrapeSources
  weekStart: date("week_start").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: real("metric_value"),
  comparisonPct: real("comparison_pct"),          // vs previous week
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertWeeklyRollupSchema = createInsertSchema(weeklyRollups).omit({ id: true, createdAt: true });
export type InsertWeeklyRollup = z.infer<typeof insertWeeklyRollupSchema>;
export type WeeklyRollup = typeof weeklyRollups.$inferSelect;

// ============================================================
// CONSUMER INTELLIGENCE TABLES
// ============================================================

export const nichePainPoints = pgTable("niche_pain_points", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  source: text("source").notNull(),              // "reddit" | "amazon" | "tiktok" | "manual"
  sourceUrl: text("source_url"),
  subreddit: text("subreddit"),                  // e.g., "r/carpalTunnel"

  // Core pain point data
  painPointText: text("pain_point_text").notNull(),
  rawQuote: text("raw_quote"),                   // Exact consumer language (verbatim)
  frequency: integer("frequency").default(1),

  // Psychology classification
  painCategory: text("pain_category"),           // "physical" | "emotional" | "financial" | "social" | "functional"
  motivationType: text("motivation_type"),        // "pain_avoidance" | "gain_seeking"
  emotionalIntensity: integer("emotional_intensity").default(0), // 1-10
  urgencyLevel: text("urgency_level"),           // "chronic" | "acute" | "seasonal" | "situational"

  // Cialdini triggers
  triggerTypes: text("trigger_types").array(),    // ["fear", "frustration", "hope", "desire", "shame", "anger"]
  adAngleRelevance: text("ad_angle_relevance").array(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertNichePainPointSchema = createInsertSchema(nichePainPoints).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNichePainPoint = z.infer<typeof insertNichePainPointSchema>;
export type NichePainPoint = typeof nichePainPoints.$inferSelect;

export const consumerPhrases = pgTable("consumer_phrases", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  painPointId: integer("pain_point_id"),         // FK to nichePainPoints (optional)
  source: text("source").notNull(),              // "reddit" | "amazon" | "tiktok"
  sourceUrl: text("source_url"),

  // The phrase itself
  phrase: text("phrase").notNull(),
  context: text("context"),                      // Surrounding context
  frequency: integer("frequency").default(1),

  // Classification
  phraseType: text("phrase_type").notNull(),
  // "complaint" | "desire" | "objection" | "comparison" | "praise" | "question" | "frustration_expression"

  emotionalValence: text("emotional_valence"),   // "negative" | "neutral" | "positive"
  emotionalIntensity: integer("emotional_intensity").default(0), // 1-10

  // Creative utility tags
  useableAs: text("useable_as").array(),
  // ["hook", "headline", "testimonial_voice", "objection_crusher", "before_state", "after_state"]

  // Cluster assignment
  clusterLabel: text("cluster_label"),
  clusterId: integer("cluster_id"),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertConsumerPhraseSchema = createInsertSchema(consumerPhrases).omit({ id: true, createdAt: true });
export type InsertConsumerPhrase = z.infer<typeof insertConsumerPhraseSchema>;
export type ConsumerPhrase = typeof consumerPhrases.$inferSelect;

export const competitorMessaging = pgTable("competitor_messaging", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  competitorIntelId: integer("competitor_intel_id"), // FK to competitorIntel
  source: text("source").notNull(),              // "meta_ad" | "landing_page" | "amazon_listing" | "tiktok_ad"
  sourceUrl: text("source_url"),

  // Messaging analysis
  headline: text("headline"),
  primaryClaim: text("primary_claim"),
  proofMechanism: text("proof_mechanism"),
  ctaText: text("cta_text"),

  // Angle classification
  messagingAngle: text("messaging_angle"),
  // "pain_based" | "solution_based" | "identity_based" | "social_proof" | "anti_alternative" | "scarcity" | "authority"

  awarenessLevel: text("awareness_level"),
  // "unaware" | "problem_aware" | "solution_aware" | "product_aware" | "most_aware"

  // Effectiveness signals
  adRunDuration: integer("ad_run_duration"),      // Days the ad has been running
  estimatedReach: text("estimated_reach"),        // "low" | "medium" | "high"

  // Gaps and opportunities
  weaknessIdentified: text("weakness_identified"),
  gapOpportunity: text("gap_opportunity"),

  analysisJson: jsonb("analysis_json"),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCompetitorMessagingSchema = createInsertSchema(competitorMessaging).omit({ id: true, createdAt: true });
export type InsertCompetitorMessaging = z.infer<typeof insertCompetitorMessagingSchema>;
export type CompetitorMessaging = typeof competitorMessaging.$inferSelect;

export const creativeOutputTypeEnum = [
  "tagline", "hook", "sound_byte", "pas_framework",
  "before_after", "objection_crusher", "mirror_phrase",
] as const;
export type CreativeOutputType = typeof creativeOutputTypeEnum[number];

export const persuasionPrincipleEnum = [
  "reciprocity", "scarcity", "authority", "consistency", "liking", "consensus",
] as const;
export type PersuasionPrinciple = typeof persuasionPrincipleEnum[number];

export const creativeOutputs = pgTable("creative_outputs", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  batchId: text("batch_id"),

  // Output type and content
  outputType: text("output_type").notNull(),     // See creativeOutputTypeEnum
  content: text("content").notNull(),
  contentStructured: jsonb("content_structured"), // { problem, agitate, solve } or { before, after }

  // Provenance — what intelligence produced this?
  sourcePainPointIds: integer("source_pain_point_ids").array(),
  sourcePhraseIds: integer("source_phrase_ids").array(),
  sourceCompetitorIds: integer("source_competitor_ids").array(),

  // Psychology metadata
  targetEmotion: text("target_emotion"),
  persuasionPrinciple: text("persuasion_principle"), // See persuasionPrincipleEnum
  awarenessLevel: text("awareness_level"),
  targetSegment: text("target_segment"),

  // Quality and usage tracking
  qualityScore: integer("quality_score"),         // AI self-assessment 1-10
  isApproved: boolean("is_approved").default(false),
  usedInAdId: integer("used_in_ad_id"),           // FK to ads table

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCreativeOutputSchema = createInsertSchema(creativeOutputs).omit({ id: true, createdAt: true });
export type InsertCreativeOutput = z.infer<typeof insertCreativeOutputSchema>;
export type CreativeOutput = typeof creativeOutputs.$inferSelect;

export const consumerIntelJobTypeEnum = [
  "reddit_scrape", "amazon_scrape", "pain_analysis", "phrase_extraction",
  "competitor_analysis", "creative_generation", "scoring_update",
] as const;
export type ConsumerIntelJobType = typeof consumerIntelJobTypeEnum[number];

export const consumerIntelJobs = pgTable("consumer_intel_jobs", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  jobType: text("job_type").notNull(),           // See consumerIntelJobTypeEnum
  status: text("status").default("pending"),     // "pending" | "running" | "completed" | "failed" | "retrying"
  config: jsonb("config"),                       // Job-specific configuration
  result: jsonb("result"),                       // Job output summary
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertConsumerIntelJobSchema = createInsertSchema(consumerIntelJobs).omit({ id: true, createdAt: true });
export type InsertConsumerIntelJob = z.infer<typeof insertConsumerIntelJobSchema>;
export type ConsumerIntelJob = typeof consumerIntelJobs.$inferSelect;

// ============================================================
// AD VAULT TABLES (Meta Ad Library Monitor)
// ============================================================

export const adVaultBrands = pgTable("ad_vault_brands", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  websiteUrl: text("website_url"),
  fbPageUrl: text("fb_page_url").notNull(),
  pageId: text("page_id"),
  vertical: text("vertical"),
  status: text("status").default("active"),       // "active" | "paused" | "archived"
  lastScraped: timestamp("last_scraped"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAdVaultBrandSchema = createInsertSchema(adVaultBrands).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdVaultBrand = z.infer<typeof insertAdVaultBrandSchema>;
export type AdVaultBrand = typeof adVaultBrands.$inferSelect;

export const adVault = pgTable("ad_vault", {
  id: serial("id").primaryKey(),
  adId: text("ad_id").notNull().unique(),          // Facebook adArchiveID
  brandId: integer("brand_id").notNull(),           // FK to adVaultBrands
  dateScraped: date("date_scraped"),
  rank: integer("rank"),
  creativeType: text("creative_type"),              // "image" | "video"
  creativeUrl: text("creative_url"),                // Thumbnail/image URL
  storedCreativeUrl: text("stored_creative_url"),   // Locally saved copy
  videoUrl: text("video_url"),                      // Actual video URL
  adCopy: text("ad_copy"),
  headline: text("headline"),
  ctaType: text("cta_type"),
  startDate: date("start_date"),
  adLibraryLink: text("ad_library_link"),

  // AI Analysis (5-tag taxonomy)
  aiAssetType: text("ai_asset_type"),              // UGC, High Production, Static Image, Animation, etc.
  aiVisualFormat: text("ai_visual_format"),         // Talking Head, Product Demo, Unboxing, Before/After, etc.
  aiMessagingAngle: text("ai_messaging_angle"),     // Problem/Solution, Social Proof, FOMO, etc.
  aiHookTactic: text("ai_hook_tactic"),            // Pattern Interrupt, Question, Bold Claim, etc.
  aiOfferType: text("ai_offer_type"),              // Percentage Off, Free Shipping, BOGO, etc.
  aiRawResponse: jsonb("ai_raw_response"),

  // Legacy AI fields
  aiFormat: text("ai_format"),
  aiHook: text("ai_hook"),
  aiVisualStyle: text("ai_visual_style"),
  aiAngle: text("ai_angle"),

  // Tracking
  firstSeen: date("first_seen"),
  lastSeen: date("last_seen"),
  weeksInTop10: integer("weeks_in_top10").default(1),
  bookmarked: boolean("bookmarked").default(false),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAdVaultSchema = createInsertSchema(adVault).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdVault = z.infer<typeof insertAdVaultSchema>;
export type AdVaultAd = typeof adVault.$inferSelect;

export const adVaultScrapeJobs = pgTable("ad_vault_scrape_jobs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(),              // "ad_scrape" | "batch_analyze"
  brandId: integer("brand_id"),                     // FK to adVaultBrands
  status: text("status").default("pending"),        // "pending" | "running" | "complete" | "error"
  apifyRunId: text("apify_run_id"),
  inputParams: jsonb("input_params"),
  results: jsonb("results"),
  resultCount: integer("result_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: timestamp("completed_at"),
});

export const insertAdVaultScrapeJobSchema = createInsertSchema(adVaultScrapeJobs).omit({ id: true, createdAt: true });
export type InsertAdVaultScrapeJob = z.infer<typeof insertAdVaultScrapeJobSchema>;
export type AdVaultScrapeJob = typeof adVaultScrapeJobs.$inferSelect;

export const adVaultSnapshots = pgTable("ad_vault_snapshots", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull(),           // FK to adVaultBrands
  adId: text("ad_id").notNull(),                    // References adVault.adId
  weekStart: date("week_start").notNull(),
  rank: integer("rank"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAdVaultSnapshotSchema = createInsertSchema(adVaultSnapshots).omit({ id: true, createdAt: true });
export type InsertAdVaultSnapshot = z.infer<typeof insertAdVaultSnapshotSchema>;
export type AdVaultSnapshot = typeof adVaultSnapshots.$inferSelect;

// ============================================================
// TRANSCRIPT PRODUCT EXTRACTION TABLES
// ============================================================

export const transcriptProducts = pgTable("transcript_products", {
  id: serial("id").primaryKey(),
  docId: text("doc_id").notNull().unique(),               // Google Doc ID — unique constraint for dedup
  docTitle: text("doc_title").notNull(),
  docUrl: text("doc_url"),
  productName: text("product_name").notNull(),
  mentionContext: text("mention_context"),                  // Quote from transcript where product was discussed
  extractionConfidence: real("extraction_confidence"),      // 0-1 confidence score from Gemini
  assessment: text("assessment").default("watch"),          // "investigate" | "skip" | "watch"
  reasoning: text("reasoning"),                            // AI explanation for assessment
  candidateId: integer("candidate_id"),                     // FK to productCandidates — set when promoted
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertTranscriptProductSchema = createInsertSchema(transcriptProducts).omit({ id: true, createdAt: true });
export type InsertTranscriptProduct = z.infer<typeof insertTranscriptProductSchema>;
export type TranscriptProduct = typeof transcriptProducts.$inferSelect;

// ============================================================
// GATE VALIDATION PIPELINE TABLES
// ============================================================

export const gateResults = pgTable("gate_results", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),          // FK to productCandidates
  gateName: text("gate_name").notNull(),                   // "kalodata" | "amazon" | "aliexpress" | "meta_ads"
  gateOrder: integer("gate_order").notNull(),              // 1-4
  passed: boolean("passed"),                               // null = not run, true = passed, false = failed
  rawData: jsonb("raw_data"),                              // Full scraper response
  criteriaChecked: jsonb("criteria_checked"),               // { criterion: value, threshold: value, passed: bool }[]
  errorMessage: text("error_message"),
  runId: integer("run_id"),                                // FK to scrapeRuns (optional)
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertGateResultSchema = createInsertSchema(gateResults).omit({ id: true, createdAt: true });
export type InsertGateResult = z.infer<typeof insertGateResultSchema>;
export type GateResult = typeof gateResults.$inferSelect;

export * from "./models/chat";
