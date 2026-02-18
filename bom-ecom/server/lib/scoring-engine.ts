/**
 * Deterministic 100-point Product Scoring Engine
 *
 * 3-stage pipeline:
 *   Stage A: Candidate Filter (KaLoData 7d metrics)
 *   Stage B: Hard Gates (8 pass/fail checks)
 *   Stage C: 100-point Score (16 sub-scores across 5 categories)
 *
 * Decision bands: 80-100=APPROVE, 65-79=TEST, 50-64=WATCHLIST, <50=REJECT
 * Big-3 override: Even if score≥80, reject if Pain<14/25 OR Proof<15/25 OR Economics<10/20
 */

import scoringConfig from "./scoring-config.json";

// ─── Types ───────────────────────────────────────────────────

type GateOp = "gte" | "lte" | "eq" | "in" | "between";
type MissingAction = "needs_enrichment" | "reject";

interface GateRule {
  id: string;
  field: string;
  op: GateOp;
  value: any;
  missingAction: MissingAction;
  failAction: string;
  message: string;
}

type ScoreMethod = "linear" | "step" | "bool" | "manual";

interface StepRule {
  gte?: number;
  lte?: number;
  points: number;
}

interface ScoreComponent {
  id: string;
  label: string;
  maxPoints: number;
  method: ScoreMethod;
  field: string;
  min?: number;
  max?: number;
  steps?: StepRule[];
}

interface ScoringConfig {
  version: string;
  marketsAllowed: string[];
  exclusions: { categories: string[]; flags: string[] };
  stages: {
    candidate: {
      requiredFields: string[];
      kalodataFilters: {
        launchAgeDaysMax: number;
        revenue7dMin: number;
        orders7dMin: number;
        growthRev7dPctMin: number;
        aovMin: number;
        aovMax: number;
      };
    };
    approved: {
      hardGates: GateRule[];
    };
  };
  scoring: {
    decisionThresholds: { approveMin: number; testMin: number; watchMin: number };
    big3: { painMin: number; painMax: number; proofMin: number; proofMax: number; economicsMin: number; economicsMax: number };
    components: ScoreComponent[];
    categories: Record<string, { label: string; maxPoints: number; componentIds: string[] }>;
  };
}

export type Decision = "APPROVE" | "TEST" | "WATCHLIST" | "REJECT";

export interface ScoreBreakdownItem {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  missing: boolean;
}

export interface CategoryScore {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
}

export interface ScoringResult {
  score: number;
  decision: Decision;
  big3Pass: boolean;
  categoryScores: CategoryScore[];
  breakdown: ScoreBreakdownItem[];
  missing: string[];
}

export interface GateResult {
  status: "PASS" | "REJECT" | "NEEDS_ENRICHMENT";
  failures: string[];
  missing: string[];
  details: Array<{ id: string; pass: boolean; missing: boolean; message: string }>;
}

export interface CandidateFilterResult {
  pass: boolean;
  status: "PASS" | "REJECT" | "NEEDS_ENRICHMENT";
  missing: string[];
  reasons: string[];
  derived?: { aov: number };
}

export interface FullEvaluationResult {
  stage: "candidate" | "gates" | "scored";
  candidateFilter?: CandidateFilterResult;
  gateResult?: GateResult;
  scoring?: ScoringResult;
  decision: Decision | "NEEDS_ENRICHMENT";
  reasons: string[];
}

// ─── Helpers ─────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isNumber(x: any): x is number {
  return typeof x === "number" && !Number.isNaN(x);
}

function toBool(v: any): boolean {
  if (v === true || v === "true" || v === 1) return true;
  return false;
}

// ─── Candidate Filter ────────────────────────────────────────

export function passesCandidateFilters(product: any, cfg: ScoringConfig = scoringConfig as ScoringConfig): CandidateFilterResult {
  const k = product?.kalodata;
  const f = cfg.stages.candidate.kalodataFilters;

  // Check required fields
  const missing: string[] = [];
  for (const field of cfg.stages.candidate.requiredFields) {
    if (getPath(product, field) == null) missing.push(field);
  }
  if (missing.length) {
    return { pass: false, status: "NEEDS_ENRICHMENT", missing, reasons: ["Missing required KaLoData fields."] };
  }

  // Check exclusion list
  const productCategory = (product?.category || "").toLowerCase();
  if (cfg.exclusions.categories.some(c => productCategory.includes(c))) {
    return { pass: false, status: "REJECT", missing: [], reasons: [`Category "${productCategory}" is in the exclusion list.`] };
  }

  const revenue7d = Number(k.revenue7d);
  const orders7d = Number(k.orders7d);
  const growth7d = Number(k.growthRev7dPct);
  const ageDays = Number(k.launchAgeDays);
  const aov = orders7d > 0 ? revenue7d / orders7d : 0;

  const reasons: string[] = [];
  if (ageDays > f.launchAgeDaysMax) reasons.push(`Too old for candidate pull (ageDays=${ageDays}).`);
  if (revenue7d < f.revenue7dMin) reasons.push(`Low 7d revenue (${revenue7d}).`);
  if (orders7d < f.orders7dMin) reasons.push(`Low 7d orders (${orders7d}).`);
  if (growth7d < f.growthRev7dPctMin) reasons.push(`Low 7d growth (${growth7d}%).`);
  if (aov < f.aovMin || aov > f.aovMax) reasons.push(`AOV out of band ($${aov.toFixed(2)}).`);

  const pass = reasons.length === 0;
  return { pass, status: pass ? "PASS" : "REJECT", missing: [], reasons, derived: { aov } };
}

// ─── Hard Gates ──────────────────────────────────────────────

function evalGate(product: any, rule: GateRule): { pass: boolean; missing: boolean; message: string } {
  const v = getPath(product, rule.field);

  if (v == null) {
    return { pass: false, missing: true, message: rule.message };
  }

  switch (rule.op) {
    case "gte":
      return { pass: Number(v) >= Number(rule.value), missing: false, message: rule.message };
    case "lte":
      return { pass: Number(v) <= Number(rule.value), missing: false, message: rule.message };
    case "eq":
      return { pass: toBool(v) === toBool(rule.value), missing: false, message: rule.message };
    case "in":
      return { pass: Array.isArray(rule.value) && rule.value.includes(v), missing: false, message: rule.message };
    case "between": {
      const [min, max] = rule.value as [number, number];
      return { pass: Number(v) >= min && Number(v) <= max, missing: false, message: rule.message };
    }
    default:
      return { pass: false, missing: false, message: `Unsupported op: ${rule.op}` };
  }
}

export function evaluateHardGates(product: any, cfg: ScoringConfig = scoringConfig as ScoringConfig): GateResult {
  const failures: string[] = [];
  const missing: string[] = [];
  const details: GateResult["details"] = [];

  for (const rule of cfg.stages.approved.hardGates) {
    const res = evalGate(product, rule);
    details.push({ id: rule.id, pass: res.pass, missing: res.missing, message: res.message });

    if (!res.pass) {
      if (res.missing) {
        missing.push(rule.field);
      } else {
        failures.push(res.message);
      }
    }
  }

  if (failures.length) return { status: "REJECT", failures, missing, details };
  if (missing.length) return { status: "NEEDS_ENRICHMENT", failures: [], missing, details };
  return { status: "PASS", failures: [], missing: [], details };
}

// ─── Scoring ─────────────────────────────────────────────────

function scoreComponent(product: any, c: ScoreComponent): ScoreBreakdownItem {
  const raw = getPath(product, c.field);

  if (raw == null) {
    return { id: c.id, label: c.label, points: 0, maxPoints: c.maxPoints, missing: true };
  }

  if (c.method === "manual" || c.method === "linear") {
    const v = Number(raw);
    if (!isNumber(v)) return { id: c.id, label: c.label, points: 0, maxPoints: c.maxPoints, missing: false };

    if (c.min != null && c.max != null && c.max > c.min) {
      const norm = clamp((v - c.min) / (c.max - c.min), 0, 1);
      const pts = Math.round(norm * c.maxPoints);
      return { id: c.id, label: c.label, points: pts, maxPoints: c.maxPoints, missing: false };
    }

    const pts = clamp(Math.round(v), 0, c.maxPoints);
    return { id: c.id, label: c.label, points: pts, maxPoints: c.maxPoints, missing: false };
  }

  if (c.method === "bool") {
    const pts = toBool(raw) ? c.maxPoints : 0;
    return { id: c.id, label: c.label, points: pts, maxPoints: c.maxPoints, missing: false };
  }

  if (c.method === "step") {
    const v = Number(raw);
    if (!isNumber(v) || !c.steps?.length) {
      return { id: c.id, label: c.label, points: 0, maxPoints: c.maxPoints, missing: false };
    }

    let best = 0;
    for (const s of c.steps) {
      const okGte = s.gte == null ? true : v >= s.gte;
      const okLte = s.lte == null ? true : v <= s.lte;
      if (okGte && okLte) best = Math.max(best, s.points);
    }

    const pts = clamp(best, 0, c.maxPoints);
    return { id: c.id, label: c.label, points: pts, maxPoints: c.maxPoints, missing: false };
  }

  return { id: c.id, label: c.label, points: 0, maxPoints: c.maxPoints, missing: false };
}

export function scoreProduct(product: any, cfg: ScoringConfig = scoringConfig as ScoringConfig): ScoringResult {
  const breakdown = cfg.scoring.components.map((c) => scoreComponent(product, c));
  const missing = breakdown.filter((b) => b.missing).map((b) => b.id);

  const scoreRaw = breakdown.reduce((sum, b) => sum + b.points, 0);
  const score = clamp(Math.round(scoreRaw), 0, 100);

  // Compute category scores
  const categoryScores: CategoryScore[] = Object.entries(cfg.scoring.categories).map(([key, cat]) => {
    const catBreakdown = breakdown.filter(b => cat.componentIds.includes(b.id));
    const points = catBreakdown.reduce((sum, b) => sum + b.points, 0);
    return { key, label: cat.label, points: Math.round(points), maxPoints: cat.maxPoints };
  });

  // Big-3 check
  const painScore = categoryScores.find(c => c.key === "painIntensity")?.points ?? 0;
  const proofScore = categoryScores.find(c => c.key === "marketProof")?.points ?? 0;
  const economicsScore = categoryScores.find(c => c.key === "economics")?.points ?? 0;

  const big3Pass =
    painScore >= cfg.scoring.big3.painMin &&
    proofScore >= cfg.scoring.big3.proofMin &&
    economicsScore >= cfg.scoring.big3.economicsMin;

  // Decision with Big-3 override
  let decision: Decision = "REJECT";
  if (score >= cfg.scoring.decisionThresholds.approveMin && big3Pass) decision = "APPROVE";
  else if (score >= cfg.scoring.decisionThresholds.testMin) decision = "TEST";
  else if (score >= cfg.scoring.decisionThresholds.watchMin) decision = "WATCHLIST";

  return { score, decision, big3Pass, categoryScores, breakdown, missing };
}

// ─── Full Evaluation ─────────────────────────────────────────

export function evaluateProduct(product: any, cfg: ScoringConfig = scoringConfig as ScoringConfig): FullEvaluationResult {
  // Stage A: Candidate filter (only if KaLoData data exists)
  if (product?.kalodata) {
    const candidate = passesCandidateFilters(product, cfg);
    if (!candidate.pass) {
      return {
        stage: "candidate",
        candidateFilter: candidate,
        decision: candidate.status === "NEEDS_ENRICHMENT" ? "NEEDS_ENRICHMENT" : "REJECT",
        reasons: candidate.reasons,
      };
    }
  }

  // Stage B: Hard gates (only if enrichment data exists)
  const gates = evaluateHardGates(product, cfg);
  if (gates.status !== "PASS") {
    return {
      stage: "gates",
      gateResult: gates,
      decision: gates.status === "NEEDS_ENRICHMENT" ? "NEEDS_ENRICHMENT" : "REJECT",
      reasons: gates.failures,
    };
  }

  // Stage C: Score
  const scoring = scoreProduct(product, cfg);
  return {
    stage: "scored",
    gateResult: gates,
    scoring,
    decision: scoring.decision,
    reasons: scoring.missing.length > 0
      ? [`Missing data for: ${scoring.missing.join(", ")}`]
      : [],
  };
}

/**
 * Score a product candidate directly from its DB row (flat sub-scores).
 * This is the main entry point for scoring from routes.ts.
 */
export function scoreFromCandidateRow(row: Record<string, any>): ScoringResult {
  // The sub-scores are stored directly on the candidate row as flat fields
  // The scoring config references them by field name matching the column names
  return scoreProduct(row);
}

export { scoringConfig };
