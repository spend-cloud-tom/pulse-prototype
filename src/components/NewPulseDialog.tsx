import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { Role, SignalCategory } from '@/data/types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, Camera, Check, Package, FileText, ShoppingCart, Users, ClipboardCheck, Wrench, AlertTriangle, Calendar, Upload, Loader2, X, ArrowRight, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import AICopilotOverlay from '@/components/AICopilotOverlay';

interface ChipOption {
  label: string;
  icon: React.ReactNode;
  signalType: SignalCategory;
}

const roleFlows: Record<Role, {
  title: string;
  subtitle: string;
  chips: ChipOption[];
}> = {
  anouk: {
    title: 'What happened?',
    subtitle: 'Speak, type, or snap a photo.',
    chips: [
      { label: 'I bought something', icon: <ShoppingCart className="h-4 w-4" />, signalType: 'purchase' },
      { label: 'Something is broken', icon: <Wrench className="h-4 w-4" />, signalType: 'maintenance' },
      { label: 'Incident to report', icon: <AlertTriangle className="h-4 w-4" />, signalType: 'incident' },
      { label: 'Handover note', icon: <FileText className="h-4 w-4" />, signalType: 'shift-handover' },
    ],
  },
  rohan: {
    title: 'Log a correction',
    subtitle: 'Record adjustments or flag concerns.',
    chips: [
      { label: 'Manual journal entry', icon: <FileText className="h-4 w-4" />, signalType: 'general' },
      { label: 'Flag compliance concern', icon: <AlertTriangle className="h-4 w-4" />, signalType: 'compliance' },
      { label: 'Register invoice', icon: <ShoppingCart className="h-4 w-4" />, signalType: 'purchase' },
      { label: 'Override categorization', icon: <ClipboardCheck className="h-4 w-4" />, signalType: 'compliance' },
    ],
  },
  sarah: {
    title: 'Start a request',
    subtitle: 'Initiate procurement or coordination.',
    chips: [
      { label: 'New purchase request', icon: <ShoppingCart className="h-4 w-4" />, signalType: 'purchase' },
      { label: 'Maintenance coordination', icon: <Wrench className="h-4 w-4" />, signalType: 'maintenance' },
      { label: 'Supplier inquiry', icon: <FileText className="h-4 w-4" />, signalType: 'resource' },
      { label: 'Direct order', icon: <Package className="h-4 w-4" />, signalType: 'purchase' },
    ],
  },
  jolanda: {
    title: 'Start a team request',
    subtitle: 'Initiate something for your locations',
    chips: [
      { label: 'Request on behalf of team', icon: <Users className="h-4 w-4" />, signalType: 'general' },
      { label: 'Plan an event', icon: <Calendar className="h-4 w-4" />, signalType: 'event' },
      { label: 'Report safety concern', icon: <AlertTriangle className="h-4 w-4" />, signalType: 'compliance' },
      { label: 'Initiate approval', icon: <ClipboardCheck className="h-4 w-4" />, signalType: 'general' },
    ],
  },
};

interface NewPulseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewPulseDialog = ({ open, onOpenChange }: NewPulseDialogProps) => {
  const { activeRole, addSignal } = useRole();
  const [step, setStep] = useState(0);
  const [selectedChip, setSelectedChip] = useState<ChipOption | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const flow = roleFlows[activeRole];

  const submitterName = activeRole === 'anouk' ? 'Anouk van Dijk' : activeRole === 'rohan' ? 'Rohan Patel' : activeRole === 'sarah' ? 'Sarah de Vries' : 'Jolanda Bakker';

  const handleChipSelect = (chip: ChipOption) => {
    setSelectedChip(chip);
    setStep(1);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClassify = async () => {
    if (!description && !selectedChip) return;
    setIsClassifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('classify-signal', {
        body: {
          description: description || selectedChip?.label || '',
          category: selectedChip?.label || '',
          amount: parseFloat(amount) || 0,
          submitter: submitterName,
          location: 'Zonneweide',
        },
      });

      if (error) throw error;
      setClassification(data);
      setStep(2);
    } catch (err) {
      console.error('Classification error:', err);
      setClassification({
        signalType: selectedChip?.signalType || 'general',
        urgency: 'normal',
        suggestedCategory: 'General',
        suggestedFunding: 'General',
        confidence: 65,
        aiReasoning: 'Auto-classified based on submission type.',
      });
      setStep(2);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async () => {
    let photoUrl: string | undefined;
    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('signal-attachments')
        .upload(fileName, photoFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('signal-attachments')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    const cl = classification || {};
    const confidenceVal = cl.confidence || 65;

    await addSignal({
      title: description || selectedChip?.label || 'New request',
      description: `${description || selectedChip?.label} — submitted by ${submitterName}`,
      amount: parseFloat(amount) || 0,
      submitter_name: submitterName,
      submitter_avatar: '',
      location: 'Zonneweide',
      category: cl.suggestedCategory || 'General',
      signal_type: cl.signalType || selectedChip?.signalType || 'general',
      urgency: cl.urgency || 'normal',
      funding: cl.suggestedFunding || 'General',
      status: 'pending',
      confidence: confidenceVal,
      confidence_level: confidenceVal >= 80 ? 'high' : confidenceVal >= 50 ? 'medium' : 'low',
      flag_reason: cl.flagReason || null,
      ai_reasoning: cl.aiReasoning || 'Newly submitted. Awaiting review.',
      attachments: photoUrl ? [photoUrl] : [],
    });

    toast.success("Request submitted — we'll handle the rest", {
      description: 'You can track progress from your overview.',
    });

    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setStep(0);
    setSelectedChip(null);
    setDescription('');
    setAmount('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setClassification(null);
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{flow.title}</DialogTitle>
          <DialogDescription>{flow.subtitle}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 0: Choose type */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 pt-2">
              {/* Voice-first hint for care workers */}
              {activeRole === 'anouk' && (
                <button
                  onClick={() => setCopilotOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-signal-green/30 bg-signal-green-bg px-4 py-4 text-left transition-all hover:border-signal-green/50 hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="rounded-full bg-signal-green/10 p-2.5">
                    <Mic className="h-5 w-5 text-signal-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Speak what happened</p>
                    <p className="text-xs text-muted-foreground">Voice is fastest — just describe it</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-0 bg-signal-green/10 text-signal-green ml-auto shrink-0">
                    AI Demo
                  </Badge>
                </button>
              )}

              {flow.chips.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleChipSelect(chip)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium transition-all hover:bg-secondary hover:shadow-sm"
                >
                  <div className="rounded-lg bg-secondary p-2">{chip.icon}</div>
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {selectedChip?.icon}
                  {selectedChip?.label}
                </div>
              </div>

              <Textarea
                placeholder="What happened? Add details…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
                autoFocus
              />

              {(selectedChip?.signalType === 'purchase' || selectedChip?.signalType === 'resource') && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">€</span>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}

              {/* Photo support */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Attachment" className="w-full rounded-lg border border-border max-h-32 object-cover" />
                    <button
                      onClick={removePhoto}
                      className="absolute top-2 right-2 rounded-full bg-foreground/80 p-1 text-background hover:bg-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-xs"
                  >
                    <Camera className="h-3.5 w-3.5" /> Add photo
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleClassify} disabled={isClassifying || (!description && !selectedChip)} className="gap-1.5 flex-1">
                  {isClassifying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Check className="h-4 w-4" /> Submit</>
                  )}
                </Button>
              </div>
              <button onClick={() => { setStep(0); setSelectedChip(null); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
            </motion.div>
          )}

          {/* Step 2: Confirmation — what happens next */}
          {step === 2 && classification && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
              <div className="rounded-xl bg-signal-green-bg p-4 space-y-2">
                <p className="text-sm font-semibold text-signal-green flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Ready to submit
                </p>
                <p className="text-xs text-muted-foreground">{classification.aiReasoning}</p>
              </div>

              {/* Editable fields */}
              <div className="rounded-xl border border-border p-3 space-y-2.5">
                <FieldRow label="Type" value={classification.signalType?.replace('-', ' ')} />
                <FieldRow label="Category" value={classification.suggestedCategory} />
                <FieldRow label="Funding" value={classification.suggestedFunding} />
                <FieldRow
                  label="Urgency"
                  value={classification.urgency}
                  valueClass={classification.urgency === 'critical' ? 'text-signal-red' : classification.urgency === 'urgent' ? 'text-signal-amber' : ''}
                  hint="AI suggested — you can change this"
                />
                <FieldRow label="Confidence" value={`${classification.confidence}%`} />
              </div>

              {/* What happens next */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What happens next</p>
                <div className="space-y-1.5">
                  <NextStep icon={<ArrowRight className="h-3 w-3" />} text="Routed to the right person for review" />
                  <NextStep icon={<User className="h-3 w-3" />} text={`Owner: ${classification.urgency === 'critical' ? 'Jolanda (immediate)' : 'Jolanda (today)'}`} />
                  <NextStep icon={<MapPin className="h-3 w-3" />} text="You can track progress from your overview" />
                </div>
              </div>

              {photoPreview && (
                <img src={photoPreview} alt="Attached" className="w-full rounded-lg border border-border max-h-20 object-cover" />
              )}

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="gap-1.5 flex-1">
                  <Check className="h-4 w-4" /> Confirm & submit
                </Button>
                <Button variant="outline" onClick={() => setStep(1)} className="text-xs">
                  Edit
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role={activeRole} />
      </DialogContent>
    </Dialog>
  );
};

const FieldRow = ({ label, value, valueClass = '', hint }: { label: string; value: string; valueClass?: string; hint?: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className={`font-medium capitalize ${valueClass}`}>{value}</span>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

const NextStep = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    {icon}
    <span>{text}</span>
  </div>
);

export default NewPulseDialog;
