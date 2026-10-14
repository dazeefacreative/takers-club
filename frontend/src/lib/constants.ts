// Categories that sell by color (e.g. caps) instead of by size.
export const COLOR_CATEGORY_SLUG = "baseball-caps";

// Storefront categories — slugs must match the `categories` table.
export const CATEGORIES = [
  { label: "Hoodies", slug: "hoodies" },
  { label: "Shirts", slug: "shirts" },
  { label: "Baseball Caps", slug: "baseball-caps" },
] as const;
