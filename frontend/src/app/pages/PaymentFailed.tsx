import { MotionLink, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

export default function PaymentFailed() {
  useDocumentTitle("Payment Cancelled");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ fontFamily: "var(--font-sans)" }}>
      <div className="w-16 h-16 border-2 border-muted-foreground rounded-full flex items-center justify-center">
        <span className="text-muted-foreground text-2xl">✕</span>
      </div>
      <h1 className="text-3xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Payment cancelled</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        Your order was not placed and no charge was made.
      </p>
      <div className="flex gap-4">
        <MotionLink to="/checkout"
          initial="rest" whileHover="hover" whileTap={tapScale} variants={solidButtonVariants}
          className="text-xs tracking-widest uppercase text-primary-foreground px-8 py-3 inline-block">
          Try Again
        </MotionLink>
        <MotionLink to="/cart"
          initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
          className="text-xs tracking-widest uppercase border border-foreground px-8 py-3 inline-block">
          Back to Cart
        </MotionLink>
      </div>
    </div>
  );
}
