import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ProgressZoneProps {
  children: React.ReactNode;
  count: number;
  label?: string;
}

const ProgressZone = ({ children, count, label = 'In motion' }: ProgressZoneProps) => {
  if (count === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          {label}
          <span className="ml-2 font-bold text-foreground">{count}</span>
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

export default ProgressZone;
