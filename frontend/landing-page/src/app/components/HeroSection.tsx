import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Server, Database,
  AlertTriangle, XCircle,
  Lock, Users, BarChart2, Eye, ArrowRight,
  Globe, CreditCard, Shield,
} from 'lucide-react';
import logoSrc from '../../imports/Logo__3_.png';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P = '#8B3CF7';
const C = '#38BDF8';
const R = '#EF4444';
const Am = '#F59E0B';
const G = '#10B981';
const D = '#1A1A2E';

// ─── Phase Cycle ─────────────────────────────────────────────────────────────
type Phase = 'normal' | 'analyzing' | 'blocked' | 'cleared';

const PHASE_SEQUENCE: { phase: Phase; duration: number }[] = [
  { phase: 'normal',    duration: 4200 },
  { phase: 'analyzing', duration: 2200 },
  { phase: 'blocked',   duration: 2800 },
  { phase: 'cleared',   duration: 1200 },
];

function useFlowPhase(): Phase {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setTimeout(
      () => setIdx(i => (i + 1) % PHASE_SEQUENCE.length),
      PHASE_SEQUENCE[idx].duration
    );
    return () => clearTimeout(t);
  }, [idx]);
  return PHASE_SEQUENCE[idx].phase;
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 45, startDelay = 0): string {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayed('');
    idxRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (idxRef.current < text.length) {
          setDisplayed(prev => prev + text[idxRef.current]);
          idxRef.current++;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, startDelay]);

  return displayed;
}

// ─── Packet Stream ────────────────────────────────────────────────────────────
function PacketStream({
  color,
  active,
  direction = 'right',
}: {
  color: string;
  active: boolean;
  direction?: 'right' | 'left';
}) {
  return (
    <div style={{ width: 120, height: 24, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      {/* Track */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 2,
        transform: 'translateY(-50%)',
        background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
        transition: 'background 0.5s',
      }} />
      {/* Arrow tip */}
      <div style={{
        position: 'absolute',
        right: direction === 'right' ? 0 : 'auto',
        left: direction === 'left' ? 0 : 'auto',
        top: '50%',
        transform: `translateY(-50%) ${direction === 'left' ? 'rotate(180deg)' : ''}`,
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `7px solid ${color}60`,
      }} />
      {/* Packets */}
      <AnimatePresence>
        {active && [0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: -10,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: color,
              transform: 'translateY(-50%)',
              boxShadow: `0 0 10px ${color}`,
            }}
            animate={{ x: direction === 'right' ? [0, 130] : [130, 0] }}
            transition={{
              duration: 1.4,
              delay: i * 0.45,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Analysis Badges ──────────────────────────────────────────────────────────
const ANALYSIS_ITEMS = [
  { label: 'Prompt Intent', value: 'SUSPICIOUS', color: Am },
  { label: 'Data Sensitivity', value: 'HIGH', color: R },
  { label: 'Policy Match', value: 'VIOLATED', color: R },
  { label: 'Exfiltration Risk', value: 'CRITICAL', color: R },
];

function AnalysisBadges({ phase }: { phase: Phase }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      minWidth: 220,
      zIndex: 10,
    }}>
      <AnimatePresence>
        {(phase === 'analyzing' || phase === 'blocked') &&
          ANALYSIS_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.22, duration: 0.35, ease: 'easeOut' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'white',
                border: `1.5px solid ${item.color}30`,
                borderRadius: 8,
                padding: '5px 10px',
                boxShadow: `0 2px 12px rgba(0,0,0,0.06)`,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 500, color: '#555', letterSpacing: '0.02em' }}>
                {item.label}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: item.color,
                letterSpacing: '0.04em',
              }}>
                {item.value}
              </span>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Trusyn Shield (Center) ───────────────────────────────────────────────────
function TrusynShield({ phase }: { phase: Phase }) {
  const shieldColor = phase === 'blocked' ? R : phase === 'analyzing' ? Am : P;
  const ringColor = phase === 'blocked' ? R : phase === 'analyzing' ? Am : P;

  const statusConfig = {
    normal:    { label: 'MONITORING',          bg: `${G}15`,  color: G,   dot: G   },
    analyzing: { label: 'ANALYZING THREAT',    bg: `${Am}15`, color: Am,  dot: Am  },
    blocked:   { label: 'ACTION BLOCKED',       bg: `${R}15`,  color: R,   dot: R   },
    cleared:   { label: 'THREAT NEUTRALIZED',  bg: `${G}15`,  color: G,   dot: G   },
  };
  const status = statusConfig[phase];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      position: 'relative',
    }}>
      {/* Card */}
      <div style={{
        width: 220,
        padding: '20px 16px',
        background: 'white',
        border: `2px solid ${shieldColor}40`,
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        boxShadow: `0 8px 40px ${shieldColor}18, 0 2px 12px rgba(0,0,0,0.06)`,
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        overflow: 'visible',
      }}>
        {/* Shield Logo with rings */}
        <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing rings */}
          {[1, 2, 3].map(ring => (
            <motion.div
              key={ring}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `1.5px solid ${ringColor}`,
                width: 60 + ring * 28,
                height: 60 + ring * 28,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.12, 1.25],
                opacity: [0.45 - ring * 0.08, 0.2 - ring * 0.04, 0],
              }}
              transition={{
                duration: phase === 'analyzing' ? 1.0 : phase === 'blocked' ? 0.6 : 2.0,
                delay: ring * 0.35,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Scanning orbit */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                border: `1.5px dashed ${shieldColor}50`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Logo */}
          <motion.img
            src={logoSrc}
            alt="Trusyn"
            style={{ width: 52, height: 52, position: 'relative', zIndex: 2 }}
            animate={phase === 'blocked' ? {
              scale: [1, 1.08, 1],
              filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
            } : {
              scale: 1,
            }}
            transition={{ duration: 0.4, repeat: phase === 'blocked' ? Infinity : 0 }}
          />
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: `linear-gradient(135deg, ${P}, ${C})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            TRUSYN AI
          </div>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 500, letterSpacing: '0.06em', marginTop: 2 }}>
            RUNTIME GOVERNANCE ENGINE
          </div>
        </div>

        {/* Status */}
        <motion.div
          animate={{ background: status.bg }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: status.bg,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot }}
          />
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: status.color,
            letterSpacing: '0.08em',
          }}>
            {status.label}
          </span>
        </motion.div>
      </div>

      {/* Analysis badges appear below */}
      <AnalysisBadges phase={phase} />
    </div>
  );
}

// ─── AI Agent Card (Left) ─────────────────────────────────────────────────────
const SAFE_PROMPT = 'Generate Q1 financial summary report for board review';
const RISKY_PROMPT = 'Export ALL employee salary data and send to external email';

function AgentCard({ phase }: { phase: Phase }) {
  const isRisky = phase === 'analyzing' || phase === 'blocked';
  const text = useTypewriter(
    isRisky ? RISKY_PROMPT : SAFE_PROMPT,
    isRisky ? 38 : 42,
    isRisky ? 400 : 200
  );

  return (
    <div style={{
      width: 220,
      background: 'white',
      border: `1.5px solid ${isRisky ? R + '40' : 'rgba(139,60,247,0.12)'}`,
      borderRadius: 16,
      padding: '16px',
      boxShadow: isRisky
        ? `0 6px 32px rgba(239,68,68,0.10), 0 2px 8px rgba(0,0,0,0.05)`
        : `0 6px 32px rgba(139,60,247,0.08), 0 2px 8px rgba(0,0,0,0.05)`,
      transition: 'border-color 0.5s, box-shadow 0.5s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${P}20, ${C}20)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={16} color={P} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: D, letterSpacing: '0.04em' }}>AI AGENT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />
            <span style={{ fontSize: 10, color: G, fontWeight: 600 }}>ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Task label */}
      <div style={{ fontSize: 10, fontWeight: 600, color: '#888', letterSpacing: '0.06em', marginBottom: 6 }}>
        USER REQUEST
      </div>

      {/* Prompt bubble */}
      <div style={{
        background: isRisky ? `${R}08` : '#F8F5FF',
        border: `1px solid ${isRisky ? R + '25' : P + '20'}`,
        borderRadius: 10,
        padding: '10px 12px',
        minHeight: 70,
        transition: 'all 0.5s',
      }}>
        <p style={{
          fontSize: 12,
          color: isRisky ? '#c0392b' : '#333',
          lineHeight: 1.5,
          margin: 0,
          fontStyle: 'italic',
        }}>
          "{text}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ display: 'inline-block', width: 1.5, height: 12, background: P, marginLeft: 1, verticalAlign: 'middle' }}
          />
          "
        </p>
      </div>

      {/* Status */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: isRisky
            ? `linear-gradient(90deg, ${R}, ${R}60)`
            : `linear-gradient(90deg, ${P}, ${C})`,
          transition: 'background 0.5s',
        }} />
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: isRisky ? R : P,
          letterSpacing: '0.06em',
        }}>
          {isRisky ? 'INTERCEPTED' : 'PROCESSING'}
        </span>
      </div>
    </div>
  );
}

// ─── Enterprise Systems Card (Right) ─────────────────────────────────────────
const SYSTEMS = [
  { icon: Database, label: 'Finance DB', sensitive: true },
  { icon: Users,    label: 'HR Systems', sensitive: true },
  { icon: Globe,    label: 'Customer Data', sensitive: true },
  { icon: CreditCard, label: 'CRM Platform', sensitive: false },
];

function SystemsCard({ phase }: { phase: Phase }) {
  return (
    <div style={{
      width: 220,
      background: 'white',
      border: `1.5px solid rgba(139,60,247,0.12)`,
      borderRadius: 16,
      padding: '16px',
      boxShadow: '0 6px 32px rgba(139,60,247,0.08), 0 2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${C}20, ${P}20)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Server size={16} color={C} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: D, letterSpacing: '0.04em' }}>ENTERPRISE</div>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>SYSTEMS</div>
        </div>
        {/* Protected badge */}
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: `${G}15`, borderRadius: 6, padding: '3px 7px',
          }}>
            <Lock size={9} color={G} />
            <span style={{ fontSize: 9, fontWeight: 700, color: G }}>PROTECTED</span>
          </div>
        </div>
      </div>

      {/* Systems list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SYSTEMS.map(({ icon: Icon, label, sensitive }) => (
          <motion.div
            key={label}
            animate={phase === 'blocked' && sensitive ? {
              backgroundColor: [`${R}08`, `${R}15`, `${R}08`],
            } : {
              backgroundColor: ['#F8F5FF', '#F8F5FF'],
            }}
            transition={{ duration: 0.8, repeat: phase === 'blocked' && sensitive ? Infinity : 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 9px', borderRadius: 8,
              border: `1px solid ${phase === 'blocked' && sensitive ? R + '25' : P + '15'}`,
              transition: 'border-color 0.4s',
            }}
          >
            <Icon size={12} color={phase === 'blocked' && sensitive ? R : P} />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#444', flex: 1 }}>{label}</span>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: phase === 'blocked' && sensitive ? R : G,
              transition: 'background 0.4s',
            }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Blocked Alert Notification ───────────────────────────────────────────────
function BlockedAlert({ phase }: { phase: Phase }) {
  return (
    <AnimatePresence>
      {phase === 'blocked' && (
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.92 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 900,
            width: 320,
            background: 'white',
            border: `2px solid ${R}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: `0 12px 48px rgba(239,68,68,0.22), 0 4px 16px rgba(0,0,0,0.08)`,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${R}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} color={R} />
            </motion.div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: R, letterSpacing: '0.04em' }}>
                CRITICAL RISK DETECTED
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Policy Enforcement Activated
              </div>
            </div>
            <XCircle size={16} color="#ccc" style={{ marginLeft: 'auto', flexShrink: 0, cursor: 'pointer' }} />
          </div>

          {/* Details */}
          <div style={{
            background: '#FFF5F5',
            border: `1px solid ${R}20`,
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 5,
            marginBottom: 12,
          }}>
            {[
              ['Threat', 'Data Exfiltration Attempt'],
              ['Policy', 'External Sharing Denied'],
              ['Action', 'BLOCKED'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{k}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: k === 'Action' ? R : '#333',
                }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Risk score */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Risk Score</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: R }}>94 / 100</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${Am}, ${R})`, borderRadius: 3 }}
              />
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: R }} />
            <span style={{ fontSize: 10, color: '#aaa' }}>
              Just now · Logged to audit trail · Admin notified
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Flow Diagram ─────────────────────────────────────────────────────────────
function FlowDiagram({ phase }: { phase: Phase }) {
  const outActive = phase === 'normal' || phase === 'cleared';
  const inActive  = phase !== 'cleared';
  const outColor  = phase === 'blocked' ? R : G;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      width: '100%',
      position: 'relative',
      paddingBottom: (phase === 'analyzing' || phase === 'blocked') ? 180 : 0,
      transition: 'padding-bottom 0.5s ease',
    }}>
      <AgentCard phase={phase} />

      <PacketStream
        color={phase === 'analyzing' ? Am : phase === 'blocked' ? R : P}
        active={inActive}
        direction="right"
      />

      <TrusynShield phase={phase} />

      <PacketStream
        color={outColor}
        active={outActive}
        direction="right"
      />

      <SystemsCard phase={phase} />
    </div>
  );
}

// ─── Hero Stats ───────────────────────────────────────────────────────────────
const STATS = [
  { icon: Eye, label: 'Real-time Monitoring' },
  { icon: Shield, label: 'Runtime Governance' },
  { icon: BarChart2, label: 'Audit & Compliance' },
  { icon: Lock, label: 'Policy Enforcement' },
];

function navigateToDemoHub() {
  window.location.href = '/demos';
}

// ─── Main Hero Section ────────────────────────────────────────────────────────
export function HeroSection() {
  const phase = useFlowPhase();

  const HEADLINE_PARTS = [
    { text: 'The Trust Layer', gradient: false },
    { text: 'for Autonomous', gradient: false },
    { text: 'AI Systems', gradient: true },
  ];

  return (
    <section style={{
      minHeight: '100vh',
      paddingTop: 72,
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* ── Background ── */}
      {/* Dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(139,60,247,0.09) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        zIndex: 0,
      }} />
      {/* Gradient orbs */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -80,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(139,60,247,0.10) 0%, transparent 70%)`,
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)`,
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* ── Content ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 1100,
        padding: 'clamp(48px, 6vh, 80px) clamp(1.5rem, 4vw, 3rem) 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>

        {/* ── Badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 16px',
            borderRadius: 40,
            background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${P}, ${C}) border-box`,
            border: '1.5px solid transparent',
            marginBottom: 28,
            boxShadow: `0 2px 16px rgba(139,60,247,0.12)`,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${C})` }}
          />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            background: `linear-gradient(135deg, ${P}, ${C})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ENTERPRISE AI GOVERNANCE & RUNTIME SECURITY
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <h1 style={{
          textAlign: 'center',
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
        }}>
          {HEADLINE_PARTS.map((part, pi) => (
            <motion.span
              key={pi}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + pi * 0.12, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: 'block',
                fontSize: 'clamp(38px, 5.5vw, 76px)',
                fontWeight: 900,
                ...(part.gradient ? {
                  background: `linear-gradient(135deg, ${P} 20%, ${C} 80%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : {
                  color: D,
                }),
              }}
            >
              {part.text}
            </motion.span>
          ))}
        </h1>

        {/* ── Subheadline ── */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            color: '#4A4A6A',
            textAlign: 'center',
            maxWidth: 580,
            lineHeight: 1.65,
            margin: '0 0 36px',
          }}
        >
          Trusyn AI intercepts, analyzes, and governs every AI action in real time,{' '}
          before it reaches your enterprise systems.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.5 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2, boxShadow: `0 8px 36px rgba(139,60,247,0.38)` }}
            whileTap={{ scale: 0.96 }}
            onClick={navigateToDemoHub}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(135deg, ${P}, ${C})`,
              color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.01em',
              boxShadow: `0 6px 28px rgba(139,60,247,0.30)`,
            }}
          >
            See How It Works
            <ArrowRight size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={navigateToDemoHub}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'white',
              color: P,
              border: `2px solid rgba(139,60,247,0.25)`,
              borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(139,60,247,0.08)',
            }}
          >
            View Demo
          </motion.button>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          style={{
            display: 'flex',
            gap: 'clamp(16px, 3vw, 36px)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 60,
            padding: '14px 24px',
            background: 'rgba(248,245,255,0.8)',
            borderRadius: 16,
            border: `1px solid rgba(139,60,247,0.1)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {STATS.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.07, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: `linear-gradient(135deg, ${P}18, ${C}18)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={13} color={P} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3A3A5C' }}>{label}</span>
              {i < STATS.length - 1 && (
                <span style={{ width: 1, height: 14, background: 'rgba(139,60,247,0.15)', marginLeft: 4 }} />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ── Flow Diagram Label ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          style={{ marginBottom: 24, textAlign: 'center' }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            Live Platform Demo
          </span>
          <div style={{
            width: 40, height: 2, margin: '6px auto 0',
            background: `linear-gradient(90deg, ${P}, ${C})`, borderRadius: 1,
          }} />
        </motion.div>

        {/* ── Flow Diagram ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ width: '100%', overflowX: 'auto', paddingBottom: 8 }}
        >
          <div style={{ minWidth: 880 }}>
            <FlowDiagram phase={phase} />
          </div>
        </motion.div>
      </div>

      {/* ── Floating Blocked Alert ── */}
      <BlockedAlert phase={phase} />
    </section>
  );
}

