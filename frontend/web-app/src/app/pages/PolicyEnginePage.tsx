import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw, Save, Shield, Trash2 } from 'lucide-react';
import { policyService, type PolicyCreatePayload } from '../api/services/policyService';
import type { PolicyDto } from '../api/types/auth';
import type { Decision } from '../api/types/common';
import { ApiError } from '../api/errors';
import { useSessionUser } from '../state/session';

const enforcementOptions: Decision[] = ['ALLOW', 'BLOCK', 'REVIEW', 'QUARANTINE', 'RATE_LIMIT'];

function parseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Unable to complete this policy action.';
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function prettyJson(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2);
}

export function PolicyEnginePage() {
  const sessionUser = useSessionUser();
  const [policies, setPolicies] = useState<PolicyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [enabledFilter, setEnabledFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAction, setEditAction] = useState<Decision>('REVIEW');
  const [editEnabled, setEditEnabled] = useState(true);
  const [editRuleDefinitionText, setEditRuleDefinitionText] = useState(`{
  "match": "all",
  "conditions": []
}`);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createAction, setCreateAction] = useState<Decision>('REVIEW');
  const [createEnabled, setCreateEnabled] = useState(true);
  const [createRuleDefinitionText, setCreateRuleDefinitionText] = useState(`{
  "match": "all",
  "conditions": []
}`);

  const canManage = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ORG_ADMIN';

  const loadPolicies = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await policyService.list({
        limit,
        offset,
        enabled: enabledFilter === 'ALL' ? undefined : enabledFilter === 'ENABLED',
        sort_by: 'updated_at',
        sort_order: 'desc',
      });

      setPolicies(result.items);
      setTotal(result.total);
      setError(null);

      if (!selectedId && result.items.length > 0) setSelectedId(result.items[0].id);
      if (selectedId && !result.items.some(policy => policy.id === selectedId)) {
        setSelectedId(result.items[0]?.id ?? null);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enabledFilter, limit, offset, selectedId]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const selectedPolicy = useMemo(
    () => policies.find(policy => policy.id === selectedId) ?? null,
    [policies, selectedId],
  );

  useEffect(() => {
    if (!selectedPolicy) return;
    setEditName(selectedPolicy.name);
    setEditDescription(selectedPolicy.description ?? '');
    setEditAction(selectedPolicy.enforcement_action);
    setEditEnabled(selectedPolicy.enabled);
    setEditRuleDefinitionText(prettyJson(selectedPolicy.rule_definition));
  }, [selectedPolicy]);

  const handleCreatePolicy = async () => {
    if (!canManage) return;
    const parsedRuleDefinition = parseJsonObject(createRuleDefinitionText);
    if (!createName.trim()) {
      setError('Policy name is required.');
      return;
    }
    if (!parsedRuleDefinition) {
      setError('Rule definition must be valid JSON object.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: PolicyCreatePayload = {
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        enforcement_action: createAction,
        enabled: createEnabled,
        rule_definition: parsedRuleDefinition,
      };
      const created = await policyService.create(payload);
      setPolicies(prev => [created, ...prev]);
      setSelectedId(created.id);
      setTotal(prev => prev + 1);
      setCreateName('');
      setCreateDescription('');
      setCreateAction('REVIEW');
      setCreateEnabled(true);
      setCreateRuleDefinitionText(`{
  "match": "all",
  "conditions": []
}`);
      setSuccessMessage('Policy created successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!selectedPolicy || !canManage) return;
    const parsedRuleDefinition = parseJsonObject(editRuleDefinitionText);
    if (!editName.trim()) {
      setError('Policy name is required.');
      return;
    }
    if (!parsedRuleDefinition) {
      setError('Rule definition must be valid JSON object.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await policyService.update(selectedPolicy.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        enforcement_action: editAction,
        enabled: editEnabled,
        rule_definition: parsedRuleDefinition,
      });
      setPolicies(prev => prev.map(policy => (policy.id === updated.id ? updated : policy)));
      setSuccessMessage('Policy updated successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!selectedPolicy || !canManage) return;

    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await policyService.remove(selectedPolicy.id);
      const nextList = policies.filter(policy => policy.id !== selectedPolicy.id);
      setPolicies(nextList);
      setSelectedId(nextList[0]?.id ?? null);
      setTotal(prev => Math.max(prev - 1, 0));
      setSuccessMessage('Policy deleted successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setDeleting(false);
    }
  };

  const enabledCount = policies.filter(policy => policy.enabled).length;

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Policy Engine</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Configure governance rules that drive runtime decisions for AI agents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPolicies(true)}
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

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Total Policies</p>
          <p style={{ color: '#8B3CF7', fontSize: 24, fontWeight: 700 }}>{total}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Enabled Policies</p>
          <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>{enabledCount}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Current Page Size</p>
          <p style={{ color: '#38BDF8', fontSize: 24, fontWeight: 700 }}>{policies.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-5 min-h-[560px]">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(139,60,247,0.08)' }}>
            <p className="text-xs" style={{ color: '#1A1A2E' }}>Policy List</p>
            <select
              value={enabledFilter}
              onChange={event => {
                setOffset(0);
                setEnabledFilter(event.target.value as 'ALL' | 'ENABLED' | 'DISABLED');
              }}
              className="text-xs rounded-lg px-2 py-1"
              style={{ background: '#F8F5FF', color: '#1A1A2E', border: '1px solid rgba(139,60,247,0.18)' }}
            >
              <option value="ALL">All</option>
              <option value="ENABLED">Enabled</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          <div className="max-h-[560px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: '#717182' }}>No policies found.</div>
            ) : (
              policies.map(policy => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setSelectedId(policy.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: selectedId === policy.id ? 'rgba(139,60,247,0.08)' : '#FFFFFF',
                    borderBottom: '1px solid rgba(139,60,247,0.07)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: '#1A1A2E' }}>{policy.name}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: policy.enabled ? 'rgba(16,185,129,0.14)' : 'rgba(113,113,130,0.14)',
                        color: policy.enabled ? '#10B981' : '#717182',
                      }}
                    >
                      {policy.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{policy.enforcement_action}</p>
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

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Plus size={14} style={{ color: '#8B3CF7' }} />
              <p className="text-sm" style={{ color: '#1A1A2E' }}>Create New Policy</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                value={createName}
                onChange={event => setCreateName(event.target.value)}
                placeholder="Policy name"
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
              />
              <select
                value={createAction}
                onChange={event => setCreateAction(event.target.value as Decision)}
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
              >
                {enforcementOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <textarea
              value={createDescription}
              onChange={event => setCreateDescription(event.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm mb-3"
              style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
            />

            <textarea
              value={createRuleDefinitionText}
              onChange={event => setCreateRuleDefinitionText(event.target.value)}
              rows={7}
              className="w-full rounded-xl px-3 py-2 text-sm font-mono mb-3"
              style={{ background: '#0F0F1A', border: '1px solid rgba(139,60,247,0.22)', color: '#E5E7EB' }}
            />

            <label className="inline-flex items-center gap-2 text-sm mb-3" style={{ color: '#1A1A2E' }}>
              <input
                type="checkbox"
                checked={createEnabled}
                onChange={event => setCreateEnabled(event.target.checked)}
              />
              Enabled
            </label>

            <div>
              <button
                type="button"
                onClick={handleCreatePolicy}
                disabled={!canManage || creating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)', opacity: canManage ? 1 : 0.6 }}
              >
                <Shield size={14} />
                {creating ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            {!selectedPolicy ? (
              <p className="text-sm" style={{ color: '#717182' }}>Select a policy to edit.</p>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: '#1A1A2E' }}>Edit Policy</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={editName}
                    onChange={event => setEditName(event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  />
                  <select
                    value={editAction}
                    onChange={event => setEditAction(event.target.value as Decision)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  >
                    {enforcementOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={editDescription}
                  onChange={event => setEditDescription(event.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 text-sm mb-3"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />

                <textarea
                  value={editRuleDefinitionText}
                  onChange={event => setEditRuleDefinitionText(event.target.value)}
                  rows={7}
                  className="w-full rounded-xl px-3 py-2 text-sm font-mono mb-3"
                  style={{ background: '#0F0F1A', border: '1px solid rgba(139,60,247,0.22)', color: '#E5E7EB' }}
                />

                <label className="inline-flex items-center gap-2 text-sm mb-3" style={{ color: '#1A1A2E' }}>
                  <input type="checkbox" checked={editEnabled} onChange={event => setEditEnabled(event.target.checked)} />
                  Enabled
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePolicy}
                    disabled={!canManage || saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)', opacity: canManage ? 1 : 0.6 }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePolicy}
                    disabled={!canManage || deleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                      opacity: canManage ? 1 : 0.5,
                    }}
                  >
                    <Trash2 size={14} />
                    {deleting ? 'Deleting...' : 'Delete Policy'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
