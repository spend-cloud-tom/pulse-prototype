import { useState, useCallback, useMemo } from 'react';
import { useSignalEvents, SignalEvent } from './useSignalEvents';

export interface TimelineState {
  isPlaying: boolean;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  playbackSpeed: number;
  visibleEvents: SignalEvent[];
}

interface UseTimelinePlaybackOptions {
  hoursBack?: number;
  autoPlay?: boolean;
}

export function useTimelinePlayback({ hoursBack = 24, autoPlay = false }: UseTimelinePlaybackOptions = {}) {
  const { events, getEventsInRange } = useSignalEvents(100);
  
  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => new Date(now.getTime() - hoursBack * 60 * 60 * 1000), [now, hoursBack]);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(now);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const [scrubPosition, setScrubPosition] = useState(1); // 0-1 position on timeline

  // Calculate visible events based on current time
  const visibleEvents = useMemo(() => {
    return getEventsInRange(defaultStart, currentTime);
  }, [getEventsInRange, defaultStart, currentTime]);

  // Get event counts by type for the timeline
  const eventCounts = useMemo(() => {
    const counts = {
      created: 0,
      auto_resolved: 0,
      approved: 0,
      escalated: 0,
      rejected: 0,
      status_change: 0,
    };
    
    visibleEvents.forEach(e => {
      if (e.event_type in counts) {
        counts[e.event_type as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [visibleEvents]);

  // Scrub to a specific position (0-1)
  const scrubTo = useCallback((position: number) => {
    const clampedPosition = Math.max(0, Math.min(1, position));
    setScrubPosition(clampedPosition);
    
    const timeRange = now.getTime() - defaultStart.getTime();
    const newTime = new Date(defaultStart.getTime() + timeRange * clampedPosition);
    setCurrentTime(newTime);
  }, [now, defaultStart]);

  // Play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Reset to start
  const reset = useCallback(() => {
    setIsPlaying(false);
    setScrubPosition(0);
    setCurrentTime(defaultStart);
  }, [defaultStart]);

  // Jump to end (now)
  const jumpToNow = useCallback(() => {
    setIsPlaying(false);
    setScrubPosition(1);
    setCurrentTime(now);
  }, [now]);

  // Change playback speed
  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  }, []);

  // Get timeline markers (hourly)
  const timelineMarkers = useMemo(() => {
    const markers: { position: number; label: string; time: Date }[] = [];
    const totalHours = hoursBack;
    
    for (let i = 0; i <= totalHours; i += Math.max(1, Math.floor(totalHours / 6))) {
      const time = new Date(defaultStart.getTime() + i * 60 * 60 * 1000);
      const position = i / totalHours;
      const label = time.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      markers.push({ position, label, time });
    }
    
    return markers;
  }, [defaultStart, hoursBack]);

  // Get event positions on timeline for visualization
  const eventPositions = useMemo(() => {
    const timeRange = now.getTime() - defaultStart.getTime();
    
    return events.map(event => {
      const eventTime = new Date(event.created_at).getTime();
      const position = (eventTime - defaultStart.getTime()) / timeRange;
      return {
        ...event,
        position: Math.max(0, Math.min(1, position)),
      };
    }).filter(e => e.position >= 0 && e.position <= 1);
  }, [events, now, defaultStart]);

  return {
    // State
    isPlaying,
    currentTime,
    startTime: defaultStart,
    endTime: now,
    playbackSpeed,
    scrubPosition,
    visibleEvents,
    eventCounts,
    timelineMarkers,
    eventPositions,
    
    // Actions
    scrubTo,
    togglePlay,
    reset,
    jumpToNow,
    cycleSpeed,
  };
}
