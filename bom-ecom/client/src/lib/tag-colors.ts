const TAG_COLOR_PALETTE = [
  { bg: "bg-red-500/15 dark:bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  { bg: "bg-emerald-500/15 dark:bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  { bg: "bg-violet-500/15 dark:bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  { bg: "bg-sky-500/15 dark:bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  { bg: "bg-amber-500/15 dark:bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  { bg: "bg-orange-500/15 dark:bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  { bg: "bg-teal-500/15 dark:bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  { bg: "bg-rose-500/15 dark:bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  { bg: "bg-indigo-500/15 dark:bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  { bg: "bg-fuchsia-500/15 dark:bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
  { bg: "bg-cyan-500/15 dark:bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  { bg: "bg-lime-500/15 dark:bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
  { bg: "bg-pink-500/15 dark:bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
  { bg: "bg-yellow-500/15 dark:bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
  { bg: "bg-blue-500/15 dark:bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  { bg: "bg-green-500/15 dark:bg-green-500/15", text: "text-green-400", border: "border-green-500/30" },
  { bg: "bg-purple-500/15 dark:bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  { bg: "bg-red-400/15 dark:bg-red-400/15", text: "text-red-300", border: "border-red-400/30" },
  { bg: "bg-emerald-400/15 dark:bg-emerald-400/15", text: "text-emerald-300", border: "border-emerald-400/30" },
  { bg: "bg-violet-400/15 dark:bg-violet-400/15", text: "text-violet-300", border: "border-violet-400/30" },
];

const tagColorMap = new Map<string, { bg: string; text: string; border: string }>();
let nextIndex = 0;

export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  const key = tag.toLowerCase().trim();
  if (tagColorMap.has(key)) {
    return tagColorMap.get(key)!;
  }
  const color = TAG_COLOR_PALETTE[nextIndex % TAG_COLOR_PALETTE.length];
  nextIndex++;
  tagColorMap.set(key, color);
  return color;
}
