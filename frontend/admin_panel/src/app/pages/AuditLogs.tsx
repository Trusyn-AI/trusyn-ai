import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Download, Calendar } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { auditService } from '../api/services/auditService';
import type { AuditLogDto } from '../api/types/admin';
import { normalizeSeverity } from '../utils/formatters';
import { getSeverityBgColor } from '../utils/themeBadges';

const PAGE_SIZE = 30;

type TimeRange = '24h' | '7d' | '30d' | 'all';

function toIsoFromRange(range: TimeRange): string | undefined {
  if (range === 'all') return undefined;
  const now = Date.now();
  const delta = range === '24h' ? 24 : range === '7d' ? 24 * 7 : 24 * 30;
  return new Date(now - delta * 60 * 60 * 1000).toISOString();
}

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = async (nextOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.list({
        limit: PAGE_SIZE,
        offset: nextOffset,
        severity: severityFilter === 'all' ? undefined : (severityFilter.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        search: searchTerm || undefined,
        start_at: toIsoFromRange(timeRangeFilter),
        sort_by: 'timestamp',
        sort_order: 'desc',
      });
      setLogs(data.items);
      setTotal(data.total);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
  }, [severityFilter, timeRangeFilter]);

  const blockedCount = useMemo(() => logs.filter((log) => log.event_type.toLowerCase().includes('block')).length, [logs]);
  const reviewCount = useMemo(() => logs.filter((log) => log.event_type.toLowerCase().includes('review')).length, [logs]);

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await auditService.exportAuditCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trusyn-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit log export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">Enterprise compliance and activity logging system</p>
        </div>
        <Button className="bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8] gap-2" onClick={() => void handleExportCsv()} disabled={exporting}>
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export Logs'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <GlowCard glow glowColor="purple">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void load(0);
                }
              }}
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              setTimeRangeFilter((current) =>
                current === '24h' ? '7d' : current === '7d' ? '30d' : current === '30d' ? 'all' : '24h',
              )
            }
          >
            <Calendar className="w-4 h-4" />
            {timeRangeFilter === '24h'
              ? 'Last 24 Hours'
              : timeRangeFilter === '7d'
                ? 'Last 7 Days'
                : timeRangeFilter === '30d'
                  ? 'Last 30 Days'
                  : 'All Time'}
          </Button>

          <Button variant="outline" onClick={() => void load(0)} disabled={loading}>
            {loading ? 'Loading...' : 'Apply'}
          </Button>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlowCard glow glowColor="cyan" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
          <p className="text-3xl font-bold">{total.toLocaleString()}</p>
        </GlowCard>
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Blocked Actions</p>
          <p className="text-3xl font-bold text-red-400">{blockedCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="purple" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Allowed / Other</p>
          <p className="text-3xl font-bold text-green-400">{Math.max(0, logs.length - blockedCount - reviewCount)}</p>
        </GlowCard>
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-400">{reviewCount}</p>
        </GlowCard>
      </div>

      <GlowCard glow glowColor="gradient">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Event Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Message</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Severity</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const normalizedSeverity = normalizeSeverity(log.severity);
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{log.event_type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm max-w-lg truncate">{log.message}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`${getSeverityBgColor(normalizedSeverity)} capitalize`}>{normalizedSeverity}</Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        View
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No audit logs found matching your filters</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + logs.length, total)} of {total} logs
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => void load(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => void load(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      </GlowCard>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl glass-elevated">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>{selectedLog?.event_type}</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Timestamp</p>
                <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Message</p>
                <p>{selectedLog.message}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Metadata</p>
                <pre className="p-3 rounded-lg bg-muted/40 overflow-x-auto text-xs">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
