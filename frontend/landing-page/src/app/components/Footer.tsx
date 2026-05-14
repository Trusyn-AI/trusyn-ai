import { Shield } from 'lucide-react';

const P = '#8B3CF7';

export function Footer() {
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid rgba(139,60,247,0.10)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 3rem)' }}>
        <div style={{
          borderTop: '1px solid rgba(139,60,247,0.08)',
          padding: '20px 0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={13} color={P} />
            <span style={{ fontSize: 12, color: '#aaa' }}>
              &copy; 2026 Trusyn AI, Inc. All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#10B981',
            }} />
            <span style={{ fontSize: 12, color: '#aaa' }}>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
