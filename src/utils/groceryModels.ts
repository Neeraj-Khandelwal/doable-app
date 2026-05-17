export interface GroceryItem {
  id: string;
  family_id: string;
  name: string;
  is_purchased: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export const MAX_GROCERY_ITEMS = 100;
export const MAX_ITEM_NAME_LENGTH = 100;
