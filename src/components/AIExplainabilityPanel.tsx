import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Sparkles, TrendingUp, AlertTriangle, History, 
  CheckCircle2, XCircle, BarChart3, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIExplainabilityPanelProps {
  confidence: number;
  reasoning?: string;
  matchingSignals?: { id: string; title: string; similarity: number }[];
  riskFactors?: { factor: string; impact: 'high' | 'medium' | 'low'; description: string }[];
  historicalPattern?: {
    matchCount: number;
    avgProcessingTime: string;
    autoApprovalRate: number;
  };
  recommendation?: 'approve' | 'review' | 'reject';
}

const ConfidenceGauge = ({ value }: { value: number }) => {
  const getColor = () => {
    if (value >= 80) return 'text-signal-green';
    if (value >= 50) return 'text-state-blocked';
    return 'text-state-risk';
  };

  const getLabel = () => {
    if (value >= 80) return 'High Confidence';
    if (value >= 50) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16">
        {/* Background circle */}
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={getColor()}
            strokeDasharray={`${value}, 100`}
            initial={{ strokeDasharray: '0, 100' }}
            animate={{ strokeDasharray: `${value}, 100` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-bold", getColor())}>{value}%</span>
        </div>
      </div>
      <div>
        <p className={cn("font-semibold", getColor())}>{getLabel()}</p>
        <p className="text-xs text-muted-foreground">AI decision confidence</p>
      </div>
    </div>
  );
};

const RiskFactorBadge = ({ impact }: { impact: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { bg: 'bg-state-risk-bg', text: 'text-state-risk', label: 'High' },
    medium: { bg: 'bg-state-blocked-bg', text: 'text-state-blocked', label: 'Medium' },
    low: { bg: 'bg-signal-green-bg', text: 'text-signal-green', label: 'Low' },
  };
  const c = config[impact];
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", c.bg, c.text)}>
      {c.label}
    </span>
  );
};

const AIExplainabilityPanel = ({
  confidence = 87,
  reasoning = "This request matches historical patterns for routine medical supplies at this location. Amount is within normal range and vendor is pre-approved.",
  matchingSignals = [
    { id: '1', title: 'Medical gloves order - Ward B', similarity: 94 },
    { id: '2', title: 'Bandages restock - Zonneweide', similarity: 89 },
    { id: '3', title: 'Hygiene supplies - Het Anker', similarity: 82 },
  ],
  riskFactors = [
    { factor: 'Amount threshold', impact: 'low' as const, description: 'Within €50 auto-approval limit' },
    { factor: 'Vendor status', impact: 'low' as const, description: 'Pre-approved contracted supplier' },
    { factor: 'Budget impact', impact: 'medium' as const, description: 'Will use 12% of remaining monthly budget' },
    { factor: 'Frequency', impact: 'low' as const, description: 'Normal ordering pattern for this item' },
  ],
  historicalPattern = {
    matchCount: 47,
    avgProcessingTime: '2.3 hours',
    autoApprovalRate: 94,
  },
  recommendation = 'approve' as const,
}: AIExplainabilityPanelProps) => {
  const recommendationConfig = {
    approve: { icon: CheckCircle2, label: 'Recommend Approve', color: 'text-signal-green', bg: 'bg-signal-green-bg' },
    review: { icon: AlertTriangle, label: 'Needs Review', color: 'text-state-blocked', bg: 'bg-state-blocked-bg' },
    reject: { icon: XCircle, label: 'Recommend Reject', color: 'text-state-risk', bg: 'bg-state-risk-bg' },
  };
  const rec = recommendationConfig[recommendation];

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-hero-purple-soft/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-hero-purple/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-hero-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Decision Explainability</p>
            <p className="text-[10px] text-muted-foreground">Transparent reasoning for this recommendation</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Confidence + Recommendation */}
        <div className="flex items-start justify-between gap-4">
          <ConfidenceGauge value={confidence} />
          <div className={cn("px-3 py-2 rounded-xl text-center", rec.bg)}>
            <rec.icon className={cn("h-5 w-5 mx-auto mb-1", rec.color)} />
            <p className={cn("text-xs font-semibold", rec.color)}>{rec.label}</p>
          </div>
        </div>

        {/* Main reasoning */}
        <div className="rounded-xl bg-secondary/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-hero-purple" />
            <p className="text-xs font-semibold text-hero-purple uppercase tracking-wider">AI Reasoning</p>
          </div>
          <p className="text-sm leading-relaxed">{reasoning}</p>
        </div>

        {/* Expandable sections */}
        <Accordion type="multiple" className="space-y-2">
          {/* Risk Factors */}
          <AccordionItem value="risk-factors" className="border rounded-xl px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Risk Factors</span>
                <span className="text-xs text-muted-foreground">({riskFactors.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                {riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 py-1.5">
                    <div>
                      <p className="text-sm font-medium">{rf.factor}</p>
                      <p className="text-xs text-muted-foreground">{rf.description}</p>
                    </div>
                    <RiskFactorBadge impact={rf.impact} />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Matching Signals */}
          <AccordionItem value="matching-signals" className="border rounded-xl px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Similar Requests</span>
                <span className="text-xs text-muted-foreground">({matchingSignals.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                {matchingSignals.map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between py-1.5">
                    <p className="text-sm truncate flex-1">{signal.title}</p>
                    <span className="text-xs font-medium text-hero-teal ml-2">
                      {signal.similarity}% match
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Historical Pattern */}
          <AccordionItem value="historical" className="border rounded-xl px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Historical Pattern</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{historicalPattern.matchCount}</p>
                  <p className="text-[10px] text-muted-foreground">Similar requests</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{historicalPattern.avgProcessingTime}</p>
                  <p className="text-[10px] text-muted-foreground">Avg processing</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-signal-green">{historicalPattern.autoApprovalRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Auto-approved</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default AIExplainabilityPanel;
