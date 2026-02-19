import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ConfidenceDialProps {
  confidence: number;
  reasoning?: string;
  size?: 'sm' | 'md' | 'lg';
  showReasoning?: boolean;
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
}: ConfidenceDialProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const sizeConfig = {
    sm: { width: 40, stroke: 3, fontSize: 'text-xs' },
    md: { width: 56, stroke: 4, fontSize: 'text-sm' },
    lg: { width: 72, stroke: 5, fontSize: 'text-base' },
  };
  
  const { width, stroke, fontSize } = sizeConfig[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (confidence / 100) * circumference;
  
  const getColor = () => {
    if (confidence >= 90) return 'text-signal-green stroke-signal-green';
    if (confidence >= 70) return 'text-signal-amber stroke-signal-amber';
    return 'text-signal-red stroke-signal-red';
  };
  
  const needsAttention = confidence < 80;

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => reasoning && setExpanded(!expanded)}
        className={`flex items-center gap-2 ${reasoning ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!reasoning}
      >
        {/* Circular gauge */}
        <div className={`relative ${needsAttention ? 'confidence-pulse' : ''}`}>
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
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          {/* Center percentage */}
          <div className={`absolute inset-0 flex items-center justify-center ${fontSize} font-semibold ${getColor().split(' ')[0]}`}>
            {confidence}
          </div>
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
