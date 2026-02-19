import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSignalEvents, SignalEvent } from '@/hooks/useSignalEvents';
import { useSystemTension, TensionLevel } from '@/hooks/useSystemTension';

export type HealthLevel = 'stable' | 'elevated' | 'critical';
export type { TensionLevel }; // Re-export from useSystemTension

interface SystemHealthState {
  healthLevel: HealthLevel;
  tensionLevel: TensionLevel;
  pendingDecisions: number;
  criticalCount: number;
  urgentCount: number;
  recentEvents: SignalEvent[];
  activitySummary: {
    total: number;
    autoResolved: number;
    approved: number;
    escalated: number;
    timeSavedSeconds: number;
  };
}

interface SystemHealthContextType extends SystemHealthState {
  refreshHealth: () => void;
}

const SystemHealthContext = createContext<SystemHealthContextType | undefined>(undefined);

interface SystemHealthProviderProps {
  children: React.ReactNode;
  signals?: Array<{
    status: string;
    urgency: string;
    [key: string]: any;
  }>;
}

export const SystemHealthProvider: React.FC<SystemHealthProviderProps> = ({ children, signals = [] }) => {
  const { events, getActivitySummary } = useSignalEvents(20);
  
  // Use the tension hook which also applies CSS classes to DOM
  const tension = useSystemTension({ signals, applyToDOM: true });
  
  // Derive health level from tension
  const healthLevel: HealthLevel = useMemo(() => {
    if (tension.criticalCount > 0) return 'critical';
    if (tension.urgentCount > 2 || tension.pendingCount > 10) return 'elevated';
    return 'stable';
  }, [tension]);

  const activitySummary = useMemo(() => getActivitySummary(), [getActivitySummary, events]);

  const refreshHealth = () => {
    // Tension hook handles recalculation automatically
  };

  const value: SystemHealthContextType = {
    healthLevel,
    tensionLevel: tension.level,
    pendingDecisions: tension.pendingCount,
    criticalCount: tension.criticalCount,
    urgentCount: tension.urgentCount,
    recentEvents: events.slice(0, 10),
    activitySummary,
    refreshHealth,
  };

  return (
    <SystemHealthContext.Provider value={value}>
      {children}
    </SystemHealthContext.Provider>
  );
};

export const useSystemHealth = () => {
  const context = useContext(SystemHealthContext);
  if (!context) {
    throw new Error('useSystemHealth must be used within SystemHealthProvider');
  }
  return context;
};
