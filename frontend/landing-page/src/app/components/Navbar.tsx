import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import logoSrc from '../../imports/Logo__3_.png';

const PURPLE = '#8B3CF7';
const CYAN = '#38BDF8';
const NAV_HEIGHT_OFFSET = 84;

const NAV_LINKS = [
  { label: 'Product', sectionId: 'product' },
  { label: 'How It Works', sectionId: 'how-it-works' },
  { label: 'Features', sectionId: 'features' },
  { label: 'Architecture', sectionId: 'architecture' },
];

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const y = section.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT_OFFSET;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function navigateToDemoHub() {
  window.location.href = '/demos';
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(139,60,247,0.1)' : '1px solid transparent',
          transition: 'background-color 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
          boxShadow: scrolled ? '0 1px 24px rgba(139,60,247,0.06)' : 'none',
        }}
      >
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={logoSrc} alt="Trusyn AI" style={{ height: 38, width: 'auto' }} />
          <span style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Trusyn
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: PURPLE,
            opacity: 0.6,
            textTransform: 'uppercase' as const,
            marginLeft: 1,
          }}>
            AI
          </span>
        </a>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {NAV_LINKS.map(link => (
              <NavLink key={link.label} label={link.label} onClick={() => scrollToSection(link.sectionId)} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={navigateToDemoHub}
              style={{
                background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                boxShadow: '0 4px 20px rgba(139,60,247,0.28)',
              }}
            >
              View Demo
            </motion.button>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(139,60,247,0.3)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                color: PURPLE,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 72,
              left: 0,
              right: 0,
              zIndex: 999,
              backgroundColor: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(139,60,247,0.1)',
              padding: '20px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href="#"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                onClick={event => {
                  event.preventDefault();
                  scrollToSection(link.sectionId);
                  setMenuOpen(false);
                }}
                style={{
                  padding: '12px 8px',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#1A1A2E',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => {
                navigateToDemoHub();
                setMenuOpen(false);
              }}
              style={{
                marginTop: 16,
                background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              View Demo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="#"
      onClick={event => {
        event.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 15,
        fontWeight: 500,
        color: hovered ? PURPLE : '#1A1A2E',
        textDecoration: 'none',
        opacity: hovered ? 1 : 0.65,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {label}
      <span style={{
        position: 'absolute',
        bottom: -3,
        left: 0,
        right: 0,
        height: 2,
        borderRadius: 1,
        background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.25s ease',
        transformOrigin: 'left',
      }} />
    </a>
  );
}
