import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi-card";
import { Activity, BarChart3, TrendingUp, Target, Zap, Brain } from "lucide-react";
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
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ---------- Type interfaces ----------

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

// ---------- Constants ----------

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

// ---------- Component ----------

export default function SignalEngine() {
  const { data: summary, isLoading: summaryLoading } = useQuery<InsightsSummary>({
    queryKey: ["/api/insights/summary"],
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery<InsightsBreakdown>({
    queryKey: ["/api/insights/breakdown"],
  });

  const { data: competitors, isLoading: competitorsLoading } = useQuery<InsightsCompetitors>({
    queryKey: ["/api/insights/competitors"],
  });

  // Derived data for decision band pie chart
  const decisionPieData = breakdown
    ? Object.entries(breakdown.decisionBands).map(([name, value]) => ({ name, value }))
    : [];

  // Top 5 candidates sorted by score descending
  const topCandidates = breakdown
    ? [...breakdown.candidates].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5)
    : [];

  // Radar data for the highest-scored candidate
  const topCandidate = topCandidates[0] ?? null;
  const radarData = topCandidate
    ? [
        { category: "Pain Intensity", value: topCandidate.painIntensityTotal, max: 25 },
        { category: "Market Proof", value: topCandidate.marketProofTotal, max: 25 },
        { category: "Economics", value: topCandidate.economicsTotal, max: 20 },
        { category: "Competitive Moat", value: topCandidate.competitiveMoatTotal, max: 15 },
        { category: "Content & Creative", value: topCandidate.contentPotentialTotal, max: 15 },
      ]
    : [];

  // Competitor angle distribution bar data
  const angleBarData = competitors
    ? Object.entries(competitors.angleDistribution).map(([name, count]) => ({ name, count }))
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-signal-engine">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title">
            Signal Engine
          </h1>
        </div>

        {/* KPI Cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards-row">
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
              value={summary?.avgProductScore != null ? summary.avgProductScore.toFixed(1) : "\u2014"}
              icon={Target}
              subtitle="out of 100"
            />
          </div>
        )}

        {/* Score Distribution + Top Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-score-distribution">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Decision Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="h-64 flex items-center justify-center" data-testid="chart-decision-pie">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={decisionPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {decisionPieData.map((entry) => (
                            <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [value, "Candidates"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                    {decisionPieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: DECISION_COLORS[entry.name] ?? "#94a3b8" }}
                        />
                        <span className="text-xs text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-top-candidates">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Top 5 Scored Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No candidates scored yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCandidates.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      data-testid={`candidate-row-${i}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-mono font-bold">{c.totalScore}/100</span>
                        <Badge
                          variant="outline"
                          className={DECISION_BADGE_CLASSES[c.decision] ?? ""}
                        >
                          {c.decision}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Radar + Competitor Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-category-radar">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">
                Category Breakdown
                {topCandidate && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({topCandidate.name})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="h-56 w-56 rounded-full" />
                </div>
              ) : !topCandidate ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No candidate data available.
                </p>
              ) : (
                <div className="h-72" data-testid="chart-category-radar">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 25]}
                        tick={{ fontSize: 10 }}
                        tickCount={6}
                      />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.25}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} / ${props.payload.max}`,
                          props.payload.category,
                        ]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-competitor-intel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Competitor Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              {competitorsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-52" />
                </div>
              ) : !competitors || angleBarData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No competitor data collected yet.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    Messaging Angle Distribution ({competitors.total} competitors analyzed)
                  </p>
                  <div className="h-48" data-testid="chart-angle-distribution">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={angleBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: number) => [value, "Count"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {competitors.gaps.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Identified Gaps / Opportunities
                      </p>
                      <div className="space-y-2">
                        {competitors.gaps.map((g, i) => (
                          <div
                            key={i}
                            className="rounded-md border px-3 py-2 text-sm"
                            data-testid={`gap-row-${i}`}
                          >
                            <span className="font-medium">{g.gap}</span>
                            <span className="text-muted-foreground ml-1">- {g.weakness}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
