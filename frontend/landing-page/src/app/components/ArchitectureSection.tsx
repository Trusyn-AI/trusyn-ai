import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Briefcase, MessageSquare, Bot,
  Sliders, BarChart2, FileText,
  Database, Globe, Cpu, Shield,
  CheckCircle,
} from 'lucide-react';
import logoSrc from '../../imports/Logo__3_.png';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = '#8B3CF7';
const C  = '#38BDF8';
const R  = '#EF4444';
const G  = '#10B981';

// ─── Data ─────────────────────────────────────────────────────────────────────
const AGENTS = [
  { name: 'HR-Assistant',  icon: Users,          color: P  },
  { name: 'Finance-Bot',   icon: Briefcase,      color: C  },
  { name: 'Customer-Bot',  icon: MessageSquare,  color: G  },
  { name: 'Custom Agent',  icon: Bot,            color: '#A0A0C8' },
];

const TRUSYN_COMPS = [
  { name: 'Policy Engine',  desc: 'ALLOW / DENY / REVIEW', icon: Sliders,   color: P },
  { name: 'Risk Analyzer',  desc: 'ML threat scoring',     icon: BarChart2, color: C },
  { name: 'Audit Logger',   desc: 'Immutable records',     icon: FileText,  color: G },
];

const SYSTEMS = [
  { name: 'Finance DB',    icon: Database, },
  { name: 'HR Systems',    icon: Users,    },
  { name: 'CRM Platform',  icon: Globe,    },
  { name: 'Cloud APIs',    icon: Cpu,      },
];

const INTEGRATIONS = ['OpenAI', 'Anthropic', 'LangChain', 'CrewAI', 'AutoGen', 'Microsoft Copilot', 'AWS Bedrock'];

// ─── Flow Connector ───────────────────────────────────────────────────────────
function FlowConnector({ blocked, label, topHalf = false }: {
  blocked: boolean;
  label: string;
  topHalf?: boolean;
}) {
  const packetColor = topHalf && blocked ? R : P;
  const lineColor   = topHalf && blocked ? `${R}60` : `${P}50`;
  const travel      = topHalf && blocked ? 26 : 52;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: '2px 0',
    }}>
      <div style={{ position: 'relative', width: 2, height: 56, flexShrink: 0 }}>
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(180deg, ${lineColor}, rgba(0,0,0,0))`,
          borderRadius: 1, transition: 'background 0.5s',
        }} />
        {(!blocked || topHalf) && (
          <motion.div
            key={`${blocked}-${topHalf}`}
            animate={{ y: [0, travel], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.85, repeat: Infinity, repeatDelay: 0.25, ease: 'easeIn' }}
            style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: packetColor,
              boxShadow: `0 0 12px ${packetColor}90`,
            }}
          />
        )}
      </div>

      <span style={{
        fontSize: 11, fontStyle: 'italic',
        color: topHalf && blocked ? `${R}cc` : 'rgba(255,255,255,0.28)',
        letterSpacing: '0.02em', transition: 'color 0.5s',
        maxWidth: 200,
      }}>
        {topHalf && blocked ? '⚡ Threat intercepted: request blocked' : label}
      </span>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function ArchitectureSection() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 2800);
    };
    const t = setInterval(cycle, 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{
      background: 'linear-gradient(180deg, #06060F 0%, #0C0C20 100%)',
      padding: 'clamp(72px, 9vh, 112px) clamp(1.5rem, 4vw, 3rem)',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(139,60,247,0.5) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(139,60,247,0.5) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: `${P}08`, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, background: `${C}06`, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

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
            background: `${P}18`, border: `1.5px solid ${P}35`,
            borderRadius: 40, padding: '6px 16px', marginBottom: 22,
          }}>
            <Shield size={12} color={P} />
            <span style={{ fontSize: 12, fontWeight: 700, color: P, letterSpacing: '0.07em' }}>
              ARCHITECTURE
            </span>
          </div>

          <div style={{
            fontSize: 'clamp(28px, 3.8vw, 52px)', fontWeight: 900,
            color: '#ffffff', marginBottom: 18, lineHeight: 1.1, letterSpacing: '-0.025em',
          }}>
            Built as a Trust Layer.
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 10%, ${C} 90%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Not a Proxy.
            </span>
          </div>

          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 17px)', color: 'rgba(255,255,255,0.5)',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.65,
          }}>
            Trusyn AI intercepts every agent request in real time, with zero-trust evaluation before any enterprise system is touched.
          </p>
        </motion.div>

        {/* ── Architecture Diagram ── */}
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Tier 1: AI Agents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 10 }}>
              ENTERPRISE AI AGENTS
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}>
              {AGENTS.map((agent, i) => {
                const { icon: Icon, color } = agent;
                return (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    style={{
                      padding: '12px 8px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${color}22`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} color={color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                      {agent.name}
                    </span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Connector 1 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}
          >
            <FlowConnector blocked={blocked} label="Every request intercepted before execution" topHalf />
          </motion.div>

          {/* Tier 2: Trusyn Trust Layer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              padding: '20px',
              background: blocked ? `${R}12` : `${P}12`,
              border: `2px solid ${blocked ? R + '60' : P + '45'}`,
              borderRadius: 20,
              boxShadow: blocked
                ? `0 0 40px ${R}20, inset 0 0 20px ${R}08`
                : `0 0 40px ${P}15, inset 0 0 20px ${P}06`,
              transition: 'background 0.5s, border-color 0.5s, box-shadow 0.6s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Trusyn Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              <img src={logoSrc} alt="Trusyn" style={{ width: 28, height: 28 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                TRUSYN AI TRUST LAYER
              </span>

              {/* Blocked badge */}
              <AnimatePresence>
                {blocked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                    style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: R, marginLeft: 8,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>
                      BLOCKED
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trusyn Components */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TRUSYN_COMPS.map((comp, i) => {
                const { icon: Icon } = comp;
                return (
                  <motion.div
                    key={comp.name}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    style={{
                      padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${comp.color}30`,
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, margin: '0 auto 8px',
                      background: `${comp.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={comp.color} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 3 }}>
                      {comp.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                      {comp.desc}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Connector 2 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}
          >
            <FlowConnector
              blocked={false}
              label="Only governed, compliant actions proceed"
            />
          </motion.div>

          {/* Tier 3: Enterprise Systems */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              padding: '16px',
              background: 'rgba(16,185,129,0.04)',
              border: `1px solid ${G}25`,
              borderRadius: 16,
            }}>
              {SYSTEMS.map((sys, i) => {
                const { icon: Icon } = sys;
                return (
                  <motion.div
                    key={sys.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    style={{
                      padding: '12px 8px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${G}18`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${G}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} color={G} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                      {sys.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={10} color={G} />
                      <span style={{ fontSize: 9, color: G, fontWeight: 700 }}>PROTECTED</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textAlign: 'center', marginTop: 10 }}>
              ENTERPRISE SYSTEMS (PROTECTED)
            </div>
          </motion.div>

        </div>

        {/* ── Integration Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ textAlign: 'center', marginTop: 52 }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 14 }}>
            COMPATIBLE WITH ANY AI AGENT FRAMEWORK
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {INTEGRATIONS.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                }}
              >
                {name}
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}