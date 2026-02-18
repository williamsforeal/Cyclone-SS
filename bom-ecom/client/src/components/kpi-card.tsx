import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  icon?: LucideIcon;
  subtitle?: string;
  placeholder?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  subtitle,
  placeholder = false,
  className,
}: KpiCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const isPositive = trend === "up";

  return (
    <Card className={cn("relative", className)} data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {placeholder && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-[10px] text-muted-foreground no-default-hover-elevate">
            Connect Later
          </Badge>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold font-heading"
          data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {change !== undefined && trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                isPositive ? "text-primary" : "text-destructive"
              )}
              data-testid={`kpi-change-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(change)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
