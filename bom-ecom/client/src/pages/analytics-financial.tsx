import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Target, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const revenueSpendData = [
  { week: "W1", revenue: 4200, spend: 1800 },
  { week: "W2", revenue: 4800, spend: 1950 },
  { week: "W3", revenue: 5100, spend: 2100 },
  { week: "W4", revenue: 5600, spend: 2050 },
  { week: "W5", revenue: 6200, spend: 2200 },
  { week: "W6", revenue: 6800, spend: 2150 },
  { week: "W7", revenue: 7100, spend: 2300 },
  { week: "W8", revenue: 8490, spend: 2200 },
];

const profitData = [
  { week: "W1", revenue: 4200, costs: 2900, profit: 1300 },
  { week: "W2", revenue: 4800, costs: 3200, profit: 1600 },
  { week: "W3", revenue: 5100, costs: 3400, profit: 1700 },
  { week: "W4", revenue: 5600, costs: 3500, profit: 2100 },
  { week: "W5", revenue: 6200, costs: 3800, profit: 2400 },
  { week: "W6", revenue: 6800, costs: 3900, profit: 2900 },
  { week: "W7", revenue: 7100, costs: 4200, profit: 2900 },
  { week: "W8", revenue: 8490, costs: 4600, profit: 3890 },
];

const productRevenue = [
  { product: "PalmAura", revenue: "$22,140", cogs: "$4,428", adSpend: "$7,200", netProfit: "$10,512", margin: "47.5%" },
  { product: "FlexiGrip", revenue: "$15,890", cogs: "$4,767", adSpend: "$5,550", netProfit: "$5,573", margin: "35.1%" },
  { product: "ZenBrew", revenue: "$10,260", cogs: "$3,078", adSpend: "$4,000", netProfit: "$3,182", margin: "31.0%" },
];

const periods = ["7d", "30d", "90d"] as const;

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: 12,
};

export default function AnalyticsFinancial() {
  const [period, setPeriod] = useState<string>("30d");

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-financial-analytics">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title">
              Financial Analytics
            </h1>
          </div>
          <div className="flex items-center gap-1" data-testid="period-selector">
            {periods.map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                data-testid={`button-period-${p}`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-cards-row">
          <KpiCard
            title="Revenue"
            value="$48,290"
            change={12}
            trend="up"
            icon={DollarSign}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Ad Spend"
            value="$16,750"
            change={5}
            trend="up"
            icon={CreditCard}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Net Profit"
            value="$12,840"
            change={18}
            trend="up"
            icon={TrendingUp}
            subtitle="vs prev period"
          />
          <KpiCard
            title="Blended ROAS"
            value="2.88x"
            change={8}
            trend="up"
            icon={Target}
            subtitle="vs prev period"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-revenue-vs-spend">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Revenue vs Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-revenue-spend">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSpendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                      name="Ad Spend"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
                  <span className="text-xs text-muted-foreground">Ad Spend</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-profit-breakdown">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Profit Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-profit-breakdown">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="costs"
                      stackId="2"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.3}
                      name="Costs"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="3"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
                  <span className="text-xs text-muted-foreground">Costs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
                  <span className="text-xs text-muted-foreground">Profit</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-product-revenue">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Product Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRevenue.map((row, i) => (
                  <TableRow key={row.product} data-testid={`row-product-${i}`}>
                    <TableCell className="font-medium" data-testid={`text-product-name-${i}`}>{row.product}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-revenue-${i}`}>{row.revenue}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-cogs-${i}`}>{row.cogs}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-adspend-${i}`}>{row.adSpend}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-netprofit-${i}`}>{row.netProfit}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-product-margin-${i}`}>{row.margin}</TableCell>
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
