import type { VenueTab } from '../types/venueSystem';

export type SystemRole = 'ceo' | 'finance' | 'operation' | 'operation_agent' | 'customer';

export interface SystemUser {
  id: string;
  name: string;
  nameAr: string;
  role: SystemRole;
  roleAr: string;
  username: string;
  phone: string;
  permissions: string[];
  /** Sees selling prices only: no costs, margins, payments or deposits. */
  sellingPricesOnly?: boolean;
}

export const SYSTEM_USERS: SystemUser[] = [
  { id: 'USR-001', name: 'CEO', nameAr: 'الرئيس التنفيذي', role: 'ceo', roleAr: 'الرئيس التنفيذي', username: 'ceo', phone: '', permissions: ['all'] },
  { id: 'USR-006', name: 'Aya', nameAr: 'آية', role: 'finance', roleAr: 'الإدارة المالية', username: 'aya', phone: '', permissions: ['dashboard', 'bookings', 'agenda', 'clients', 'finance', 'payments', 'expenses', 'reports', 'company', 'photo_library', 'event_designer', 'price_lists'] },
  { id: 'USR-007', name: 'Sara', nameAr: 'سارة', role: 'operation', roleAr: 'إدارة العمليات', username: 'sara', phone: '', permissions: ['dashboard', 'bookings', 'agenda', 'package_builder', 'event_designer', 'services', 'inventory', 'staff', 'company', 'photo_library'] },
  { id: 'USR-008', name: 'Dr. Ahmed', nameAr: 'د. أحمد', role: 'ceo', roleAr: 'الرئيس التنفيذي', username: 'dr.ahmed', phone: '', permissions: ['all'] },
  { id: 'USR-005', name: 'Operations Agent', nameAr: 'موظف العمليات', role: 'operation_agent', roleAr: 'موظف عمليات — أسعار البيع فقط', username: 'ops-agent', phone: '', permissions: ['package_builder', 'agenda', 'bookings', 'event_designer', 'services', 'inventory'], sellingPricesOnly: true },
  { id: 'USR-004', name: 'Customer', nameAr: 'العميل', role: 'customer', roleAr: 'العميل', username: 'customer', phone: '', permissions: ['home', 'agenda', 'public_events', 'public_venues', 'public_services', 'public_planner', 'public_gallery', 'public_3d_tour'] },
];

export const canAccess = (user: SystemUser | null | undefined, tab: VenueTab) =>
  !!user && (user.permissions.includes('all') || user.permissions.includes(tab));

/** First screen a user lands on after login. */
export const landingTab = (user: SystemUser): VenueTab => {
  if (user.role === 'customer') return 'home';
  if (canAccess(user, 'dashboard')) return 'dashboard';
  return (user.permissions.find((p) => p !== 'all') as VenueTab) || 'home';
};
