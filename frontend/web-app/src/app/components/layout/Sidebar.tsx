import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Bot,
  ShieldAlert,
  FileLock2,
  ScrollText,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import logoImg from '../../../assets/brand/trusyn-logo.png';
import { useSessionUser } from '../../state/session';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Agents', icon: Bot, path: '/agents' },
  { label: 'Threat Center', icon: ShieldAlert, path: '/threats' },
  { label: 'Policies', icon: FileLock2, path: '/policies' },
  { label: 'Audit Logs', icon: ScrollText, path: '/audit-logs' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const sessionUser = useSessionUser();

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid rgba(139, 60, 247, 0.12)',
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(139, 60, 247, 0.08)' }}
      >
        <img src={logoImg} alt="Trusyn" className="h-8 w-auto shrink-0" />
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-none tracking-tight">
            <span style={{ color: '#5E5CE6' }}>Trusyn</span>
            <span className="ml-1" style={{ color: '#38BDF8' }}>
              AI
            </span>
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#10B981' }}
          />
          <span className="text-xs" style={{ color: '#10B981' }}>
            Runtime Active
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto min-h-0">
        <p className="text-xs px-3 py-1 mb-1" style={{ color: '#717182' }}>
          NAVIGATION
        </p>
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 15px rgba(139, 60, 247, 0.35)',
                    }
                  : {
                      color: '#1A1A2E',
                    }
              }
            >
              {!isActive && (
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(139, 60, 247, 0.06)' }}
                />
              )}
              <Icon
                size={18}
                style={{ color: isActive ? '#FFFFFF' : '#8B3CF7', flexShrink: 0 }}
              />
              <span className="text-sm flex-1">{label}</span>
              {isActive && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />}
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 px-3 pb-4 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(139, 60, 247, 0.08)' }}>
        <div className="pt-3" />
        {bottomItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                      color: '#FFFFFF',
                    }
                  : { color: '#1A1A2E' }
              }
            >
              {!isActive && (
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(139, 60, 247, 0.06)' }}
                />
              )}
              <Icon
                size={18}
                style={{ color: isActive ? '#FFFFFF' : '#8B3CF7', flexShrink: 0 }}
              />
              <span className="text-sm">{label}</span>
            </NavLink>
          );
        })}

        <div className="my-1" style={{ borderTop: '1px solid rgba(139,60,247,0.07)' }} />

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: '#F8F5FF' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)' }}
          >
            {sessionUser?.initials ?? 'NA'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate" style={{ color: '#1A1A2E' }}>
              {sessionUser?.name ?? 'Unknown User'}
            </p>
            <p className="text-xs truncate" style={{ color: '#717182' }}>
              {sessionUser?.role ?? 'Member'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
