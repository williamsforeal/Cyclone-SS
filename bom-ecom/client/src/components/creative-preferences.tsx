import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aspectRatios, conceptCounts, mockBrandStyles } from "@/data/mockData";

interface CreativePreferencesProps {
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
  conceptCount: number;
  onConceptCountChange: (v: number) => void;
  brandStyle: string;
  onBrandStyleChange: (v: string) => void;
}

export function CreativePreferences({
  aspectRatio,
  onAspectRatioChange,
  conceptCount,
  onConceptCountChange,
  brandStyle,
  onBrandStyleChange,
}: CreativePreferencesProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
          <SelectTrigger className="w-[140px]" data-testid="select-aspect-ratio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aspectRatios.map((ar) => (
              <SelectItem key={ar.value} value={ar.value}>
                {ar.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Concepts</Label>
        <Select
          value={String(conceptCount)}
          onValueChange={(v) => onConceptCountChange(Number(v))}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-concept-count">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conceptCounts.map((cc) => (
              <SelectItem key={cc.value} value={String(cc.value)}>
                {cc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Brand Style</Label>
        <Select value={brandStyle} onValueChange={onBrandStyleChange}>
          <SelectTrigger className="w-[160px]" data-testid="select-brand-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockBrandStyles.map((bs) => (
              <SelectItem key={bs.id} value={bs.id}>
                {bs.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
