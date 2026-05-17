import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items?: string[];
}

export function PlaceholderPage({ title, description, icon: Icon, items }: PlaceholderPageProps) {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" data-testid={`page-${title.toLowerCase().replace(/[\s\/]/g, "-")}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title">{title}</h1>
      </div>
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <Icon className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {items && items.length > 0 && (
            <div className="pt-4 w-full max-w-sm">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Planned Features</p>
              <ul className="space-y-2 text-left">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
