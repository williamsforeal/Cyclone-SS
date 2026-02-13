import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Copy, ArrowRight, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FORMAT_OPTIONS = [
  "None",
  "Lifestyle Composite",
  "Testimonial",
  "Comparison",
  "Benefits Wheel",
  "Before/After",
  "Product Hero",
];

type GeneratedOutput = {
  headlines: string[];
  bodyCopy: string[];
  ctas: string[];
  triggers: string[];
};

function OutputSection({ output, isLoading }: { output: GeneratedOutput | null; isLoading: boolean }) {
  const { toast } = useToast();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }

  function copyAll() {
    if (!output) return;
    const allText = [
      "HEADLINES",
      ...output.headlines,
      "",
      "BODY COPY",
      ...output.bodyCopy,
      "",
      "CTAs",
      ...output.ctas,
      "",
      "PSYCHOLOGICAL TRIGGERS",
      ...output.triggers,
    ].join("\n");
    copyToClipboard(allText);
  }

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="output-loading">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-6 w-40 mt-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="output-empty">
        <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <p className="font-mono text-sm text-muted-foreground">
          Select a product and avatar, then hit Generate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="output-content">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold" data-testid="text-output-title">Generated Output</h2>
        <Button variant="outline" size="sm" onClick={copyAll} data-testid="button-copy-all">
          <Copy className="h-4 w-4" />
          Copy All
        </Button>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-primary" data-testid="text-section-headlines">Headlines</h3>
        <div className="border-t border-border" />
        <div className="space-y-2 pt-1">
          {output.headlines.map((h, i) => (
            <p key={i} className="font-mono text-sm font-bold" data-testid={`text-headline-${i}`}>{h}</p>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold" style={{ color: "hsl(30, 90%, 55%)" }} data-testid="text-section-bodycopy">Body Copy Elements</h3>
        <div className="border-t border-border" />
        <ul className="space-y-1.5 pt-1">
          {output.bodyCopy.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-bodycopy-${i}`}>
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-destructive" data-testid="text-section-ctas">CTAs</h3>
        <div className="border-t border-border" />
        <div className="flex flex-wrap gap-2 pt-1">
          {output.ctas.map((c, i) => (
            <Badge key={i} variant="outline" className="font-mono text-xs no-default-hover-elevate" data-testid={`badge-cta-${i}`}>{c}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold" style={{ color: "hsl(270, 60%, 60%)" }} data-testid="text-section-triggers">Psychological Triggers</h3>
        <div className="border-t border-border" />
        <ul className="space-y-1.5 pt-1">
          {output.triggers.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-trigger-${i}`}>
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AdGenerator() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedAngle, setSelectedAngle] = useState("auto");
  const [formatType, setFormatType] = useState("None");
  const [visualDirection, setVisualDirection] = useState(false);
  const [storyBrandMode, setStoryBrandMode] = useState(false);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/products"],
  });

  const { data: concepts } = useQuery<any[]>({
    queryKey: ["/api/airtable/ad-concepts"],
  });

  const avatarOptions = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.map((c: any) => c["Avatar Target"]).filter(Boolean)));
  }, [concepts]);

  const angleOptions = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.map((c: any) => c.Angle).filter(Boolean)));
  }, [concepts]);

  const recommendations = useMemo(() => {
    if (!concepts || !selectedAvatar) return null;

    const filtered = concepts.filter((c: any) => c["Avatar Target"] === selectedAvatar);

    const angleCounts: Record<string, number> = {};
    const hookCounts: Record<string, number> = {};
    const ctaSet = new Set<string>();

    filtered.forEach((c: any) => {
      if (c.Angle) {
        angleCounts[c.Angle] = (angleCounts[c.Angle] || 0) + 1;
      }
      if (c.Tags) {
        (Array.isArray(c.Tags) ? c.Tags : [c.Tags]).forEach((t: string) => {
          hookCounts[t] = (hookCounts[t] || 0) + 1;
        });
      }
      if (c.CTA) ctaSet.add(c.CTA);
    });

    const topAngles = Object.entries(angleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topHooks = Object.entries(hookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      topAngles,
      topHooks,
      topCTAs: Array.from(ctaSet).slice(0, 6),
      conceptCount: filtered.length,
    };
  }, [concepts, selectedAvatar]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/concept/generate", {
        productId: selectedProduct,
        avatarId: selectedAvatar,
        angle: selectedAngle === "auto" ? recommendations?.topAngles?.[0]?.name : selectedAngle,
        formatType,
        visualDirection,
        storyBrandMode,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered) {
        toast({ title: "Generation queued via n8n", description: "Check Ops page for job status. Results will appear in Creative Lab once complete." });
      } else {
        toast({
          title: "Webhook not configured",
          description: data.reason || "Set N8N_WEBHOOK_URL in environment to enable generation.",
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  function handleGenerate() {
    if (!selectedProduct) {
      toast({ title: "Product is required", variant: "destructive" });
      return;
    }
    if (!selectedAvatar) {
      toast({ title: "Avatar is required", variant: "destructive" });
      return;
    }
    mutation.mutate();
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-generator">
          Ad Copy Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card data-testid="card-step1">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-sm flex items-center gap-2">
                  <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate">1</Badge>
                  Select Product + Avatar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Product (Required)</label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger data-testid="select-product">
                      <SelectValue placeholder={productsLoading ? "Loading..." : "Select product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p: any) => (
                        <SelectItem key={p.recordId} value={p.recordId}>
                          {p.Name || p.name || p.recordId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Avatar (Required)</label>
                  <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                    <SelectTrigger data-testid="select-avatar">
                      <SelectValue placeholder="Select avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {recommendations && (
              <Card data-testid="card-step2">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-sm flex items-center gap-2">
                    <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate">2</Badge>
                    Recommendations
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({recommendations.conceptCount} concepts for this avatar)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.topAngles.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs text-primary font-bold">Top Angles</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendations.topAngles.map((a) => (
                          <Badge
                            key={a.name}
                            variant={selectedAngle === a.name ? "default" : "outline"}
                            className="font-mono text-[10px] cursor-pointer"
                            onClick={() => setSelectedAngle(a.name)}
                            data-testid={`badge-rec-angle-${a.name}`}
                          >
                            {a.name} ({a.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.topHooks.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold" style={{ color: "hsl(30, 90%, 55%)" }}>Top Hooks / Patterns</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendations.topHooks.map((h) => (
                          <Badge
                            key={h.name}
                            variant="outline"
                            className="font-mono text-[10px] no-default-hover-elevate"
                            data-testid={`badge-rec-hook-${h.name}`}
                          >
                            {h.name} ({h.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.topCTAs.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs text-destructive font-bold">Existing CTAs</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendations.topCTAs.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="font-mono text-[10px] no-default-hover-elevate"
                            data-testid={`badge-rec-cta-${c}`}
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-step3">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-sm flex items-center gap-2">
                  <Badge variant="default" className="font-mono text-[10px] no-default-hover-elevate">{recommendations ? "3" : "2"}</Badge>
                  Overrides + Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Angle Override</label>
                  <Select value={selectedAngle} onValueChange={setSelectedAngle}>
                    <SelectTrigger data-testid="select-angle-override">
                      <SelectValue placeholder="Auto (top-ranked)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (top-ranked)</SelectItem>
                      {angleOptions.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Format / Ad Type</label>
                  <Select value={formatType} onValueChange={setFormatType}>
                    <SelectTrigger data-testid="select-format-type">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visual-direction"
                      checked={visualDirection}
                      onCheckedChange={(checked) => setVisualDirection(checked === true)}
                      data-testid="checkbox-visual-direction"
                    />
                    <label htmlFor="visual-direction" className="text-xs cursor-pointer">Visual Direction</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="storybrand-mode"
                      checked={storyBrandMode}
                      onCheckedChange={(checked) => setStoryBrandMode(checked === true)}
                      data-testid="checkbox-storybrand-mode"
                    />
                    <label htmlFor="storybrand-mode" className="text-xs cursor-pointer">StoryBrand Mode</label>
                  </div>
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={mutation.isPending || !selectedProduct || !selectedAvatar}
                  data-testid="button-generate"
                >
                  <Sparkles className="h-4 w-4" />
                  {mutation.isPending ? "Generating..." : "Generate Ad Copy"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-generated-output">
            <CardContent className="p-6">
              <OutputSection output={output} isLoading={mutation.isPending} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
