import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { GlowCard } from './GlowCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  iconColor?: string;
  valueColor?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, subtitle, iconColor, valueColor }: MetricCardProps) {
  return (
    <GlowCard glow glowColor="gradient">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className={`text-3xl font-bold ${valueColor || 'text-foreground'}`}>{value}</h3>
          </motion.div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${iconColor || 'bg-gradient-to-br from-[#8B3CF7] to-[#38BDF8]'} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlowCard>
  );
}
