/**
 * competitor-ads.tsx
 * filepath: bom-ecom/client/src/pages/competitor-ads.tsx
 *
 * Meta Ad Intelligence page — merged from meta-ad-monitor standalone app.
 * Displays competitor ads scraped from Meta Ad Library via Apify actor JJghSZmShuco4j9gJ.
 * Data lives in Airtable base appTXrjxnh0XRggsp (3 tables: Brands, Ad Fetch Jobs, Ads).
 *
 * Features:
 *   - Brand management (add/delete DTC brands to monitor)
 *   - Trigger scrape jobs per brand or all brands
 *   - Ad grid with filters (brand, vertical, media type, date range, AI tags)
 *   - AI analysis tagging (5 categories: asset_type, visual_format, messaging_angle, hook_tactic, offer_type)
 *   - Bookmark/save winning ads
 *   - Evergreen tracker (ads in Top 10 for 4+ weeks)
 */

// TODO: Implement this page fully in Phase 3

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// TODO: Import Select, Dialog, Tabs from shadcn/ui
// TODO: Import icons (TrendingUp, Search, Swords, BarChart3, Bookmark, Globe, Cpu)

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetaBrand {
  id: string;
  brand_name: string;
  facebook_page_url: string;
  ad_count?: number;
  evergreen_count?: number;
  last_scraped?: string;
}

interface MetaAd {
  id: string;
  ad_archive_id: string;
  page_name: string;
  start_date: string;
  platform: "facebook" | "instagram";
  display_format: string;
  media_url?: string;
  ad_text?: string;
  text_hook?: string;
  hook_excerpt?: string;
  visual_notes?: string;
  status: "Not Analyzed" | "Analyzing" | "Analyzed";
  is_active: boolean;
  weeks_in_top10?: number;
  // AI tags
  ai_asset_type?: string;
  ai_visual_format?: string;
  ai_messaging_angle?: string;
  ai_hook_tactic?: string;
  ai_offer_type?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompetitorAds() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "Analyzed" | "Not Analyzed">("all");

  // TODO: Add filter state for media type, date range, AI tag categories

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: brands, isLoading: brandsLoading } = useQuery<MetaBrand[]>({
    queryKey: ["/api/meta-brands"],
  });

  const { data: ads, isLoading: adsLoading } = useQuery<MetaAd[]>({
    queryKey: ["/api/meta-ads", selectedBrandId, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBrandId) params.set("brandId", selectedBrandId);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/meta-ads?${params}`);
      return res.json();
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const scrapeOneMutation = useMutation({
    mutationFn: async (brandId: string) => {
      const res = await apiRequest("POST", `/api/meta-scrape/brand/${brandId}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Scrape queued", description: "Results will appear in ~60 seconds." });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/meta-ads"] }), 60000);
    },
  });

  const scrapeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meta-scrape/all", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Scraping ${data.brandCount} brands`, description: "Check back in a few minutes." });
    },
  });

  const analyzeAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      const res = await apiRequest("POST", `/api/meta-ads/${adId}/analyze`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meta-ads"] });
      toast({ title: "Ad analyzed", description: "AI tags applied." });
    },
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              Competitor Ad Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor top-performing Meta ads for DTC competitors, sorted by impressions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrapeAllMutation.mutate()}
              disabled={scrapeAllMutation.isPending}
            >
              {scrapeAllMutation.isPending ? "Scraping..." : "Scrape All Brands"}
            </Button>
            {/* TODO: Add brand dialog button */}
          </div>
        </div>

        {/* TODO: Brand selector + stats row */}

        {/* TODO: Filter bar (media type, date range, AI tags) */}

        {/* Ad Grid */}
        {adsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(ads || []).map((ad) => (
              <Card key={ad.id} className="overflow-hidden hover-elevate">
                {/* TODO: Thumbnail image */}
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {ad.display_format}
                    </Badge>
                    <Badge
                      variant={ad.status === "Analyzed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {ad.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ad.text_hook || ad.ad_text || "No copy available"}
                  </p>
                  {ad.hook_excerpt && (
                    <p className="text-xs font-medium">{ad.hook_excerpt}</p>
                  )}
                  {/* AI Tags */}
                  {ad.ai_asset_type && (
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">{ad.ai_asset_type}</Badge>
                      {ad.ai_messaging_angle && (
                        <Badge variant="outline" className="text-xs">{ad.ai_messaging_angle}</Badge>
                      )}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-7 text-xs"
                    onClick={() => analyzeAdMutation.mutate(ad.id)}
                    disabled={analyzeAdMutation.isPending || ad.status === "Analyzed"}
                  >
                    {ad.status === "Analyzed" ? "Analyzed" : "Analyze"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!adsLoading && (!ads || ads.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No ads yet. Add a brand and run a scrape to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
