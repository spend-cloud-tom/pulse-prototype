import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTimelinePlayback } from '@/hooks/useTimelinePlayback';
import { 
  Play, Pause, RotateCcw, FastForward, Clock, 
  Zap, CheckCircle2, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
  hoursBack?: number;
  onTimeChange?: (time: Date) => void;
  className?: string;
}

const eventTypeConfig = {
  created: { color: 'bg-hero-purple', icon: ArrowRight },
  auto_resolved: { color: 'bg-signal-green', icon: Zap },
  approved: { color: 'bg-signal-green', icon: CheckCircle2 },
  escalated: { color: 'bg-signal-amber', icon: AlertTriangle },
  rejected: { color: 'bg-signal-red', icon: AlertTriangle },
  status_change: { color: 'bg-hero-teal', icon: ArrowRight },
};

const TimelineSlider = ({ hoursBack = 24, onTimeChange, className }: TimelineSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    isPlaying,
    currentTime,
    playbackSpeed,
    scrubPosition,
    visibleEvents,
    eventCounts,
    timelineMarkers,
    eventPositions,
    scrubTo,
    togglePlay,
    reset,
    jumpToNow,
    cycleSpeed,
  } = useTimelinePlayback({ hoursBack });

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    scrubTo(position);
    onTimeChange?.(currentTime);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    scrubTo(position);
    onTimeChange?.(currentTime);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-hero-purple" />
            <h3 className="text-sm font-semibold">Signal Timeline</h3>
            <span className="text-xs text-muted-foreground">Last {hoursBack}h</span>
          </div>
          
          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={togglePlay}
              className={cn(
                'h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
                isPlaying 
                  ? 'bg-hero-teal text-white' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={cycleSpeed}
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Playback speed"
            >
              <FastForward className="h-3 w-3" />
              {playbackSpeed}x
            </button>
            <button
              onClick={jumpToNow}
              className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Jump to now"
            >
              Now
            </button>
          </div>
        </div>
      </div>

      {/* Current time display */}
      <div className="px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{formatDate(currentTime)}</span>
        <span className="font-mono font-semibold text-lg">{formatTime(currentTime)}</span>
        <span className="text-xs text-muted-foreground">{visibleEvents.length} events</span>
      </div>

      {/* Timeline track */}
      <div className="px-4 pb-3">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleDrag}
          className="relative h-12 bg-secondary/50 rounded-lg cursor-pointer overflow-hidden"
        >
          {/* Event markers */}
          {eventPositions.map((event, i) => {
            const config = eventTypeConfig[event.event_type as keyof typeof eventTypeConfig] || eventTypeConfig.status_change;
            return (
              <motion.div
                key={event.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: event.position <= scrubPosition ? 1 : 0.3 }}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-3 w-1 rounded-full',
                  config.color
                )}
                style={{ left: `${event.position * 100}%` }}
                title={`${event.event_type}: ${event.metadata?.title || 'Signal'}`}
              />
            );
          })}

          {/* Progress fill */}
          <div 
            className="absolute inset-y-0 left-0 bg-hero-teal/20 rounded-l-lg transition-all"
            style={{ width: `${scrubPosition * 100}%` }}
          />

          {/* Scrubber handle */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-hero-teal"
            style={{ left: `${scrubPosition * 100}%` }}
            animate={{ scale: isDragging ? 1.5 : 1 }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-hero-teal border-2 border-white shadow-sm" />
          </motion.div>

          {/* Time markers */}
          {timelineMarkers.map((marker, i) => (
            <div
              key={i}
              className="absolute bottom-0 text-[9px] text-muted-foreground -translate-x-1/2"
              style={{ left: `${marker.position * 100}%` }}
            >
              <div className="h-1.5 w-px bg-border mx-auto mb-0.5" />
              {marker.label}
            </div>
          ))}
        </div>
      </div>

      {/* Event summary */}
      <div className="px-4 py-2 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-signal-green" />
              <span className="text-muted-foreground">{eventCounts.auto_resolved} auto-resolved</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-hero-purple" />
              <span className="text-muted-foreground">{eventCounts.created} created</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-signal-amber" />
              <span className="text-muted-foreground">{eventCounts.escalated} escalated</span>
            </span>
          </div>
          <span className="text-muted-foreground italic">
            Drag to rewind
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
