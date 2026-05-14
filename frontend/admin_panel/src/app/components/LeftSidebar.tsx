import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  Bot,
  Activity,
  Shield,
  FileText,
  Server,
  Settings,
} from 'lucide-react';
import { cn } from './ui/utils';
import logoImg from '../../assets/brand/trusyn-logo.png';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'threats', label: 'Threat Intelligence', icon: ShieldAlert },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'api', label: 'API Monitoring', icon: Activity },
  { id: 'governance', label: 'Governance Engine', icon: Shield },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'health', label: 'System Health', icon: Server },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function LeftSidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <div className="w-64 h-full border-r border-border bg-sidebar/50 backdrop-blur-xl flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Trusyn AI" className="h-8 w-auto" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Trusyn AI</p>
            <p className="text-xs text-muted-foreground truncate">Super Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="trusyn-scrollbar flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-[#8B3CF7]/20 to-[#38BDF8]/20 border border-[#8B3CF7]/30 text-foreground shadow-lg shadow-[#8B3CF7]/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-[#8B3CF7]')} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Platform Status</span>
          </div>
          <p className="text-sm font-medium">99.98% Uptime</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
