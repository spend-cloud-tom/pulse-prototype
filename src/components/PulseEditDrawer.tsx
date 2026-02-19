import { useState, useRef } from 'react';
import { Signal } from '@/data/types';
import { demoImages } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Upload, X } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageThumbnail from '@/components/ImageThumbnail';

const getSignalImage = (signal: Signal): string => {
  const type = signal.signal_type;
  const title = (signal.title || '').toLowerCase();
  
  if (type === 'purchase' || title.includes('groceries') || title.includes('supplies')) return demoImages.receipt;
  if (type === 'maintenance') return demoImages.leakyFaucet;
  if (type === 'incident') return demoImages.flood;
  if (type === 'compliance') return demoImages.medication;
  if (title.includes('invoice')) return demoImages.invoice;
  return demoImages.receipt;
};

interface PulseEditDrawerProps {
  signal: Signal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PulseEditDrawer = ({ signal, open, onOpenChange }: PulseEditDrawerProps) => {
  const { updateSignal } = useRole();
  const [poNumber, setPoNumber] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [glCode, setGlCode] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!signal) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const description = [
        signal.description,
        poNumber && `PO: ${poNumber}`,
        costCenter && `Cost center: ${costCenter}`,
        glCode && `GL code: ${glCode}`,
        internalNote && `Note: ${internalNote}`,
      ].filter(Boolean).join(' | ');

      await updateSignal(signal.id, {
        description,
        category: glCode || signal.category,
        funding: costCenter || signal.funding,
      });

      toast.success('Pulse updated', { description: 'Finance details saved.' });
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('signal-attachments').upload(fileName, file);

    if (error) {
      toast.error('Upload failed');
      return;
    }

    const { data: urlData } = supabase.storage.from('signal-attachments').getPublicUrl(fileName);
    const newAttachments = [...(signal.attachments || []), urlData.publicUrl];
    await updateSignal(signal.id, { attachments: newAttachments });
    toast.success('File attached');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg leading-snug">Edit finance details</SheetTitle>
          <p className="text-xs text-muted-foreground">#{signal.signal_number} · {signal.title}</p>
        </SheetHeader>

        <div className="space-y-5">
          {/* Signal image preview — constrained cover with tap-to-expand */}
          <ImageThumbnail src={getSignalImage(signal)} alt="Attachment" size="md" />

          {/* Current amount */}
          <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-lg font-semibold">€{(signal.amount || 0).toFixed(2)}</span>
          </div>

          {/* PO Number */}
          <div className="space-y-1.5">
            <Label className="text-xs">PO number</Label>
            <Input
              placeholder="e.g. PO-2024-0892"
              value={poNumber}
              onChange={e => setPoNumber(e.target.value)}
              className="h-10"
            />
          </div>

          {/* GL Code */}
          <div className="space-y-1.5">
            <Label className="text-xs">Account / GL code</Label>
            <Input
              placeholder="e.g. 4210 — Food & Beverages"
              value={glCode}
              onChange={e => setGlCode(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Cost center */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cost center</Label>
            <Input
              placeholder="e.g. CC-Zonneweide-01"
              value={costCenter}
              onChange={e => setCostCenter(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Internal note */}
          <div className="space-y-1.5">
            <Label className="text-xs">Internal note</Label>
            <Textarea
              placeholder="Add a note for reference..."
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">Supporting document</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs w-full">
              <Upload className="h-3.5 w-3.5" /> Attach file
            </Button>
            {signal.attachments && signal.attachments.length > 0 && (
              <div className="space-y-1 mt-2">
                {signal.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PulseEditDrawer;
