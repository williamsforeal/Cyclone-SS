import { useState } from "react";
import { Headphones, User, Bot, Calendar, Clock, Timer } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: "high" | "medium" | "low";
  status: string;
  created: string;
  assignedTo: string;
  responseTime: string;
  slaStatus: "met" | "at-risk" | "breached";
  description?: string;
  lastResponse?: string;
}

const priorityConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
  high: { variant: "destructive" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
};

const tickets: Ticket[] = [
  { id: "TKT-0412", subject: "Order never arrived", customer: "Sarah M.", priority: "high", status: "open", created: "2026-02-06", assignedTo: "Unassigned", responseTime: "3.2h", slaStatus: "breached", description: "Customer reports that order ORD-1847 has not arrived despite tracking showing delivered. Requesting investigation and possible re-shipment.", lastResponse: "Awaiting initial response" },
  { id: "TKT-0411", subject: "Wrong product received", customer: "James K.", priority: "high", status: "in-progress", created: "2026-02-05", assignedTo: "Alex", responseTime: "1.8h", slaStatus: "met", description: "Customer received PalmAura instead of FlexiGrip. Requesting exchange and prepaid return label.", lastResponse: "Return label sent, awaiting package return" },
  { id: "TKT-0410", subject: "Refund request - allergic reaction", customer: "Maria L.", priority: "medium", status: "open", created: "2026-02-05", assignedTo: "Unassigned", responseTime: "5.1h", slaStatus: "at-risk", description: "Customer experienced a mild allergic reaction to ZenBrew ingredients. Requesting full refund and product return.", lastResponse: "Awaiting initial response" },
  { id: "TKT-0409", subject: "How to use PalmAura?", customer: "Emily W.", priority: "low", status: "resolved", created: "2026-02-04", assignedTo: "Bot", responseTime: "0.1h", slaStatus: "met", description: "Customer asking for usage instructions for PalmAura 4oz Jar.", lastResponse: "Auto-replied with product usage guide link" },
  { id: "TKT-0408", subject: "Shipping to Canada?", customer: "Michael S.", priority: "low", status: "resolved", created: "2026-02-03", assignedTo: "Bot", responseTime: "0.1h", slaStatus: "met", description: "Customer inquiring about international shipping availability to Canada.", lastResponse: "Auto-replied with international shipping FAQ" },
  { id: "TKT-0407", subject: "Bulk order inquiry", customer: "Corporate Wellness Co.", priority: "medium", status: "in-progress", created: "2026-02-02", assignedTo: "Sam", responseTime: "2.4h", slaStatus: "met", description: "B2B inquiry for bulk pricing on FlexiGrip and ZenBrew for corporate wellness program. 500+ units.", lastResponse: "Sent pricing sheet, awaiting approval from client" },
  { id: "TKT-0406", subject: "Subscription cancellation", customer: "Lisa T.", priority: "low", status: "closed", created: "2026-02-01", assignedTo: "Alex", responseTime: "1.2h", slaStatus: "met", description: "Customer requesting cancellation of monthly PalmAura subscription.", lastResponse: "Subscription cancelled, confirmation email sent" },
];

function SlaBadge({ status }: { status: "met" | "at-risk" | "breached" }) {
  const config = {
    met: { label: "SLA Met", variant: "default" as const, className: "" },
    "at-risk": { label: "At Risk", variant: "secondary" as const, className: "border border-yellow-500/30 text-yellow-700 dark:text-yellow-400" },
    breached: { label: "SLA Breached", variant: "destructive" as const, className: "" },
  };
  const c = config[status];
  return (
    <Badge
      variant={c.variant}
      className={cn("no-default-hover-elevate no-default-active-elevate text-[10px]", c.className)}
    >
      <Timer className="h-2.5 w-2.5 mr-1" />
      {c.label}
    </Badge>
  );
}

export default function Support() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const slaMetCount = tickets.filter((t) => t.slaStatus === "met").length;
  const slaBreachedCount = tickets.filter((t) => t.slaStatus === "breached").length;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-support">
              Support
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-ticket-count">
            {filtered.length} tickets
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-ticket-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-ticket-priority-filter">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Open Tickets"
            value="3"
            icon={Headphones}
          />
          <KpiCard
            title="Avg Response Time"
            value="2.4h"
            icon={Clock}
            subtitle="Target: 4h"
          />
          <KpiCard
            title="SLA Compliance"
            value={`${Math.round((slaMetCount / tickets.length) * 100)}%`}
            change={slaBreachedCount > 0 ? -slaBreachedCount : undefined}
            trend={slaBreachedCount > 0 ? "down" : undefined}
            subtitle={slaBreachedCount > 0 ? `${slaBreachedCount} breached` : "All met"}
          />
          <KpiCard
            title="CSAT Score"
            value="4.6/5.0"
            change={3}
            trend="up"
            subtitle="vs prev period"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Ticket Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedTicket(ticket)}
                    data-testid={`row-ticket-${ticket.id}`}
                  >
                    <TableCell className="font-mono font-medium" data-testid={`text-ticket-id-${ticket.id}`}>
                      {ticket.id}
                    </TableCell>
                    <TableCell data-testid={`text-ticket-subject-${ticket.id}`}>
                      {ticket.subject}
                    </TableCell>
                    <TableCell data-testid={`text-ticket-customer-${ticket.id}`}>
                      {ticket.customer}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={priorityConfig[ticket.priority]?.variant ?? "outline"}
                        className="no-default-hover-elevate no-default-active-elevate"
                        data-testid={`badge-priority-${ticket.id}`}
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground" data-testid={`text-ticket-response-${ticket.id}`}>
                      {ticket.responseTime}
                    </TableCell>
                    <TableCell data-testid={`badge-sla-${ticket.id}`}>
                      <SlaBadge status={ticket.slaStatus} />
                    </TableCell>
                    <TableCell data-testid={`text-ticket-assigned-${ticket.id}`}>
                      <div className="flex items-center gap-1.5">
                        {ticket.assignedTo === "Bot" ? (
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : ticket.assignedTo !== "Unassigned" ? (
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : null}
                        <span className={ticket.assignedTo === "Unassigned" ? "text-muted-foreground" : ""}>
                          {ticket.assignedTo}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <SheetContent data-testid="sheet-ticket-detail">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-detail-ticket-id">
                    {selectedTicket.id}
                  </SheetTitle>
                  <SheetDescription>Ticket details and conversation history</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selectedTicket.status} />
                    <Badge
                      variant={priorityConfig[selectedTicket.priority]?.variant ?? "outline"}
                      className="no-default-hover-elevate no-default-active-elevate"
                    >
                      {selectedTicket.priority}
                    </Badge>
                    <SlaBadge status={selectedTicket.slaStatus} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                    <p className="text-sm font-medium" data-testid="text-detail-subject">{selectedTicket.subject}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer</p>
                    <p className="text-sm" data-testid="text-detail-customer">{selectedTicket.customer}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-detail-description">{selectedTicket.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Response Time</p>
                        <p className="font-mono font-bold" data-testid="text-detail-response-time">
                          {selectedTicket.responseTime}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Created</p>
                        <p className="font-mono font-bold" data-testid="text-detail-created">
                          {selectedTicket.created}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">Assigned To</p>
                        <p className="font-bold" data-testid="text-detail-assigned">
                          {selectedTicket.assignedTo}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground">SLA Target</p>
                        <p className="font-mono font-bold" data-testid="text-detail-sla-target">
                          {selectedTicket.priority === "high" ? "2h" : selectedTicket.priority === "medium" ? "4h" : "8h"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Response</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-detail-last-response">{selectedTicket.lastResponse}</p>
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
