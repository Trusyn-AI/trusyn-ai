import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import logoSrc from '../../imports/Logo__3_.png';

const P = '#8B3CF7';
const C = '#38BDF8';
const G = '#10B981';

export function CTASection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, #08081A 0%, #160930 40%, #081630 100%)',
      padding: 'clamp(80px, 10vh, 120px) clamp(1.5rem, 4vw, 3rem)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '20%', width: 500, height: 500, background: `${P}10`, borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '20%', width: 400, height: 400, background: `${C}08`, borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'radial-gradient(circle, rgba(139,60,247,0.8) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <img
            src={logoSrc}
            alt="Trusyn AI"
            style={{ width: 56, height: 56, filter: 'drop-shadow(0 0 20px rgba(139,60,247,0.5))' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${P} 0%, ${C} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              Trusyn AI
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div style={{
            fontSize: 'clamp(32px, 5vw, 62px)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            Stop Hoping.
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 0%, #A855F7 40%, ${C} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Start Governing.
            </span>
          </div>

          <p style={{
            fontSize: 'clamp(15px, 1.7vw, 19px)',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65,
            marginBottom: 40,
            maxWidth: 540,
            margin: '0 auto 40px',
          }}>
            Trusyn AI gives your enterprise complete runtime governance over every AI agent, intercepting threats before they become incidents.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex', gap: 0,
                maxWidth: 560, margin: '0 auto',
                borderRadius: 14,
                boxShadow: focused
                  ? `0 0 0 3px ${P}40, 0 8px 32px rgba(139,60,247,0.2)`
                  : '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'box-shadow 0.3s',
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="your@company.com"
                  required
                  style={{
                    flex: 1, padding: '16px 20px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRight: 'none',
                    borderRadius: '14px 0 0 14px',
                    color: '#ffffff', fontSize: 15,
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  style={{
                    padding: '16px 24px',
                    background: `linear-gradient(135deg, ${P}, ${C})`,
                    border: 'none',
                    borderRadius: '0 14px 14px 0',
                    color: '#ffffff',
                    fontSize: 14, fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 20px ${P}50`,
                  }}
                >
                  Request Demo
                  <ArrowRight size={15} />
                </motion.button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 28px', borderRadius: 14,
                background: `${G}18`, border: `1.5px solid ${G}35`,
              }}
            >
              <CheckCircle size={20} color={G} />
              <span style={{ fontSize: 16, fontWeight: 700, color: G }}>
                You're on the list - we'll be in touch shortly!
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
