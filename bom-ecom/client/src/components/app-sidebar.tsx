import { useLocation, Link } from "wouter";
import bombEcomLogo from "@assets/Gemini_Generated_Image_ey3u93ey3u93ey3u_1770685360978.jpg";
import {
  LayoutDashboard,
  Megaphone,
  Palette,
  Trophy,
  FlaskConical,
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
  Cpu,
  Workflow,
  ScrollText,
  Bot,
  Briefcase,
  BookOpen,
  FileStack,
  ChevronRight,
  Factory,
  Award,
  Brain,
  Activity,
  Radar,
  Swords,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const navigation: NavEntry[] = [
  { title: "Overview", path: "/", icon: LayoutDashboard },
  {
    title: "Research Pipeline",
    icon: Microscope,
    items: [
      { title: "Products", path: "/research/products", icon: PackageSearch },
      { title: "Signal Engine", path: "/research/signal-engine", icon: Activity },
      { title: "Competitor Ads", path: "/research/competitor-ads", icon: Swords },
      { title: "Scraper Hub", path: "/research/scraper-hub", icon: Radar },
      { title: "Avatars", path: "/research/avatars", icon: Users },
      { title: "Angles", path: "/research/angles", icon: Compass },
      { title: "Hooks / Tags", path: "/research/hooks-tags", icon: Tag },
    ],
  },
  {
    title: "Creative Lab",
    icon: Palette,
    items: [
      { title: "Ad Generator", path: "/ad-generator", icon: FlaskConical },
      { title: "Ad Concept", path: "/creative-lab", icon: Lightbulb },
      { title: "Ad Clone", path: "/creative-lab/clone", icon: Copy },
    ],
  },
  { title: "Campaigns", path: "/campaigns", icon: Megaphone },
  { title: "Winning Ads", path: "/winning-ads", icon: Trophy },
  {
    title: "Operations",
    icon: Package,
    items: [
      { title: "Orders", path: "/operations/orders", icon: ShoppingCart },
      { title: "Support", path: "/operations/support", icon: Headphones },
      { title: "Inventory", path: "/operations/inventory", icon: Package },
      { title: "Suppliers", path: "/operations/suppliers", icon: Factory },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Financial", path: "/analytics/financial", icon: DollarSign },
      { title: "Creative Performance", path: "/analytics/creative", icon: BarChart3 },
      { title: "Product Performance", path: "/analytics/product", icon: TrendingUp },
    ],
  },
  {
    title: "Automations / Ops",
    icon: Cpu,
    items: [
      { title: "Workflows", path: "/automations/workflows", icon: Workflow },
      { title: "Jobs", path: "/automations/jobs", icon: Cpu },
      { title: "Logs", path: "/automations/logs", icon: ScrollText },
    ],
  },
  {
    title: "AI Agency",
    icon: Bot,
    items: [
      { title: "Client Projects", path: "/agency/clients", icon: Briefcase },
      { title: "Service Catalog", path: "/agency/services", icon: BookOpen },
      { title: "Templates", path: "/agency/templates", icon: FileStack },
      { title: "Case Studies", path: "/agency/case-studies", icon: Award },
    ],
  },
  { title: "Settings", path: "/settings", icon: Settings },
];

function NavLink({ item, location }: { item: NavItem; location: string }) {
  const isActive =
    item.path === "/" ? location === "/" : location.startsWith(item.path);

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      data-testid={`nav-${item.title.toLowerCase().replace(/[\s\/]/g, "-")}`}
    >
      <Link href={item.path}>
        <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  );
}

function NavGroupCollapsible({ group, location }: { group: NavGroup; location: string }) {
  const isGroupActive = group.items.some((item) => location.startsWith(item.path));

  return (
    <Collapsible defaultOpen={isGroupActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            data-testid={`nav-group-${group.title.toLowerCase().replace(/[\s\/]/g, "-")}`}
          >
            <group.icon className={cn("h-4 w-4", isGroupActive && "text-primary")} />
            <span>{group.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => {
              const isActive = location.startsWith(item.path);
              return (
                <SidebarMenuSubItem key={item.path}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActive}
                    data-testid={`nav-${item.title.toLowerCase().replace(/[\s\/]/g, "-")}`}
                  >
                    <Link href={item.path}>
                      <item.icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center" data-testid="sidebar-branding">
          <img
            src={bombEcomLogo}
            alt="THE BOMB ECOM OS"
            className="h-12 object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((entry) => {
                if (isGroup(entry)) {
                  return (
                    <NavGroupCollapsible
                      key={entry.title}
                      group={entry}
                      location={location}
                    />
                  );
                }
                return (
                  <SidebarMenuItem key={entry.path}>
                    <NavLink item={entry} location={location} />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
