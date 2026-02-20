import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Send, ShoppingCart, Wrench, Receipt, HelpCircle, Package, ChevronDown, Check, X, MessageSquarePlus } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface VerificationCard {
  type: string;
  urgency: string;
  pulseType: string;
  location: string;
  category: string;
  funding: string;
  confidence: number;
  imageUrl?: string;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
  verification?: VerificationCard;
}

interface OmniDockProps {
  onSubmit?: (value: string) => void;
  placeholder?: string;
}

const OmniDock = ({ onSubmit, placeholder = "I need something..." }: OmniDockProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showQuickTaps, setShowQuickTaps] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'Hi! How can I help you today?', sender: 'bot', timestamp: new Date() },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close expanded chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isExpanded && dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

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
      // Add user message to chat
      const userMsg: ChatMessage = {
        id: Date.now(),
        text: inputValue.trim(),
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      onSubmit?.(inputValue);
      setInputValue('');
      setShowQuickTaps(true); // Reset quick-taps after submit
      
      // Show typing indicator then bot reply with verification card
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botMsg: ChatMessage = {
          id: Date.now() + 1,
          text: 'I\'ve classified your request. Please verify the details:',
          sender: 'bot',
          timestamp: new Date(),
          verification: {
            type: 'Purchase',
            urgency: 'Normal',
            pulseType: 'Action Required',
            location: 'Zonneweide',
            category: 'General Supplies',
            funding: 'Petty cash',
            confidence: 95,
          },
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 2000);
    }
  };

  const handleVoice = () => {
    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      setInputValue("New box of disposable gloves for room 12");
    }, 2500);
  };

  const handleCamera = () => {
    setIsScanning(true);
    
    // Simulate photo capture + OCR
    setTimeout(() => {
      setIsScanning(false);

      // Add image message to chat
      const imageMsg: ChatMessage = {
        id: Date.now(),
        text: '',
        sender: 'user',
        timestamp: new Date(),
        imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop',
      };
      setMessages((prev) => [...prev, imageMsg]);
      setIsExpanded(true);

      // Show typing indicator then bot reply with verification card
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botMsg: ChatMessage = {
          id: Date.now() + 1,
          text: 'I scanned your photo. Please verify the details:',
          sender: 'bot',
          timestamp: new Date(),
          verification: {
            type: 'Purchase',
            urgency: 'Normal',
            pulseType: 'Action Required',
            location: 'Zonneweide',
            category: 'General Supplies',
            funding: 'Petty cash',
            confidence: 95,
            imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop',
          },
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 800);

      setInputValue('');
    }, 1500);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none pb-safe">
      {/* Backdrop overlay when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Gradient fade for content scrolling underneath */}
      {!isExpanded && (
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent" />
      )}
      
      {/* The Omni-Dock container */}
      <div ref={dockRef} className="relative px-4 pb-4 pointer-events-auto">
        
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
                className="flex gap-3 justify-center pb-1"
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
            mx-auto max-w-[700px] 
            bg-white rounded-[24px] 
            overflow-hidden
            transition-shadow duration-200
            ${isFocused ? 'ring-2 ring-teal-500/20' : ''}
          `}
          style={{
            /* 2-Part Shadow for true physical depth (Refactoring UI) */
            boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
          }}
        >
          {/* ─── EXPANDED CHAT PANEL (grows upward) ─── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 360, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col overflow-hidden"
              >
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <span className="text-sm font-bold font-display text-slate-700">Pulse Assistant</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setMessages([{ id: Date.now(), text: 'Hi! How can I help you today?', sender: 'bot', timestamp: new Date() }]);
                        setInputValue('');
                        setShowQuickTaps(true);
                      }}
                      className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                      title="New chat"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`
                        max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed
                        ${msg.sender === 'user'
                          ? 'ml-auto bg-teal-600 text-white rounded-br-md'
                          : 'mr-auto bg-slate-100 text-slate-700 rounded-bl-md'
                        }
                      `}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded photo"
                          className="rounded-lg mb-1.5 w-full h-auto object-cover max-h-[80px]"
                        />
                      )}
                      {msg.text && <span>{msg.text}</span>}
                      {msg.verification && (
                        <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-700">
                          {/* Compact verification grid */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-[11px]">
                            <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-medium text-slate-800">{msg.verification.type}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Urgency</span><span className="font-medium bg-slate-100 text-slate-700 px-1.5 rounded">{msg.verification.urgency}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Pulse</span><span className="font-medium bg-slate-100 text-slate-700 px-1.5 rounded">{msg.verification.pulseType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="font-medium text-slate-800">{msg.verification.location}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="font-medium text-slate-800">{msg.verification.category}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Funding</span><span className="font-medium text-slate-800">{msg.verification.funding}</span></div>
                          </div>
                          <div className="flex items-center justify-between px-3 py-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400">AI confidence</span>
                            <span className="text-[11px] font-bold text-teal-600">{msg.verification.confidence}%</span>
                          </div>
                          {/* Image preview */}
                          {msg.verification.imageUrl && (
                            <div className="px-3 pb-1.5">
                              <img
                                src={msg.verification.imageUrl}
                                alt="Scanned item"
                                className="rounded-lg w-full h-14 object-cover"
                              />
                            </div>
                          )}
                          {/* Action buttons */}
                          <div className="flex items-center gap-2 px-3 pb-2.5 pt-1">
                            <button
                              onClick={() => {
                                setMessages((prev) => prev.map((m) =>
                                  m.id === msg.id ? { ...m, verification: undefined, text: 'Verified and submitted!' } : m
                                ));
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white text-[11px] font-bold py-2 rounded-lg hover:bg-slate-700 active:scale-[0.98] transition-all"
                            >
                              <Check className="h-3 w-3" />
                              Submit
                            </button>
                            <button
                              onClick={() => {
                                setMessages((prev) => prev.map((m) =>
                                  m.id === msg.id ? { ...m, verification: undefined, text: 'Cancelled.' } : m
                                ));
                              }}
                              className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 hover:text-red-500 px-2.5 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mr-auto bg-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="block w-1.5 h-1.5 rounded-full bg-slate-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                        />
                      ))}
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="p-2 flex items-center gap-2">
          {/* Input area — relative container for overlays */}
          <div className="flex-1 min-w-0 relative overflow-hidden rounded-xl">
            {/* Camera scan line overlay */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  className="absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none"
                  style={{
                    background: 'hsl(12, 76%, 50%)',
                    boxShadow: '0 0 12px 3px hsla(12, 76%, 50%, 0.35), 0 0 4px 1px hsla(12, 76%, 50%, 0.2)',
                  }}
                  initial={{ left: '0%', opacity: 0 }}
                  animate={{ left: ['0%', '100%', '0%', '100%'], opacity: [0, 1, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>

            {/* Scanning background tint */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none z-0"
                  style={{ background: 'hsla(12, 76%, 50%, 0.04)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>

            {/* Waveform (listening) OR Input */}
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="waveform"
                  className="flex items-center gap-3 px-4 py-3 h-[46px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-xs font-medium text-teal-600 whitespace-nowrap">
                    Listening…
                  </span>
                  <div className="flex items-center justify-center gap-[3px] flex-1 h-6">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[2px] bg-teal-500 rounded-full"
                        style={{
                          opacity: 1 - Math.abs(i - 11.5) / 18,
                        }}
                        initial={{ height: 4 }}
                        animate={{
                          height: [
                            4,
                            8 + Math.sin(i * 0.6) * 6 + Math.random() * 8,
                            4 + Math.cos(i * 0.4) * 4 + Math.random() * 6,
                            10 + Math.sin(i * 0.8) * 8 + Math.random() * 6,
                            4,
                          ],
                        }}
                        transition={{
                          duration: 1.0 + Math.random() * 0.4,
                          repeat: Infinity,
                          delay: i * 0.04,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    onFocus={handleInputFocus}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isScanning ? 'Scanning…' : placeholder}
                    disabled={isScanning}
                    className={`
                      w-full
                      px-4 py-3 
                      text-base font-normal
                      bg-transparent 
                      outline-none 
                      placeholder:font-normal
                      font-display
                      relative z-[1]
                      ${isScanning 
                        ? 'text-transparent placeholder:text-coral-400' 
                        : 'text-slate-800 placeholder:text-slate-400'
                      }
                    `}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Voice Button — Brand teal with pulsing ring when listening */}
          <div className="relative shrink-0">
            {/* Pulsing ring */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ border: '2px solid hsl(170, 60%, 45%)' }}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.35, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleVoice}
                    disabled={isListening || isScanning}
                    className={`
                      relative h-11 w-11 rounded-xl
                      flex items-center justify-center 
                      transition-all duration-150 
                      ${isListening 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-95'
                      }
                    `}
                    aria-label="Voice input"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Speak your request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Camera Button — Brand coral with pulsing ring when scanning */}
          <div className="relative shrink-0">
            {/* Pulsing ring */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ border: '2px solid hsl(12, 76%, 50%)' }}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.35, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCamera}
                    disabled={isScanning || isListening}
                    className={`
                      relative h-11 w-11 rounded-xl 
                      flex items-center justify-center 
                      transition-all duration-150 
                    `}
                    style={{
                      backgroundColor: isScanning ? 'hsl(12, 76%, 50%)' : 'hsl(12, 76%, 95%)',
                      color: isScanning ? 'white' : 'hsl(12, 76%, 50%)',
                    }}
                    aria-label="Camera input"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan receipt or photo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Send Button — appears when there's input */}
          <AnimatePresence>
            {inputValue.trim() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleSubmit}
                      className="
                        h-11 w-11 rounded-xl 
                        bg-hero-teal text-white
                        hover:bg-hero-teal/90 
                        active:scale-95
                        flex items-center justify-center 
                        transition-all duration-150 
                        shrink-0
                      "
                      aria-label="Send"
                    >
                      <Send className="h-5 w-5" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Submit request</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </AnimatePresence>
          </div>{/* end input row */}
        </motion.div>
      </div>
    </div>
  );
};

export default OmniDock;
