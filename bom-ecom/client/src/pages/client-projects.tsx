import { Briefcase, Plus, DollarSign, FolderOpen, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";

interface ClientProject {
  id: number;
  client: string;
  project: string;
  description: string;
  status: string;
  progress: number;
  budget: string;
  deliverables: string;
  dueDate: string;
}

const sampleProjects: ClientProject[] = [
  {
    id: 1,
    client: "GlowSkin Co.",
    project: "E-commerce Chatbot + Lead Qualification",
    description: "AI-powered customer service chatbot with integrated lead scoring and qualification pipeline.",
    status: "active",
    progress: 75,
    budget: "$8,500",
    deliverables: "6/8",
    dueDate: "Due 2026-03-15",
  },
  {
    id: 2,
    client: "FitFuel Inc.",
    project: "Ad Creative Automation Pipeline",
    description: "End-to-end ad generation pipeline with concept creation, image prompts, and A/B testing.",
    status: "active",
    progress: 40,
    budget: "$12,000",
    deliverables: "3/7",
    dueDate: "Due 2026-04-01",
  },
  {
    id: 3,
    client: "PureVita Labs",
    project: "Reporting Dashboard Build",
    description: "Custom analytics dashboard with automated weekly and monthly performance reports.",
    status: "completed",
    progress: 100,
    budget: "$6,500",
    deliverables: "5/5",
    dueDate: "Completed 2026-01-28",
  },
  {
    id: 4,
    client: "NovaPet Supplies",
    project: "TikTok Ad Scraping + Analysis",
    description: "Automated competitor ad scraping from TikTok with performance analysis and trend detection.",
    status: "active",
    progress: 60,
    budget: "$4,800",
    deliverables: "4/6",
    dueDate: "Due 2026-02-28",
  },
  {
    id: 5,
    client: "BreathEasy Health",
    project: "Full Marketing Ops Setup",
    description: "Complete marketing operations infrastructure including workflows, reporting, and automation.",
    status: "on-hold",
    progress: 20,
    budget: "$15,000",
    deliverables: "2/10",
    dueDate: "Due TBD",
  },
];

const kpis = [
  { label: "Active Projects", value: "5", icon: FolderOpen },
  { label: "Monthly Revenue", value: "$12,400", icon: DollarSign },
  { label: "Avg Project Value", value: "$8,200", icon: Target },
  { label: "On-Time Delivery", value: "92%", icon: Clock },
];

export default function ClientProjects() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-client-projects">
                Client Projects
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sampleProjects.length} projects
            </p>
          </div>
          <Button data-testid="button-new-project">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold font-mono mt-1" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {kpi.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleProjects.map((project) => (
            <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
                <CardTitle className="text-base" data-testid={`text-client-name-${project.id}`}>
                  {project.client}
                </CardTitle>
                <StatusBadge status={project.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{project.project}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-mono" data-testid={`text-project-progress-${project.id}`}>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} data-testid={`progress-project-${project.id}`} />
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-mono font-medium" data-testid={`text-project-budget-${project.id}`}>
                      {project.budget}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Deliverables</span>
                    <span className="font-mono font-medium" data-testid={`text-project-deliverables-${project.id}`}>
                      {project.deliverables}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono font-medium" data-testid={`text-project-due-${project.id}`}>
                      {project.dueDate}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
