import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CreativeStatus = "draft" | "generated" | "approved" | "testing" | "winner" | "retired";
type JobStatus = "pending" | "running" | "success" | "failed" | "retrying";

interface StatusBadgeProps {
  status: CreativeStatus | JobStatus | string;
  className?: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Approved: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  success: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  winner: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  draft: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Draft: { bg: "bg-amber-500/15", text: "text-amber-400" },
  pending: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Pending: { bg: "bg-amber-500/15", text: "text-amber-400" },
  generated: { bg: "bg-sky-500/15", text: "text-sky-400" },
  Generated: { bg: "bg-sky-500/15", text: "text-sky-400" },
  running: { bg: "bg-sky-500/15", text: "text-sky-400" },
  testing: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Testing: { bg: "bg-violet-500/15", text: "text-violet-400" },
  review: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Review: { bg: "bg-violet-500/15", text: "text-violet-400" },
  rejected: { bg: "bg-red-500/15", text: "text-red-400" },
  Rejected: { bg: "bg-red-500/15", text: "text-red-400" },
  failed: { bg: "bg-red-500/15", text: "text-red-400" },
  retired: { bg: "bg-zinc-500/15", text: "text-zinc-400" },
  Retired: { bg: "bg-zinc-500/15", text: "text-zinc-400" },
  retrying: { bg: "bg-orange-500/15", text: "text-orange-400" },
  paused: { bg: "bg-zinc-500/15", text: "text-zinc-400" },
  Paused: { bg: "bg-zinc-500/15", text: "text-zinc-400" },
  "Generate Image Prompt": { bg: "bg-violet-500/15", text: "text-violet-400" },
  "Image Prompt Generated": { bg: "bg-sky-500/15", text: "text-sky-400" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = statusColorMap[status];
  const testId = `status-badge-${slugify(status)}`;

  if (colors) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-sm no-default-hover-elevate",
          colors.bg,
          colors.text,
          className
        )}
        data-testid={testId}
      >
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("text-sm no-default-hover-elevate", className)}
      data-testid={testId}
    >
      {status}
    </Badge>
  );
}

interface StatusDotProps {
  color?: "green" | "yellow" | "red" | "blue" | "gray";
  pulse?: boolean;
  className?: string;
}

const dotColorMap: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  gray: "bg-zinc-500",
};

export function StatusDot({ color = "green", pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            dotColorMap[color]
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          dotColorMap[color]
        )}
      />
    </span>
  );
}
