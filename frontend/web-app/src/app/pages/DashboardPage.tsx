import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldAlert, Activity, ShieldBan, Binary, AlertCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { dashboardService } from '../api/services/dashboardService';
import type { DashboardSummaryDto } from '../api/types/dashboard';
import type { Decision, Severity } from '../api/types/common';
import { ApiError } from '../api/errors';

const decisionColors: Record<Decision, string> = {
  ALLOW: '#10B981',
  BLOCK: '#EF4444',
  REVIEW: '#F59E0B',
  QUARANTINE: '#EC4899',
  RATE_LIMIT: '#8B5CF6',
};

function severityColor(severity: Severity): string {
  return {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  }[severity];
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return '--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSummary = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const summary = await dashboardService.summary();
      setData(summary);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    const interval = window.setInterval(() => {
      void loadSummary(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadSummary]);

  const threatTrendChart = useMemo(
    () =>
      (data?.threat_count_by_day ?? []).map(item => ({
        label: new Date(item.bucket).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        count: item.count,
      })),
    [data],
  );

  const decisionDistributionChart = useMemo(
    () =>
      (data?.decision_distribution ?? []).map(item => ({
        name: item.decision,
        value: item.count,
      })),
    [data],
  );

  const kpis = data?.kpis ?? {
    active_agents: 0,
    blocked_threats_24h: 0,
    avg_risk_score_24h: 0,
    policies_enabled: 0,
  };

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Governance Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Real-time monitoring of autonomous agent risk, decisions, and enforcement activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#717182' }}>
            Last sync: {formatLastUpdated(lastUpdated)}
          </span>
          <button
            type="button"
            onClick={() => void loadSummary(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(139,60,247,0.08)',
              color: '#8B3CF7',
              border: '1px solid rgba(139,60,247,0.22)',
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={15} style={{ color: '#EF4444' }} />
          <p className="text-sm" style={{ color: '#B42318' }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Active Agents',
            value: kpis.active_agents,
            icon: <Activity size={16} style={{ color: '#8B3CF7' }} />,
            bg: 'rgba(139,60,247,0.08)',
            accent: '#8B3CF7',
          },
          {
            label: 'Blocked Threats (24h)',
            value: kpis.blocked_threats_24h,
            icon: <ShieldBan size={16} style={{ color: '#EF4444' }} />,
            bg: 'rgba(239,68,68,0.08)',
            accent: '#EF4444',
          },
          {
            label: 'Average Risk (24h)',
            value: kpis.avg_risk_score_24h,
            icon: <ShieldAlert size={16} style={{ color: '#F59E0B' }} />,
            bg: 'rgba(245,158,11,0.08)',
            accent: '#F59E0B',
          },
          {
            label: 'Policies Enabled',
            value: kpis.policies_enabled,
            icon: <Binary size={16} style={{ color: '#38BDF8' }} />,
            bg: 'rgba(56,189,248,0.08)',
            accent: '#38BDF8',
          },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-2xl p-4"
            style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#717182' }}>{item.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
                {item.icon}
              </div>
            </div>
            <p style={{ color: item.accent, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
              {loading ? '--' : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}
        >
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Threat Trend (7d)</p>
          {threatTrendChart.length === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No threat activity yet for this organization.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={threatTrendChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#717182' }} />
                <YAxis tick={{ fontSize: 11, fill: '#717182' }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#8B3CF7" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}
        >
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Decision Distribution</p>
          {decisionDistributionChart.length === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No governance decisions yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie dataKey="value" data={decisionDistributionChart} outerRadius={80} innerRadius={45}>
                  {decisionDistributionChart.map(item => (
                    <Cell key={item.name} fill={decisionColors[item.name as Decision] ?? '#8B3CF7'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}
        >
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Recent Threats</p>
          {data?.recent_threats.length ? (
            <div className="space-y-2">
              {data.recent_threats.slice(0, 6).map(item => (
                <div key={item.id} className="rounded-xl px-3 py-2" style={{ background: '#F8F5FF' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs" style={{ color: '#1A1A2E' }}>{item.title}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: `${severityColor(item.severity)}22`, color: severityColor(item.severity) }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>
                    {item.threat_type} - {formatRelativeDate(item.detected_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#717182' }}>No threat events captured yet.</p>
          )}
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}
        >
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Top Agent Activity (24h)</p>
          {data?.agent_activity_snapshot.length ? (
            <div className="space-y-2">
              {data.agent_activity_snapshot.map(agent => (
                <div key={agent.agent_id} className="rounded-xl px-3 py-2" style={{ background: '#F8F5FF' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: '#1A1A2E' }}>{agent.agent_name}</p>
                    <span className="text-xs" style={{ color: '#8B3CF7' }}>{agent.events_count_24h} events</span>
                  </div>
                  <div className="mt-1 w-full h-2 rounded-full" style={{ background: 'rgba(139,60,247,0.12)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(Math.max(agent.trust_score, 0), 100)}%`,
                        background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#717182' }}>No agent activity available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
