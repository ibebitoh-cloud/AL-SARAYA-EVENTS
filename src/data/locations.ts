import type { Hall, LocationId } from '../types/venueSystem';

export const LOCATIONS: { id: LocationId; nameAr: string; nameEn: string }[] = [
  { id: 'arcane', nameAr: 'فندق آركين', nameEn: 'Arcane Hotel' },
  { id: 'porto', nameAr: 'بورتو سعيد', nameEn: 'Porto Said' },
];

export const locationName = (id: LocationId | undefined, isAr: boolean) => {
  const loc = LOCATIONS.find((l) => l.id === id);
  return loc ? (isAr ? loc.nameAr : loc.nameEn) : '';
};

/** Halls saved before locations existed get their location from the city label. */
export const hallLocation = (hall: Hall | undefined): LocationId =>
  hall?.locationId || (/porto|بورتو/i.test(`${hall?.city || ''} ${hall?.cityAr || ''}`) ? 'porto' : 'arcane');
