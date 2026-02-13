import { useState, useMemo } from "react";
import {
  Plus,
  Send,
  Calendar,
  Copy,
  Users,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  DollarSign,
  ImageIcon,
  Package,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { mockCampaigns, mockProducts } from "@/lib/mock-data";
import type { Campaign } from "@shared/schema";

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

const avatarPresets = [
  "Stressed professionals with poor sleep",
  "Mothers 30-45 exploring natural remedies",
  "Active adults with joint stiffness",
  "Recreational athletes seeking recovery",
  "Daily coffee drinkers open to alternatives",
  "Health optimizers tracking nootropics",
  "Cart abandoners",
  "Previous customers - upsell",
];

const geoOptions = ["US", "US + CA", "US + CA + UK", "US + CA + UK + AU", "Worldwide"];
const placementOptions = ["Facebook Feed", "Instagram Feed", "Instagram Stories", "Reels", "Audience Network", "All Placements"];

interface CreativeItem {
  recordId: string;
  headline: string;
  angle: string;
  avatar: string;
  awarenessLevels: string[];
  adType: string;
  status: string;
  enabled: boolean;
}

interface LocalAdSet {
  id: string;
  name: string;
  avatar: string;
  geo: string;
  ageRange: string;
  gender: string;
  placements: string[];
  dailyBudget: number;
  creatives: CreativeItem[];
  status: string;
}

function makeId() {
  return Math.random().toString(36).substring(2, 9);
}

function createBlankAdSet(): LocalAdSet {
  return {
    id: makeId(),
    name: "",
    avatar: "",
    geo: "US",
    ageRange: "25-54",
    gender: "All",
    placements: ["All Placements"],
    dailyBudget: 50,
    creatives: [],
    status: "draft",
  };
}

const campaignSetupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  productId: z.string().min(1, "Product is required"),
  offer: z.string().optional(),
  budget: z.string().min(1, "Budget is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type CampaignSetupValues = z.infer<typeof campaignSetupSchema>;

function getProductName(productId: number | null) {
  if (!productId) return "N/A";
  return mockProducts.find((p) => p.id === productId)?.name ?? "Unknown";
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "--";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ChecklistItem({ checked, label, testId }: { checked: boolean; label: string; testId: string }) {
  return (
    <div className="flex items-center gap-3 py-2" data-testid={testId}>
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      )}
      <span className={checked ? "text-sm" : "text-sm text-muted-foreground"}>{label}</span>
    </div>
  );
}

function WarningItem({ message, testId }: { message: string; testId: string }) {
  return (
    <div className="flex items-start gap-3 py-2" data-testid={testId}>
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <span className="text-sm text-amber-400">{message}</span>
    </div>
  );
}

export default function Campaigns() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState("setup");
  const [adSets, setAdSets] = useState<LocalAdSet[]>([createBlankAdSet()]);
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [creativesPanelAdSetId, setCreativesPanelAdSetId] = useState<string | null>(null);
  const [creativeSearch, setCreativeSearch] = useState("");
  const { toast } = useToast();

  const { data: conceptsData } = useQuery<AirtableAdConcept[]>({
    queryKey: ["/api/airtable/ad-concepts"],
  });

  const availableConcepts = useMemo(() => {
    if (!conceptsData) return [];
    return conceptsData.filter((c) => c.headline);
  }, [conceptsData]);

  const form = useForm<CampaignSetupValues>({
    resolver: zodResolver(campaignSetupSchema),
    defaultValues: {
      name: "",
      productId: "",
      offer: "",
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  function openDrawer() {
    form.reset();
    setAdSets([createBlankAdSet()]);
    setSelectedAdSetIds(new Set());
    setActiveTab("setup");
    setCreativesPanelAdSetId(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setCreativesPanelAdSetId(null);
  }

  function addAdSet() {
    setAdSets((prev) => [...prev, createBlankAdSet()]);
  }

  function duplicateSelected() {
    setAdSets((prev) => {
      const copies = prev
        .filter((a) => selectedAdSetIds.has(a.id))
        .map((a) => ({ ...a, id: makeId(), name: a.name ? `${a.name} (copy)` : "", creatives: a.creatives.map((c) => ({ ...c })) }));
      return [...prev, ...copies];
    });
    setSelectedAdSetIds(new Set());
  }

  function deleteSelected() {
    setAdSets((prev) => prev.filter((a) => !selectedAdSetIds.has(a.id)));
    setSelectedAdSetIds(new Set());
  }

  function generateFromAvatars() {
    const newSets = avatarPresets.map((avatar) => ({
      ...createBlankAdSet(),
      name: avatar.split(" ").slice(0, 3).join(" "),
      avatar,
    }));
    setAdSets((prev) => [...prev, ...newSets]);
    toast({ title: "Ad Sets Generated", description: `${avatarPresets.length} ad sets created from avatar presets.` });
  }

  function updateAdSet(id: string, field: keyof LocalAdSet, value: any) {
    setAdSets((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function toggleAdSetSelection(id: string) {
    setSelectedAdSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedAdSetIds.size === adSets.length) {
      setSelectedAdSetIds(new Set());
    } else {
      setSelectedAdSetIds(new Set(adSets.map((a) => a.id)));
    }
  }

  function togglePlacement(adSetId: string, placement: string) {
    setAdSets((prev) =>
      prev.map((a) => {
        if (a.id !== adSetId) return a;
        const has = a.placements.includes(placement);
        return { ...a, placements: has ? a.placements.filter((p) => p !== placement) : [...a.placements, placement] };
      }),
    );
  }

  function addCreativeToAdSet(adSetId: string, concept: AirtableAdConcept) {
    setAdSets((prev) =>
      prev.map((a) => {
        if (a.id !== adSetId) return a;
        if (a.creatives.some((c) => c.recordId === concept.recordId)) return a;
        const item: CreativeItem = {
          recordId: concept.recordId,
          headline: concept.headline,
          angle: concept.Angle || "",
          avatar: concept["Avatar Target"] || "",
          awarenessLevels: concept["Awareness Level"] || [],
          adType: concept["Ad Type"] || "",
          status: concept["Image Prompt Status"] || "",
          enabled: true,
        };
        return { ...a, creatives: [...a.creatives, item] };
      }),
    );
  }

  function removeCreativeFromAdSet(adSetId: string, recordId: string) {
    setAdSets((prev) =>
      prev.map((a) => {
        if (a.id !== adSetId) return a;
        return { ...a, creatives: a.creatives.filter((c) => c.recordId !== recordId) };
      }),
    );
  }

  function toggleCreativeEnabled(adSetId: string, recordId: string) {
    setAdSets((prev) =>
      prev.map((a) => {
        if (a.id !== adSetId) return a;
        return {
          ...a,
          creatives: a.creatives.map((c) =>
            c.recordId === recordId ? { ...c, enabled: !c.enabled } : c
          ),
        };
      }),
    );
  }

  function autoAssignCreatives(adSetId: string, topN: number) {
    const adSet = adSets.find((a) => a.id === adSetId);
    if (!adSet || !availableConcepts.length) return;

    const scored = availableConcepts
      .filter((c) => !adSet.creatives.some((cr) => cr.recordId === c.recordId))
      .map((c) => {
        let score = 0;
        if (adSet.avatar) {
          const avatarLower = adSet.avatar.toLowerCase();
          const conceptAvatar = (c["Avatar Target"] || "").toLowerCase();
          if (conceptAvatar && (avatarLower.includes(conceptAvatar.split(" ")[0]) || conceptAvatar.includes(avatarLower.split(" ")[0]))) {
            score += 2;
          }
        }
        const conceptAngle = (c.Angle || "").toLowerCase();
        if (conceptAngle) {
          const existingAngles = adSet.creatives.map((cr) => cr.angle.toLowerCase()).filter(Boolean);
          if (existingAngles.length === 0 || existingAngles.includes(conceptAngle)) {
            score += 1;
          }
        }
        if (c["Image Prompt Status"] === "Approved") score += 1;
        return { concept: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    scored.forEach(({ concept }) => addCreativeToAdSet(adSetId, concept));

    toast({
      title: "Creatives Auto-Assigned",
      description: `${scored.length} concept${scored.length !== 1 ? "s" : ""} added to "${adSet.name || "Ad Set"}" (scored by avatar + angle match)`,
    });
  }

  function duplicateStackToSelected(sourceAdSetId: string) {
    const sourceAdSet = adSets.find((a) => a.id === sourceAdSetId);
    if (!sourceAdSet) return;

    setAdSets((prev) =>
      prev.map((a) => {
        if (!selectedAdSetIds.has(a.id) || a.id === sourceAdSetId) return a;
        return { ...a, creatives: sourceAdSet.creatives.map((c) => ({ ...c })) };
      }),
    );

    toast({
      title: "Stack Duplicated",
      description: `Creative stack copied to ${selectedAdSetIds.size} ad set${selectedAdSetIds.size !== 1 ? "s" : ""}`,
    });
  }

  const panelAdSet = adSets.find((a) => a.id === creativesPanelAdSetId);

  const filteredAvailableConcepts = useMemo(() => {
    if (!creativeSearch.trim()) return availableConcepts;
    const q = creativeSearch.toLowerCase();
    return availableConcepts.filter(
      (c) =>
        c.headline?.toLowerCase().includes(q) ||
        c.Angle?.toLowerCase().includes(q) ||
        c["Avatar Target"]?.toLowerCase().includes(q) ||
        c["Ad Type"]?.toLowerCase().includes(q)
    );
  }, [availableConcepts, creativeSearch]);

  const totalDailyBudget = useMemo(() => adSets.reduce((sum, a) => sum + (a.dailyBudget || 0), 0), [adSets]);
  const totalCreatives = useMemo(() => {
    return adSets.reduce((sum, a) => sum + a.creatives.filter((c) => c.enabled).length, 0);
  }, [adSets]);

  const setupValid = form.formState.isValid || (form.getValues("name") && form.getValues("productId") && form.getValues("budget") && form.getValues("startDate"));
  const adSetsValid = adSets.length > 0 && adSets.every((a) => a.name && a.avatar && a.dailyBudget > 0);

  const validationWarnings = useMemo(() => {
    const warnings: { adSetName: string; message: string }[] = [];
    adSets.forEach((a) => {
      const enabledCreatives = a.creatives.filter((c) => c.enabled);
      if (enabledCreatives.length === 0) {
        warnings.push({ adSetName: a.name || "Unnamed", message: `"${a.name || "Unnamed"}" has no creatives assigned` });
      } else if (enabledCreatives.length < 3) {
        warnings.push({ adSetName: a.name || "Unnamed", message: `"${a.name || "Unnamed"}" has only ${enabledCreatives.length} creative${enabledCreatives.length !== 1 ? "s" : ""} (recommend 3+)` });
      }

      if (a.avatar && enabledCreatives.length > 0) {
        const avatarKeyword = a.avatar.toLowerCase().split(" ")[0];
        const mismatched = enabledCreatives.filter((c) => {
          if (!c.avatar) return false;
          return !c.avatar.toLowerCase().includes(avatarKeyword) && !avatarKeyword.includes(c.avatar.toLowerCase().split(" ")[0]);
        });
        if (mismatched.length > 0) {
          warnings.push({ adSetName: a.name || "Unnamed", message: `"${a.name || "Unnamed"}" has ${mismatched.length} creative${mismatched.length !== 1 ? "s" : ""} targeting different avatars` });
        }
      }

      if (enabledCreatives.length > 1) {
        const allLevels = enabledCreatives.flatMap((c) => c.awarenessLevels).filter(Boolean);
        const uniqueLevels = new Set(allLevels);
        if (uniqueLevels.size > 2) {
          warnings.push({
            adSetName: a.name || "Unnamed",
            message: `"${a.name || "Unnamed"}" mixes ${uniqueLevels.size} awareness levels (${Array.from(uniqueLevels).join(", ")}). Consider grouping by awareness stage.`,
          });
        }
      }
    });
    return warnings;
  }, [adSets]);

  async function handleLaunch() {
    const campaignValues = form.getValues();
    const valid = await form.trigger();
    if (!valid) {
      setActiveTab("setup");
      return;
    }

    const payload = {
      campaign: {
        name: campaignValues.name,
        productId: Number(campaignValues.productId),
        objective: "conversions",
        offer: campaignValues.offer || null,
        budget: Number(campaignValues.budget),
        startDate: campaignValues.startDate,
        endDate: campaignValues.endDate || null,
      },
      adSets: adSets.map((a) => ({
        name: a.name,
        avatar: a.avatar,
        geo: a.geo,
        ageRange: a.ageRange,
        gender: a.gender,
        placements: a.placements,
        dailyBudget: a.dailyBudget,
        creatives: a.creatives.filter((c) => c.enabled).map((c) => ({
          recordId: c.recordId,
          headline: c.headline,
          angle: c.angle,
          adType: c.adType,
        })),
        status: a.status,
      })),
    };

    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/webhook/campaign/launch", payload);
      const data = await res.json();
      toast({
        title: data.triggered ? "Campaign Sent" : "Not Configured",
        description: data.triggered
          ? "Campaign payload sent to n8n for orchestration."
          : "n8n webhook URL not configured. Payload logged.",
      });
      closeDrawer();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-campaigns">
              Campaign Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              {mockCampaigns.length} campaigns
            </p>
          </div>
          <Button onClick={openDrawer} data-testid="button-new-campaign">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead>Dates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCampaigns.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedCampaign(campaign)}
                    data-testid={`row-campaign-${campaign.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>
                      {campaign.name}
                    </TableCell>
                    <TableCell>{getProductName(campaign.productId)}</TableCell>
                    <TableCell className="font-mono" data-testid={`text-campaign-budget-${campaign.id}`}>
                      {formatCurrency(campaign.budget)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status ?? "draft"} />
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-campaign-spend-${campaign.id}`}>
                      {formatCurrency(campaign.spend)}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-campaign-roas-${campaign.id}`}>
                      {campaign.roas != null ? `${campaign.roas}x` : "--"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {campaign.startDate ?? "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex" data-testid="drawer-new-campaign">
            <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
            <div className="relative ml-auto w-full max-w-4xl bg-background border-l flex flex-col h-full animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between gap-4 p-4 border-b shrink-0">
                <div>
                  <h2 className="text-lg font-bold font-heading" data-testid="text-drawer-title">New Campaign</h2>
                  <p className="text-xs text-muted-foreground">Objective: Conversions (default)</p>
                </div>
                <Button size="icon" variant="ghost" onClick={closeDrawer} data-testid="button-close-drawer">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                <div className="border-b px-4 shrink-0">
                  <TabsList className="bg-transparent h-auto p-0 gap-0">
                    <TabsTrigger
                      value="setup"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
                      data-testid="tab-setup"
                    >
                      1. Campaign Setup
                    </TabsTrigger>
                    <TabsTrigger
                      value="adsets"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
                      data-testid="tab-adsets"
                    >
                      2. Ad Sets
                    </TabsTrigger>
                    <TabsTrigger
                      value="review"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
                      data-testid="tab-review"
                    >
                      3. Review & Launch
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Campaign Setup */}
                <TabsContent value="setup" className="flex-1 overflow-auto m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 max-w-xl space-y-5">
                      <Form {...form}>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. PalmAura Spring Push" {...field} data-testid="input-campaign-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-product">
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {mockProducts.map((product) => (
                                      <SelectItem key={product.id} value={String(product.id)}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="offer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Offer (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Buy 2 Get 1 Free" {...field} data-testid="input-offer" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Campaign Budget ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="10000" {...field} data-testid="input-budget" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-start-date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date (optional)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-end-date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Form>
                      <div className="pt-2">
                        <Button onClick={() => setActiveTab("adsets")} data-testid="button-next-adsets">
                          Next: Ad Sets
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 2: Ad Sets */}
                <TabsContent value="adsets" className="flex-1 overflow-auto m-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 p-4 border-b flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" onClick={addAdSet} data-testid="button-add-adset">
                          <Plus className="h-3.5 w-3.5" />
                          Add Ad Set
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={duplicateSelected}
                          disabled={selectedAdSetIds.size === 0}
                          data-testid="button-duplicate-adset"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={deleteSelected}
                          disabled={selectedAdSetIds.size === 0}
                          data-testid="button-delete-adset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                        <Button size="sm" variant="secondary" onClick={generateFromAvatars} data-testid="button-generate-from-avatars">
                          <Users className="h-3.5 w-3.5" />
                          Generate from Avatars
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground" data-testid="text-adset-count">
                        {adSets.length} ad set{adSets.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="min-w-[900px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={adSets.length > 0 && selectedAdSetIds.size === adSets.length}
                                  onCheckedChange={toggleSelectAll}
                                  data-testid="checkbox-select-all-adsets"
                                />
                              </TableHead>
                              <TableHead className="min-w-[130px]">Ad Set Name</TableHead>
                              <TableHead className="min-w-[160px]">Avatar / Audience</TableHead>
                              <TableHead className="min-w-[80px]">Geo</TableHead>
                              <TableHead className="min-w-[70px]">Age</TableHead>
                              <TableHead className="min-w-[70px]">Gender</TableHead>
                              <TableHead className="min-w-[120px]">Placements</TableHead>
                              <TableHead className="min-w-[80px]">Daily $</TableHead>
                              <TableHead className="min-w-[100px]">Creatives</TableHead>
                              <TableHead className="min-w-[80px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {adSets.map((adSet) => {
                              const enabledCount = adSet.creatives.filter((c) => c.enabled).length;
                              return (
                                <TableRow key={adSet.id} data-testid={`row-adset-${adSet.id}`}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedAdSetIds.has(adSet.id)}
                                      onCheckedChange={() => toggleAdSetSelection(adSet.id)}
                                      data-testid={`checkbox-adset-${adSet.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={adSet.name}
                                      onChange={(e) => updateAdSet(adSet.id, "name", e.target.value)}
                                      placeholder="Ad set name"
                                      className="h-8 text-xs"
                                      data-testid={`input-adset-name-${adSet.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select value={adSet.avatar} onValueChange={(v) => updateAdSet(adSet.id, "avatar", v)}>
                                      <SelectTrigger className="h-8 text-xs" data-testid={`select-adset-avatar-${adSet.id}`}>
                                        <SelectValue placeholder="Select avatar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {avatarPresets.map((a) => (
                                          <SelectItem key={a} value={a} className="text-xs">
                                            {a}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select value={adSet.geo} onValueChange={(v) => updateAdSet(adSet.id, "geo", v)}>
                                      <SelectTrigger className="h-8 text-xs" data-testid={`select-adset-geo-${adSet.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {geoOptions.map((g) => (
                                          <SelectItem key={g} value={g} className="text-xs">
                                            {g}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={adSet.ageRange}
                                      onChange={(e) => updateAdSet(adSet.id, "ageRange", e.target.value)}
                                      className="h-8 text-xs w-20"
                                      data-testid={`input-adset-age-${adSet.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select value={adSet.gender} onValueChange={(v) => updateAdSet(adSet.id, "gender", v)}>
                                      <SelectTrigger className="h-8 text-xs" data-testid={`select-adset-gender-${adSet.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {placementOptions.map((p) => (
                                        <Badge
                                          key={p}
                                          variant={adSet.placements.includes(p) ? "default" : "outline"}
                                          className="text-[9px] cursor-pointer no-default-hover-elevate"
                                          onClick={() => togglePlacement(adSet.id, p)}
                                          data-testid={`badge-placement-${adSet.id}-${p.replace(/\s+/g, "-").toLowerCase()}`}
                                        >
                                          {p.replace("Facebook ", "FB ").replace("Instagram ", "IG ").replace("Audience Network", "AN")}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={adSet.dailyBudget}
                                      onChange={(e) => updateAdSet(adSet.id, "dailyBudget", Number(e.target.value))}
                                      className="h-8 text-xs w-20 font-mono"
                                      data-testid={`input-adset-budget-${adSet.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs gap-1.5"
                                      onClick={() => setCreativesPanelAdSetId(adSet.id)}
                                      data-testid={`button-creatives-${adSet.id}`}
                                    >
                                      <Package className="h-3.5 w-3.5" />
                                      <span className="font-mono font-medium" data-testid={`text-creative-count-${adSet.id}`}>
                                        {enabledCount}
                                      </span>
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <Select value={adSet.status} onValueChange={(v) => updateAdSet(adSet.id, "status", v)}>
                                      <SelectTrigger className="h-8 text-xs" data-testid={`select-adset-status-${adSet.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>

                    <div className="flex items-center justify-between gap-4 p-4 border-t shrink-0 flex-wrap">
                      <Button variant="outline" onClick={() => setActiveTab("setup")} data-testid="button-back-setup">
                        Back
                      </Button>
                      <Button onClick={() => setActiveTab("review")} data-testid="button-next-review">
                        Next: Review
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Review & Launch */}
                <TabsContent value="review" className="flex-1 overflow-auto m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6 max-w-2xl">
                      <div>
                        <h3 className="text-sm font-heading font-semibold mb-3">Campaign Summary</h3>
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-medium" data-testid="review-campaign-name">{form.getValues("name") || "--"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Product</span>
                              <span className="font-medium" data-testid="review-campaign-product">
                                {form.getValues("productId") ? getProductName(Number(form.getValues("productId"))) : "--"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Objective</span>
                              <span className="font-medium">Conversions</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Offer</span>
                              <span className="font-medium" data-testid="review-campaign-offer">{form.getValues("offer") || "--"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Budget</span>
                              <span className="font-mono font-medium" data-testid="review-campaign-budget">
                                {form.getValues("budget") ? `$${Number(form.getValues("budget")).toLocaleString()}` : "--"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Dates</span>
                              <span className="font-mono text-xs" data-testid="review-campaign-dates">
                                {form.getValues("startDate") || "--"} to {form.getValues("endDate") || "Ongoing"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-sm font-heading font-semibold mb-3">Computed Totals</h3>
                        <div className="grid grid-cols-3 gap-3">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">Total Daily Budget</p>
                              <p className="text-xl font-bold font-mono mt-0.5" data-testid="review-total-daily-budget">
                                ${totalDailyBudget.toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Layers className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">Ad Sets</p>
                              <p className="text-xl font-bold font-mono mt-0.5" data-testid="review-adset-count">
                                {adSets.length}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <ImageIcon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">Total Creatives</p>
                              <p className="text-xl font-bold font-mono mt-0.5" data-testid="review-creatives-count">
                                {totalCreatives}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {validationWarnings.length > 0 && (
                        <div>
                          <h3 className="text-sm font-heading font-semibold mb-3">Warnings</h3>
                          <Card>
                            <CardContent className="p-4">
                              {validationWarnings.map((w, i) => (
                                <WarningItem
                                  key={i}
                                  message={w.message}
                                  testId={`warning-${i}`}
                                />
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-heading font-semibold mb-3">Launch Checklist</h3>
                        <Card>
                          <CardContent className="p-4">
                            <ChecklistItem
                              checked={!!form.getValues("name") && !!form.getValues("productId")}
                              label="Campaign name and product selected"
                              testId="checklist-name-product"
                            />
                            <ChecklistItem
                              checked={!!form.getValues("budget")}
                              label="Budget set"
                              testId="checklist-budget"
                            />
                            <ChecklistItem
                              checked={!!form.getValues("startDate")}
                              label="Start date configured"
                              testId="checklist-start-date"
                            />
                            <ChecklistItem
                              checked={adSets.length > 0 && adSets.every((a) => a.name !== "")}
                              label={`All ${adSets.length} ad sets named`}
                              testId="checklist-adsets-named"
                            />
                            <ChecklistItem
                              checked={adSets.every((a) => a.avatar !== "")}
                              label="All ad sets have an avatar assigned"
                              testId="checklist-avatars-assigned"
                            />
                            <ChecklistItem
                              checked={totalCreatives > 0}
                              label={`Creatives assigned (${totalCreatives} total)`}
                              testId="checklist-creatives"
                            />
                            <ChecklistItem
                              checked={adSets.every((a) => a.creatives.filter((c) => c.enabled).length >= 3)}
                              label="All ad sets have 3+ creatives"
                              testId="checklist-creatives-sufficient"
                            />
                            <ChecklistItem
                              checked={validationWarnings.length === 0}
                              label="No validation warnings"
                              testId="checklist-no-warnings"
                            />
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex items-center gap-3 pt-2 flex-wrap">
                        <Button variant="outline" onClick={() => setActiveTab("adsets")} data-testid="button-back-adsets">
                          Back
                        </Button>
                        <Button onClick={handleLaunch} disabled={sending} className="flex-1" data-testid="button-send-to-n8n">
                          <Send className="h-4 w-4" />
                          {sending ? "Sending..." : "Send to n8n"}
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Creative Stack Side Panel */}
            {panelAdSet && (
              <div
                className="fixed top-0 right-0 w-full max-w-md h-full bg-background border-l z-[60] flex flex-col animate-in slide-in-from-right duration-200"
                data-testid="panel-creative-stack"
              >
                <div className="flex items-center justify-between gap-3 p-4 border-b shrink-0">
                  <div>
                    <h3 className="font-heading font-semibold text-sm" data-testid="text-panel-title">
                      Creative Stack
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {panelAdSet.name || "Unnamed ad set"} - {panelAdSet.creatives.filter((c) => c.enabled).length} active
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCreativesPanelAdSetId(null)}
                    data-testid="button-close-creative-panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 p-3 border-b shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => autoAssignCreatives(panelAdSet.id, 5)}
                    data-testid="button-auto-assign"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Auto-assign Top 5
                  </Button>
                  {selectedAdSetIds.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateStackToSelected(panelAdSet.id)}
                      data-testid="button-duplicate-stack"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy to Selected
                    </Button>
                  )}
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-4">
                    {panelAdSet.creatives.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Assigned ({panelAdSet.creatives.length})
                        </p>
                        {panelAdSet.creatives.map((creative) => (
                          <div
                            key={creative.recordId}
                            className="flex items-start gap-2 p-2 rounded-md border bg-card"
                            data-testid={`creative-assigned-${creative.recordId}`}
                          >
                            <Checkbox
                              checked={creative.enabled}
                              onCheckedChange={() => toggleCreativeEnabled(panelAdSet.id, creative.recordId)}
                              className="mt-0.5 shrink-0"
                              data-testid={`checkbox-creative-${creative.recordId}`}
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className={`text-xs font-medium leading-snug truncate ${!creative.enabled ? "text-muted-foreground line-through" : ""}`}>
                                {creative.headline}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {creative.angle && (
                                  <Badge variant="outline" className="text-[10px] no-default-hover-elevate">
                                    {creative.angle}
                                  </Badge>
                                )}
                                {creative.avatar && (
                                  <Badge variant="outline" className="text-[10px] no-default-hover-elevate bg-sky-500/15 text-sky-400 border-sky-500/30">
                                    {creative.avatar}
                                  </Badge>
                                )}
                                {creative.status && (
                                  <StatusBadge status={creative.status} className="text-[10px]" />
                                )}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0"
                              onClick={() => removeCreativeFromAdSet(panelAdSet.id, creative.recordId)}
                              data-testid={`button-remove-creative-${creative.recordId}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Add from Creative Lab
                      </p>
                      <Input
                        placeholder="Search concepts..."
                        value={creativeSearch}
                        onChange={(e) => setCreativeSearch(e.target.value)}
                        className="h-8 text-xs"
                        data-testid="input-creative-search"
                      />
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {filteredAvailableConcepts.slice(0, 20).map((concept) => {
                          const alreadyAdded = panelAdSet.creatives.some((c) => c.recordId === concept.recordId);
                          return (
                            <div
                              key={concept.recordId}
                              className="flex items-center gap-2 p-2 rounded-md border hover-elevate cursor-pointer"
                              onClick={() => !alreadyAdded && addCreativeToAdSet(panelAdSet.id, concept)}
                              data-testid={`concept-add-${concept.recordId}`}
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-medium truncate">
                                  {concept.headline}
                                </p>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {concept.Angle && (
                                    <span className="text-[9px] text-muted-foreground">{concept.Angle}</span>
                                  )}
                                  {concept["Avatar Target"] && (
                                    <span className="text-[9px] text-muted-foreground">/ {concept["Avatar Target"]}</span>
                                  )}
                                </div>
                              </div>
                              {alreadyAdded ? (
                                <Badge variant="outline" className="text-[9px] no-default-hover-elevate bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                  Added
                                </Badge>
                              ) : (
                                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          );
                        })}
                        {filteredAvailableConcepts.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No concepts available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Campaign Detail Sheet (existing) */}
        <Sheet open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
          <SheetContent data-testid="sheet-campaign-detail">
            {selectedCampaign && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-campaign-name">
                    {selectedCampaign.name}
                  </SheetTitle>
                  <SheetDescription>Campaign details and performance metrics</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={selectedCampaign.status ?? "draft"} />
                      <Badge variant="outline" className="no-default-hover-elevate">
                        Conversions
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getProductName(selectedCampaign.productId)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Offer</p>
                    <p className="text-sm" data-testid="text-detail-offer">{selectedCampaign.offer ?? "--"}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Audience</p>
                    <p className="text-sm" data-testid="text-detail-audience">{selectedCampaign.targetAudience ?? "--"}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Dates</p>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span data-testid="text-detail-dates">
                        {selectedCampaign.startDate ?? "--"} - {selectedCampaign.endDate ?? "Ongoing"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Budget</p>
                        <p className="font-mono font-bold" data-testid="text-detail-budget">
                          {formatCurrency(selectedCampaign.budget)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Spend</p>
                        <p className="font-mono font-bold" data-testid="text-detail-spend">
                          {formatCurrency(selectedCampaign.spend)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">ROAS</p>
                        <p className="font-mono font-bold" data-testid="text-detail-roas">
                          {selectedCampaign.roas != null ? `${selectedCampaign.roas}x` : "--"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">CAC</p>
                        <p className="font-mono font-bold" data-testid="text-detail-cac">
                          {selectedCampaign.cac != null ? `$${selectedCampaign.cac}` : "--"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">CTR</p>
                        <p className="font-mono font-bold" data-testid="text-detail-ctr">
                          {selectedCampaign.ctr != null ? `${selectedCampaign.ctr}%` : "--"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">CVR</p>
                        <p className="font-mono font-bold" data-testid="text-detail-cvr">
                          {selectedCampaign.cvr != null ? `${selectedCampaign.cvr}%` : "--"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedCampaign.notes && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-detail-notes">
                        {selectedCampaign.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
