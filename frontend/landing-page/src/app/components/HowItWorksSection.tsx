import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Cpu, Shield, BarChart2, XCircle,
  ClipboardList, Send, Loader2, CheckCircle,
  FileText, Users,
} from 'lucide-react';
import logoSrc from '../../imports/Logo__3_.png';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = '#8B3CF7';
const C  = '#38BDF8';
const R  = '#EF4444';
const Am = '#F59E0B';
const G  = '#10B981';
const D  = '#1A1A2E';

const STEP_DURATION = 4000;

// ─── Steps Data ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: MessageSquare,
    number: '01',
    title: 'Employee Submits Request',
    description: 'A user asks an enterprise AI agent to perform a task or access company resources through the AI workspace.',
    windowTitle: 'AI Agent Workspace',
  },
  {
    icon: Cpu,
    number: '02',
    title: 'AI Agent Activates',
    description: 'The AI agent begins executing the instruction, attempting to access enterprise systems and data.',
    windowTitle: 'AI Agent · Processing',
  },
  {
    icon: Shield,
    number: '03',
    title: 'Trusyn Intercepts',
    description: 'The runtime governance engine activates and intercepts every request before it touches enterprise systems.',
    windowTitle: 'Trusyn AI · Governance Engine',
  },
  {
    icon: BarChart2,
    number: '04',
    title: 'Threat Analysis Runs',
    description: 'Prompt intent, data sensitivity, policy compliance, and exfiltration risk are scored in real time.',
    windowTitle: 'Governance Analysis · Results',
  },
  {
    icon: XCircle,
    number: '05',
    title: 'Decision Enforced',
    description: 'A governance decision is issued instantly: BLOCKED, ALLOWED, or escalated for HUMAN REVIEW.',
    windowTitle: 'Policy Enforcement · Decision',
  },
  {
    icon: ClipboardList,
    number: '06',
    title: 'Audit Trail Created',
    description: 'Every governance decision is logged with full context for compliance, auditability, and explainability.',
    windowTitle: 'Audit Trail · Entry Logged',
  },
];

// ─── Step Visuals ─────────────────────────────────────────────────────────────

function Step0Visual() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `linear-gradient(135deg, ${P}, ${C})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Users size={17} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: D }}>john.morrison</div>
          <div style={{ fontSize: 11, color: '#999' }}>Enterprise User · HR Department</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#bbb' }}>just now</div>
      </div>

      <div style={{
        background: '#F8F5FF',
        border: `1.5px solid ${P}20`,
        borderRadius: '4px 14px 14px 14px',
        padding: '14px 16px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, color: '#333', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
          "Export ALL employee salary data and send to external email address: hr-data@external-site.com"
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex: 1, height: 40, background: '#F4F4F8',
          borderRadius: 10, border: '1.5px solid #E0E0EE',
          display: 'flex', alignItems: 'center', padding: '0 12px',
        }}>
          <span style={{ fontSize: 12, color: '#999' }}>Type a message to your AI agent...</span>
        </div>
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: [`0 4px 16px ${P}30`, `0 8px 28px ${P}50`, `0 4px 16px ${P}30`] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${P}, ${C})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Send size={15} color="white" />
        </motion.div>
      </div>
    </div>
  );
}

function Step1Visual() {
  const LOG = [
    { done: true,  text: 'Request received and parsed successfully' },
    { done: false, text: 'Accessing HR Database (credentials loaded)...' },
    { done: false, text: 'Querying 847 employee salary records...' },
    { done: false, text: 'Preparing external data transfer package...' },
  ];

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
        padding: '10px 14px', background: '#F0FFF8',
        borderRadius: 10, border: `1px solid ${G}25`,
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={15} color={G} />
        </motion.div>
        <span style={{ fontSize: 12, fontWeight: 700, color: G, letterSpacing: '0.05em' }}>
          AI AGENT · EXECUTING TASK
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, delay: i * 0.22, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: '50%', background: G }}
            />
          ))}
        </div>
      </div>

      {LOG.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.28, duration: 0.35 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 4px',
            borderBottom: '1px solid #F4F4F8',
          }}
        >
          {item.done ? (
            <CheckCircle size={14} color={G} style={{ flexShrink: 0 }} />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
              style={{ flexShrink: 0 }}
            >
              <Loader2 size={14} color={Am} />
            </motion.div>
          )}
          <span style={{
            fontSize: 12,
            fontFamily: "'Courier New', monospace",
            color: item.done ? '#aaa' : D,
          }}>
            {item.text}
          </span>
        </motion.div>
      ))}

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 12, color: Am, fontWeight: 700, letterSpacing: '0.06em',
        }}
      >
        ⚡ TRANSFER IMMINENT: SYSTEM UNPROTECTED
      </motion.div>
    </div>
  );
}

function Step2Visual() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 280, gap: 20,
    }}>
      {/* Shield with rings */}
      <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[1, 2, 3].map(ring => (
          <motion.div
            key={ring}
            style={{
              position: 'absolute', borderRadius: '50%',
              border: `2px solid ${Am}`,
              width: 56 + ring * 28,
              height: 56 + ring * 28,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 1.1, 1.25], opacity: [0.55, 0.28, 0] }}
            transition={{ duration: 1.1, delay: ring * 0.3, repeat: Infinity, ease: 'easeOut' }}
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
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: `1.5px dashed ${Am}60`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <motion.img
          src={logoSrc}
          alt="Trusyn"
          style={{ width: 52, height: 52, position: 'relative', zIndex: 2 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </div>

      <motion.div
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{ textAlign: 'center' }}
      >
        <div style={{
          fontSize: 20, fontWeight: 900, color: Am,
          letterSpacing: '0.06em', marginBottom: 6,
        }}>
          REQUEST INTERCEPTED
        </div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.55 }}>
          Runtime governance engine activated.<br />
          Scanning intent and risk profile...
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 8 }}>
        {['Intent', 'Policy', 'Risk', 'Data'].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.18 }}
            style={{
              padding: '4px 10px', borderRadius: 20,
              background: `${Am}14`, border: `1px solid ${Am}30`,
              fontSize: 11, fontWeight: 600, color: Am,
            }}
          >
            ⟳ {label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Step3Visual() {
  const ROWS = [
    { label: 'Prompt Intent',       value: 'MALICIOUS',    color: R },
    { label: 'Data Classification', value: 'PII / SENSITIVE', color: R },
    { label: 'Policy Compliance',   value: 'VIOLATED',     color: R },
    { label: 'Exfiltration Risk',   value: 'CRITICAL',     color: R },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '0.09em', marginBottom: 14 }}>
        GOVERNANCE ANALYSIS RESULTS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
        {ROWS.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.22, duration: 0.4, ease: 'easeOut' }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 13px',
              background: `${row.color}06`,
              border: `1px solid ${row.color}22`,
              borderRadius: 9,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>{row.label}</span>
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.22 + 0.2 }}
              style={{
                fontSize: 11, fontWeight: 800, color: row.color,
                letterSpacing: '0.06em', padding: '3px 11px',
                background: `${row.color}16`, borderRadius: 20,
                border: `1px solid ${row.color}25`,
              }}
            >
              {row.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        style={{
          padding: '13px 16px',
          background: '#FFF5F5',
          border: `1.5px solid ${R}28`,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#777', letterSpacing: '0.05em' }}>
            OVERALL RISK SCORE
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: R }}>94 / 100</span>
        </div>
        <div style={{ height: 7, background: '#F0D0D0', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '94%' }}
            transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${Am}, ${R})`, borderRadius: 4 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function Step4Visual() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 11, stiffness: 180, delay: 0.1 }}
        style={{
          width: 84, height: 84, borderRadius: '50%',
          background: `${R}14`,
          border: `3px solid ${R}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 32px ${R}20`,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <XCircle size={42} color={R} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{
          fontSize: 24, fontWeight: 900, color: R,
          letterSpacing: '0.04em', marginBottom: 4,
        }}>
          ACTION BLOCKED
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>Policy enforcement activated immediately</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {[
          { k: 'Violated Policy',   v: 'External Data Transfer Prohibited', c: R },
          { k: 'Action Taken',      v: 'Request Terminated',                 c: R },
          { k: 'Admin Status',      v: 'Notified + Alert Dispatched',        c: Am },
          { k: 'Quarantine',        v: 'Event Quarantined for Review',       c: Am },
        ].map(({ k, v, c }) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 11px', background: '#FAFAFA',
            border: '1px solid #F0F0F4', borderRadius: 7,
          }}>
            <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: c, textAlign: 'right', maxWidth: '55%' }}>{v}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Step5Visual() {
  const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const FIELDS = [
    { k: 'Event ID',    v: 'EVT-2024-A-08946',               h: false },
    { k: 'Timestamp',  v: `${dateStr}  ${timeStr}`,           h: false },
    { k: 'User',       v: 'john.morrison@acmecorp.com',        h: false },
    { k: 'AI Agent',   v: 'HR-Assistant-v2',                  h: false },
    { k: 'Action',     v: 'Data Export Attempt',               h: false },
    { k: 'Decision',   v: 'BLOCKED',                          h: true  },
    { k: 'Policy',     v: 'EXT-TRANSFER-001',                 h: false },
    { k: 'Risk Score', v: '94 / 100',                         h: true  },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: G }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.08em' }}>
          AUDIT ENTRY LOGGED
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#bbb' }}>Immutable record</span>
      </div>

      <div style={{
        background: '#F8F8FC',
        border: `1.5px solid rgba(139,60,247,0.12)`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 14,
        fontFamily: "'Courier New', monospace",
      }}>
        {FIELDS.map(({ k, v, h }, i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex', gap: 10,
              padding: '4px 0',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: 11, color: '#aaa', minWidth: 86, fontWeight: 500 }}>{k}:</span>
            <span style={{
              fontSize: 11, color: h ? R : D,
              fontWeight: h ? 800 : 500,
            }}>
              {v}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{ display: 'flex', gap: 8 }}
      >
        <button style={{
          flex: 1, padding: '9px', background: `${G}10`,
          border: `1px solid ${G}28`, borderRadius: 8,
          fontSize: 12, fontWeight: 600, color: G, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <CheckCircle size={12} />
          Logged to Compliance
        </button>
        <button style={{
          flex: 1, padding: '9px', background: `${P}10`,
          border: `1px solid ${P}20`, borderRadius: 8,
          fontSize: 12, fontWeight: 600, color: P, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <FileText size={12} />
          View in Dashboard
        </button>
      </motion.div>
    </div>
  );
}

// ─── Product Window Visual ─────────────────────────────────────────────────────
const VISUALS = [
  <Step0Visual key="0" />,
  <Step1Visual key="1" />,
  <Step2Visual key="2" />,
  <Step3Visual key="3" />,
  <Step4Visual key="4" />,
  <Step5Visual key="5" />,
];

// ─── Main Section ─────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const startAutoPlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveStep(s => (s + 1) % STEPS.length);
    }, STEP_DURATION);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleStepClick = (i: number) => {
    setActiveStep(i);
    startAutoPlay(); // reset timer from clicked step
  };

  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(72px, 9vh, 110px) clamp(1.5rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${P}, ${C}) border-box`,
            border: '1.5px solid transparent',
            borderRadius: 40, padding: '6px 16px', marginBottom: 24,
            boxShadow: `0 2px 14px rgba(139,60,247,0.10)`,
          }}>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${C})` }}
            />
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
              background: `linear-gradient(135deg, ${P}, ${C})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              HOW IT WORKS
            </span>
          </div>

          <div style={{
            fontSize: 'clamp(28px, 3.8vw, 52px)', fontWeight: 900,
            color: D, marginBottom: 18, lineHeight: 1.1, letterSpacing: '-0.025em',
          }}>
            From Request to Resolution
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 10%, ${C} 90%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              In Real Time
            </span>
          </div>

          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 17px)', color: '#4A4A6A',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.65,
          }}>
            Watch exactly how Trusyn AI intercepts, analyzes, and governs every AI action, before it reaches your enterprise.
          </p>
        </motion.div>

        {/* ── Two-Column Layout ── */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 40 : 52,
          alignItems: 'flex-start',
        }}>

          {/* ── Left: Steps List ── */}
          <div style={{ flexShrink: 0, width: isMobile ? '100%' : 360 }}>
            {STEPS.map((step, i) => {
              const isActive = activeStep === i;
              const { icon: Icon } = step;

              return (
                <div key={step.number} style={{ position: 'relative' }}>
                  <motion.div
                    onClick={() => handleStepClick(i)}
                    animate={isActive ? {
                      backgroundColor: `${P}08`,
                      borderColor: P + '30',
                    } : {
                      backgroundColor: 'rgba(0,0,0,0)',
                      borderColor: 'rgba(0,0,0,0)',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex', gap: 14,
                      padding: '16px',
                      borderRadius: 14,
                      border: `1.5px solid transparent`,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Left accent */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: 3, borderRadius: '0 2px 2px 0',
                            background: `linear-gradient(180deg, ${P}, ${C})`,
                            transformOrigin: 'top',
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Step number + icon */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <motion.div
                        animate={isActive ? {
                          background: P,
                          color: '#ffffff',
                        } : {
                          background: '#F0F0F6',
                          color: '#888888',
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          width: 40, height: 40, borderRadius: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800,
                          transition: 'background 0.3s, color 0.3s',
                        }}
                      >
                        <Icon size={17} />
                      </motion.div>
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: isActive ? P : '#bbb',
                          letterSpacing: '0.08em',
                          transition: 'color 0.3s',
                        }}>
                          {step.number}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: isActive ? D : '#777',
                        marginBottom: isActive ? 6 : 0,
                        transition: 'color 0.3s',
                        letterSpacing: '-0.01em',
                      }}>
                        {step.title}
                      </div>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p style={{
                              fontSize: 12, color: '#666',
                              lineHeight: 1.6, margin: '0 0 10px',
                            }}>
                              {step.description}
                            </p>

                            {/* Progress bar */}
                            <div style={{ height: 3, background: '#EEE', borderRadius: 2, overflow: 'hidden' }}>
                              <motion.div
                                key={activeStep}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: STEP_DURATION / 1000, ease: 'linear' }}
                                style={{
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${P}, ${C})`,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Connector line between steps */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 35,
                      top: '100%',
                      width: 2,
                      height: 8,
                      background: i < activeStep
                        ? `linear-gradient(180deg, ${P}, ${C})`
                        : 'rgba(139,60,247,0.12)',
                      transition: 'background 0.4s',
                      zIndex: 1,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Right: Product Window ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: 1, minWidth: 0 }}
          >
            <div style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: `0 24px 80px rgba(139,60,247,0.12), 0 8px 32px rgba(0,0,0,0.07)`,
              overflow: 'hidden',
              border: `1.5px solid rgba(139,60,247,0.12)`,
            }}>
              {/* Window Title Bar */}
              <div style={{
                background: `linear-gradient(135deg, #1A1A2E, #2D2D4A)`,
                padding: '13px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {/* Mac-style dots */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#FF5F57', '#FFBD2E', '#28C840'].map((col, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: col }} />
                  ))}
                </div>

                {/* Window title */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.01em' }}
                  >
                    {STEPS[activeStep].windowTitle}
                  </motion.span>
                </AnimatePresence>

                {/* Step dots indicator */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      onClick={() => handleStepClick(i)}
                      animate={i === activeStep ? {
                        width: 22,
                        background: P,
                      } : {
                        width: 6,
                        background: 'rgba(255,255,255,0.25)',
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        height: 6, borderRadius: 3, cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div style={{
                padding: '28px',
                minHeight: 380,
                position: 'relative',
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    {VISUALS[activeStep]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Step counter below window */}
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 8, marginTop: 20,
            }}>
              <span style={{ fontSize: 12, color: '#aaa' }}>Step</span>
              <span style={{
                fontSize: 14, fontWeight: 800, color: P,
              }}>
                {String(activeStep + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12, color: '#ccc' }}>/</span>
              <span style={{ fontSize: 14, color: '#aaa', fontWeight: 600 }}>06</span>
              <span style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }}>· {STEPS[activeStep].title}</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
