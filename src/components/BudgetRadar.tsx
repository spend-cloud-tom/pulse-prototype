import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetRadarProps {
  location: string;
  spent: number;
  total: number;
  trend?: string;
  size?: 'sm' | 'md';
}

/**
 * Circular budget visualization with animated consumption arc.
 * Heat glow when approaching threshold (>75%).
 */
const BudgetRadar = ({ 
  location, 
  spent, 
  total, 
  trend,
  size = 'md',
}: BudgetRadarProps) => {
  const percentage = Math.round((spent / total) * 100);
  const isHot = percentage >= 75;
  const isCritical = percentage >= 90;
  
  const sizeConfig = {
    sm: { width: 64, stroke: 6, fontSize: 'text-sm', labelSize: 'text-[10px]' },
    md: { width: 80, stroke: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
  };
  
  const { width, stroke, fontSize, labelSize } = sizeConfig[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  
  const getColor = () => {
    if (isCritical) return 'stroke-signal-red text-signal-red';
    if (isHot) return 'stroke-signal-amber text-signal-amber';
    return 'stroke-hero-teal text-hero-teal';
  };
  
  const trendUp = trend?.startsWith('+');

  return (
    <div className="flex flex-col items-center">
      {/* Circular gauge */}
      <div className={`relative ${isHot ? 'budget-heat-glow' : ''}`}>
        <svg width={width} height={width} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/20"
          />
          {/* Progress arc */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={getColor()}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold ${getColor().split(' ')[1]}`}>
            {percentage}%
          </span>
        </div>
      </div>
      
      {/* Location label */}
      <p className={`${labelSize} font-medium text-foreground mt-1.5 text-center`}>
        {location}
      </p>
      
      {/* Trend indicator */}
      {trend && (
        <div className={`flex items-center gap-0.5 ${labelSize} ${
          trendUp ? 'text-signal-amber' : 'text-signal-green'
        }`}>
          {trendUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{trend}</span>
        </div>
      )}
      
      {/* Amount display */}
      <p className={`${labelSize} text-muted-foreground`}>
        €{spent.toLocaleString()} / €{total.toLocaleString()}
      </p>
    </div>
  );
};

export default BudgetRadar;
