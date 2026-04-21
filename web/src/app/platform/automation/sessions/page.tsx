"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  SkipForward,
  Tag,
  Folder,
  ExternalLink,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface AutomationSession {
  id: string;
  status: string;
  workflowStep: string;
  telegramChatId: string | null;
  telegramMessageId: number | null;
  selectedCandidateRank: number | null;
  generatedPostId: string | null;
  assignedCategoryId: string | null;
  assignedSecondaryCategoryId: string | null;
  selectedTagIds: string[];
  errorMessage: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  candidate?: {
    title: string;
    description: string | null;
    sourceUrl: string | null;
  } | null;
  post?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  secondaryCategory?: {
    id: string;
    name: string;
  } | null;
  tags?: Array<{ id: string; name: string }> | null;
}

interface SessionsResponse {
  sessions: AutomationSession[];
  total: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  selected: { label: "Selected", variant: "secondary" },
  generated: { label: "Generated", variant: "default" },
  categorizing: { label: "Categorizing", variant: "secondary" },
  tagging: { label: "Tagging", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const workflowStepConfig: Record<string, { label: string; icon: any }> = {
  topic_selection: { label: "Topic Selection", icon: FileText },
  draft_generated: { label: "Draft Generated", icon: FileText },
  category_selection: { label: "Category Selection", icon: Folder },
  tag_selection: { label: "Tag Selection", icon: Tag },
  completed: { label: "Completed", icon: CheckCircle2 },
};

export default function AutomationSessionsPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery<{ sessions: AutomationSession[]; total: number }>({
    queryKey: ["/api/platform/automation/sessions", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      return clientFetch<SessionsResponse>(`/api/platform/automation/sessions?${params}`);
    },
  });

  const handleExpireSessions = async () => {
    try {
      await clientFetch("/api/platform/automation/sessions/expire", { method: "POST", body: {} });
      toast.success("Expired sessions cleaned up");
      refetch();
    } catch {
      toast.error("Failed to expire sessions");
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Automation Sessions"
          description="Monitor RSS automation workflow sessions and their progress through topic selection, draft generation, and category/tag assignment."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExpireSessions}>
                <Clock className="mr-2 h-4 w-4" />
                Expire Old
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Session History</CardTitle>
                <CardDescription>
                  Track automation sessions from topic selection to final draft assignment
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="categorizing">Categorizing</SelectItem>
                  <SelectItem value="tagging">Tagging</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data && data.sessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow Step</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((session) => {
                    const statusInfo = statusConfig[session.status] || { label: session.status, variant: "secondary" as const };
                    const workflowInfo = workflowStepConfig[session.workflowStep] || { label: session.workflowStep, icon: FileText };
                    const WorkflowIcon = workflowInfo.icon;

                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-xs">
                          {session.id.slice(0, 8)}...{session.id.slice(-4)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="space-y-1">
                            <div className="font-medium truncate">
                              {session.candidate?.title || "Unknown"}
                            </div>
                            {session.candidate?.sourceUrl && (
                              <a
                                href={session.candidate.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Source
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{workflowInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.category || session.secondaryCategory ? (
                            <div className="space-y-1">
                              {session.category && (
                                <div className="flex items-center gap-2">
                                  <Folder className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">{session.category.name}</span>
                                  <Badge variant="outline" className="text-xs">Primary</Badge>
                                </div>
                              )}
                              {session.secondaryCategory && (
                                <div className="flex items-center gap-2">
                                  <Folder className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{session.secondaryCategory.name}</span>
                                  <Badge variant="outline" className="text-xs">Secondary</Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.tags && session.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {session.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                              {session.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{session.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(session.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {session.post ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a href={`/platform/blog-posts`} className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  View
                                </a>
                              </Button>
                            ) : session.status === "failed" ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {session.errorMessage?.slice(0, 20) || "Error"}
                              </Badge>
                            ) : session.status === "expired" ? (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No sessions found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {statusFilter !== "all"
                    ? `No sessions with status "${statusFilter}"`
                    : "Start by syncing RSS feeds to create automation sessions"}
                </p>
              </div>
            )}

            {data && data.sessions.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {data.sessions.length} of {data.total} sessions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.sessions.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
