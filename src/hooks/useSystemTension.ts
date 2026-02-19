import { useMemo, useEffect } from 'react';

export type TensionLevel = 0 | 1 | 2 | 3;

interface TensionConfig {
  level: TensionLevel;
  label: string;
  description: string;
  gradientOpacity: number;
  pulseSpeed: 'slow' | 'medium' | 'fast';
}

const tensionConfigs: Record<TensionLevel, TensionConfig> = {
  0: {
    level: 0,
    label: 'Calm',
    description: 'All systems operating normally',
    gradientOpacity: 0,
    pulseSpeed: 'slow',
  },
  1: {
    level: 1,
    label: 'Active',
    description: 'Some items need attention',
    gradientOpacity: 0.03,
    pulseSpeed: 'slow',
  },
  2: {
    level: 2,
    label: 'Elevated',
    description: 'Multiple urgent items pending',
    gradientOpacity: 0.06,
    pulseSpeed: 'medium',
  },
  3: {
    level: 3,
    label: 'High',
    description: 'Critical items require immediate attention',
    gradientOpacity: 0.1,
    pulseSpeed: 'fast',
  },
};

interface UseSystemTensionOptions {
  signals?: Array<{
    status: string;
    urgency: string;
    [key: string]: any;
  }>;
  applyToDOM?: boolean;
}

export function useSystemTension({ signals = [], applyToDOM = true }: UseSystemTensionOptions = {}) {
  const tension = useMemo(() => {
    const pendingSignals = signals.filter(s => s.status === 'pending' || s.status === 'needs-clarity');
    const criticalCount = pendingSignals.filter(s => s.urgency === 'critical').length;
    const urgentCount = pendingSignals.filter(s => s.urgency === 'urgent').length;
    const pendingCount = pendingSignals.length;

    let level: TensionLevel = 0;

    if (criticalCount > 0) {
      level = 3;
    } else if (urgentCount > 1 || pendingCount > 10) {
      level = 2;
    } else if (urgentCount > 0 || pendingCount > 5) {
      level = 1;
    }

    return {
      ...tensionConfigs[level],
      criticalCount,
      urgentCount,
      pendingCount,
    };
  }, [signals]);

  // Apply tension level to DOM as CSS custom properties
  useEffect(() => {
    if (!applyToDOM) return;

    const root = document.documentElement;
    
    // Set CSS custom properties for environmental UX
    root.style.setProperty('--tension-level', String(tension.level));
    root.style.setProperty('--tension-opacity', String(tension.gradientOpacity));
    
    // Add/remove tension class for CSS-based effects
    root.classList.remove('tension-0', 'tension-1', 'tension-2', 'tension-3');
    root.classList.add(`tension-${tension.level}`);

    return () => {
      root.style.removeProperty('--tension-level');
      root.style.removeProperty('--tension-opacity');
      root.classList.remove(`tension-${tension.level}`);
    };
  }, [tension, applyToDOM]);

  return tension;
}

export { tensionConfigs };
