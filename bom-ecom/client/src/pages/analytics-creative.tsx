import { BarChart3, ArrowDown, Lightbulb, AlertTriangle, Target, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const topAngles = [
  { angle: "Social Proof", roas: 4.2 },
  { angle: "Pain Point", roas: 3.8 },
  { angle: "Before/After", roas: 3.5 },
  { angle: "Urgency", roas: 3.1 },
  { angle: "Authority", roas: 2.9 },
  { angle: "Curiosity", roas: 2.6 },
];

const topHooks = [
  { hook: "Stop scrolling if...", ctr: 3.8 },
  { hook: "Nobody talks about...", ctr: 3.2 },
  { hook: "I was today years old...", ctr: 2.9 },
  { hook: "POV: You just discovered...", ctr: 2.5 },
  { hook: "Wait for it...", ctr: 2.1 },
];

const fatiguedCreatives = [
  { name: "PalmAura Social Proof V2", days: 42, ctrTrend: "-1.2%", currentCtr: "1.1%", recommendation: "Pause and refresh hook" },
  { name: "FlexiGrip Pain Point V1", days: 38, ctrTrend: "-0.9%", currentCtr: "1.4%", recommendation: "Test new thumbnail" },
  { name: "ZenBrew Authority V3", days: 35, ctrTrend: "-0.7%", currentCtr: "1.6%", recommendation: "Rotate angle" },
  { name: "PalmAura Urgency V1", days: 28, ctrTrend: "-0.5%", currentCtr: "1.8%", recommendation: "Update copy" },
];

const bestCombinations = [
  { combo: "Busy Mom + Social Proof", roas: "4.8x", cvr: "5.2%", sampleSize: "2,340" },
  { combo: "Fitness Enthusiast + Before/After", roas: "4.3x", cvr: "4.8%", sampleSize: "1,890" },
  { combo: "Health Conscious + Pain Point", roas: "3.9x", cvr: "4.1%", sampleSize: "3,120" },
  { combo: "Tech Savvy + Curiosity", roas: "3.5x", cvr: "3.7%", sampleSize: "1,560" },
  { combo: "Budget Shopper + Urgency", roas: "3.2x", cvr: "3.4%", sampleSize: "2,780" },
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: 12,
};

export default function AnalyticsCreative() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-creative-performance">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title">
            Creative Performance
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-cards-row">
          <KpiCard
            title="Active Creatives"
            value="42"
            change={7}
            trend="up"
            icon={Lightbulb}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Avg CTR"
            value="2.4%"
            change={3}
            trend="up"
            icon={MousePointerClick}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Top ROAS"
            value="4.2x"
            change={15}
            trend="up"
            icon={Target}
            subtitle="best performing"
          />
          <KpiCard
            title="Fatigue Alerts"
            value="3"
            change={2}
            trend="down"
            icon={AlertTriangle}
            subtitle="needs attention"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-top-angles">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Top Angles by ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-top-angles">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAngles} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}x`}
                    />
                    <YAxis
                      type="category"
                      dataKey="angle"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`${value}x`, "Avg ROAS"]}
                    />
                    <Bar dataKey="roas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-top-hooks">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Top Hooks by CTR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-top-hooks">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHooks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="hook"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`${value}%`, "CTR"]}
                    />
                    <Bar dataKey="ctr" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-creative-fatigue">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Creative Fatigue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creative Name</TableHead>
                  <TableHead className="text-right">Days Running</TableHead>
                  <TableHead className="text-right">CTR Trend</TableHead>
                  <TableHead className="text-right">Current CTR</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fatiguedCreatives.map((row, i) => (
                  <TableRow key={row.name} data-testid={`row-fatigue-${i}`}>
                    <TableCell className="font-medium" data-testid={`text-creative-name-${i}`}>{row.name}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-creative-days-${i}`}>{row.days}</TableCell>
                    <TableCell className="text-right" data-testid={`text-creative-trend-${i}`}>
                      <span className="flex items-center justify-end gap-1 text-destructive">
                        <ArrowDown className="h-3 w-3" />
                        <span className="font-mono">{row.ctrTrend}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-creative-ctr-${i}`}>{row.currentCtr}</TableCell>
                    <TableCell data-testid={`text-creative-recommendation-${i}`}>
                      <Badge variant="outline" className="no-default-hover-elevate">{row.recommendation}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-testid="card-best-combinations">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Best Combinations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar + Angle</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">CVR</TableHead>
                  <TableHead className="text-right">Sample Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestCombinations.map((row, i) => (
                  <TableRow key={row.combo} data-testid={`row-combo-${i}`}>
                    <TableCell className="font-medium" data-testid={`text-combo-name-${i}`}>{row.combo}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-combo-roas-${i}`}>{row.roas}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-combo-cvr-${i}`}>{row.cvr}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-combo-size-${i}`}>{row.sampleSize}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
