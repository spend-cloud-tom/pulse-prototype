import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { 
  Search, User, MapPin, AlertTriangle, Sparkles, 
  FileText, Settings, ArrowRight, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  onSelectSignal?: (signalId: string) => void;
}

const CommandPalette = ({ onSelectSignal }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const { activeRole, setActiveRole, signals } = useRole();
  const navigate = useNavigate();

  // Toggle with ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  // Role display names
  const roleNames: Record<string, { name: string; role: string }> = {
    anouk: { name: 'Anouk van Dijk', role: 'Care Worker' },
    rohan: { name: 'Rohan Patel', role: 'Finance Admin' },
    sarah: { name: 'Sarah de Vries', role: 'Procurement' },
    jolanda: { name: 'Jolanda Bakker', role: 'Team Lead' },
  };

  // Location options
  const locations = ['Zonneweide', 'De Berk', 'Het Anker'];

  // Quick filters
  const quickFilters = [
    { label: 'Show only urgent', icon: AlertTriangle, action: () => console.log('Filter: urgent') },
    { label: 'Show flagged items', icon: Sparkles, action: () => console.log('Filter: flagged') },
    { label: 'High-value purchases (>€100)', icon: Zap, action: () => console.log('Filter: high-value') },
  ];

  // Recent signals for quick access
  const recentSignals = signals.slice(0, 5);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Command dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[540px] px-4">
        <Command 
          className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border/50">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input 
              placeholder="Search pulses, switch views, run commands..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {quickFilters.map((filter) => (
                <Command.Item
                  key={filter.label}
                  onSelect={() => runCommand(filter.action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-secondary transition-colors"
                >
                  <filter.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{filter.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Switch Persona */}
            <Command.Group heading="Switch Persona" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {Object.entries(roleNames).map(([key, { name, role }]) => (
                <Command.Item
                  key={key}
                  onSelect={() => runCommand(() => setActiveRole(key as any))}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-secondary transition-colors",
                    activeRole === key && "bg-hero-teal-soft/50"
                  )}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground ml-2">· {role}</span>
                  </div>
                  {activeRole === key && (
                    <span className="text-[10px] text-hero-teal font-medium">Active</span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Locations */}
            <Command.Group heading="Jump to Location" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {locations.map((loc) => (
                <Command.Item
                  key={loc}
                  onSelect={() => runCommand(() => console.log(`Navigate to ${loc}`))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-secondary transition-colors"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{loc}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Recent Pulses */}
            {recentSignals.length > 0 && (
              <Command.Group heading="Recent Pulses" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {recentSignals.map((signal) => (
                  <Command.Item
                    key={signal.id}
                    onSelect={() => runCommand(() => onSelectSignal?.(signal.id))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-secondary transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{signal.title}</span>
                      {signal.amount && (
                        <span className="text-muted-foreground ml-2">
                          €{signal.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-secondary transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Back to Landing</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted">↵</kbd> select
              </span>
            </div>
            <span className="text-hero-purple font-medium">pulse. command</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
