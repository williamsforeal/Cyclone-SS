import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Target,
  Users,
  FileImage,
  Activity,
  AlertTriangle,
  Swords,
  Globe,
  Bone,
  SplitSquareVertical,
  Crown,
  Fingerprint,
  ExternalLink,
  FlaskConical,
  Scale,
  Gift,
  Hourglass,
  ShieldCheck,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
  "sun": Sun,
  "cloud-sun": CloudSun,
  "cloud": Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "snowflake": Snowflake,
  "cloud-lightning": CloudLightning,
};

const ANGLE_ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  "pain": { icon: Bone, color: "text-rose-400" },
  "transformation": { icon: Swords, color: "text-sky-400" },
  "us vs them": { icon: SplitSquareVertical, color: "text-orange-400" },
  "social proof": { icon: Crown, color: "text-amber-400" },
  "identity": { icon: Fingerprint, color: "text-violet-400" },
  "science": { icon: FlaskConical, color: "text-emerald-400" },
  "cost": { icon: Scale, color: "text-yellow-400" },
  "gift": { icon: Gift, color: "text-pink-400" },
  "urgency": { icon: Hourglass, color: "text-amber-500" },
  "risk reversal": { icon: ShieldCheck, color: "text-teal-400" },
};

function getAngleIcon(angleName: string): { icon: LucideIcon; color: string } {
  const key = angleName.toLowerCase().trim();
  return ANGLE_ICON_MAP[key] || { icon: Swords, color: "text-primary" };
}
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import williamsLogo from "@assets/Gemini_Generated_Image_kzu7kzu7kzu7kzu7_1770685360979.jpg";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const today = new Date();

export default function Overview() {
  const { data: products, isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/products"],
  });

  const { data: concepts, isLoading: conceptsLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/ad-concepts"],
  });

  const { data: images, isLoading: imagesLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/images"],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/jobs"],
  });

  const { data: healthData, isLoading: healthLoading } = useQuery<any>({
    queryKey: ["/api/health"],
  });

  const { data: notionStatus, isLoading: notionLoading } = useQuery<{ connected: boolean; workspaceName?: string }>({
    queryKey: ["/api/notion/status"],
  });

  const { data: weather } = useQuery<{
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: string;
    unit: string;
  }>({
    queryKey: ["/api/weather"],
    refetchInterval: 30 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const allConcepts = concepts || [];
    const allImages = images || [];
    const allJobs = jobs || [];

    const uniqueAvatars = Array.from(new Set(allConcepts.map((c: any) => c["Avatar Target"]).filter(Boolean)));
    const uniqueAngles = Array.from(new Set(allConcepts.map((c: any) => c.Angle).filter(Boolean)));
    const generatedImages = allImages.filter((img: any) => img.Status === "Generated");

    const angleCounts = uniqueAngles.map((angle) => ({
      name: angle,
      count: allConcepts.filter((c: any) => c.Angle === angle).length,
    })).sort((a, b) => b.count - a.count);

    const avatarCounts = uniqueAvatars.map((avatar) => ({
      name: avatar,
      count: allConcepts.filter((c: any) => c["Avatar Target"] === avatar).length,
    })).sort((a, b) => b.count - a.count);

    const successJobs = allJobs.filter((j: any) => j.Status === "success" || j.Status === "Generated").length;
    const failedJobs = allJobs.filter((j: any) => j.Status === "failed").length;

    return {
      productCount: (products || []).length,
      conceptCount: allConcepts.length,
      avatarCount: uniqueAvatars.length,
      imageCount: generatedImages.length,
      angleCounts,
      avatarCounts,
      jobTotal: allJobs.length,
      successJobs,
      failedJobs,
    };
  }, [products, concepts, images, jobs]);

  const isLoading = productsLoading || conceptsLoading || imagesLoading || jobsLoading;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div
          className="relative rounded-2xl overflow-hidden border border-purple-500/20"
          style={{ background: "linear-gradient(135deg, hsl(270 40% 12%) 0%, hsl(280 50% 18%) 40%, hsl(290 45% 22%) 70%, hsl(260 40% 14%) 100%)" }}
          data-testid="hero-banner"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(0,200,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.15) 0%, transparent 50%)" }} />
          <div className="relative flex items-center justify-between gap-4 px-6 py-4 flex-wrap">
            <div className="flex items-center gap-5">
              <img
                src={williamsLogo}
                alt="williams 4REAL Ecom"
                className="h-16 sm:h-20 rounded-xl object-contain"
                data-testid="img-hero-logo"
              />
              <div className="flex flex-col gap-1.5" data-testid="connection-badges-stack">
                <div className="flex items-center gap-1.5">
                  {notionLoading ? (
                    <Skeleton className="h-5 w-28" />
                  ) : notionStatus?.connected ? (
                    <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-notion-status">
                      Notion Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-notion-status">
                      Notion Disconnected
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-purple-300/60 hover:text-purple-100"
                    onClick={() => window.open("https://www.notion.so", "_blank")}
                    data-testid="button-link-notion"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  {healthLoading ? (
                    <Skeleton className="h-5 w-28" />
                  ) : healthData?.connected ? (
                    <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-airtable-status">
                      Airtable Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-airtable-status">
                      Airtable Disconnected
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-purple-300/60 hover:text-purple-100"
                    onClick={() => window.open("https://airtable.com", "_blank")}
                    data-testid="button-link-airtable"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] border-purple-400/30 text-purple-300/50 no-default-hover-elevate" data-testid="badge-placeholder-status">
                    Add Connection
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-purple-300/30"
                    disabled
                    data-testid="button-link-placeholder"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1" data-testid="date-weather-section">
              <p className="text-sm font-heading font-semibold text-purple-100/90 tracking-wide" data-testid="text-current-date">
                {today.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-xs text-purple-300/60 font-mono" data-testid="text-date-full">
                {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-[10px] text-purple-400/40 font-mono" data-testid="text-time">
                {today.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
              {weather && (
                <div className="flex items-center gap-2 mt-1 px-2.5 py-1 rounded-lg border border-purple-500/15 bg-purple-900/20" data-testid="weather-widget">
                  {(() => {
                    const WeatherIcon = WEATHER_ICON_MAP[weather.icon] || Cloud;
                    return <WeatherIcon className="h-4 w-4 text-purple-200/70" />;
                  })()}
                  <span className="font-mono text-sm text-purple-100/80" data-testid="text-weather-temp">
                    {weather.temp}°{weather.unit}
                  </span>
                  <span className="text-[10px] text-purple-300/50" data-testid="text-weather-condition">
                    {weather.condition}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-cards-row">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <KpiCard
                title="Products"
                value={String(stats.productCount)}
                icon={Package}
              />
              <KpiCard
                title="Ad Concepts"
                value={String(stats.conceptCount)}
                icon={Globe}
              />
              <KpiCard
                title="Avatars"
                value={String(stats.avatarCount)}
                icon={Users}
              />
              <KpiCard
                title="Generated Images"
                value={String(stats.imageCount)}
                icon={FileImage}
              />
            </>
          )}
        </div>

        <Card data-testid="pipeline-health-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Jobs:</span>
                {jobsLoading ? (
                  <Skeleton className="h-4 w-6" />
                ) : (
                  <span className="font-mono font-bold" data-testid="text-jobs-total">{stats.jobTotal}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Failures:</span>
                {jobsLoading ? (
                  <Skeleton className="h-4 w-6" />
                ) : (
                  <span className="font-mono font-bold text-destructive" data-testid="text-failures">{stats.failedJobs}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Succeeded:</span>
                {jobsLoading ? (
                  <Skeleton className="h-4 w-6" />
                ) : (
                  <span className="font-mono font-bold" data-testid="text-success-jobs">{stats.successJobs}</span>
                )}
              </div>
            </div>
            {conceptsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : stats.angleCounts.length > 0 ? (
              <div className="h-40" data-testid="pipeline-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.angleCounts.slice(0, 8)}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No angle data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-base font-bold font-heading mb-3" data-testid="section-title-top-angles">
              Top Angles
            </h2>
            <Card>
              <CardContent className="p-0">
                {conceptsLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : stats.angleCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No angles found.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {stats.angleCounts.slice(0, 10).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-4 p-3"
                        data-testid={`row-angle-${item.name}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const { icon: AngleIcon, color } = getAngleIcon(item.name);
                            return <AngleIcon className={`h-3.5 w-3.5 shrink-0 ${color}`} />;
                          })()}
                          <span className="font-mono text-sm truncate">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0 no-default-hover-elevate">
                          {item.count} concepts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-base font-bold font-heading mb-3" data-testid="section-title-top-avatars">
              Top Avatars
            </h2>
            <Card>
              <CardContent className="p-0">
                {conceptsLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : stats.avatarCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No avatars found.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {stats.avatarCounts.slice(0, 10).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-4 p-3"
                        data-testid={`row-avatar-${item.name}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-mono text-sm truncate">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0 no-default-hover-elevate">
                          {item.count} concepts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {healthData && (
          <Card data-testid="card-schema-status">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Schema Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {healthData.tables?.map((table: any) => (
                  <div
                    key={table.key}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30"
                    data-testid={`schema-table-${table.key}`}
                  >
                    <span className="font-mono text-xs">{table.label}</span>
                    {table.exists ? (
                      <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate">
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="font-mono text-[10px] no-default-hover-elevate">
                        Missing
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
