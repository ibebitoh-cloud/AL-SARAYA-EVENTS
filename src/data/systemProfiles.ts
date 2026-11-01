import type { VenueTab } from '../types/venueSystem';

export type SystemRole = 'ceo' | 'finance' | 'operation' | 'operation_agent' | 'customer';

export interface SystemUser {
  id: string;
  name: string;
  nameAr: string;
  role: SystemRole;
  roleAr: string;
  roleEn: string;
  username: string;
  phone: string;
  permissions: string[];
  /** Sees selling prices only: never buying prices, costs, margins, payments or deposits. The CEO can change this on the Edit Permissions screen. */
  sellingPricesOnly?: boolean;
}

export const ROLE_LABELS: Record<SystemRole, { ar: string; en: string }> = {
  ceo: { ar: 'الرئيس التنفيذي', en: 'CEO' },
  finance: { ar: 'المحاسبة', en: 'Accountant' },
  operation: { ar: 'العمليات', en: 'Operation' },
  operation_agent: { ar: 'موظف عمليات', en: 'Operations staff' },
  customer: { ar: 'العميل', en: 'Customer' },
};

const FINANCE_SCREENS = ['dashboard', 'bookings', 'agenda', 'clients', 'finance', 'payments', 'expenses', 'reports', 'company', 'photo_library', 'event_designer', 'price_lists'];
const OPERATION_SCREENS = ['dashboard', 'bookings', 'agenda', 'package_builder', 'event_designer', 'services', 'inventory', 'staff', 'company', 'photo_library'];
const AGENT_SCREENS = ['package_builder', 'agenda', 'bookings', 'event_designer', 'services', 'inventory'];

/** The portal accounts. Website customers do not log in here. */
export const SYSTEM_USERS: SystemUser[] = [
  { id: 'USR-001', name: 'CEO', nameAr: 'الرئيس التنفيذي', role: 'ceo', roleAr: 'الرئيس التنفيذي', roleEn: 'CEO · full access', username: 'ceo', phone: '', permissions: ['all'] },
  { id: 'USR-010', name: 'Amira Mekaey', nameAr: 'أميرة مكاوي', role: 'finance', roleAr: 'المحاسبة', roleEn: 'Accountant', username: 'amira', phone: '', permissions: FINANCE_SCREENS },
  { id: 'USR-011', name: 'Sara Ibrahim', nameAr: 'سارة إبراهيم', role: 'operation', roleAr: 'العمليات · أسعار البيع فقط', roleEn: 'Operation · selling prices only', username: 'sara', phone: '', permissions: OPERATION_SCREENS, sellingPricesOnly: true },
  { id: 'USR-012', name: 'Operation', nameAr: 'العمليات', role: 'operation', roleAr: 'العمليات', roleEn: 'Operation', username: 'operation', phone: '', permissions: OPERATION_SCREENS },
  { id: 'USR-013', name: 'Demo 1', nameAr: 'تجريبي 1', role: 'operation_agent', roleAr: 'موظف عمليات · أسعار البيع فقط', roleEn: 'Operations staff · selling prices only', username: 'demo1', phone: '', permissions: AGENT_SCREENS, sellingPricesOnly: true },
  { id: 'USR-014', name: 'Demo 2', nameAr: 'تجريبي 2', role: 'operation_agent', roleAr: 'موظف عمليات · أسعار البيع فقط', roleEn: 'Operations staff · selling prices only', username: 'demo2', phone: '', permissions: AGENT_SCREENS, sellingPricesOnly: true },
  { id: 'USR-015', name: 'Demo 3', nameAr: 'تجريبي 3', role: 'operation_agent', roleAr: 'موظف عمليات · أسعار البيع فقط', roleEn: 'Operations staff · selling prices only', username: 'demo3', phone: '', permissions: AGENT_SCREENS, sellingPricesOnly: true },
];

/** CEO overrides of who sees selling prices only, by user id. */
export type PriceVisibility = Record<string, boolean>;
export const PRICE_VISIBILITY_KEY = 'saraya-prices-only-v1';

const pricesOnlyLabel = { ar: ' · أسعار البيع فقط', en: ' · selling prices only' };

/**
 * The current account for a saved user id, with the CEO's price-visibility choice applied.
 * Returns null for any account that no longer exists, so removed demo users cannot linger in a browser.
 */
export const resolveSystemUser = (id: string | null | undefined, visibility: PriceVisibility = {}): SystemUser | null => {
  const base = SYSTEM_USERS.find((u) => u.id === id);
  if (!base) return null;
  if (base.role === 'ceo') return base;
  const pricesOnly = visibility[base.id] ?? Boolean(base.sellingPricesOnly);
  const label = ROLE_LABELS[base.role];
  return {
    ...base,
    sellingPricesOnly: pricesOnly,
    roleAr: label.ar + (pricesOnly ? pricesOnlyLabel.ar : ''),
    roleEn: label.en + (pricesOnly ? pricesOnlyLabel.en : ''),
  };
};

/** Saved browser data for accounts that were removed: last-opened screens. */
export const removeStaleUserData = () => {
  if (typeof window === 'undefined') return;
  try {
    const keep = new Set(SYSTEM_USERS.map((u) => `saraya-last-tab-${u.id}`));
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith('saraya-last-tab-USR-') && !keep.has(key)) window.localStorage.removeItem(key);
    }
    const savedId = window.localStorage.getItem('saraya-portal-user-id');
    if (savedId && !SYSTEM_USERS.some((u) => u.id === savedId)) {
      window.localStorage.removeItem('saraya-portal-user-id');
      window.localStorage.removeItem('saraya-portal-user');
    }
  } catch { /* storage blocked */ }
};

export const canAccess = (user: SystemUser | null | undefined, tab: VenueTab) =>
  !!user && (user.permissions.includes('all') || user.permissions.includes(tab));

/** First screen a user lands on after login. */
export const landingTab = (user: SystemUser): VenueTab => {
  if (user.role === 'customer') return 'home';
  if (canAccess(user, 'dashboard')) return 'dashboard';
  return (user.permissions.find((p) => p !== 'all') as VenueTab) || 'home';
};
