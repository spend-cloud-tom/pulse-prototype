import { UserProfile } from './types';

export const demoImages = {
  receipt: '/images/receipt.png',
  invoice: '/images/invoice.png',
  leakyFaucet: '/images/leaky-faucet.jpg',
  brokenShower: '/images/broken-shower.webp',
  brokenWheelchair: '/images/broken-wheelchair.webp',
  brokenLightbulb: '/images/broken-lightbulb.webp',
  flood: '/images/flooded-room.webp',
  fallIncident: '/images/fall-incident-bathroom.jpeg',
  medication: '/images/medication-bottle.jpg',
  deliveryConfirm: '/images/delivery-confirmation.jpeg',
  missedDelivery: '/images/missed-delivery-tag.webp',
  building: '/images/modern-building.jpeg',
  handwrittenNotes: '/images/handwritten-notes.avif',
};

export const users: UserProfile[] = [
  {
    id: 'anouk',
    name: 'Anouk van Dijk',
    role: 'Care Worker',
    focus: 'Get things done',
    avatar: '/avatars/anouk.jpg',  // Image 1: nurse in blue Healthcare Service uniform
    bannerMessage: "We've handled everything for you today. Just <strong>1 thing</strong> needs your attention.",
  },
  {
    id: 'rohan',
    name: 'Rohan Patel',
    role: 'Finance Admin',
    focus: 'Control risk',
    avatar: '/avatars/rohan.jpg',  // Image 3: man at desk with monitors
    bannerMessage: 'AI processed <strong>42 pulses</strong> today. <strong>6</strong> require financial review.',
  },
  {
    id: 'sarah',
    name: 'Sarah de Vries',
    role: 'Procurement Officer',
    focus: 'Supply continuity',
    avatar: '/avatars/sarah.jpg',  // Image 4: woman at laptop with headset
    bannerMessage: '<strong>4 pulses</strong> awaiting your action. AI matched suppliers for 2.',
  },
  {
    id: 'jolanda',
    name: 'Jolanda Bakker',
    role: 'Team Lead',
    focus: 'Approvals',
    avatar: '/avatars/jolanda.jpg',  // Image 2: woman in blazer with tablet
    bannerMessage: '<strong>3 team pulses</strong> need your approval.',
  },
];

// Signals now come from the database via useSignals hook

export const autoApprovedBreakdown = {
  total: 38,
  reasons: [
    { label: 'Policy match', percentage: 100 },
    { label: 'Historical similarity', percentage: 94 },
    { label: 'Funding eligibility', percentage: 100 },
    { label: 'Receipt validation', percentage: 97 },
  ],
  examples: [
    { item: 'Coffee supplies — Zonneweide', amount: 12.4, time: '9:15 AM' },
    { item: 'Bus tickets — De Berk', amount: 15.0, time: '10:02 AM' },
    { item: 'Hand soap refill — Zonneweide', amount: 6.8, time: '10:45 AM' },
    { item: 'Printer paper — De Berk', amount: 18.9, time: '11:30 AM' },
  ],
};

export const teamSignals = [
  { name: 'Sanjaya Kumar', signal: 'Groceries — needs funding split', status: 'needs-clarity' as const, time: '5h ago', type: 'purchase' as const },
  { name: 'Tom Bakker', signal: 'Broken shower — room 14', status: 'pending' as const, time: '1h ago', type: 'maintenance' as const },
  { name: 'Night shift', signal: 'Geert-Jan — medication adjusted, monitor closely', status: 'pending' as const, time: '6:45 AM', type: 'shift-handover' as const },
  { name: 'Anouk van Dijk', signal: 'Fall incident — Marielle, room 8', status: 'pending' as const, time: '45 min ago', type: 'incident' as const },
];

export const locationBudgets = [
  { location: 'Zonneweide', spent: 2840, total: 5000, trend: '+8%' },
  { location: 'De Berk', spent: 1920, total: 4500, trend: '-3%' },
  { location: 'Het Anker', spent: 3100, total: 4000, trend: '+12%' },
];

export const aiAlerts = [
  {
    id: 'alert-1',
    message: 'Unusual pattern: 5 purchases above €50 at non-contracted suppliers this week at Zonneweide.',
    severity: 'amber' as const,
    action: 'Review supplier usage',
  },
  {
    id: 'alert-2',
    message: 'Het Anker General budget at 78% — above average for this point in the month.',
    severity: 'amber' as const,
    action: 'Review budget allocation',
  },
  {
    id: 'alert-3',
    message: 'Elevator inspection at De Berk is 14 days overdue. Compliance risk flagged.',
    severity: 'amber' as const,
    action: 'Schedule inspection',
  },
  {
    id: 'alert-4',
    message: 'Sinterklaas event (Dec 5) — venue booking deadline approaching. 3 locations need coordination.',
    severity: 'low' as const,
    action: 'Start planning',
  },
];

// PULSE TYPE CONFIG — Every item is a Pulse with a type tag
// Format: "[Type] Pulse" to reinforce the unified mental model
export const signalTypeConfig: Record<string, { label: string; pulseLabel: string }> = {
  purchase: { label: 'Purchase', pulseLabel: 'Purchase Pulse' },
  maintenance: { label: 'Maintenance', pulseLabel: 'Maintenance Pulse' },
  incident: { label: 'Incident', pulseLabel: 'Incident Pulse' },
  'shift-handover': { label: 'Handover', pulseLabel: 'Handover Pulse' },
  compliance: { label: 'Compliance', pulseLabel: 'Compliance Pulse' },
  event: { label: 'Event', pulseLabel: 'Event Pulse' },
  resource: { label: 'Resource', pulseLabel: 'Resource Pulse' },
  general: { label: 'General', pulseLabel: 'Pulse' },
};

// PULSE STATE CONFIG — Unified state labels and colors
export const pulseStateConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  'needs-action': { label: 'Needs Action', color: 'text-signal-red', bgColor: 'bg-signal-red-bg', icon: '🔴' },
  'in-motion': { label: 'In Motion', color: 'text-signal-amber', bgColor: 'bg-signal-amber-bg', icon: '🟡' },
  'blocked': { label: 'Blocked', color: 'text-muted-foreground', bgColor: 'bg-secondary', icon: '⚫' },
  'auto-handled': { label: 'Auto-Handled', color: 'text-hero-purple', bgColor: 'bg-hero-purple-soft', icon: '🟣' },
  'resolved': { label: 'Resolved', color: 'text-signal-green', bgColor: 'bg-signal-green-bg', icon: '🟢' },
};

// Upcoming events for event coordination view
export const upcomingEvents = [
  {
    id: 'evt-1',
    title: 'Sinterklaas celebration',
    date: 'Dec 5',
    locations: ['Zonneweide', 'De Berk', 'Het Anker'],
    budget: 1200,
    status: 'planning' as const,
    tasks: [
      { label: 'Venue confirmed', done: true },
      { label: 'Gift list finalized', done: false },
      { label: 'Catering booked', done: false },
      { label: 'Volunteer sign-up', done: true },
      { label: 'Transport arranged', done: false },
    ],
  },
  {
    id: 'evt-2',
    title: 'Spring outing',
    date: 'April 18',
    locations: ['Zonneweide'],
    budget: 850,
    status: 'planning' as const,
    tasks: [
      { label: 'Venue selected', done: false },
      { label: 'Dietary requirements gathered', done: false },
      { label: 'Transport booked', done: false },
    ],
  },
  {
    id: 'evt-3',
    title: 'First aid training',
    date: 'March 15',
    locations: ['Zonneweide', 'De Berk'],
    budget: 960,
    status: 'confirmed' as const,
    tasks: [
      { label: 'Trainer confirmed', done: true },
      { label: 'Attendees registered (24/24)', done: true },
      { label: 'Room booked', done: true },
      { label: 'Materials ordered', done: false },
    ],
  },
  {
    id: 'evt-4',
    title: 'BBQ afternoon',
    date: 'June 21',
    locations: ['Zonneweide'],
    budget: 320,
    status: 'planning' as const,
    tasks: [
      { label: 'Caterer contacted', done: true },
      { label: 'Seating plan', done: false },
      { label: 'Weather contingency', done: false },
    ],
  },
];
