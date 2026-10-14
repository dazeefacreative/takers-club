// ═══════════════════════════════════════════════════════════
// PaymentSuccess.tsx
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import api from "@/lib/api";
import { useCart } from "@/app/context/CartContext";
import { MotionLink, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

const solidButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

export function PaymentSuccess() {
  useDocumentTitle("Order Confirmation");
  const [params] = useSearchParams();
  const ref = params.get("ref") || params.get("reference") || "";
  const [status, setStatus] = useState<"verifying" | "paid" | "failed">("verifying");
  const [order, setOrder] = useState<any>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!ref) { setStatus("failed"); return; }
    api.get(`/payment/verify/${ref}`)
      .then(({ data }) => {
        setOrder(data.order);
        if (data.status === "paid") {
          clearCart();
          setStatus("paid");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [ref]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-widest uppercase animate-pulse">
          Confirming your payment…
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center">
          <span className="text-red-400 text-2xl">✕</span>
        </div>
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Payment not confirmed</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          We couldn't confirm your payment. If money was deducted, please contact us with reference: <strong>{ref}</strong>
        </p>
        <MotionLink to="/checkout" initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
          className="text-xs tracking-widest uppercase border border-foreground px-8 py-3 inline-block">
          Try Again
        </MotionLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 bg-[var(--cream)]">
      <div className="w-[72px] h-[72px] border border-foreground rounded-full flex items-center justify-center mb-8">
        <span className="text-foreground text-2xl">✓</span>
      </div>
      <p className="text-[10px] tracking-widest uppercase mb-5">Order {order?.order_number} confirmed</p>
      <h1 className="font-display font-normal text-[52px] md:text-[96px] leading-[0.9] tracking-[-0.03em] max-w-[900px] mb-6">
        Your crown is on its way.
      </h1>
      <p className="font-display text-[17px] leading-relaxed max-w-[540px] mb-8">
        We’ll send a confirmation and tracking details to {order?.email || "your email"} as soon as your order leaves the studio.
      </p>
      <MotionLink to="/shop" initial="rest" whileHover="hover" whileTap={tapScale} variants={solidButtonVariants}
        className="flex items-center gap-2 text-white px-8 h-[54px] text-[13px] font-medium">
        Continue shopping
      </MotionLink>
    </div>
  );
}

export default PaymentSuccess;
