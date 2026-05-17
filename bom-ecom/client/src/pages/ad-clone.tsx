import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  X,
  ArrowRight,
  Copy,
  Loader2,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductImageSelector } from "@/components/product-image-selector";
import { CreativePreferences } from "@/components/creative-preferences";
import { AdCreativeCard } from "@/components/ad-creative-card";
import { mockGeneratedConcepts } from "@/data/mockData";

interface TextAdaptation {
  label: string;
  original: string;
  adapted: string;
}

interface Template {
  key: string;
  preview?: string;
}

const mockTextAdaptations: TextAdaptation[] = [
  {
    label: "Headline",
    original: "Tangy Love AFFAIR",
    adapted: "Soothing Self AFFAIR",
  },
  {
    label: "Body Line 1",
    original: "A ZESTY TWIST FOR YOUR ROMANTIC SIPS.",
    adapted: "A SMART TWIST FOR YOUR WELLNESS RITUAL.",
  },
  {
    label: "Body Line 2",
    original: "20% OFF",
    adapted: "20% OFF",
  },
  {
    label: "Body Line 3",
    original: "ON ALL LEMON DRINKS FOR COUPLES!",
    adapted: "ON ALL HAND MASSAGERS FOR SELF-CARE!",
  },
  {
    label: "CTA",
    original: "VISIT US TODAY",
    adapted: "SHOP NOW TODAY",
  },
];

export default function AdClone() {
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [referenceAdFile, setReferenceAdFile] = useState<string>();
  const [referenceAdAnalyzed, setReferenceAdAnalyzed] = useState(false);
  const [adaptedTexts, setAdaptedTexts] = useState<Record<string, string>>(
    mockTextAdaptations.reduce(
      (acc, item) => ({ ...acc, [item.label]: item.adapted }),
      {}
    )
  );
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [conceptCount, setConceptCount] = useState(5);
  const [brandStyle, setBrandStyle] = useState("style-3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/s3/templates"],
  });

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setReferenceAdFile(url);
    setReferenceAdAnalyzed(false);

    setTimeout(() => {
      setReferenceAdAnalyzed(true);
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  const handleRemoveReferenceAd = () => {
    if (referenceAdFile) {
      URL.revokeObjectURL(referenceAdFile);
      setReferenceAdFile(undefined);
      setReferenceAdAnalyzed(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setReferenceAdFile(template.preview || "");
    setReferenceAdAnalyzed(true);
    setTemplateLibraryOpen(false);
  };

  const handleAdaptedTextChange = (label: string, value: string) => {
    setAdaptedTexts((prev) => ({ ...prev, [label]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setHasGenerated(true);
  };

  const canGenerate = selectedProductId && referenceAdFile;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        <div className="w-full space-y-4 lg:w-[420px] lg:shrink-0">
          <h1 className="font-heading text-2xl font-semibold" data-testid="text-page-title">Ad Clone</h1>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1: Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageSelector
                selectedProductId={selectedProductId}
                onSelect={(product) => setSelectedProductId(product.id)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2: Reference Ad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!referenceAdFile ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload Reference Ad</p>
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={handleUploadClick}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      data-testid="dropzone-reference-ad"
                    >
                      <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drop a reference ad here or click to upload
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Dialog open={templateLibraryOpen} onOpenChange={setTemplateLibraryOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid="button-browse-templates"
                      >
                        Browse Template Library
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="max-w-2xl"
                      data-testid="dialog-template-library"
                    >
                      <DialogHeader>
                        <DialogTitle>Winning Ad Templates</DialogTitle>
                      </DialogHeader>
                      {templates.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-sm text-muted-foreground">
                            No templates found
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {templates.map((template) => (
                            <div
                              key={template.key}
                              className="cursor-pointer rounded-md border border-border p-3 hover-elevate transition-colors"
                              data-testid={`card-template-${template.key}`}
                              onClick={() => handleSelectTemplate(template)}
                            >
                              {template.preview && (
                                <div className="mb-2 h-24 rounded-lg bg-gradient-to-br from-gray-800/50 to-purple-900/30 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={template.preview}
                                    alt={template.key}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <p className="text-center text-xs font-medium truncate">
                                {template.key}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={referenceAdFile}
                      alt="Reference ad"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={handleRemoveReferenceAd}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                      aria-label="Remove reference ad"
                      data-testid="button-remove-reference-ad"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {referenceAdAnalyzed && (
                    <Badge variant="default" className="text-[10px]" data-testid="badge-analyzed">
                      Analyzed in 9s
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {referenceAdFile && (
            <Card data-testid="section-text-adaptation">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Step 3: Customize Ad Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockTextAdaptations.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <Label className="text-xs">{item.label}</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {item.original}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <Input
                          value={adaptedTexts[item.label] || ""}
                          onChange={(e) =>
                            handleAdaptedTextChange(item.label, e.target.value)
                          }
                          className="text-xs h-8"
                          data-testid={`input-adapted-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 4: Creative Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <CreativePreferences
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                conceptCount={conceptCount}
                onConceptCountChange={setConceptCount}
                brandStyle={brandStyle}
                onBrandStyleChange={setBrandStyle}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full"
            data-testid="button-generate-clones"
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate ({conceptCount})
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          {!hasGenerated ? (
            <>
              {isGenerating ? (
                <Card className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cloning ad style and generating variations...
                    </p>
                  </div>
                </Card>
              ) : (
                <Card
                  className="flex flex-col items-center justify-center h-64"
                  data-testid="empty-state-clone"
                >
                  <Copy className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Upload a reference ad and select your product to start
                    cloning.
                  </p>
                </Card>
              )}
            </>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-testid="results-grid-clone"
            >
              {mockGeneratedConcepts.slice(0, conceptCount).map((concept) => (
                <AdCreativeCard
                  key={concept.id}
                  headline={concept.headline}
                  bodyText={concept.bodyText}
                  cta={concept.cta}
                  direction={concept.direction}
                  angle={concept.angle}
                  avatar={concept.avatar}
                  onEdit={() => {}}
                  onSave={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
