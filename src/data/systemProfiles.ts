export type SystemRole = 'admin' | 'general_manager' | 'operations_manager' | 'accountant';

export interface SystemUser {
  id: string;
  name: string;
  nameAr: string;
  role: SystemRole;
  roleAr: string;
  email: string;
  phone: string;
  permissions: string[];
}

export const SYSTEM_USERS: SystemUser[] = [
  { id: 'USR-001', name: 'System Administrator', nameAr: 'مدير النظام', role: 'admin', roleAr: 'مدير النظام', email: 'admin@saraya-event.com', phone: '', permissions: ['all'] },
  { id: 'USR-002', name: 'General Manager', nameAr: 'المدير العام', role: 'general_manager', roleAr: 'المدير العام', email: 'manager@saraya-event.com', phone: '', permissions: ['dashboard', 'bookings', 'clients', 'reports', 'company'] },
  { id: 'USR-003', name: 'Operations Manager', nameAr: 'مدير العمليات', role: 'operations_manager', roleAr: 'مدير العمليات', email: 'operations@saraya-event.com', phone: '', permissions: ['dashboard', 'bookings', 'agenda', 'event_designer', 'services', 'inventory', 'staff'] },
  { id: 'USR-004', name: 'Accountant', nameAr: 'المحاسب', role: 'accountant', roleAr: 'المحاسب', email: 'accounts@saraya-event.com', phone: '', permissions: ['dashboard', 'bookings', 'payments', 'expenses', 'reports'] },
];
