import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { riskTrendData, decisionDistData, agentInfos } from '../../data/mockData';
import { TrendingUp } from 'lucide-react';

function GradientCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 2px 20px rgba(139, 60, 247, 0.07)',
        border: '1px solid rgba(139, 60, 247, 0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} style={{ color: '#8B3CF7' }} />
        <h3 style={{ color: '#1A1A2E' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: '#1A1A2E',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
      >
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RiskAnalytics() {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
      {/* Risk Trend Over Time */}
      <GradientCard title="Risk Events — Today">
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={riskTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#717182' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#717182' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="low"      name="Low"      stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.12} />
            <Area type="monotone" dataKey="medium"   name="Medium"   stroke="#F59E0B" strokeWidth={2} fill="#F59E0B" fillOpacity={0.12} />
            <Area type="monotone" dataKey="critical" name="Critical" stroke="#EF4444" strokeWidth={2} fill="#EF4444" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </GradientCard>

      {/* Decision Distribution */}
      <GradientCard title="Decision Breakdown">
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={decisionDistData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,60,247,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#717182' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#717182' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Actions" radius={[4, 4, 0, 0]}>
              {decisionDistData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GradientCard>

      {/* Agent Trust Scores */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 2px 20px rgba(139, 60, 247, 0.07)',
          border: '1px solid rgba(139, 60, 247, 0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: 15 }}>🏆</span>
          <h3 style={{ color: '#1A1A2E' }}>Agent Trust Scores</h3>
        </div>
        <div className="flex flex-col gap-3">
          {agentInfos.map((agent) => {
            const color =
              agent.trustScore >= 85
                ? '#10B981'
                : agent.trustScore >= 70
                ? '#F59E0B'
                : '#EF4444';
            return (
              <div key={agent.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#1A1A2E' }}>
                    {agent.icon} {agent.name.replace(' Agent', '')}
                  </span>
                  <span className="text-xs" style={{ color }}>
                    {agent.trustScore}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: 'rgba(139,60,247,0.08)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${agent.trustScore}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}