import { useNavigate } from "react-router";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import { getImageUrl } from "@/lib/media";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { MotionLink, MotionButton, ghostHoverVariants, arrowShiftVariants, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { COLOR_CATEGORY_SLUG } from "@/lib/constants";
import { BRAND } from "@/lib/brand";

const solidButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

export default function CartPage() {
  useDocumentTitle("Your Cart");
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const shippingFee = subtotal >= BRAND.freeShippingThreshold ? 0 : BRAND.shippingFee;
  const total = subtotal + shippingFee;

  if (!items.length) {
    return (
      <>
        <SiteHeader />        
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-6 bg-[var(--cream)]">
          <ShoppingBag size={44} strokeWidth={1} className="text-muted-foreground" />
          <h1 className="font-display font-normal text-[40px] md:text-[56px] leading-none tracking-[-0.02em]">Your cart is empty.</h1>
          <p className="font-display text-[15px]">Your next crown is waiting.</p>
          <MotionLink to="/shop"
            initial="rest" whileHover="hover" whileTap={tapScale}
            variants={solidButtonVariants}
            className="flex items-center gap-6 text-white px-6 h-[54px] text-[13px] font-medium">
            Shop the collection <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
          </MotionLink>
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        <div className="bg-[var(--cream)] px-6 md:px-[4.2vw] pt-12 pb-12 md:pt-16">
          <div className="max-w-[1440px] mx-auto">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">Your selection</p>
            <h1 className="font-display font-normal text-[48px] md:text-[80px] leading-[0.9] tracking-[-0.02em]">
              Cart <sup className="font-sans text-sm align-top tracking-normal">{items.reduce((a, i) => a + i.quantity, 0)}</sup>
            </h1>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] py-10 grid md:grid-cols-[1fr_360px] gap-12">
          {/* Items */}
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 border-b border-border pb-6">
                <MotionLink to={`/product/${item.slug}`} whileTap={tapScaleSm} className="shrink-0">
                  <div className="w-24 h-32 bg-secondary overflow-hidden">
                    <img src={getImageUrl(item.image)}
                      alt={item.name} draggable={false} onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-cover protected-img" />
                  </div>
                </MotionLink>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                        {item.size && `${item.category_slug === COLOR_CATEGORY_SLUG ? "Color" : "Size"} ${item.size}`}
                      </p>
                      <MotionLink to={`/product/${item.slug}`} whileTap={tapScaleSm}>
                        <h3 className="font-wide text-[13px] font-medium">{item.name}</h3>
                      </MotionLink>
                    </div>
                    <MotionButton onClick={() => removeItem(item.id)}
                      initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                      className="shrink-0">
                      <X size={14} />
                    </MotionButton>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border">
                      <MotionButton onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                        className="w-8 h-8 flex items-center justify-center">
                        <Minus size={10} />
                      </MotionButton>
                      <span className="w-8 h-8 flex items-center justify-center text-xs">{item.quantity}</span>
                      <MotionButton onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                        className="w-8 h-8 flex items-center justify-center">
                        <Plus size={10} />
                      </MotionButton>
                    </div>
                    <p className="text-sm font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="h-fit bg-secondary p-6">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <span className="text-foreground">Free</span> : <>₦{shippingFee.toLocaleString()}</>}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Add ₦{(BRAND.freeShippingThreshold - subtotal).toLocaleString()} more for free shipping
                </p>
              )}
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            <MotionButton
              onClick={() => navigate("/checkout")}
              initial="rest" whileHover="hover" whileTap={tapScale}
              variants={solidButtonVariants}
              className="w-full flex items-center justify-between text-white px-6 h-[54px] text-[13px] font-medium">
              Checkout
              <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
            </MotionButton>
            <MotionLink to="/shop" initial="rest" whileHover="hover" variants={ghostHoverVariants}
              className="block text-center text-[10px] tracking-widest uppercase mt-4">
              Continue Shopping
            </MotionLink>
            <p className="text-center text-[10px] text-muted-foreground mt-4">Secure guest checkout. No account required.</p>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
