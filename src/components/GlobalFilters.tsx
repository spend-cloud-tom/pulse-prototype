import { useState } from 'react';
import { MapPin, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface FilterState {
  location: string;
  dateRange: 'today' | 'week' | 'month' | 'custom';
  myActionOnly: boolean;
}

interface GlobalFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const locations = ['All locations', 'Zonneweide', 'De Berk', 'Het Anker'];
const dateOptions: { value: FilterState['dateRange']; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

const GlobalFilters = ({ filters, onFiltersChange }: GlobalFiltersProps) => {
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Location selector */}
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-full px-3 border-border">
            <MapPin className="h-3 w-3" />
            {filters.location}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => { onFiltersChange({ ...filters, location: loc }); setLocationOpen(false); }}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                filters.location === loc ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'
              )}
            >
              {loc}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Date filter */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-full px-3 border-border">
            <Calendar className="h-3 w-3" />
            {dateOptions.find(d => d.value === filters.dateRange)?.label}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {dateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onFiltersChange({ ...filters, dateRange: opt.value }); setDateOpen(false); }}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                filters.dateRange === opt.value ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Needs my action toggle */}
      <div className="flex items-center gap-1.5 ml-1">
        <Switch
          checked={filters.myActionOnly}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, myActionOnly: checked })}
          className="h-4 w-7 data-[state=checked]:bg-hero-teal"
        />
        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
          <Filter className="h-3 w-3 inline mr-0.5" />
          My actions only
        </span>
      </div>
    </div>
  );
};

export default GlobalFilters;
