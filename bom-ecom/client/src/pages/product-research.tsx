import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ProductCandidate, CompetitorIntel, TrendItem, ProductCriteriaCheck } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  ExternalLink,
  TrendingUp,
  Search,
  Target,
  ShieldCheck,
  BarChart3,
  Truck,
  Video,
  Eye,
  Flame,
  CheckCircle,
  XCircle,
  Globe,
  Swords,
  DollarSign,
  Percent,
  Star,
  MessageSquare,
  Pin,
  ClipboardCheck,
  Cpu,
  PackageSearch,
  Brain,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Activity,
} from "lucide-react";
import { SiInstagram, SiReddit, SiX } from "react-icons/si";

const SCORING_CRITERIA = [
  { key: "scoreViralTraction", label: "Viral Traction", icon: Flame, description: "Trending on TikTok/IG within last few weeks" },
  { key: "scoreSolvesRealProblem", label: "Solves Real Problem", icon: Target, description: "Genuine value, pain point addressed" },
  { key: "scoreUniqueness", label: "Uniqueness Factor", icon: Star, description: "Not found at local stores, novel design" },
  { key: "scoreCompetitorBenchmark", label: "Competitor Benchmark", icon: Swords, description: "Competitors exist but room to improve" },
  { key: "scoreHighDemand", label: "High Demand Validation", icon: TrendingUp, description: "Amazon sales, review volume confirm demand" },
  { key: "scoreTiktokTrend", label: "TikTok Trend Check", icon: Video, description: "Viral videos, #TikTokMadeMeBuyIt engagement" },
  { key: "scoreAdMetrics", label: "Ad Metrics Signal", icon: BarChart3, description: "1-5% CTR in ads library, moderate like counts" },
  { key: "scoreContentAvailability", label: "Content Availability", icon: Eye, description: "UGC, demo videos, reviews exist for repurposing" },
  { key: "scoreSupplierSpeed", label: "Supplier & Shipping", icon: Truck, description: "Reliable supplier, 7-10 day shipping feasible" },
] as const;

const BIG3_CRITERIA = [
  { key: "isViral", label: "Viral Now", description: "Trending in the last few weeks, not peaked 6+ months ago" },
  { key: "solvesProblem", label: "Solves a Problem", description: "Meaningful, not just novelty" },
  { key: "notSaturated", label: "Not Saturated", description: "Room to compete, not overly common" },
] as const;

const DECISION_COLORS: Record<string, string> = {
  APPROVE: "bg-green-500/10 text-green-500 border-green-500/20",
  TEST: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  WATCHLIST: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  REJECT: "bg-red-500/10 text-red-500 border-red-500/20",
};

function DecisionBadge({ decision }: { decision: string | null | undefined }) {
  if (!decision) return null;
  const cls = DECISION_COLORS[decision] || DECISION_COLORS.WATCHLIST;
  return <Badge className={`no-default-hover-elevate font-mono text-xs border ${cls}`}>{decision}</Badge>;
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-visible">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 80 ? "hsl(142, 76%, 36%)" : pct >= 65 ? "hsl(var(--primary))" : pct >= 50 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))",
          }}
        />
      </div>
      <span className="font-mono text-xs text-muted-foreground w-12 text-right">{score}/{max}</span>
    </div>
  );
}

function CategoryBar({ label, points, maxPoints }: { label: string; points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{points}/{maxPoints}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Big3Badge({ isViral, solvesProblem, notSaturated }: { isViral: boolean; solvesProblem: boolean; notSaturated: boolean }) {
  const passCount = [isViral, solvesProblem, notSaturated].filter(Boolean).length;
  if (passCount === 3) {
    return <Badge variant="default" className="no-default-hover-elevate font-mono text-xs" data-testid="badge-big3-pass">BIG 3 PASS</Badge>;
  }
  return <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs" data-testid="badge-big3-fail">{passCount}/3</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : status === "testing" ? "secondary" : "outline";
  return <Badge variant={variant} className="no-default-hover-elevate font-mono text-xs uppercase">{status}</Badge>;
}

function AddCandidateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState("");
  const [supplierCost, setSupplierCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/product-candidates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] });
      toast({ title: "Product candidate added" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add candidate", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      sourceUrl: sourceUrl.trim() || null,
      category: category.trim() || null,
      supplierCost: supplierCost ? parseFloat(supplierCost) : null,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="candidate-name">Product Name</Label>
        <Input id="candidate-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="K Beauty Pad" data-testid="input-candidate-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="candidate-url">Source URL</Label>
        <Input id="candidate-url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://tiktokshop.com/..." data-testid="input-candidate-url" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="candidate-category">Category</Label>
        <Input id="candidate-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Beauty, Health, Home..." data-testid="input-candidate-category" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="candidate-cost">Supplier Cost ($)</Label>
          <Input id="candidate-cost" type="number" step="0.01" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} placeholder="2.25" data-testid="input-candidate-cost" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="candidate-price">Selling Price ($)</Label>
          <Input id="candidate-price" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="29.99" data-testid="input-candidate-price" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="candidate-notes">Notes</Label>
        <Textarea id="candidate-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why this product caught your eye..." data-testid="input-candidate-notes" />
      </div>
      <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full" data-testid="button-submit-candidate">
        {createMutation.isPending ? "Adding..." : "Add Candidate"}
      </Button>
    </div>
  );
}

function ScoringPanel({ candidate, onClose }: { candidate: ProductCandidate; onClose: () => void }) {
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const s: Record<string, number> = {};
    SCORING_CRITERIA.forEach((c) => {
      s[c.key] = (candidate as any)[c.key] ?? 0;
    });
    return s;
  });

  const [big3, setBig3] = useState({
    isViral: candidate.isViral ?? false,
    solvesProblem: candidate.solvesProblem ?? false,
    notSaturated: candidate.notSaturated ?? false,
  });

  const [status, setStatus] = useState(candidate.status || "evaluating");

  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/product-candidates/${candidate.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] });
      toast({ title: "Scores saved" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...scores,
      ...big3,
      status,
      totalScore,
      supplierCost: candidate.supplierCost,
      sellingPrice: candidate.sellingPrice,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold mb-1">{candidate.name}</h3>
        <ScoreBar score={totalScore} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Validation Criteria (1-10)</h4>
        {SCORING_CRITERIA.map((criterion) => {
          const Icon = criterion.icon;
          return (
            <div key={criterion.key} className="space-y-1.5" data-testid={`score-criterion-${criterion.key}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{criterion.label}</span>
                </div>
                <span className="font-mono text-sm font-bold text-primary">{scores[criterion.key]}</span>
              </div>
              <p className="text-xs text-muted-foreground">{criterion.description}</p>
              <Slider
                value={[scores[criterion.key]]}
                onValueChange={([val]) => setScores((s) => ({ ...s, [criterion.key]: val }))}
                min={0}
                max={10}
                step={1}
                data-testid={`slider-${criterion.key}`}
              />
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Gut Check - Big 3</h4>
        {BIG3_CRITERIA.map((item) => {
          const checked = big3[item.key as keyof typeof big3];
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setBig3((b) => ({ ...b, [item.key]: !b[item.key as keyof typeof b] }))}
              data-testid={`toggle-big3-${item.key}`}
            >
              {checked ? (
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <div>
                <span className="text-sm font-medium">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger data-testid="select-candidate-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evaluating">Evaluating</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full" data-testid="button-save-scores">
        {updateMutation.isPending ? "Saving..." : "Save Scores"}
      </Button>
    </div>
  );
}

function CompetitorPanel({ candidate }: { candidate: ProductCandidate }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [compName, setCompName] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [adCount, setAdCount] = useState("");
  const [traffic, setTraffic] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [compNotes, setCompNotes] = useState("");

  const { data: competitors, isLoading } = useQuery<CompetitorIntel[]>({
    queryKey: ["/api/product-candidates", candidate.id, "competitors"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/product-candidates/${candidate.id}/competitors`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates", candidate.id, "competitors"] });
      toast({ title: "Competitor added" });
      setShowForm(false);
      setCompName("");
      setCompUrl("");
      setAdCount("");
      setTraffic("");
      setWeaknesses("");
      setCompNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/competitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates", candidate.id, "competitors"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Competitor Intel</h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} data-testid="button-add-competitor">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <Input placeholder="Competitor name" value={compName} onChange={(e) => setCompName(e.target.value)} data-testid="input-comp-name" />
            <Input placeholder="Website URL" value={compUrl} onChange={(e) => setCompUrl(e.target.value)} data-testid="input-comp-url" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad count" type="number" value={adCount} onChange={(e) => setAdCount(e.target.value)} data-testid="input-comp-ad-count" />
              <Input placeholder="Monthly traffic" value={traffic} onChange={(e) => setTraffic(e.target.value)} data-testid="input-comp-traffic" />
            </div>
            <Textarea placeholder="Weaknesses (bad site, weak ads, slow shipping...)" value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} data-testid="input-comp-weaknesses" />
            <Textarea placeholder="Notes" value={compNotes} onChange={(e) => setCompNotes(e.target.value)} data-testid="input-comp-notes" />
            <Button
              size="sm"
              onClick={() => addMutation.mutate({
                competitorName: compName.trim() || null,
                competitorUrl: compUrl.trim() || null,
                adCount: adCount ? parseInt(adCount) : null,
                monthlyTraffic: traffic.trim() || null,
                weaknesses: weaknesses.trim() || null,
                notes: compNotes.trim() || null,
              })}
              disabled={addMutation.isPending}
              data-testid="button-submit-competitor"
            >
              {addMutation.isPending ? "Saving..." : "Save Competitor"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-20 w-full" />}

      {competitors && competitors.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">No competitors tracked yet.</p>
      )}

      {competitors?.map((comp) => (
        <Card key={comp.id} data-testid={`card-competitor-${comp.id}`}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{comp.competitorName || "Unknown"}</p>
                {comp.competitorUrl && (
                  <a href={comp.competitorUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 truncate">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" /> {comp.competitorUrl}
                  </a>
                )}
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(comp.id)} data-testid={`button-delete-competitor-${comp.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {comp.adCount != null && (
                <span className="text-xs text-muted-foreground">{comp.adCount} ads</span>
              )}
              {comp.monthlyTraffic && (
                <span className="text-xs text-muted-foreground">{comp.monthlyTraffic} traffic/mo</span>
              )}
            </div>
            {comp.weaknesses && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Weaknesses:</p>
                <p className="text-xs text-muted-foreground">{comp.weaknesses}</p>
              </div>
            )}
            {comp.notes && (
              <p className="text-xs text-muted-foreground">{comp.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Consumer Intelligence Panel ─────────────────────────────────────────────

interface PainPoint { id: number; painPointText: string; rawQuote: string | null; source: string; frequency: number; emotionalIntensity: number | null; painCategory: string | null; triggerTypes: string[] | null; }
interface ConsumerPhrase { id: number; phrase: string; phraseType: string; emotionalIntensity: number | null; useableAs: string[] | null; frequency: number; }
interface CompetitorMsg { id: number; headline: string | null; primaryClaim: string | null; messagingAngle: string | null; weaknessIdentified: string | null; gapOpportunity: string | null; }

function ConsumerIntelPanel({ candidate }: { candidate: ProductCandidate }) {
  const { toast } = useToast();

  const { data: painPoints, isLoading: painLoading } = useQuery<PainPoint[]>({
    queryKey: ["/api/product-candidates", candidate.id, "pain-points"],
  });

  const { data: phrases, isLoading: phrasesLoading } = useQuery<ConsumerPhrase[]>({
    queryKey: ["/api/product-candidates", candidate.id, "phrases"],
  });

  const { data: messaging, isLoading: msgLoading } = useQuery<CompetitorMsg[]>({
    queryKey: ["/api/product-candidates", candidate.id, "competitor-messaging"],
  });

  const runIntelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/consumer-intel/scrape", {
        candidateId: candidate.id,
        productName: candidate.name,
        keywords: [candidate.name, candidate.category].filter(Boolean),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Consumer intel pipeline triggered", description: "Reddit + Amazon scrape started. Results in ~2 minutes." });
    },
  });

  const intensityColor = (i: number | null) => {
    if (!i) return "text-muted-foreground";
    if (i >= 8) return "text-red-500";
    if (i >= 6) return "text-orange-500";
    if (i >= 4) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Consumer Intelligence</h4>
        <Button size="sm" variant="outline" onClick={() => runIntelMutation.mutate()} disabled={runIntelMutation.isPending}>
          <Brain className="h-3 w-3 mr-1" /> {runIntelMutation.isPending ? "Running..." : "Run Intel Pipeline"}
        </Button>
      </div>

      <Tabs defaultValue="pain-points" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="pain-points" className="text-xs">Pain Points ({painPoints?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="phrases" className="text-xs">Phrases ({phrases?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="messaging" className="text-xs">Competitors ({messaging?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pain-points" className="space-y-2 mt-3">
          {painLoading && <Skeleton className="h-20" />}
          {painPoints?.length === 0 && <p className="text-xs text-muted-foreground">No pain points yet. Run the intel pipeline to extract them.</p>}
          {painPoints?.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{p.painPointText}</p>
                  <span className={`font-mono text-xs font-bold ${intensityColor(p.emotionalIntensity)}`}>{p.emotionalIntensity}/10</span>
                </div>
                {p.rawQuote && <p className="text-xs italic text-muted-foreground">"{p.rawQuote}"</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{p.source}</Badge>
                  {p.painCategory && <Badge variant="outline" className="text-xs">{p.painCategory}</Badge>}
                  <span className="text-xs text-muted-foreground">freq: {p.frequency}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="phrases" className="space-y-2 mt-3">
          {phrasesLoading && <Skeleton className="h-20" />}
          {phrases?.length === 0 && <p className="text-xs text-muted-foreground">No phrases extracted yet.</p>}
          {phrases?.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">"{p.phrase}"</p>
                  <Badge variant="outline" className="text-xs">{p.phraseType}</Badge>
                </div>
                {p.useableAs && p.useableAs.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {p.useableAs.map((u) => <Badge key={u} variant="secondary" className="text-xs">{u}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="messaging" className="space-y-2 mt-3">
          {msgLoading && <Skeleton className="h-20" />}
          {messaging?.length === 0 && <p className="text-xs text-muted-foreground">No competitor messaging analyzed yet.</p>}
          {messaging?.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-3 space-y-1">
                {m.headline && <p className="text-sm font-medium">{m.headline}</p>}
                {m.primaryClaim && <p className="text-xs text-muted-foreground">{m.primaryClaim}</p>}
                <div className="flex gap-2 flex-wrap">
                  {m.messagingAngle && <Badge variant="outline" className="text-xs">{m.messagingAngle}</Badge>}
                </div>
                {m.weaknessIdentified && (
                  <p className="text-xs"><span className="text-red-500 font-medium">Weakness:</span> {m.weaknessIdentified}</p>
                )}
                {m.gapOpportunity && (
                  <p className="text-xs"><span className="text-green-500 font-medium">Opportunity:</span> {m.gapOpportunity}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Creative Outputs Panel ──────────────────────────────────────────────────

interface CreativeOutput { id: number; outputType: string; content: string; contentStructured: any; targetEmotion: string | null; persuasionPrinciple: string | null; awarenessLevel: string | null; qualityScore: number | null; isApproved: boolean; }

function CreativeOutputsPanel({ candidate }: { candidate: ProductCandidate }) {
  const { toast } = useToast();

  const { data: outputs, isLoading } = useQuery<CreativeOutput[]>({
    queryKey: ["/api/product-candidates", candidate.id, "creative-outputs"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/consumer-intel/generate-creative", { candidateId: candidate.id });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Creative generation triggered", description: "Taglines, hooks, and frameworks generating..." });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (outputId: number) => {
      const res = await apiRequest("POST", `/api/product-candidates/${candidate.id}/creative-outputs/${outputId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates", candidate.id, "creative-outputs"] });
    },
  });

  const typeLabels: Record<string, string> = {
    tagline: "Taglines", hook: "Hooks", sound_byte: "Sound Bytes",
    pas_framework: "PAS Frameworks", before_after: "Before/After",
    objection_crusher: "Objection Crushers", mirror_phrase: "Mirror Phrases",
  };

  const grouped = (outputs || []).reduce((acc, o) => {
    const key = o.outputType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {} as Record<string, CreativeOutput[]>);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Creative Outputs</h4>
        <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <Sparkles className="h-3 w-3 mr-1" /> {generateMutation.isPending ? "Generating..." : "Generate Creative"}
        </Button>
      </div>

      {isLoading && <Skeleton className="h-40" />}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <p className="text-xs text-muted-foreground">No creative outputs yet. Run consumer intel first, then generate creative.</p>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="space-y-2">
          <h5 className="text-xs font-bold text-muted-foreground uppercase">{typeLabels[type] || type} ({items.length})</h5>
          {items.map((o) => (
            <Card key={o.id} className={o.isApproved ? "border-green-500/30" : ""}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm whitespace-pre-wrap">{o.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {o.awarenessLevel && <Badge variant="outline" className="text-xs">{o.awarenessLevel}</Badge>}
                  {o.targetEmotion && <Badge variant="outline" className="text-xs">{o.targetEmotion}</Badge>}
                  {o.persuasionPrinciple && <Badge variant="secondary" className="text-xs">{o.persuasionPrinciple}</Badge>}
                  {o.qualityScore && <span className="text-xs text-muted-foreground font-mono">Q:{o.qualityScore}/10</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard(o.content)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  {!o.isApproved && (
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-green-500" onClick={() => approveMutation.mutate(o.id)}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                  {o.isApproved && <Badge className="no-default-hover-elevate bg-green-500/10 text-green-500 text-xs">Approved</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Score Breakdown Panel ────────────────────────────────────────────────────

interface ScoreBreakdownData {
  score: number; scoringVersion: number; decision: string | null; big3Pass: boolean;
  primaryAngle: string | null; aiReasoning: string | null;
  categories: Array<{ key: string; label: string; points: number; maxPoints: number }>;
  breakdown: any; hardGates: any; lastScoredAt: string | null;
}

function EnhancedScoringPanel({ candidate, onClose }: { candidate: ProductCandidate; onClose: () => void }) {
  const { toast } = useToast();

  const { data: scoreData, isLoading } = useQuery<ScoreBreakdownData>({
    queryKey: ["/api/product-candidates", candidate.id, "score-breakdown"],
  });

  const scoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/product-candidates/${candidate.id}/score`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates", candidate.id, "score-breakdown"] });
      toast({ title: "Product scored", description: "100-point evaluation complete." });
    },
    onError: (err: Error) => {
      toast({ title: "Scoring failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{candidate.name}</h3>
          {scoreData?.decision && <DecisionBadge decision={scoreData.decision} />}
        </div>
        <ScoreBar score={scoreData?.score ?? candidate.totalScore ?? 0} max={100} />
        {scoreData?.big3Pass != null && (
          <Badge variant={scoreData.big3Pass ? "default" : "outline"} className="no-default-hover-elevate font-mono text-xs">
            Big-3 {scoreData.big3Pass ? "PASS" : "FAIL"}
          </Badge>
        )}
      </div>

      {scoreData?.primaryAngle && (
        <Card>
          <CardContent className="p-3 space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">AI Angle</p>
            <p className="text-sm font-medium">{scoreData.primaryAngle}</p>
            {scoreData.aiReasoning && <p className="text-xs text-muted-foreground">{scoreData.aiReasoning}</p>}
          </CardContent>
        </Card>
      )}

      <Separator />

      {isLoading && <Skeleton className="h-40" />}

      {scoreData?.categories && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Category Breakdown</h4>
          {scoreData.categories.map((cat) => (
            <CategoryBar key={cat.key} label={cat.label} points={cat.points} maxPoints={cat.maxPoints} />
          ))}
        </div>
      )}

      <Separator />

      <Button onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending} className="w-full">
        <Zap className="h-4 w-4 mr-1" /> {scoreMutation.isPending ? "Scoring..." : "Run 100-Point Scoring"}
      </Button>

      {scoreData?.lastScoredAt && (
        <p className="text-xs text-muted-foreground text-center">
          Last scored: {new Date(scoreData.lastScoredAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

const WINNING_CRITERIA = [
  { key: "solves_painful_problem", label: "Solves A Painful Problem" },
  { key: "new_unique_solution", label: "New/Unique Solution" },
  { key: "competitor_running_ads", label: "Competitor Actively Running Ads On FB" },
  { key: "high_traffic_or_amazon", label: "150k+ Visitors/SimilarWeb or 10k+ On Amazon" },
  { key: "high_profit_margins", label: "High Profit Margins ($25+)" },
  { key: "potential_for_upsells", label: "Potential For Upsells" },
  { key: "easy_to_ship", label: "Easy To Ship (Light)" },
  { key: "room_for_improvement", label: "Room For Improvement" },
] as const;

const PLATFORM_CONFIG = [
  { key: "kalodata" as const, label: "Kalodata", icon: TrendingUp, color: "text-primary" },
  { key: "instagram" as const, label: "Instagram", icon: SiInstagram, color: "text-pink-400" },
  { key: "reddit" as const, label: "Reddit", icon: SiReddit, color: "text-orange-400" },
  { key: "x" as const, label: "X (Twitter)", icon: SiX, color: "text-foreground" },
] as const;

function PlatformTrendCard({ platform, label, icon: Icon, color }: { platform: string; label: string; icon: any; color: string }) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data: items, isLoading } = useQuery<TrendItem[]>({
    queryKey: ["/api/trend-items", platform],
    queryFn: async () => {
      const res = await fetch(`/api/trend-items?platform=${platform}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { platform: string; title: string; url: string | null }) => {
      const res = await apiRequest("POST", "/api/trend-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trend-items", platform] });
      toast({ title: "Trend pinned" });
      setTitle("");
      setUrl("");
      setShowAdd(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trend-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trend-items", platform] });
    },
  });

  return (
    <Card data-testid={`card-platform-${platform}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="font-mono text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
              {items?.length ?? 0}
            </Badge>
            <Button size="icon" variant="ghost" onClick={() => setShowAdd(!showAdd)} data-testid={`button-add-trend-${platform}`}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="space-y-2">
            <Input
              placeholder="Trend title / product name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid={`input-trend-title-${platform}`}
            />
            <Input
              placeholder="URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid={`input-trend-url-${platform}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!title.trim()) return;
                addMutation.mutate({ platform, title: title.trim(), url: url.trim() || null });
              }}
              disabled={addMutation.isPending || !title.trim()}
              data-testid={`button-submit-trend-${platform}`}
            >
              {addMutation.isPending ? "Adding..." : "Pin Trend"}
            </Button>
          </div>
        )}

        {isLoading && <Skeleton className="h-8" />}

        {items && items.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground">No trends pinned yet.</p>
        )}

        <div className="space-y-1.5">
          {items?.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 group" data-testid={`trend-item-${item.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{item.title}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 truncate">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" /> Link
                  </a>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ visibility: "visible" }}
                onClick={() => deleteMutation.mutate(item.id)}
                data-testid={`button-delete-trend-${item.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendScrapingSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Trend Scraping Dashboard</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORM_CONFIG.map((p) => (
          <PlatformTrendCard key={p.key} platform={p.key} label={p.label} icon={p.icon} color={p.color} />
        ))}
      </div>
    </div>
  );
}

function CriteriaRow({ criterionKey, label, check, onUpdate }: {
  criterionKey: string;
  label: string;
  check: ProductCriteriaCheck | undefined;
  onUpdate: (data: { criterionKey: string; checked?: boolean; comment?: string | null }) => void;
}) {
  const isChecked = check?.checked ?? false;
  const [comment, setComment] = useState(check?.comment ?? "");

  return (
    <div className="space-y-1.5" data-testid={`criteria-item-${criterionKey}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isChecked}
          onCheckedChange={(val) => {
            onUpdate({ criterionKey, checked: !!val, comment: comment.trim() || null });
          }}
          data-testid={`checkbox-criteria-${criterionKey}`}
        />
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${isChecked ? "text-primary font-medium" : ""}`}>{label}</span>
        </div>
      </div>
      <Input
        placeholder="Notes..."
        className="text-xs h-7"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => {
          const newComment = comment.trim() || null;
          if (newComment !== (check?.comment ?? null)) {
            onUpdate({ criterionKey, checked: isChecked, comment: newComment });
          }
        }}
        data-testid={`input-criteria-comment-${criterionKey}`}
      />
    </div>
  );
}

function WinningCriteriaPanel({ candidate }: { candidate: ProductCandidate }) {
  const { toast } = useToast();

  const { data: checks, isLoading } = useQuery<ProductCriteriaCheck[]>({
    queryKey: ["/api/product-candidates", candidate.id, "criteria"],
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: { criterionKey: string; checked?: boolean; comment?: string | null }) => {
      const res = await apiRequest("POST", `/api/product-candidates/${candidate.id}/criteria`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates", candidate.id, "criteria"] });
    },
  });

  const getCheck = (key: string) => checks?.find((c) => c.criterionKey === key);
  const passCount = WINNING_CRITERIA.filter((crit) => getCheck(crit.key)?.checked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Winning Product Criteria</h4>
        <Badge variant={passCount >= 6 ? "default" : "outline"} className="no-default-hover-elevate font-mono text-xs">
          {passCount}/{WINNING_CRITERIA.length}
        </Badge>
      </div>

      {isLoading && <Skeleton className="h-40" />}

      <div className="space-y-3">
        {WINNING_CRITERIA.map((crit) => {
          const check = getCheck(crit.key);
          return (
            <CriteriaRow
              key={`${crit.key}-${check?.id ?? "new"}`}
              criterionKey={crit.key}
              label={crit.label}
              check={check}
              onUpdate={(data) => upsertMutation.mutate(data)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ProductResearch() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ProductCandidate | null>(null);
  const [sheetMode, setSheetMode] = useState<"scoring" | "enhanced-scoring" | "competitors" | "criteria" | "consumer-intel" | "creative-outputs" | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: candidates, isLoading } = useQuery<ProductCandidate[]>({
    queryKey: ["/api/product-candidates"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/product-candidates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] });
      toast({ title: "Candidate removed" });
      if (selectedCandidate) setSelectedCandidate(null);
    },
  });

  const scrapeTiktokMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/scrape/tiktok-trends", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered) {
        toast({ title: "TikTok trend scrape queued", description: "Check Ops page for status." });
      } else {
        toast({ title: "Webhook not configured", description: data.reason || "Set N8N_WEBHOOK_URL to enable." });
      }
    },
  });

  const scrapeCompetitorsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/scrape/competitor-ads", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered) {
        toast({ title: "Competitor ad scrape queued", description: "Check Ops page for status." });
      } else {
        toast({ title: "Webhook not configured", description: data.reason || "Set N8N_WEBHOOK_URL to enable." });
      }
    },
  });

  const scrapeProductMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/webhook/scrape/product-data", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered) {
        toast({ title: "Product data mining queued", description: "Check Ops page for status." });
      } else {
        toast({ title: "Webhook not configured", description: data.reason || "Set N8N_WEBHOOK_URL to enable." });
      }
    },
  });

  const scrapeIGTranscriptsMutation = useMutation({
    mutationFn: async (reelUrls: string[]) => {
      const res = await apiRequest("POST", "/api/webhook/scrape/ig-transcripts", { reelUrls });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered || data.success) {
        toast({ title: "IG Reel transcript scrape queued", description: "Pain points will appear in trends shortly." });
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/trend-items"] }), 15000);
      } else {
        toast({ title: "Webhook not configured", description: data.reason || "Set N8N_WEBHOOK_URL to enable." });
      }
    },
  });

  const scrapeIGCompetitorsMutation = useMutation({
    mutationFn: async ({ handles, candidateId }: { handles: string[]; candidateId?: number }) => {
      const res = await apiRequest("POST", "/api/webhook/scrape/ig-competitors", { handles, candidateId });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.triggered || data.success) {
        toast({ title: "Instagram competitor scrape queued", description: "Competitor intel will populate shortly." });
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] }), 15000);
      } else {
        toast({ title: "Webhook not configured", description: data.reason || "Set N8N_WEBHOOK_URL to enable." });
      }
    },
  });

  // --- Transcript & Gate Pipeline ---

  const { data: transcriptProducts } = useQuery<any[]>({
    queryKey: ["/api/transcripts/products"],
  });

  const scanDriveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transcripts/reprocess", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Drive scan triggered", description: "Checking for new transcripts in AI Com Product Research folder." });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/transcripts/products"] }), 10000);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (tpId: number) => {
      const res = await apiRequest("PATCH", `/api/transcripts/products/${tpId}/promote`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transcripts/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] });
      toast({ title: "Product promoted to candidate" });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("POST", `/api/candidates/${candidateId}/validate`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Gate validation started", description: "Running KaloData → Amazon → AliExpress → Meta Ads pipeline." });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/product-candidates"] }), 15000);
    },
  });

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    if (filterStatus === "all") return candidates;
    return candidates.filter((c) => c.status === filterStatus);
  }, [candidates, filterStatus]);

  const stats = useMemo(() => {
    if (!candidates) return { total: 0, approved: 0, evaluating: 0, avgScore: 0, bigThreePass: 0 };
    const approved = candidates.filter((c) => c.status === "approved").length;
    const evaluating = candidates.filter((c) => c.status === "evaluating").length;
    const scores = candidates.map((c) => c.totalScore ?? 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bigThreePass = candidates.filter((c) => c.isViral && c.solvesProblem && c.notSaturated).length;
    return { total: candidates.length, approved, evaluating, avgScore, bigThreePass };
  }, [candidates]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight" data-testid="page-title-product-research">Product Research</h1>
            <p className="text-sm text-muted-foreground mt-1">Find, evaluate, and score product candidates for your store</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-candidate">
                <Plus className="h-4 w-4 mr-1" /> Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product Candidate</DialogTitle>
              </DialogHeader>
              <AddCandidateDialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Candidates</p>
              <p className="text-2xl font-heading font-bold" data-testid="text-stat-total">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-heading font-bold text-primary" data-testid="text-stat-approved">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Evaluating</p>
              <p className="text-2xl font-heading font-bold" data-testid="text-stat-evaluating">{stats.evaluating}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
              <p className="text-2xl font-heading font-bold" data-testid="text-stat-avg-score">{stats.avgScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Big 3 Pass</p>
              <p className="text-2xl font-heading font-bold text-primary" data-testid="text-stat-big3">{stats.bigThreePass}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Scraping / Mining Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Card className="hover-elevate border-primary/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Scan Drive Folder</span>
                </div>
                <p className="text-xs text-muted-foreground">Extract products from AI Com transcripts in Google Drive.</p>
                <Button size="sm" variant="outline" onClick={() => scanDriveMutation.mutate()} disabled={scanDriveMutation.isPending} data-testid="button-scan-drive">
                  <Globe className="h-3 w-3 mr-1" /> {scanDriveMutation.isPending ? "Scanning..." : "Scan Now"}
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Scrape TikTok Trends</span>
                </div>
                <p className="text-xs text-muted-foreground">Pull trending products from TikTok Shop via Kalo Data or similar.</p>
                <Button size="sm" variant="outline" onClick={() => scrapeTiktokMutation.mutate()} disabled={scrapeTiktokMutation.isPending} data-testid="button-scrape-tiktok">
                  <Globe className="h-3 w-3 mr-1" /> {scrapeTiktokMutation.isPending ? "Running..." : "Run Scrape"}
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Pull Competitor Ads</span>
                </div>
                <p className="text-xs text-muted-foreground">Scrape Meta Ad Library for competitor creative counts and patterns.</p>
                <Button size="sm" variant="outline" onClick={() => scrapeCompetitorsMutation.mutate()} disabled={scrapeCompetitorsMutation.isPending} data-testid="button-scrape-competitors">
                  <Swords className="h-3 w-3 mr-1" /> {scrapeCompetitorsMutation.isPending ? "Running..." : "Run Scrape"}
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Mine Product Data</span>
                </div>
                <p className="text-xs text-muted-foreground">Pull Amazon reviews, pricing, SimilarWeb traffic for validation.</p>
                <Button size="sm" variant="outline" onClick={() => scrapeProductMutation.mutate()} disabled={scrapeProductMutation.isPending} data-testid="button-scrape-product">
                  <BarChart3 className="h-3 w-3 mr-1" /> {scrapeProductMutation.isPending ? "Running..." : "Run Mine"}
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">IG Reel Transcripts</span>
                </div>
                <p className="text-xs text-muted-foreground">Extract pain points &amp; buying signals from Instagram Reels via Apify.</p>
                <Button size="sm" variant="outline" onClick={() => scrapeIGTranscriptsMutation.mutate([])} disabled={scrapeIGTranscriptsMutation.isPending} data-testid="button-scrape-ig-transcripts">
                  <Globe className="h-3 w-3 mr-1" /> {scrapeIGTranscriptsMutation.isPending ? "Running..." : "Run Scrape"}
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">IG Competitor Intel</span>
                </div>
                <p className="text-xs text-muted-foreground">Scrape Instagram competitor profiles and posts via Apify.</p>
                <Button size="sm" variant="outline" onClick={() => scrapeIGCompetitorsMutation.mutate({ handles: [] })} disabled={scrapeIGCompetitorsMutation.isPending} data-testid="button-scrape-ig-competitors">
                  <Swords className="h-3 w-3 mr-1" /> {scrapeIGCompetitorsMutation.isPending ? "Running..." : "Run Scrape"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <TrendScrapingSection />

        {/* Transcript Products Section */}
        {transcriptProducts && transcriptProducts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Transcript Extractions</h2>
              <Badge variant="outline" className="ml-auto font-mono text-xs">
                {transcriptProducts.length} products found
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {transcriptProducts.map((tp: any) => (
                <Card key={tp.id} className="hover-elevate">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium truncate">{tp.productName}</h3>
                      <Badge variant="outline" className={`text-xs no-default-hover-elevate ${
                        tp.assessment === "investigate" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        tp.assessment === "skip" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {tp.assessment}
                      </Badge>
                    </div>
                    {tp.mentionContext && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{tp.mentionContext}"</p>
                    )}
                    {tp.reasoning && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{tp.reasoning}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs no-default-hover-elevate font-mono">
                        {tp.docTitle}
                      </Badge>
                      {tp.extractionConfidence != null && (
                        <span className="text-xs text-muted-foreground">{Math.round(tp.extractionConfidence * 100)}% conf</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!tp.candidateId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promoteMutation.mutate(tp.id)}
                          disabled={promoteMutation.isPending || tp.assessment === "skip"}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Promote to Candidate
                        </Button>
                      ) : (
                        <Badge variant="default" className="text-xs no-default-hover-elevate">
                          <CheckCircle className="h-3 w-3 mr-1" /> Candidate #{tp.candidateId}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider" data-testid="text-candidates-heading">Product Candidates</h2>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="evaluating">Evaluating</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        )}

        {!isLoading && filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {candidates && candidates.length > 0 ? "No candidates match this filter." : "No product candidates yet. Add one to start researching."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="candidates-grid">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover-elevate cursor-pointer" data-testid={`card-candidate-${candidate.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate" data-testid={`text-candidate-name-${candidate.id}`}>{candidate.name}</h3>
                    {candidate.category && (
                      <Badge variant="outline" className="no-default-hover-elevate mt-1 font-mono text-xs">{candidate.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusBadge status={candidate.status || "evaluating"} />
                  </div>
                </div>

                <ScoreBar score={candidate.totalScore ?? 0} max={candidate.scoringVersion === 2 ? 100 : 90} />

                <div className="flex items-center gap-2 flex-wrap">
                  {candidate.scoringVersion === 2 && candidate.decision ? (
                    <DecisionBadge decision={candidate.decision} />
                  ) : (
                    <Big3Badge isViral={candidate.isViral ?? false} solvesProblem={candidate.solvesProblem ?? false} notSaturated={candidate.notSaturated ?? false} />
                  )}
                  {candidate.big3Pass != null && candidate.scoringVersion === 2 && (
                    <Badge variant={candidate.big3Pass ? "default" : "outline"} className="no-default-hover-elevate font-mono text-xs">
                      Big-3 {candidate.big3Pass ? "PASS" : "FAIL"}
                    </Badge>
                  )}
                  {candidate.margin != null && candidate.margin > 0 && (
                    <Badge variant="outline" className="no-default-hover-elevate font-mono text-xs">
                      <Percent className="h-3 w-3 mr-0.5" />{Math.round(candidate.margin)}% margin
                    </Badge>
                  )}
                </div>

                {candidate.primaryAngle && (
                  <p className="text-xs text-primary italic line-clamp-1">{candidate.primaryAngle}</p>
                )}

                {(candidate.supplierCost != null || candidate.sellingPrice != null) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {candidate.supplierCost != null && <span><DollarSign className="h-3 w-3 inline" />{candidate.supplierCost.toFixed(2)} cost</span>}
                    {candidate.sellingPrice != null && <span><DollarSign className="h-3 w-3 inline" />{candidate.sellingPrice.toFixed(2)} sell</span>}
                  </div>
                )}

                {candidate.sourceUrl && (
                  <a
                    href={candidate.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" /> Source
                  </a>
                )}

                <Separator />

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/30"
                    onClick={(e) => { e.stopPropagation(); validateMutation.mutate(candidate.id); }}
                    disabled={validateMutation.isPending}
                    data-testid={`button-validate-${candidate.id}`}
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" /> Validate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setSheetMode("enhanced-scoring"); }}
                    data-testid={`button-score-${candidate.id}`}
                  >
                    <Zap className="h-3 w-3 mr-1" /> Score
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setSheetMode("consumer-intel"); }}
                    data-testid={`button-intel-${candidate.id}`}
                  >
                    <Brain className="h-3 w-3 mr-1" /> Intel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setSheetMode("creative-outputs"); }}
                    data-testid={`button-creative-${candidate.id}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Creative
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setSheetMode("competitors"); }}
                    data-testid={`button-competitors-${candidate.id}`}
                  >
                    <Swords className="h-3 w-3 mr-1" /> Comp
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(candidate.id); }}
                    data-testid={`button-delete-${candidate.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Sheet open={!!sheetMode && !!selectedCandidate} onOpenChange={(open) => { if (!open) { setSheetMode(null); setSelectedCandidate(null); } }}>
          <SheetContent className="overflow-y-auto" data-testid="sheet-detail">
            <SheetHeader>
              <SheetTitle className="font-heading text-sm">
                {sheetMode === "enhanced-scoring" ? "100-Point Scoring" :
                 sheetMode === "scoring" ? "Legacy Scoring" :
                 sheetMode === "consumer-intel" ? "Consumer Intelligence" :
                 sheetMode === "creative-outputs" ? "Creative Outputs" :
                 sheetMode === "criteria" ? "Winning Criteria" : "Competitor Intel"} - {selectedCandidate?.name}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {sheetMode === "enhanced-scoring" && selectedCandidate && (
                <EnhancedScoringPanel candidate={selectedCandidate} onClose={() => { setSheetMode(null); setSelectedCandidate(null); }} />
              )}
              {sheetMode === "scoring" && selectedCandidate && (
                <ScoringPanel candidate={selectedCandidate} onClose={() => { setSheetMode(null); setSelectedCandidate(null); }} />
              )}
              {sheetMode === "consumer-intel" && selectedCandidate && (
                <ConsumerIntelPanel candidate={selectedCandidate} />
              )}
              {sheetMode === "creative-outputs" && selectedCandidate && (
                <CreativeOutputsPanel candidate={selectedCandidate} />
              )}
              {sheetMode === "competitors" && selectedCandidate && (
                <CompetitorPanel candidate={selectedCandidate} />
              )}
              {sheetMode === "criteria" && selectedCandidate && (
                <WinningCriteriaPanel candidate={selectedCandidate} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
