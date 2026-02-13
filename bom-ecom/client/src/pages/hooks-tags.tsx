import { useState } from "react";
import { Tag, Plus, BarChart3, MousePointerClick, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getTagColor } from "@/lib/tag-colors";

const YELLOW_ACCENT = "#E6DD85";

interface Hook {
  id: number;
  type: string;
  text: string;
  uses: number;
  ctrLift: number;
  winRate: number;
  tags: string[];
  linkedAngles: string[];
  linkedAvatars: string[];
  notes: string;
}

const hookTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  Question: { bg: "bg-sky-500/15 dark:bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  Story: { bg: "bg-emerald-500/15 dark:bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  Stat: { bg: "bg-violet-500/15 dark:bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  "Pattern Interrupt": { bg: "bg-red-500/15 dark:bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  "Direct Benefit": { bg: "bg-amber-500/15 dark:bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
};

const sampleHooks: Hook[] = [
  {
    id: 1,
    type: "Question",
    text: "What if your sleep problems aren't about your mattress?",
    uses: 34,
    ctrLift: 12,
    winRate: 19,
    tags: ["sleep", "curiosity", "reframe"],
    linkedAngles: ["Sleep Quality Transformation"],
    linkedAvatars: ["Stressed Professional"],
    notes: "High engagement in Facebook feed placements. Works best with problem-aware audiences who have already tried mattress solutions.",
  },
  {
    id: 2,
    type: "Story",
    text: "I tracked my sleep for 30 days after switching to magnesium lotion...",
    uses: 28,
    ctrLift: 18,
    winRate: 25,
    tags: ["UGC", "data", "transformation"],
    linkedAngles: ["Before/After 30 Days"],
    linkedAvatars: ["Stressed Professional", "Biohacker"],
    notes: "Top-performing hook overall. The ellipsis creates curiosity gap. Pair with real sleep tracking screenshots for maximum impact.",
  },
  {
    id: 3,
    type: "Stat",
    text: "73% of Americans are magnesium deficient - are you one of them?",
    uses: 22,
    ctrLift: 15,
    winRate: 21,
    tags: ["deficiency", "stat", "personal"],
    linkedAngles: ["Doctor-Recommended"],
    linkedAvatars: ["All"],
    notes: "Stat sourced from NIH data. The personal question at the end increases click-through by making it feel relevant to the individual.",
  },
  {
    id: 4,
    type: "Pattern Interrupt",
    text: "Stop buying melatonin.",
    uses: 41,
    ctrLift: 22,
    winRate: 28,
    tags: ["bold", "contrarian", "scroll-stop"],
    linkedAngles: ["Pain Relief Without Pills", "Natural Over Chemical"],
    linkedAvatars: ["Stressed Professional", "Wellness Mom"],
    notes: "Highest CTR lift of any hook. The brevity and directness stops the scroll. Works exceptionally well in Reels and TikTok.",
  },
  {
    id: 5,
    type: "Direct Benefit",
    text: "Fall asleep in 15 minutes without pills",
    uses: 19,
    ctrLift: 9,
    winRate: 15,
    tags: ["benefit", "speed", "natural"],
    linkedAngles: ["Sleep Quality Transformation"],
    linkedAvatars: ["Stressed Professional", "Active Retiree"],
    notes: "Clear, specific benefit hook. The time specificity (15 minutes) adds credibility. Lower CTR but higher conversion rate downstream.",
  },
  {
    id: 6,
    type: "Question",
    text: "Why do Olympic athletes swear by this $29 lotion?",
    uses: 16,
    ctrLift: 14,
    winRate: 18,
    tags: ["authority", "curiosity", "price-anchor"],
    linkedAngles: ["Doctor-Recommended", "3x Better Absorption"],
    linkedAvatars: ["Biohacker"],
    notes: "Combines authority (Olympic athletes) with price anchoring ($29). The question format drives curiosity clicks.",
  },
  {
    id: 7,
    type: "Story",
    text: "My doctor told me to stop taking sleeping pills. Here's what I did instead.",
    uses: 24,
    ctrLift: 20,
    winRate: 23,
    tags: ["authority", "story", "alternative"],
    linkedAngles: ["Pain Relief Without Pills", "Doctor-Recommended"],
    linkedAvatars: ["Active Retiree", "Stressed Professional"],
    notes: "Strong authority + story combination. Doctor mention adds credibility. 'Here's what I did instead' creates strong curiosity gap.",
  },
  {
    id: 8,
    type: "Stat",
    text: "2.3x better absorption than oral supplements",
    uses: 11,
    ctrLift: 8,
    winRate: 12,
    tags: ["bioavailability", "comparison", "data"],
    linkedAngles: ["3x Better Absorption"],
    linkedAvatars: ["Biohacker"],
    notes: "Data-driven hook for most-aware audiences. Best used in retargeting sequences where the audience already understands the product category.",
  },
];

export default function HooksTags() {
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-hooks-tags">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <Tag className="h-6 w-6 text-primary" />
              <h1
                className="text-2xl font-bold font-heading tracking-tight"
                data-testid="page-title-hooks-tags"
              >
                Hooks / Tags
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sampleHooks.length} hook patterns
            </p>
          </div>
          <Button data-testid="button-new-hook">
            <Plus className="h-4 w-4" />
            New Hook
          </Button>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          data-testid="hooks-grid"
        >
          {sampleHooks.map((hook) => {
            const typeColors = hookTypeColors[hook.type];
            return (
              <Card
                key={hook.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedHook(hook)}
                data-testid={`card-hook-${hook.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {typeColors ? (
                    <Badge
                      variant="outline"
                      className={`text-sm no-default-hover-elevate ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}
                      data-testid={`badge-hook-type-${hook.id}`}
                    >
                      {hook.type}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-sm no-default-hover-elevate"
                      data-testid={`badge-hook-type-${hook.id}`}
                    >
                      {hook.type}
                    </Badge>
                  )}

                  <p
                    className="text-sm font-medium leading-relaxed line-clamp-3"
                    data-testid={`text-hook-text-${hook.id}`}
                  >
                    "{hook.text}"
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Uses</span>
                      <span
                        className="text-sm font-mono font-medium"
                        style={{ color: YELLOW_ACCENT }}
                        data-testid={`text-hook-uses-${hook.id}`}
                      >
                        {hook.uses}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">CTR</span>
                      <span
                        className="text-sm font-mono font-medium"
                        style={{ color: YELLOW_ACCENT }}
                        data-testid={`text-hook-ctr-${hook.id}`}
                      >
                        +{hook.ctrLift}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Win</span>
                      <span
                        className="text-sm font-mono font-medium"
                        style={{ color: YELLOW_ACCENT }}
                        data-testid={`text-hook-winrate-${hook.id}`}
                      >
                        {hook.winRate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hook.tags.map((tag) => {
                      const tc = getTagColor(tag);
                      return (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={`text-sm no-default-hover-elevate ${tc.bg} ${tc.text} ${tc.border}`}
                          data-testid={`badge-tag-${hook.id}-${tag}`}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Sheet
          open={!!selectedHook}
          onOpenChange={(open) => !open && setSelectedHook(null)}
        >
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-hook-detail">
            {selectedHook && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-hook-type">
                    {selectedHook.type} Hook
                  </SheetTitle>
                  <SheetDescription>Hook details and performance metrics</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {hookTypeColors[selectedHook.type] ? (
                      <Badge
                        variant="outline"
                        className={`text-sm no-default-hover-elevate ${hookTypeColors[selectedHook.type].bg} ${hookTypeColors[selectedHook.type].text} ${hookTypeColors[selectedHook.type].border}`}
                      >
                        {selectedHook.type}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-sm no-default-hover-elevate">
                        {selectedHook.type}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Hook Text</p>
                    <p className="text-base font-medium leading-relaxed" data-testid="text-detail-hook-text">
                      "{selectedHook.text}"
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">Uses</p>
                        <p className="font-mono font-bold text-lg" style={{ color: YELLOW_ACCENT }} data-testid="text-detail-uses">
                          {selectedHook.uses}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">CTR Lift</p>
                        <p className="font-mono font-bold text-lg" style={{ color: YELLOW_ACCENT }} data-testid="text-detail-ctr">
                          +{selectedHook.ctrLift}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="font-mono font-bold text-lg" style={{ color: YELLOW_ACCENT }} data-testid="text-detail-winrate">
                          {selectedHook.winRate}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Linked Angles</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedHook.linkedAngles.map((angle) => (
                        <Badge
                          key={angle}
                          variant="outline"
                          className="text-sm no-default-hover-elevate bg-violet-500/15 dark:bg-violet-500/15 text-violet-400 border-violet-500/30"
                        >
                          {angle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Avatars</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedHook.linkedAvatars.map((avatar) => (
                        <Badge
                          key={avatar}
                          variant="outline"
                          className="text-sm no-default-hover-elevate bg-fuchsia-500/15 dark:bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30"
                        >
                          {avatar}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Tags</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedHook.tags.map((tag) => {
                        const tc = getTagColor(tag);
                        return (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-sm no-default-hover-elevate ${tc.bg} ${tc.text} ${tc.border}`}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-notes">
                      {selectedHook.notes}
                    </p>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
