import { useRole } from '@/context/RoleContext';
import { users } from '@/data/mockData';

const AutomationBanner = () => {
  const { activeRole, signals } = useRole();
  const user = users.find(u => u.id === activeRole)!;

  const pending = signals.filter(s => s.status === 'pending' || s.status === 'needs-clarity');
  const autoProcessed = signals.filter(s => s.status === 'auto-approved' || s.status === 'approved');
  const incidents = signals.filter(s => s.signal_type === 'incident' && (s.status === 'pending' || s.status === 'needs-clarity'));
  const maintenance = signals.filter(s => s.signal_type === 'maintenance' && (s.status === 'pending' || s.status === 'needs-clarity'));

  const dynamicMessages: Record<string, string> = {
    anouk: `Pulse handled <strong>${autoProcessed.length} items</strong> today. ${pending.filter(s => s.submitter_name === 'Anouk van Dijk').length > 0 ? `<strong>${pending.filter(s => s.submitter_name === 'Anouk van Dijk').length}</strong> need your attention.` : 'Nothing needs your attention.'}${incidents.length > 0 ? ` <strong>${incidents.length}</strong> incident${incidents.length > 1 ? 's' : ''} logged.` : ''}`,
    rohan: `Pulse processed <strong>${autoProcessed.length + pending.length} items</strong> today. <strong>${pending.length}</strong> require review.${incidents.length > 0 ? ` ${incidents.length} incident${incidents.length > 1 ? 's' : ''}.` : ''}${maintenance.length > 0 ? ` ${maintenance.length} maintenance.` : ''}`,
    sarah: `<strong>${signals.filter(s => s.status === 'awaiting-supplier').length}</strong> awaiting action. <strong>${signals.filter(s => s.status === 'in-motion').length}</strong> in motion.${maintenance.length > 0 ? ` ${maintenance.length} maintenance coordination needed.` : ''}`,
    jolanda: `<strong>${pending.filter(s => s.location === 'Zonneweide').length}</strong> need attention across your locations.${incidents.length > 0 ? ` <strong>${incidents.length} incident${incidents.length > 1 ? 's' : ''}</strong> reported.` : ''}`,
  };

  return (
    <div className="w-full bg-banner text-banner-foreground px-6 py-2.5 text-center">
      <p
        className="text-sm font-light tracking-wide"
        dangerouslySetInnerHTML={{ __html: dynamicMessages[activeRole] || user.bannerMessage }}
      />
    </div>
  );
};

export default AutomationBanner;
