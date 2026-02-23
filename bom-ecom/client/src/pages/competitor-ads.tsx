/**
 * competitor-ads.tsx
 * filepath: bom-ecom/client/src/pages/competitor-ads.tsx
 *
 * Meta Ad Intelligence page — ported from meta-ad-monitor standalone app.
 * Uses PostgreSQL Ad Vault tables via /api/ad-vault/* endpoints.
 *
 * Features:
 *   - Brand management (add/delete DTC brands to monitor)
 *   - Trigger scrape jobs per brand or all brands
 *   - Ad grid with thumbnails and filters (brand, media type, date range, AI tags)
 *   - AI analysis tagging (5 categories: asset_type, visual_format, messaging_angle, hook_tactic, offer_type)
 *   - Bookmark/save winning ads
 *   - Evergreen tracker (ads in Top 10 for 4+ weeks)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search, Bookmark, BookmarkCheck, Cpu, Globe, TrendingUp,
  Plus, Trash2, Play, ExternalLink, Filter, X, Image as ImageIcon, Video,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdVaultBrand {
  id: number;
  brandName: string;
  websiteUrl?: string;
  fbPageUrl: string;
  pageId?: string;
  vertical?: string;
  status: string;
  lastScraped?: string;
  adCount: number;
  evergreenCount: number;
}

interface AdVaultAd {
  id: number;
  adId: string;
  brandId: number;
  rank?: number;
  creativeType?: string;
  creativeUrl?: string;
  storedCreativeUrl?: string;
  videoUrl?: string;
  adCopy?: string;
  headline?: string;
  ctaType?: string;
  startDate?: string;
  adLibraryLink?: string;
  aiAssetType?: string;
  aiVisualFormat?: string;
  aiMessagingAngle?: string;
  aiHookTactic?: string;
  aiOfferType?: string;
  firstSeen?: string;
  lastSeen?: string;
  weeksInTop10?: number;
  bookmarked?: boolean;
  brandName?: string;
  vertical?: string;
}

type ViewTab = "all" | "evergreen" | "bookmarked";

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_ASSET_TYPES = ["UGC", "High Production", "Static Image", "Animation", "Screen Recording"];
const AI_MESSAGING_ANGLES = ["Problem/Solution", "Social Proof", "FOMO", "Aspiration", "Value Proposition", "Transformation"];
const AI_HOOK_TACTICS = ["Pattern Interrupt", "Question", "Bold Claim", "Curiosity Gap", "Text Hook", "Relatable Scenario"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompetitorAds() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [filterMediaType, setFilterMediaType] = useState<string>("");
  const [filterAssetType, setFilterAssetType] = useState<string>("");
  const [filterAngle, setFilterAngle] = useState<string>("");
  const [filterHook, setFilterHook] = useState<string>("");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandUrl, setNewBrandUrl] = useState("");
  const [newBrandVertical, setNewBrandVertical] = useState("");

  const hasFilters = filterMediaType || filterAssetType || filterAngle || filterHook;

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: brands = [], isLoading: brandsLoading } = useQuery<AdVaultBrand[]>({
    queryKey: ["/api/ad-vault/brands"],
  });

  const buildAdsUrl = () => {
    if (activeTab === "bookmarked") return "/api/ad-vault/ads/bookmarked";
    if (activeTab === "evergreen") return `/api/ad-vault/analytics/evergreen?min_weeks=4`;

    const params = new URLSearchParams();
    if (selectedBrandIds.length > 0) {
      selectedBrandIds.forEach((id) => params.append("brand_ids", String(id)));
    }
    if (filterMediaType) params.set("media_type", filterMediaType);
    if (filterAssetType) params.set("ai_asset_type", filterAssetType);
    if (filterAngle) params.set("ai_messaging_angle", filterAngle);
    if (filterHook) params.set("ai_hook_tactic", filterHook);
    params.set("sort", "newest");
    params.set("limit", "100");
    return `/api/ad-vault/ads?${params}`;
  };

  const { data: ads = [], isLoading: adsLoading } = useQuery<AdVaultAd[]>({
    queryKey: ["ad-vault-ads", activeTab, selectedBrandIds, filterMediaType, filterAssetType, filterAngle, filterHook],
    queryFn: async () => {
      const res = await fetch(buildAdsUrl());
      return res.json();
    },
  });

  const { data: unanalyzedCount } = useQuery<{ count: number }>({
    queryKey: ["/api/ad-vault/ads/unanalyzed/count"],
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addBrandMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ad-vault/brands", {
        brand_name: newBrandName,
        ad_library_url: newBrandUrl,
        vertical: newBrandVertical || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/brands"] });
      toast({ title: "Brand added" });
      setShowAddBrand(false);
      setNewBrandName("");
      setNewBrandUrl("");
      setNewBrandVertical("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ad-vault/brands/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/brands"] });
      queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
      toast({ title: "Brand deleted" });
    },
  });

  const scrapeBrandMutation = useMutation({
    mutationFn: async (brandId: number) => {
      const res = await apiRequest("POST", `/api/ad-vault/scrape/brand/${brandId}`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Scrape started", description: data.mock ? "Mock mode" : `Job ${data.jobId} running` });
      // Poll for completion
      if (data.jobId && !data.mock) {
        const poll = setInterval(async () => {
          try {
            const res = await fetch(`/api/ad-vault/scrape/status/${data.jobId}`);
            const status = await res.json();
            if (status.status === "complete") {
              clearInterval(poll);
              queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
              queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/brands"] });
              toast({ title: "Scrape complete", description: `${status.resultCount} ads found` });
            } else if (status.status === "error") {
              clearInterval(poll);
              toast({ title: "Scrape failed", variant: "destructive" });
            }
          } catch { /* ignore */ }
        }, 5000);
      }
    },
  });

  const scrapeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ad-vault/scrape/all", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Scraping ${data.brandCount} brands`, description: "Check back in a few minutes" });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/brands"] });
      }, 60000);
    },
  });

  const analyzeAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      const res = await apiRequest("POST", `/api/ad-vault/ads/${adId}/analyze`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/ads/unanalyzed/count"] });
      toast({ title: "Ad analyzed", description: "AI tags applied" });
    },
  });

  const batchAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ad-vault/ads/analyze-batch", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Batch analysis started", description: `Processing ${data.total} ads in background` });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ad-vault/ads/unanalyzed/count"] });
      }, 30000);
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (adId: number) => {
      const res = await apiRequest("POST", `/api/ad-vault/ads/${adId}/bookmark`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-vault-ads"] });
    },
  });

  // ─── Helpers ────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setFilterMediaType("");
    setFilterAssetType("");
    setFilterAngle("");
    setFilterHook("");
  };

  const toggleBrand = (id: number) => {
    setSelectedBrandIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              Competitor Ad Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor top-performing Meta ads sorted by impressions &middot; {brands.length} brands &middot; {ads.length} ads
            </p>
          </div>
          <div className="flex gap-2">
            {(unanalyzedCount?.count || 0) > 0 && (
              <Button
                variant="outline" size="sm"
                onClick={() => batchAnalyzeMutation.mutate()}
                disabled={batchAnalyzeMutation.isPending}
              >
                <Cpu className="h-3.5 w-3.5 mr-1.5" />
                Analyze All ({unanalyzedCount?.count})
              </Button>
            )}
            <Button
              variant="outline" size="sm"
              onClick={() => scrapeAllMutation.mutate()}
              disabled={scrapeAllMutation.isPending}
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              {scrapeAllMutation.isPending ? "Scraping..." : "Scrape All"}
            </Button>
            <Button size="sm" onClick={() => setShowAddBrand(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Brand
            </Button>
          </div>
        </div>

        {/* Add Brand Form */}
        {showAddBrand && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Add New Brand</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddBrand(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input placeholder="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
                <Input placeholder="Ad Library URL (with view_all_page_id=)" value={newBrandUrl} onChange={(e) => setNewBrandUrl(e.target.value)} className="sm:col-span-2" />
                <Input placeholder="Vertical (e.g. Health)" value={newBrandVertical} onChange={(e) => setNewBrandVertical(e.target.value)} />
              </div>
              <Button size="sm" onClick={() => addBrandMutation.mutate()} disabled={!newBrandName || !newBrandUrl || addBrandMutation.isPending}>
                {addBrandMutation.isPending ? "Adding..." : "Add Brand & Start Scrape"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Brand Pills */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">Brands:</span>
            {brands.map((brand) => (
              <div
                key={brand.id}
                className={`group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                  selectedBrandIds.includes(brand.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                }`}
                onClick={() => toggleBrand(brand.id)}
              >
                <span>{brand.brandName}</span>
                <Badge variant="secondary" className="h-4 text-[10px] px-1">{brand.adCount}</Badge>
                {brand.evergreenCount > 0 && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrapeBrandMutation.mutate(brand.id);
                  }}
                  title="Scrape this brand"
                >
                  <Play className="h-3 w-3" />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${brand.brandName} and all ads?`)) deleteBrandMutation.mutate(brand.id);
                  }}
                  title="Delete brand"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
            {selectedBrandIds.length > 0 && (
              <button className="text-xs text-muted-foreground underline" onClick={() => setSelectedBrandIds([])}>
                Clear
              </button>
            )}
          </div>
        )}

        {/* View Tabs + Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "evergreen", "bookmarked"] as ViewTab[]).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="text-xs"
              >
                {tab === "all" && "All Ads"}
                {tab === "evergreen" && <><TrendingUp className="h-3 w-3 mr-1" /> Evergreen</>}
                {tab === "bookmarked" && <><BookmarkCheck className="h-3 w-3 mr-1" /> Saved</>}
              </Button>
            ))}
          </div>

          {activeTab === "all" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <select
                  className="text-xs bg-background border rounded px-2 py-1"
                  value={filterMediaType}
                  onChange={(e) => setFilterMediaType(e.target.value)}
                >
                  <option value="">All media</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <select
                className="text-xs bg-background border rounded px-2 py-1"
                value={filterAssetType}
                onChange={(e) => setFilterAssetType(e.target.value)}
              >
                <option value="">All types</option>
                {AI_ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                className="text-xs bg-background border rounded px-2 py-1"
                value={filterAngle}
                onChange={(e) => setFilterAngle(e.target.value)}
              >
                <option value="">All angles</option>
                {AI_MESSAGING_ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                className="text-xs bg-background border rounded px-2 py-1"
                value={filterHook}
                onChange={(e) => setFilterHook(e.target.value)}
              >
                <option value="">All hooks</option>
                {AI_HOOK_TACTICS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              {hasFilters && (
                <button className="text-xs text-muted-foreground underline" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ad Grid */}
        {adsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onAnalyze={() => analyzeAdMutation.mutate(ad.id)}
                onBookmark={() => bookmarkMutation.mutate(ad.id)}
                analyzing={analyzeAdMutation.isPending}
              />
            ))}
          </div>
        )}

        {!adsLoading && ads.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No ads found</p>
              <p className="text-xs mt-1">
                {brands.length === 0
                  ? "Add a brand and run a scrape to get started."
                  : "Try adjusting your filters or scraping new data."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Ad Card Component ──────────────────────────────────────────────────────

function AdCard({
  ad,
  onAnalyze,
  onBookmark,
  analyzing,
}: {
  ad: AdVaultAd;
  onAnalyze: () => void;
  onBookmark: () => void;
  analyzing: boolean;
}) {
  const isAnalyzed = !!ad.aiAssetType;
  const imageUrl = ad.storedCreativeUrl || ad.creativeUrl;

  return (
    <Card className="overflow-hidden group hover:ring-1 hover:ring-primary/30 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ad.headline || "Ad creative"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {ad.creativeType === "video" ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {ad.rank && ad.rank <= 3 && (
            <Badge className="bg-yellow-500/90 text-white text-[10px] h-5">#{ad.rank}</Badge>
          )}
          {ad.creativeType === "video" && (
            <Badge className="bg-blue-500/90 text-white text-[10px] h-5">
              <Video className="h-2.5 w-2.5 mr-0.5" />Video
            </Badge>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onBookmark}
            className="p-1 rounded bg-black/50 text-white hover:bg-black/70"
            title={ad.bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {ad.bookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-yellow-400" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          {ad.adLibraryLink && (
            <a
              href={ad.adLibraryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-black/50 text-white hover:bg-black/70"
              title="Open in Ad Library"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Evergreen badge */}
        {(ad.weeksInTop10 || 0) >= 4 && (
          <div className="absolute bottom-1.5 left-1.5">
            <Badge className="bg-green-600/90 text-white text-[10px] h-5">
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />{ad.weeksInTop10}w
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-2.5 space-y-1.5">
        {/* Brand + Format */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-muted-foreground font-medium truncate">{ad.brandName}</span>
          {ad.startDate && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{ad.startDate}</span>
          )}
        </div>

        {/* Headline */}
        {ad.headline && (
          <p className="text-xs font-medium line-clamp-1">{ad.headline}</p>
        )}

        {/* Ad copy preview */}
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {ad.adCopy || "No copy available"}
        </p>

        {/* AI Tags */}
        {isAnalyzed ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px] h-4 px-1">{ad.aiAssetType}</Badge>
            {ad.aiMessagingAngle && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">{ad.aiMessagingAngle}</Badge>
            )}
            {ad.aiHookTactic && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{ad.aiHookTactic}</Badge>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-6 text-[10px]"
            onClick={onAnalyze}
            disabled={analyzing}
          >
            <Cpu className="h-3 w-3 mr-1" />
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
