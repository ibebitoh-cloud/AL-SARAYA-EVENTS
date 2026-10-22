// The "Powered by" credit for Dali Studio, styled with its brand kit: a gold geometric D,
// the name in spaced capitals with a gold gradient, and the tagline underneath.

const CSS = `
.dali-credit{display:inline-flex;flex-direction:column;align-items:flex-start;gap:4px;font-family:'Readex Pro',sans-serif;vertical-align:middle}
.dali-credit[dir='rtl']{align-items:flex-end}
.dali-mark{display:inline-flex;align-items:center;gap:8px}
.dali-logo{width:18px;height:18px;flex-shrink:0}
.dali-name{font-weight:700;font-size:13px;letter-spacing:.3em;text-transform:uppercase;background:linear-gradient(135deg,#E9CF94 0%,#C49A52 50%,#8C6A2E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dali-credit[dir='rtl'] .dali-name{letter-spacing:.08em}
.dali-tag{font-size:9px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:#F4F1EA;opacity:.6}
`;

export function DaliCredit({ isAr }: { isAr: boolean }) {
  return (
    <span className="dali-credit" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <span className="dali-mark">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="dali-logo">
          <defs>
            <linearGradient id="dali-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E9CF94" />
              <stop offset="0.5" stopColor="#C49A52" />
              <stop offset="1" stopColor="#8C6A2E" />
            </linearGradient>
          </defs>
          <path d="M3 3h11l7 7v4l-7 7H3z" fill="url(#dali-gold)" />
          <path d="M7 7h4.5l3.5 3.5v3L11.5 17H7z" fill="#0D0D0F" />
        </svg>
        <span className="dali-name">{isAr ? 'دالي ستوديو' : 'DALI STUDIO'}</span>
      </span>
      <span className="dali-tag">IDEAS INTO DIGITAL</span>
    </span>
  );
}
