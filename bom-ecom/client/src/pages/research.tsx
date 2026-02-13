import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Package,
  Users,
  Swords,
  FileImage,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Download,
} from "lucide-react";

type PipelineStage = {
  key: string;
  label: string;
  description: string;
  icon: any;
  count: number | null;
  loading: boolean;
  status: "empty" | "seeded" | "active";
};

function StageCard({ stage }: { stage: PipelineStage }) {
  const Icon = stage.icon;
  const statusColor =
    stage.status === "active"
      ? "text-primary"
      : stage.status === "seeded"
        ? "text-muted-foreground"
        : "text-muted-foreground/40";

  return (
    <Card data-testid={`card-stage-${stage.key}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${statusColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-bold" data-testid={`text-stage-label-${stage.key}`}>
                {stage.label}
              </h3>
              {stage.loading ? (
                <Skeleton className="h-5 w-10" />
              ) : (
                <Badge
                  variant={stage.count && stage.count > 0 ? "default" : "outline"}
                  className="font-mono text-xs no-default-hover-elevate"
                  data-testid={`badge-stage-count-${stage.key}`}
                >
                  {stage.count ?? 0}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground" data-testid={`text-stage-desc-${stage.key}`}>
              {stage.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StageConnector() {
  return (
    <div className="flex items-center justify-center py-1">
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 rotate-90" />
    </div>
  );
}

export default function Research() {
  const { toast } = useToast();

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

  const uniqueAvatars = concepts
    ? Array.from(new Set(concepts.map((c: any) => c["Avatar Target"]).filter(Boolean)))
    : [];
  const uniqueAngles = concepts
    ? Array.from(new Set(concepts.map((c: any) => c.Angle).filter(Boolean)))
    : [];
  const uniqueHooks = concepts
    ? Array.from(new Set(concepts.flatMap((c: any) => Array.isArray(c.Tags) ? c.Tags : c.Tags ? [c.Tags] : []).filter(Boolean)))
    : [];
  const generatedImages = images
    ? images.filter((img: any) => img.Status === "Generated")
    : [];

  const stages: PipelineStage[] = [
    {
      key: "products",
      label: "Products",
      description: "Product catalog from Airtable. Each product drives the research funnel.",
      icon: Package,
      count: products?.length ?? null,
      loading: productsLoading,
      status: products && products.length > 0 ? "active" : "empty",
    },
    {
      key: "avatars",
      label: "Avatars",
      description: "Target customer segments extracted from ad concepts. Demographics, pains, desired outcomes.",
      icon: Users,
      count: uniqueAvatars.length,
      loading: conceptsLoading,
      status: uniqueAvatars.length > 0 ? "active" : "empty",
    },
    {
      key: "angles",
      label: "Angles",
      description: "Persuasion angles used across concepts: Pain, Identity, Curiosity, Urgency, etc.",
      icon: Swords,
      count: uniqueAngles.length,
      loading: conceptsLoading,
      status: uniqueAngles.length > 0 ? "active" : "empty",
    },
    {
      key: "hooks",
      label: "Hooks / Tags",
      description: "Hook patterns and tags: Question, Story, Stat, Pattern Interrupt, Direct Benefit.",
      icon: ShieldCheck,
      count: uniqueHooks.length,
      loading: conceptsLoading,
      status: uniqueHooks.length > 0 ? "active" : "empty",
    },
    {
      key: "concepts",
      label: "Ad Concepts",
      description: "Full ad concepts with headline, copy, CTA, and targeting metadata.",
      icon: Globe,
      count: concepts?.length ?? null,
      loading: conceptsLoading,
      status: concepts && concepts.length > 0 ? "active" : "empty",
    },
    {
      key: "assets",
      label: "Generated Assets",
      description: "Images generated via Flux/fal.ai, stored on CloudFront S3.",
      icon: FileImage,
      count: generatedImages.length,
      loading: imagesLoading,
      status: generatedImages.length > 0 ? "active" : "empty",
    },
  ];

  const ingestMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiRequest("POST", `/api/webhook/research/ingest`, {
        action,
        productId: products?.[0]?.recordId,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered) {
        toast({ title: "Workflow triggered via n8n" });
      } else {
        toast({
          title: "Webhook not configured",
          description: data.reason || "Set N8N_WEBHOOK_URL in settings to enable automation.",
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Failed to trigger", description: err.message, variant: "destructive" });
    },
  });

  const conceptBreakdown = {
    byAngle: uniqueAngles.map((angle) => ({
      name: angle,
      count: concepts?.filter((c: any) => c.Angle === angle).length ?? 0,
    })).sort((a, b) => b.count - a.count),
    byAvatar: uniqueAvatars.map((avatar) => ({
      name: avatar,
      count: concepts?.filter((c: any) => c["Avatar Target"] === avatar).length ?? 0,
    })).sort((a, b) => b.count - a.count),
    byTag: uniqueHooks.map((tag) => ({
      name: tag,
      count: concepts?.filter((c: any) => {
        const tags = Array.isArray(c.Tags) ? c.Tags : c.Tags ? [c.Tags] : [];
        return tags.includes(tag);
      }).length ?? 0,
    })).sort((a, b) => b.count - a.count),
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-research">
              Research Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Product research, avatars, angles, hooks, and concept generation funnel.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/airtable/products"] });
                queryClient.invalidateQueries({ queryKey: ["/api/airtable/ad-concepts"] });
                queryClient.invalidateQueries({ queryKey: ["/api/airtable/images"] });
                queryClient.invalidateQueries({ queryKey: ["/api/airtable/jobs"] });
                toast({ title: "Data refreshed" });
              }}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="section-title-pipeline">
              Pipeline Stages
            </h2>
            {stages.map((stage, i) => (
              <div key={stage.key}>
                <StageCard stage={stage} />
                {i < stages.length - 1 && <StageConnector />}
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="section-title-actions">
                Automation Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card data-testid="card-action-ingest">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">Ingest Competitor Ads</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trigger n8n workflow to scrape and import competitor ad creatives into the swipe file.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={ingestMutation.isPending}
                      onClick={() => ingestMutation.mutate("ingest_ads")}
                      data-testid="button-ingest-ads"
                    >
                      {ingestMutation.isPending ? "Triggering..." : "Trigger Ingestion"}
                    </Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-action-extract">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">Extract Angles / Hooks</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Parse existing concepts to identify and score angles and hooks by evidence count.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={ingestMutation.isPending}
                      onClick={() => ingestMutation.mutate("extract_angles")}
                      data-testid="button-extract-angles"
                    >
                      {ingestMutation.isPending ? "Triggering..." : "Extract Patterns"}
                    </Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-action-seed">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">Seed Concepts</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generate a batch of 25 new concept variations using top-performing angles and hooks.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={ingestMutation.isPending}
                      onClick={() => ingestMutation.mutate("seed_concepts")}
                      data-testid="button-seed-concepts"
                    >
                      {ingestMutation.isPending ? "Triggering..." : "Seed 25 Concepts"}
                    </Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-action-metrics">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">Ingest Daily Metrics</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pull platform metrics (spend, ROAS, CTR, CVR) and link to concepts/experiments.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={ingestMutation.isPending}
                      onClick={() => ingestMutation.mutate("ingest_metrics")}
                      data-testid="button-ingest-metrics"
                    >
                      {ingestMutation.isPending ? "Triggering..." : "Pull Metrics"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="section-title-breakdown">
                Concept Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card data-testid="card-breakdown-angle">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-xs text-muted-foreground uppercase">By Angle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {conceptsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))
                    ) : conceptBreakdown.byAngle.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No data</p>
                    ) : (
                      conceptBreakdown.byAngle.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs truncate">{item.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{item.count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-breakdown-avatar">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-xs text-muted-foreground uppercase">By Avatar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {conceptsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))
                    ) : conceptBreakdown.byAvatar.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No data</p>
                    ) : (
                      conceptBreakdown.byAvatar.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs truncate">{item.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{item.count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-breakdown-tags">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-xs text-muted-foreground uppercase">By Hook / Tag</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {conceptsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))
                    ) : conceptBreakdown.byTag.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No data</p>
                    ) : (
                      conceptBreakdown.byTag.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs truncate">{item.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{item.count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card data-testid="card-jobs-summary">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-xs text-muted-foreground uppercase">Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : !jobs || jobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No jobs recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {jobs.slice(0, 8).map((job: any) => (
                      <div key={job.recordId} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs truncate">
                          {job["Job Type"] || job.Name || job.recordId}
                        </span>
                        <Badge
                          variant={job.Status === "success" || job.Status === "Generated" ? "default" : job.Status === "failed" ? "destructive" : "outline"}
                          className="font-mono text-[10px] no-default-hover-elevate"
                        >
                          {job.Status || "unknown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
