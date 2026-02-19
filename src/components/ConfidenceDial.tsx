import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceDialProps {
  confidence: number;
  reasoning?: string;
  size?: 'sm' | 'md' | 'lg';
  showReasoning?: boolean;
  hasAnomaly?: boolean; // Triggers risk ripple animation
}

/**
 * Animated circular confidence gauge with expandable AI reasoning.
 * Pulsing glow when confidence < 80% signals "needs attention".
 */
const ConfidenceDial = ({ 
  confidence, 
  reasoning, 
  size = 'md',
  showReasoning = true,
  hasAnomaly = false,
}: ConfidenceDialProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const sizeConfig = {
    sm: { width: 40, stroke: 3, fontSize: 'text-xs', gradientSize: 48 },
    md: { width: 56, stroke: 4, fontSize: 'text-sm', gradientSize: 64 },
    lg: { width: 72, stroke: 5, fontSize: 'text-base', gradientSize: 80 },
  };
  
  const { width, stroke, fontSize, gradientSize } = sizeConfig[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (confidence / 100) * circumference;
  
  const getColor = () => {
    if (confidence >= 90) return 'text-signal-green stroke-signal-green';
    if (confidence >= 70) return 'text-signal-amber stroke-signal-amber';
    return 'text-signal-red stroke-signal-red';
  };

  const getGradientColors = () => {
    if (confidence >= 90) return ['#10b981', '#059669', '#10b981'];
    if (confidence >= 70) return ['#f59e0b', '#d97706', '#f59e0b'];
    return ['#ef4444', '#dc2626', '#ef4444'];
  };
  
  const needsAttention = confidence < 80;
  const gradientColors = getGradientColors();

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => reasoning && setExpanded(!expanded)}
        className={`flex items-center gap-2 ${reasoning ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!reasoning}
      >
        {/* Circular gauge with gradient ring */}
        <div className={cn(
          'relative',
          needsAttention && 'confidence-pulse',
          hasAnomaly && 'risk-ripple'
        )}>
          {/* Animated gradient ring background */}
          <div 
            className="absolute inset-0 rounded-full confidence-gradient-ring opacity-30"
            style={{
              width: gradientSize,
              height: gradientSize,
              left: (width - gradientSize) / 2,
              top: (width - gradientSize) / 2,
              background: `conic-gradient(from 0deg, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]}, ${gradientColors[0]})`,
              filter: 'blur(4px)',
            }}
          />
          
          <svg width={width} height={width} className="relative transform -rotate-90">
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
            {/* Progress arc — animates when in viewport */}
            <motion.circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              className={getColor()}
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: circumference - progress }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          
          {/* Center percentage */}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center font-semibold',
            fontSize,
            getColor().split(' ')[0]
          )}>
            {confidence}
          </div>

          {/* Anomaly indicator */}
          {hasAnomaly && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-signal-red flex items-center justify-center"
            >
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
            </motion.div>
          )}
        </div>
        
        {/* Expand indicator */}
        {reasoning && showReasoning && (
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}
      </button>
      
      {/* Expandable reasoning */}
      {reasoning && showReasoning && (
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p className="text-xs text-muted-foreground mt-2 pl-1 border-l-2 border-muted">
            {reasoning}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ConfidenceDial;
