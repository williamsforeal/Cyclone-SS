import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
  Bot,
  Database,
  Brain,
  TrendingUp,
  Sparkles,
} from "lucide-react";

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

interface PipelineTriggerResult {
  queued?: number;
  message?: string;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    pending: { variant: "outline", className: "border-yellow-500/50 text-yellow-500" },
    running: { variant: "outline", className: "border-blue-500/50 text-blue-500" },
    complete: { variant: "outline", className: "border-green-500/50 text-green-500" },
    failed: { variant: "destructive", className: "" },
  };
  const c = config[status] ?? { variant: "outline" as const, className: "" };
  return (
    <Badge
      variant={c.variant}
      className={`no-default-hover-elevate font-mono text-xs uppercase ${c.className}`}
    >
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Workflow definitions ─────────────────────────────────────────────────────

interface WorkflowDef {
  key: string;
  label: string;
  description: string;
  buttonLabel: string;
  Icon: React.FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

const WORKFLOWS: WorkflowDef[] = [
  {
    key: "import-drive",
    label: "Import from Google Drive",
    description:
      "Reads all docs in your 'AI Com Product Research' folder and creates product candidates.",
    buttonLabel: "Run Import",
    Icon: Database,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  {
    key: "aliexpress",
    label: "Scrape AliExpress COGS",
    description:
      "Scrapes AliExpress pricing for all product candidates missing cost data.",
    buttonLabel: "Scrape Now",
    Icon: TrendingUp,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  {
    key: "consumer-intel",
    label: "Consumer Intelligence",
    description:
      "Extracts pain points and consumer phrases from Reddit and Amazon reviews.",
    buttonLabel: "Run Analysis",
    Icon: Brain,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  {
    key: "creative",
    label: "Generate Creative",
    description:
      "Generates taglines, hooks, and PAS frameworks for scored candidates.",
    buttonLabel: "Generate",
    Icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Pipeline() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);

  // Queries
  const { data: sources } = useQuery<ScrapeSource[]>({
    queryKey: ["/api/scrape-sources"],
  });

  const { data: runs, isLoading: runsLoading } = useQuery<ScrapeRun[]>({
    queryKey: ["/api/scrape-runs"],
    refetchInterval: 5000,
  });

  // Mutation
  const triggerMutation = useMutation({
    mutationFn: async (workflow: string) => {
      const res = await apiRequest("POST", "/api/pipeline/trigger", {
        workflow,
        payload: {},
      });
      return res.json() as Promise<PipelineTriggerResult>;
    },
    onSuccess: (data, workflow) => {
      setRunningWorkflow(null);
      qc.invalidateQueries({ queryKey: ["/api/scrape-runs"] });

      const queued = data?.queued;
      const message = data?.message;
      const description =
        queued != null
          ? `Queued ${queued} candidate${queued !== 1 ? "s" : ""}`
          : message ?? "Workflow queued successfully.";

      toast({ title: "Pipeline triggered", description });
    },
    onError: (err: Error, workflow) => {
      setRunningWorkflow(null);
      toast({
        title: "Failed to trigger pipeline",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleTrigger(workflow: string) {
    setRunningWorkflow(workflow);
    triggerMutation.mutate(workflow);
  }

  // Recent runs — last 20
  const recentRuns = runs ? [...runs].slice(0, 20) : [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight"
              data-testid="page-title-pipeline"
            >
              Research Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trigger data collection and AI analysis workflows
            </p>
          </div>
        </div>

        {/* ── Run Pipeline ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Run Pipeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="pipeline-action-grid">
            {WORKFLOWS.map((wf) => {
              const Icon = wf.Icon;
              const isThisRunning = runningWorkflow === wf.key;
              const anyRunning = runningWorkflow !== null;

              return (
                <Card
                  key={wf.key}
                  className="hover-elevate"
                  data-testid={`card-workflow-${wf.key}`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${wf.iconBg} shrink-0`}>
                        <Icon className={`h-5 w-5 ${wf.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-sm font-bold leading-snug">
                          {wf.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {wf.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      disabled={anyRunning}
                      onClick={() => handleTrigger(wf.key)}
                      data-testid={`button-trigger-${wf.key}`}
                    >
                      {isThisRunning ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 mr-2" />
                          {wf.buttonLabel}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Recent Jobs ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Recent Jobs</h2>
            {runs && (
              <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
                {recentRuns.length}
              </Badge>
            )}
          </div>

          {/* Loading skeletons */}
          {runsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!runsLoading && recentRuns.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pipeline jobs yet. Run a workflow above.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Runs list */}
          {recentRuns.length > 0 && (
            <div className="space-y-2" data-testid="recent-jobs-list">
              {recentRuns.map((run) => {
                const sourceName =
                  sources?.find((s) => s.id === run.sourceId)?.name ??
                  `Source #${run.sourceId}`;
                return (
                  <Card key={run.id} data-testid={`card-run-${run.id}`}>
                    <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                      <StatusIcon status={run.status} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{sourceName}</span>
                          <StatusBadge status={run.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {run.itemsCount > 0 && (
                            <span>{run.itemsCount} items</span>
                          )}
                          <span>{formatTimestamp(run.startedAt ?? run.createdAt)}</span>
                          {run.completedAt && (
                            <span>Done {formatTimestamp(run.completedAt)}</span>
                          )}
                        </div>
                        {run.errorMessage && (
                          <p className="text-xs text-destructive mt-1 truncate">
                            {run.errorMessage}
                          </p>
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
