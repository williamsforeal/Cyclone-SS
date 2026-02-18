import { useState } from "react";
import {
  Compass,
  Megaphone,
  BookOpen,
  Users,
  Crosshair,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  mockConceptDirections,
  type ConceptDirection,
} from "@/data/mockData";

const iconMap: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  "book-open": BookOpen,
  users: Users,
  crosshair: Crosshair,
  "git-compare": GitCompareArrows,
};

interface ConceptDirectionSelectorProps {
  onSelect: (direction: ConceptDirection) => void;
  selected?: string;
  trigger?: React.ReactNode;
}

export function ConceptDirectionSelector({
  onSelect,
  selected,
  trigger,
}: ConceptDirectionSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedDirection = mockConceptDirections.find(
    (d) => d.id === selected
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            data-testid="button-select-direction"
          >
            <Compass className="mr-2 h-4 w-4" />
            {selectedDirection
              ? selectedDirection.name
              : "Select concept direction"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl"
        data-testid="dialog-direction-selector"
      >
        <DialogHeader>
          <DialogTitle>Select Concept Direction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {mockConceptDirections.map((direction) => {
            const Icon = iconMap[direction.icon] || Compass;
            return (
              <div
                key={direction.id}
                className={`flex cursor-pointer items-center gap-4 rounded-md border p-4 transition-colors ${
                  direction.id === selected
                    ? "border-primary"
                    : "border-border"
                }`}
                data-testid={`card-direction-${direction.id}`}
                onClick={() => {
                  onSelect(direction);
                  setOpen(false);
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/30">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold" data-testid={`text-direction-name-${direction.id}`}>{direction.name}</p>
                  <p className="text-sm text-muted-foreground" data-testid={`text-direction-desc-${direction.id}`}>
                    {direction.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
