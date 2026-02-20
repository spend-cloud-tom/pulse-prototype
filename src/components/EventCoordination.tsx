import { motion } from 'framer-motion';
import { upcomingEvents } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, Calendar, MapPin } from 'lucide-react';

const EventCoordination = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming events</h2>

      <div className="space-y-3">
        {upcomingEvents.map(event => {
          const doneTasks = event.tasks.filter(t => t.done).length;
          const totalTasks = event.tasks.length;
          const pct = Math.round((doneTasks / totalTasks) * 100);

          return (
            <div key={event.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {event.locations.join(', ')}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[11px] border-0 ${
                    event.status === 'confirmed'
                      ? 'bg-state-resolved-bg text-state-resolved'
                      : 'bg-state-blocked-bg text-state-blocked'
                  }`}
                >
                  {event.status === 'confirmed' ? 'Confirmed' : 'Planning'}
                </Badge>
              </div>

              {/* Budget */}
              <div className="text-xs text-muted-foreground">
                Budget: <span className="font-semibold text-foreground">€{event.budget.toLocaleString()}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{doneTasks}/{totalTasks} tasks complete</span>
                  <span className="font-medium text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-state-resolved' : 'bg-state-blocked'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Task checklist */}
              <div className="space-y-1">
                {event.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {task.done ? (
                      <Check className="h-3 w-3 text-state-resolved shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={task.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EventCoordination;
