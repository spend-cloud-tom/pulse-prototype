import { signalTypeConfig } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface PulseTypeTagProps {
  type: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Color mapping for Pulse types
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const PulseTypeTag = ({ type, size = 'sm', className }: PulseTypeTagProps) => {
  const config = signalTypeConfig[type] || signalTypeConfig.general;
  const colors = typeColors[config.color] || typeColors.slate;
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold uppercase tracking-wider border rounded-full',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1',
        className
      )}
    >
      {config.pulseLabel}
    </span>
  );
};

export default PulseTypeTag;
