import { motion } from 'framer-motion';
import { useSystemHealth, HealthLevel } from '@/context/SystemHealthContext';
import { cn } from '@/lib/utils';

interface SystemHealthDotProps {
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const healthConfig: Record<HealthLevel, { color: string; label: string; pulseColor: string }> = {
  stable: {
    color: 'bg-signal-green',
    label: 'All systems normal',
    pulseColor: 'rgba(16, 185, 129, 0.4)',
  },
  elevated: {
    color: 'bg-state-blocked',
    label: 'Elevated activity',
    pulseColor: 'rgba(217, 119, 6, 0.4)',
  },
  critical: {
    color: 'bg-state-risk',
    label: 'Attention needed',
    pulseColor: 'rgba(220, 38, 38, 0.4)',
  },
};

const SystemHealthDot = ({ size = 'sm', showLabel = false, className }: SystemHealthDotProps) => {
  const { healthLevel, pendingDecisions, criticalCount } = useSystemHealth();
  const config = healthConfig[healthLevel];

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        {/* Pulse ring animation */}
        <motion.div
          className={cn('absolute inset-0 rounded-full', config.color)}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: healthLevel === 'critical' ? 1.5 : healthLevel === 'elevated' ? 2.5 : 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ boxShadow: `0 0 8px ${config.pulseColor}` }}
        />
        
        {/* Core dot */}
        <motion.div
          className={cn('relative rounded-full', sizeClasses[size], config.color)}
          animate={healthLevel === 'critical' ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {showLabel && (
        <div className="text-xs">
          <span className="text-muted-foreground">{config.label}</span>
          {pendingDecisions > 0 && (
            <span className="ml-1.5 text-foreground font-medium">
              · {pendingDecisions} pending
              {criticalCount > 0 && (
                <span className="text-state-risk ml-1">({criticalCount} critical)</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemHealthDot;
