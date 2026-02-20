import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetRadarProps {
  location: string;
  spent: number;
  total: number;
  trend?: string;
  size?: 'sm' | 'md';
}

/**
 * Professional circular budget gauge with gradient arc, 
 * animated progress, and contextual status indicators.
 */
const BudgetRadar = ({ 
  location, 
  spent, 
  total, 
  trend,
  size = 'md',
}: BudgetRadarProps) => {
  const percentage = Math.round((spent / total) * 100);
  const isWarning = percentage >= 65 && percentage < 85;
  const isCritical = percentage >= 85;
  
  const sizeConfig = {
    sm: { width: 72, stroke: 7, fontSize: 'text-base', labelSize: 'text-[10px]' },
    md: { width: 88, stroke: 8, fontSize: 'text-xl', labelSize: 'text-xs' },
  };
  
  const { width, stroke, fontSize, labelSize } = sizeConfig[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  
  // Gradient IDs unique per location
  const gradientId = `budget-gradient-${location.replace(/\s/g, '-')}`;
  
  const getGradientColors = () => {
    if (isCritical) return { start: '#ef4444', end: '#dc2626' }; // red
    if (isWarning) return { start: '#f59e0b', end: '#d97706' }; // amber
    return { start: '#14b8a6', end: '#0d9488' }; // teal
  };
  
  const getStatusColor = () => {
    if (isCritical) return 'text-state-risk';
    if (isWarning) return 'text-state-blocked';
    return 'text-hero-teal';
  };
  
  const trendUp = trend?.startsWith('+');
  const colors = getGradientColors();

  return (
    <div className={cn(
      "flex flex-col items-center group p-3 rounded-xl border-l-4",
      isCritical && "border-l-state-risk bg-state-risk-bg/20",
      isWarning && !isCritical && "border-l-state-blocked bg-state-blocked-bg/20",
      !isCritical && !isWarning && "border-l-border bg-secondary/20"
    )}>
      {/* Circular gauge with shadow and glow effects */}
      <div className={cn(
        "relative transition-transform duration-300 group-hover:scale-105",
        isCritical && "drop-shadow-[0_0_12px_rgba(239,68,68,0.3)]",
        isWarning && "drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"
      )}>
        <svg width={width} height={width} className="transform -rotate-90">
          <defs>
            {/* Gradient for the progress arc */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
          
          {/* Background track */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-secondary"
          />
          
          {/* Progress arc with gradient */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${gradientId})`}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        
        {/* Center percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn(fontSize, "font-bold tabular-nums", getStatusColor())}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      
      {/* Location name */}
      <p className="text-sm font-semibold text-foreground mt-2 text-center">
        {location}
      </p>
      
      {/* Trend badge */}
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mt-1",
          trendUp 
            ? "bg-state-blocked-bg text-state-blocked" 
            : "bg-signal-green-bg text-signal-green"
        )}>
          {trendUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{trend}</span>
        </div>
      )}
      
      {/* Amount breakdown */}
      <p className={cn(labelSize, "text-muted-foreground mt-1 tabular-nums")}>
        €{spent.toLocaleString()} / €{total.toLocaleString()}
      </p>
    </div>
  );
};

export default BudgetRadar;
