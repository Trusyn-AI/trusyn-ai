import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Bot, Activity, ShieldAlert, Shield, TrendingUp } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { adminService } from '../api/services/adminService';
import { dashboardService } from '../api/services/dashboardService';
import { agentService } from '../api/services/agentService';
import type { AdminPlatformOverview, AgentDto } from '../api/types/admin';
import type { DashboardSummaryDto } from '../api/types/dashboard';
import { normalizeSeverity, normalizeAgentStatus, toRelativeTime } from '../utils/formatters';
import { getSeverityBgColor } from '../utils/themeBadges';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ViewState = {
  loading: boolean;
  error: string | null;
  platform: AdminPlatformOverview | null;
  dashboard: DashboardSummaryDto | null;
  agents: AgentDto[];
  organizations: Record<string, string>;
};

const riskColors = {
  low: '#3B82F6',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
} as const;

export function PlatformOverview() {
  const [state, setState] = useState<ViewState>({
    loading: true,
    error: null,
    platform: null,
    dashboard: null,
    agents: [],
    organizations: {},
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [platform, dashboard, agentsPage, organizationsPage] = await Promise.all([
        adminService.platformOverview(),
        dashboardService.summary(),
        agentService.list({ limit: 8, offset: 0 }),
        adminService.listOrganizations({ limit: 200, offset: 0 }),
      ]);
      const organizations = organizationsPage.items.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.name;
        return acc;
      }, {});
      setState({
        loading: false,
        error: null,
        platform,
        dashboard,
        agents: agentsPage.items,
        organizations,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load platform overview.',
      }));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const threatTrendData = useMemo(() => {
    if (!state.dashboard) return [];
    return state.dashboard.threat_count_by_day.map((item) => ({
      time: new Date(item.bucket).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: item.count,
    }));
  }, [state.dashboard]);

  const riskDistribution = useMemo(() => {
    if (!state.platform) return [];
    const buckets = { low: 0, medium: 0, high: 0, critical: 0 };
    state.platform.recent_threats.forEach((threat) => {
      buckets[normalizeSeverity(threat.severity)] += 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({
      name: `${name[0].toUpperCase()}${name.slice(1)}`,
      value,
      color: riskColors[name as keyof typeof riskColors],
    }));
  }, [state.platform]);

  const blockedActionsData = useMemo(() => {
    if (!state.platform) return [];
    const grouped = new Map<string, number>();
    state.platform.recent_threats.forEach((item) => {
      const key = item.threat_type.replace(/_/g, ' ');
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });
    return Array.from(grouped.entries()).map(([type, count]) => ({ type, count }));
  }, [state.platform]);

  const decisionDistributionData = useMemo(() => {
    if (!state.dashboard) return [];
    return state.dashboard.decision_distribution.map((item) => ({
      decision: item.decision,
      count: item.count,
    }));
  }, [state.dashboard]);

  const activeAgentsCount = state.platform?.kpis.active_agents ?? 0;
  const threatsBlocked = state.platform?.kpis.threats_blocked_24h ?? 0;
  const requestsProcessed = state.platform?.kpis.requests_processed_24h ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Global super admin telemetry and governance operations</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 text-sm rounded-lg border border-[#8B3CF7]/30 hover:bg-accent transition-colors"
          disabled={state.loading}
        >
          {state.loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Organizations"
          value={state.platform?.kpis.total_organizations ?? 0}
          icon={Building2}
          subtitle="Global customers"
        />
        <MetricCard
          title="Active AI Agents"
          value={activeAgentsCount}
          icon={Bot}
          subtitle="Currently operational"
        />
        <MetricCard
          title="Requests Processed"
          value={requestsProcessed.toLocaleString()}
          icon={Activity}
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Threats Blocked"
          value={threatsBlocked}
          icon={ShieldAlert}
          iconColor="bg-red-500"
          valueColor="text-red-400"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Active Policies"
          value={state.dashboard?.kpis.policies_enabled ?? 0}
          icon={Shield}
          iconColor="bg-green-500"
          subtitle="Governance rules"
        />
        <MetricCard
          title="Avg Risk Score"
          value={(state.platform?.kpis.avg_risk_score_24h ?? 0).toFixed(1)}
          icon={TrendingUp}
          iconColor="bg-cyan-500"
          valueColor="text-cyan-400"
          subtitle="Last 24h decisions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GlowCard glow glowColor="purple">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Activity Feed
            </h3>
            <div className="trusyn-scrollbar space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {(state.platform?.recent_threats ?? []).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`p-3 rounded-lg border ${getSeverityBgColor(normalizeSeverity(event.severity))}`}
                >
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{toRelativeTime(event.detected_at)}</span>
                    <Badge variant="destructive" className="text-xs capitalize">
                      {normalizeSeverity(event.severity)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.organization_name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                      {event.threat_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
              {(state.platform?.recent_threats?.length ?? 0) === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">No recent threat activity.</div>
              )}
            </div>
          </GlowCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <GlowCard glow glowColor="cyan">
            <h3 className="text-lg font-semibold mb-4">Threat Trends (7d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={threatTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(139,60,247,0.3)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#8B3CF7" strokeWidth={2} dot={{ fill: '#8B3CF7' }} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>

          <div className="grid grid-cols-2 gap-6">
            <GlowCard glow glowColor="gradient">
              <h3 className="text-lg font-semibold mb-4">Blocked Actions</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={blockedActionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="type" stroke="#9CA3AF" fontSize={10} angle={-15} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(139,60,247,0.3)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#8B3CF7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlowCard>

            <GlowCard glow glowColor="gradient">
              <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(139,60,247,0.3)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </div>

          <GlowCard glow glowColor="purple">
            <h3 className="text-lg font-semibold mb-4">Decision Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={decisionDistributionData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="decision" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(139,60,247,0.3)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#38BDF8" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>
      </div>

      <GlowCard glow glowColor="gradient">
        <h3 className="text-lg font-semibold mb-4">Active AI Agents</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Agent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Organization</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trust Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {state.agents.map((agent) => {
                const normalizedStatus = normalizeAgentStatus(agent.status);
                return (
                  <tr key={agent.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{agent.name[0]}</span>
                        </div>
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {state.organizations[agent.organization_id] ?? agent.organization_id}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={normalizedStatus === 'operational' ? 'default' : normalizedStatus === 'warning' ? 'secondary' : 'destructive'}
                        className="capitalize"
                      >
                        {normalizedStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${agent.trust_score >= 80 ? 'bg-green-500' : agent.trust_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${agent.trust_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{agent.trust_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {agent.last_active_at ? toRelativeTime(agent.last_active_at) : 'No recent activity'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
