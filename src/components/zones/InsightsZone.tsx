import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown } from 'lucide-react';

interface InsightsZoneProps {
  children: React.ReactNode;
  count?: number;
  label?: string;
}

const InsightsZone = ({ children, count, label = 'Insights & monitoring' }: InsightsZoneProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-2"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          {label}
          {count !== undefined && <span className="ml-2 font-bold">{count}</span>}
        </h2>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default InsightsZone;
