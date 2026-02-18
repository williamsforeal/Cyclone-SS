import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Megaphone,
  Palette,
  Trophy,
  FlaskConical,
  Cpu,
  Settings,
  Lightbulb,
  Copy,
  Microscope,
  PackageSearch,
  Users,
  Compass,
  Tag,
  ShoppingCart,
  Headphones,
  Package,
  DollarSign,
  BarChart3,
  TrendingUp,
  Workflow,
  ScrollText,
  Bot,
  Briefcase,
  BookOpen,
  FileStack,
  Factory,
  Award,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const pages = [
  { title: "Overview", path: "/", icon: LayoutDashboard },
  { title: "Products", path: "/research/products", icon: PackageSearch },
  { title: "Avatars", path: "/research/avatars", icon: Users },
  { title: "Angles", path: "/research/angles", icon: Compass },
  { title: "Hooks / Tags", path: "/research/hooks-tags", icon: Tag },
  { title: "Ad Generator", path: "/ad-generator", icon: FlaskConical },
  { title: "Ad Concept", path: "/creative-lab", icon: Lightbulb },
  { title: "Ad Clone", path: "/creative-lab/clone", icon: Copy },
  { title: "Campaigns", path: "/campaigns", icon: Megaphone },
  { title: "Winning Ads", path: "/winning-ads", icon: Trophy },
  { title: "Orders", path: "/operations/orders", icon: ShoppingCart },
  { title: "Support", path: "/operations/support", icon: Headphones },
  { title: "Inventory", path: "/operations/inventory", icon: Package },
  { title: "Supplier Performance", path: "/operations/suppliers", icon: Factory },
  { title: "Financial Analytics", path: "/analytics/financial", icon: DollarSign },
  { title: "Creative Performance", path: "/analytics/creative", icon: BarChart3 },
  { title: "Product Performance", path: "/analytics/product", icon: TrendingUp },
  { title: "Workflows", path: "/automations/workflows", icon: Workflow },
  { title: "Jobs", path: "/automations/jobs", icon: Cpu },
  { title: "Logs", path: "/automations/logs", icon: ScrollText },
  { title: "Client Projects", path: "/agency/clients", icon: Briefcase },
  { title: "Service Catalog", path: "/agency/services", icon: BookOpen },
  { title: "Templates", path: "/agency/templates", icon: FileStack },
  { title: "Case Studies", path: "/agency/case-studies", icon: Award },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages..."
        data-testid="input-command-search"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => navigateTo(page.path)}
              data-testid={`command-item-${page.title.toLowerCase().replace(/[\s\/]/g, "-")}`}
            >
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
