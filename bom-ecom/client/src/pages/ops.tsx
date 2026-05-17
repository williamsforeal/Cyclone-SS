import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "--";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Ops() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/airtable/jobs"],
  });

  const allJobs = jobs || [];

  const dynamicStatuses = useMemo(() => {
    return Array.from(new Set(allJobs.map((j: any) => j.Status).filter(Boolean))).sort();
  }, [allJobs]);

  const dynamicJobTypes = useMemo(() => {
    return Array.from(new Set(allJobs.map((j: any) => j["Job Type"]).filter(Boolean))).sort();
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job: any) => {
      if (statusFilter !== "all" && job.Status !== statusFilter) return false;
      if (jobTypeFilter !== "all" && job["Job Type"] !== jobTypeFilter) return false;
      return true;
    });
  }, [allJobs, statusFilter, jobTypeFilter]);

  const totalJobs = allJobs.length;
  const successCount = allJobs.filter((j: any) => j.Status === "success" || j.Status === "Generated").length;
  const failedCount = allJobs.filter((j: any) => j.Status === "failed").length;
  const successRate = totalJobs > 0 ? ((successCount / totalJobs) * 100).toFixed(1) : "0";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-heading text-xl font-bold" data-testid="text-ops-heading">
            Ops / Automations
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/airtable/jobs"] });
                toast({ title: "Jobs refreshed" });
              }}
              data-testid="button-refresh-jobs"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <KpiCard
                title="Total Jobs"
                value={String(totalJobs)}
                icon={Activity}
              />
              <KpiCard
                title="Success Rate"
                value={`${successRate}%`}
                icon={CheckCircle2}
              />
              <KpiCard
                title="Failed Jobs"
                value={String(failedCount)}
                icon={XCircle}
              />
              <KpiCard
                title="Completed"
                value={String(successCount)}
                icon={Clock}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {dynamicStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-stage-filter">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Types</SelectItem>
              {dynamicJobTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== "all" || jobTypeFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStatusFilter("all"); setJobTypeFilter("all"); }}
              data-testid="button-reset-filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / ID</TableHead>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job: any) => (
                  <TableRow
                    key={job.recordId}
                    className="cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                    data-testid={`row-job-${job.recordId}`}
                  >
                    <TableCell className="font-medium font-mono text-sm" data-testid={`text-job-name-${job.recordId}`}>
                      {job.Name || job.recordId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]" data-testid={`badge-jobtype-${job.recordId}`}>
                        {job["Job Type"] || "--"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.Status || "unknown"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs" data-testid={`text-created-${job.recordId}`}>
                      {formatDate(job["Created At"] || job.createdTime)}
                    </TableCell>
                    <TableCell>
                      {job["Error Message"] ? (
                        <span
                          className="text-destructive text-xs max-w-[200px] truncate block"
                          data-testid={`text-error-${job.recordId}`}
                        >
                          {job["Error Message"]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {allJobs.length === 0 ? "No jobs recorded yet." : "No jobs match the current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            {selectedJob && (
              <div className="space-y-6">
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="text-sheet-job-name">
                    {selectedJob.Name || selectedJob.recordId}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex items-center gap-3 flex-wrap">
                  {selectedJob["Job Type"] && (
                    <Badge variant="outline" data-testid="badge-sheet-jobtype">
                      {selectedJob["Job Type"]}
                    </Badge>
                  )}
                  <StatusBadge status={selectedJob.Status || "unknown"} />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Record ID</p>
                    <p className="font-mono text-sm" data-testid="text-sheet-record-id">
                      {selectedJob.recordId}
                    </p>
                  </div>

                  {selectedJob["Created At"] && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <p className="font-mono text-sm" data-testid="text-sheet-created">
                        {formatDate(selectedJob["Created At"])}
                      </p>
                    </div>
                  )}
                </div>

                {selectedJob["Error Message"] && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Error Message</p>
                      <p
                        className="text-sm text-destructive"
                        data-testid="text-sheet-error"
                      >
                        {selectedJob["Error Message"]}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {Object.keys(selectedJob).filter((k) => !["recordId", "Name", "Status", "Job Type", "Error Message", "Created At"].includes(k)).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">All Fields</p>
                    <pre
                      className="font-mono text-xs bg-muted/30 rounded-md p-3 overflow-x-auto max-h-64"
                      data-testid="text-sheet-all-fields"
                    >
                      {formatJson(selectedJob)}
                    </pre>
                  </div>
                )}

                {selectedJob.Status === "failed" && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      toast({ title: "Retry not yet connected to n8n" });
                    }}
                    data-testid="button-retry-job"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry Job
                  </Button>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollArea>
  );
}
