import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { Command, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import headerBg from "@assets/Futuristic_Modern_Zoom_Virtual_Business_1770683676332.png";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/overview";
import Campaigns from "@/pages/campaigns";
import AdConcept from "@/pages/ad-concept";
import AdClone from "@/pages/ad-clone";
import WinningAds from "@/pages/winning-ads";
import AdGenerator from "@/pages/ad-generator";
import Ops from "@/pages/ops";
import SettingsPage from "@/pages/settings";
import ProductResearch from "@/pages/product-research";
import Avatars from "@/pages/avatars";
import Angles from "@/pages/angles";
import HooksTags from "@/pages/hooks-tags";
import Orders from "@/pages/orders";
import Support from "@/pages/support";
import Inventory from "@/pages/inventory";
import AnalyticsFinancial from "@/pages/analytics-financial";
import AnalyticsCreative from "@/pages/analytics-creative";
import AnalyticsProduct from "@/pages/analytics-product";
import Workflows from "@/pages/workflows";
import Logs from "@/pages/logs";
import ClientProjects from "@/pages/client-projects";
import ServiceCatalog from "@/pages/service-catalog";
import Templates from "@/pages/templates";
import SupplierPerformance from "@/pages/supplier-performance";
import CaseStudies from "@/pages/case-studies";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/research/products" component={ProductResearch} />
      <Route path="/research/avatars" component={Avatars} />
      <Route path="/research/angles" component={Angles} />
      <Route path="/research/hooks-tags" component={HooksTags} />
      <Route path="/ad-generator" component={AdGenerator} />
      <Route path="/creative-lab" component={AdConcept} />
      <Route path="/creative-lab/clone" component={AdClone} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/winning-ads" component={WinningAds} />
      <Route path="/operations/orders" component={Orders} />
      <Route path="/operations/support" component={Support} />
      <Route path="/operations/inventory" component={Inventory} />
      <Route path="/operations/suppliers" component={SupplierPerformance} />
      <Route path="/analytics/financial" component={AnalyticsFinancial} />
      <Route path="/analytics/creative" component={AnalyticsCreative} />
      <Route path="/analytics/product" component={AnalyticsProduct} />
      <Route path="/automations/workflows" component={Workflows} />
      <Route path="/automations/jobs" component={Ops} />
      <Route path="/automations/logs" component={Logs} />
      <Route path="/agency/clients" component={ClientProjects} />
      <Route path="/agency/services" component={ServiceCatalog} />
      <Route path="/agency/templates" component={Templates} />
      <Route path="/agency/case-studies" component={CaseStudies} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function AppShell() {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header
            className="relative sticky top-0 z-50 border-b border-white/10"
            data-testid="app-header"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${headerBg})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative flex items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white/80 hover:text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer px-2.5 py-1 rounded-md border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                  onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                  data-testid="button-command-palette"
                >
                  <Search className="h-3 w-3" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="ml-1 text-[10px] text-white/40 font-mono">
                    <Command className="h-2.5 w-2.5 inline" />K
                  </kbd>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppShell />
          <CommandPalette />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
