import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationRisk {
  id: string;
  name: string;
  riskScore: number; // 0-100
  anomalyCount: number;
  topAnomaly: string;
  trend: 'up' | 'down' | 'stable';
  spendVariance: number; // percentage
}

interface AnomalyHeatmapProps {
  onLocationClick?: (locationId: string) => void;
}

// Mock risk data for demo
const mockLocationRisks: LocationRisk[] = [
  {
    id: 'zonneweide',
    name: 'Zonneweide',
    riskScore: 72,
    anomalyCount: 5,
    topAnomaly: 'Spend 18% above baseline',
    trend: 'up',
    spendVariance: 18,
  },
  {
    id: 'de-berk',
    name: 'De Berk',
    riskScore: 34,
    anomalyCount: 2,
    topAnomaly: 'Unusual supplier pattern',
    trend: 'stable',
    spendVariance: -3,
  },
  {
    id: 'het-anker',
    name: 'Het Anker',
    riskScore: 85,
    anomalyCount: 8,
    topAnomaly: 'Budget at 78% mid-month',
    trend: 'up',
    spendVariance: 24,
  },
];

// Get color based on risk score
const getRiskColor = (score: number) => {
  if (score >= 70) return { bg: 'bg-signal-red/20', border: 'border-signal-red/40', text: 'text-signal-red' };
  if (score >= 40) return { bg: 'bg-signal-amber/20', border: 'border-signal-amber/40', text: 'text-signal-amber' };
  return { bg: 'bg-signal-green/20', border: 'border-signal-green/40', text: 'text-signal-green' };
};

const getRiskLabel = (score: number) => {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-4 rounded-xl border-2 text-left transition-all w-full",
        colors.bg,
        colors.border,
        "hover:shadow-lg"
      )}
    >
      {/* Risk indicator pulse for high risk */}
      {location.riskScore >= 70 && (
        <motion.div
          className="absolute top-3 right-3 h-3 w-3 rounded-full bg-signal-red"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-4 w-4", colors.text)} />
          <span className="font-semibold text-sm">{location.name}</span>
        </div>
        <span className={cn("text-2xl font-bold tabular-nums", colors.text)}>
          {location.riskScore}
        </span>
      </div>

      {/* Risk label */}
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-3",
        colors.bg,
        colors.text
      )}>
        <AlertTriangle className="h-3 w-3" />
        {getRiskLabel(location.riskScore)}
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Anomalies</span>
          <span className="font-medium">{location.anomalyCount} detected</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Spend variance</span>
          <span className={cn(
            "font-medium flex items-center gap-1",
            location.spendVariance > 0 ? "text-signal-amber" : "text-signal-green"
          )}>
            {location.trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {location.spendVariance > 0 ? '+' : ''}{location.spendVariance}%
          </span>
        </div>
      </div>

      {/* Top anomaly */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {location.topAnomaly}
        </p>
      </div>

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
            avgRisk >= 70 ? "text-signal-red" : avgRisk >= 40 ? "text-signal-amber" : "text-signal-green"
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
          <div className="h-2 w-2 rounded-full bg-signal-amber" />
          <span>Medium (40-69)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-signal-red" />
          <span>High (70+)</span>
        </div>
      </div>
    </div>
  );
};

export default AnomalyHeatmap;
