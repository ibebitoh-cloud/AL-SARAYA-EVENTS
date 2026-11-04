// Smaller copies (768 px wide) of the built-in venue photos, for phones and tablets.
// Use as <img src={src} srcSet={photoSrcSet(src)} sizes="…">: the browser picks the 768 px copy
// on small screens and the full 1200 px photo on large ones. Photos without a small copy
// (uploads, links) return undefined and load as before.
import ballroom from '../assets/images/alsaraya_grand_ballroom_1791458716707.webp';
import ballroomSm from '../assets/images/alsaraya_grand_ballroom_1791458716707-768.webp';
import kosha from '../assets/images/alsaraya_royal_kosha_1791458732633.webp';
import koshaSm from '../assets/images/alsaraya_royal_kosha_1791458732633-768.webp';
import dining from '../assets/images/alsaraya_banquet_dining_1791458748323.webp';
import diningSm from '../assets/images/alsaraya_banquet_dining_1791458748323-768.webp';
import corporate from '../assets/images/saraya_corporate_summit_1791459214689.webp';
import corporateSm from '../assets/images/saraya_corporate_summit_1791459214689-768.webp';
import wedding from '../assets/images/saraya_couture_wedding_1791459224733.webp';
import weddingSm from '../assets/images/saraya_couture_wedding_1791459224733-768.webp';
import garden from '../assets/images/alsaraya_garden_terrace_1791458767479.webp';
import gardenSm from '../assets/images/alsaraya_garden_terrace_1791458767479-768.webp';

const SMALL: Record<string, string> = {
  [ballroom]: ballroomSm,
  [kosha]: koshaSm,
  [dining]: diningSm,
  [corporate]: corporateSm,
  [wedding]: weddingSm,
  [garden]: gardenSm,
};

export const photoSrcSet = (src?: string): string | undefined =>
  src && SMALL[src] ? `${SMALL[src]} 768w, ${src} 1200w` : undefined;

/** The 768 px copy of a built-in photo, or the same src when there is none. */
export const smallPhoto = (src: string): string => SMALL[src] || src;
