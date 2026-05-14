import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Bot, AlertTriangle, CheckCircle, XCircle, Activity, Clock, TrendingUp } from 'lucide-react';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = '#8B3CF7';
const C  = '#38BDF8';
const R  = '#EF4444';
const Am = '#F59E0B';
const G  = '#10B981';
const D  = '#1A1A2E';

// ─── Types & Data ─────────────────────────────────────────────────────────────
type EventStatus = 'blocked' | 'flagged' | 'allowed';

interface FeedEvent {
  id: number;
  status: EventStatus;
  desc: string;
  agent: string;
  time: string;
}

const STATUS_CFG = {
  blocked: { dot: R,  badge: R,  label: 'BLOCKED', bg: `${R}12`  },
  flagged: { dot: Am, badge: Am, label: 'FLAGGED', bg: `${Am}12` },
  allowed: { dot: G,  badge: G,  label: 'ALLOWED', bg: `${G}12`  },
};

let evtCounter = 6;

const INITIAL_FEED: FeedEvent[] = [
  { id: 1, status: 'blocked', desc: 'Data exfiltration attempt detected',    agent: 'HR-Assistant',    time: 'just now' },
  { id: 2, status: 'flagged', desc: 'Unusual permission escalation pattern', agent: 'Finance-Bot',     time: '45s ago'  },
  { id: 3, status: 'allowed', desc: 'Q1 compliance report generation',       agent: 'Analytics-Agent', time: '1m ago'   },
  { id: 4, status: 'blocked', desc: 'Prompt injection attack intercepted',   agent: 'Customer-Bot',    time: '2m ago'   },
  { id: 5, status: 'allowed', desc: 'Internal policy document lookup',       agent: 'HR-Assistant',    time: '3m ago'   },
];

const INCOMING: Array<Omit<FeedEvent, 'id' | 'time'>> = [
  { status: 'blocked', desc: 'Unauthorized external API call with PII payload', agent: 'Finance-Bot'      },
  { status: 'flagged', desc: 'Sensitive query outside agent permissions',        agent: 'Analytics-Agent'  },
  { status: 'blocked', desc: 'Credential harvesting attempt blocked',            agent: 'HR-Assistant'     },
  { status: 'allowed', desc: 'Scheduled compliance summary report sent',         agent: 'Customer-Bot'     },
  { status: 'blocked', desc: 'Mass employee records download denied',            agent: 'Finance-Bot'      },
  { status: 'flagged', desc: 'Unusual query frequency anomaly detected',         agent: 'Analytics-Agent'  },
];

const AGENTS = [
  { name: 'HR-Assistant',    role: 'HR Operations',   actions: 34, blocked: 3, active: true  },
  { name: 'Finance-Bot',     role: 'Finance Queries', actions: 18, blocked: 1, active: true  },
  { name: 'Analytics-Agent', role: 'Data Analytics',  actions: 8,  blocked: 0, active: false },
];

const INIT_RISK = [3, 7, 4, 11, 5, 9, 14, 8].map((v, id) => ({ id, v }));

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedEventRow({ event }: { event: FeedEvent }) {
  const cfg = STATUS_CFG[event.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', background: '#ffffff',
        borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ scale: event.status === 'blocked' ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.8, repeat: event.status === 'blocked' ? 3 : 0 }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }}
      />
      <div style={{
        padding: '2px 7px', borderRadius: 4,
        background: cfg.bg, flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: cfg.badge, letterSpacing: '0.08em' }}>
          {cfg.label}
        </span>
      </div>
      <span style={{
        fontSize: 11, color: '#444', flex: 1,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {event.desc}
      </span>
      <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0, fontFamily: 'monospace' }}>
        {event.agent}
      </span>
      <span style={{ fontSize: 10, color: '#ccc', flexShrink: 0 }}>{event.time}</span>
    </motion.div>
  );
}

function AgentRow({ agent }: { agent: typeof AGENTS[0] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '8px 0', borderBottom: '1px solid #F0F0F8',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${P}15, ${C}15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={13} color={P} />
        </div>
        <motion.div
          animate={agent.active ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.5, repeat: agent.active ? Infinity : 0 }}
          style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: agent.active ? G : '#CCC',
            border: '1.5px solid #F8F8FC',
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: D, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 10, color: '#999' }}>{agent.role}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{agent.actions} actions</div>
        {agent.blocked > 0 && (
          <div style={{ fontSize: 10, color: R, fontWeight: 700 }}>{agent.blocked} blocked</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Section ───────────────────────────────────────────────────
export function DashboardSection() {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(INITIAL_FEED);
  const [totalEvents, setTotalEvents] = useState(247);
  const [blockedCount, setBlockedCount] = useState(12);
  const [riskData, setRiskData] = useState(INIT_RISK);
  const incomingIdx = useRef(0);
  const riskNextId = useRef(8);

  // Live feed timer
  useEffect(() => {
    const t = setInterval(() => {
      const next = INCOMING[incomingIdx.current % INCOMING.length];
      incomingIdx.current++;
      const newEvent: FeedEvent = { ...next, id: ++evtCounter, time: 'just now' };
      setFeedEvents(prev => [newEvent, ...prev].slice(0, 6));
      setTotalEvents(n => n + 1);
      if (next.status === 'blocked') setBlockedCount(n => n + 1);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  // Risk chart timer — unique `id` per point to avoid duplicate XAxis tick keys
  useEffect(() => {
    const t = setInterval(() => {
      setRiskData(prev => [
        ...prev.slice(-7),
        { id: riskNextId.current++, v: Math.floor(Math.random() * 12) + 4 },
      ]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const STATS = [
    { icon: Activity,    label: 'Events Today',   value: totalEvents,     color: P,  suffix: ''  },
    { icon: XCircle,     label: 'Threats Blocked', value: blockedCount,    color: R,  suffix: ''  },
    { icon: Bot,         label: 'Active Agents',   value: 3,               color: G,  suffix: ''  },
    { icon: TrendingUp,  label: 'Compliance',      value: '98.6',          color: C,  suffix: '%' },
  ];

  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(72px, 9vh, 110px) clamp(1.5rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 52 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `${G}10`, border: `1.5px solid ${G}28`,
            borderRadius: 40, padding: '6px 16px', marginBottom: 22,
          }}>
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: G }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: G, letterSpacing: '0.07em' }}>
              LIVE PLATFORM PREVIEW
            </span>
          </div>

          <div style={{
            fontSize: 'clamp(28px, 3.8vw, 52px)', fontWeight: 900,
            color: D, marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.025em',
          }}>
            The Governance Dashboard.
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 10%, ${C} 90%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Live. In Real Time.
            </span>
          </div>

          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 17px)', color: '#4A4A6A',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.65,
          }}>
            Every threat, every decision, every audit entry, visible to your security team the moment it happens.
          </p>
        </motion.div>

        {/* ── Dashboard Window ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{ overflowX: 'auto' }}
        >
          <div style={{
            minWidth: 780,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `0 32px 100px rgba(139,60,247,0.14), 0 8px 32px rgba(0,0,0,0.09)`,
            border: `1.5px solid rgba(139,60,247,0.14)`,
          }}>

            {/* ── Title Bar ── */}
            <div style={{
              background: `linear-gradient(135deg, ${D}, #252540)`,
              padding: '13px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF5F57', '#FFBD2E', '#28C840'].map((col, i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: col }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                Trusyn AI · Governance Dashboard
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20,
                    background: `${G}25`, border: `1px solid ${G}40`,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: '0.06em' }}>LIVE</span>
                </motion.div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={11} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              background: '#F4F0FF',
              borderBottom: '1px solid rgba(139,60,247,0.1)',
            }}>
              {STATS.map(({ icon: Icon, label, value, color, suffix }, i) => (
                <div
                  key={label}
                  style={{
                    padding: '14px 20px',
                    borderRight: i < 3 ? '1px solid rgba(139,60,247,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <motion.div
                      key={String(value)}
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}
                    >
                      {value}{suffix}
                    </motion.div>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em' }}>
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Content ── */}
            <div style={{ display: 'flex', background: '#F8F8FC', minHeight: 340 }}>

              {/* Left: Threat Feed */}
              <div style={{
                flex: '0 0 62%',
                padding: '18px 20px',
                borderRight: '1px solid rgba(139,60,247,0.08)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                }}>
                  <AlertTriangle size={12} color={Am} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#777', letterSpacing: '0.08em' }}>
                    THREAT DETECTION FEED
                  </span>
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: G }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: G }}>LIVE</span>
                  </motion.div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <AnimatePresence initial={false}>
                    {feedEvents.map(event => (
                      <FeedEventRow key={event.id} event={event} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Agents + Chart */}
              <div style={{
                flex: '0 0 38%', padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>

                {/* Active Agents */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  }}>
                    <CheckCircle size={12} color={G} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#777', letterSpacing: '0.08em' }}>
                      ACTIVE AGENTS
                    </span>
                  </div>
                  {AGENTS.map(agent => (
                    <AgentRow key={agent.name} agent={agent} />
                  ))}
                </div>

                {/* Risk Chart */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#777', letterSpacing: '0.08em' }}>
                      RISK EVENTS / HOUR
                    </span>
                    <span style={{ fontSize: 10, color: P, fontWeight: 600 }}>Last 8h</span>
                  </div>
                  {/* Gradient defined outside recharts to avoid duplicate-key warning with recharts' internal defs */}
                  <svg width={0} height={0} style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={P} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={P} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={riskData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip
                        contentStyle={{ fontSize: 11, background: 'white', border: `1px solid ${P}30`, borderRadius: 6 }}
                        labelStyle={{ color: '#888' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={P}
                        strokeWidth={2}
                        fill="url(#riskGrad)"
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}