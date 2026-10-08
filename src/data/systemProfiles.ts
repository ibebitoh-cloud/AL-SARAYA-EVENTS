export type SystemRole = 'ceo' | 'finance' | 'operation' | 'customer';

export interface SystemUser {
  id: string;
  name: string;
  nameAr: string;
  role: SystemRole;
  roleAr: string;
  username: string;
  phone: string;
  permissions: string[];
}

export const SYSTEM_USERS: SystemUser[] = [
  { id: 'USR-001', name: 'CEO', nameAr: 'الرئيس التنفيذي', role: 'ceo', roleAr: 'الرئيس التنفيذي', username: 'ceo', phone: '', permissions: ['all'] },
  { id: 'USR-002', name: 'Finance', nameAr: 'المالية', role: 'finance', roleAr: 'الإدارة المالية', username: 'finance', phone: '', permissions: ['dashboard', 'bookings', 'clients', 'payments', 'expenses', 'reports', 'company'] },
  { id: 'USR-003', name: 'Operation', nameAr: 'العمليات', role: 'operation', roleAr: 'إدارة العمليات', username: 'operation', phone: '', permissions: ['dashboard', 'bookings', 'agenda', 'event_designer', 'services', 'inventory', 'staff', 'company'] },
  { id: 'USR-004', name: 'Customer', nameAr: 'العميل', role: 'customer', roleAr: 'العميل', username: 'customer', phone: '', permissions: ['home', 'public_events', 'public_venues', 'public_services', 'public_planner', 'public_gallery', 'public_3d_tour'] },
];
