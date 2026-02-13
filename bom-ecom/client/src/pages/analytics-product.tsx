import { TrendingUp, ShoppingCart, Repeat, Star, ArrowRight } from "lucide-react";
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
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const pieData = [
  { name: "PalmAura", value: 45 },
  { name: "FlexiGrip", value: 33 },
  { name: "ZenBrew", value: 22 },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

const funnelSteps = [
  { label: "Visitors", value: "45K", raw: 45000 },
  { label: "Add to Cart", value: "8.2K", raw: 8200 },
  { label: "Checkout", value: "3.1K", raw: 3100 },
  { label: "Purchase", value: "2.8K", raw: 2800 },
];

const productPerformance = [
  { product: "PalmAura", units: "1,240", revenue: "$22,140", cvr: "4.1%", aov: "$34.20", returnRate: "2.1%", rating: "4.7" },
  { product: "FlexiGrip", units: "890", revenue: "$15,890", cvr: "3.4%", aov: "$37.80", returnRate: "3.2%", rating: "4.4" },
  { product: "ZenBrew", units: "717", revenue: "$10,260", cvr: "2.8%", aov: "$42.60", returnRate: "1.8%", rating: "4.8" },
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: 12,
};

export default function AnalyticsProduct() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-product-performance">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title">
            Product Performance
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="kpi-cards-row">
          <KpiCard
            title="Total Units Sold"
            value="2,847"
            change={9}
            trend="up"
            icon={ShoppingCart}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Avg Order Value"
            value="$38.40"
            change={4}
            trend="up"
            icon={TrendingUp}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Repeat Purchase Rate"
            value="28%"
            change={6}
            trend="up"
            icon={Repeat}
            subtitle="vs prev period"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-sales-by-product">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Sales by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center" data-testid="chart-sales-pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`${value}%`, "Share"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-conversion-funnel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 py-4">
                {funnelSteps.map((step, index) => {
                  const maxRaw = funnelSteps[0].raw;
                  const widthPercent = (step.raw / maxRaw) * 100;
                  const convRate = index > 0
                    ? ((step.raw / funnelSteps[index - 1].raw) * 100).toFixed(1)
                    : null;

                  return (
                    <div key={step.label}>
                      {index > 0 && (
                        <div className="flex items-center gap-2 mb-2 ml-2">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">{convRate}% conversion</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3" data-testid={`funnel-step-${index}`}>
                        <span className="text-sm text-muted-foreground w-24 shrink-0">{step.label}</span>
                        <div className="flex-1 relative">
                          <div
                            className="h-8 rounded-md flex items-center px-3"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              opacity: 0.85,
                              minWidth: "60px",
                            }}
                          >
                            <span className="text-xs font-mono font-medium text-white">{step.value}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-product-performance">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Return Rate</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerformance.map((row, i) => (
                  <TableRow key={row.product} data-testid={`row-product-${i}`}>
                    <TableCell className="font-medium" data-testid={`text-product-name-${i}`}>{row.product}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-units-${i}`}>{row.units}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-revenue-${i}`}>{row.revenue}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-cvr-${i}`}>{row.cvr}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-aov-${i}`}>{row.aov}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-returnrate-${i}`}>{row.returnRate}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1" data-testid={`text-product-rating-${i}`}>
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        <span className="font-mono">{row.rating}</span>
                      </span>
                    </TableCell>
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
