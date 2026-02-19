import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessCheckmarkProps {
  show: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Animated success checkmark with scale bounce and green ring pulse.
 * Used for approve/reconcile micro-success feedback.
 */
const SuccessCheckmark = ({ show, onComplete, size = 'md' }: SuccessCheckmarkProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Success circle with checkmark */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-signal-green flex items-center justify-center relative`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          opacity: 1,
        }}
        transition={{ 
          duration: 0.4,
          times: [0, 0.6, 1],
          ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
        }}
        onAnimationComplete={onComplete}
      >
        {/* Checkmark icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <Check className={`${iconSizes[size]} text-white stroke-[3]`} />
        </motion.div>

        {/* Expanding ring pulse */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-signal-green"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SuccessCheckmark;
