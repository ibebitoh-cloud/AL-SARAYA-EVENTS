import fullWhite from '../assets/images/logo/elsaraya-logo-white.png';
import fullDark from '../assets/images/logo/elsaraya-logo-dark.png';
import horizontalWhite from '../assets/images/logo/elsaraya-logo-horizontal-white.png';
import horizontalDark from '../assets/images/logo/elsaraya-logo-horizontal-dark.png';
import markWhite from '../assets/images/logo/elsaraya-mark-white.png';
import markDark from '../assets/images/logo/elsaraya-mark-dark.png';
import fullGold from '../assets/images/logo/elsaraya-logo-gold.png';
import horizontalGold from '../assets/images/logo/elsaraya-logo-horizontal-gold.png';
import markGold from '../assets/images/logo/elsaraya-mark-gold.png';

/** The ELSARAYA EVENTS logo. White sits on dark surfaces; gold (brand gradient) is the on-screen logo for light mode; dark is for paper. */
export const BRAND_LOGOS = {
  full: { white: fullWhite, dark: fullDark, gold: fullGold },
  horizontal: { white: horizontalWhite, dark: horizontalDark, gold: horizontalGold },
  mark: { white: markWhite, dark: markDark, gold: markGold },
} as const;

type BrandLogoProps = {
  /** `full` is the stacked lockup, `horizontal` puts the mark beside the name, `mark` is the symbol alone. */
  variant?: keyof typeof BRAND_LOGOS;
  /** `auto` (default) follows the screen theme: white in dark mode, gold in light mode. */
  tone?: 'white' | 'dark' | 'gold' | 'auto';
  /** Follow the screen theme on screen and show the dark logo on paper (for documents that get printed). */
  printDark?: boolean;
  className?: string;
};

export function BrandLogo({ variant = 'horizontal', tone = 'auto', printDark = false, className = '' }: BrandLogoProps) {
  const set = BRAND_LOGOS[variant];
  const alt = 'ELSARAYA EVENTS';
  if (tone === 'auto' || printDark) {
    // Both images are in the page; CSS in index.css shows the one that matches html[data-theme].
    const screen = printDark ? 'print:hidden' : '';
    return <>
      <img src={set.white} alt={alt} className={`brand-logo-on-dark ${screen} ${className}`} draggable={false} />
      <img src={set.gold} alt={alt} className={`brand-logo-on-light ${screen} ${className}`} draggable={false} />
      {printDark && <img src={set.dark} alt="" aria-hidden="true" className={`hidden print:block ${className}`} draggable={false} />}
    </>;
  }
  return <img src={set[tone]} alt={alt} className={className} draggable={false} />;
}
