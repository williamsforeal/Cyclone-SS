import { Factory, Clock, AlertTriangle, TrendingUp, Package, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Supplier {
  id: number;
  name: string;
  product: string;
  avgLeadTime: number;
  targetLeadTime: number;
  defectRate: number;
  onTimeRate: number;
  ordersCompleted: number;
  rating: number;
  status: "preferred" | "active" | "probation";
}

const suppliers: Supplier[] = [
  { id: 1, name: "NatureCraft Labs", product: "PalmAura", avgLeadTime: 12, targetLeadTime: 14, defectRate: 0.8, onTimeRate: 96, ordersCompleted: 48, rating: 4.8, status: "preferred" },
  { id: 2, name: "VitaFlex Co.", product: "FlexiGrip", avgLeadTime: 19, targetLeadTime: 21, defectRate: 1.2, onTimeRate: 91, ordersCompleted: 35, rating: 4.5, status: "active" },
  { id: 3, name: "BrewSource Intl.", product: "ZenBrew", avgLeadTime: 30, targetLeadTime: 28, defectRate: 2.4, onTimeRate: 82, ordersCompleted: 22, rating: 3.9, status: "probation" },
  { id: 4, name: "PackRight Solutions", product: "All (packaging)", avgLeadTime: 7, targetLeadTime: 10, defectRate: 0.3, onTimeRate: 98, ordersCompleted: 60, rating: 4.9, status: "preferred" },
];

const leadTimeHistory = [
  { month: "Sep", naturecraft: 13, vitaflex: 20, brewsource: 26 },
  { month: "Oct", naturecraft: 14, vitaflex: 22, brewsource: 27 },
  { month: "Nov", naturecraft: 12, vitaflex: 19, brewsource: 29 },
  { month: "Dec", naturecraft: 15, vitaflex: 21, brewsource: 31 },
  { month: "Jan", naturecraft: 11, vitaflex: 18, brewsource: 30 },
  { month: "Feb", naturecraft: 12, vitaflex: 19, brewsource: 30 },
];

const defectRateData = [
  { supplier: "NatureCraft", rate: 0.8 },
  { supplier: "VitaFlex", rate: 1.2 },
  { supplier: "BrewSource", rate: 2.4 },
  { supplier: "PackRight", rate: 0.3 },
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: 12,
};

function getStatusBadge(status: string) {
  switch (status) {
    case "preferred":
      return <Badge variant="default" className="no-default-hover-elevate no-default-active-elevate">Preferred</Badge>;
    case "active":
      return <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">Active</Badge>;
    case "probation":
      return <Badge variant="destructive" className="no-default-hover-elevate no-default-active-elevate">Probation</Badge>;
    default:
      return <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
  }
}

export default function SupplierPerformance() {
  const avgLeadTime = Math.round(suppliers.reduce((sum, s) => sum + s.avgLeadTime, 0) / suppliers.length);
  const avgDefectRate = (suppliers.reduce((sum, s) => sum + s.defectRate, 0) / suppliers.length).toFixed(1);
  const avgOnTimeRate = Math.round(suppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers.length);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-supplier-performance">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-suppliers">
            Supplier Performance
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="supplier-kpi-row">
          <KpiCard
            title="Active Suppliers"
            value={String(suppliers.length)}
            icon={Factory}
          />
          <KpiCard
            title="Avg Lead Time"
            value={`${avgLeadTime}d`}
            icon={Clock}
            subtitle="across all suppliers"
          />
          <KpiCard
            title="Avg Defect Rate"
            value={`${avgDefectRate}%`}
            icon={AlertTriangle}
            subtitle="target: < 1.0%"
          />
          <KpiCard
            title="On-Time Delivery"
            value={`${avgOnTimeRate}%`}
            change={2}
            trend="up"
            icon={TrendingUp}
            subtitle="vs prev quarter"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-lead-time-trend">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Lead Time Trend (days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-lead-time">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadTimeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}d`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`${value} days`, undefined]}
                    />
                    <Line type="monotone" dataKey="naturecraft" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="NatureCraft" />
                    <Line type="monotone" dataKey="vitaflex" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="VitaFlex" />
                    <Line type="monotone" dataKey="brewsource" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} name="BrewSource" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
                  <span className="text-xs text-muted-foreground">NatureCraft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
                  <span className="text-xs text-muted-foreground">VitaFlex</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
                  <span className="text-xs text-muted-foreground">BrewSource</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-defect-rates">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Defect Rate by Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-defect-rate">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="supplier"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
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
                      formatter={(value: number) => [`${value}%`, "Defect Rate"]}
                    />
                    <Bar dataKey="rate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-px flex-1 bg-destructive/30" />
                <span className="text-[10px] text-destructive">Target: 1.0%</span>
                <div className="h-px flex-1 bg-destructive/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-supplier-table">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Supplier Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Defect Rate</TableHead>
                  <TableHead className="text-right">On-Time</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                    <TableCell className="font-medium" data-testid={`text-supplier-name-${s.id}`}>{s.name}</TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-supplier-product-${s.id}`}>{s.product}</TableCell>
                    <TableCell className="text-right" data-testid={`text-supplier-leadtime-${s.id}`}>
                      <span className="font-mono">{s.avgLeadTime}d</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {s.targetLeadTime}d</span>
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-supplier-defect-${s.id}`}>
                      <span className={`font-mono ${s.defectRate > 1.5 ? "text-destructive font-medium" : ""}`}>
                        {s.defectRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-supplier-ontime-${s.id}`}>
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={s.onTimeRate} className="w-16 h-1.5" />
                        <span className="font-mono text-sm">{s.onTimeRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-supplier-orders-${s.id}`}>{s.ordersCompleted}</TableCell>
                    <TableCell className="text-right" data-testid={`text-supplier-rating-${s.id}`}>
                      <span className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        <span className="font-mono">{s.rating}</span>
                      </span>
                    </TableCell>
                    <TableCell data-testid={`badge-supplier-status-${s.id}`}>
                      {getStatusBadge(s.status)}
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
