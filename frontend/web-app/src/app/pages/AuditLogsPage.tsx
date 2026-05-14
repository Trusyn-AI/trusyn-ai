import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { auditService } from '../api/services/auditService';
import type { AuditLogDto } from '../api/types/auth';
import type { Severity } from '../api/types/common';
import { ApiError } from '../api/errors';

function parseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Unable to load audit logs.';
}

function severityColor(value: Severity): string {
  return {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  }[value];
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [severity, setSeverity] = useState<'ALL' | Severity>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadLogs = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await auditService.list({
        limit,
        offset,
        severity: severity === 'ALL' ? undefined : severity,
        search: search.trim() || undefined,
        sort_by: 'timestamp',
        sort_order: 'desc',
      });

      setLogs(result.items);
      setTotal(result.total);
      setError(null);

      if (!selectedId && result.items.length > 0) setSelectedId(result.items[0].id);
      if (selectedId && !result.items.some(item => item.id === selectedId)) {
        setSelectedId(result.items[0]?.id ?? null);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, offset, search, selectedId, severity]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const selectedLog = useMemo(
    () => logs.find(item => item.id === selectedId) ?? null,
    [logs, selectedId],
  );

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Audit Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Immutable governance and runtime activity history for your organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadLogs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(139,60,247,0.08)',
            border: '1px solid rgba(139,60,247,0.2)',
            color: '#8B3CF7',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#EF4444' }} />
          <span className="text-sm" style={{ color: '#B42318' }}>{error}</span>
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
        <div className="grid grid-cols-[1fr_180px_140px_auto] gap-3 mb-4">
          <input
            value={search}
            onChange={event => {
              setOffset(0);
              setSearch(event.target.value);
            }}
            placeholder="Search message..."
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
          />
          <select
            value={severity}
            onChange={event => {
              setOffset(0);
              setSeverity(event.target.value as 'ALL' | Severity);
            }}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
          >
            <option value="ALL">All Severity</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <select
            value={limit}
            onChange={event => {
              setOffset(0);
              setLimit(Number(event.target.value));
            }}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <div className="flex items-center justify-end text-xs" style={{ color: '#717182' }}>
            {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_140px_220px] gap-5">
          <div>
            <div className="grid grid-cols-[140px_120px_1fr_170px] gap-3 px-3 py-2 rounded-lg" style={{ background: '#F8F5FF', color: '#717182', fontSize: 12 }}>
              <span>Severity</span>
              <span>Event</span>
              <span>Message</span>
              <span>Timestamp</span>
            </div>

            <div className="max-h-[520px] overflow-auto">
              {loading ? (
                <div className="px-3 py-4 text-sm" style={{ color: '#717182' }}>Loading audit logs...</div>
              ) : logs.length === 0 ? (
                <div className="px-3 py-4 text-sm" style={{ color: '#717182' }}>No logs found for applied filters.</div>
              ) : (
                logs.map(log => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedId(log.id)}
                    className="w-full text-left grid grid-cols-[140px_120px_1fr_170px] gap-3 px-3 py-2.5 border-b"
                    style={{
                      borderColor: 'rgba(139,60,247,0.08)',
                      background: selectedId === log.id ? 'rgba(139,60,247,0.08)' : '#FFFFFF',
                    }}
                  >
                    <span className="text-xs px-2 py-0.5 rounded w-fit" style={{ color: severityColor(log.severity), background: `${severityColor(log.severity)}22` }}>{log.severity}</span>
                    <span className="text-xs" style={{ color: '#1A1A2E' }}>{log.event_type}</span>
                    <span className="text-xs truncate" style={{ color: '#1A1A2E' }}>{log.message}</span>
                    <span className="text-xs" style={{ color: '#717182' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOffset(prev => Math.max(prev - limit, 0))}
                disabled={offset === 0}
                className="text-xs px-3 py-1 rounded"
                style={{ background: '#F8F5FF', color: '#1A1A2E' }}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setOffset(prev => prev + limit)}
                disabled={offset + limit >= total}
                className="text-xs px-3 py-1 rounded"
                style={{ background: '#F8F5FF', color: '#1A1A2E' }}
              >
                Next
              </button>
            </div>
          </div>

          <div className="col-span-2 rounded-xl p-4" style={{ background: '#F8F5FF' }}>
            {!selectedLog ? (
              <p className="text-sm" style={{ color: '#717182' }}>Select a log row to inspect details.</p>
            ) : (
              <div className="space-y-3">
                <h2 style={{ color: '#1A1A2E' }}>Log Detail</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg px-3 py-2" style={{ background: '#FFFFFF' }}>
                    <p className="text-xs" style={{ color: '#717182' }}>Log ID</p>
                    <p className="text-xs mt-1" style={{ color: '#1A1A2E' }}>{selectedLog.id}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ background: '#FFFFFF' }}>
                    <p className="text-xs" style={{ color: '#717182' }}>User ID</p>
                    <p className="text-xs mt-1" style={{ color: '#1A1A2E' }}>{selectedLog.user_id ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-lg px-3 py-2" style={{ background: '#FFFFFF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Message</p>
                  <p className="text-sm mt-1" style={{ color: '#1A1A2E' }}>{selectedLog.message}</p>
                </div>

                <div className="rounded-lg px-3 py-2" style={{ background: '#FFFFFF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Metadata JSON</p>
                  <pre className="text-xs mt-1 overflow-auto" style={{ color: '#1A1A2E' }}>
                    {JSON.stringify(selectedLog.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
