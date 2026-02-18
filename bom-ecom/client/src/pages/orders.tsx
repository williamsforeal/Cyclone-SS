import { useState } from "react";
import { ShoppingCart, Truck, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
  date: string;
  tracking?: string;
  email?: string;
  shippingAddress?: string;
}

const orders: Order[] = [
  { id: "ORD-1847", customer: "Sarah M.", product: "PalmAura x2", amount: 58.00, status: "shipped", date: "2026-02-05", tracking: "USPS 9400111899223456789012", email: "sarah.m@email.com", shippingAddress: "123 Elm St, Austin, TX 78701" },
  { id: "ORD-1846", customer: "James K.", product: "FlexiGrip x1", amount: 34.99, status: "delivered", date: "2026-02-04", email: "james.k@email.com", shippingAddress: "456 Oak Ave, Portland, OR 97201" },
  { id: "ORD-1845", customer: "Maria L.", product: "ZenBrew x3", amount: 89.97, status: "processing", date: "2026-02-04", email: "maria.l@email.com", shippingAddress: "789 Pine Rd, Denver, CO 80202" },
  { id: "ORD-1844", customer: "David R.", product: "PalmAura x1, FlexiGrip x1", amount: 63.99, status: "new", date: "2026-02-03", email: "david.r@email.com", shippingAddress: "321 Maple Dr, Seattle, WA 98101" },
  { id: "ORD-1843", customer: "Emily W.", product: "ZenBrew x2", amount: 59.98, status: "shipped", date: "2026-02-03", tracking: "USPS 9400111899223456789034", email: "emily.w@email.com", shippingAddress: "654 Cedar Ln, Chicago, IL 60601" },
  { id: "ORD-1842", customer: "Michael S.", product: "PalmAura x1", amount: 29.00, status: "delivered", date: "2026-02-02", email: "michael.s@email.com", shippingAddress: "987 Birch Blvd, Miami, FL 33101" },
  { id: "ORD-1841", customer: "Lisa T.", product: "FlexiGrip x2", amount: 64.98, status: "cancelled", date: "2026-02-01", email: "lisa.t@email.com", shippingAddress: "147 Spruce St, Boston, MA 02101" },
  { id: "ORD-1840", customer: "Robert H.", product: "ZenBrew x1, PalmAura x1", amount: 58.99, status: "delivered", date: "2026-02-01", email: "robert.h@email.com", shippingAddress: "258 Walnut Way, Nashville, TN 37201" },
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-orders">
              Orders
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-order-count">
            {filtered.length} orders
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-order-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate">
            <Calendar className="h-3 w-3 mr-1" />
            Last 30 days
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Orders"
            value="847"
            icon={ShoppingCart}
          />
          <KpiCard
            title="Revenue"
            value="$24,580"
          />
          <KpiCard
            title="Avg Order Value"
            value="$29.02"
          />
          <KpiCard
            title="Fulfillment Rate"
            value="94.2%"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Order Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedOrder(order)}
                    data-testid={`row-order-${order.id}`}
                  >
                    <TableCell className="font-mono font-medium" data-testid={`text-order-id-${order.id}`}>
                      {order.id}
                    </TableCell>
                    <TableCell data-testid={`text-order-customer-${order.id}`}>
                      {order.customer}
                    </TableCell>
                    <TableCell data-testid={`text-order-product-${order.id}`}>
                      {order.product}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-order-amount-${order.id}`}>
                      ${order.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                      {order.date}
                    </TableCell>
                    <TableCell>
                      {order.tracking ? (
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`text-order-tracking-${order.id}`}>
                          {order.tracking.substring(0, 16)}...
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <SheetContent data-testid="sheet-order-detail">
            {selectedOrder && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-order-id">
                    {selectedOrder.id}
                  </SheetTitle>
                  <SheetDescription>Order details and fulfillment information</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selectedOrder.status} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer</p>
                    <p className="text-sm font-medium" data-testid="text-detail-customer">{selectedOrder.customer}</p>
                    <p className="text-xs text-muted-foreground" data-testid="text-detail-email">{selectedOrder.email}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Product</p>
                    <p className="text-sm" data-testid="text-detail-product">{selectedOrder.product}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</p>
                    <p className="text-sm" data-testid="text-detail-address">{selectedOrder.shippingAddress}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Amount</p>
                        <p className="font-mono font-bold" data-testid="text-detail-amount">
                          ${selectedOrder.amount.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Date</p>
                        <p className="font-mono font-bold" data-testid="text-detail-date">
                          {selectedOrder.date}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedOrder.tracking && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Tracking</p>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-mono" data-testid="text-detail-tracking">{selectedOrder.tracking}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
