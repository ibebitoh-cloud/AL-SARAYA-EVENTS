export type EventPhase = 'setup' | 'doors' | 'keynote' | 'gala' | 'closing' | 'teardown';

export type CueStatus = 'upcoming' | 'standby' | 'live' | 'completed';

export interface RunsheetItem {
  id: string;
  time: string;
  durationMinutes: number;
  title: string;
  phase: EventPhase;
  category: 'Stage' | 'AV/Tech' | 'Catering' | 'Lighting' | 'VIP';
  description: string;
  leadPerson: string;
  location: string;
  status: CueStatus;
  avCues: {
    audio: string;
    lighting: string;
    video: string;
  };
  notes?: string;
}

export interface Guest {
  id: string;
  name: string;
  organization: string;
  role: 'VIP Speaker' | 'Keynote Guest' | 'Attendee' | 'Media Press' | 'Sponsor';
  status: 'confirmed' | 'pending' | 'checked-in' | 'declined';
  tableId?: string;
  dietary: 'Standard' | 'Vegan' | 'Gluten-Free' | 'Halal' | 'Kosher';
  avatarSeed: string;
}

export interface TableAssignment {
  id: string;
  name: string;
  shape: 'round' | 'rectangular';
  capacity: number;
  posX: number;
  posY: number;
  category: 'VIP & Speakers' | 'Corporate Sponsors' | 'Media & Press' | 'General Floor';
  assignedGuestIds: string[];
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  contactName: string;
  phone: string;
  budgetAllocated: number;
  spent: number;
  status: 'confirmed' | 'contract_pending' | 'paid_in_full';
  arrivalWindow: string;
}

export interface EventDetails {
  id: string;
  name: string;
  theme: string;
  date: string;
  location: string;
  venueName: string;
  targetAttendees: number;
  totalBudget: number;
  allocatedBudget: number;
  runsheet: RunsheetItem[];
  tables: TableAssignment[];
  guests: Guest[];
  vendors: Vendor[];
}
