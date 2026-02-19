import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Send, ShoppingCart, Wrench, Receipt, HelpCircle, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ═══════════════════════════════════════════════════════════════════════════
   OMNI-DOCK — The "One Door" Persistent Input with Quick-Tap Gallery
   
   UX Principles (About Face + Refactoring UI):
   - Kill the Modal: Primary interaction lives directly on main screen
   - Avoid Blank Slates: Predictive templates reduce cognitive load
   - Information in the World: Show choices, don't force recall
   - Task Coherence: Anticipate frequent/recurring actions
   - 2-Part Shadow: True physical depth, not flat borders
   - Brand Injection: Coral/teal icons, not generic black
   ═══════════════════════════════════════════════════════════════════════════ */

/* Quick-Tap template options (Anti-Blank Slate) */
const quickTapTemplates = [
  { id: 'supplies', icon: ShoppingCart, label: 'Order supplies', template: 'I need to order: ' },
  { id: 'broken', icon: Wrench, label: 'Report broken item', template: 'Broken item to report: ' },
  { id: 'receipt', icon: Receipt, label: 'Log incidental', template: 'Incidental purchase: €' },
  { id: 'question', icon: HelpCircle, label: 'Can I buy this?', template: 'Can I purchase: ' },
];

interface OmniDockProps {
  onSubmit?: (value: string) => void;
  placeholder?: string;
}

const OmniDock = ({ onSubmit, placeholder = "I need something..." }: OmniDockProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showQuickTaps, setShowQuickTaps] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide quick-taps when user starts typing manually
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0 && showQuickTaps) {
      setShowQuickTaps(false);
    } else if (value.length === 0) {
      setShowQuickTaps(true);
    }
  };

  // Handle quick-tap selection: prefill and focus (don't execute)
  const handleQuickTap = (template: string) => {
    setInputValue(template);
    setShowQuickTaps(false);
    // Focus input so keyboard slides up, user can tweak or add photo
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      toast({
        title: "📝 Pulse created",
        description: `"${inputValue.slice(0, 40)}${inputValue.length > 40 ? '...' : ''}" — AI is classifying it now.`,
      });
      onSubmit?.(inputValue);
      setInputValue('');
      setShowQuickTaps(true); // Reset quick-taps after submit
      
      // Simulate AI classification
      setTimeout(() => {
        toast({
          title: "🤖 AI classified your request",
          description: "Category: Supplies · Routed to: Procurement · Budget: Wlz",
        });
      }, 2000);
    }
  };

  const handleVoice = () => {
    setIsListening(true);
    toast({
      title: "🎤 Listening...",
      description: "Speak now: \"I need...\"",
    });
    
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      setInputValue("New box of disposable gloves for room 12");
      toast({
        title: "🎤 Got it!",
        description: "Review your request and tap send.",
      });
    }, 2500);
  };

  const handleCamera = () => {
    toast({
      title: "📷 Opening camera...",
      description: "Take a photo of the item or receipt.",
    });
    
    // Simulate photo capture + OCR
    setTimeout(() => {
      toast({
        title: "📷 Photo captured!",
        description: "AI detected: \"Cleaning supplies receipt — €34.50\"",
      });
      setInputValue("Cleaning supplies (from photo) — €34.50");
    }, 1500);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe">
      {/* Gradient fade for content scrolling underneath */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent" />
      
      {/* The Omni-Dock container */}
      <div className="relative px-4 pb-4 pointer-events-auto">
        
        {/* ─── QUICK-TAP SWIMLANE (Anti-Blank Slate) ─── */}
        {/* Horizontally scrollable, last pill cut off to hint at swiping */}
        <AnimatePresence>
          {showQuickTaps && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2 }}
              className="mb-2 -mx-4 px-4"
            >
              <div 
                className="flex gap-3 overflow-x-auto pb-1 pr-8"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                }}
              >
                {quickTapTemplates.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleQuickTap(item.template)}
                      className="
                        flex items-center gap-2 
                        px-4 py-2.5
                        rounded-full 
                        bg-slate-100
                        text-slate-700 text-sm font-medium
                        whitespace-nowrap
                        hover:bg-slate-200
                        active:scale-95
                        transition-all duration-150
                        shrink-0
                      "
                    >
                      <Icon className="h-4 w-4 text-teal-600" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MAIN INPUT DOCK ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className={`
            mx-auto max-w-[600px] 
            bg-white rounded-[24px] 
            p-2 
            flex items-center gap-2
            transition-shadow duration-200
            ${isFocused ? 'ring-2 ring-teal-500/20' : ''}
          `}
          style={{
            /* 2-Part Shadow for true physical depth (Refactoring UI) */
            boxShadow: '0 10px 24px hsla(212, 20%, 15%, 0.1), 0 4px 6px hsla(212, 20%, 15%, 0.05)',
          }}
        >
          {/* Text Input — borderless, friendly placeholder */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="
              flex-1 min-w-0
              px-4 py-3 
              text-base font-normal
              bg-transparent 
              outline-none 
              text-slate-800 
              placeholder:text-slate-400 placeholder:font-normal
              font-display
            "
          />
          
          {/* Voice Button — Brand teal with soft hover state */}
          <button
            onClick={handleVoice}
            disabled={isListening}
            className={`
              h-11 w-11 rounded-xl 
              flex items-center justify-center 
              transition-all duration-150 
              shrink-0
              ${isListening 
                ? 'bg-teal-500 text-white animate-pulse' 
                : 'bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-95'
              }
            `}
            aria-label="Voice input"
          >
            <Mic className="h-5 w-5" />
          </button>
          
          {/* Camera Button — Brand coral with soft hover state */}
          <button
            onClick={handleCamera}
            className="
              h-11 w-11 rounded-xl 
              bg-coral-50 text-coral-600
              hover:bg-coral-100 
              active:scale-95
              flex items-center justify-center 
              transition-all duration-150 
              shrink-0
            "
            style={{
              backgroundColor: 'hsl(12, 76%, 95%)',
              color: 'hsl(12, 76%, 50%)',
            }}
            aria-label="Camera input"
          >
            <Camera className="h-5 w-5" />
          </button>
          
          {/* Send Button — appears when there's input */}
          {inputValue.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleSubmit}
              className="
                h-11 w-11 rounded-xl 
                bg-slate-900 text-white
                hover:bg-slate-800 
                active:scale-95
                flex items-center justify-center 
                transition-all duration-150 
                shrink-0
              "
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OmniDock;
