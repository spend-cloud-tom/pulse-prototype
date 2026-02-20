import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, ChevronDown, ChevronUp, Zap, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AutoResolvedItem {
  id: string;
  title: string;
  amount?: number;
  resolvedAt: string;
  ruleApplied?: string;
  confidence?: number;
  timeSavedSeconds?: number;
}

interface AutoResolveStackProps {
  items?: AutoResolvedItem[];
  onExpand?: () => void;
  autoDemo?: boolean; // Enable timed demo animation
}

// Mock items for demo with extended metadata
const mockAutoResolved: AutoResolvedItem[] = [
  { id: '1', title: 'Coffee supplies — Zonneweide', amount: 12.40, resolvedAt: '9:15 AM', ruleApplied: 'Under €50 threshold', confidence: 98, timeSavedSeconds: 120 },
  { id: '2', title: 'Bus tickets — De Berk', amount: 15.00, resolvedAt: '9:32 AM', ruleApplied: 'Recurring expense pattern', confidence: 95, timeSavedSeconds: 90 },
  { id: '3', title: 'Hand soap refill — Zonneweide', amount: 6.80, resolvedAt: '9:45 AM', ruleApplied: 'Under €50 threshold', confidence: 99, timeSavedSeconds: 60 },
  { id: '4', title: 'Printer paper — De Berk', amount: 18.90, resolvedAt: '10:02 AM', ruleApplied: 'Contracted supplier match', confidence: 97, timeSavedSeconds: 150 },
  { id: '5', title: 'Cleaning supplies — Het Anker', amount: 24.50, resolvedAt: '10:15 AM', ruleApplied: 'Under €50 threshold', confidence: 96, timeSavedSeconds: 120 },
  { id: '6', title: 'Office supplies — Zonneweide', amount: 8.20, resolvedAt: '10:28 AM', ruleApplied: 'Under €50 threshold', confidence: 99, timeSavedSeconds: 60 },
  { id: '7', title: 'First aid restock — De Berk', amount: 32.00, resolvedAt: '10:41 AM', ruleApplied: 'Safety supplies auto-approve', confidence: 94, timeSavedSeconds: 180 },
  { id: '8', title: 'Kitchen supplies — Het Anker', amount: 14.60, resolvedAt: '10:55 AM', ruleApplied: 'Under €50 threshold', confidence: 98, timeSavedSeconds: 90 },
  { id: '9', title: 'Stationery — Zonneweide', amount: 9.30, resolvedAt: '11:08 AM', ruleApplied: 'Under €50 threshold', confidence: 99, timeSavedSeconds: 60 },
  { id: '10', title: 'Hygiene products — De Berk', amount: 21.40, resolvedAt: '11:22 AM', ruleApplied: 'Under €50 threshold', confidence: 97, timeSavedSeconds: 120 },
  { id: '11', title: 'Batteries — Het Anker', amount: 7.50, resolvedAt: '11:35 AM', ruleApplied: 'Under €50 threshold', confidence: 99, timeSavedSeconds: 45 },
  { id: '12', title: 'Light bulbs — Zonneweide', amount: 11.20, resolvedAt: '11:48 AM', ruleApplied: 'Maintenance supplies auto-approve', confidence: 96, timeSavedSeconds: 90 },
];

const MAX_AUTO_ITEMS = 5;

const AutoResolveStack = ({ 
  items = mockAutoResolved, 
  onExpand,
  autoDemo = true 
}: AutoResolveStackProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleItems, setVisibleItems] = useState<AutoResolvedItem[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  // Auto-demo: animate items collapsing one by one
  useEffect(() => {
    if (!autoDemo) {
      setVisibleItems(items.slice(0, MAX_AUTO_ITEMS));
      return;
    }

    // Start with empty, then add items one by one
    setVisibleItems([]);
    let currentIndex = 0;

    const addItem = () => {
      if (currentIndex < items.length && currentIndex < MAX_AUTO_ITEMS) {
        setIsAnimating(true);
        setShowSuccessGlow(true);
        
        setVisibleItems(prev => [...prev, items[currentIndex]]);
        currentIndex++;

        // Reset glow after animation
        setTimeout(() => {
          setShowSuccessGlow(false);
          setIsAnimating(false);
        }, 500);
      }
    };

    // Add first item immediately
    addItem();

    // Then add rest with delay
    const interval = setInterval(() => {
      if (currentIndex >= items.length || currentIndex >= MAX_AUTO_ITEMS) {
        clearInterval(interval);
        return;
      }
      addItem();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoDemo, items]);

  const totalAmount = visibleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const displayItems = isExpanded ? visibleItems : visibleItems.slice(0, 3);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        showSuccessGlow 
          ? "border-state-resolved/50 shadow-[0_0_20px_rgba(156,163,175,0.2)]" 
          : "border-border/50",
        "bg-gradient-to-br from-state-resolved-bg/30 to-card"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-10 w-10 rounded-full bg-state-resolved/10 flex items-center justify-center"
              animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Zap className="h-5 w-5 text-state-resolved" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Auto-handled</p>
                <motion.span
                  key={visibleItems.length}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-state-resolved text-white text-xs font-bold"
                >
                  {visibleItems.length}
                </motion.span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI processed automatically · €{totalAmount.toFixed(2)} total
              </p>
            </div>
          </div>
          
          {visibleItems.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>Collapse <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show all <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="p-2">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0, scale: 0.8 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.8 }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 30,
                delay: index * 0.05 
              }}
              className="overflow-hidden"
            >
              <div className="group/item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle2 className="h-4 w-4 text-state-resolved shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm truncate block">{item.title}</span>
                    {/* Rule applied + confidence on hover/expand */}
                    {(isExpanded || item.ruleApplied) && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {item.ruleApplied && (
                          <span className="text-hero-purple">{item.ruleApplied}</span>
                        )}
                        {item.confidence && (
                          <span>· {item.confidence}% conf</span>
                        )}
                        {item.timeSavedSeconds && (
                          <span className="flex items-center gap-0.5">
                            · <Clock className="h-2.5 w-2.5" /> {Math.round(item.timeSavedSeconds / 60)}m saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.amount && (
                    <span className="text-sm font-medium tabular-nums">
                      €{item.amount.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {item.resolvedAt}
                  </span>
                  {/* Undo button - visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Remove item from visible list
                      setVisibleItems(prev => prev.filter(i => i.id !== item.id));
                      toast({
                        title: "Reverted to pending",
                        description: `"${item.title}" moved back to your queue for review.`,
                      });
                    }}
                    className="opacity-0 group-hover/item:opacity-100 h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-state-blocked hover:bg-state-blocked/10 transition-all"
                    title="Undo auto-approval"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Collapsed indicator */}
        {!isExpanded && visibleItems.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-2 text-xs text-muted-foreground"
          >
            <span>+{visibleItems.length - 3} more auto-handled</span>
          </motion.div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-hero-purple" />
            <span>AI confidence avg: <span className="font-medium text-foreground">96%</span></span>
          </div>
          <span>Processing time: <span className="font-medium text-foreground">0.3s avg</span></span>
        </div>
      </div>
    </motion.div>
  );
};

export default AutoResolveStack;
