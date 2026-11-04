import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown, ImagePlus, KeyRound, Sparkles, RotateCcw } from 'lucide-react';
import type { Booking, Hall, Language, ServiceDefinition } from '../types/venueSystem';
import { makeTr, eventTypeLabel } from '../utils/tr';
import { bookingTotals } from '../data/recordFields';
import { locationName } from '../data/locations';
import { useContractTerms } from './ContractTermsEditor';
import { hashProKey, isProposalLicensed, PROPOSAL_LICENSE_KEY, PROPOSAL_PRO } from '../data/proFeatures';
import { BRAND_LOGOS } from './BrandLogo';
import { sound } from '../utils/soundEffects';
import setup3d from '../assets/images/proposal/setup-3d.jpg';
import coverPhoto from '../assets/images/proposal/cover.jpg';
import hallPhoto from '../assets/images/proposal/hall.jpg';
import koshaPhoto from '../assets/images/proposal/kosha.jpg';
import diningPhoto from '../assets/images/proposal/dining.jpg';

interface Company { phone?: string; whatsapp?: string; locationsAr?: string; locationsEn?: string }

interface ProposalExportModalProps {
  booking: Booking;
  onClose: () => void;
  language?: Language;
  halls?: Hall[];
  services?: ServiceDefinition[];
  company?: Company;
  /** True for the built-in sample proposal (no real booking). */
  isSample?: boolean;
}

/** A sample booking so the proposal can be shown before any real booking exists. */
export const sampleProposalBooking = (isAr: boolean): Booking => {
  const date = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10);
  const line = (id: string, name: string, quantity: number, unitPrice: number) => ({ id, serviceId: id, name, quantity, unitPrice, totalPrice: quantity * unitPrice, costPrice: 0, totalCost: 0 });
  const services = [
    line('sample-kosha', isAr ? 'كوشة ملكية بالورود الأبيض' : 'Royal kosha with white roses', 1, 38000),
    line('sample-flowers', isAr ? 'تنسيق ورد الطاولات' : 'Table flower centrepieces', 25, 900),
    line('sample-arch', isAr ? 'ممر وقوس دخول' : 'Entrance arch & aisle', 1, 12000),
    line('sample-dj', isAr ? 'دي جي ونظام صوت' : 'DJ & sound system', 1, 18000),
    line('sample-light', isAr ? 'إضاءة مسرح وحلبة رقص' : 'Stage & dance-floor lighting', 1, 15000),
    line('sample-photo', isAr ? 'تصوير فوتو وفيديو' : 'Photo & video coverage', 1, 22000),
    line('sample-cake', isAr ? 'تورتة الزفاف' : 'Wedding cake', 1, 9500),
    line('sample-buffet', isAr ? 'بوفيه عشاء مفتوح' : 'Open dinner buffet', 250, 650),
  ];
  const base = { basePrice: 85000, services, discountPercent: 5 };
  const { total } = bookingTotals(base);
  return {
    id: 'sample-proposal', code: 'BK-DEMO-001', clientName: isAr ? 'نور ويوسف' : 'Nour & Youssef', clientPhone: '', eventType: 'wedding',
    date, startTime: '19:00', endTime: '01:00', hallId: 'sample', hallName: isAr ? 'قاعة اركان' : 'Arcane Hall', guestCount: 250,
    ...base, totalPrice: total, deposit: 40000, paidAmount: 0, remainingAmount: total, securityDeposit: 10000, securityDepositStatus: 'held',
    status: 'tentative', assignedStaff: [], suppliesCost: 0, directExpenses: 0, locationId: 'arcane', packageName: isAr ? 'الباقة الملكية الذهبية' : 'Royal Gold Package',
    eventDetails: { brideName: isAr ? 'نور' : 'Nour', groomName: isAr ? 'يوسف' : 'Youssef' },
  } as Booking;
};

const SAMPLE_DESC: Record<string, [string, string]> = {
  'sample-kosha': ['كوشة 8×4 م، ورد طبيعي أبيض، إضاءة خلفية دافئة', '8×4 m stage, fresh white roses, warm back lighting'],
  'sample-flowers': ['25 طاولة، شمعدانات ذهبية وورد طبيعي', '25 tables, gold candelabras and fresh flowers'],
  'sample-arch': ['قوس ورد 3.6 م وسجادة ممر ذهبية', '3.6 m rose arch with a gold aisle runner'],
  'sample-dj': ['6 ساعات، سماعات احترافية وميكروفونات لاسلكية', '6 hours, pro speakers, wireless mics'],
  'sample-light': ['موفينج هيد، إضاءة دافئة، دخان أرضي لدخلة العروسين', 'Moving heads, warm wash, low fog for the entrance'],
  'sample-photo': ['مصوران، فيلم سينمائي 5 دقائق وألبوم', '2 photographers, 5-min cinematic film and album'],
  'sample-cake': ['5 أدوار، تصميم حسب اختياركم', '5 tiers, design of your choice'],
  'sample-buffet': ['قائمة شرقي وغربي، مشروبات وحلويات', 'Oriental & international menu, drinks and desserts'],
};

type IconKey = 'hall' | 'crown' | 'flower' | 'arch' | 'music' | 'light' | 'camera' | 'cake' | 'dish' | 'screen' | 'chair' | 'star';
const ICONS: Record<IconKey, string> = {
  hall: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
  crown: '<path d="M3 18h18M4 15 3 6l5 4 4-6 4 6 5-4-1 9H4Z"/>',
  flower: '<circle cx="12" cy="9" r="2.5"/><path d="M12 6.5C12 3 15 3 15 6s-3 3-3 3m0-2.5C12 3 9 3 9 6s3 3 3 3m0 2.5V21m0-4c-3 0-5-2-5-4 3 0 5 2 5 4Zm0 0c3 0 5-2 5-4-3 0-5 2-5 4Z"/>',
  arch: '<path d="M5 21V10a7 7 0 0 1 14 0v11M9 21V11a3 3 0 0 1 6 0v10M3 21h18"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  cake: '<path d="M4 21h16M5 21v-6h14v6M7 15v-4h10v4M12 11V8m0-3v.5"/>',
  dish: '<path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6m-2 0h4"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 21h8M12 16v5"/>',
  chair: '<path d="M7 21v-8m10 8v-8M6 13h12M8 13V4h8v9"/>',
  star: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7Z"/>',
};
const CATEGORY_ICON: Record<string, IconKey> = { buffet: 'dish', kosha: 'crown', decor: 'flower', lighting: 'light', sound_dj: 'music', photography: 'camera', screen: 'screen', hospitality: 'dish', tables_chairs: 'chair', other: 'star' };
const guessIcon = (name: string): IconKey => {
  const n = name.toLowerCase();
  if (/kosha|كوش/.test(n)) return 'crown';
  if (/flower|rose|ورد|زهور|decor|ديكور/.test(n)) return 'flower';
  if (/arch|قوس|ممر/.test(n)) return 'arch';
  if (/dj|sound|music|صوت|دي جي|موسيق/.test(n)) return 'music';
  if (/light|إضاء|اضاء|ليزر/.test(n)) return 'light';
  if (/photo|video|camera|تصوير|فيديو/.test(n)) return 'camera';
  if (/cake|تورت|كيك/.test(n)) return 'cake';
  if (/buffet|dinner|food|بوفيه|عشاء|ضياف/.test(n)) return 'dish';
  if (/screen|شاش/.test(n)) return 'screen';
  return 'star';
};

const PROPOSAL_CSS = `
.pp-sheet{--black:#0D0D0F;--ivory:#F4F1EA;--stone:#B9B4AA;--g1:#E9CF94;--g2:#C49A52;--g3:#8C6A2E;--gold:linear-gradient(135deg,#E9CF94 0%,#C49A52 50%,#8C6A2E 100%);--ink:#2A2722;--soft:#7A7468;font-family:'Readex Pro','Cairo',sans-serif;color:var(--black);-webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.35}
.pp-sheet *{box-sizing:border-box;margin:0;padding:0}
.pp-page{page:proposal;width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;break-after:page;margin:0 auto 6mm;box-shadow:0 2mm 8mm rgba(0,0,0,.25)}
.pp-page:last-child{break-after:auto}
.pp-gold{background:var(--gold);-webkit-background-clip:text;background-clip:text;color:transparent}
.pp-eyebrow{font-size:8.5pt;letter-spacing:.32em;text-transform:uppercase;color:var(--g3);font-weight:600}
.pp-sheet[dir=rtl] .pp-eyebrow{letter-spacing:0;font-size:10pt}
.pp-h2{font-size:23pt;font-weight:600;margin:2.5mm 0 2mm;letter-spacing:-.01em;color:var(--black)}
.pp-muted{color:var(--soft)}
.pp-inner{padding:9mm 18mm 0}
.pp-hdr{display:flex;align-items:center;justify-content:space-between;padding:10mm 18mm 0}
.pp-hdr img{height:8mm}
.pp-hdr span{font-size:7.5pt;letter-spacing:.2em;color:var(--soft);text-transform:uppercase}
.pp-edge{position:absolute;inset:0 0 auto 0;height:1.6mm;background:var(--gold)}
.pp-foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;align-items:center;justify-content:space-between;gap:4mm;font-size:7.5pt;color:var(--soft);border-top:.25mm solid rgba(140,106,46,.35);padding-top:3mm}
.pp-dali{display:flex;align-items:center;gap:2mm;white-space:nowrap}
.pp-dali img{height:4.5mm}
.pp-dali b{color:var(--black);font-weight:600;letter-spacing:.08em}
.pp-dali i{font-style:normal;letter-spacing:.2em;color:var(--g3);font-size:6.5pt}
.pp-demo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:6}
.pp-demo span{transform:rotate(-32deg);font-size:92pt;font-weight:700;letter-spacing:.12em;color:rgba(196,154,82,.16);border:2mm solid rgba(196,154,82,.16);padding:2mm 10mm;border-radius:6mm}
.pp-demo small{position:absolute;bottom:17mm;font-size:7.5pt;color:#8C6A2E;background:#FBF6EA;border:.3mm solid rgba(196,154,82,.5);padding:1mm 3mm;border-radius:5mm}
.pp-staff{position:absolute;top:12mm;inset-inline-end:12mm;background:#B3261E;color:#fff;font-size:7pt;font-weight:700;letter-spacing:.15em;padding:1.2mm 3mm;border-radius:5mm;z-index:5}
/* cover */
.pp-cover .pp-photo{position:absolute;inset:0 0 auto 0;height:146mm;background:center 35%/cover no-repeat}
.pp-cover .pp-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 55%,#fff 100%)}
.pp-cover .pp-frame{position:absolute;inset:9mm;border:.35mm solid rgba(196,154,82,.75);z-index:2}
.pp-cover .pp-frame::after{content:'';position:absolute;inset:1.6mm;border:.2mm solid rgba(196,154,82,.35)}
.pp-cover .pp-content{position:absolute;inset:136mm 0 0 0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 22mm;z-index:3}
.pp-cover .pp-logo{width:36mm;margin-bottom:6mm}
.pp-cover .pp-kind{font-size:9.5pt;letter-spacing:.5em;text-transform:uppercase;color:var(--g3);font-weight:500}
.pp-sheet[dir=rtl] .pp-cover .pp-kind{letter-spacing:0;font-size:13pt}
.pp-cover .pp-names{font-size:38pt;font-weight:600;line-height:1.15;margin:4mm 0 3mm}
.pp-cover .pp-amp{font-weight:300;padding:0 3mm}
.pp-cover .pp-lede{font-size:10.5pt;color:var(--soft);max-width:125mm;line-height:1.6}
.pp-facts{display:flex;margin-top:10mm;border-top:.3mm solid rgba(196,154,82,.6);border-bottom:.3mm solid rgba(196,154,82,.6)}
.pp-fact{padding:4.5mm 7mm;min-width:38mm}
.pp-fact+.pp-fact{border-inline-start:.3mm solid rgba(196,154,82,.35)}
.pp-fact small{display:block;font-size:7pt;letter-spacing:.25em;text-transform:uppercase;color:var(--g3);margin-bottom:1.2mm}
.pp-sheet[dir=rtl] .pp-fact small{letter-spacing:0;font-size:8.5pt}
.pp-fact span{font-size:11.5pt;font-weight:500;color:var(--black)}
.pp-ref{margin-top:10mm;font-size:8pt;color:var(--soft);letter-spacing:.12em}
/* setup */
.pp-render{margin-top:6mm;border-radius:3mm;overflow:hidden;height:122mm;background:#F6F2EA center/cover no-repeat;position:relative;border:.35mm solid rgba(196,154,82,.45)}
.pp-tag{position:absolute;top:4mm;inset-inline-start:4mm;background:var(--gold);color:var(--black);font-size:7.5pt;font-weight:700;padding:1.4mm 3mm;border-radius:10mm;letter-spacing:.1em}
.pp-stats{display:grid;grid-template-columns:repeat(4,1fr);margin-top:5mm;background:#FBF8F1;border:.35mm solid rgba(196,154,82,.45);border-radius:3mm}
.pp-stat{padding:4mm 5mm}
.pp-stat+.pp-stat{border-inline-start:.25mm solid rgba(196,154,82,.35)}
.pp-stat b{display:block;font-size:15pt;font-weight:600}
.pp-stat small{font-size:7.5pt;color:var(--soft)}
.pp-photos{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:3mm;margin-top:3mm;height:46mm}
.pp-photos div{border-radius:2.5mm;background:center/cover no-repeat;position:relative}
.pp-photos div span{position:absolute;bottom:2mm;inset-inline-start:2.5mm;font-size:7pt;color:var(--black);background:rgba(255,255,255,.88);padding:.8mm 2.2mm;border-radius:5mm}
/* package */
.pp-pkg-head{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm}
.pp-badge{border:.35mm solid rgba(196,154,82,.7);background:#FBF6EA;padding:3mm 5mm;border-radius:2.5mm;text-align:end}
.pp-badge small{display:block;font-size:7pt;color:var(--g3);letter-spacing:.15em;text-transform:uppercase}
.pp-badge b{font-size:12pt;font-weight:600}
.pp-items{margin-top:6mm;border-top:.3mm solid rgba(140,106,46,.4)}
.pp-item{display:grid;grid-template-columns:11mm 1fr auto;align-items:center;gap:4mm;padding:3mm 0;border-bottom:.25mm solid rgba(140,106,46,.2)}
.pp-ic{width:11mm;height:11mm;border-radius:2.5mm;background:#FBF6EA;border:.3mm solid rgba(196,154,82,.55);display:flex;align-items:center;justify-content:center;overflow:hidden;background-size:cover;background-position:center}
.pp-ic svg{width:5.5mm;height:5.5mm}
.pp-item h4{font-size:10.5pt;font-weight:600}
.pp-item p{font-size:8pt;color:var(--soft);margin-top:.6mm}
.pp-q{font-size:8.5pt;color:var(--g3);font-weight:500;text-align:end;white-space:nowrap}
.pp-p{font-size:10pt;font-weight:600;text-align:end;white-space:nowrap}
.pp-p small{display:block;font-size:7pt;color:var(--soft);font-weight:400}
.pp-totals{margin-top:5mm;margin-inline-start:auto;width:80mm;font-size:9.5pt}
.pp-totals div{display:flex;justify-content:space-between;padding:1.6mm 0}
.pp-totals .pp-disc{color:#2F7A4A}
.pp-totals .pp-grand{border-top:.4mm solid var(--g2);margin-top:1.5mm;padding-top:3mm;font-size:13pt;font-weight:700}
.pp-incl{margin-top:6mm;display:flex;gap:4mm;align-items:center;background:#FBF6EA;border:.3mm solid rgba(196,154,82,.45);border-radius:3mm;padding:4mm 5mm;font-size:8.5pt;color:var(--ink)}
/* terms */
.pp-lock{margin-top:6mm;background:#FBF8F1;border:.35mm solid rgba(196,154,82,.6);border-radius:3.5mm;padding:7mm 8mm;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm;position:relative;overflow:hidden}
.pp-lock::before{content:'';position:absolute;inset:0 0 auto 0;height:1.2mm;background:var(--gold)}
.pp-lock small{display:block;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:var(--g3);margin-bottom:1.5mm}
.pp-sheet[dir=rtl] .pp-lock small{letter-spacing:0;font-size:8.5pt}
.pp-lock b{font-size:15pt;font-weight:600}
.pp-lock .pp-note{grid-column:1/-1;font-size:8.5pt;color:var(--ink);border-top:.25mm solid rgba(196,154,82,.35);padding-top:4mm;line-height:1.5}
.pp-lock .pp-note strong{color:var(--g3);font-weight:600}
.pp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:6mm}
.pp-step{border:.3mm solid rgba(140,106,46,.35);border-radius:3mm;padding:4mm}
.pp-step em{font-style:normal;display:inline-flex;width:6mm;height:6mm;border-radius:50%;background:var(--gold);color:var(--black);font-size:8pt;font-weight:700;align-items:center;justify-content:center}
.pp-step h5{font-size:9.5pt;margin:2mm 0 1mm;font-weight:600}
.pp-step p{font-size:8pt;color:var(--soft);line-height:1.45}
.pp-terms{margin-top:4mm;columns:2;column-gap:8mm;font-size:7.8pt;line-height:1.5;color:var(--ink)}
.pp-terms li{list-style:none;break-inside:avoid;margin-bottom:2.2mm;display:flex;gap:2mm}
.pp-terms li b{color:var(--g2);font-weight:600;min-width:3.5mm}
.pp-sign{display:grid;grid-template-columns:1fr 1fr;gap:14mm;margin-top:8mm;font-size:8.5pt;color:var(--soft)}
.pp-sign div{border-top:.3mm solid var(--black);padding-top:2mm}
.pp-contact{margin-top:6mm;display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;gap:4mm}
.pp-cta{background:var(--gold);color:var(--black);font-weight:700;padding:3mm 6mm;border-radius:10mm;white-space:nowrap}
.pp-closing{margin-top:10mm;text-align:center}
.pp-closing img{height:11mm}
.pp-closing p{font-size:13pt;font-weight:500;margin-top:3mm}
@media print{
  @page proposal{size:A4;margin:0}
  body:has(.proposal-print-root)>*:not(.proposal-print-root){display:none!important}
  body:has(.proposal-print-root){background:#fff!important}
  .proposal-print-root{position:static!important;display:block!important;overflow:visible!important;background:#fff!important;backdrop-filter:none!important;padding:0!important}
  .proposal-print-root .pp-noprint{display:none!important}
  .proposal-print-root .pp-scroll{overflow:visible!important;padding:0!important;height:auto!important;background:none!important}
  .proposal-print-root .pp-zoom{zoom:1!important}
  .pp-page{margin:0!important;box-shadow:none!important}
  /* Gradient text leaves hairlines in some PDF engines, so paper gets solid gold. */
  .pp-gold{background:none!important;color:#A9792F!important;-webkit-text-fill-color:#A9792F}
}`;

const toLocalDigits = (value: number | string, isAr: boolean) => (isAr ? Number(value).toLocaleString('ar-EG') : Number(value).toLocaleString('en-US'));

export function ProposalExportModal({ booking, onClose, language = 'ar', halls = [], services = [], company, isSample = false }: ProposalExportModalProps) {
  const { tr } = makeTr(language);
  const [terms] = useContractTerms();
  const [lang, setLang] = useState<Language>(language);
  const [staffCopy, setStaffCopy] = useState(false);
  const [showDeposit, setShowDeposit] = useState(true);
  const [deposit, setDeposit] = useState<number>(booking.deposit || Math.round((booking.totalPrice || 0) * 0.25));
  const [holdUntil, setHoldUntil] = useState(() => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  const [render, setRender] = useState<string>(setup3d);
  const [licensed, setLicensed] = useState(isProposalLicensed);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [zoom, setZoom] = useState(0.5);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Scale the A4 preview to the width of the screen.
  useEffect(() => {
    const fit = () => { const w = scrollRef.current?.clientWidth || window.innerWidth; setZoom(Math.min(0.9, Math.max(0.3, (w - 24) / 794))); };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevTitle = document.title;
    document.title = `ELSARAYA-proposal-${booking.code}`;
    return () => { window.removeEventListener('keydown', onKey); document.title = prevTitle; };
  }, [onClose, booking.code]);

  const p = useMemo(() => {
    const ar = lang === 'ar';
    const t = (a: string, e: string) => (ar ? a : e);
    const egp = (n: number) => (ar ? `${toLocalDigits(n, true)} ج.م` : `EGP ${toLocalDigits(n, false)}`);
    const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
      const dt = new Date(`${d}T12:00:00`);
      return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(ar ? 'ar-EG' : 'en-GB', opts);
    };
    const hall = halls.find((h) => h.id === booking.hallId);
    const hallName = (ar ? hall?.name : hall?.nameEn || hall?.name) || booking.hallName;
    const place = locationName(booking.locationId, ar);
    const d = booking.eventDetails || {};
    const couple = d.brideName && d.groomName ? [d.brideName, d.groomName] as const : null;
    const title = couple ? null : d.companyName || booking.clientName;
    const kind = booking.eventType === 'wedding' ? t('عرض حفل زفاف', 'A wedding proposal for') : booking.eventType === 'engagement' ? t('عرض حفل خطوبة', 'An engagement proposal for') : t(`عرض ${eventTypeLabel(booking.eventType, true)}`, `A ${eventTypeLabel(booking.eventType, false).toLowerCase()} proposal for`);
    const totals = bookingTotals(booking);
    const balanceDue = (() => { const dt = new Date(`${booking.date}T12:00:00`); dt.setDate(dt.getDate() - (terms.balanceDays || 7)); return Number.isNaN(dt.getTime()) ? booking.date : dt.toISOString().slice(0, 10); })();
    const hallPhotos = [hall?.photoUrl || hall?.photo || hallPhoto, koshaPhoto, diningPhoto];
    const items = booking.services.map((s) => {
      const def = services.find((x) => x.id === s.serviceId);
      const icon: IconKey = def ? CATEGORY_ICON[def.category] || guessIcon(s.name) : guessIcon(s.name);
      return { ...s, icon, photo: def?.photoUrl, desc: def?.description || (booking.id === 'sample-proposal' ? SAMPLE_DESC[s.serviceId]?.[ar ? 0 : 1] || '' : '') };
    });
    return { ar, t, egp, fmt, hallName, place, couple, title, kind, totals, balanceDue, hallPhotos, items };
  }, [lang, booking, halls, services, terms.balanceDays]);

  const { ar, t, egp, fmt } = p;
  const phone = company?.whatsapp || company?.phone || '';
  const termList = (ar ? terms.ar : terms.en).slice(0, 8);
  const num = (n: number) => toLocalDigits(n, ar);

  const icon = (k: IconKey, photo?: string) => photo
    ? <div className="pp-ic" style={{ backgroundImage: `url("${photo}")` }} />
    : <div className="pp-ic" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="#8C6A2E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>` }} />;

  const footer = (n: number) => (
    <div className="pp-foot">
      <span>ELSARAYA EVENTS · {t('عرض رقم', 'Proposal')} {booking.code} · {n}/4</span>
      <span className="pp-dali"><img src="/brand/dali-mark.png" alt="" /><span>{t('صُمم بواسطة', 'Crafted by')} <b>DALI STUDIO</b> · <i>IDEAS INTO DIGITAL</i></span></span>
    </div>
  );
  const overlays = (
    <>
      {staffCopy && <div className="pp-staff">{t('نسخة الموظفين · بالأسعار', 'STAFF COPY · WITH PRICES')}</div>}
      {!licensed && <div className="pp-demo"><span>DEMO</span><small>{t('نسخة تجريبية · فعّل العروض من DALI STUDIO لإزالة العلامة', 'Demo version · activate Proposals from DALI STUDIO to remove this mark')}</small></div>}
    </>
  );
  const hdr = (label: string) => <div className="pp-hdr"><img src={BRAND_LOGOS.horizontal.gold} alt="ELSARAYA EVENTS" /><span>{label}</span></div>;

  const activate = async () => {
    try {
      if ((await hashProKey(keyInput)) === PROPOSAL_PRO.activationKeyHash) {
        try { window.localStorage.setItem(PROPOSAL_LICENSE_KEY, PROPOSAL_PRO.activationKeyHash); } catch { /* private mode */ }
        setLicensed(true); setKeyError(''); sound.success();
      } else setKeyError(tr('المفتاح غير صحيح', 'That key is not valid'));
    } catch { setKeyError(tr('تعذّر التحقق على هذا الجهاز', 'Could not check the key on this device')); }
  };

  const pickPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Shrink to 1400 px JPEG so the PDF stays small enough for WhatsApp.
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1400 / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        if (!ctx) { setRender(String(reader.result)); return; }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        setRender(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const field = 'rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white';
  const chip = (on: boolean) => `rounded-lg px-3 py-1.5 text-xs font-bold ${on ? 'bg-amber-400 text-slate-950' : 'border border-slate-700 text-slate-300 hover:text-white'}`;

  return createPortal(
    <div className="proposal-print-root fixed inset-0 z-[1001] flex flex-col bg-black/80 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style>{PROPOSAL_CSS}</style>
      {/* Controls (not printed) */}
      <div className="pp-noprint shrink-0 border-b border-slate-800 bg-slate-950 p-3 text-start">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <div className="me-auto min-w-0">
            <div className="flex items-center gap-2 text-sm font-black text-white"><FileDown className="h-4 w-4 text-amber-400" />{tr('تصدير عرض للعميل', 'Export proposal')}{isSample && <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">{tr('عرض تجريبي ببيانات نموذجية', 'Sample with demo data')}</span>}</div>
            <div className="truncate text-[11px] text-slate-400">{booking.code} · {booking.clientName} · {booking.date}</div>
          </div>
          <button type="button" onClick={() => { sound.click(650); window.print(); }} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow"><FileDown className="h-4 w-4" />{tr('حفظ PDF / مشاركة', 'Save PDF / share')}</button>
          <button type="button" onClick={() => { sound.tick(); onClose(); }} aria-label={tr('إغلاق', 'Close')} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mx-auto mt-2.5 flex max-w-5xl flex-wrap items-center gap-2 text-xs text-slate-300">
          <div className="flex gap-1">
            <button type="button" className={chip(!staffCopy)} onClick={() => setStaffCopy(false)}>{tr('نسخة العميل (بدون أسعار)', 'Client copy (no prices)')}</button>
            <button type="button" className={chip(staffCopy)} onClick={() => setStaffCopy(true)}>{tr('نسخة الموظفين (بالأسعار)', 'Staff copy (prices)')}</button>
          </div>
          <div className="flex gap-1">
            <button type="button" className={chip(lang === 'ar')} onClick={() => setLang('ar')}>عربي</button>
            <button type="button" className={chip(lang === 'en')} onClick={() => setLang('en')}>English</button>
          </div>
          <label className="flex items-center gap-1.5">{tr('العربون', 'Deposit')}<input type="number" min={0} value={deposit} onChange={(e) => setDeposit(Math.max(0, Number(e.target.value) || 0))} className={`${field} w-24`} /></label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={showDeposit} onChange={(e) => setShowDeposit(e.target.checked)} />{tr('إظهار العربون للعميل', 'Show deposit to client')}</label>
          <label className="flex items-center gap-1.5">{tr('الحجز المؤقت حتى', 'Hold until')}<input type="date" value={holdUntil} onChange={(e) => setHoldUntil(e.target.value)} className={field} /></label>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 font-bold hover:text-white"><ImagePlus className="h-3.5 w-3.5 text-amber-400" />{tr('صورة 3D من الاستوديو', '3D photo from the studio')}</button>
          {render !== setup3d && <button type="button" onClick={() => setRender(setup3d)} className="flex items-center gap-1 text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />{tr('الصورة الافتراضية', 'Default picture')}</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {!licensed && (
          <div className="mx-auto mt-2.5 flex max-w-5xl flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="me-auto">{tr('نسخة تجريبية: كل صفحة عليها علامة DEMO. أدخل مفتاح التفعيل من DALI STUDIO لإزالتها.', 'Demo version: every page has a DEMO mark. Enter the activation key from DALI STUDIO to remove it.')}</span>
            <input value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setKeyError(''); }} placeholder="XXXX-XXXX-XXXX-XXXX" dir="ltr" className={`${field} w-44 font-mono`} />
            <button type="button" onClick={activate} className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 font-black text-slate-950"><KeyRound className="h-3.5 w-3.5" />{tr('تفعيل', 'Activate')}</button>
            {keyError && <span className="w-full text-rose-300">{keyError}</span>}
          </div>
        )}
      </div>

      {/* A4 pages: shown scaled on screen, printed at full size */}
      <div ref={scrollRef} className="pp-scroll min-h-0 flex-1 overflow-y-auto bg-neutral-800 px-3 py-4">
        <div className="pp-zoom" style={{ zoom }}>
          <div className="pp-sheet" dir={ar ? 'rtl' : 'ltr'} lang={lang}>
            {/* 1 · Cover */}
            <section className="pp-page pp-cover">
              <div className="pp-photo" style={{ backgroundImage: `url("${coverPhoto}")` }} />
              <div className="pp-frame" />{overlays}
              <div className="pp-content">
                <img className="pp-logo" src={BRAND_LOGOS.full.gold} alt="ELSARAYA EVENTS" />
                <div className="pp-kind">{p.kind}</div>
                <div className="pp-names">{p.couple ? <><span className="pp-gold">{p.couple[0]}</span><span className="pp-amp pp-gold">&amp;</span><span className="pp-gold">{p.couple[1]}</span></> : <span className="pp-gold">{p.title}</span>}</div>
                <div className="pp-lede">{t('ليلة صُممت خصيصاً لكم، بكل تفاصيلها، من الكوشة حتى آخر لحظة.', 'An evening designed around you, every detail from the kosha to the last dance.')}</div>
                <div className="pp-facts">
                  <div className="pp-fact"><small>{t('التاريخ', 'Date')}</small><span>{fmt(booking.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                  <div className="pp-fact"><small>{t('المكان', 'Venue')}</small><span>{p.hallName}{p.place ? ` · ${p.place}` : ''}</span></div>
                  <div className="pp-fact"><small>{t('المدعوون', 'Guests')}</small><span>{num(booking.guestCount)}</span></div>
                </div>
                <div className="pp-ref">{t('عرض', 'PROPOSAL')} {booking.code} · {t('صالح حتى', 'VALID UNTIL')} {fmt(holdUntil, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              {footer(1)}
            </section>

            {/* 2 · Setup */}
            <section className="pp-page"><div className="pp-edge" />{overlays}
              {hdr(t('تصميم الحفل', 'Your setup'))}
              <div className="pp-inner">
                <div className="pp-eyebrow">{t('تصميم ثلاثي الأبعاد', 'Your evening in 3D')}</div>
                <h2 className="pp-h2">{t('هكذا ستبدو ليلتكم', 'This is how your night will look')}</h2>
                <p className="pp-muted" style={{ fontSize: '9.5pt', maxWidth: '150mm', lineHeight: 1.55 }}>{t('صممنا القاعة بالكامل في استوديو ELSARAYA ثلاثي الأبعاد: أماكن الطاولات والكوشة وحلبة الرقص والإضاءة، لتروا الحفل قبل يومه.', 'We laid out the whole hall in the ELSARAYA 3D studio: tables, kosha, dance floor and lighting, so you can see the night before it happens.')}</p>
                <div className="pp-render" style={{ backgroundImage: `url("${render}")` }}><span className="pp-tag">3D PRO</span></div>
                <div className="pp-stats">
                  <div className="pp-stat"><b>{num(booking.guestCount)}</b><small>{t('مدعو', 'Guests')}</small></div>
                  <div className="pp-stat"><b>{num(Math.max(1, Math.ceil(booking.guestCount / 10)))}</b><small>{t('طاولة دائرية', 'Round tables')}</small></div>
                  <div className="pp-stat"><b>{booking.startTime} – {booking.endTime}</b><small>{t('موعد الحفل', 'Event time')}</small></div>
                  <div className="pp-stat"><b>{num(p.items.length)}</b><small>{t('خدمة مختارة', 'Chosen services')}</small></div>
                </div>
                <div className="pp-eyebrow" style={{ marginTop: '7mm' }}>{t('القاعة', 'The hall')}</div>
                <div className="pp-photos">
                  <div style={{ backgroundImage: `url("${p.hallPhotos[0]}")` }}><span>{p.hallName}</span></div>
                  <div style={{ backgroundImage: `url("${p.hallPhotos[1]}")` }}><span>{t('الكوشة', 'Kosha')}</span></div>
                  <div style={{ backgroundImage: `url("${p.hallPhotos[2]}")` }}><span>{t('العشاء', 'Dinner')}</span></div>
                </div>
              </div>
              {footer(2)}
            </section>

            {/* 3 · Package */}
            <section className="pp-page"><div className="pp-edge" />{overlays}
              {hdr(t('الباقة', 'Your package'))}
              <div className="pp-inner">
                <div className="pp-pkg-head">
                  <div><div className="pp-eyebrow">{t('ما يشمله العرض', 'What’s included')}</div><h2 className="pp-h2">{t('كل ما اخترتموه', 'Everything you chose')}</h2></div>
                  {booking.packageName && <div className="pp-badge"><small>{t('الباقة', 'Package')}</small><b className="pp-gold">{booking.packageName}</b></div>}
                </div>
                <div className="pp-items">
                  <div className="pp-item">{icon('hall')}<div><h4>{t(`حجز ${p.hallName}`, `${p.hallName} booking`)}</h4><p>{booking.startTime} – {booking.endTime} · {t('تكييف، طاولات وكراسي، طاقم خدمة', 'Air conditioning, tables & chairs, service staff')}</p></div>
                    {staffCopy ? <div className="pp-p">{egp(booking.basePrice)}</div> : <div className="pp-q">{t('مشمول', 'Included')}</div>}</div>
                  {p.items.map((s) => (
                    <div className="pp-item" key={s.id}>{icon(s.icon, s.photo)}<div><h4>{s.name}</h4>{s.desc && <p>{s.desc}</p>}</div>
                      {staffCopy
                        ? <div className="pp-p">{egp(s.totalPrice)}{s.quantity > 1 && <small>{num(s.quantity)} × {egp(s.unitPrice)}</small>}</div>
                        : <div className="pp-q">{s.quantity > 1 ? `× ${num(s.quantity)}` : t('مشمول', 'Included')}</div>}
                    </div>
                  ))}
                </div>
                {staffCopy ? (
                  <div className="pp-totals">
                    <div><span>{t('الإجمالي قبل الخصم', 'Subtotal')}</span><span>{egp(p.totals.subtotal)}</span></div>
                    {p.totals.percent > 0 && <div className="pp-disc"><span>{t('خصم', 'Discount')} {num(p.totals.percent)}%</span><span>− {egp(p.totals.discount)}</span></div>}
                    <div className="pp-grand"><span>{t('إجمالي العرض', 'Total')}</span><span>{egp(p.totals.total)}</span></div>
                  </div>
                ) : (
                  <div className="pp-incl"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8C6A2E" strokeWidth="1.8"><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7Z" /><path d="m9 12 2 2 4-4" /></svg><span><b>{t('باقة متكاملة بسعر واحد.', 'One complete package, one price.')}</b> {t('سيشرح لكم منسق الحفل التكلفة بالتفصيل عند الاجتماع.', 'Your event coordinator will walk you through the full cost in person.')}</span></div>
                )}
              </div>
              {footer(3)}
            </section>

            {/* 4 · Booking & terms */}
            <section className="pp-page"><div className="pp-edge" />{overlays}
              {hdr(t('الحجز والشروط', 'Booking & terms'))}
              <div className="pp-inner">
                <div className="pp-eyebrow">{t('تثبيت الموعد', 'Lock in your date')}</div>
                <h2 className="pp-h2">{t('موعدكم محجوز مؤقتاً', 'Your date is on hold for you')}</h2>
                <div className="pp-lock">
                  {(showDeposit || staffCopy) && deposit > 0 && <div><small>{t('العربون', 'Deposit')}</small><b className="pp-gold">{egp(deposit)}</b></div>}
                  <div><small>{t('آخر موعد للتثبيت', 'Hold expires')}</small><b>{fmt(holdUntil, { day: 'numeric', month: 'long' })}</b></div>
                  <div><small>{t('سداد المتبقي قبل', 'Balance due by')}</small><b>{fmt(p.balanceDue, { day: 'numeric', month: 'long' })}</b></div>
                  <div className="pp-note">{t('ادفعوا العربون قبل', 'Pay the deposit before')} <strong>{fmt(holdUntil)}</strong> {t('ليُثبَّت تاريخ', 'and')} <strong>{fmt(booking.date, { day: 'numeric', month: 'long', year: 'numeric' })}</strong> {t('باسمكم نهائياً. بعد هذا الموعد قد يُتاح التاريخ لعملاء آخرين.', 'is locked in your name. After that, the date may be offered to other clients.')}{staffCopy && booking.securityDeposit > 0 && <> {t('تأمين مسترد', 'Refundable security deposit')}: <strong>{egp(booking.securityDeposit)}</strong>.</>}</div>
                </div>
                <div className="pp-steps">
                  <div className="pp-step"><em>{num(1)}</em><h5>{t('ادفعوا العربون', 'Pay the deposit')}</h5><p>{t('نقداً في مكتبنا أو بتحويل بنكي / إنستاباي.', 'Cash at our office, bank transfer or InstaPay.')}</p></div>
                  <div className="pp-step"><em>{num(2)}</em><h5>{t('وقّعوا العقد', 'Sign the contract')}</h5><p>{t('نجهز العقد الرسمي بنفس تفاصيل هذا العرض.', 'We prepare the official contract with the details in this proposal.')}</p></div>
                  <div className="pp-step"><em>{num(3)}</em><h5>{t('اجتماع التنسيق', 'Planning meeting')}</h5><p>{t('نراجع معاً التصميم ثلاثي الأبعاد والتفاصيل الأخيرة.', 'We go over the 3D design and the final details together.')}</p></div>
                </div>
                <div className="pp-eyebrow" style={{ marginTop: '7mm' }}>{t('الشروط الأساسية', 'Key terms')}</div>
                <div className="pp-terms"><ol>{termList.map((x, i) => <li key={i}><b>{num(i + 1)}.</b><span>{x}</span></li>)}</ol></div>
                <div className="pp-sign"><div>{t('توقيع العميل', 'Client signature')}</div><div>{t('عن ELSARAYA EVENTS', 'For ELSARAYA EVENTS')}</div></div>
                <div className="pp-contact"><span className="pp-muted">{t('للاستفسار والحجز', 'Questions or ready to book?')}{phone && <> · {t('هاتف', 'Phone')}: <b style={{ color: 'var(--black)' }} dir="ltr">{phone}</b></>}</span><span className="pp-cta">{t('ثبّتوا موعدكم', 'Lock in your date')}</span></div>
                <div className="pp-closing"><img src={BRAND_LOGOS.mark.gold} alt="" /><p className="pp-gold">{t('يسعدنا أن نكون جزءاً من ليلتكم', 'We can’t wait to be part of your night')}</p></div>
              </div>
              {footer(4)}
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
