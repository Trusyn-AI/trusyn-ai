import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { threatService } from '../api/services/threatService';
import type { ThreatDto } from '../api/types/auth';
import type { ThreatInvestigationDto } from '../api/types/domain';
import type { Severity } from '../api/types/common';
import { ApiError } from '../api/errors';

function parseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Unable to load threat intelligence.';
}

function severityColor(value: Severity): string {
  return {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  }[value];
}

function relativeTime(input: string): string {
  const date = new Date(input);
  const delta = Date.now() - date.getTime();
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ThreatCenterPage() {
  const [threats, setThreats] = useState<ThreatDto[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [investigation, setInvestigation] = useState<ThreatInvestigationDto | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreats = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setListLoading(true);

    try {
      const result = await threatService.list({
        limit,
        offset,
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
      });
      setThreats(result.items);
      setTotal(result.total);
      setError(null);

      if (!selectedId && result.items.length > 0) {
        setSelectedId(result.items[0].id);
      }
      if (selectedId && !result.items.some(item => item.id === selectedId)) {
        setSelectedId(result.items[0]?.id ?? null);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, [limit, offset, selectedId, severityFilter]);

  useEffect(() => {
    void loadThreats();
  }, [loadThreats]);

  useEffect(() => {
    if (!selectedId) {
      setInvestigation(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    const run = async () => {
      try {
        const data = await threatService.investigation(selectedId);
        if (!cancelled) setInvestigation(data);
      } catch (err) {
        if (!cancelled) setError(parseError(err));
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const criticalCount = useMemo(
    () => threats.filter(item => item.severity === 'CRITICAL').length,
    [threats],
  );

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Threat Investigation Center</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Investigate runtime threats, matched policies, and governance decisions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadThreats(true)}
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

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Threats in View</p>
          <p style={{ color: '#8B3CF7', fontSize: 24, fontWeight: 700 }}>{threats.length}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Critical</p>
          <p style={{ color: '#EF4444', fontSize: 24, fontWeight: 700 }}>{criticalCount}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Total Records</p>
          <p style={{ color: '#38BDF8', fontSize: 24, fontWeight: 700 }}>{total}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Selected Threat</p>
          <p className="text-xs mt-2" style={{ color: '#1A1A2E' }}>{selectedId ?? 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-5 min-h-[560px]">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(139,60,247,0.08)' }}>
            <p className="text-xs" style={{ color: '#1A1A2E' }}>Threat Feed</p>
            <select
              value={severityFilter}
              onChange={event => {
                setOffset(0);
                setSeverityFilter(event.target.value as 'ALL' | Severity);
              }}
              className="text-xs rounded-lg px-2 py-1"
              style={{ background: '#F8F5FF', color: '#1A1A2E', border: '1px solid rgba(139,60,247,0.18)' }}
            >
              <option value="ALL">All Severity</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="max-h-[560px] overflow-auto">
            {listLoading ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>Loading threats...</div>
            ) : threats.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>No threat events found.</div>
            ) : (
              threats.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="w-full text-left px-4 py-3"
                  style={{
                    background: item.id === selectedId ? 'rgba(139,60,247,0.08)' : '#FFFFFF',
                    borderBottom: '1px solid rgba(139,60,247,0.07)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs" style={{ color: '#1A1A2E' }}>{item.title}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${severityColor(item.severity)}22`, color: severityColor(item.severity) }}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{item.threat_type}</p>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{relativeTime(item.detected_at)}</p>
                </button>
              ))
            )}
          </div>

          <div className="p-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(139,60,247,0.08)' }}>
            <button
              type="button"
              onClick={() => setOffset(prev => Math.max(prev - limit, 0))}
              disabled={offset === 0}
              className="text-xs px-2 py-1 rounded"
              style={{ background: '#F8F5FF', color: '#1A1A2E' }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: '#717182' }}>
              {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              type="button"
              onClick={() => setOffset(prev => prev + limit)}
              disabled={offset + limit >= total}
              className="text-xs px-2 py-1 rounded"
              style={{ background: '#F8F5FF', color: '#1A1A2E' }}
            >
              Next
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          {detailLoading ? (
            <p className="text-sm" style={{ color: '#717182' }}>Loading investigation...</p>
          ) : !investigation ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <ShieldAlert size={30} style={{ color: 'rgba(139,60,247,0.22)' }} />
              <p className="text-sm" style={{ color: '#717182' }}>Select a threat to inspect investigation details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 style={{ color: '#1A1A2E' }}>{investigation.title}</h2>
                <p className="text-xs mt-1" style={{ color: '#717182' }}>
                  {investigation.threat_type} - {investigation.threat_id}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-3" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Severity</p>
                  <p style={{ color: severityColor(investigation.severity), fontWeight: 700 }}>{investigation.severity}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Detected</p>
                  <p className="text-xs" style={{ color: '#1A1A2E' }}>{new Date(investigation.detected_at).toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Source IP</p>
                  <p className="text-xs" style={{ color: '#1A1A2E' }}>{investigation.source_ip ?? 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: '#F8F5FF' }}>
                <p className="text-xs mb-2" style={{ color: '#717182' }}>Risk reasoning summary</p>
                <p className="text-sm" style={{ color: '#1A1A2E' }}>{investigation.risk_reasoning_summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs mb-2" style={{ color: '#717182' }}>Governance decisions</p>
                  {investigation.decisions.length === 0 ? (
                    <p className="text-xs" style={{ color: '#717182' }}>No decisions linked.</p>
                  ) : (
                    <div className="space-y-2">
                      {investigation.decisions.map(item => (
                        <div key={item.governance_decision_id} className="rounded-lg px-2 py-2" style={{ background: '#FFFFFF' }}>
                          <p className="text-xs" style={{ color: '#1A1A2E' }}>{item.decision}</p>
                          <p className="text-xs mt-1" style={{ color: '#717182' }}>Risk {item.risk_score} / Confidence {item.confidence_score}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-4" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs mb-2" style={{ color: '#717182' }}>Matched policies</p>
                  {investigation.matched_policies.length === 0 ? (
                    <p className="text-xs" style={{ color: '#717182' }}>No policy links available.</p>
                  ) : (
                    <div className="space-y-2">
                      {investigation.matched_policies.map(policy => (
                        <div key={policy.policy_id} className="rounded-lg px-2 py-2" style={{ background: '#FFFFFF' }}>
                          <p className="text-xs" style={{ color: '#1A1A2E' }}>{policy.name}</p>
                          <p className="text-xs mt-1" style={{ color: '#717182' }}>{policy.enforcement_action}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: '#F8F5FF' }}>
                <p className="text-xs mb-2" style={{ color: '#717182' }}>Timeline</p>
                {investigation.timeline.length === 0 ? (
                  <p className="text-xs" style={{ color: '#717182' }}>No timeline events.</p>
                ) : (
                  <div className="space-y-2">
                    {investigation.timeline.map((item, index) => (
                      <div key={`${item.event_type}-${index}`} className="rounded-lg px-2 py-2" style={{ background: '#FFFFFF' }}>
                        <p className="text-xs" style={{ color: '#1A1A2E' }}>{item.event_type}</p>
                        <p className="text-xs mt-1" style={{ color: '#717182' }}>{item.message}</p>
                        <p className="text-xs mt-1" style={{ color: '#717182' }}>{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
