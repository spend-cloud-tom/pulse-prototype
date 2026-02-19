import { useRole } from '@/context/RoleContext';
import { users } from '@/data/mockData';
import { MapPin, Calendar } from 'lucide-react';

const locationMap: Record<string, string> = {
  anouk: 'Zonneweide',
  rohan: 'All locations',
  sarah: 'All locations',
  jolanda: 'Zonneweide',
};

const SystemContext = () => {
  const { activeRole } = useRole();
  const location = locationMap[activeRole];

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {location}
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Today
      </span>
      <span className="text-border">·</span>
      <span className="font-medium text-muted-foreground/70">Pulse</span>
    </div>
  );
};

export default SystemContext;
