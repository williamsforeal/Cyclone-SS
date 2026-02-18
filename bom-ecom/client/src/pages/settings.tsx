import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Link2,
  Bell,
  SlidersHorizontal,
  Database,
  Info,
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    jobFailures: true,
    campaignLaunches: false,
    winnerDeclared: true,
    experimentConcluded: false,
  });

  const [defaultObjective, setDefaultObjective] = useState("conversion");
  const [defaultMetric, setDefaultMetric] = useState("CTR");
  const [defaultBudget, setDefaultBudget] = useState("5000");

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<any>({
    queryKey: ["/api/health"],
  });

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="font-heading text-xl font-bold" data-testid="text-settings-heading">
          Settings
        </h1>

        <Card data-testid="card-airtable-health">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="font-heading text-base">Airtable Schema Status</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchHealth();
                toast({ title: "Health check refreshed" });
              }}
              data-testid="button-refresh-health"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !healthData ? (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Health check failed</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  {healthData.connected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm text-primary" data-testid="text-health-status">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="font-mono text-sm text-destructive" data-testid="text-health-status">
                        {healthData.error || "Disconnected"}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {healthData.tables?.map((table: any) => (
                    <div
                      key={table.key}
                      className="flex items-start justify-between gap-3 p-3 rounded-md bg-muted/30"
                      data-testid={`health-table-${table.key}`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{table.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{table.tableId}</span>
                        </div>
                        {table.missingFields && table.missingFields.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                            <span className="text-[10px] text-destructive">
                              Missing: {table.missingFields.join(", ")}
                            </span>
                          </div>
                        )}
                        {table.foundFields && table.foundFields.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {table.foundFields.slice(0, 8).map((f: string) => (
                              <Badge key={f} variant="outline" className="text-[10px] font-mono no-default-hover-elevate">
                                {f}
                              </Badge>
                            ))}
                            {table.foundFields.length > 8 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{table.foundFields.length - 8} more
                              </span>
                            )}
                          </div>
                        )}
                        {table.error && (
                          <p className="text-[10px] text-destructive">{table.error}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {table.exists ? (
                          <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate">
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-mono text-[10px] no-default-hover-elevate">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="font-heading text-base">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              API keys are stored as server-side environment variables (AIRTABLE_API_KEY, AIRTABLE_BASE_ID, N8N_WEBHOOK_URL).
              They cannot be viewed or modified from the frontend.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/30">
                <span className="font-mono text-sm">AIRTABLE_API_KEY</span>
                <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-airtable-key">
                  Configured
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/30">
                <span className="font-mono text-sm">AIRTABLE_BASE_ID</span>
                <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-airtable-base">
                  Configured
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/30">
                <span className="font-mono text-sm">N8N_WEBHOOK_URL</span>
                <Badge variant="outline" className="font-mono text-[10px] no-default-hover-elevate" data-testid="badge-n8n-webhook">
                  Optional
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="font-heading text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-job-failures">Job failures</Label>
              <Switch
                id="notify-job-failures"
                checked={notifications.jobFailures}
                onCheckedChange={() => toggleNotification("jobFailures")}
                data-testid="switch-job-failures"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-campaign-launches">Campaign launches</Label>
              <Switch
                id="notify-campaign-launches"
                checked={notifications.campaignLaunches}
                onCheckedChange={() => toggleNotification("campaignLaunches")}
                data-testid="switch-campaign-launches"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-winner-declared">Winner declared</Label>
              <Switch
                id="notify-winner-declared"
                checked={notifications.winnerDeclared}
                onCheckedChange={() => toggleNotification("winnerDeclared")}
                data-testid="switch-winner-declared"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-experiment-concluded">Experiment concluded</Label>
              <Switch
                id="notify-experiment-concluded"
                checked={notifications.experimentConcluded}
                onCheckedChange={() => toggleNotification("experimentConcluded")}
                data-testid="switch-experiment-concluded"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="font-heading text-base">Default Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Objective</Label>
              <Select value={defaultObjective} onValueChange={setDefaultObjective}>
                <SelectTrigger data-testid="select-default-objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Awareness</SelectItem>
                  <SelectItem value="consideration">Consideration</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Primary Metric</Label>
              <Select value={defaultMetric} onValueChange={setDefaultMetric}>
                <SelectTrigger data-testid="select-default-metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CTR">CTR</SelectItem>
                  <SelectItem value="CVR">CVR</SelectItem>
                  <SelectItem value="ROAS">ROAS</SelectItem>
                  <SelectItem value="CPA">CPA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-budget">Default Budget</Label>
              <Input
                id="default-budget"
                type="number"
                value={defaultBudget}
                onChange={(e) => setDefaultBudget(e.target.value)}
                data-testid="input-default-budget"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="font-heading text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">App Name</span>
              <span className="font-mono text-sm" data-testid="text-app-name">THE BOMB ECOM OS</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="font-mono text-sm" data-testid="text-app-version">2.0.0</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">Stack</span>
              <span className="font-mono text-sm" data-testid="text-app-stack">Express + Vite + Airtable</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">Automation</span>
              <span className="font-mono text-sm" data-testid="text-app-automation">n8n Webhooks</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
