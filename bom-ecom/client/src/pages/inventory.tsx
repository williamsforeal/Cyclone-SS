import { useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { KpiCard } from "@/components/kpi-card";
import { cn } from "@/lib/utils";

interface InventoryItem {
  sku: string;
  product: string;
  variant: string;
  inStock: number;
  reorderPoint: number;
  leadTime: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  supplier?: string;
  lastRestocked?: string;
}

const inventoryData: InventoryItem[] = [
  { sku: "SKU-PA-001", product: "PalmAura", variant: "4oz Jar", inStock: 1240, reorderPoint: 200, leadTime: "14 days", status: "In Stock", supplier: "NatureCraft Labs", lastRestocked: "2026-01-28" },
  { sku: "SKU-PA-002", product: "PalmAura", variant: "8oz Jar", inStock: 86, reorderPoint: 100, leadTime: "14 days", status: "Low Stock", supplier: "NatureCraft Labs", lastRestocked: "2026-01-15" },
  { sku: "SKU-FG-001", product: "FlexiGrip", variant: "30ct Bottle", inStock: 2100, reorderPoint: 300, leadTime: "21 days", status: "In Stock", supplier: "VitaFlex Co.", lastRestocked: "2026-01-30" },
  { sku: "SKU-FG-002", product: "FlexiGrip", variant: "60ct Bottle", inStock: 890, reorderPoint: 200, leadTime: "21 days", status: "In Stock", supplier: "VitaFlex Co.", lastRestocked: "2026-01-30" },
  { sku: "SKU-ZB-001", product: "ZenBrew", variant: "12oz Bag", inStock: 45, reorderPoint: 150, leadTime: "28 days", status: "Low Stock", supplier: "BrewSource Intl.", lastRestocked: "2026-01-10" },
  { sku: "SKU-ZB-002", product: "ZenBrew", variant: "24oz Bag", inStock: 0, reorderPoint: 100, leadTime: "28 days", status: "Out of Stock", supplier: "BrewSource Intl.", lastRestocked: "2026-01-05" },
  { sku: "SKU-PA-003", product: "PalmAura", variant: "Travel Size 2oz", inStock: 560, reorderPoint: 100, leadTime: "14 days", status: "In Stock", supplier: "NatureCraft Labs", lastRestocked: "2026-01-28" },
  { sku: "SKU-FG-003", product: "FlexiGrip", variant: "Sample Pack 7ct", inStock: 3200, reorderPoint: 500, leadTime: "21 days", status: "In Stock", supplier: "VitaFlex Co.", lastRestocked: "2026-02-01" },
];

const lowStockCount = inventoryData.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock").length;
const totalUnits = inventoryData.reduce((sum, i) => sum + i.inStock, 0);

function getStatusBadge(status: string) {
  switch (status) {
    case "In Stock":
      return <Badge variant="default" className="no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
    case "Low Stock":
      return <Badge variant="secondary" className="border border-destructive/20 no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
    case "Out of Stock":
      return <Badge variant="destructive" className="no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
    default:
      return <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
  }
}

function getRowClassName(item: InventoryItem) {
  if (item.status === "Out of Stock") return "bg-destructive/5 dark:bg-destructive/10";
  if (item.status === "Low Stock") return "bg-yellow-500/5 dark:bg-yellow-500/10";
  return "";
}

export default function Inventory() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-inventory">
              Inventory
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-sku-count">
            {inventoryData.length} SKUs tracked
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Total SKUs"
            value="8"
            icon={Package}
          />
          <KpiCard
            title="Low Stock Alerts"
            value={String(lowStockCount)}
            icon={AlertTriangle}
            className={lowStockCount > 0 ? "border-destructive/30" : ""}
          />
          <KpiCard
            title="Total Units"
            value={totalUnits.toLocaleString()}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow
                    key={item.sku}
                    className={cn("cursor-pointer hover-elevate", getRowClassName(item))}
                    onClick={() => setSelectedItem(item)}
                    data-testid={`row-inventory-${item.sku}`}
                  >
                    <TableCell className="font-mono font-medium" data-testid={`text-sku-${item.sku}`}>
                      {item.sku}
                    </TableCell>
                    <TableCell data-testid={`text-product-${item.sku}`}>
                      {item.product}
                    </TableCell>
                    <TableCell data-testid={`text-variant-${item.sku}`}>
                      {item.variant}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-mono",
                        item.inStock < item.reorderPoint ? "text-destructive font-medium" : ""
                      )}
                      data-testid={`text-stock-${item.sku}`}
                    >
                      {item.inStock.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground" data-testid={`text-reorder-${item.sku}`}>
                      {item.reorderPoint.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-leadtime-${item.sku}`}>
                      {item.leadTime}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent data-testid="sheet-inventory-detail">
            {selectedItem && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-sku">
                    {selectedItem.sku}
                  </SheetTitle>
                  <SheetDescription>{selectedItem.product} - {selectedItem.variant}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(selectedItem.status)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Product</p>
                    <p className="text-sm font-medium" data-testid="text-detail-product">{selectedItem.product}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Variant</p>
                    <p className="text-sm" data-testid="text-detail-variant">{selectedItem.variant}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">In Stock</p>
                        <p
                          className={cn(
                            "font-mono font-bold",
                            selectedItem.inStock < selectedItem.reorderPoint ? "text-destructive" : ""
                          )}
                          data-testid="text-detail-stock"
                        >
                          {selectedItem.inStock.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Reorder Point</p>
                        <p className="font-mono font-bold" data-testid="text-detail-reorder">
                          {selectedItem.reorderPoint.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Lead Time</p>
                        <p className="font-mono font-bold" data-testid="text-detail-leadtime">
                          {selectedItem.leadTime}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Supplier</p>
                        <p className="font-bold text-sm" data-testid="text-detail-supplier">
                          {selectedItem.supplier}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Restocked</p>
                    <p className="text-sm font-mono" data-testid="text-detail-restocked">{selectedItem.lastRestocked}</p>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
