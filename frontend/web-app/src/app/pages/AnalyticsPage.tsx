import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  CartesianGrid,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts';
import { analyticsService } from '../api/services/analyticsService';
import type {
  AnalyticsAgentTrustTrendsDto,
  AnalyticsDecisionDistributionDto,
  AnalyticsOverviewDto,
  AnalyticsPolicyImpactDto,
  AnalyticsRiskTrendsDto,
} from '../api/types/analytics';
import { ApiError } from '../api/errors';

function parseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Unable to load analytics data.';
}

export function AnalyticsPage() {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week'>('day');

  const [overview, setOverview] = useState<AnalyticsOverviewDto | null>(null);
  const [riskTrends, setRiskTrends] = useState<AnalyticsRiskTrendsDto | null>(null);
  const [decisionDistribution, setDecisionDistribution] = useState<AnalyticsDecisionDistributionDto | null>(null);
  const [trustTrends, setTrustTrends] = useState<AnalyticsAgentTrustTrendsDto | null>(null);
  const [policyImpact, setPolicyImpact] = useState<AnalyticsPolicyImpactDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => ({
    start_at: startAt ? new Date(startAt).toISOString() : undefined,
    end_at: endAt ? new Date(endAt).toISOString() : undefined,
    granularity,
  }), [endAt, granularity, startAt]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewData, riskData, decisionData, trustData, policyData] = await Promise.all([
        analyticsService.overview(query),
        analyticsService.riskTrends(query),
        analyticsService.decisionDistribution(query),
        analyticsService.agentTrustTrends(query),
        analyticsService.policyImpact(query),
      ]);

      setOverview(overviewData);
      setRiskTrends(riskData);
      setDecisionDistribution(decisionData);
      setTrustTrends(trustData);
      setPolicyImpact(policyData);
      setError(null);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const riskChart = useMemo(() => {
    const items = riskTrends?.items ?? [];
    return items.map(item => ({
      bucket: new Date(item.bucket).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      severity: item.severity,
      count: item.count,
    }));
  }, [riskTrends]);

  const decisionChart = useMemo(() => {
    return (decisionDistribution?.items ?? []).map(item => ({ label: item.decision, value: item.count }));
  }, [decisionDistribution]);

  const trustChart = useMemo(() => {
    return (trustTrends?.items ?? []).map(item => ({ agent: item.agent_name, trust: item.trust_score }));
  }, [trustTrends]);

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Multi-dimensional governance analytics with risk, decisions, trust, and policy impact.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
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

      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
        <div className="grid grid-cols-[180px_180px_160px_auto] gap-3 items-end">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#717182' }}>Start</label>
            <input
              type="date"
              value={startAt}
              onChange={event => setStartAt(event.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#717182' }}>End</label>
            <input
              type="date"
              value={endAt}
              onChange={event => setEndAt(event.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#717182' }}>Granularity</label>
            <select
              value={granularity}
              onChange={event => setGranularity(event.target.value as 'hour' | 'day' | 'week')}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
            >
              <option value="hour">hour</option>
              <option value="day">day</option>
              <option value="week">week</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={() => void load(true)}
              className="px-4 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)' }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#EF4444' }} />
          <span className="text-sm" style={{ color: '#B42318' }}>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Total Threats</p>
          <p style={{ color: '#8B3CF7', fontSize: 24, fontWeight: 700 }}>{overview?.total_threats ?? 0}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Blocked Decisions</p>
          <p style={{ color: '#EF4444', fontSize: 24, fontWeight: 700 }}>{overview?.blocked_decisions ?? 0}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Average Risk Score</p>
          <p style={{ color: '#F59E0B', fontSize: 24, fontWeight: 700 }}>{overview?.average_risk_score ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Risk Trends</p>
          {riskChart.length === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No risk trend data in selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={riskChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.1)" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#717182' }} />
                <YAxis tick={{ fontSize: 11, fill: '#717182' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B3CF7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Decision Distribution</p>
          {decisionChart.length === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No decision data in selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={decisionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#717182' }} />
                <YAxis tick={{ fontSize: 11, fill: '#717182' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Agent Trust Trends</p>
          {trustChart.length === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No trust data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trustChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.1)" />
                <XAxis dataKey="agent" tick={{ fontSize: 11, fill: '#717182' }} />
                <YAxis tick={{ fontSize: 11, fill: '#717182' }} domain={[0, 100]} />
                <Tooltip />
                <Line dataKey="trust" stroke="#8B3CF7" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-sm mb-3" style={{ color: '#1A1A2E' }}>Policy Impact</p>
          {(policyImpact?.items.length ?? 0) === 0 ? (
            <p className="text-sm" style={{ color: '#717182' }}>No policy impact records yet.</p>
          ) : (
            <div className="space-y-2">
              {(policyImpact?.items ?? []).map(item => (
                <div key={item.policy_id} className="rounded-xl px-3 py-2" style={{ background: '#F8F5FF' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: '#1A1A2E' }}>{item.policy_name}</p>
                    <span className="text-xs" style={{ color: '#8B3CF7' }}>{item.related_events} events</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#717182' }}>{item.enforcement_action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
