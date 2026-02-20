import { Signal } from '@/data/types';
import { ClassifiedSignal, getWorkflowStage, riskConfig, classifySignal } from '@/lib/decisionTypes';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signalTypeConfig } from '@/data/mockData';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import { cn } from '@/lib/utils';
import { Check, MessageSquare, X, Clock, User, MapPin, Calendar, FileText, AlertTriangle } from 'lucide-react';
import AIExplainabilityPanel from '@/components/AIExplainabilityPanel';

interface PulseDetailDrawerProps {
  signal: Signal | ClassifiedSignal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: 'approve' | 'reject' | 'resolve' | 'query' | 'acknowledge') => void;
}

const formatDate = (ts: string) => {
  try {
    return new Date(ts).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return ts; }
};

// Status config — uses action-state colors
const statusConfig: Record<string, { label: string; style: string }> = {
  pending: { label: 'Needs Decision', style: 'bg-state-decision-bg text-state-decision' },
  'needs-clarity': { label: 'Needs Info', style: 'bg-state-blocked-bg text-state-blocked' },
  approved: { label: 'Approved', style: 'bg-state-resolved-bg text-state-resolved' },
  'in-motion': { label: 'In progress', style: 'bg-state-blocked-bg text-state-blocked' },
  'awaiting-supplier': { label: 'Awaiting others', style: 'bg-state-blocked-bg text-state-blocked' },
  'auto-approved': { label: 'Auto-handled', style: 'bg-state-resolved-bg text-state-resolved' },
  delivered: { label: 'Completed', style: 'bg-state-resolved-bg text-state-resolved' },
  closed: { label: 'Completed', style: 'bg-state-resolved-bg text-state-resolved' },
  rejected: { label: 'Rejected', style: 'bg-state-risk-bg text-state-risk' },
};

// Workflow labels per type
const workflowLabels: Record<string, string[]> = {
  purchase: ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Invoiced', 'Closed'],
  maintenance: ['Reported', 'Assessed', 'Scheduled', 'In repair', 'Completed'],
  incident: ['Reported', 'Reviewed', 'Resolved', 'Closed'],
  'shift-handover': ['Submitted', 'Acknowledged'],
  compliance: ['Flagged', 'Under review', 'Resolved'],
  event: ['Planned', 'Confirmed', 'In progress', 'Completed'],
  resource: ['Requested', 'Approved', 'Allocated', 'Closed'],
  general: ['Submitted', 'In review', 'Resolved', 'Closed'],
};

const PulseDetailDrawer = ({ signal, open, onOpenChange, onAction }: PulseDetailDrawerProps) => {
  if (!signal) return null;

  const typeInfo = signalTypeConfig[signal.signal_type] || signalTypeConfig.general;
  const workflow = getWorkflowStage(signal.status);
  const classified = 'decisionType' in signal ? signal as ClassifiedSignal : classifySignal(signal);
  const risk = riskConfig[classified.riskLevel];
  const status = statusConfig[signal.status] || { label: signal.status, style: 'bg-secondary text-muted-foreground' };
  const labels = workflowLabels[signal.signal_type] || workflowLabels.general;
  const total = labels.length;
  const stage = Math.min(Math.round((workflow.stage / workflow.total) * total), total);
  const needsAction = signal.status === 'pending' || signal.status === 'needs-clarity';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          {/* Status + urgency at top — immediately visible */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs py-0.5 px-2 border-0 font-medium', status.style)}>
              {status.label}
            </Badge>
            {signal.urgency !== 'normal' && (
              <Badge className={cn(
                'text-xs py-0.5 px-2 border-0 font-medium',
                signal.urgency === 'critical' ? 'bg-state-risk-bg text-state-risk' : 'bg-state-blocked-bg text-state-blocked'
              )}>
                {signal.urgency === 'critical' ? 'Critical' : 'High'}
              </Badge>
            )}
            {classified.riskLevel !== 'low' && (
              <Badge className={cn('text-xs py-0.5 px-2 border-0 font-medium', risk.style)}>
                {risk.label}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide pt-1">
            <PulseTypeIcon type={signal.signal_type} className="h-3 w-3" />
            {typeInfo.label}
            <span>· #{signal.signal_number}</span>
          </div>
          <SheetTitle className="font-display text-lg leading-snug">{signal.title}</SheetTitle>

          {/* Action clarity */}
          {needsAction && (
            <p className="text-xs font-medium text-state-decision">This requires your action.</p>
          )}
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {/* Workflow progress — labeled stages */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</p>
            <div className="flex items-center gap-0.5">
              {labels.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all',
                    i < stage ? 'bg-foreground' : 'bg-secondary'
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{labels[Math.max(0, stage - 1)]}</span>
              {stage < total && (
                <span className="text-muted-foreground/60">Next: {labels[stage]}</span>
              )}
            </div>
          </div>

          {/* Key details — owner, location, deadline */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</p>
            <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-sm">
              <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Submitted by" value={signal.submitter_name} />
              <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={signal.location} />
              <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Submitted" value={formatDate(signal.created_at)} />
              {(signal.amount || 0) > 0 && (
                <DetailRow icon={<FileText className="h-3.5 w-3.5" />} label="Amount" value={`€${(signal.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`} bold />
              )}
              {signal.funding && <DetailRow label="Funding" value={signal.funding} />}
              {signal.category && <DetailRow label="Category" value={signal.category} />}
              {signal.expected_date && (
                <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Deadline" value={signal.expected_date} />
              )}
            </div>
          </div>

          {/* Description */}
          {signal.description && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="text-sm text-muted-foreground">{signal.description}</p>
            </div>
          )}

          {/* AI Explainability Panel — Enterprise-grade transparency */}
          {(signal.ai_reasoning || signal.confidence) && (
            <AIExplainabilityPanel
              confidence={signal.confidence || 75}
              reasoning={signal.ai_reasoning || "This request has been analyzed by the AI engine for risk assessment and routing optimization."}
              recommendation={classified.riskLevel === 'high' ? 'review' : classified.riskLevel === 'medium' ? 'review' : 'approve'}
            />
          )}

          {/* Vendor */}
          {signal.supplier_suggestion && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</p>
              <div className="rounded-xl border border-border bg-card p-3 text-sm space-y-1">
                <DetailRow label="Suggested" value={signal.supplier_suggestion} />
                {signal.supplier_confidence && <DetailRow label="Match" value={`${signal.supplier_confidence}%`} />}
                {signal.cost_comparison && <DetailRow label="Comparison" value={signal.cost_comparison} />}
              </div>
            </div>
          )}

          {/* Flag reason */}
          {signal.flag_reason && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-state-blocked" /> Flagged
              </p>
              <p className="text-sm text-state-blocked">{signal.flag_reason}</p>
            </div>
          )}

          {/* Bottleneck */}
          {signal.bottleneck && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bottleneck</p>
              <p className="text-sm text-muted-foreground">{signal.bottleneck}</p>
            </div>
          )}

          {/* Attachments */}
          {signal.attachments && signal.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attachments</p>
              <div className="space-y-1">
                {signal.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Primary CTA — always visible at bottom */}
          {needsAction && (
            <div className="space-y-2 pt-2 border-t border-border">
              {classified.decisionType === 'approval' && (
                <div className="flex items-center gap-2">
                  <Button className="flex-1 gap-1.5" onClick={() => onAction?.('approve')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => onAction?.('query')}>
                    <MessageSquare className="h-4 w-4" /> Query
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:text-destructive gap-1.5" onClick={() => onAction?.('reject')}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
              {classified.decisionType === 'exception' && (
                <div className="flex items-center gap-2">
                  <Button className="flex-1 gap-1.5" onClick={() => onAction?.('resolve')}>
                    <Check className="h-4 w-4" /> Reconcile
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => onAction?.('query')}>
                    <MessageSquare className="h-4 w-4" /> Review details
                  </Button>
                </div>
              )}
              {classified.decisionType === 'alert' && (
                <Button className="w-full gap-1.5" onClick={() => onAction?.('acknowledge')}>
                  <Check className="h-4 w-4" /> Acknowledge
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DetailRow = ({ icon, label, value, bold }: { icon?: React.ReactNode; label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span className={cn('text-right', bold && 'font-semibold text-foreground')}>{value}</span>
  </div>
);

export default PulseDetailDrawer;
