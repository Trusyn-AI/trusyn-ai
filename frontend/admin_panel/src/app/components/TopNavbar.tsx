import { Bell, ChevronDown, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSessionUser } from '../state/session';
import { adminService } from '../api/services/adminService';

interface TopNavbarProps {
  onOpenSettings: () => void;
  onLogout: () => void;
}

type LiveNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  severityColor: string;
};

function relativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TopNavbar({ onOpenSettings, onLogout }: TopNavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const sessionUser = useSessionUser();

  useEffect(() => {
    let isMounted = true;
    adminService
      .platformOverview()
      .then((data) => {
        if (!isMounted) return;
        const items = data.recent_threats.slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title,
          description: `${item.organization_name} - ${item.threat_type.replace(/_/g, ' ')}`,
          time: relativeTime(item.detected_at),
          severityColor:
            item.severity === 'CRITICAL'
              ? '#EF4444'
              : item.severity === 'HIGH'
                ? '#F97316'
                : item.severity === 'MEDIUM'
                  ? '#F59E0B'
                  : '#8B3CF7',
        }));
        setNotifications(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setNotifications([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations, agents, threats..."
            className="pl-10 bg-input border-border/50 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <StatusIndicator status="operational" size="sm" />
          <span className="text-sm text-green-400">All Systems Operational</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              setShowNotifications((value) => !value);
              setShowProfileMenu(false);
            }}
          >
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {notifications.length}
            </Badge>
          </Button>

          {showNotifications && (
            <div
              className="absolute right-0 top-11 w-[22rem] rounded-2xl z-50 overflow-hidden"
              style={{
                background: '#12121A',
                border: '1px solid rgba(139,60,247,0.28)',
                boxShadow: '0 20px 42px rgba(8, 6, 24, 0.55)',
              }}
            >
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-sm text-white">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No new notifications.</div>
              ) : notifications.map((notification) => (
                <div key={notification.id} className="px-4 py-3 border-b border-border/40 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: notification.severityColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-white">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
                      <p className="text-xs text-[#8B9BB5] mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="w-5 h-5" />
        </Button>

        {/* Admin Profile */}
        <div className="relative pl-3 border-l border-border">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((value) => !value);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="text-right">
              <p className="text-sm font-medium">{sessionUser?.name ?? 'Admin User'}</p>
              <p className="text-xs text-muted-foreground">{sessionUser?.role ?? 'Super Admin'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8] flex items-center justify-center text-sm font-semibold text-white">
              {sessionUser?.initials ?? 'AU'}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 top-12 w-44 rounded-xl overflow-hidden z-50"
              style={{
                background: '#12121A',
                border: '1px solid rgba(139,60,247,0.28)',
                boxShadow: '0 18px 34px rgba(8, 6, 24, 0.52)',
              }}
            >
              <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
