// Single place for store identity. Update these when the client confirms
// their domain, inbox and socials — every page reads from here.
export const BRAND: {
  name: string; tagline: string; description: string; domain: string; email: string;
  phone: string; instagram: string; freeShippingThreshold: number; shippingFee: number;
} = {
  name: "Takers Club",
  tagline: "Wear your own crown.",
  description: "Everyday clothing, made with intention.",
  domain: "takersclub.store",
  email: "hello@takersclub.store", // TODO: confirm real inbox
  phone: "", // TODO: e.g. "+234 800 000 0000" — hidden on the contact page while empty
  instagram: "", // TODO: e.g. "https://instagram.com/takersclub" — link is hidden while empty
  // Must match the shipping rule in backend/routes/payment.js
  freeShippingThreshold: 250000,
  shippingFee: 2500,
};
