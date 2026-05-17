import { useState } from "react";
import { Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";

interface Angle {
  id: number;
  name: string;
  type: string;
  linkedAvatars: string;
  usageCount: number;
  winRate: number;
  status: string;
  description: string;
  exampleHook: string;
  bestFor: string;
  notes: string;
}

const typeColors: Record<string, string> = {
  Transformation: "border-chart-1 text-chart-1",
  Pain: "border-destructive text-destructive",
  Identity: "border-chart-3 text-chart-3",
  Authority: "border-chart-2 text-chart-2",
  Urgency: "border-chart-4 text-chart-4",
  "Social Proof": "border-chart-5 text-chart-5",
  USP: "border-primary text-primary",
};

const sampleAngles: Angle[] = [
  {
    id: 1,
    name: "Sleep Quality Transformation",
    type: "Transformation",
    linkedAvatars: "Stressed Professional",
    usageCount: 24,
    winRate: 18,
    status: "active",
    description:
      "Focuses on the before/after transformation of sleep quality. Positions the product as the bridge between exhaustion and restful sleep.",
    exampleHook: "What if you could fall asleep in 15 minutes and wake up actually refreshed?",
    bestFor: "Top-of-funnel awareness campaigns targeting problem-aware audiences.",
    notes: "Performs best with video testimonials showing real sleep tracking data.",
  },
  {
    id: 2,
    name: "Pain Relief Without Pills",
    type: "Pain",
    linkedAvatars: "Active Retiree",
    usageCount: 19,
    winRate: 22,
    status: "active",
    description:
      "Agitates the pain of relying on pharmaceutical solutions with side effects. Positions topical magnesium as a natural alternative.",
    exampleHook: "Stop masking pain with pills that wreck your gut.",
    bestFor: "Mid-funnel consideration campaigns for solution-aware audiences.",
    notes: "Compliance note: avoid making direct drug comparison claims.",
  },
  {
    id: 3,
    name: "Natural Over Chemical",
    type: "Identity",
    linkedAvatars: "Wellness Mom",
    usageCount: 15,
    winRate: 14,
    status: "active",
    description:
      "Taps into the identity of being a 'natural wellness' advocate. Creates an us-vs-them dynamic against synthetic supplement brands.",
    exampleHook: "You read every label at the grocery store. Why not your supplements?",
    bestFor: "Brand-building campaigns targeting identity-driven buyers.",
    notes: "Pair with clean ingredient visuals and certification badges.",
  },
  {
    id: 4,
    name: "Doctor-Recommended",
    type: "Authority",
    linkedAvatars: "All",
    usageCount: 12,
    winRate: 20,
    status: "active",
    description:
      "Leverages medical authority and clinical credibility to overcome skepticism. Uses doctor endorsements and study references.",
    exampleHook: "Why thousands of doctors are recommending this $29 lotion to their patients.",
    bestFor: "Trust-building retargeting campaigns across all avatar segments.",
    notes: "Requires verified practitioner testimonials for compliance.",
  },
  {
    id: 5,
    name: "Limited Batch Available",
    type: "Urgency",
    linkedAvatars: "Biohacker",
    usageCount: 8,
    winRate: 11,
    status: "testing",
    description:
      "Creates scarcity through limited production runs and small-batch messaging. Appeals to the exclusivity mindset of early adopters.",
    exampleHook: "Only 500 units in this batch. Our high-potency formula sells out in 48 hours.",
    bestFor: "Bottom-of-funnel conversion campaigns with time-limited offers.",
    notes: "Must be backed by actual inventory constraints to maintain trust.",
  },
  {
    id: 6,
    name: "Before/After 30 Days",
    type: "Social Proof",
    linkedAvatars: "Stressed Professional",
    usageCount: 21,
    winRate: 25,
    status: "active",
    description:
      "Showcases real customer transformations over a 30-day period. Uses data-driven before/after comparisons with sleep scores and energy levels.",
    exampleHook: "I tracked my sleep for 30 days. The results shocked my doctor.",
    bestFor: "Retargeting and consideration-stage campaigns with proof-heavy creative.",
    notes: "Highest performing angle overall. Scale with UGC content.",
  },
  {
    id: 7,
    name: "Us vs Big Pharma",
    type: "Identity",
    linkedAvatars: "Wellness Mom, Active Retiree",
    usageCount: 10,
    winRate: 16,
    status: "draft",
    description:
      "Positions the brand as a grassroots alternative to big pharmaceutical companies. Taps into distrust of corporate healthcare.",
    exampleHook: "Big pharma doesn't want you to know about this ancient mineral.",
    bestFor: "Awareness campaigns for audiences with strong anti-establishment values.",
    notes: "Use carefully - avoid conspiracy tone. Focus on transparency and sourcing.",
  },
  {
    id: 8,
    name: "3x Better Absorption",
    type: "USP",
    linkedAvatars: "Biohacker",
    usageCount: 6,
    winRate: 9,
    status: "testing",
    description:
      "Leads with the unique selling proposition of transdermal absorption superiority. Uses bioavailability data and comparison charts.",
    exampleHook: "Why swallowing magnesium pills is like throwing money away.",
    bestFor: "Education-focused campaigns for most-aware, data-driven audiences.",
    notes: "Pair with absorption comparison infographics and third-party test results.",
  },
];

export default function Angles() {
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-angles">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6 text-primary" />
              <h1
                className="text-2xl font-bold font-heading tracking-tight"
                data-testid="page-title-angles"
              >
                Angles
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sampleAngles.length} persuasion angles
            </p>
          </div>
          <Button data-testid="button-new-angle">
            <Plus className="h-4 w-4" />
            New Angle
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Angle Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked Avatars</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleAngles.map((angle) => (
                  <TableRow
                    key={angle.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedAngle(angle)}
                    data-testid={`row-angle-${angle.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-angle-name-${angle.id}`}>
                      {angle.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`no-default-hover-elevate ${typeColors[angle.type] || ""}`}
                        data-testid={`badge-type-${angle.id}`}
                      >
                        {angle.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-linked-avatars-${angle.id}`}>
                      {angle.linkedAvatars}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-usage-${angle.id}`}>
                      {angle.usageCount}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-winrate-${angle.id}`}>
                      {angle.winRate}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={angle.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet
          open={!!selectedAngle}
          onOpenChange={(open) => !open && setSelectedAngle(null)}
        >
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-angle-detail">
            {selectedAngle && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-angle-name">
                    {selectedAngle.name}
                  </SheetTitle>
                  <SheetDescription>Angle details and performance data</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`no-default-hover-elevate ${typeColors[selectedAngle.type] || ""}`}
                    >
                      {selectedAngle.type}
                    </Badge>
                    <StatusBadge status={selectedAngle.status} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-description">
                      {selectedAngle.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Example Hook</p>
                    <p className="text-sm italic" data-testid="text-detail-hook">
                      "{selectedAngle.exampleHook}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Linked Avatars</p>
                    <p className="text-sm" data-testid="text-detail-avatars">
                      {selectedAngle.linkedAvatars}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Best For</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-best-for">
                      {selectedAngle.bestFor}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                    <p className="text-sm leading-relaxed" data-testid="text-detail-notes">
                      {selectedAngle.notes}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Usage Count</p>
                        <p className="font-mono font-bold" data-testid="text-detail-usage">
                          {selectedAngle.usageCount}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Win Rate</p>
                        <p className="font-mono font-bold" data-testid="text-detail-winrate">
                          {selectedAngle.winRate}%
                        </p>
                      </CardContent>
                    </Card>
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
