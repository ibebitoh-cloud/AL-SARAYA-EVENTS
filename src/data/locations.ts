import type { Booking, Hall, LocationId, PriceLocationId } from '../types/venueSystem';

export const LOCATIONS: { id: LocationId; nameAr: string; nameEn: string }[] = [
  { id: 'arcane', nameAr: 'فندق اركان', nameEn: 'Arcane Hotel' },
  { id: 'porto', nameAr: 'بورتو سعيد', nameEn: 'Porto Said' },
];

export const locationName = (id: LocationId | undefined, isAr: boolean) => {
  const loc = LOCATIONS.find((l) => l.id === id);
  return loc ? (isAr ? loc.nameAr : loc.nameEn) : '';
};

/** Halls saved before locations existed get their location from the city label. */
export const hallLocation = (hall: Hall | undefined): LocationId =>
  hall?.locationId || (/porto|بورتو/i.test(`${hall?.city || ''} ${hall?.cityAr || ''}`) ? 'porto' : 'arcane');

/** Places used for service prices: Arcane, Porto, and any other place (the client's own venue, outside halls). */
export const PRICE_LOCATIONS: { id: PriceLocationId; nameAr: string; nameEn: string }[] = [
  ...LOCATIONS,
  { id: 'other', nameAr: 'مكان آخر', nameEn: 'Other location' },
];

export const priceLocationName = (id: PriceLocationId, isAr: boolean) => {
  const loc = PRICE_LOCATIONS.find((l) => l.id === id);
  return loc ? (isAr ? loc.nameAr : loc.nameEn) : '';
};

/** A booking with no ELSARAYA hall (client's venue or a typed-in place) uses the "other location" service prices. */
export const bookingPriceLocation = (booking: Pick<Booking, 'hallId' | 'locationId'>): PriceLocationId =>
  booking.hallId ? booking.locationId || 'arcane' : 'other';
