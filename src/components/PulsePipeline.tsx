import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, statusToPulseState, PulseState } from '@/data/types';
import { pulseStateConfig } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface PulsePipelineProps {
  pulses: Signal[];
  renderCard: (pulse: Signal, state: PulseState) => React.ReactNode;
  showStates?: PulseState[];
  emptyMessage?: string;
  className?: string;
}

// Section header for each pipeline state
const PipelineSection = ({ 
  state, 
  count, 
  children 
}: { 
  state: PulseState; 
  count: number; 
  children: React.ReactNode;
}) => {
  const config = pulseStateConfig[state];
  
  if (count === 0) return null;
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          'h-2 w-2 rounded-full',
          state === 'needs-action' && 'bg-signal-red animate-pulse',
          state === 'in-motion' && 'bg-signal-amber',
          state === 'blocked' && 'bg-slate-400',
          state === 'auto-handled' && 'bg-hero-purple',
          state === 'resolved' && 'bg-signal-green',
        )} />
        <h2 className={cn(
          'text-sm font-semibold uppercase tracking-wider',
          config?.color || 'text-muted-foreground'
        )}>
          {config?.label || state}
        </h2>
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded-full',
          config?.bgColor || 'bg-secondary',
          config?.color || 'text-muted-foreground'
        )}>
          {count}
        </span>
      </div>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

const PulsePipeline = ({ 
  pulses, 
  renderCard, 
  showStates = ['needs-action', 'in-motion', 'blocked', 'auto-handled', 'resolved'],
  emptyMessage = 'No Pulses to show',
  className 
}: PulsePipelineProps) => {
  // Group pulses by their pipeline state
  const groupedPulses = useMemo(() => {
    const groups: Record<PulseState, Signal[]> = {
      'needs-action': [],
      'in-motion': [],
      'blocked': [],
      'auto-handled': [],
      'resolved': [],
    };
    
    pulses.forEach(pulse => {
      const state = statusToPulseState[pulse.status] || 'needs-action';
      groups[state].push(pulse);
    });
    
    return groups;
  }, [pulses]);

  const totalCount = pulses.length;
  
  if (totalCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-muted-foreground">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {showStates.map(state => (
        <PipelineSection 
          key={state} 
          state={state} 
          count={groupedPulses[state].length}
        >
          {groupedPulses[state].map(pulse => (
            <motion.div
              key={pulse.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderCard(pulse, state)}
            </motion.div>
          ))}
        </PipelineSection>
      ))}
    </div>
  );
};

export default PulsePipeline;
