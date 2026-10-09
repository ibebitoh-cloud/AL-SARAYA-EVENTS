import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Check, Clock3, ImagePlus, Search, Trash2, Upload, X, Images, Archive, AlertTriangle, Save, ExternalLink } from 'lucide-react';
import { Booking, Language } from '../types/venueSystem';
import { VenuePhoto } from '../data/venueImages';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'archived';
type ManagedPhoto = VenuePhoto & { reviewStatus?: ReviewStatus };

interface PhotoLibraryPageProps {
  language: Language;
  photos: VenuePhoto[];
  bookings: Booking[];
  onSavePhotos: (photos: VenuePhoto[]) => void;
}

const STORAGE_KEY = 'alsaraya_photo_review_status';
const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  ballroom: { ar: 'القاعات', en: 'Ballrooms' },
  kosha: { ar: 'الكوشة', en: 'Kosha / Stage' },
  dining: { ar: 'الضيافة والطاولات', en: 'Dining' },
  corporate: { ar: 'المؤتمرات', en: 'Corporate' },
  wedding: { ar: 'الزفاف', en: 'Weddings' },
  engagement: { ar: 'الخطوبة', en: 'Engagements' },
  birthday: { ar: 'أعياد الميلاد', en: 'Birthdays' },
  party: { ar: 'الحفلات', en: 'Parties' },
};

export function PhotoLibraryPage({ language, photos, bookings, onSavePhotos }: PhotoLibraryPageProps) {
  const isAr = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');
  const [category, setCategory] = useState('all');
  const [albumFilter, setAlbumFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [statuses, setStatuses] = useState<Record<string, ReviewStatus>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [draft, setDraft] = useState<{ titleAr: string; titleEn: string; captionAr: string; captionEn: string; src: string; category: VenuePhoto['category']; albumName: string; bookingId?: string } | null>(null);

  const managed = useMemo<ManagedPhoto[]>(() => photos.map((photo) => ({ ...photo, reviewStatus: statuses[photo.id] || photo.reviewStatus || 'approved' })), [photos, statuses]);
  const sourceKey = (src: string) => (src || '').trim().replace(/[?#].*$/, '').toLowerCase();
  const duplicates = useMemo(() => {
    const counts = new Map<string, number>();
    managed.forEach((photo) => { const key = sourceKey(photo.src); if (key) counts.set(key, (counts.get(key) || 0) + 1); });
    return new Set(managed.filter((photo) => sourceKey(photo.src) && (counts.get(sourceKey(photo.src)) || 0) > 1).map((photo) => photo.id));
  }, [managed]);
  const albumNameForBooking = (booking: Booking) => `${booking.code} · ${booking.clientName} · ${booking.date}`;
  const albumNameFor = (photo: VenuePhoto) => {
    if (photo.bookingId) {
      const booking = bookings.find((item) => item.id === photo.bookingId);
      if (booking) return albumNameForBooking(booking);
    }
    return photo.albumName?.trim() || CATEGORY_LABELS[photo.category]?.[isAr ? 'ar' : 'en'] || photo.category;
  };
  const albumOptions = Array.from(new Set(managed.filter((photo) => !photo.bookingId).map(albumNameFor))).sort((a, b) => a.localeCompare(b, isAr ? 'ar' : 'en'));
  const filtered = managed.filter((photo) => {
    const term = query.trim().toLowerCase();
    const matchesText = !term || [photo.titleAr, photo.titleEn, photo.captionAr, photo.captionEn, photo.hallNameAr, photo.hallNameEn, ...(photo.tags || [])].join(' ').toLowerCase().includes(term);
    const matchesAlbum = albumFilter === 'all' || (albumFilter.startsWith('booking:') ? photo.bookingId === albumFilter.slice(8) : !photo.bookingId && albumNameFor(photo) === albumFilter);
    return matchesText && (filter === 'all' || photo.reviewStatus === filter) && (category === 'all' || photo.category === category) && matchesAlbum;
  });
  const counts = {
    all: managed.length,
    pending: managed.filter((p) => p.reviewStatus === 'pending').length,
    approved: managed.filter((p) => p.reviewStatus === 'approved').length,
    rejected: managed.filter((p) => p.reviewStatus === 'rejected').length,
    archived: managed.filter((p) => p.reviewStatus === 'archived').length,
  };
  const storageBytes = new Blob([JSON.stringify(photos)]).size;
  const storageLabel = storageBytes > 1024 * 1024 ? (storageBytes / (1024 * 1024)).toFixed(1) + ' MB' : (storageBytes / 1024).toFixed(0) + ' KB';

  const persistStatuses = (next: Record<string, ReviewStatus>) => {
    setStatuses(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { setNotice(isAr ? 'تعذر حفظ حالات المراجعة في تخزين المتصفح.' : 'Could not save review statuses in browser storage.'); }
  };
  const setStatus = (id: string, status: ReviewStatus) => { persistStatuses({ ...statuses, [id]: status }); onSavePhotos(photos.map((photo) => photo.id === id ? { ...photo, reviewStatus: status } : photo)); };
  const openNew = () => {
    setSelectedId(null);
    const bookingId = albumFilter.startsWith('booking:') ? albumFilter.slice(8) : undefined;
    const booking = bookings.find((item) => item.id === bookingId);
    setDraft({ titleAr: '', titleEn: '', captionAr: '', captionEn: '', src: '', category: 'wedding', albumName: booking ? albumNameForBooking(booking) : (isAr ? 'زفاف وأفراح' : 'Weddings'), bookingId });
    setNotice('');
  };
  const openEdit = (photo: ManagedPhoto) => {
    setSelectedId(photo.id);
    setDraft({ titleAr: photo.titleAr, titleEn: photo.titleEn, captionAr: photo.captionAr, captionEn: photo.captionEn, src: photo.src, category: photo.category, albumName: photo.albumName || albumNameFor(photo), bookingId: photo.bookingId });
    setNotice('');
  };
  const readImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setNotice(isAr ? 'اختر ملف صورة صالحاً.' : 'Choose a valid image file.'); return; }
    if (file.size > 3 * 1024 * 1024) { setNotice(isAr ? 'حجم الصورة أكبر من 3 ميجابايت. استخدم رابط صورة أو صورة أصغر.' : 'Image exceeds 3 MB. Use an image URL or a smaller file.'); return; }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => current ? { ...current, src: String(reader.result || '') } : current);
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  const saveDraft = () => {
    if (!draft?.src.trim() || (!draft.titleAr.trim() && !draft.titleEn.trim())) {
      setNotice(isAr ? 'أضف رابط الصورة أو ارفع ملفاً، واكتب عنواناً للصورة.' : 'Add an image URL or upload a file, and provide a title.');
      return;
    }
    if (selectedId) {
      onSavePhotos(photos.map((photo) => photo.id === selectedId ? { ...photo, ...draft, albumName: draft.bookingId ? (bookings.find((item) => item.id === draft.bookingId) ? albumNameForBooking(bookings.find((item) => item.id === draft.bookingId)!) : draft.albumName.trim()) : (draft.albumName.trim() || CATEGORY_LABELS[draft.category]?.ar || draft.category) } : photo));
      setNotice(isAr ? 'تم حفظ تعديلات الصورة.' : 'Photo changes saved.');
    } else {
      const id = 'photo-' + Date.now();
      onSavePhotos([{ id, ...draft, albumName: draft.bookingId ? (bookings.find((item) => item.id === draft.bookingId) ? albumNameForBooking(bookings.find((item) => item.id === draft.bookingId)!) : draft.albumName.trim()) : (draft.albumName.trim() || CATEGORY_LABELS[draft.category]?.ar || draft.category), reviewStatus: 'pending', hallNameAr: 'غير محدد', hallNameEn: 'Unassigned', captionAr: draft.captionAr, captionEn: draft.captionEn, parallaxSpeed: 0, tags: [] }, ...photos]);
      persistStatuses({ ...statuses, [id]: 'pending' });
      setNotice(isAr ? 'تمت إضافة الصورة إلى قائمة المراجعة.' : 'Photo added to the review queue.');
    }
    setDraft(null);
    setSelectedId(null);
  };
  const deletePhoto = (id: string) => {
    if (!window.confirm(isAr ? 'حذف هذه الصورة نهائياً من المكتبة المحلية؟' : 'Permanently delete this photo from the local library?')) return;
    onSavePhotos(photos.filter((photo) => photo.id !== id));
    const next = { ...statuses }; delete next[id]; persistStatuses(next);
    if (selectedId === id) { setSelectedId(null); setDraft(null); }
  };
  const statusLabel = (status: ReviewStatus) => ({
    pending: isAr ? 'قيد المراجعة' : 'Pending review',
    approved: isAr ? 'معتمدة' : 'Approved',
    rejected: isAr ? 'مرفوضة' : 'Rejected',
    archived: isAr ? 'مؤرشفة' : 'Archived',
  }[status]);
  const statusStyle = (status: ReviewStatus) => ({
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    archived: 'border-slate-600 bg-slate-800 text-slate-300',
  }[status]);

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-5" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><Images className="h-7 w-7" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">SARAYA MEDIA VAULT</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{isAr ? 'مكتبة صور المناسبات' : 'Event Photo Library'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{isAr ? 'صفحة مستقلة؛ أنشئ ألبوماً باسم كل مناسبة واجمع صورها فيه، مع مراجعة الصور قبل النشر.' : 'A dedicated page to create a separate named album for each event and review its photos before publishing.'}</p>
          </div>
        </div>
        <button type="button" onClick={openNew} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"><ImagePlus className="h-4 w-4" />{isAr ? 'إضافة صورة' : 'Add photo'}</button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: isAr ? 'إجمالي الصور' : 'Total photos', value: counts.all, icon: Images },
          { label: isAr ? 'ألبومات المناسبات' : 'Event albums', value: bookings.length + albumOptions.length, icon: Archive },
          { label: isAr ? 'قيد المراجعة' : 'Pending review', value: counts.pending, icon: Clock3 },
          { label: isAr ? 'معتمدة' : 'Approved', value: counts.approved, icon: Check },
          { label: isAr ? 'صور مكررة' : 'Duplicate sources', value: duplicates.size, icon: AlertTriangle },
        ].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between gap-2 text-xs text-slate-400"><span>{item.label}</span><Icon className="h-4 w-4 text-amber-300" /></div><div className="mt-2 text-2xl font-black text-white">{item.value}</div></div>; })}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-black text-white">{isAr ? 'ألبومات المناسبات' : 'Event albums'}</h2><p className="mt-1 text-xs text-slate-500">{isAr ? 'يُنشأ ألبوم مستقل تلقائياً لكل حجز جديد، حتى قبل إضافة الصور.' : 'A separate album is created automatically for every new booking, even before photos are added.'}</p></div><button type="button" onClick={() => setAlbumFilter('all')} className={`min-h-9 rounded-lg border px-3 text-xs font-bold ${albumFilter === 'all' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300'}`}>{isAr ? 'كل الصور' : 'All photos'}</button></div>
        {bookings.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">{isAr ? 'ستظهر ألبومات المناسبات هنا عند إنشاء الحجوزات.' : 'Albums will appear here as bookings are created.'}</div> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{bookings.slice().sort((a, b) => b.date.localeCompare(a.date)).map((booking) => { const count = managed.filter((photo) => photo.bookingId === booking.id).length; const active = albumFilter === `booking:${booking.id}`; const cover = managed.find((photo) => photo.bookingId === booking.id && photo.src); return <button key={booking.id} type="button" onClick={() => { setAlbumFilter(`booking:${booking.id}`); setCategory('all'); setQuery(''); }} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-start transition-colors ${active ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'}`}><div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-950">{cover ? <img src={cover.src} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-amber-300"><Images className="h-6 w-6" /></div>}</div><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-white">{booking.clientName}</span><span className="mt-1 block truncate text-[11px] text-slate-400">{booking.code} · {booking.date}</span><span className="mt-1 block text-[11px] font-semibold text-amber-300">{count} {isAr ? 'صورة' : count === 1 ? 'photo' : 'photos'} · {booking.hallName}</span></span></button>; })}</div>}
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isAr ? 'ابحث بالعنوان أو القاعة أو الوسوم...' : 'Search title, venue, or tags...'} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 ps-10 pe-3 text-sm text-white outline-none focus:border-amber-400" /></label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option value="all">{isAr ? 'كل الحالات' : 'All statuses'}</option><option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option><option value="approved">{isAr ? 'معتمدة' : 'Approved'}</option><option value="rejected">{isAr ? 'مرفوضة' : 'Rejected'}</option><option value="archived">{isAr ? 'الأرشيف' : 'Archived'}</option></select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option value="all">{isAr ? 'كل التصنيفات' : 'All categories'}</option>{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{isAr ? label.ar : label.en}</option>)}</select>
        <select value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)} className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option value="all">{isAr ? 'كل الألبومات' : 'All albums'}</option>{bookings.map((booking) => <option key={booking.id} value={`booking:${booking.id}`}>{albumNameForBooking(booking)}</option>)}{albumOptions.map((album) => <option key={album} value={album}>{album}</option>)}</select>
      </div>

      {notice && <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss notice'}><X className="h-4 w-4" /></button></div>}

      {draft && <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-white">{isAr ? (selectedId ? 'تعديل بيانات الصورة' : 'إضافة صورة للمكتبة') : (selectedId ? 'Edit photo details' : 'Add a photo')}</h2><button type="button" onClick={() => { setDraft(null); setSelectedId(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
          <div className="space-y-3"><label className="block text-xs text-slate-400">{isAr ? 'العنوان بالعربية' : 'Arabic title'}<input value={draft.titleAr} onChange={(e) => setDraft({ ...draft, titleAr: e.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" /></label><label className="block text-xs text-slate-400">{isAr ? 'العنوان بالإنجليزية' : 'English title'}<input value={draft.titleEn} onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" /></label><label className="block text-xs text-slate-400">{isAr ? 'الوصف بالعربية' : 'Arabic caption'}<textarea value={draft.captionAr} onChange={(e) => setDraft({ ...draft, captionAr: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" /></label><label className="block text-xs text-slate-400">{isAr ? 'الوصف بالإنجليزية' : 'English caption'}<textarea value={draft.captionEn} onChange={(e) => setDraft({ ...draft, captionEn: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" /></label></div>
          <div className="space-y-3"><label className="block text-xs text-slate-400">{isAr ? 'ألبوم الحجز' : 'Booking album'}<select value={draft.bookingId || ''} onChange={(e) => { const booking = bookings.find((item) => item.id === e.target.value); setDraft({ ...draft, bookingId: e.target.value || undefined, albumName: booking ? albumNameForBooking(booking) : (isAr ? 'زفاف وأفراح' : 'Weddings') }); }} className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option value="">{isAr ? 'ألبوم عام / بدون حجز' : 'General album / no booking'}</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{albumNameForBooking(booking)}</option>)}</select></label>{!draft.bookingId && <label className="block text-xs text-slate-400">{isAr ? 'اسم الألبوم العام' : 'General album name'}<input value={draft.albumName} onChange={(e) => setDraft({ ...draft, albumName: e.target.value })} placeholder={isAr ? 'مثال: زفاف أحمد - ٢٠/١١' : 'e.g. Ahmed wedding · Nov 20'} className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" /></label>}<label className="block text-xs text-slate-400">{isAr ? 'رابط الصورة' : 'Image URL'}<input value={draft.src.startsWith('data:') ? '' : draft.src} onChange={(e) => setDraft({ ...draft, src: e.target.value })} placeholder="https://..." className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" /></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"><Upload className="h-4 w-4" />{isAr ? 'رفع صورة (حتى 3MB)' : 'Upload image (up to 3MB)'}</button><input ref={fileRef} type="file" accept="image/*" onChange={readImage} className="hidden" /><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as VenuePhoto['category'] })} className="min-h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{isAr ? label.ar : label.en}</option>)}</select></div><p className="text-[11px] leading-5 text-slate-500">{isAr ? 'في النسخة التجريبية تُحفظ الصور داخل تخزين هذا المتصفح فقط، وليست مخزنة على خادم مشترك.' : 'Demo mode: photos are stored only in this browser, not in shared server storage.'}</p><div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">{draft.src ? <img src={draft.src} alt="" className="h-48 w-full object-contain" /> : <div className="flex h-48 items-center justify-center text-slate-600"><Images className="h-10 w-10" /></div>}</div></div>
          <div className="flex flex-col justify-between gap-3"><div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold text-white">{isAr ? 'خطوات النشر' : 'Publishing workflow'}</p><ol className="mt-3 list-inside list-decimal space-y-2 text-xs leading-5 text-slate-400"><li>{isAr ? 'حفظ الصورة' : 'Save the photo'}</li><li>{isAr ? 'مراجعة المحتوى' : 'Review content'}</li><li>{isAr ? 'اعتماد الصورة للعرض' : 'Approve for display'}</li></ol></div><button type="button" onClick={saveDraft} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950"><Save className="h-4 w-4" />{isAr ? 'حفظ الصورة' : 'Save photo'}</button></div>
        </div>
      </div>}

      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-white">{isAr ? 'محتوى المكتبة' : 'Library content'}</h2><p className="mt-1 text-xs text-slate-500">{isAr ? 'اختر ألبوم المناسبة من القائمة، أو أضف صورة وحدد اسم ألبومها.' : 'Filter by event album, or add a photo and assign its album name.'}</p></div><div className="text-xs text-slate-500">{isAr ? 'حجم البيانات التقريبي' : 'Approx. data size'}: <span className="font-bold text-slate-300">{storageLabel}</span></div></div>
      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-sm text-slate-500">{isAr ? 'لا توجد صور مطابقة للبحث.' : 'No photos match your filters.'}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map((photo) => <article key={photo.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <button type="button" onClick={() => openEdit(photo)} className="block w-full text-start" aria-label={isAr ? 'تعديل الصورة' : 'Edit photo'}><div className="relative aspect-[4/3] bg-slate-950">{photo.src ? <img src={photo.src} alt={isAr ? photo.titleAr : photo.titleEn} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-slate-600"><Images className="h-10 w-10" /></div>}<span className={`absolute start-2 top-2 rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyle(photo.reviewStatus || 'pending')}`}>{statusLabel(photo.reviewStatus || 'pending')}</span>{duplicates.has(photo.id) && <span className="absolute end-2 top-2 rounded-full bg-rose-500/90 px-2 py-1 text-[10px] font-bold text-white">{isAr ? 'مصدر مكرر' : 'Duplicate'}</span>}</div><div className="p-3"><h3 className="truncate text-sm font-bold text-white">{isAr ? photo.titleAr : photo.titleEn}</h3><p className="mt-1 line-clamp-2 min-h-8 text-xs leading-5 text-slate-400">{isAr ? photo.captionAr : photo.captionEn}</p>{photo.photoCredit && photo.sourceUrl && <a href={photo.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex text-[10px] font-semibold text-amber-300 underline underline-offset-4">{isAr ? `مصدر وترخيص الصورة: ${photo.photoCredit}` : `Image source & license: ${photo.photoCredit}`}</a>}<p className="mt-2 text-[10px] text-slate-500">{albumNameFor(photo)} · {CATEGORY_LABELS[photo.category]?.[isAr ? 'ar' : 'en'] || photo.category} · {photo.hallNameAr || photo.hallNameEn}</p></div></button>
        <div className="flex flex-wrap gap-2 border-t border-slate-800 p-3">
          {photo.reviewStatus === 'pending' && <button type="button" onClick={() => setStatus(photo.id, 'approved')} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/15 px-2 text-[11px] font-bold text-emerald-300"><Check className="h-3.5 w-3.5" />{isAr ? 'اعتماد' : 'Approve'}</button>}
          {photo.reviewStatus !== 'approved' && photo.reviewStatus !== 'archived' && <button type="button" onClick={() => setStatus(photo.id, 'rejected')} className="min-h-9 rounded-lg border border-rose-500/20 px-2 text-[11px] font-bold text-rose-300">{isAr ? 'رفض' : 'Reject'}</button>}
          {photo.reviewStatus === 'approved' && <button type="button" onClick={() => setStatus(photo.id, 'pending')} className="min-h-9 rounded-lg border border-amber-500/20 px-2 text-[11px] font-bold text-amber-300">{isAr ? 'إعادة للمراجعة' : 'Review again'}</button>}
          <button type="button" onClick={() => setStatus(photo.id, photo.reviewStatus === 'archived' ? 'pending' : 'archived')} title={isAr ? 'أرشفة/استعادة' : 'Archive/restore'} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-slate-700 px-2 text-[11px] text-slate-300"><Archive className="h-3.5 w-3.5" />{isAr ? (photo.reviewStatus === 'archived' ? 'استعادة' : 'أرشفة') : (photo.reviewStatus === 'archived' ? 'Restore' : 'Archive')}</button>
          <button type="button" onClick={() => deletePhoto(photo.id)} title={isAr ? 'حذف الصورة' : 'Delete photo'} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-500/20 px-2 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
          {photo.src && /^https?:/i.test(photo.src) && <a href={photo.src} target="_blank" rel="noreferrer" title={isAr ? 'فتح الصورة الأصلية' : 'Open original'} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-700 px-2 text-slate-400"><ExternalLink className="h-3.5 w-3.5" /></a>}
        </div>
      </article>)}</div>}
      <footer className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{isAr ? 'وضع تجريبي: البيانات محفوظة محلياً على هذا المتصفح فقط. التخزين المشترك بين الموظفين يحتاج ربط قاعدة بيانات وتخزين ملفات.' : 'Demo mode: data is saved only in this browser. Shared staff access requires a database and file storage integration.'}</span><span>{filtered.length} / {managed.length} {isAr ? 'صورة' : 'photos'}</span></footer>
    </section>
  );
}
