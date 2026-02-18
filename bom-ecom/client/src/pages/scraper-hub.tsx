import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Filter,
  Hash,
  Activity,
  BarChart3,
  Target,
  Zap,
  Brain,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapeSource {
  id: number;
  actorId: string;
  name: string;
  platform: string | null;
  category: string | null;
  defaultInput: any;
  isActive: boolean;
  createdAt: string;
}

interface ScrapeRun {
  id: number;
  sourceId: number;
  candidateId: number | null;
  status: string;
  apifyRunId: string | null;
  itemsCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface InsightsSummary {
  totalScrapeSources: number;
  totalScrapeRuns: number;
  activeRuns: number;
  totalInsights: number;
  avgProductScore: number | null;
}

interface InsightsBreakdown {
  candidates: Array<{
    id: number;
    name: string;
    totalScore: number;
    decision: string;
    painIntensityTotal: number;
    marketProofTotal: number;
    economicsTotal: number;
    competitiveMoatTotal: number;
    contentPotentialTotal: number;
  }>;
  decisionBands: { APPROVE: number; TEST: number; WATCHLIST: number; REJECT: number };
}

interface InsightsCompetitors {
  angleDistribution: Record<string, number>;
  awarenessDistribution: Record<string, number>;
  gaps: Array<{ candidateId: number; gap: string; weakness: string }>;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "social", "ecommerce", "research", "automation", "custom"] as const;

const DECISION_COLORS: Record<string, string> = {
  APPROVE: "#22c55e",
  TEST: "#f59e0b",
  WATCHLIST: "#64748b",
  REJECT: "#ef4444",
};

const DECISION_BADGE_CLASSES: Record<string, string> = {
  APPROVE: "bg-green-500/15 text-green-600 border-green-500/30",
  TEST: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  WATCHLIST: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  REJECT: "bg-red-500/15 text-red-600 border-red-500/30",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: 12,
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    pending: { variant: "outline", className: "border-yellow-500/50 text-yellow-500" },
    running: { variant: "outline", className: "border-blue-500/50 text-blue-500" },
    complete: { variant: "outline", className: "border-green-500/50 text-green-500" },
    failed: { variant: "destructive", className: "" },
  };
  const c = config[status] || { variant: "outline" as const, className: "" };
  return (
    <Badge variant={c.variant} className={`no-default-hover-elevate font-mono text-xs uppercase ${c.className}`}>
      {status}
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":  return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    case "running":  return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
    case "complete": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case "failed":   return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    default:         return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Source Card ──────────────────────────────────────────────────────────────

function SourceCard({
  source,
  candidateId,
  onRun,
  isRunning,
}: {
  source: ScrapeSource;
  candidateId: string;
  onRun: (sourceId: number) => void;
  isRunning: boolean;
}) {
  return (
    <Card className="hover-elevate" data-testid={`card-source-${source.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">{source.name}</h3>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{source.actorId}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {source.platform && (
              <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
                {source.platform}
              </Badge>
            )}
            <Badge
              variant={source.isActive ? "default" : "secondary"}
              className="no-default-hover-elevate font-mono text-xs"
            >
              {source.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {source.category && (
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground capitalize">{source.category}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => onRun(source.id)}
          disabled={isRunning || !source.isActive}
          data-testid={`button-run-source-${source.id}`}
        >
          <Play className="h-3 w-3 mr-1" />
          {isRunning ? "Running..." : "Run Scrape"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScraperHub() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [candidateId, setCandidateId] = useState<string>("");

  // Scraper queries
  const { data: sources, isLoading: sourcesLoading } = useQuery<ScrapeSource[]>({
    queryKey: ["/api/scrape-sources"],
  });
  const { data: runs, isLoading: runsLoading } = useQuery<ScrapeRun[]>({
    queryKey: ["/api/scrape-runs"],
  });

  // Signal / analytics queries
  const { data: summary, isLoading: summaryLoading } = useQuery<InsightsSummary>({
    queryKey: ["/api/insights/summary"],
  });
  const { data: breakdown, isLoading: breakdownLoading } = useQuery<InsightsBreakdown>({
    queryKey: ["/api/insights/breakdown"],
  });
  const { data: competitors, isLoading: competitorsLoading } = useQuery<InsightsCompetitors>({
    queryKey: ["/api/insights/competitors"],
  });

  const runMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      const body: Record<string, any> = {};
      if (candidateId.trim()) body.candidateId = parseInt(candidateId, 10);
      const res = await apiRequest("POST", `/api/scrape-sources/${sourceId}/run`, body);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scrape-runs"] });
      toast({ title: "Scrape triggered", description: "Run has been queued." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to trigger scrape", description: err.message, variant: "destructive" });
    },
  });

  // Derived
  const filteredSources = useMemo(() => {
    if (!sources) return [];
    if (categoryFilter === "All") return sources;
    return sources.filter((s) => s.category === categoryFilter);
  }, [sources, categoryFilter]);

  const decisionPieData = breakdown
    ? Object.entries(breakdown.decisionBands).map(([name, value]) => ({ name, value }))
    : [];

  const topCandidates = breakdown
    ? [...breakdown.candidates].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5)
    : [];

  const topCandidate = topCandidates[0] ?? null;
  const radarData = topCandidate
    ? [
        { category: "Pain Intensity",    value: topCandidate.painIntensityTotal,    max: 25 },
        { category: "Market Proof",       value: topCandidate.marketProofTotal,      max: 25 },
        { category: "Economics",          value: topCandidate.economicsTotal,        max: 20 },
        { category: "Competitive Moat",  value: topCandidate.competitiveMoatTotal,  max: 15 },
        { category: "Content & Creative", value: topCandidate.contentPotentialTotal, max: 15 },
      ]
    : [];

  const angleBarData = competitors
    ? Object.entries(competitors.angleDistribution).map(([name, count]) => ({ name, count }))
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-scraper-hub">
              Scraper Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage Apify actors, trigger scrapes, and monitor signal intelligence
            </p>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-cards-row">
            <KpiCard
              title="Scrape Sources"
              value={String(summary?.totalScrapeSources ?? 0)}
              icon={Activity}
              subtitle="total configured"
            />
            <KpiCard
              title="Active Runs"
              value={String(summary?.activeRuns ?? 0)}
              icon={Zap}
              subtitle="currently running"
            />
            <KpiCard
              title="Total Insights"
              value={String(summary?.totalInsights ?? 0)}
              icon={BarChart3}
              subtitle="signals collected"
            />
            <KpiCard
              title="Avg Product Score"
              value={summary?.avgProductScore != null ? summary.avgProductScore.toFixed(1) : "—"}
              icon={Target}
              subtitle="out of 100"
            />
          </div>
        )}

        {/* ── Charts row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Decision pie */}
          <Card data-testid="card-score-distribution">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Decision Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : decisionPieData.every((d) => d.value === 0) ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No candidates scored yet.</p>
              ) : (
                <>
                  <div className="h-52" data-testid="chart-decision-pie">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={decisionPieData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => value > 0 ? `${name} (${value})` : ""}
                        >
                          {decisionPieData.map((entry) => (
                            <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Candidates"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-1 flex-wrap">
                    {decisionPieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DECISION_COLORS[entry.name] ?? "#94a3b8" }} />
                        <span className="text-xs text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category radar */}
          <Card data-testid="card-category-radar">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">
                Score Breakdown
                {topCandidate && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({topCandidate.name})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : !topCandidate ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No candidate data available.</p>
              ) : (
                <div className="h-52" data-testid="chart-category-radar">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 25]} tick={{ fontSize: 9 }} tickCount={4} />
                      <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} / ${props.payload.max}`, props.payload.category,
                        ]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor angle bar */}
          <Card data-testid="card-competitor-intel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Competitor Angles</CardTitle>
            </CardHeader>
            <CardContent>
              {competitorsLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : !competitors || angleBarData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No competitor data yet.</p>
              ) : (
                <div className="h-52" data-testid="chart-angle-distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={angleBarData} layout="vertical" margin={{ left: 4, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Count"]} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Top Candidates ─────────────────────────────────────────────── */}
        <Card data-testid="card-top-candidates">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Top 5 Scored Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No candidates scored yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {topCandidates.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    data-testid={`candidate-row-${i}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-mono font-bold">{c.totalScore}/100</span>
                      <Badge variant="outline" className={DECISION_BADGE_CLASSES[c.decision] ?? ""}>
                        {c.decision}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Competitor Gaps ────────────────────────────────────────────── */}
        {competitors && competitors.gaps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Identified Gaps & Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {competitors.gaps.map((g, i) => (
                  <div key={i} className="rounded-md border px-3 py-2 text-sm" data-testid={`gap-row-${i}`}>
                    <span className="font-medium">{g.gap}</span>
                    <span className="text-muted-foreground ml-1">— {g.weakness}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Scrape Sources ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Scrape Sources</h2>
            </div>
            <div className="flex-1" />
            <Input
              placeholder="Candidate ID (optional)"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-[180px]"
              type="number"
              data-testid="input-candidate-id"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourcesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
            </div>
          )}

          {!sourcesLoading && filteredSources.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {sources && sources.length > 0
                    ? "No sources match this category filter."
                    : "No scrape sources registered yet."}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="sources-grid">
            {filteredSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                candidateId={candidateId}
                onRun={(id) => runMutation.mutate(id)}
                isRunning={runMutation.isPending && runMutation.variables === source.id}
              />
            ))}
          </div>
        </div>

        {/* ── Recent Runs ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Recent Runs</h2>
            {runs && (
              <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
                {runs.length}
              </Badge>
            )}
          </div>

          {runsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          )}

          {!runsLoading && (!runs || runs.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No scrape runs yet. Trigger a source above to get started.</p>
              </CardContent>
            </Card>
          )}

          {runs && runs.length > 0 && (
            <div className="space-y-2" data-testid="runs-list">
              {runs.map((run) => {
                const sourceName = sources?.find((s) => s.id === run.sourceId)?.name ?? `Source #${run.sourceId}`;
                return (
                  <Card key={run.id} data-testid={`card-run-${run.id}`}>
                    <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                      <StatusIcon status={run.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{sourceName}</span>
                          <StatusBadge status={run.status} />
                          {run.candidateId != null && (
                            <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
                              <Hash className="h-3 w-3 mr-0.5" />
                              Candidate {run.candidateId}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {run.itemsCount > 0 && <span>{run.itemsCount} items</span>}
                          {run.apifyRunId && (
                            <span className="font-mono truncate max-w-[160px]">{run.apifyRunId}</span>
                          )}
                          <span>Started {formatTimestamp(run.startedAt || run.createdAt)}</span>
                          {run.completedAt && <span>Done {formatTimestamp(run.completedAt)}</span>}
                        </div>
                        {run.errorMessage && (
                          <p className="text-xs text-destructive mt-1 truncate">{run.errorMessage}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </ScrollArea>
  );
}
