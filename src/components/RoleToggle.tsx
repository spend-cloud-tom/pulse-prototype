import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { users } from '@/data/mockData';
import { Role } from '@/data/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

// Role transition indicator - shows the "handoff" between personas
const RoleTransitionOverlay = ({ 
  fromRole, 
  toRole, 
  onComplete 
}: { 
  fromRole: Role; 
  toRole: Role; 
  onComplete: () => void;
}) => {
  const fromUser = users.find(u => u.id === fromRole);
  const toUser = users.find(u => u.id === toRole);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-6 px-8 py-6 rounded-2xl bg-card shadow-elevation-high border border-border"
      >
        {/* From persona */}
        <div className="flex flex-col items-center">
          <Avatar className="h-14 w-14 ring-2 ring-muted ring-offset-2 ring-offset-card opacity-60">
            <AvatarImage src={fromUser?.avatar} alt={fromUser?.name} />
            <AvatarFallback>{fromUser?.name[0]}</AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground mt-2">{fromUser?.name}</p>
        </div>

        {/* Transition arrow with pulse animation */}
        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 0.6, repeat: 1 }}
        >
          <ArrowRight className="h-6 w-6 text-hero-teal" />
        </motion.div>

        {/* To persona */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          >
            <Avatar className="h-14 w-14 ring-2 ring-hero-teal ring-offset-2 ring-offset-card">
              <AvatarImage src={toUser?.avatar} alt={toUser?.name} />
              <AvatarFallback>{toUser?.name[0]}</AvatarFallback>
            </Avatar>
          </motion.div>
          <p className="text-xs font-medium text-foreground mt-2">{toUser?.name}</p>
        </div>
      </motion.div>

      {/* Subtle message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-1/3 text-sm text-muted-foreground"
      >
        Same signals, different perspective
      </motion.p>
    </motion.div>
  );
};

const RoleToggle = ({ fixed = false }: { fixed?: boolean }) => {
  const { activeRole, setActiveRole } = useRole();
  const [open, setOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionRoles, setTransitionRoles] = useState<{ from: Role; to: Role } | null>(null);
  const activeUser = users.find(u => u.id === activeRole)!;

  const handleSwitch = (role: Role) => {
    if (role === activeRole) {
      setOpen(false);
      return;
    }

    // Start transition animation
    setTransitionRoles({ from: activeRole, to: role });
    setTransitioning(true);
    setOpen(false);

    // Complete the switch after a brief delay for the animation
    setTimeout(() => {
      setActiveRole(role);
      // Scroll to top on persona switch for clean demo experience
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);

    // End transition overlay
    setTimeout(() => {
      setTransitioning(false);
      setTransitionRoles(null);
    }, 800);
  };

  // Fixed floating version for demo purposes
  if (fixed) {
    return (
      <>
        {/* Cross-persona transition overlay */}
        <AnimatePresence>
          {transitioning && transitionRoles && (
            <RoleTransitionOverlay
              fromRole={transitionRoles.from}
              toRole={transitionRoles.to}
              onComplete={() => {}}
            />
          )}
        </AnimatePresence>

        <div className="fixed top-4 right-4 z-[100]">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-2 shadow-elevation-high transition-all hover:shadow-xl"
          >
            <div className="flex -space-x-2">
            {users.slice(0, 4).map((user, i) => (
              <Avatar 
                key={user.id} 
                className={`h-7 w-7 border-2 border-card ${user.id === activeRole ? 'ring-2 ring-hero-teal ring-offset-1 ring-offset-card' : ''}`}
                style={{ zIndex: 4 - i }}
              >
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="text-left pl-1">
            <p className="text-xs font-semibold text-foreground leading-tight">{activeUser.name}</p>
            <p className="text-[10px] text-muted-foreground">Demo mode</p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full z-[100] mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-xl"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-hero-teal">
                  🎭 Switch persona
                </p>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitch(user.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                      user.id === activeRole
                        ? 'bg-hero-teal/10 border border-hero-teal/20'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <Avatar className={`h-10 w-10 ring-2 ring-offset-2 ring-offset-card ${
                      user.id === activeRole ? 'ring-hero-teal' : 'ring-transparent'
                    }`}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground/70 italic">
                        Focus: {user.focus}
                      </p>
                    </div>
                    {user.id === activeRole && (
                      <div className="h-2 w-2 rounded-full bg-hero-teal animate-pulse-dot" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </>
    );
  }

  // Original inline version
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm transition-all hover:shadow-md"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
          <AvatarFallback>{activeUser.name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="text-sm font-medium leading-tight">{activeUser.name}</p>
          <p className="text-xs text-muted-foreground">{activeUser.role}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-2 shadow-xl"
            >
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Switch perspective
              </p>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSwitch(user.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    user.id === activeRole
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <Avatar className={`h-10 w-10 ring-2 ring-offset-2 ring-offset-card ${
                    user.id === activeRole ? 'ring-foreground' : 'ring-transparent'
                  }`}>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground/70 italic">
                      Focus: {user.focus}
                    </p>
                  </div>
                  {user.id === activeRole && (
                    <div className="h-2 w-2 rounded-full bg-signal-green animate-pulse-dot" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleToggle;
