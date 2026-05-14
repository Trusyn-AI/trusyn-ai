import { AgentEvent, Decision, RiskLevel } from '../../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { Zap } from 'lucide-react';

interface AgentActivityPanelProps {
  events: AgentEvent[];
}

function getRiskBadge(risk: RiskLevel) {
  const config = {
    LOW: { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: 'LOW' },
    MEDIUM: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: 'MED' },
    HIGH: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'HIGH' },
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: 'CRIT' },
  };
  const c = config[risk];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function getDecisionBadge(decision: Decision) {
  const config: Record<Decision, { bg: string; color: string; label: string; dot: string }> = {
    ALLOW: { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: '✅ ALLOW', dot: '#10B981' },
    WARNING: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: '⚠ WARN', dot: '#F59E0B' },
    BLOCK: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: '🚫 BLOCK', dot: '#EF4444' },
    QUARANTINE: { bg: 'rgba(236,72,153,0.1)', color: '#EC4899', label: '🛑 QUAR.', dot: '#EC4899' },
    REQUIRE_APPROVAL: { bg: 'rgba(139,60,247,0.1)', color: '#8B3CF7', label: '👤 APPROVE', dot: '#8B3CF7' },
  };
  const c = config[decision];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

const agentColors: Record<string, string> = {
  'Finance Agent': '#8B3CF7',
  'HR Agent': '#10B981',
  'Operations Agent': '#F59E0B',
  'Support Agent': '#38BDF8',
};

export function AgentActivityPanel({ events }: AgentActivityPanelProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 2px 20px rgba(139, 60, 247, 0.07)',
        border: '1px solid rgba(139, 60, 247, 0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(139, 60, 247, 0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: '#8B3CF7' }} />
          <h3 style={{ color: '#1A1A2E' }}>Live Agent Activity</h3>
          <span
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            LIVE
          </span>
        </div>
        <span className="text-xs" style={{ color: '#717182' }}>{events.length} events</span>
      </div>

      {/* Table header */}
      <div
        className="grid px-5 py-2.5 text-xs"
        style={{
          gridTemplateColumns: '1.6fr 2fr 1fr 1fr 1fr',
          color: '#717182',
          background: '#F8F5FF',
          borderBottom: '1px solid rgba(139,60,247,0.06)',
        }}
      >
        <span>AGENT</span>
        <span>ACTION</span>
        <span>RISK</span>
        <span>DECISION</span>
        <span>TIME</span>
      </div>

      {/* Rows */}
      <div className="overflow-auto" style={{ maxHeight: 340 }}>
        {events.map((event, i) => (
          <div
            key={event.id}
            className="grid px-5 py-3 items-center transition-all"
            style={{
              gridTemplateColumns: '1.6fr 2fr 1fr 1fr 1fr',
              borderBottom: '1px solid rgba(139,60,247,0.05)',
              background: i === 0 ? 'rgba(139,60,247,0.02)' : 'transparent',
              animation: i === 0 ? 'fadeSlideIn 0.4s ease' : undefined,
            }}
          >
            {/* Agent */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: agentColors[event.agent] || '#8B3CF7' }}
              />
              <span className="text-xs truncate" style={{ color: '#1A1A2E' }}>
                {event.agent}
              </span>
            </div>

            {/* Action */}
            <span className="text-xs truncate" style={{ color: '#1A1A2E', paddingRight: 8 }}>
              {event.action}
            </span>

            {/* Risk */}
            <div>{getRiskBadge(event.risk)}</div>

            {/* Decision */}
            <div>{getDecisionBadge(event.decision)}</div>

            {/* Time */}
            <span className="text-xs" style={{ color: '#717182' }}>
              {formatDistanceToNow(event.timestamp, { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); background: rgba(139,60,247,0.06); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
