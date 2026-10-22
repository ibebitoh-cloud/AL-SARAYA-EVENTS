import { useEffect, useState } from 'react';

// The "Powered by" credit for Dali Studio, from its brand kit: the geometric D mark, the name
// in spaced capitals and the tagline underneath. `white` sits on dark surfaces, `dark` on light
// ones and paper, and `gold` is the full-colour version.

const CSS = `
.dali-credit{display:inline-flex;flex-direction:column;align-items:center;gap:4px;font-family:'Readex Pro',sans-serif;vertical-align:middle;text-decoration:none}
.dali-mark{display:inline-flex;align-items:center;gap:8px}
.dali-logo{width:20px;height:20px;flex-shrink:0;object-fit:contain}
.dali-name{font-weight:700;font-size:13px;letter-spacing:.3em;text-transform:uppercase}
.dali-credit[data-tone='gold'] .dali-name{background:linear-gradient(135deg,#E9CF94 0%,#C49A52 50%,#8C6A2E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dali-credit[data-tone='white'] .dali-name{color:#F4F1EA}
.dali-credit[data-tone='dark'] .dali-name{color:#0D0D0F}
.dali-tag{font-size:9px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;opacity:.6}
.dali-credit[data-tone='dark'] .dali-tag{color:#0D0D0F}
.dali-credit:not([data-tone='dark']) .dali-tag{color:#F4F1EA}
.dali-lead{font-size:9px;margin-top:2px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;opacity:.55}
.dali-credit[data-tone='dark'] .dali-lead{color:#0D0D0F}
.dali-credit:not([data-tone='dark']) .dali-lead{color:#F4F1EA}
`;

const MARKS = { gold: '/brand/dali-mark.png', white: '/brand/dali-mark-white.png', dark: '/brand/dali-mark-dark.png' };

type Tone = keyof typeof MARKS;

export function DaliCredit({ tone = 'white', lead = true, tagline = true, contact = false, className = '' }: { tone?: Tone; lead?: boolean; tagline?: boolean; contact?: boolean; className?: string }) {
  return (
    <span className={`dali-credit ${className}`} data-tone={tone} dir="ltr">
      <style>{CSS}</style>
      {lead && <span className="dali-lead">Powered by</span>}
      <span className="dali-mark">
        <img src={MARKS[tone]} alt="" aria-hidden="true" className="dali-logo" />
        <span className="dali-name">DALI STUDIO</span>
      </span>
      {tagline && <span className="dali-tag">IDEAS INTO DIGITAL</span>}
      {contact && <span className="dali-lead">Mohamed Alaa · +20 114 647 5759</span>}
    </span>
  );
}

/** Only the D, for tight spots such as the bottom of a popup. */
export function DaliMark({ tone = 'white', className = '' }: { tone?: Tone; className?: string }) {
  return <img src={MARKS[tone]} alt="DALI STUDIO" title="Powered by DALI STUDIO" className={className} draggable={false} />;
}

// Popups are fixed, full-screen overlays that catch clicks. Decorative layers opt out of clicks.
const isPopupOpen = () => Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0')).some((el) => {
  if (el.closest('[data-dali-ignore]')) return false;
  const style = getComputedStyle(el);
  return style.pointerEvents !== 'none' && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.zIndex || 0) >= 50;
});

/**
 * The D centred at the bottom of the screen while any popup is open, and a dark
 * "Powered by DALI STUDIO" line at the bottom of every printed page.
 */
export function DaliOverlayCredit() {
  const [popupOpen, setPopupOpen] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setPopupOpen(isPopupOpen())); };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <>
    {popupOpen && (
      <div data-dali-ignore className="pointer-events-none fixed inset-x-0 bottom-2 z-[1000] flex justify-center print:hidden">
        <span dir="ltr" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 backdrop-blur-md">
          <span className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#F4F1EA]/60">Powered by</span>
          <DaliMark className="h-3.5 w-3.5" />
        </span>
      </div>
    )}
    <div data-dali-ignore className="pointer-events-none fixed inset-x-0 bottom-0 hidden justify-center pb-1 print:flex">
      <DaliCredit tone="dark" tagline={false} lead />
    </div>
  </>;
}
