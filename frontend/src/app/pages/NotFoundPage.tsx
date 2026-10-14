import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { MotionLink, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { motion } from "framer-motion";

const solidButtonVariants = {
  rest: { backgroundColor: "#0a0a0a" },
  hover: { backgroundColor: "rgba(10,10,10,0.8)" },
};

export default function NotFoundPage() {
  useDocumentTitle("Page Not Found");

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <SiteHeader />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6 py-20">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">Error 404</p>
        <h1 className="text-4xl md:text-5xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Page not <em className="font-light italic">found.</em>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <MotionLink to="/"
          initial="rest" whileHover="hover" whileTap={tapScale} variants={solidButtonVariants}
          className="flex items-center gap-3 text-white px-10 py-4 text-xs tracking-widest uppercase font-semibold">
          Back to Home <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
        </MotionLink>
      </div>
      <SiteFooter />
    </div>
  );
}
