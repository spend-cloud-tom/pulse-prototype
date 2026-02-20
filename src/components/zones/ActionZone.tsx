import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot } from 'lucide-react';

interface ActionZoneProps {
  children: React.ReactNode;
  count: number;
  label?: string;
}

const ActionZone = ({ children, count, label = 'Requires your decision' }: ActionZoneProps) => {
  if (count === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-state-decision-bg">
          <CircleDot className="h-3.5 w-3.5 text-state-decision" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight">
          {label}
          <span className="ml-2 text-state-decision font-bold">{count}</span>
        </h2>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default ActionZone;
