import fullWhite from '../assets/images/logo/elsaraya-logo-white.png';
import fullDark from '../assets/images/logo/elsaraya-logo-dark.png';
import horizontalWhite from '../assets/images/logo/elsaraya-logo-horizontal-white.png';
import horizontalDark from '../assets/images/logo/elsaraya-logo-horizontal-dark.png';
import markWhite from '../assets/images/logo/elsaraya-mark-white.png';
import markDark from '../assets/images/logo/elsaraya-mark-dark.png';

/** The ELSARAYA EVENTS logo. White sits on dark surfaces, dark on light ones. */
export const BRAND_LOGOS = {
  full: { white: fullWhite, dark: fullDark },
  horizontal: { white: horizontalWhite, dark: horizontalDark },
  mark: { white: markWhite, dark: markDark },
} as const;

type BrandLogoProps = {
  /** `full` is the stacked lockup, `horizontal` puts the mark beside the name, `mark` is the symbol alone. */
  variant?: keyof typeof BRAND_LOGOS;
  tone?: 'white' | 'dark';
  /** Show the white logo on screen and the dark one on paper (for dark documents that get printed). */
  printDark?: boolean;
  className?: string;
};

export function BrandLogo({ variant = 'horizontal', tone = 'white', printDark = false, className = '' }: BrandLogoProps) {
  const set = BRAND_LOGOS[variant];
  const alt = 'ELSARAYA EVENTS';
  if (printDark) {
    return <>
      <img src={set.white} alt={alt} className={`print:hidden ${className}`} draggable={false} />
      <img src={set.dark} alt="" aria-hidden="true" className={`hidden print:block ${className}`} draggable={false} />
    </>;
  }
  return <img src={set[tone]} alt={alt} className={className} draggable={false} />;
}
