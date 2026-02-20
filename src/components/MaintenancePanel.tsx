import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Wrench, User, Phone, Calendar, Check, Clock, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { MaintenanceTicket } from '@/hooks/useMaintenanceTickets';
import { demoImages } from '@/data/mockData';
import ImageThumbnail from '@/components/ImageThumbnail';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-signal-red-bg text-signal-red', icon: <AlertTriangle className="h-3 w-3" /> },
  assigned: { label: 'Assigned', color: 'bg-signal-amber-bg text-signal-amber', icon: <User className="h-3 w-3" /> },
  'in-progress': { label: 'In Progress', color: 'bg-signal-amber-bg text-signal-amber', icon: <Clock className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'bg-signal-green-bg text-signal-green', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-secondary text-muted-foreground', icon: null },
};

const getMaintenanceImage = (description: string): string | null => {
  const desc = description.toLowerCase();
  if (desc.includes('light') || desc.includes('bulb') || desc.includes('lamp')) return demoImages.brokenLightbulb;
  if (desc.includes('shower')) return demoImages.brokenShower;
  if (desc.includes('faucet') || desc.includes('leak') || desc.includes('tap') || desc.includes('water')) return demoImages.leakyFaucet;
  if (desc.includes('wheelchair') || desc.includes('chair') || desc.includes('mobility')) return demoImages.brokenWheelchair;
  if (desc.includes('flood') || desc.includes('water damage')) return demoImages.flood;
  return null;
};

const MaintenancePanel = () => {
  const { tickets, updateTicket } = useRole();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const openTickets = tickets.filter(t => t.status === 'open');
  const assignedTickets = tickets.filter(t => t.status === 'assigned' || t.status === 'in-progress');
  const completedTickets = tickets.filter(t => t.status === 'completed');

  const handleAssign = async () => {
    if (!selectedTicket || !contractorName) return;

    try {
      await updateTicket(selectedTicket.id, {
        contractor_name: contractorName,
        contractor_phone: contractorPhone || null,
        scheduled_date: scheduledDate || null,
        status: 'assigned',
      });
      toast.success('Contractor assigned!', { description: `${contractorName} will handle this repair.` });
      setAssignDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Failed to assign contractor');
    }
  };

  const handleMarkComplete = async (ticket: MaintenanceTicket) => {
    try {
      await updateTicket(ticket.id, {
        status: 'completed',
        completion_date: new Date().toISOString().split('T')[0],
        resolution_notes: resolutionNotes || 'Completed',
      });
      toast.success('Ticket closed!', { description: 'Maintenance completed.' });
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleStartWork = async (ticket: MaintenanceTicket) => {
    try {
      await updateTicket(ticket.id, { status: 'in-progress' });
      toast.success('Marked as in progress');
    } catch {
      toast.error('Failed to update');
    }
  };

  const resetForm = () => {
    setContractorName('');
    setContractorPhone('');
    setScheduledDate('');
    setSelectedTicket(null);
  };

  const openAssignDialog = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setContractorName(ticket.contractor_name || '');
    setContractorPhone(ticket.contractor_phone || '');
    setScheduledDate(ticket.scheduled_date || '');
    setAssignDialogOpen(true);
  };

  if (tickets.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4" /> Maintenance Requests
        </h2>
        <Badge variant="secondary" className="text-xs">{tickets.length}</Badge>
      </div>

      {/* Open tickets */}
      {openTickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-signal-red">
            {openTickets.length} unassigned
          </p>
          {openTickets.map(ticket => {
            const sc = statusConfig[ticket.status];
            const ticketImage = getMaintenanceImage(ticket.issue_description);
            return (
              <div key={ticket.id} className="rounded-xl border border-signal-red/20 bg-card p-4 space-y-3">
                {/* Object type label */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Maintenance Request
                  </span>
                  <Badge className={`text-[11px] border-0 gap-1 shrink-0 ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </Badge>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold">{ticket.issue_description}</p>
                    <Badge className={`text-[10px] border-0 ${ticket.priority === 'critical' ? 'bg-signal-red-bg text-signal-red' : ticket.priority === 'urgent' ? 'bg-signal-amber-bg text-signal-amber' : 'bg-secondary text-muted-foreground'}`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  {ticketImage && (
                    <ImageThumbnail src={ticketImage} alt="Issue" size="sm" />
                  )}
                </div>
                
                {/* Metadata footer — Creator, Location, Time */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium">Care Staff</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{ticket.location} · {ticket.room_or_area}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ticket.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                  </span>
                </div>
                
                <Button size="sm" onClick={() => openAssignDialog(ticket)} className="gap-1.5 text-xs h-8">
                  <User className="h-3.5 w-3.5" /> Assign Contractor
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Assigned / In Progress */}
      {assignedTickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-signal-amber">
            {assignedTickets.length} in progress
          </p>
          {assignedTickets.map(ticket => {
            const sc = statusConfig[ticket.status];
            return (
              <div key={ticket.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                {/* Object type label */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Maintenance Request
                  </span>
                  <Badge className={`text-[11px] border-0 gap-1 ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </Badge>
                </div>
                
                <p className="text-sm font-semibold">{ticket.issue_description}</p>
                
                {/* Metadata footer — Creator, Location, Contractor */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium">Care Staff</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{ticket.location}</span>
                  </span>
                  {ticket.contractor_name && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        <span>{ticket.contractor_name}</span>
                      </span>
                    </>
                  )}
                  {ticket.scheduled_date && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{ticket.scheduled_date}</span>
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {ticket.status === 'assigned' && (
                    <Button size="sm" variant="outline" onClick={() => handleStartWork(ticket)} className="gap-1.5 text-xs h-7">
                      <Clock className="h-3 w-3" /> Start Work
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleMarkComplete(ticket)} className="gap-1.5 text-xs h-7 text-signal-green hover:text-signal-green">
                    <Check className="h-3 w-3" /> Mark Complete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completedTickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-signal-green">
            {completedTickets.length} completed
          </p>
          {completedTickets.map(ticket => (
            <div key={ticket.id} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground line-through">{ticket.issue_description}</p>
                  <p className="text-xs text-muted-foreground">{ticket.location} · {ticket.contractor_name}</p>
                </div>
                <Badge className="text-[11px] border-0 bg-signal-green-bg text-signal-green gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign contractor dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(v) => { setAssignDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Assign Contractor</DialogTitle>
            <DialogDescription>
              {selectedTicket?.issue_description} — {selectedTicket?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Contractor name *</label>
              <Input
                placeholder="e.g., Bouwbedrijf Jansen"
                value={contractorName}
                onChange={e => setContractorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Phone number</label>
              <Input
                placeholder="e.g., 06-12345678"
                value={contractorPhone}
                onChange={e => setContractorPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Scheduled date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
            <Button onClick={handleAssign} disabled={!contractorName} className="w-full gap-1.5">
              <Check className="h-4 w-4" /> Assign & Notify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MaintenancePanel;
