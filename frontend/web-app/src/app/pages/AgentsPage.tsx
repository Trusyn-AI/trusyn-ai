import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, RefreshCw, Save, Trash2 } from 'lucide-react';
import { agentService } from '../api/services/agentService';
import type { AgentDto } from '../api/types/auth';
import { ApiError } from '../api/errors';
import { useSessionUser } from '../state/session';

const statusOptions: AgentDto['status'][] = ['OPERATIONAL', 'WARNING', 'QUARANTINED', 'BLOCKED'];

function clampTrustScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function parseApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export function AgentsPage() {
  const sessionUser = useSessionUser();
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgentDto['status']>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<AgentDto['status']>('OPERATIONAL');
  const [editTrustScore, setEditTrustScore] = useState(0);

  const canDelete = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ORG_ADMIN';

  const loadAgents = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await agentService.list({
        limit,
        offset,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sort_by: 'updated_at',
        sort_order: 'desc',
      });

      setAgents(result.items);
      setTotal(result.total);
      setError(null);

      if (!selectedId && result.items.length > 0) {
        setSelectedId(result.items[0].id);
      }
      if (selectedId && !result.items.some(item => item.id === selectedId)) {
        setSelectedId(result.items[0]?.id ?? null);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, offset, selectedId, statusFilter]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const selectedAgent = useMemo(
    () => agents.find(item => item.id === selectedId) ?? null,
    [agents, selectedId],
  );

  useEffect(() => {
    if (!selectedAgent) return;
    setEditName(selectedAgent.name);
    setEditDescription(selectedAgent.description ?? '');
    setEditStatus(selectedAgent.status);
    setEditTrustScore(selectedAgent.trust_score);
  }, [selectedAgent]);

  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const updated = await agentService.update(selectedAgent.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        trust_score: clampTrustScore(editTrustScore),
      });
      setAgents(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setSuccessMessage('Agent updated successfully.');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent || !canDelete) return;
    setDeleting(true);
    setSuccessMessage(null);
    setError(null);

    try {
      await agentService.remove(selectedAgent.id);
      setSuccessMessage('Agent deleted successfully.');
      const nextItems = agents.filter(item => item.id !== selectedAgent.id);
      setAgents(nextItems);
      setSelectedId(nextItems[0]?.id ?? null);
      setTotal(prev => Math.max(prev - 1, 0));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const activeAgentsCount = agents.filter(item => item.status === 'OPERATIONAL').length;

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Agent Monitoring</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Manage lifecycle, trust posture, and operational status of AI agents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAgents(true)}
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

      {(error || successMessage) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} style={{ color: '#EF4444' }} />
              <span className="text-sm" style={{ color: '#B42318' }}>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#047857' }}>
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Total Agents</p>
          <p style={{ color: '#8B3CF7', fontSize: 24, fontWeight: 700 }}>{total}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Operational</p>
          <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>{activeAgentsCount}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Warnings</p>
          <p style={{ color: '#F59E0B', fontSize: 24, fontWeight: 700 }}>{agents.filter(item => item.status === 'WARNING').length}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Quarantined/Blocked</p>
          <p style={{ color: '#EF4444', fontSize: 24, fontWeight: 700 }}>
            {agents.filter(item => item.status === 'QUARANTINED' || item.status === 'BLOCKED').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-5 min-h-[500px]">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(139,60,247,0.08)' }}>
            <p className="text-xs" style={{ color: '#1A1A2E' }}>Agent List</p>
            <select
              value={statusFilter}
              onChange={event => {
                setOffset(0);
                setStatusFilter(event.target.value as 'ALL' | AgentDto['status']);
              }}
              className="text-xs rounded-lg px-2 py-1"
              style={{ background: '#F8F5FF', color: '#1A1A2E', border: '1px solid rgba(139,60,247,0.18)' }}
            >
              <option value="ALL">All Status</option>
              {statusOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[560px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>No agents found for current filter.</div>
            ) : (
              agents.map(agent => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedId(agent.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: selectedId === agent.id ? 'rgba(139,60,247,0.08)' : '#FFFFFF',
                    borderBottom: '1px solid rgba(139,60,247,0.07)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: '#1A1A2E' }}>{agent.name}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: agent.status === 'OPERATIONAL' ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)',
                        color: agent.status === 'OPERATIONAL' ? '#10B981' : '#F59E0B',
                      }}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{agent.description || 'No description'}</p>
                  <div className="mt-2 w-full h-2 rounded-full" style={{ background: 'rgba(139,60,247,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${agent.trust_score}%`, background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)' }} />
                  </div>
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
          {!selectedAgent ? (
            <p className="text-sm" style={{ color: '#717182' }}>Select an agent to view details.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ color: '#1A1A2E' }}>{selectedAgent.name}</h2>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{selectedAgent.id}</p>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#717182' }}>
                  <Activity size={13} />
                  Last active: {selectedAgent.last_active_at ? new Date(selectedAgent.last_active_at).toLocaleString() : 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#717182' }}>Name</label>
                  <input
                    value={editName}
                    onChange={event => setEditName(event.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#717182' }}>Status</label>
                  <select
                    value={editStatus}
                    onChange={event => setEditStatus(event.target.value as AgentDto['status'])}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  >
                    {statusOptions.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={event => setEditDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Trust Score ({clampTrustScore(editTrustScore)}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={clampTrustScore(editTrustScore)}
                  onChange={event => setEditTrustScore(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Permissions JSON</p>
                  <pre className="text-xs mt-1 overflow-auto" style={{ color: '#1A1A2E' }}>
                    {JSON.stringify(selectedAgent.permissions ?? {}, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8F5FF' }}>
                  <p className="text-xs" style={{ color: '#717182' }}>Metadata JSON</p>
                  <pre className="text-xs mt-1 overflow-auto" style={{ color: '#1A1A2E' }}>
                    {JSON.stringify(selectedAgent.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)' }}
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                    opacity: canDelete ? 1 : 0.5,
                  }}
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete Agent'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
