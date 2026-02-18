import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import { mockExperiments, mockAds, mockCampaigns } from "@/lib/mock-data";
import { FlaskConical, Plus, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import type { Experiment } from "@shared/schema";

type VariantResult = {
  ctr?: number;
  cvr?: number;
  roas?: number;
  spend?: number;
  impressions?: number;
  confidence?: number;
};

function getAdName(adId: number | null | undefined): string {
  if (!adId) return "N/A";
  const ad = mockAds.find((a) => a.id === adId);
  return ad?.name ?? "Unknown";
}

export default function Experiments() {
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      hypothesis: "",
      primaryMetric: "CTR",
      campaignId: "",
    },
  });

  function onSubmit(values: { name: string; hypothesis: string; primaryMetric: string; campaignId: string }) {
    setDialogOpen(false);
    form.reset();
  }

  function handleDeclareWinner(experimentId: number, variant: string) {
    setSelectedExp(null);
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-experiments">
              Experiments
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" data-testid="button-new-experiment">
                <Plus className="h-4 w-4" />
                New Experiment
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-new-experiment">
              <DialogHeader>
                <DialogTitle className="font-heading">New Experiment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Experiment name" data-testid="input-experiment-name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hypothesis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hypothesis</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What do you expect to happen?" data-testid="input-experiment-hypothesis" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primaryMetric"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Metric</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-primary-metric">
                              <SelectValue placeholder="Select metric" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CTR">CTR</SelectItem>
                            <SelectItem value="CVR">CVR</SelectItem>
                            <SelectItem value="ROAS">ROAS</SelectItem>
                            <SelectItem value="CPA">CPA</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="campaignId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-campaign">
                              <SelectValue placeholder="Select campaign" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockCampaigns.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="default" className="w-full" data-testid="button-submit-experiment">
                    Create Experiment
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card data-testid="card-experiments-table">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Name</TableHead>
                  <TableHead className="font-mono">Hypothesis</TableHead>
                  <TableHead className="font-mono">Metric</TableHead>
                  <TableHead className="font-mono">Status</TableHead>
                  <TableHead className="font-mono">Winner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExperiments.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedExp(exp)}
                    data-testid={`row-experiment-${exp.id}`}
                  >
                    <TableCell className="font-mono text-sm font-medium" data-testid={`text-exp-name-${exp.id}`}>
                      {exp.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" data-testid={`text-exp-hypothesis-${exp.id}`}>
                      {exp.hypothesis}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]" data-testid={`badge-exp-metric-${exp.id}`}>
                        {exp.primaryMetric}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={exp.status ?? "draft"} />
                    </TableCell>
                    <TableCell>
                      {exp.winnerVariant ? (
                        <span className="font-mono text-sm text-primary font-bold" data-testid={`text-exp-winner-${exp.id}`}>
                          {exp.winnerVariant}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground" data-testid={`text-exp-winner-${exp.id}`}>--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={!!selectedExp} onOpenChange={(open) => !open && setSelectedExp(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto" data-testid="sheet-experiment-detail">
            {selectedExp && (
              <SheetHeader className="space-y-4">
                <SheetTitle className="font-heading" data-testid="text-exp-detail-name">{selectedExp.name}</SheetTitle>
                <StatusBadge status={selectedExp.status ?? "draft"} />

                <div className="space-y-2 text-sm pt-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Hypothesis</p>
                    <p data-testid="text-exp-detail-hypothesis">{selectedExp.hypothesis}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Primary Metric</p>
                    <p className="font-mono font-bold" data-testid="text-exp-detail-metric">{selectedExp.primaryMetric}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {(["A", "B", "C"] as const).map((variant) => {
                    const variantName = selectedExp[`variant${variant}Name` as keyof Experiment] as string | null;
                    const variantId = selectedExp[`variant${variant}Id` as keyof Experiment] as number | null;
                    const variantResult = selectedExp[`variant${variant}Result` as keyof Experiment] as VariantResult | null;
                    const isWinner = selectedExp.winnerVariant === variant;

                    if (!variantName && !variantId) return null;

                    return (
                      <Card
                        key={variant}
                        className={cn(isWinner && "border-primary")}
                        data-testid={`card-variant-${variant}`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="font-heading text-sm flex items-center gap-2">
                            Variant {variant}
                            {isWinner && <Award className="h-4 w-4 text-primary" />}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground" data-testid={`text-variant-name-${variant}`}>
                            {variantName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" data-testid={`text-variant-ad-${variant}`}>
                            {getAdName(variantId)}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {variantResult ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Impressions</span>
                                <span className="font-mono text-xs" data-testid={`metric-impressions-${variant}`}>
                                  {variantResult.impressions?.toLocaleString() ?? "--"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">CTR</span>
                                <span className="font-mono text-xs" data-testid={`metric-ctr-${variant}`}>
                                  {variantResult.ctr ?? "--"}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">CVR</span>
                                <span className="font-mono text-xs" data-testid={`metric-cvr-${variant}`}>
                                  {variantResult.cvr ?? "--"}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">ROAS</span>
                                <span className="font-mono text-xs" data-testid={`metric-roas-${variant}`}>
                                  {variantResult.roas ?? "--"}x
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Confidence</span>
                                <span className="font-mono text-xs" data-testid={`metric-confidence-${variant}`}>
                                  {variantResult.confidence ? `${(variantResult.confidence * 100).toFixed(0)}%` : "--"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No results yet</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedExp.status === "running" && (
                  <div className="flex items-center gap-2 pt-2">
                    {(["A", "B", "C"] as const).map((variant) => {
                      const variantName = selectedExp[`variant${variant}Name` as keyof Experiment] as string | null;
                      if (!variantName) return null;
                      return (
                        <Button
                          key={variant}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclareWinner(selectedExp.id, variant)}
                          data-testid={`button-declare-winner-${variant}`}
                        >
                          <Award className="h-3.5 w-3.5" />
                          Declare {variant} Winner
                        </Button>
                      );
                    })}
                  </div>
                )}

                {selectedExp.notes && (
                  <div className="space-y-1 pt-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm" data-testid="text-exp-detail-notes">{selectedExp.notes}</p>
                  </div>
                )}
              </SheetHeader>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
