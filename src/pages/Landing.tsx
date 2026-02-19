import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Eye, EyeOff, ArrowRight, ShieldCheck, Waypoints, Radar,
  Check, Sparkles, Volume2, Bell, Bot, Package, FileText
} from 'lucide-react';

/* ─── Floating Task Card ─── */
const FloatingCard = ({
  title, status, delay, x, y, rotate,
}: {
  title: string; status: 'resolved' | 'pending' | 'auto'; delay: number;
  x: string; y: string; rotate: number;
}) => {
  const statusConfig = {
    resolved: { label: 'Auto-resolved', className: 'bg-signal-green-bg text-signal-green', icon: Check },
    pending: { label: 'Pending', className: 'bg-signal-amber-bg text-signal-amber', icon: FileText },
    auto: { label: 'AI classified', className: 'bg-hero-purple-soft text-hero-purple', icon: Sparkles },
  };
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <motion.div
      className="absolute rounded-xl bg-white px-4 py-3 w-56"
      style={{ 
        left: x, 
        top: y,
        boxShadow: '0 4px 6px hsla(0, 0%, 0%, 0.05), 0 10px 24px hsla(0, 0%, 0%, 0.1)',
      }}
      initial={{ opacity: 0, y: 30, rotate: rotate - 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay: 0.6 + delay, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <p className="text-xs font-medium text-foreground truncate">{title}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Icon className="h-3 w-3" />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
      </div>
    </motion.div>
  );
};

/* ─── Live Counter ─── */
const LiveCounter = () => {
  const [count, setCount] = useState(19);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + (Math.random() > 0.6 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-2 text-xs font-medium shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4 }}
    >
      <span className="h-2 w-2 rounded-full bg-signal-green animate-pulse-dot" />
      <span className="text-muted-foreground">
        <span className="font-bold text-foreground">{count}</span> tasks auto-cleared today
      </span>
    </motion.div>
  );
};

/* ─── AI Copilot Mini Avatar ─── */
const CopilotAvatar = () => (
  <motion.div
    className="flex items-center gap-2"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.0, duration: 0.5 }}
  >
    <motion.div
      className="h-10 w-10 rounded-full bg-gradient-to-br from-hero-teal to-hero-purple flex items-center justify-center shadow-lg"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <Bot className="h-5 w-5 text-white" />
    </motion.div>
  </motion.div>
);

/* ─── Benefit Pillar Card ─── */
const PillarCard = ({
  icon, title, description, hoverDetail, delay,
}: {
  icon: React.ReactNode; title: string; description: string; hoverDetail: string; delay: number;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative rounded-2xl bg-white p-6 md:p-8 transition-all cursor-default"
      style={{ boxShadow: '0 2px 4px hsla(0, 0%, 0%, 0.02), 0 4px 12px hsla(0, 0%, 0%, 0.04)' }}
    >
      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-hero-teal-soft to-hero-purple-soft flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-hero-teal">
                <Sparkles className="h-3 w-3" />
                AI prediction
              </div>
              <p className="text-xs text-muted-foreground mt-1">{hoverDetail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Demo Interaction Section ─── */
const DemoSection = ({ onDemoAccess }: { onDemoAccess: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Pending review', icon: FileText, color: 'text-signal-amber' },
    { label: 'AI classified', icon: Sparkles, color: 'text-hero-purple' },
    { label: 'Auto-resolved', icon: Check, color: 'text-signal-green' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % 3), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      className="py-20 md:py-28"
    >
      <div className="text-center mb-12">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
          See AI in Action
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
          Click, speak, or watch: the co-pilot shows you exactly what's happening and why.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Interactive flow demo */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live flow</p>
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i <= step;
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isActive ? `border-foreground/20 bg-card ${s.color}` : 'border-border bg-secondary text-muted-foreground/40'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="hidden" /> // spacing placeholder
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-hero-teal to-hero-purple"
              animate={{ width: `${((step + 1) / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Notification drawer preview */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI-prioritized alerts</p>
          </div>
          {[
            { title: 'Pharmacy receipt needs GL code', priority: 'High', color: 'bg-signal-red-bg text-signal-red' },
            { title: 'Ward C spend anomaly detected', priority: 'Med', color: 'bg-signal-amber-bg text-signal-amber' },
            { title: 'Cleaning supplies auto-approved', priority: 'Low', color: 'bg-secondary text-muted-foreground' },
          ].map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5"
            >
              <div className="flex-1">
                <p className="text-xs font-medium truncate">{n.title}</p>
              </div>
              <Badge variant="outline" className={`text-[9px] border-0 ${n.color} shrink-0`}>{n.priority}</Badge>
            </motion.div>
          ))}
          <button
            className="flex items-center gap-1.5 text-[11px] font-medium text-hero-teal hover:underline"
            onClick={onDemoAccess}
          >
            <Volume2 className="h-3 w-3" /> "What happened?" — try it live
          </button>
        </div>
      </div>
    </motion.section>
  );
};

/* ─────────────────────────────────────────────── */
/* ─── Main Landing Component ─── */
/* ─────────────────────────────────────────────── */

const Landing = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'location'>('email');
  const [selectedLocation, setSelectedLocation] = useState('');

  const locations = ['Zonneweide', 'De Berk', 'Het Anker', 'All locations'];

  const handleEmailNext = () => { if (email) setLoginStep('password'); };
  const handleLogin = () => { if (password) setLoginStep('location'); };
  const handleLocationSelect = (loc: string) => { setSelectedLocation(loc); navigate('/dashboard'); };
  const handleDemoAccess = () => { navigate('/dashboard'); };

  /* ─── Login Flow ─── */
  if (showLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
          {/* Friendly lowercase 'pulse.' logo */}
          <div className="flex items-center">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              pulse<span className="text-hero-coral">.</span>
            </span>
          </div>

          {loginStep === 'email' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
              </div>
              <div className="space-y-3">
                <Input type="email" placeholder="you@organization.nl" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailNext()} autoFocus className="h-12" />
                <Button onClick={handleEmailNext} className="w-full h-12 gap-2" disabled={!email}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
              </div>
              <Button variant="outline" className="w-full h-12 text-sm" onClick={handleDemoAccess}>Continue with SSO</Button>
              <button onClick={() => setShowLogin(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto">← Back to overview</button>
            </motion.div>
          )}

          {loginStep === 'password' && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">Enter your password</h1>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus className="h-12 pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleLogin} className="w-full h-12 gap-2" disabled={!password}>Sign in <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <button onClick={() => setLoginStep('email')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Use a different email</button>
            </motion.div>
          )}

          {loginStep === 'location' && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">Select your location</h1>
                <p className="text-sm text-muted-foreground">Choose where you're working today</p>
              </div>
              <div className="space-y-2">
                {locations.map(loc => (
                  <button key={loc} onClick={() => handleLocationSelect(loc)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium transition-all hover:bg-secondary hover:shadow-sm">
                    {loc} <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── Landing Page ─── */
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav — clean, minimal */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
          {/* Friendly lowercase 'pulse.' logo */}
          <div className="flex items-center">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              pulse<span className="text-hero-coral">.</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDemoAccess} 
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              See how it works
            </button>
            <Button 
              size="sm" 
              onClick={() => setShowLogin(true)} 
              className="rounded-full px-6 h-10 text-sm font-semibold shadow-elevation-medium"
            >
              Sign in
            </Button>
          </div>
        </div>
      </header>

      <main>

        {/* ─── HERO ─── */}
        <section className="relative py-24 md:py-32 lg:py-40">
          {/* Subtle gradient blobs — decorative */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-hero-teal-soft/40 blur-[100px]" />
            <div className="absolute -top-16 right-0 h-[500px] w-[500px] rounded-full bg-hero-purple-soft/30 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — copy with proper hierarchy */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <CopilotAvatar />
                  <motion.span
                    className="text-sm font-medium text-slate-500 bg-slate-100 rounded-full px-4 py-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    AI co-pilot for care operations
                  </motion.span>
                </div>

                {/* Heading: extrabold, dark slate, not cartoonishly large */}
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                  Give care workers<br />their time back
                </h1>
                
                {/* Sub-headline: de-emphasized with softer color */}
                <p className="text-xl text-slate-500 leading-relaxed max-w-lg font-normal">
                  The one-door policy for healthcare. From urgent purchases to facility requests, AI orchestrates the flow so you can focus on what matters.
                </p>

                {/* CTAs with strict hierarchy */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {/* Primary CTA: solid, high-contrast pill */}
                  <Button
                    size="lg"
                    onClick={handleDemoAccess}
                    className="rounded-full px-8 h-14 text-base font-semibold gap-2"
                    style={{ boxShadow: '0 4px 6px hsla(0, 0%, 0%, 0.05), 0 10px 24px hsla(0, 0%, 0%, 0.1)' }}
                  >
                    See how it works <ArrowRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Secondary CTA: subtle text link */}
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-base font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
                  >
                    Read the philosophy
                    <Sparkles className="h-4 w-4 text-hero-purple/60" />
                  </button>
                </div>

                <LiveCounter />
              </motion.div>

              {/* Right — floating card illustration with two-part shadow */}
              <div className="relative h-80 md:h-[420px] hidden lg:block">
                <FloatingCard title="Plumber repair — kitchen sink" status="pending" delay={0} x="10%" y="5%" rotate={-2} />
                <FloatingCard title="Cleaning wipes (Ward B)" status="resolved" delay={0.2} x="40%" y="38%" rotate={1.5} />
                <FloatingCard title="Pharmacy receipt €67.40" status="auto" delay={0.4} x="8%" y="68%" rotate={-1} />

                {/* Connecting lines SVG */}
                <motion.svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  transition={{ delay: 1.5 }}
                >
                  <path d="M100 60 Q200 180 160 300" stroke="hsl(var(--hero-teal))" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
                  <path d="M200 100 Q250 200 180 340" stroke="hsl(var(--hero-purple))" strokeWidth="1" fill="none" strokeDasharray="4 6" />
                </motion.svg>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VALUE PILLARS ─── */}
        {/* Alternating background for section separation (no borders) */}
        <section className="py-24 md:py-32 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-sm font-semibold text-hero-teal uppercase tracking-widest mb-3">Why Pulse</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Built for how care actually works</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <PillarCard
                icon={<ShieldCheck className="h-5 w-5 text-hero-teal" />}
                title="Stress-Free Decisions"
                description="AI filters routine requests, auto-classifies purchases, and flags only the unusual. You see exactly what needs attention — nothing more."
                hoverDetail="AI predicts this week's Ward B supplies will auto-clear, saving ~2 hours of manual review."
                delay={0}
              />
              <PillarCard
                icon={<Waypoints className="h-5 w-5 text-hero-purple" />}
                title="Everyone Knows What's Next"
                description="Every request shows who owns it, where it is in the process, and the next actionable step. No ambiguity, no chasing."
                hoverDetail="Next suggested action: Jolanda approves Ward C exception, then Sarah generates PO."
                delay={0.1}
              />
              <PillarCard
                icon={<Radar className="h-5 w-5 text-slate-700" />}
                title="Intelligent Transparency"
                description="Track approvals, budgets, deliveries, and maintenance in real-time across all locations. Predict issues before they arise."
                hoverDetail="Budget utilization trending 12% above normal for Q1 — early warning active."
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* ─── AI DEMO SECTION ─── */}
        <div className="mx-auto max-w-6xl px-6">
          <DemoSection onDemoAccess={handleDemoAccess} />
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-slate-900">pulse<span className="text-hero-coral">.</span></span>
            <span className="text-slate-400">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <span className="text-center">
            Operational clarity for care organizations — powered by{' '}
            <motion.span
              className="inline-block font-semibold text-slate-700"
              animate={{ textShadow: ['0 0 0px transparent', '0 0 8px hsl(var(--hero-teal) / 0.3)', '0 0 0px transparent'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              AI you can trust
            </motion.span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
