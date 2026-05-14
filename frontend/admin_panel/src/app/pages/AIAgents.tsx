import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Search } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { agentService } from '../api/services/agentService';
import type { AgentDto } from '../api/types/admin';
import { normalizeAgentStatus, toRelativeTime } from '../utils/formatters';
import { getStatusBgColor } from '../utils/themeBadges';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 50;

type AgentStatusFilter = 'all' | 'OPERATIONAL' | 'WARNING' | 'QUARANTINED' | 'BLOCKED';

function buildTimeline(score: number) {
  const base = Math.max(5, Math.floor(score / 5));
  return [
    { time: 'T-5', actions: base - 1, risks: Math.max(0, Math.floor((100 - score) / 25)) },
    { time: 'T-4', actions: base + 1, risks: Math.max(0, Math.floor((100 - score) / 20)) },
    { time: 'T-3', actions: base + 2, risks: Math.max(0, Math.floor((100 - score) / 18)) },
    { time: 'T-2', actions: base + 3, risks: Math.max(0, Math.floor((100 - score) / 16)) },
    { time: 'T-1', actions: base + 1, risks: Math.max(0, Math.floor((100 - score) / 14)) },
  ];
}

export function AIAgents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentDto | null>(null);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agentService.list({
        limit: PAGE_SIZE,
        offset: 0,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAgents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, [statusFilter]);

  const filteredAgents = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(needle) || agent.organization_id.toLowerCase().includes(needle),
    );
  }, [agents, searchTerm]);

  const operationalCount = agents.filter((a) => a.status === 'OPERATIONAL').length;
  const warningCount = agents.filter((a) => a.status === 'WARNING').length;
  const quarantinedCount = agents.filter((a) => a.status === 'QUARANTINED').length;
  const blockedCount = agents.filter((a) => a.status === 'BLOCKED').length;
  const avgTrustScore = agents.length
    ? Math.round(agents.reduce((sum, a) => sum + a.trust_score, 0) / agents.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Agent Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor autonomous AI agents platform-wide</p>
        </div>
        <Button variant="outline" onClick={() => void loadAgents()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Operational</p>
          <p className="text-3xl font-bold text-green-400">{operationalCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="purple" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Warning</p>
          <p className="text-3xl font-bold text-yellow-400">{warningCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="cyan" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Quarantined</p>
          <p className="text-3xl font-bold text-orange-400">{quarantinedCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Blocked</p>
          <p className="text-3xl font-bold text-red-400">{blockedCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="purple" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Trust Score</p>
          <p className="text-3xl font-bold text-cyan-400">{avgTrustScore}</p>
        </GlowCard>
      </div>

      <GlowCard glow glowColor="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name or organization id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AgentStatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="QUARANTINED">Quarantined</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlowCard>

      <GlowCard glow glowColor="gradient">
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
              {filteredAgents.map((agent, index) => {
                const normalizedStatus = normalizeAgentStatus(agent.status);
                return (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8] flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm break-all">{agent.organization_id}</td>
                    <td className="py-4 px-4">
                      <Badge className={`${getStatusBgColor(normalizedStatus)} capitalize`}>{normalizedStatus}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className={`h-full ${agent.trust_score >= 80 ? 'bg-green-500' : agent.trust_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${agent.trust_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{agent.trust_score}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {agent.last_active_at ? toRelativeTime(agent.last_active_at) : 'No recent activity'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlowCard>

      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8] flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>Agent telemetry and governance profile</DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Organization</p>
                  <p className="text-sm font-medium break-all">{selectedAgent.organization_id}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Trust Score</p>
                  <p className="text-2xl font-bold text-cyan-400">{selectedAgent.trust_score}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="text-2xl font-bold capitalize">{normalizeAgentStatus(selectedAgent.status)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Description</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedAgent.description || 'No description provided.'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Trust Activity Curve</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={buildTimeline(selectedAgent.trust_score)}>
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
                    <Line type="monotone" dataKey="actions" stroke="#8B3CF7" strokeWidth={2} />
                    <Line type="monotone" dataKey="risks" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
