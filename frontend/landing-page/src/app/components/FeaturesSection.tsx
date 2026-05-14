import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Shield, Sliders, Eye, FileText,
  CheckCircle, XCircle, ArrowRight, Lock,
  AlertTriangle, Zap,
} from 'lucide-react';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = '#8B3CF7';
const C  = '#38BDF8';
const R  = '#EF4444';
const Am = '#F59E0B';
const G  = '#10B981';
const D  = '#1A1A2E';

// ─── Feature 1: Runtime Governance ───────────────────────────────────────────
function GovernanceDemo() {
  const [decision, setDecision] = useState<'allowed' | 'blocked'>('allowed');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setScanning(true);
      setTimeout(() => {
        setDecision(d => d === 'allowed' ? 'blocked' : 'allowed');
        setScanning(false);
      }, 900);
    };
    const t = setInterval(cycle, 2800);
    return () => clearInterval(t);
  }, []);

  const isBlocked = decision === 'blocked';

  return (
    <div style={{ padding: '14px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Request box */}
        <div style={{
          padding: '7px 12px', borderRadius: 8,
          background: '#F4F0FF', border: `1px solid ${P}20`,
          fontSize: 11, fontWeight: 600, color: P, flexShrink: 0,
        }}>
          Request
        </div>

        {/* Arrow + packet */}
        <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', height: 1.5, background: `${P}30`, borderRadius: 1 }} />
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', left: 0,
              width: 8, height: 8, borderRadius: '50%',
              background: P, boxShadow: `0 0 8px ${P}`,
            }}
          />
        </div>

        {/* Shield */}
        <motion.div
          animate={scanning ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.4 }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: scanning ? `${Am}20` : `${P}15`,
            border: `1.5px solid ${scanning ? Am : P}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.3s, border-color 0.3s',
          }}
        >
          <Shield size={16} color={scanning ? Am : P} />
        </motion.div>

        {/* Arrow out */}
        <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '100%', height: 1.5,
            background: isBlocked ? `${R}40` : `${G}40`,
            borderRadius: 1, transition: 'background 0.3s',
          }} />
          {!isBlocked && (
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', left: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: G, boxShadow: `0 0 8px ${G}`,
              }}
            />
          )}
          {isBlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute', left: '45%', top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <XCircle size={16} color={R} />
            </motion.div>
          )}
        </div>

        {/* Decision badge */}
        <motion.div
          key={decision}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          style={{
            padding: '7px 11px', borderRadius: 8, flexShrink: 0,
            background: isBlocked ? `${R}14` : `${G}14`,
            border: `1.5px solid ${isBlocked ? R : G}30`,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: isBlocked ? R : G }}>
            {isBlocked ? 'BLOCKED' : 'ALLOWED'}
          </span>
        </motion.div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#888', textAlign: 'center' }}>
        {scanning ? '⟳ Analyzing intent & risk...' : `Last decision: ${decision.toUpperCase()}`}
      </div>
    </div>
  );
}

// ─── Feature 2: Policy Engine ─────────────────────────────────────────────────
const POLICIES = [
  { rule: 'HR agents → Finance systems',     action: 'DENY',  color: R },
  { rule: 'External data sharing',           action: 'DENY',  color: R },
  { rule: 'Sensitive ops → Human review',    action: 'REVIEW', color: Am },
  { rule: 'Internal document access',        action: 'ALLOW', color: G },
];

function PolicyDemo() {
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHighlight(h => (h + 1) % POLICIES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: '10px 0 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {POLICIES.map((p, i) => (
        <motion.div
          key={p.rule}
          animate={i === highlight ? {
            backgroundColor: `${p.color}10`,
            borderColor: `${p.color}35`,
          } : {
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0)',
          }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8,
            border: '1.5px solid rgba(0,0,0,0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Lock size={11} color={i === highlight ? p.color : '#ccc'} />
            <span style={{ fontSize: 12, color: i === highlight ? D : '#888', fontWeight: i === highlight ? 600 : 400 }}>
              {p.rule}
            </span>
          </div>
          <div style={{
            padding: '3px 9px', borderRadius: 20,
            background: `${p.color}14`, border: `1px solid ${p.color}30`,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: p.color, letterSpacing: '0.05em' }}>
              {p.action}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Feature 3: Observability ─────────────────────────────────────────────────
const INIT_OBS = [
  { v: 4 }, { v: 9 }, { v: 6 }, { v: 13 }, { v: 7 }, { v: 11 }, { v: 5 }, { v: 8 },
];

function ObservabilityDemo() {
  const [data, setData] = useState(INIT_OBS);
  const [liveCount, setLiveCount] = useState(247);

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => [...prev.slice(-7), { v: Math.floor(Math.random() * 14) + 2 }]);
      setLiveCount(n => n + Math.floor(Math.random() * 3) + 1);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: '10px 0 4px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Events', value: liveCount, color: P },
          { label: 'Blocked', value: 12, color: R },
          { label: 'Agents', value: 3, color: G },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, padding: '7px 10px', borderRadius: 8,
            background: `${stat.color}10`, border: `1px solid ${stat.color}20`,
            textAlign: 'center',
          }}>
            <motion.div
              key={stat.value}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 16, fontWeight: 900, color: stat.color }}
            >
              {stat.value}
            </motion.div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: '0.05em', marginTop: 1 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      {/* Gradient defined outside recharts to avoid duplicate-key warning */}
      <svg width={0} height={0} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={P} stopOpacity={0.3} />
            <stop offset="95%" stopColor={P} stopOpacity={0.01} />
          </linearGradient>
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height={72}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone" dataKey="v"
            stroke={P} strokeWidth={2}
            fill="url(#obsGrad)" dot={false}
            isAnimationActive={true} animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Feature 4: Audit & Explainability ───────────────────────────────────────
function AuditDemo() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setExpanded(e => !e), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: '10px 0 4px' }}>
      {/* Event row */}
      <div style={{
        padding: '8px 12px', borderRadius: 8,
        background: `${R}07`, border: `1px solid ${R}20`,
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: R, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: D }}>BLOCKED · Data Export Attempt</div>
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
            HR-Assistant · {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: R }}>94/100</div>
      </div>

      {/* Explainability toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ArrowRight size={12} color={P} />
        </motion.div>
        <span style={{ fontSize: 11, fontWeight: 700, color: P }}>WHY WAS THIS BLOCKED?</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: `${P}06`, border: `1px solid ${P}15`,
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              {[
                { icon: AlertTriangle, text: 'Data classified as PII/Sensitive',       color: R  },
                { icon: Zap,           text: 'Destination is an external domain',       color: R  },
                { icon: Lock,          text: 'Matches policy EXT-TRANSFER-001',         color: Am },
                { icon: CheckCircle,   text: 'Admin notified + event quarantined',      color: G  },
              ].map(({ icon: Icon, text, color }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  <Icon size={11} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#555' }}>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Feature Cards Data ───────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Shield,
    color: P,
    title: 'Runtime Governance Engine',
    description: 'Every AI action is intercepted, analyzed, and validated in real time before it touches your enterprise systems.',
    demo: <GovernanceDemo />,
  },
  {
    icon: Sliders,
    color: C,
    title: 'Policy Engine',
    description: 'Define precise governance rules for every AI agent: ALLOW, DENY, REVIEW, or RATE LIMIT based on your enterprise policy.',
    demo: <PolicyDemo />,
  },
  {
    icon: Eye,
    color: G,
    title: 'Real-time Observability',
    description: 'Live dashboards give your security team complete visibility into every AI operation, risk event, and governance decision.',
    demo: <ObservabilityDemo />,
  },
  {
    icon: FileText,
    color: Am,
    title: 'Audit & Explainability',
    description: 'Every governance decision is logged with full reasoning: who, what, why, and when, for compliance and accountability.',
    demo: <AuditDemo />,
  },
];

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const { icon: Icon, color, title, description, demo } = feature;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '28px',
        border: `1.5px solid ${hovered ? color + '30' : 'rgba(139,60,247,0.08)'}`,
        boxShadow: hovered
          ? `0 20px 60px ${color}14, 0 6px 20px rgba(0,0,0,0.07)`
          : `0 4px 20px rgba(0,0,0,0.04)`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        cursor: 'default',
      }}
    >
      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <motion.div
          animate={hovered ? { scale: 1.08, rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `${color}15`,
            border: `1.5px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={22} color={color} />
        </motion.div>
        <div style={{ paddingTop: 4 }}>
          <div style={{
            fontSize: 17, fontWeight: 800, color: D,
            letterSpacing: '-0.015em', marginBottom: 5,
          }}>
            {title}
          </div>
          <p style={{ fontSize: 13, color: '#5A5A7A', lineHeight: 1.62, margin: 0 }}>
            {description}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1, background: `linear-gradient(90deg, ${color}25, transparent)`,
        margin: '16px 0',
      }} />

      {/* Mini Demo */}
      <div style={{
        background: '#FAFAFA',
        border: `1px solid rgba(0,0,0,0.05)`,
        borderRadius: 12,
        padding: '4px 12px 8px',
        minHeight: 80,
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: '0.1em',
          marginBottom: 2, paddingTop: 8,
        }}>
          LIVE DEMO
        </div>
        {demo}
      </div>
    </motion.div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function FeaturesSection() {
  return (
    <section style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #F9F5FF 6%, #F9F5FF 94%, #ffffff 100%)',
      padding: 'clamp(72px, 9vh, 110px) clamp(1.5rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg,${P},${C}) border-box`,
            border: '1.5px solid transparent',
            borderRadius: 40, padding: '6px 16px', marginBottom: 24,
            boxShadow: `0 2px 14px rgba(139,60,247,0.10)`,
          }}>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: P }}
            />
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
              background: `linear-gradient(135deg, ${P}, ${C})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              CORE CAPABILITIES
            </span>
          </div>

          <div style={{
            fontSize: 'clamp(28px, 3.8vw, 52px)', fontWeight: 900,
            color: D, marginBottom: 18, lineHeight: 1.1, letterSpacing: '-0.025em',
          }}>
            Everything Your Enterprise Needs
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 10%, ${C} 90%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              to Trust AI at Scale
            </span>
          </div>

          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 17px)', color: '#4A4A6A',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.65,
          }}>
            Four enterprise-grade pillars that work together to make autonomous AI safe, governed, and auditable.
          </p>
        </motion.div>

        {/* ── Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}