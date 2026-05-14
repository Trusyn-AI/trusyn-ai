import { Activity, ShieldX, AlertTriangle, Star } from 'lucide-react';

interface StatsRowProps {
  totalEvents: number;
  blockedActions: number;
  activeThreats: number;
  avgTrustScore: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  trend?: { value: string; up: boolean };
}

function StatCard({ label, value, sub, icon, accentColor, bgColor, trend }: StatCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 2px 20px rgba(139, 60, 247, 0.07)',
        border: '1px solid rgba(139, 60, 247, 0.08)',
      }}
    >
      {/* Gradient top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: '#717182' }}>{label}</p>
          <p
            className="mt-1"
            style={{ color: '#1A1A2E', fontSize: 26, fontWeight: 600, lineHeight: 1 }}
          >
            {value}
          </p>
          <p className="text-xs mt-2" style={{ color: '#717182' }}>{sub}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bgColor }}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 mt-3">
          <span
            className="text-xs"
            style={{ color: trend.up ? '#10B981' : '#EF4444' }}
          >
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs" style={{ color: '#717182' }}>vs yesterday</span>
        </div>
      )}
    </div>
  );
}

export function StatsRow({ totalEvents, blockedActions, activeThreats, avgTrustScore }: StatsRowProps) {
  return (
    <div className="flex gap-4">
      <StatCard
        label="Total Events Today"
        value={totalEvents}
        sub="Across all agents"
        icon={<Activity size={18} style={{ color: '#8B3CF7' }} />}
        accentColor="#8B3CF7"
        bgColor="rgba(139, 60, 247, 0.08)"
        trend={{ value: '12%', up: true }}
      />
      <StatCard
        label="Blocked Actions"
        value={blockedActions}
        sub="Prevented by governance"
        icon={<ShieldX size={18} style={{ color: '#EF4444' }} />}
        accentColor="#EF4444"
        bgColor="rgba(239, 68, 68, 0.08)"
        trend={{ value: '3', up: true }}
      />
      <StatCard
        label="Active Threats"
        value={activeThreats}
        sub="Require investigation"
        icon={<AlertTriangle size={18} style={{ color: '#F59E0B' }} />}
        accentColor="#F59E0B"
        bgColor="rgba(245, 158, 11, 0.08)"
        trend={{ value: '2', up: true }}
      />
      <StatCard
        label="Avg Trust Score"
        value={`${avgTrustScore}%`}
        sub="Across all agents"
        icon={<Star size={18} style={{ color: '#10B981' }} />}
        accentColor="#10B981"
        bgColor="rgba(16, 185, 129, 0.08)"
        trend={{ value: '4%', up: false }}
      />
    </div>
  );
}
