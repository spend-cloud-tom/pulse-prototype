import {
  ShoppingCart,
  Wrench,
  AlertTriangle,
  ArrowLeftRight,
  ClipboardCheck,
  CalendarDays,
  Package,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  purchase: ShoppingCart,
  maintenance: Wrench,
  incident: AlertTriangle,
  'shift-handover': ArrowLeftRight,
  compliance: ClipboardCheck,
  event: CalendarDays,
  resource: Package,
  general: MapPin,
};

interface PulseTypeIconProps {
  type: string;
  className?: string;
}

const PulseTypeIcon = ({ type, className }: PulseTypeIconProps) => {
  const Icon = iconMap[type] || iconMap.general;
  return <Icon className={cn('h-3.5 w-3.5 shrink-0', className)} />;
};

export default PulseTypeIcon;
