import { Sparkles, Pencil, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdCreativeCardProps {
  headline: string;
  bodyText: string;
  cta: string;
  direction: string;
  angle?: string;
  avatar?: string;
  onEdit?: () => void;
  onSave?: () => void;
}

export function AdCreativeCard({
  headline,
  bodyText,
  cta,
  direction,
  angle,
  avatar,
  onEdit,
  onSave,
}: AdCreativeCardProps) {
  return (
    <Card data-testid="card-ad-creative">
      <div className="flex h-40 flex-col items-center justify-center rounded-t-md bg-gradient-to-br from-purple-900/50 to-purple-800/30" data-testid="img-ad-preview">
        <Sparkles className="mb-2 h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">AI Image Preview</span>
      </div>
      <CardContent className="space-y-3 pt-4">
        <Badge variant="outline" data-testid="badge-ad-direction">{direction}</Badge>
        <h3
          className="font-heading font-semibold"
          data-testid="text-ad-headline"
        >
          {headline}
        </h3>
        <p
          className="line-clamp-3 text-sm text-muted-foreground"
          data-testid="text-ad-body"
        >
          {bodyText}
        </p>
        <Badge
          variant="secondary"
          className="no-default-hover-elevate"
          data-testid="text-ad-cta"
        >
          {cta}
        </Badge>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            data-testid="button-edit-ad"
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            data-testid="button-save-ad"
          >
            <Bookmark className="mr-1 h-3 w-3" />
            Save to Library
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
