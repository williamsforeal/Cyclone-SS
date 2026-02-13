import { useState } from "react";
import { Users, Plus, MapPin, DollarSign, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface Avatar {
  id: number;
  name: string;
  awarenessLevel: string;
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
    income: string;
  };
  psychographics: string;
  painPoints: string[];
  buyingTriggers: string[];
  currentState: string;
  desiredState: string;
  objections: string[];
}

const sampleAvatars: Avatar[] = [
  {
    id: 1,
    name: "Stressed Professional",
    awarenessLevel: "problem-aware",
    demographics: {
      ageRange: "28-42",
      gender: "Female",
      location: "Urban",
      income: "$65K-$120K",
    },
    psychographics:
      "High-achieving professional juggling demanding career and personal wellness. Values efficiency, science-backed solutions, and premium quality. Willing to invest in health but skeptical of unproven claims.",
    painPoints: ["Poor Sleep", "Anxiety", "Burnout"],
    buyingTriggers: [
      "Peer recommendation",
      "Clinical study mention",
      "Risk-free trial offer",
    ],
    currentState:
      "Exhausted from chronic stress, relying on caffeine and screen time to cope. Sleep quality declining, affecting work performance.",
    desiredState:
      "Calm, rested, and performing at peak capacity. Falling asleep naturally and waking refreshed without grogginess.",
    objections: [
      "Does this actually work?",
      "I've tried everything already",
      "Is it safe long-term?",
    ],
  },
  {
    id: 2,
    name: "Wellness Mom",
    awarenessLevel: "solution-aware",
    demographics: {
      ageRange: "30-45",
      gender: "Female",
      location: "Suburban",
      income: "$50K-$90K",
    },
    psychographics:
      "Health-conscious parent who researches ingredients and prefers natural products for her family. Active in wellness communities and influenced by mom bloggers and holistic health advocates.",
    painPoints: ["Family Health", "Time Constraints", "Ingredient Safety"],
    buyingTriggers: [
      "Clean ingredient list",
      "Mom influencer endorsement",
      "Family-safe formulation",
    ],
    currentState:
      "Overwhelmed trying to find genuinely clean products among misleading 'natural' labels. Spending hours researching ingredients.",
    desiredState:
      "Confident in a trusted brand that delivers clean, effective wellness products for the whole family without hours of research.",
    objections: [
      "Are the ingredients truly clean?",
      "Is it safe for kids?",
      "Can I trust the sourcing?",
    ],
  },
  {
    id: 3,
    name: "Active Retiree",
    awarenessLevel: "most-aware",
    demographics: {
      ageRange: "55-70",
      gender: "Male/Female",
      location: "Mixed",
      income: "$40K-$80K",
    },
    psychographics:
      "Retired or semi-retired individual focused on maintaining an active lifestyle. Values longevity, mobility, and independence. Prefers straightforward messaging and proven results over trendy marketing.",
    painPoints: ["Joint Pain", "Mobility", "Energy"],
    buyingTriggers: [
      "Doctor recommendation",
      "Money-back guarantee",
      "Senior testimonials",
    ],
    currentState:
      "Experiencing age-related joint stiffness and declining energy that limits daily activities and hobbies they once enjoyed.",
    desiredState:
      "Moving freely, staying active with grandchildren, and maintaining independence well into later years.",
    objections: [
      "Will it interact with my medications?",
      "Is it worth the cost on a fixed income?",
      "How long until I see results?",
    ],
  },
  {
    id: 4,
    name: "Biohacker",
    awarenessLevel: "most-aware",
    demographics: {
      ageRange: "25-38",
      gender: "Male",
      location: "Urban",
      income: "$80K-$150K",
    },
    psychographics:
      "Performance-obsessed individual who tracks biomarkers, experiments with supplements, and follows cutting-edge health research. Willing to pay premium for measurable results and novel delivery methods.",
    painPoints: ["Optimization", "Performance", "Longevity"],
    buyingTriggers: [
      "Novel delivery mechanism",
      "Bioavailability data",
      "Biohacker community buzz",
    ],
    currentState:
      "Already supplementing but frustrated with low bioavailability of oral supplements. Seeking the next edge in performance optimization.",
    desiredState:
      "Optimized sleep, recovery, and cognitive performance backed by measurable biomarker improvements.",
    objections: [
      "Show me the absorption data",
      "How does this compare to competitors?",
      "Is there third-party testing?",
    ],
  },
];

const awarenessColors: Record<string, string> = {
  "unaware": "bg-muted text-muted-foreground",
  "problem-aware": "bg-destructive/10 text-destructive",
  "solution-aware": "bg-primary/10 text-primary",
  "product-aware": "bg-chart-2/10 text-chart-2",
  "most-aware": "bg-chart-1/10 text-chart-1",
};

export default function Avatars() {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-avatars">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1
                className="text-2xl font-bold font-heading tracking-tight"
                data-testid="page-title-avatars"
              >
                Avatars
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sampleAvatars.length} customer avatars
            </p>
          </div>
          <Button data-testid="button-new-avatar">
            <Plus className="h-4 w-4" />
            New Avatar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="avatars-grid">
          {sampleAvatars.map((avatar) => (
            <Card
              key={avatar.id}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedAvatar(avatar)}
              data-testid={`card-avatar-${avatar.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <CardTitle className="text-base" data-testid={`text-avatar-name-${avatar.id}`}>
                  {avatar.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={awarenessColors[avatar.awarenessLevel] || ""}
                  data-testid={`badge-awareness-${avatar.id}`}
                >
                  {avatar.awarenessLevel}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Age</span>
                    <span className="text-xs font-mono ml-auto">{avatar.demographics.ageRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Gender</span>
                    <span className="text-xs ml-auto">{avatar.demographics.gender}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Location</span>
                    <span className="text-xs ml-auto">{avatar.demographics.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Income</span>
                    <span className="text-xs font-mono ml-auto">{avatar.demographics.income}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Psychographics</p>
                  <p className="text-xs leading-relaxed line-clamp-2">{avatar.psychographics}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Pain Points</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {avatar.painPoints.map((pain) => (
                      <Badge
                        key={pain}
                        variant="outline"
                        className="text-[10px] no-default-hover-elevate"
                        data-testid={`badge-pain-${avatar.id}-${pain.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {pain}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Buying Triggers</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {avatar.buyingTriggers.map((trigger) => (
                      <Badge
                        key={trigger}
                        variant="secondary"
                        className="text-[10px] no-default-hover-elevate"
                        data-testid={`badge-trigger-${avatar.id}-${trigger.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Sheet
          open={!!selectedAvatar}
          onOpenChange={(open) => !open && setSelectedAvatar(null)}
        >
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-avatar-detail">
            {selectedAvatar && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-avatar-name">
                    {selectedAvatar.name}
                  </SheetTitle>
                  <SheetDescription>Full avatar profile and targeting details</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={awarenessColors[selectedAvatar.awarenessLevel] || ""}
                    >
                      {selectedAvatar.awarenessLevel}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Demographics</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Age Range</p>
                        <p className="text-sm font-mono" data-testid="text-detail-age">{selectedAvatar.demographics.ageRange}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Gender</p>
                        <p className="text-sm" data-testid="text-detail-gender">{selectedAvatar.demographics.gender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Location</p>
                        <p className="text-sm" data-testid="text-detail-location">{selectedAvatar.demographics.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Income</p>
                        <p className="text-sm font-mono" data-testid="text-detail-income">{selectedAvatar.demographics.income}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Psychographics</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-psychographics">
                      {selectedAvatar.psychographics}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Current State</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-current-state">
                      {selectedAvatar.currentState}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Desired State</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-desired-state">
                      {selectedAvatar.desiredState}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pain Points</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedAvatar.painPoints.map((pain) => (
                        <Badge key={pain} variant="outline" className="no-default-hover-elevate">
                          {pain}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Buying Triggers</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedAvatar.buyingTriggers.map((trigger) => (
                        <Badge key={trigger} variant="secondary" className="no-default-hover-elevate">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Common Objections</p>
                    <ul className="space-y-1.5">
                      {selectedAvatar.objections.map((objection) => (
                        <li key={objection} className="flex items-start gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0 mt-1.5" />
                          {objection}
                        </li>
                      ))}
                    </ul>
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
