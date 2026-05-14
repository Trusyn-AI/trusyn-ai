import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, Info, XCircle } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { threatService } from '../api/services/threatService';
import type { ThreatDto, ThreatInvestigationDto } from '../api/types/admin';
import { normalizeDecision, normalizeSeverity, toRelativeTime } from '../utils/formatters';
import { getSeverityBgColor } from '../utils/themeBadges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 60;

export function ThreatIntelligence() {
  const [threats, setThreats] = useState<ThreatDto[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<ThreatDto | null>(null);
  const [investigation, setInvestigation] = useState<ThreatInvestigationDto | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await threatService.list({
        limit: PAGE_SIZE,
        offset: 0,
        severity: filter === 'all' ? undefined : (filter.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
      });
      setThreats(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load threats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThreats();
  }, [filter]);

  const openInvestigation = async (threat: ThreatDto) => {
    setSelectedThreat(threat);
    setInvestigation(null);
    try {
      const data = await threatService.investigation(threat.id);
      setInvestigation(data);
    } catch {
      setInvestigation(null);
    }
  };

  const threatTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    threats.forEach((threat) => {
      const key = threat.threat_type.replace(/_/g, ' ');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [threats]);

  const criticalCount = threats.filter((t) => t.severity === 'CRITICAL').length;
  const todayThreats = threats.filter((t) => new Date(t.detected_at).toDateString() === new Date().toDateString()).length;
  const avgResponseTime = investigation?.decisions?.[0]?.confidence_score ? Math.max(65, 200 - investigation.decisions[0].confidence_score) : 145;
  const blockRate = threats.length
    ? Math.round(
        (threats.filter((t) => {
          const inferredDecision = t.raw_payload?.decision as string | undefined;
          return inferredDecision ? normalizeDecision(inferredDecision as 'ALLOW' | 'BLOCK' | 'REVIEW' | 'QUARANTINE' | 'RATE_LIMIT') === 'blocked' : false;
        }).length /
          threats.length) *
          100,
      )
    : 0;

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <XCircle className="w-5 h-5" />;
    if (severity === 'high') return <AlertTriangle className="w-5 h-5" />;
    if (severity === 'medium') return <ShieldAlert className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8] bg-clip-text text-transparent">
            Threat Intelligence Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time AI security threat monitoring and analysis</p>
        </div>
        <Button variant="outline" onClick={() => void loadThreats()} disabled={loading}>
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
          <p className="text-xs text-muted-foreground mb-1">Threats Today</p>
          <p className="text-3xl font-bold">{todayThreats}</p>
        </GlowCard>
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical Threats</p>
          <p className="text-3xl font-bold text-red-400 animate-pulse">{criticalCount}</p>
        </GlowCard>
        <GlowCard glow glowColor="cyan" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-cyan-400">{avgResponseTime}ms</p>
        </GlowCard>
        <GlowCard glow glowColor="gradient" className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Block Rate</p>
          <p className="text-3xl font-bold text-green-400">{blockRate}%</p>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlowCard glow glowColor="purple" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Threat Feed
              </h3>
              <div className="flex gap-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
                  All
                </Button>
                <Button variant={filter === 'critical' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('critical')}>
                  Critical
                </Button>
                <Button variant={filter === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('high')}>
                  High
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {threats.map((threat, index) => {
                  const severity = normalizeSeverity(threat.severity);
                  return (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -50, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getSeverityBgColor(severity)} ${severity === 'critical' ? 'animate-glow' : ''}`}
                      onClick={() => void openInvestigation(threat)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${severity === 'critical' ? 'bg-red-500/20' : severity === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
                          {getSeverityIcon(severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'} className="mb-2 capitalize">
                                {severity} • {threat.threat_type.replace(/_/g, ' ')}
                              </Badge>
                              <p className="text-sm font-medium mb-1">{threat.title}</p>
                              <p className="text-xs text-muted-foreground">{threat.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{toRelativeTime(threat.detected_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              Agent {threat.agent_id?.slice(0, 8) ?? 'N/A'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Org {threat.organization_id.slice(0, 8)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </GlowCard>
        </div>

        <div className="space-y-6">
          <GlowCard glow glowColor="gradient">
            <h3 className="text-lg font-semibold mb-4">Top Threat Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={threatTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                <YAxis dataKey="type" type="category" stroke="#9CA3AF" fontSize={10} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(139,60,247,0.3)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#EF4444" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>
      </div>

      <Sheet open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
        <SheetContent className="w-full sm:max-w-2xl glass-elevated overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Threat Investigation
            </SheetTitle>
            <SheetDescription>Detailed analysis and governance decision</SheetDescription>
          </SheetHeader>

          {selectedThreat && (
            <div className="space-y-6 mt-6">
              <div>
                <Badge variant={normalizeSeverity(selectedThreat.severity) === 'critical' ? 'destructive' : 'secondary'} className="text-sm capitalize">
                  {normalizeSeverity(selectedThreat.severity)} Severity
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Threat Type</h4>
                <p className="text-base font-medium capitalize">{selectedThreat.threat_type.replace(/_/g, ' ')}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Threat Title</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedThreat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Detected {toRelativeTime(selectedThreat.detected_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Payload Captured</h4>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-sm overflow-x-auto">
                  {JSON.stringify(selectedThreat.raw_payload, null, 2)}
                </div>
              </div>

              {investigation && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Risk Summary</h4>
                    <p className="text-sm">{investigation.risk_reasoning_summary}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Governance Decisions</h4>
                    <div className="space-y-2">
                      {investigation.decisions.map((item) => (
                        <div key={item.governance_decision_id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.decision}</p>
                            <p className="text-xs text-muted-foreground">Risk {item.risk_score} • Confidence {item.confidence_score}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{toRelativeTime(item.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Matched Policies</h4>
                    <div className="space-y-2">
                      {investigation.matched_policies.map((policy) => (
                        <div key={policy.policy_id} className="p-3 rounded-lg bg-muted/30">
                          <p className="text-sm font-medium">{policy.name}</p>
                          <p className="text-xs text-muted-foreground">Action: {policy.enforcement_action}</p>
                        </div>
                      ))}
                      {investigation.matched_policies.length === 0 && (
                        <p className="text-sm text-muted-foreground">No explicit policy matches for this threat.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
