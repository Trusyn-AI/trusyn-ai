import { ThreatAlert, RiskLevel } from '../../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, X } from 'lucide-react';

interface ThreatFeedProps {
  threats: ThreatAlert[];
  onDismiss: (id: string) => void;
}

function getSeverityConfig(severity: RiskLevel) {
  return {
    LOW: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', dot: '#10B981', label: 'LOW' },
    MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#F59E0B', label: 'MED' },
    HIGH: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', dot: '#EF4444', label: 'HIGH' },
    CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', dot: '#EF4444', label: 'CRIT' },
  }[severity];
}

const threatIcons: Record<string, string> = {
  'Prompt Injection': '💉',
  'Data Exfiltration': '📤',
  'Data Leakage': '💧',
  'Policy Violation': '📋',
  'Suspicious Behavior': '👁',
  'Unauthorized API': '🔌',
  'Anomalous Access': '🔍',
  'Policy Bypass': '🚧',
};

export function ThreatFeed({ threats, onDismiss }: ThreatFeedProps) {
  const unresolved = threats.filter(t => !t.resolved);
  const critical = threats.filter(t => t.severity === 'CRITICAL' && !t.resolved).length;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 2px 20px rgba(139, 60, 247, 0.07)',
        border: '1px solid rgba(139, 60, 247, 0.08)',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(139, 60, 247, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: '#EF4444' }} />
            <h3 style={{ color: '#1A1A2E' }}>Threat Feed</h3>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            LIVE
          </span>
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#EF4444' }}
            />
            <span className="text-xs" style={{ color: '#717182' }}>
              {critical} Critical
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#F59E0B' }}
            />
            <span className="text-xs" style={{ color: '#717182' }}>
              {unresolved.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-auto px-4 py-3 flex flex-col gap-3">
        {threats.map((threat, i) => {
          const cfg = getSeverityConfig(threat.severity);
          const icon = threatIcons[threat.type] || '⚠️';
          return (
            <div
              key={threat.id}
              className="rounded-xl p-3 relative"
              style={{
                background: threat.resolved ? 'rgba(0,0,0,0.02)' : cfg.bg,
                border: `1px solid ${threat.resolved ? 'rgba(0,0,0,0.06)' : cfg.border}`,
                opacity: threat.resolved ? 0.6 : 1,
                animation: i === 0 ? 'slideInRight 0.4s ease' : undefined,
              }}
            >
              <button
                onClick={() => onDismiss(threat.id)}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-md opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={12} style={{ color: '#717182' }} />
              </button>

              <div className="flex items-start gap-2.5 pr-5">
                <span className="text-base shrink-0">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs"
                      style={{ color: '#1A1A2E' }}
                    >
                      {threat.type}
                    </span>
                    <span
                      className="inline-flex px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: cfg.color + '20',
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </span>
                    {threat.resolved && (
                      <span
                        className="inline-flex px-1.5 py-0.5 rounded text-xs"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                      >
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: '#717182' }}
                  >
                    {threat.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-xs"
                      style={{
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {threat.agent}
                    </span>
                    <span className="text-xs" style={{ color: '#717182' }}>
                      {formatDistanceToNow(threat.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
