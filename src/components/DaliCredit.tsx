// The "Powered by" credit for Dali Studio, styled with its brand kit: the gold D mark from
// their logo files, the name in spaced capitals with a gold gradient, and the tagline underneath.

const CSS = `
.dali-credit{display:inline-flex;flex-direction:column;align-items:flex-start;gap:4px;font-family:'Readex Pro',sans-serif;vertical-align:middle}
.dali-credit[dir='rtl']{align-items:flex-end}
.dali-mark{display:inline-flex;align-items:center;gap:8px}
.dali-logo{width:20px;height:20px;flex-shrink:0;object-fit:contain}
.dali-name{font-weight:700;font-size:13px;letter-spacing:.3em;text-transform:uppercase;background:linear-gradient(135deg,#E9CF94 0%,#C49A52 50%,#8C6A2E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dali-credit[dir='rtl'] .dali-name{letter-spacing:.08em}
.dali-tag{font-size:9px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:#F4F1EA;opacity:.6}
`;

export function DaliCredit({ isAr }: { isAr: boolean }) {
  return (
    <span className="dali-credit" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <span className="dali-mark">
        <img src="/brand/dali-mark.png" alt="" aria-hidden="true" className="dali-logo" />
        <span className="dali-name">{isAr ? 'دالي ستوديو' : 'DALI STUDIO'}</span>
      </span>
      <span className="dali-tag">IDEAS INTO DIGITAL</span>
    </span>
  );
}
