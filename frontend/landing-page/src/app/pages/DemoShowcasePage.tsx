import { useEffect, type ComponentType } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Monitor, LayoutDashboard, Sparkles } from 'lucide-react';

const P = '#8B3CF7';
const C = '#38BDF8';
const D = '#1A1A2E';

const USER_APP_DEMO_URL = import.meta.env.VITE_USER_APP_DEMO_URL ?? '/';
const ADMIN_PANEL_DEMO_URL = import.meta.env.VITE_ADMIN_PANEL_DEMO_URL ?? '/';

type DemoCard = {
  title: string;
  description: string;
  points: string[];
  buttonLabel: string;
  href: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  accent: string;
};

const DEMO_CARDS: DemoCard[] = [
  {
    title: 'Trusyn AI Website',
    description: 'Explore the public product narrative, trust positioning, and platform architecture overview.',
    points: ['Product narrative and positioning', 'Enterprise trust messaging', 'Architecture overview'],
    buttonLabel: 'View',
    href: '/',
    icon: Monitor,
    accent: '#8B3CF7',
  },
  {
    title: 'Trusyn AI User APP',
    description: 'Experience the organization user dashboard for runtime monitoring and governance workflows.',
    points: ['Organization-level visibility', 'Agent and threat operations', 'Policy and governance actions'],
    buttonLabel: 'View Demo',
    href: USER_APP_DEMO_URL,
    icon: Shield,
    accent: '#38BDF8',
  },
  {
    title: 'Trusyn AI Admin Panel',
    description: 'See the platform-wide control center for global operations, analytics, and platform health.',
    points: ['Global organization oversight', 'Platform threat intelligence', 'Operational health telemetry'],
    buttonLabel: 'View Demo',
    href: ADMIN_PANEL_DEMO_URL,
    icon: LayoutDashboard,
    accent: '#7C3AED',
  },
];

function FloatingOrb({
  size,
  top,
  left,
  color,
  duration,
}: {
  size: number;
  top: string;
  left: string;
  color: string;
  duration: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -18, 0],
        x: [0, 10, 0],
        opacity: [0.25, 0.45, 0.25],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }}
    />
  );
}

function AnimatedCard({ card, index }: { card: DemoCard; index: number }) {
  const Icon = card.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 34, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.015 }}
      style={{
        position: 'relative',
        borderRadius: 22,
        padding: 22,
        minHeight: 358,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1.5px solid rgba(139,60,247,0.18)',
        boxShadow: '0 12px 50px rgba(41, 16, 85, 0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          top: -110,
          right: -80,
          borderRadius: '50%',
          border: `1px dashed ${card.accent}33`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        animate={{ x: ['-30%', '130%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '38%',
          height: '100%',
          background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.48) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 14% 10%, ${card.accent}20 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <motion.div
        whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
        transition={{ duration: 0.45 }}
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${card.accent}2A, #DDEEFF)`,
          border: `1px solid ${card.accent}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          boxShadow: `0 8px 28px ${card.accent}30`,
        }}
      >
        <Icon size={21} color={card.accent} />
      </motion.div>

      <h2 style={{
        margin: 0,
        marginBottom: 10,
        color: D,
        fontSize: 26,
        lineHeight: 1.12,
        letterSpacing: '-0.02em',
      }}>
        {card.title}
      </h2>

      <p style={{
        margin: 0,
        color: '#4D4F6E',
        fontSize: 15,
        lineHeight: 1.62,
        marginBottom: 14,
      }}>
        {card.description}
      </p>

      <div style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {card.points.map((point, pointIndex) => (
          <motion.div
            key={point}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.25 + pointIndex * 0.08, duration: 0.35 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#43456A',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: pointIndex * 0.15 }}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${P}, ${C})`,
                flexShrink: 0,
                boxShadow: `0 0 10px ${card.accent}66`,
              }}
            />
            {point}
          </motion.div>
        ))}
      </div>

      <motion.a
        href={card.href}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        style={{
          marginTop: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          textDecoration: 'none',
          borderRadius: 14,
          padding: '13px 16px',
          fontSize: 15,
          fontWeight: 800,
          color: 'white',
          background: `linear-gradient(135deg, ${P}, ${C})`,
          boxShadow: '0 10px 28px rgba(139,60,247,0.25)',
          border: '1px solid rgba(255,255,255,0.28)',
        }}
      >
        {card.buttonLabel}
        <ArrowRight size={16} />
      </motion.a>
    </motion.article>
  );
}

export function DemoShowcasePage() {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      height: '100vh',
      overflow: 'hidden',
      background: '#ffffff',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 2.8vw, 2rem)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(139,60,247,0.09) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      <FloatingOrb size={340} top="-10%" left="68%" color="rgba(139,60,247,0.28)" duration={10} />
      <FloatingOrb size={300} top="65%" left="-6%" color="rgba(56,189,248,0.25)" duration={12} />
      <FloatingOrb size={260} top="22%" left="20%" color="rgba(124,58,237,0.18)" duration={9} />

      <section style={{
        width: 'min(1240px, 100%)',
        position: 'relative',
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0 rgba(139,60,247,0)', '0 0 24px rgba(139,60,247,0.24)', '0 0 0 rgba(139,60,247,0)'] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 16px',
              borderRadius: 999,
              border: '1.5px solid rgba(139,60,247,0.26)',
              background: 'rgba(255,255,255,0.85)',
              marginBottom: 18,
            }}
          >
            <Sparkles size={13} color={P} />
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: `linear-gradient(135deg, ${P}, ${C})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              TRUSYN AI DEMO HUB
            </span>
          </motion.div>

          <h1 style={{
            margin: 0,
            fontSize: 'clamp(34px, 5vw, 66px)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: D,
            marginBottom: 4,
          }}>
            Choose Your
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${P} 18%, ${C} 82%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Trusyn Experience
            </span>
          </h1>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18,
        }}>
          {DEMO_CARDS.map((card, index) => (
            <AnimatedCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
