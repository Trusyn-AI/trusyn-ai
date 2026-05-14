import { Bell, Search, Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../../api/services/authService';
import { useSessionUser } from '../../state/session';

interface TopBarProps {
  activeThreats: number;
}

export function TopBar({ activeThreats }: TopBarProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const sessionUser = useSessionUser();
  const navigate = useNavigate();

  return (
    <header
      className="flex items-center justify-between px-6 h-16 shrink-0"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(139, 60, 247, 0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: '#F8F5FF', minWidth: 260 }}
        >
          <Search size={15} style={{ color: '#717182' }} />
          <input
            type="text"
            placeholder="Search agents, events, policies..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-sm"
            style={{ color: '#1A1A2E' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: activeThreats > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${activeThreats > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}
        >
          <Shield
            size={14}
            style={{ color: activeThreats > 0 ? '#EF4444' : '#10B981' }}
          />
          <span
            className="text-xs"
            style={{ color: activeThreats > 0 ? '#EF4444' : '#10B981' }}
          >
            {activeThreats} Active {activeThreats === 1 ? 'Threat' : 'Threats'}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: '#F8F5FF' }}
          >
            <Bell size={16} style={{ color: '#1A1A2E' }} />
            {activeThreats > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#EF4444' }}
              />
            )}
          </button>

          {showNotif && (
            <div
              className="absolute right-0 top-11 w-72 rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(139,60,247,0.15)',
                boxShadow: '0 8px 30px rgba(139,60,247,0.15)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(139,60,247,0.08)' }}>
                <p className="text-sm" style={{ color: '#1A1A2E' }}>Notifications</p>
              </div>
              {[
                { text: 'Finance Agent blocked - payroll export', time: '2m ago', color: '#EF4444' },
                { text: 'New policy violation detected', time: '5m ago', color: '#F59E0B' },
                { text: 'Operations Agent quarantined', time: '8m ago', color: '#EF4444' },
              ].map((n, i) => (
                <div
                  key={i}
                  className="px-4 py-3 flex items-start gap-3"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: n.color }}
                  />
                  <div>
                    <p className="text-xs" style={{ color: '#1A1A2E' }}>{n.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#717182' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: '#F8F5FF' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)', fontSize: 11 }}
            >
              {sessionUser?.initials ?? 'NA'}
            </div>
            <span className="text-sm" style={{ color: '#1A1A2E' }}>{sessionUser?.name ?? 'Unknown User'}</span>
            <ChevronDown size={13} style={{ color: '#717182' }} />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 top-11 w-48 rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(139,60,247,0.15)',
                boxShadow: '0 8px 30px rgba(139,60,247,0.15)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-3 text-sm"
                style={{ color: '#EF4444', background: '#FFFFFF' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
