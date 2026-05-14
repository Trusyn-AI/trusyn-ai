import { ReactNode } from 'react';
import { cn } from '../components/ui/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: 'purple' | 'cyan' | 'gradient';
  hover?: boolean;
}

export function GlowCard({ children, className, glow = false, glowColor = 'purple', hover = true }: GlowCardProps) {
  const glowClasses = {
    purple: 'hover:shadow-[0_0_20px_rgba(139,60,247,0.3)]',
    cyan: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]',
    gradient: 'hover:shadow-[0_0_20px_rgba(139,60,247,0.2),0_0_30px_rgba(56,189,248,0.1)]',
  };

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-6 transition-all duration-300',
        hover && 'hover:scale-[1.02] cursor-pointer',
        glow && glowClasses[glowColor],
        className
      )}
    >
      {children}
    </div>
  );
}
