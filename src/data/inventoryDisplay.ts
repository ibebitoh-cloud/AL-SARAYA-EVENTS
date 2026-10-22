import type { InventoryItem } from '../types/venueSystem';

/** Rental stock customers may see. Cleaning and operations supplies stay internal unless staff tick "show on website". */
export const isCustomerItem = (item: InventoryItem) =>
  item.showOnWebsite ?? !['cleaning', 'operations'].includes(item.category);
