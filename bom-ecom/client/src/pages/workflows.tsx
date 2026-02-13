import { useState } from "react";
import { Workflow, Activity, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/status-badge";

interface WorkflowItem {
  id: number;
  name: string;
  description: string;
  trigger: string;
  runs: string;
  successRate: string;
  lastRun: string;
  status: string;
  enabled: boolean;
}

const sampleWorkflows: WorkflowItem[] = [
  {
    id: 1,
    name: "Ad Concept Generator",
    description: "Generate ad concepts from product + avatar selection",
    trigger: "Webhook",
    runs: "142",
    successRate: "96%",
    lastRun: "2026-02-06",
    status: "active",
    enabled: true,
  },
  {
    id: 2,
    name: "Image Prompt Builder",
    description: "Create image prompts from approved concepts",
    trigger: "Webhook",
    runs: "98",
    successRate: "99%",
    lastRun: "2026-02-05",
    status: "active",
    enabled: true,
  },
  {
    id: 3,
    name: "Competitor Ad Scraper",
    description: "Scrape competitor ads from Meta Ad Library",
    trigger: "Schedule (daily)",
    runs: "45",
    successRate: "91%",
    lastRun: "2026-02-07",
    status: "active",
    enabled: true,
  },
  {
    id: 4,
    name: "Metrics Ingestion",
    description: "Pull daily ad metrics from Meta/TikTok",
    trigger: "Schedule (hourly)",
    runs: "1,240",
    successRate: "94%",
    lastRun: "2026-02-07",
    status: "active",
    enabled: true,
  },
  {
    id: 5,
    name: "Winner Detection",
    description: "Flag ads that exceed performance thresholds",
    trigger: "Schedule (6h)",
    runs: "320",
    successRate: "100%",
    lastRun: "2026-02-06",
    status: "active",
    enabled: true,
  },
  {
    id: 6,
    name: "Creative Fatigue Alert",
    description: "Detect declining CTR trends",
    trigger: "Schedule (daily)",
    runs: "38",
    successRate: "87%",
    lastRun: "2026-02-04",
    status: "paused",
    enabled: false,
  },
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState(sampleWorkflows);

  function handleToggle(id: number) {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              enabled: !w.enabled,
              status: !w.enabled ? "active" : "paused",
            }
          : w
      )
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="text-page-title">
              Workflows
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {workflows.length} workflows configured
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover-elevate" data-testid={`card-workflow-${workflow.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
                <CardTitle className="text-base" data-testid={`text-workflow-name-${workflow.id}`}>
                  {workflow.name}
                </CardTitle>
                <Switch
                  checked={workflow.enabled}
                  onCheckedChange={() => handleToggle(workflow.id)}
                  data-testid={`switch-workflow-${workflow.id}`}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{workflow.description}</p>

                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Runs</span>
                    <span className="font-mono font-medium" data-testid={`text-workflow-runs-${workflow.id}`}>
                      {workflow.runs}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Success</span>
                    <span className="font-mono font-medium" data-testid={`text-workflow-success-${workflow.id}`}>
                      {workflow.successRate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Last</span>
                    <span className="font-mono font-medium" data-testid={`text-workflow-lastrun-${workflow.id}`}>
                      {workflow.lastRun}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="no-default-hover-elevate" data-testid={`badge-trigger-${workflow.id}`}>
                    {workflow.trigger}
                  </Badge>
                  <StatusBadge status={workflow.status} data-testid={`badge-status-${workflow.id}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
