import { motion } from 'motion/react';

interface StatusIndicatorProps {
  status: 'operational' | 'warning' | 'critical' | 'degraded';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    operational: {
      color: 'bg-green-500',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.6)]',
      label: 'Operational',
    },
    warning: {
      color: 'bg-yellow-500',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.6)]',
      label: 'Warning',
    },
    critical: {
      color: 'bg-red-500',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.6)]',
      label: 'Critical',
    },
    degraded: {
      color: 'bg-orange-500',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.6)]',
      label: 'Degraded',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`${sizeClasses[size]} ${config.color} ${config.glow} rounded-full`}
        animate={{
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: status === 'operational' ? 2 : status === 'warning' ? 1.5 : 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {showLabel && <span className="text-sm text-muted-foreground">{config.label}</span>}
    </div>
  );
}
