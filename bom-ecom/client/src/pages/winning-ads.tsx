import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/status-badge";
import { mockAds } from "@/lib/mock-data";
import { Filter, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ad } from "@shared/schema";

const winningAds = mockAds.filter((ad) => ad.isWinner);

const avatarTargets = ["all", ...Array.from(new Set(winningAds.map((a) => a.avatarTarget).filter((v): v is string => !!v)))];
const anglesOptions = ["all", ...Array.from(new Set(winningAds.map((a) => a.angle).filter((v): v is string => !!v)))];
const awarenessLevels = ["all", ...Array.from(new Set(winningAds.map((a) => a.awarenessLevel).filter((v): v is string => !!v)))];
const headlineTypes = ["all", ...Array.from(new Set(winningAds.map((a) => a.headlineType).filter((v): v is string => !!v)))];
const visualMotifs = ["all", ...Array.from(new Set(winningAds.map((a) => a.visualMotif).filter((v): v is string => !!v)))];

function countPatterns(ads: Ad[], key: keyof Ad) {
  const counts: Record<string, { count: number; example: string }> = {};
  for (const ad of ads) {
    const val = ad[key] as string | null;
    if (!val) continue;
    if (!counts[val]) {
      counts[val] = { count: 0, example: ad.headline ?? "" };
    }
    counts[val].count++;
  }
  return Object.entries(counts).map(([name, data]) => ({
    name,
    count: data.count,
    example: data.example,
  }));
}

export default function WinningAds() {
  const [avatarFilter, setAvatarFilter] = useState("all");
  const [angleFilter, setAngleFilter] = useState("all");
  const [awarenessFilter, setAwarenessFilter] = useState("all");
  const [headlineFilter, setHeadlineFilter] = useState("all");
  const [motifFilter, setMotifFilter] = useState("all");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  const filtered = useMemo(() => {
    return winningAds.filter((ad) => {
      if (avatarFilter !== "all" && ad.avatarTarget !== avatarFilter) return false;
      if (angleFilter !== "all" && ad.angle !== angleFilter) return false;
      if (awarenessFilter !== "all" && ad.awarenessLevel !== awarenessFilter) return false;
      if (headlineFilter !== "all" && ad.headlineType !== headlineFilter) return false;
      if (motifFilter !== "all" && ad.visualMotif !== motifFilter) return false;
      return true;
    });
  }, [avatarFilter, angleFilter, awarenessFilter, headlineFilter, motifFilter]);

  const avatarPatterns = countPatterns(winningAds, "avatarTarget");
  const anglePatterns = countPatterns(winningAds, "angle");
  const awarenessPatterns = countPatterns(winningAds, "awarenessLevel");
  const motifPatterns = countPatterns(winningAds, "visualMotif");
  const headlinePatterns = countPatterns(winningAds, "headlineType");

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-winning-ads">
            Winning Ads Library
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap" data-testid="filter-bar">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={avatarFilter} onValueChange={setAvatarFilter}>
            <SelectTrigger className="w-[220px]" data-testid="filter-avatar-target">
              <SelectValue placeholder="Avatar Target" />
            </SelectTrigger>
            <SelectContent>
              {avatarTargets.map((t) => (
                <SelectItem key={t} value={t}>{t === "all" ? "All Avatars" : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={angleFilter} onValueChange={setAngleFilter}>
            <SelectTrigger className="w-[200px]" data-testid="filter-angle">
              <SelectValue placeholder="Angle" />
            </SelectTrigger>
            <SelectContent>
              {anglesOptions.map((a) => (
                <SelectItem key={a} value={a}>{a === "all" ? "All Angles" : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={awarenessFilter} onValueChange={setAwarenessFilter}>
            <SelectTrigger className="w-[180px]" data-testid="filter-awareness-level">
              <SelectValue placeholder="Awareness" />
            </SelectTrigger>
            <SelectContent>
              {awarenessLevels.map((l) => (
                <SelectItem key={l} value={l}>{l === "all" ? "All Levels" : l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={headlineFilter} onValueChange={setHeadlineFilter}>
            <SelectTrigger className="w-[180px]" data-testid="filter-headline-type">
              <SelectValue placeholder="Headline Type" />
            </SelectTrigger>
            <SelectContent>
              {headlineTypes.map((h) => (
                <SelectItem key={h} value={h}>{h === "all" ? "All Headlines" : h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={motifFilter} onValueChange={setMotifFilter}>
            <SelectTrigger className="w-[220px]" data-testid="filter-visual-motif">
              <SelectValue placeholder="Visual Motif" />
            </SelectTrigger>
            <SelectContent>
              {visualMotifs.map((m) => (
                <SelectItem key={m} value={m}>{m === "all" ? "All Motifs" : m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          data-testid="winning-ads-grid"
        >
          {filtered.map((ad) => (
            <Card
              key={ad.id}
              className="cursor-pointer"
              onClick={() => setSelectedAd(ad)}
              data-testid={`card-winner-${ad.id}`}
            >
              <div className="h-32 rounded-t-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary/40" />
              </div>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="font-mono text-sm truncate" data-testid={`text-winner-name-${ad.id}`}>
                    {ad.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate" data-testid={`text-winner-headline-${ad.id}`}>
                    {ad.headline}
                  </p>
                </div>
                <StatusBadge status="winner" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div data-testid={`metric-ctr-${ad.id}`}>
                    <p className="font-mono text-sm font-bold">{ad.ctr}%</p>
                    <p className="text-[10px] text-muted-foreground">CTR</p>
                  </div>
                  <div data-testid={`metric-cvr-${ad.id}`}>
                    <p className="font-mono text-sm font-bold">{ad.cvr}%</p>
                    <p className="text-[10px] text-muted-foreground">CVR</p>
                  </div>
                  <div data-testid={`metric-roas-${ad.id}`}>
                    <p className="font-mono text-sm font-bold">{ad.roas}x</p>
                    <p className="text-[10px] text-muted-foreground">ROAS</p>
                  </div>
                </div>
                {ad.tags && ad.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {ad.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]" data-testid={`badge-tag-${ad.id}-${tag}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-12" data-testid="text-no-winners">
              No winning ads match the current filters.
            </p>
          )}
        </div>

        <Sheet open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-winner-detail">
            {selectedAd && (
              <SheetHeader className="space-y-4">
                <SheetTitle className="font-heading" data-testid="text-sheet-title">{selectedAd.name}</SheetTitle>
                <StatusBadge status="winner" />

                <div className="space-y-3 text-sm pt-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Concept</p>
                    <p data-testid="text-detail-concept">{selectedAd.concept}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Headline</p>
                    <p className="font-mono font-medium" data-testid="text-detail-headline">{selectedAd.headline}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Hook</p>
                    <p data-testid="text-detail-hook">{selectedAd.hook}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CTA</p>
                    <p className="font-mono" data-testid="text-detail-cta">{selectedAd.cta}</p>
                  </div>
                </div>

                {selectedAd.whyItWon && (
                  <div className="border-l-2 border-primary pl-4 py-2 space-y-1" data-testid="text-why-it-won">
                    <p className="text-xs font-bold text-primary">Why It Won</p>
                    <p className="text-sm">{selectedAd.whyItWon}</p>
                  </div>
                )}

                {selectedAd.whenToReuse && (
                  <div className="space-y-1" data-testid="text-when-to-reuse">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> When to Reuse
                    </p>
                    <p className="text-sm">{selectedAd.whenToReuse}</p>
                  </div>
                )}

                {selectedAd.whenNotToReuse && (
                  <div className="space-y-1" data-testid="text-when-not-to-reuse">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> When NOT to Reuse
                    </p>
                    <p className="text-sm">{selectedAd.whenNotToReuse}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div data-testid="detail-metric-ctr">
                    <p className="font-mono text-lg font-bold">{selectedAd.ctr}%</p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                  <div data-testid="detail-metric-cvr">
                    <p className="font-mono text-lg font-bold">{selectedAd.cvr}%</p>
                    <p className="text-xs text-muted-foreground">CVR</p>
                  </div>
                  <div data-testid="detail-metric-roas">
                    <p className="font-mono text-lg font-bold">{selectedAd.roas}x</p>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div data-testid="detail-metric-spend">
                    <p className="font-mono text-sm font-bold">${selectedAd.spend?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Spend</p>
                  </div>
                  <div data-testid="detail-metric-impressions">
                    <p className="font-mono text-sm font-bold">{selectedAd.impressions?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <div data-testid="detail-metric-clicks">
                    <p className="font-mono text-sm font-bold">{selectedAd.clicks?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                </div>

                {selectedAd.tags && selectedAd.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {selectedAd.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </SheetHeader>
            )}
          </SheetContent>
        </Sheet>

        <Card data-testid="card-pattern-extraction">
          <CardHeader>
            <CardTitle className="font-heading text-sm">Pattern Extraction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Avatar Targets", patterns: avatarPatterns },
              { label: "Angles", patterns: anglePatterns },
              { label: "Awareness Levels", patterns: awarenessPatterns },
              { label: "Visual Motifs", patterns: motifPatterns },
              { label: "Headline Types", patterns: headlinePatterns },
            ].map((section) => (
              <div key={section.label} className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
                {section.patterns.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-4 text-sm py-1"
                    data-testid={`pattern-row-${section.label.toLowerCase().replace(/\s/g, "-")}-${p.name}`}
                  >
                    <span className="truncate min-w-0">{p.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                        {p.example}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[10px]">{p.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2" data-testid="text-patterns-disclaimer">
              Patterns require human confirmation
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
