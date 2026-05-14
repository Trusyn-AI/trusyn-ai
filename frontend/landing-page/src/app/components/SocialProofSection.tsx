import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { Shield, Clock, Activity, Award } from 'lucide-react';

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = '#8B3CF7';
const C  = '#38BDF8';
const G  = '#10B981';
const Am = '#F59E0B';
const D  = '#1A1A2E';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ end, duration = 1400, suffix = '', prefix = '' }: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(Math.floor(start));
      if (start >= end) { setCount(end); clearInterval(t); }
    }, 16);
    return () => clearInterval(t);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  {
    icon: Activity,
    color: P,
    countEnd: 10,
    suffix: 'M+',
    label: 'AI Actions Governed',
    sublabel: 'and counting across enterprise deployments',
  },
  {
    icon: Clock,
    color: C,
    countEnd: 10,
    prefix: '<\u202f',
    suffix: 'ms',
    label: 'Average Latency',
    sublabel: 'governance overhead at runtime',
  },
  {
    icon: Shield,
    color: G,
    countEnd: 9997,
    suffix: '',
    display: '99.97%',
    label: 'Detection Accuracy',
    sublabel: 'across threat classification benchmarks',
  },
  {
    icon: Award,
    color: Am,
    countEnd: 4,
    suffix: '',
    display: 'SOC 2 · GDPR · HIPAA · ISO',
    label: 'Compliance Frameworks',
    sublabel: 'built-in, auditable, and certifiable',
  },
];

const COMPANIES = [
  'Acme Enterprises',
  'Nexus Financial',
  'Helix Health',
  'Vertex Technologies',
  'Orion Logistics',
  'Stratos Capital',
];

// ─── Main Section ─────────────────────────────────────────────────────────────
export function SocialProofSection() {
  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(72px, 9vh, 112px) clamp(1.5rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <p style={{
            fontSize: 13, fontWeight: 700, color: P,
            letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase',
          }}>
            Built for Enterprise. Proven at Scale.
          </p>
          <div style={{
            fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 900,
            color: D, lineHeight: 1.1, letterSpacing: '-0.02em',
          }}>
            The Numbers Speak
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 10%, ${C} 90%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              for Themselves
            </span>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 1,
          background: 'rgba(139,60,247,0.07)',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(139,60,247,0.10)',
          marginBottom: 64,
        }}>
          {STATS.map(({ icon: Icon, color, countEnd, suffix, prefix, display, label, sublabel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                padding: 'clamp(28px, 4vw, 40px) clamp(20px, 3vw, 36px)',
                background: '#ffffff',
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${color}12`, border: `1.5px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
              }}>
                <Icon size={22} color={color} />
              </div>

              <div style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 900, color, lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>
                {display ?? (
                  <Counter
                    end={countEnd}
                    prefix={prefix}
                    suffix={suffix}
                    duration={1600}
                  />
                )}
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: D, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                  {sublabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Company Trust Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#bbb',
            letterSpacing: '0.1em', marginBottom: 20,
          }}>
            TRUSTED BY SECURITY TEAMS AT
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center', gap: 12,
          }}>
            {COMPANIES.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{
                  padding: '9px 22px', borderRadius: 24,
                  background: '#F8F7FC',
                  border: '1.5px solid rgba(139,60,247,0.10)',
                  fontSize: 13, fontWeight: 700, color: '#666',
                  letterSpacing: '0.01em',
                }}
              >
                {name}
              </motion.div>
            ))}
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: '#ccc', fontStyle: 'italic' }}>
            * Representative enterprise customers. Logos available under NDA.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
