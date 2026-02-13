import { useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warning" | "error";
  source: string;
  message: string;
  duration: string;
}

const sampleLogs: LogEntry[] = [
  { id: 1, timestamp: "2026-02-07 14:32:18", level: "info", source: "n8n", message: "Ad Concept Generator completed - 3 concepts created", duration: "4,200ms" },
  { id: 2, timestamp: "2026-02-07 14:30:02", level: "info", source: "Airtable", message: "Batch update: 10 records in Ad Copy table", duration: "890ms" },
  { id: 3, timestamp: "2026-02-07 13:15:44", level: "warning", source: "n8n", message: "Competitor Ad Scraper - rate limited by Meta, retrying in 60s", duration: "62,400ms" },
  { id: 4, timestamp: "2026-02-07 12:00:01", level: "info", source: "System", message: "Metrics Ingestion triggered (scheduled)", duration: "120ms" },
  { id: 5, timestamp: "2026-02-07 11:58:33", level: "info", source: "n8n", message: "Metrics Ingestion completed - 24 records updated", duration: "3,800ms" },
  { id: 6, timestamp: "2026-02-07 09:45:12", level: "error", source: "n8n", message: "Image Prompt Builder failed - Airtable 429 Too Many Requests", duration: "1,200ms" },
  { id: 7, timestamp: "2026-02-07 09:45:14", level: "info", source: "System", message: "Retry scheduled for Image Prompt Builder (attempt 2)", duration: "50ms" },
  { id: 8, timestamp: "2026-02-07 09:46:20", level: "info", source: "n8n", message: "Image Prompt Builder retry succeeded", duration: "2,100ms" },
  { id: 9, timestamp: "2026-02-06 22:00:03", level: "info", source: "n8n", message: "Winner Detection completed - 1 new winner flagged", duration: "5,600ms" },
  { id: 10, timestamp: "2026-02-06 18:30:00", level: "warning", source: "Airtable", message: "Rate limit approaching - 4 of 5 requests/sec used", duration: "0ms" },
];

const levelVariant: Record<string, "outline" | "secondary" | "destructive"> = {
  info: "outline",
  warning: "secondary",
  error: "destructive",
};

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filtered = sampleLogs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (sourceFilter !== "all" && log.source !== sourceFilter) return false;
    return true;
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-logs">
              Logs
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} log entries
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-level-filter">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-source-filter">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="n8n">n8n</SelectItem>
              <SelectItem value="Airtable">Airtable</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedLog(log)}
                    data-testid={`row-log-${log.id}`}
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap" data-testid={`text-log-timestamp-${log.id}`}>
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge variant={levelVariant[log.level]} className="no-default-hover-elevate">
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="no-default-hover-elevate">
                        {log.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" data-testid={`text-log-message-${log.id}`}>
                      {log.message}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap" data-testid={`text-log-duration-${log.id}`}>
                      {log.duration}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No log entries match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent data-testid="sheet-log-detail">
            {selectedLog && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading">Log Detail</SheetTitle>
                  <SheetDescription>Full details for selected log entry</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Timestamp</p>
                    <p className="text-sm font-mono" data-testid="text-detail-timestamp">{selectedLog.timestamp}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Level</p>
                    <Badge variant={levelVariant[selectedLog.level]} className="no-default-hover-elevate">
                      {selectedLog.level}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Source</p>
                    <Badge variant="outline" className="no-default-hover-elevate">
                      {selectedLog.source}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Message</p>
                    <p className="text-sm" data-testid="text-detail-message">{selectedLog.message}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-mono" data-testid="text-detail-duration">{selectedLog.duration}</p>
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
