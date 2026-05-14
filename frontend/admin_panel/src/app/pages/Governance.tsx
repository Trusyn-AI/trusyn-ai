import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { policyService, type PolicyCreatePayload } from '../api/services/policyService';
import { analyticsService } from '../api/services/analyticsService';
import type { PolicyDto } from '../api/types/admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type EnforcementAction = 'ALLOW' | 'BLOCK' | 'REVIEW' | 'QUARANTINE' | 'RATE_LIMIT';

const DEFAULT_RULE = {
  conditions: [
    {
      field: 'target',
      op: 'eq',
      value: 'external',
    },
  ],
  match: 'all',
};

export function Governance() {
  const [policies, setPolicies] = useState<PolicyDto[]>([]);
  const [decisionStats, setDecisionStats] = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    name: '',
    description: '',
    enforcement_action: 'BLOCK' as EnforcementAction,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyData, decisionDist] = await Promise.all([
        policyService.list({ limit: 100, offset: 0 }),
        analyticsService.decisionDistribution({ granularity: 'day' }),
      ]);
      setPolicies(policyData.items);
      setDecisionStats(
        decisionDist.items.map((item) => ({
          label: item.decision,
          count: item.count,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load governance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const togglePolicy = async (policy: PolicyDto) => {
    try {
      await policyService.update(policy.id, { enabled: !policy.enabled });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update policy');
    }
  };

  const createPolicy = async () => {
    if (!createDraft.name.trim()) {
      setError('Policy name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: PolicyCreatePayload = {
      name: createDraft.name.trim(),
      description: createDraft.description.trim() || undefined,
      enforcement_action: createDraft.enforcement_action,
      enabled: true,
      rule_definition: DEFAULT_RULE,
    };

    try {
      await policyService.create(payload);
      setCreateDraft({ name: '', description: '', enforcement_action: 'BLOCK' });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create policy');
    } finally {
      setSaving(false);
    }
  };

  const activePolicies = policies.filter((p) => p.enabled).length;
  const blockedToday = decisionStats.find((item) => item.label === 'BLOCK')?.count ?? 0;
  const totalEnforcements = decisionStats.reduce((sum, item) => sum + item.count, 0);

  const policyEffectivenessData = useMemo(
    () =>
      policies.slice(0, 8).map((policy) => ({
        policy: policy.name.length > 18 ? `${policy.name.slice(0, 18)}...` : policy.name,
        effectiveness: policy.enabled ? 95 : 20,
      })),
    [policies],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Governance Engine</h2>
          <p className="text-sm text-muted-foreground mt-1">Core Trusyn governance and policy enforcement system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button className="bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Close' : 'Create Policy'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showCreate && (
        <GlowCard glow glowColor="cyan">
          <h3 className="text-lg font-semibold mb-4">Create Governance Policy</h3>
          <div className="grid gap-3">
            <Input
              placeholder="Policy name"
              value={createDraft.name}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Textarea
              placeholder="Policy description"
              value={createDraft.description}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="flex gap-2 flex-wrap">
              {(['ALLOW', 'BLOCK', 'REVIEW', 'QUARANTINE', 'RATE_LIMIT'] as EnforcementAction[]).map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant={createDraft.enforcement_action === action ? 'default' : 'outline'}
                  onClick={() => setCreateDraft((prev) => ({ ...prev, enforcement_action: action }))}
                >
                  {action}
                </Button>
              ))}
            </div>
            <Button className="bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]" onClick={() => void createPolicy()} disabled={saving}>
              {saving ? 'Creating...' : 'Create Policy'}
            </Button>
          </div>
        </GlowCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlowCard glow glowColor="purple" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Engine Status</p>
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xl font-bold text-green-400">Active</p>
          </div>
        </GlowCard>

        <GlowCard glow glowColor="cyan" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Active Policies</p>
          <p className="text-3xl font-bold">{activePolicies}/{policies.length}</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Actions Blocked</p>
          <p className="text-3xl font-bold text-red-400">{blockedToday}</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Total Enforcements</p>
          <p className="text-3xl font-bold text-purple-400">{totalEnforcements.toLocaleString()}</p>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard glow glowColor="cyan">
          <h3 className="text-lg font-semibold mb-4">Active Policies</h3>

          <div className="space-y-3">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{policy.name}</h4>
                      <Badge variant={policy.enabled ? 'default' : 'secondary'} className="capitalize">
                        {policy.enabled ? 'active' : 'disabled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{policy.description || 'No description'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void togglePolicy(policy)}>
                    {policy.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">{policy.enforcement_action}</span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Updated {new Date(policy.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>

        <div className="space-y-6">
          <GlowCard glow glowColor="gradient">
            <h3 className="text-lg font-semibold mb-4">Enforcement Statistics</h3>
            <div className="space-y-4">
              {decisionStats.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.label === 'ALLOW' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {item.label === 'BLOCK' && <XCircle className="w-4 h-4 text-red-500" />}
                      {item.label !== 'ALLOW' && item.label !== 'BLOCK' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.label === 'ALLOW' ? 'bg-green-500' : item.label === 'BLOCK' ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${totalEnforcements ? (item.count / totalEnforcements) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard glow glowColor="purple">
            <h3 className="text-lg font-semibold mb-4">Policy Effectiveness</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={policyEffectivenessData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                <YAxis dataKey="policy" type="category" stroke="#9CA3AF" fontSize={10} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(139,60,247,0.3)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="effectiveness" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
