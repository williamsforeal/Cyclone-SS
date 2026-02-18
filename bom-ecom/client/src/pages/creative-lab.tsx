import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { Filter, ImageOff, RotateCcw, CheckCircle2, XCircle, Sparkles, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getTagColor } from "@/lib/tag-colors";

type AirtableAdConcept = {
  recordId: string;
  Concept: string;
  headline: string;
  Angle: string;
  "Avatar Target": string;
  "Awareness Level": string[];
  "Ad Type": string;
  CTA: string;
  Tags: string[];
  "Image Prompt Status": string;
};

type AirtableImage = {
  recordId: string;
  "Ad Copy": string[];
  A: string;
  s3_url: string;
  Variant: string;
  "Ad Type": string;
  Status: string;
  Width: number;
  Height: number;
  "Ad Sets": string;
};

const YELLOW_ACCENT = "#E6DD85";

const angleBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  Pain: { bg: "bg-red-500/15 dark:bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  Transformation: { bg: "bg-emerald-500/15 dark:bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  Identity: { bg: "bg-violet-500/15 dark:bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  "Social Proof": { bg: "bg-sky-500/15 dark:bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  Urgency: { bg: "bg-amber-500/15 dark:bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  "Us vs Them": { bg: "bg-orange-500/15 dark:bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  "Direct Benefit": { bg: "bg-teal-500/15 dark:bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  "Fear of Missing Out": { bg: "bg-rose-500/15 dark:bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  Authority: { bg: "bg-indigo-500/15 dark:bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  Curiosity: { bg: "bg-fuchsia-500/15 dark:bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
};
const ANGLE_FALLBACK = { bg: "bg-orange-500/15 dark:bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" };

const awarenessColors: Record<string, { bg: string; text: string; border: string }> = {
  Unaware: { bg: "bg-zinc-500/15 dark:bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/30" },
  "Problem Aware": { bg: "bg-rose-500/15 dark:bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  "Solution Aware": { bg: "bg-amber-500/15 dark:bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  "Product Aware": { bg: "bg-teal-500/15 dark:bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  "Most Aware": { bg: "bg-lime-500/15 dark:bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
};
const AWARENESS_FALLBACK = { bg: "bg-yellow-500/15 dark:bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" };

const AVATAR_COLORS = { bg: "bg-fuchsia-500/15 dark:bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" };

function getAngleColor(angle: string) {
  for (const [key, colors] of Object.entries(angleBadgeColors)) {
    if (angle.toLowerCase().includes(key.toLowerCase())) return colors;
  }
  return ANGLE_FALLBACK;
}

function ConceptCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

function ImageCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-48 w-full rounded-t-xl rounded-b-none" />
      <CardContent className="pt-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
      </CardContent>
    </Card>
  );
}

export default function CreativeLab() {
  const { toast } = useToast();
  const [angleFilter, setAngleFilter] = useState("all");
  const [avatarFilter, setAvatarFilter] = useState("all");
  const [adTypeFilter, setAdTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());

  const { data: concepts, isLoading: conceptsLoading } = useQuery<AirtableAdConcept[]>({
    queryKey: ["/api/airtable/ad-concepts"],
  });

  const { data: images, isLoading: imagesLoading } = useQuery<AirtableImage[]>({
    queryKey: ["/api/airtable/images"],
  });

  const dynamicAngles = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.map((c) => c.Angle).filter(Boolean))).sort();
  }, [concepts]);

  const dynamicAvatars = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.map((c) => c["Avatar Target"]).filter(Boolean))).sort();
  }, [concepts]);

  const dynamicAdTypes = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.map((c) => c["Ad Type"]).filter(Boolean))).sort();
  }, [concepts]);

  const dynamicTags = useMemo(() => {
    if (!concepts) return [];
    return Array.from(new Set(concepts.flatMap((c) => c.Tags || []).filter(Boolean))).sort();
  }, [concepts]);

  const filteredConcepts = useMemo(() => {
    if (!concepts) return [];
    return concepts.filter((c) => {
      if (hideEmpty && !c.headline) return false;
      if (angleFilter !== "all" && c.Angle !== angleFilter) return false;
      if (avatarFilter !== "all" && c["Avatar Target"] !== avatarFilter) return false;
      if (adTypeFilter !== "all" && c["Ad Type"] !== adTypeFilter) return false;
      if (tagFilter !== "all" && (!c.Tags || !c.Tags.includes(tagFilter))) return false;
      return true;
    });
  }, [concepts, angleFilter, avatarFilter, adTypeFilter, tagFilter, hideEmpty]);

  const hiddenCount = useMemo(() => {
    if (!concepts) return 0;
    return concepts.filter((c) => !c.headline).length;
  }, [concepts]);

  const hasActiveFilter = angleFilter !== "all" || avatarFilter !== "all" || adTypeFilter !== "all" || tagFilter !== "all";

  function resetFilters() {
    setAngleFilter("all");
    setAvatarFilter("all");
    setAdTypeFilter("all");
    setTagFilter("all");
  }

  function toggleSelect(recordId: string) {
    setSelectedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }

  function selectAll() {
    setSelectedConcepts(new Set(filteredConcepts.map((c) => c.recordId)));
  }

  function deselectAll() {
    setSelectedConcepts(new Set());
  }

  const bulkMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const records = Array.from(selectedConcepts).map((id) => ({
        id,
        fields: { "Image Prompt Status": status },
      }));
      const res = await apiRequest("PATCH", "/api/airtable/ad-concepts/bulk/update", { records });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/airtable/ad-concepts"] });
      setSelectedConcepts(new Set());
      toast({ title: "Concepts updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const allImages = images || [];
  const displayedImages = allImages.slice(0, 15);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-creative-lab">
              Creative Lab
            </h1>
            {concepts && (
              <span className="font-mono text-sm text-muted-foreground" data-testid="text-concept-count">
                {filteredConcepts.length} of {concepts.length} concepts
              </span>
            )}
          </div>
          {selectedConcepts.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap" data-testid="bulk-actions">
              <span className="font-mono text-xs text-muted-foreground">
                {selectedConcepts.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkMutation.mutate({ status: "Approved" })}
                disabled={bulkMutation.isPending}
                data-testid="button-bulk-approve"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkMutation.mutate({ status: "Rejected" })}
                disabled={bulkMutation.isPending}
                data-testid="button-bulk-reject"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkMutation.mutate({ status: "Generate Image Prompt" })}
                disabled={bulkMutation.isPending}
                data-testid="button-bulk-generate"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Variants
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap" data-testid="filter-bar">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={angleFilter} onValueChange={setAngleFilter}>
            <SelectTrigger className="w-[170px]" data-testid="filter-angle">
              <SelectValue placeholder="Angle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Angles</SelectItem>
              {dynamicAngles.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={avatarFilter} onValueChange={setAvatarFilter}>
            <SelectTrigger className="w-[170px]" data-testid="filter-avatar-target">
              <SelectValue placeholder="Avatar Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Avatars</SelectItem>
              {dynamicAvatars.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
            <SelectTrigger className="w-[170px]" data-testid="filter-ad-type">
              <SelectValue placeholder="Ad Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ad Types</SelectItem>
              {dynamicAdTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[150px]" data-testid="filter-tags">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {dynamicTags.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideEmpty(!hideEmpty)}
            className={cn("toggle-elevate", hideEmpty && "toggle-elevated")}
            data-testid="button-hide-empty"
          >
            <EyeOff className="h-3.5 w-3.5" />
            {hideEmpty ? `Hiding ${hiddenCount} empty` : "Show all"}
          </Button>
          {filteredConcepts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectedConcepts.size > 0 ? deselectAll : selectAll}
              data-testid="button-select-toggle"
            >
              {selectedConcepts.size > 0 ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider" data-testid="section-title-concepts">
            Ad Concepts
          </h2>
          {conceptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="concepts-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <ConceptCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="text-center py-12 space-y-3" data-testid="text-no-concepts">
              <p className="text-sm text-muted-foreground">
                No ad concepts match the current filters.
              </p>
              {hasActiveFilter && (
                <Button variant="outline" size="sm" onClick={resetFilters} data-testid="button-reset-empty">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="concepts-grid">
              {filteredConcepts.map((concept) => {
                const isSelected = selectedConcepts.has(concept.recordId);
                const hasTags = concept.Tags && concept.Tags.length > 0;
                const hasAwareness = concept["Awareness Level"] && concept["Awareness Level"].length > 0;
                const isEmpty = !concept.headline;

                if (isEmpty) {
                  return (
                    <Card
                      key={concept.recordId}
                      className={cn("opacity-50", isSelected && "ring-1 ring-primary")}
                      data-testid={`card-concept-${concept.recordId}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(concept.recordId)}
                            className="shrink-0"
                            data-testid={`checkbox-concept-${concept.recordId}`}
                          />
                          {concept["Ad Type"] && (
                            <Badge variant="outline" className="text-sm shrink-0" data-testid={`badge-adtype-${concept.recordId}`}>
                              {concept["Ad Type"]}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground italic" data-testid={`text-headline-${concept.recordId}`}>
                            No headline
                          </span>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                }

                const angleColors = concept.Angle ? getAngleColor(concept.Angle) : ANGLE_FALLBACK;

                return (
                  <Card
                    key={concept.recordId}
                    className={cn("flex flex-col", isSelected && "ring-1 ring-primary")}
                    data-testid={`card-concept-${concept.recordId}`}
                  >
                    <CardHeader className="pb-2 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(concept.recordId)}
                          className="shrink-0"
                          data-testid={`checkbox-concept-${concept.recordId}`}
                        />
                        {concept["Image Prompt Status"] && (
                          <StatusBadge status={concept["Image Prompt Status"]} />
                        )}
                        {concept["Ad Type"] && (
                          <Badge variant="outline" className="text-sm shrink-0 ml-auto" data-testid={`badge-adtype-${concept.recordId}`}>
                            {concept["Ad Type"]}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-mono text-sm leading-snug" data-testid={`text-headline-${concept.recordId}`}>
                        {concept.headline}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-3" data-testid={`text-concept-${concept.recordId}`}>
                        {concept.Concept}
                      </p>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3 pt-0">
                      {(concept.Angle || concept["Avatar Target"] || hasTags || hasAwareness) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {concept.Angle && (
                            <Badge
                              variant="outline"
                              className={`text-sm no-default-hover-elevate ${angleColors.bg} ${angleColors.text} ${angleColors.border}`}
                              data-testid={`badge-angle-${concept.recordId}`}
                            >
                              {concept.Angle}
                            </Badge>
                          )}
                          {hasAwareness && concept["Awareness Level"].map((level) => {
                            const awColors = awarenessColors[level] || AWARENESS_FALLBACK;
                            return (
                              <Badge
                                key={level}
                                variant="outline"
                                className={`text-sm no-default-hover-elevate ${awColors.bg} ${awColors.text} ${awColors.border}`}
                                data-testid={`badge-awareness-${concept.recordId}`}
                              >
                                {level}
                              </Badge>
                            );
                          })}
                          {concept["Avatar Target"] && (
                            <Badge
                              variant="outline"
                              className={`text-sm no-default-hover-elevate ${AVATAR_COLORS.bg} ${AVATAR_COLORS.text} ${AVATAR_COLORS.border}`}
                              data-testid={`badge-avatar-${concept.recordId}`}
                            >
                              {concept["Avatar Target"]}
                            </Badge>
                          )}
                          {hasTags && concept.Tags.map((tag) => {
                            const tc = getTagColor(tag);
                            return (
                              <Badge
                                key={tag}
                                variant="outline"
                                className={`text-sm no-default-hover-elevate ${tc.bg} ${tc.text} ${tc.border}`}
                                data-testid={`badge-tag-${concept.recordId}`}
                              >
                                {tag}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {concept.CTA && (
                        <p
                          className="font-mono text-xs text-center"
                          style={{ color: `${YELLOW_ACCENT}cc` }}
                          data-testid={`text-cta-${concept.recordId}`}
                        >
                          CTA: {concept.CTA}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider" data-testid="section-title-images">
            Image Gallery
          </h2>
          {imagesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" data-testid="images-skeleton-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <ImageCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedImages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12" data-testid="text-no-images">
              No images available.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" data-testid="images-grid">
              {displayedImages.map((img) => {
                const imgUrl = img.A || img.s3_url;
                return (
                  <Card key={img.recordId} data-testid={`card-image-${img.recordId}`}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={img.Variant ? `Variant ${img.Variant}` : "Ad image"}
                        className="w-full h-40 object-cover rounded-t-xl"
                        data-testid={`img-preview-${img.recordId}`}
                      />
                    ) : (
                      <div
                        className={cn(
                          "h-40 rounded-t-xl border-2 border-dashed border-muted-foreground/20",
                          "flex flex-col items-center justify-center gap-2 bg-muted/30"
                        )}
                      >
                        <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          Awaiting Generation
                        </span>
                      </div>
                    )}
                    <CardContent className="p-2 space-y-1">
                      {img["Ad Sets"] && (
                        <span className="font-mono text-[10px] text-muted-foreground block truncate">
                          {img["Ad Sets"]}
                        </span>
                      )}
                      {img.Status && (
                        <StatusBadge status={img.Status} />
                      )}
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
