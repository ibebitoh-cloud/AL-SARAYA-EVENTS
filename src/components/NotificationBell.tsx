import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import type { Language } from '../types/venueSystem';
import { notificationsForUser, type StaffNotification } from '../data/notifications';

interface Props {
  /** Every alert; the bell shows only the ones this user hasn't cleared. */
  notifications: StaffNotification[];
  userId: string;
  language: Language;
  onOpen: (notification: StaffNotification) => void;
  onMarkAllRead: () => void;
  /** Clear one alert, or all of them when no id is given, for this user only. */
  onClear: (id?: string) => void;
}

/** Portal bell: new and edited website booking requests, with an unread count per staff user. */
export function NotificationBell({ notifications: all, userId, language, onOpen, onMarkAllRead, onClear }: Props) {
  const isAr = language === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const [open, setOpen] = useState(false);
  const notifications = notificationsForUser(all, userId);
  const unread = notifications.filter((n) => !n.readBy.includes(userId));
  const latest = notifications.slice(0, 30);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const timeAgo = (iso: string) => {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return tr('الآن', 'just now');
    if (minutes < 60) return tr(`منذ ${minutes} دقيقة`, `${minutes} min ago`);
    const hours = Math.round(minutes / 60);
    if (hours < 24) return tr(`منذ ${hours} ساعة`, `${hours} h ago`);
    return new Date(iso).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={unread.length ? tr(`الإشعارات، ${unread.length} غير مقروءة`, `Notifications, ${unread.length} unread`) : tr('الإشعارات', 'Notifications')}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-950">{unread.length > 99 ? '99+' : unread.length}</span>}
      </button>
      {open && createPortal(
        <>
          <button type="button" aria-label={tr('إغلاق الإشعارات', 'Close notifications')} onClick={() => setOpen(false)} className="fixed inset-0 z-[80] cursor-default bg-slate-950/40" />
          <div dir={isAr ? 'rtl' : 'ltr'} role="dialog" aria-label={tr('الإشعارات', 'Notifications')} className="fixed inset-x-3 top-16 z-[85] mx-auto max-h-[70vh] w-auto max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-start shadow-2xl lg:inset-x-auto lg:start-[17rem] lg:top-4 lg:mx-0 lg:w-96">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">{tr('الإشعارات', 'Notifications')}</div>
                <div className="text-[10px] text-slate-500">{unread.length ? tr(`${unread.length} جديدة`, `${unread.length} new`) : tr('لا توجد إشعارات جديدة', 'Nothing new')}</div>
              </div>
              <div className="flex items-center gap-1">
                {unread.length > 0 && <button type="button" onClick={onMarkAllRead} className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-slate-800"><CheckCheck className="h-3.5 w-3.5" />{tr('تمييز الكل كمقروء', 'Mark all read')}</button>}
                {notifications.length > 0 && <button type="button" onClick={() => onClear()} className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />{tr('مسح الكل', 'Clear all')}</button>}
                <button type="button" onClick={() => setOpen(false)} aria-label={tr('إغلاق', 'Close')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[calc(70vh-3.5rem)] overflow-y-auto">
              {latest.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-500">{tr('لا توجد إشعارات. ستظهر هنا طلبات الحجز الجديدة من الموقع.', 'No notifications. New booking requests from the website will show up here.')}</p>}
              {latest.map((n) => {
                const isUnread = !n.readBy.includes(userId);
                return (
                  <div key={n.id} className={`group relative border-b border-slate-900 transition hover:bg-slate-900 ${isUnread ? 'bg-amber-400/[0.06]' : ''}`}>
                  <button type="button" onClick={() => { setOpen(false); onOpen(n); }} className="flex w-full gap-3 px-4 py-3 pe-10 text-start">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-amber-400' : 'bg-transparent'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white">{tr('طلب حجز جديد', 'New booking request')}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-300">{n.clientName} · <span dir="ltr" className="font-mono">{n.clientPhone}</span></span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{n.hallName} · <span dir="ltr" className="font-mono">{n.date}</span> · <span dir="ltr" className="font-mono">{n.bookingCode}</span></span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(n.createdAt)}</span>
                  </button>
                  <button type="button" onClick={() => onClear(n.id)} aria-label={tr('مسح هذا الإشعار', 'Clear this notification')} title={tr('مسح', 'Clear')} className="absolute bottom-2 end-2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
