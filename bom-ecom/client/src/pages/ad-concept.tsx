import { useState } from "react";
import { Sparkles, Zap, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImageSelector } from "@/components/product-image-selector";
import { ConceptDirectionSelector } from "@/components/concept-direction-selector";
import { CreativePreferences } from "@/components/creative-preferences";
import { AdCreativeCard } from "@/components/ad-creative-card";
import {
  mockGeneratedConcepts,
  type ConceptDirection,
  type GeneratedConcept,
} from "@/data/mockData";

export default function AdConceptPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [selectedDirection, setSelectedDirection] = useState<ConceptDirection>();
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [conceptCount, setConceptCount] = useState(5);
  const [brandStyle, setBrandStyle] = useState("abundria");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedConcept[]>([]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setResults(mockGeneratedConcepts);
      setGenerating(false);
    }, 2000);
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="w-full lg:w-[420px] lg:shrink-0 space-y-4">
          <h1 className="font-heading text-2xl font-bold" data-testid="text-page-title">Ad Concept</h1>

          <div className="space-y-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Step 1: Select Product Image
              </h2>
              <ProductImageSelector
                onSelect={(product) => setSelectedProductId(product.id)}
                selectedProductId={selectedProductId}
              />
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Step 2: Select Concept Direction
              </h2>
              <ConceptDirectionSelector
                onSelect={setSelectedDirection}
                selected={selectedDirection?.id}
              />
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Step 3: Creative Preferences
              </h2>
              <CreativePreferences
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                conceptCount={conceptCount}
                onConceptCountChange={setConceptCount}
                brandStyle={brandStyle}
                onBrandStyleChange={setBrandStyle}
              />
            </div>
          </div>

          <Button
            variant="default"
            className="w-full"
            disabled={!selectedProductId || !selectedDirection}
            onClick={handleGenerate}
            data-testid="button-generate-concepts"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Generate ({conceptCount})
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          {!results.length && !generating && (
            <Card
              className="flex items-center justify-center min-h-80"
              data-testid="empty-state-concept"
            >
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a product and concept direction, then hit Generate.
                </p>
              </CardContent>
            </Card>
          )}

          {generating && !results.length && (
            <Card
              className="flex items-center justify-center min-h-80"
              data-testid="generating-state-concept"
            >
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  Analyzing product and generating concepts...
                </p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              <Card data-testid="card-analysis">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Product Highlights
                      </h3>
                      <ul className="space-y-1 text-sm">
                        <li>Heated compression therapy</li>
                        <li>Ergonomic palm-fit design</li>
                        <li>3 intensity levels</li>
                        <li>Rechargeable, portable</li>
                      </ul>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      Analyzed in 3s
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Ideal Customer
                    </h3>
                    <p className="text-sm">
                      Professionals aged 28-55 experiencing chronic hand
                      discomfort from repetitive daily activities
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Pain Point
                    </h3>
                    <p className="text-sm">
                      Persistent hand stiffness and fatigue limiting daily
                      productivity and quality of life
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-testid="results-grid"
              >
                {results.map((concept) => (
                  <AdCreativeCard
                    key={concept.id}
                    headline={concept.headline}
                    bodyText={concept.bodyText}
                    cta={concept.cta}
                    direction={concept.direction}
                    angle={concept.angle}
                    avatar={concept.avatar}
                    onEdit={() => console.log("Edit", concept.id)}
                    onSave={() => console.log("Save", concept.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
