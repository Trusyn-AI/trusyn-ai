import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, XCircle, CheckCircle } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { adminService } from '../api/services/adminService';
import type { AdminAPIRequestItem, AdminApiMonitoringSummary } from '../api/types/admin';
import { toRelativeTime } from '../utils/formatters';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 80;

export function APIMonitoring() {
  const [requestStream, setRequestStream] = useState<AdminAPIRequestItem[]>([]);
  const [summary, setSummary] = useState<AdminApiMonitoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, requestsData] = await Promise.all([
        adminService.apiMonitoringSummary(),
        adminService.apiMonitoringRequests({ limit: PAGE_SIZE, offset: 0 }),
      ]);
      setSummary(summaryData);
      setRequestStream(requestsData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load API monitoring feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const modelUsageData = useMemo(() => {
    if (!summary) return [];
    const palette = ['#8B3CF7', '#38BDF8', '#10B981', '#F59E0B'];
    return Object.entries(summary.model_usage).map(([name, value], index) => ({
      name,
      value,
      color: palette[index % palette.length],
    }));
  }, [summary]);

  const latencyData = useMemo(() => {
    if (!summary) return [];
    return summary.requests_by_hour.slice(-12).map((point) => ({
      time: String(point.bucket).slice(11, 16),
      latency: summary.avg_latency_ms,
    }));
  }, [summary]);

  const blockedCount = summary?.blocked_count ?? 0;
  const failedCount = summary?.failed_count ?? 0;
  const successCount = summary?.success_count ?? 0;
  const totalCount = blockedCount + failedCount + successCount;
  const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor AI traffic flowing through Trusyn proxy infrastructure</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlowCard glow glowColor="purple" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Requests/second</p>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">{(summary?.requests_per_second ?? 0).toFixed(2)}</p>
        </GlowCard>

        <GlowCard glow glowColor="cyan" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-cyan-400">{(summary?.avg_latency_ms ?? 0).toFixed(0)}ms</p>
          <p className="text-xs text-muted-foreground mt-2">P95: {(summary?.p95_latency_ms ?? 0).toFixed(0)}ms</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Blocked Requests</p>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{blockedCount}</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{successRate}%</p>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlowCard glow glowColor="purple">
            <h3 className="text-lg font-semibold mb-4">Live Request Stream</h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {requestStream.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: index * 0.01 }}
                    className={`p-3 rounded-lg border ${request.status === 'success' ? 'bg-green-500/5 border-green-500/20' : request.status === 'blocked' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs text-muted-foreground font-mono">{toRelativeTime(request.timestamp)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{request.organization_name}</span>
                        <span className="text-xs text-muted-foreground">{request.agent_name ?? 'Unknown agent'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">{request.latency_ms}ms</span>
                        <Badge
                          variant={request.status === 'success' ? 'default' : 'destructive'}
                          className="capitalize text-xs"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{request.endpoint}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlowCard>
        </div>

        <div className="space-y-6">
          <GlowCard glow glowColor="cyan">
            <h3 className="text-lg font-semibold mb-4">Model Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={modelUsageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {modelUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(139,60,247,0.3)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-4">
              {modelUsageData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard glow glowColor="gradient">
            <h3 className="text-lg font-semibold mb-4">Traffic Mix</h3>
            <div className="space-y-3">
              {[{label:'Success',value:successCount,color:'bg-green-500'},{label:'Blocked',value:blockedCount,color:'bg-red-500'},{label:'Failed',value:failedCount,color:'bg-yellow-500'}].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${totalCount ? (item.value / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>

      <GlowCard glow glowColor="gradient">
        <h3 className="text-lg font-semibold mb-4">API Latency Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A24',
                border: '1px solid rgba(139,60,247,0.3)',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="latency" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8' }} />
          </LineChart>
        </ResponsiveContainer>
      </GlowCard>
    </div>
  );
}
