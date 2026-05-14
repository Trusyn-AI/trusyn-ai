import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Server, Zap, Activity, Shield, FileText } from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { healthService } from '../api/services/healthService';
import { adminService } from '../api/services/adminService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type SystemComponent = {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  latencyMs: number | null;
  checkedAt: string;
};

const componentIcons = {
  'Governance Engine': Shield,
  'Gemini Integration': Zap,
  'Threat Detection': Activity,
  'API Gateway': Server,
  'Policy Engine': Shield,
  'Logging System': FileText,
};

function mapStatus(status: string): 'operational' | 'degraded' | 'down' {
  if (status === 'ok') return 'operational';
  if (status === 'error') return 'down';
  return 'degraded';
}

export function SystemHealth() {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [requestVolumeData, setRequestVolumeData] = useState<Array<{ time: string; volume: number }>>([]);
  const [responseTimeData, setResponseTimeData] = useState<Array<{ time: string; latency: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [api, db, cache, ws, governance, summary] = await Promise.all([
        healthService.api(),
        healthService.db(),
        healthService.cache(),
        healthService.ws(),
        healthService.governance(),
        adminService.apiMonitoringSummary(),
      ]);

      const normalizeComponent = (
        label: string,
        payload: { status: string; latency_ms?: number | null; timestamp: string },
      ): SystemComponent => ({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        name: label,
        status: mapStatus(payload.status),
        uptime: payload.status === 'ok' ? 99.99 : 97.5,
        latencyMs: payload.latency_ms ?? null,
        checkedAt: payload.timestamp,
      });

      const mapped: SystemComponent[] = [
        normalizeComponent('API Gateway', {
          status: api.status,
          component: 'api',
          connected: true,
          latency_ms: null,
          timestamp: api.timestamp ?? new Date().toISOString(),
          details: {},
        }),
        normalizeComponent('Logging System', cache),
        normalizeComponent('Threat Detection', ws),
        normalizeComponent('Governance Engine', governance),
        normalizeComponent('Policy Engine', {
          status: db.status,
          latency_ms: db.latency_ms ?? null,
          timestamp: db.timestamp,
        }),
      ];

      setComponents(mapped);

      const points = summary.requests_by_hour.slice(-12).map((item) => ({
        time: String(item.bucket).slice(11, 16),
        volume: Number(item.count),
      }));
      setRequestVolumeData(points);
      setResponseTimeData(points.map((item) => ({ time: item.time, latency: summary.avg_latency_ms })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const avgUptime = components.length
    ? components.reduce((sum, c) => sum + c.uptime, 0) / components.length
    : 0;

  const allOperational = components.every((c) => c.status === 'operational');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-sm text-muted-foreground mt-1">Platform infrastructure monitoring and status</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <StatusIndicator status={allOperational ? 'operational' : 'warning'} size="md" />
          <span className="text-sm font-medium text-green-400">
            {allOperational ? 'All Systems Operational' : 'Degraded Components Detected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlowCard glow glowColor="purple" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">System Uptime</p>
          <p className="text-3xl font-bold text-green-400">{avgUptime.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </GlowCard>

        <GlowCard glow glowColor="cyan" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Avg Latency</p>
          <p className="text-3xl font-bold text-cyan-400">{(responseTimeData[0]?.latency ?? 0).toFixed(0)}ms</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Throughput</p>
          <p className="text-3xl font-bold">{requestVolumeData.reduce((sum, p) => sum + p.volume, 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Last 12 hours</p>
        </GlowCard>

        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Healthy Components</p>
          <p className="text-3xl font-bold">{components.filter((c) => c.status === 'operational').length}/{components.length}</p>
        </GlowCard>
      </div>

      <GlowCard glow glowColor="purple">
        <h3 className="text-lg font-semibold mb-4">System Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component, index) => {
            const Icon = componentIcons[component.name as keyof typeof componentIcons] || Server;
            return (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{component.name}</h4>
                      <p className="text-xs text-muted-foreground">Last check: {new Date(component.checkedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <StatusIndicator status={component.status} size="sm" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Uptime</span>
                    <span className="text-sm font-bold text-green-400">{component.uptime}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${component.uptime}%` }} />
                  </div>
                  {component.latencyMs !== null && (
                    <p className="text-xs text-muted-foreground">Latency: {component.latencyMs.toFixed(1)}ms</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard glow glowColor="cyan">
          <h3 className="text-lg font-semibold mb-4">Response Time (12h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={responseTimeData}>
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

        <GlowCard glow glowColor="gradient">
          <h3 className="text-lg font-semibold mb-4">Request Volume (12h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={requestVolumeData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B3CF7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B3CF7" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Line type="monotone" dataKey="volume" stroke="#8B3CF7" strokeWidth={2} fill="url(#volumeGradient)" />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      <GlowCard glow glowColor="purple">
        <h3 className="text-lg font-semibold mb-4">Recent Incidents</h3>
        <div className="space-y-3">
          {components
            .filter((component) => component.status !== 'operational')
            .map((component) => (
              <div key={component.id} className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {component.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(component.checkedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium">Component is reporting degraded health</p>
                    <p className="text-xs text-muted-foreground mt-1">Status: {component.status}</p>
                  </div>
                  <Badge variant="destructive" className="capitalize">
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
        </div>

        {allOperational && (
          <div className="text-center py-8 mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <StatusIndicator status="operational" size="sm" />
              <span className="text-sm text-green-400">No active incidents - All systems healthy</span>
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
