import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionLink, MotionButton, arrowShiftVariants, tapScale, fadeHoverVariants } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { COLOR_CATEGORY_SLUG } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import logoSrc from "@/imports/takers-logo.png";

const solidButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const emptyForm = {
  email: "",
  first_name: "", last_name: "", phone: "",
  address_line1: "", address_line2: "", city: "", state: "", country: "Nigeria", postal_code: "",
};

// Remembered in this browser only, so returning shoppers don't retype their address.
const CHECKOUT_INFO_KEY = "tc_checkout_info";

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...emptyForm });
  const [saveInfo, setSaveInfo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingFee = subtotal >= BRAND.freeShippingThreshold ? 0 : BRAND.shippingFee;
  const total = subtotal + shippingFee;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_INFO_KEY);
      if (saved) setForm((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* ignore malformed storage */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setError("");

    try {
      try {
        if (saveInfo) localStorage.setItem(CHECKOUT_INFO_KEY, JSON.stringify(form));
        else localStorage.removeItem(CHECKOUT_INFO_KEY);
      } catch { /* storage unavailable — non-fatal */ }

      const { data } = await api.post("/payment/initialize", {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          size: i.size,
          quantity: i.quantity,
        })),
      });

      window.location.href = data.payment_url;
    } catch (err: any) {
      setError(err.response?.data?.error || "Payment initialization failed. Please try again.");
      setLoading(false);
    }
  };

  const inputCls = "w-full h-[52px] border border-border px-4 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors";
  const labelCls = "block text-[10px] tracking-[0.12em] uppercase mb-2";
  const legendCls = "font-display text-[26px] leading-none mb-5";

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center px-6 bg-[var(--cream)]">
        <ShoppingBag size={40} strokeWidth={1} className="text-muted-foreground" />
        <p className="font-display text-2xl">Your cart is empty.</p>
        <MotionButton
          onClick={() => navigate("/shop")}
          initial="rest" whileHover="hover" whileTap={tapScale}
          variants={solidButtonVariants}
          className="text-white px-6 h-[54px] text-[13px] font-medium"
        >
          Shop the collection
        </MotionButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 md:px-[4.2vw] h-[72px] flex items-center justify-between">
        <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants} aria-label={`${BRAND.name} home`}>
          <img src={logoSrc} alt={BRAND.name} className="h-7 w-auto" />
        </MotionLink>
        <MotionLink to="/cart" initial="rest" whileHover="hover" variants={fadeHoverVariants}
          className="text-[12px] font-medium">
          Back to cart
        </MotionLink>
      </header>

      <div className="grid md:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="px-6 md:px-[6vw] py-12 md:py-16 order-2 md:order-1">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">Secure guest checkout</p>
          <h1 className="font-display font-normal text-[48px] md:text-[72px] leading-[0.9] tracking-[-0.02em] mb-3">
            Almost yours.
          </h1>
          <p className="font-display text-[15px] text-muted-foreground mb-10">No account needed. Just the essentials.</p>

          <fieldset className="border-t border-border pt-8 mb-8">
            <legend className="sr-only">Contact</legend>
            <p className={legendCls}>Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2">
                <span className={labelCls}>Email</span>
                <input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className={labelCls}>First name</span>
                <input required autoComplete="given-name" value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className={labelCls}>Last name</span>
                <input required autoComplete="family-name" value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2">
                <span className={labelCls}>Phone number</span>
                <input required type="tel" autoComplete="tel" placeholder="080 0000 0000" value={form.phone}
                  onChange={(e) => set("phone", e.target.value)} className={inputCls} />
              </label>
            </div>
          </fieldset>

          <fieldset className="border-t border-border pt-8 mb-8">
            <legend className="sr-only">Delivery</legend>
            <p className={legendCls}>Delivery</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2">
                <span className={labelCls}>Address</span>
                <input required autoComplete="address-line1" placeholder="Street and house number" value={form.address_line1}
                  onChange={(e) => set("address_line1", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2">
                <span className={labelCls}>Apartment, landmark (optional)</span>
                <input autoComplete="address-line2" value={form.address_line2}
                  onChange={(e) => set("address_line2", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className={labelCls}>City / Town</span>
                <input required autoComplete="address-level2" placeholder="Ikeja" value={form.city}
                  onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className={labelCls}>State</span>
                <select required autoComplete="address-level1" value={form.state}
                  onChange={(e) => set("state", e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="" disabled>Select state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </fieldset>

          <div className="flex items-start gap-3 mb-8">
            <input type="checkbox" id="save-info" checked={saveInfo}
              onChange={(e) => setSaveInfo(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-black" />
            <label htmlFor="save-info" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              Remember my details on this device for next time.
            </label>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <MotionButton
            type="submit"
            disabled={loading}
            initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
            variants={solidButtonVariants}
            className="w-full flex items-center justify-between text-white px-6 h-[56px] text-[13px] font-medium disabled:opacity-50"
          >
            {loading ? "Redirecting to payment…" : (
              <>
                Pay ₦{total.toLocaleString()}
                <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
              </>
            )}
          </MotionButton>
          <p className="text-center text-muted-foreground text-[10px] mt-3">
            Secured by Paystack · Card, bank transfer & USSD
          </p>
        </form>

        <aside className="bg-[var(--cream)] px-6 md:px-[4vw] py-10 md:py-16 order-1 md:order-2">
          <h2 className="font-display text-[28px] leading-none mb-6">Your order</h2>
          <div className="mb-6">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.size}`} className="grid grid-cols-[64px_1fr_auto] gap-4 items-center border-b border-border py-4">
                <div className="relative w-16 h-20 bg-muted">
                  <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-primary-foreground text-[10px] flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-wide text-[12px] font-medium leading-snug">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {item.category_slug === COLOR_CATEGORY_SLUG ? "Color" : "Size"}: {item.size}
                  </p>
                </div>
                <p className="text-[13px] shrink-0">₦{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? "Free" : <>₦{shippingFee.toLocaleString()}</>}</span>
            </div>
            <div className="flex justify-between font-display text-xl border-t border-border pt-4 mt-4">
              <span>Total</span><span>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
