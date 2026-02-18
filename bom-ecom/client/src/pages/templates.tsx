import { useState } from "react";
import { FileStack, Copy } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: number;
  category: string;
  name: string;
  description: string;
  uses: string;
  lastUsed: string;
}

const sampleTemplates: Template[] = [
  { id: 1, category: "Workflow", name: "Competitor Ad Scraper", description: "Scrape and categorize competitor ads from Meta Ad Library", uses: "24", lastUsed: "2026-02-06" },
  { id: 2, category: "Workflow", name: "Daily Metrics Pull", description: "Automated daily metrics ingestion from ad platforms", uses: "45", lastUsed: "2026-02-07" },
  { id: 3, category: "Ad Copy", name: "Pain-Agitate-Solution", description: "Classic PAS framework for problem-aware audiences", uses: "38", lastUsed: "2026-02-05" },
  { id: 4, category: "Ad Copy", name: "Before-After-Bridge", description: "Transformation-focused ad copy framework", uses: "29", lastUsed: "2026-02-04" },
  { id: 5, category: "Report", name: "Weekly Performance Summary", description: "KPIs, top creatives, spend analysis", uses: "12", lastUsed: "2026-02-03" },
  { id: 6, category: "Report", name: "Client Monthly Report", description: "Comprehensive monthly performance for agency clients", uses: "8", lastUsed: "2026-02-01" },
  { id: 7, category: "Onboarding", name: "New Client Checklist", description: "Standard onboarding steps for agency clients", uses: "15", lastUsed: "2026-01-28" },
  { id: 8, category: "Onboarding", name: "Product Research SOP", description: "Step-by-step product evaluation process", uses: "10", lastUsed: "2026-01-25" },
];

export default function Templates() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = sampleTemplates.filter((t) => {
    if (categoryFilter === "all") return true;
    return t.category === categoryFilter;
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <FileStack className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="text-page-title">
              Templates
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {filtered.length} templates
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Workflow">Workflow</SelectItem>
              <SelectItem value="Ad Copy">Ad Copy</SelectItem>
              <SelectItem value="Report">Report</SelectItem>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
              <CardContent className="p-5 space-y-3">
                <Badge variant="outline" className="no-default-hover-elevate" data-testid={`badge-category-${template.id}`}>
                  {template.category}
                </Badge>
                <CardTitle className="text-base" data-testid={`text-template-name-${template.id}`}>
                  {template.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{template.description}</p>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Uses</span>
                    <span className="font-mono font-medium" data-testid={`text-template-uses-${template.id}`}>
                      {template.uses}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Last used</span>
                    <span className="font-mono font-medium" data-testid={`text-template-lastused-${template.id}`}>
                      {template.lastUsed}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="sm" data-testid={`button-use-template-${template.id}`}>
                  <Copy className="h-3.5 w-3.5" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No templates match the selected category.
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
