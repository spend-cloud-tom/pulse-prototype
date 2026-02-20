import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationRisk {
  id: string;
  name: string;
  riskScore: number; // 0-100
  anomalyCount: number;
  topAnomaly: string;
  trend: 'up' | 'down' | 'stable';
  spendVariance: number; // percentage
  hourlyDensity?: number[]; // 24 values for hourly exception density
}

interface AnomalyHeatmapProps {
  onLocationClick?: (locationId: string) => void;
}

// Mock risk data for demo with hourly density
const mockLocationRisks: LocationRisk[] = [
  {
    id: 'zonneweide',
    name: 'Zonneweide',
    riskScore: 72,
    anomalyCount: 5,
    topAnomaly: 'Spend 18% above baseline',
    trend: 'up',
    spendVariance: 18,
    hourlyDensity: [0, 0, 0, 0, 0, 0, 1, 2, 4, 6, 3, 2, 1, 2, 5, 7, 4, 2, 1, 0, 0, 0, 0, 0],
  },
  {
    id: 'de-berk',
    name: 'De Berk',
    riskScore: 34,
    anomalyCount: 2,
    topAnomaly: 'Unusual supplier pattern',
    trend: 'stable',
    spendVariance: -3,
    hourlyDensity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'het-anker',
    name: 'Het Anker',
    riskScore: 85,
    anomalyCount: 8,
    topAnomaly: 'Budget at 78% mid-month',
    trend: 'up',
    spendVariance: 24,
    hourlyDensity: [0, 0, 0, 0, 0, 0, 2, 3, 5, 8, 6, 4, 3, 4, 7, 9, 5, 3, 1, 0, 0, 0, 0, 0],
  },
];

// Get color based on risk score
const getRiskColor = (score: number) => {
  if (score >= 70) return { 
    bg: 'bg-card', 
    border: 'border-state-risk/30', 
    text: 'text-state-risk',
    accent: 'bg-state-risk',
    glow: 'shadow-state-risk/10'
  };
  if (score >= 40) return { 
    bg: 'bg-card', 
    border: 'border-state-blocked/30', 
    text: 'text-state-blocked',
    accent: 'bg-state-blocked',
    glow: 'shadow-state-blocked/10'
  };
  return { 
    bg: 'bg-card', 
    border: 'border-signal-green/30', 
    text: 'text-signal-green',
    accent: 'bg-signal-green',
    glow: 'shadow-signal-green/10'
  };
};

const getRiskLabel = (score: number) => {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
};

// Density strip component - shows exception rate over time as smooth wave
const DensityStrip = ({ 
  data, 
  riskScore 
}: { 
  data: number[]; 
  riskScore: number;
}) => {
  const maxValue = Math.max(...data, 1);
  const colors = getRiskColor(riskScore);
  const slicedData = data.slice(6, 18);
  
  // Create SVG path for smooth wave
  const width = 100;
  const height = 20;
  const points = slicedData.map((value, i) => {
    const x = (i / (slicedData.length - 1)) * width;
    const y = height - (value / maxValue) * height;
    return { x, y };
  });
  
  // Create smooth curve path
  const pathD = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${path} Q ${cpX} ${prev.y} ${point.x} ${point.y}`;
  }, '');
  
  const areaPath = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] text-muted-foreground/70">
        <span>6AM</span>
        <span className="flex items-center gap-1 opacity-60">
          <Sparkles className="h-2 w-2" />
          Exception density (24h)
        </span>
        <span>6PM</span>
      </div>
      <div className="relative h-5 w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${riskScore}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop 
                offset="0%" 
                className={cn(
                  riskScore >= 70 ? 'stop-signal-red/40' : 
                  riskScore >= 40 ? 'stop-signal-amber/40' : 
                  'stop-signal-green/40'
                )}
                style={{ stopColor: riskScore >= 70 ? 'rgb(239 68 68 / 0.4)' : riskScore >= 40 ? 'rgb(245 158 11 / 0.4)' : 'rgb(34 197 94 / 0.4)' }}
              />
              <stop 
                offset="100%" 
                style={{ stopColor: 'transparent' }}
              />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill={`url(#gradient-${riskScore})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={pathD}
            fill="none"
            className={cn(
              riskScore >= 70 ? 'stroke-signal-red/60' : 
              riskScore >= 40 ? 'stroke-signal-amber/60' : 
              'stroke-signal-green/60'
            )}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
      </div>
    </div>
  );
};

const LocationTile = ({ 
  location, 
  onClick 
}: { 
  location: LocationRisk; 
  onClick?: () => void;
}) => {
  const colors = getRiskColor(location.riskScore);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative p-4 rounded-xl border text-left transition-all w-full",
        "bg-card hover:bg-accent/5",
        "border-border/60 hover:border-border",
        "shadow-sm hover:shadow-md",
        colors.glow && isHovered && `shadow-lg ${colors.glow}`
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-1 rounded-full",
        colors.accent
      )} />

      {/* Header */}
      <div className="flex items-start justify-between mb-2 pl-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{location.name}</span>
        </div>
        <div className="text-right">
          <span className={cn("text-2xl font-bold tabular-nums", colors.text)}>
            {location.riskScore}
          </span>
        </div>
      </div>

      {/* Risk label */}
      <div className="pl-2 mb-3">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium",
          "bg-muted/50",
          colors.text
        )}>
          <AlertTriangle className="h-2.5 w-2.5" />
          {getRiskLabel(location.riskScore)}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 pl-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Anomalies</span>
          <span className="font-medium tabular-nums">{location.anomalyCount} detected</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Spend variance</span>
          <span className={cn(
            "font-medium flex items-center gap-1 tabular-nums",
            location.spendVariance > 0 ? "text-state-blocked" : "text-signal-green"
          )}>
            {location.trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {location.spendVariance > 0 ? '+' : ''}{location.spendVariance}%
          </span>
        </div>
      </div>

      {/* Top anomaly */}
      <div className="mt-3 pt-3 border-t border-border/30 pl-2">
        <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
          {location.topAnomaly}
        </p>
      </div>

      {/* Density strip - temporal exception visualization */}
      {location.hourlyDensity && (
        <div className="mt-3 pt-3 border-t border-border/30 pl-2">
          <DensityStrip data={location.hourlyDensity} riskScore={location.riskScore} />
        </div>
      )}

      {/* Hover indicator */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
        className="absolute right-3 bottom-4"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </motion.button>
  );
};

const AnomalyHeatmap = ({ onLocationClick }: AnomalyHeatmapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Calculate overall risk
  const avgRisk = Math.round(
    mockLocationRisks.reduce((sum, loc) => sum + loc.riskScore, 0) / mockLocationRisks.length
  );
  const totalAnomalies = mockLocationRisks.reduce((sum, loc) => sum + loc.anomalyCount, 0);

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(locationId);
    onLocationClick?.(locationId);
  };

  return (
    <div className="space-y-4">
      {/* Header with overall stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Risk Heatmap</h3>
          <p className="text-xs text-muted-foreground">
            {totalAnomalies} anomalies across {mockLocationRisks.length} locations
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            avgRisk >= 70 ? "text-state-risk" : avgRisk >= 40 ? "text-state-blocked" : "text-signal-green"
          )}>
            {avgRisk}
          </p>
          <p className="text-[10px] text-muted-foreground">Avg risk score</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="grid gap-3">
        {mockLocationRisks
          .sort((a, b) => b.riskScore - a.riskScore)
          .map((location) => (
            <LocationTile
              key={location.id}
              location={location}
              onClick={() => handleLocationClick(location.id)}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-signal-green" />
          <span>Low (0-39)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-state-blocked" />
          <span>Medium (40-69)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-state-risk" />
          <span>High (70+)</span>
        </div>
      </div>
    </div>
  );
};

export default AnomalyHeatmap;
