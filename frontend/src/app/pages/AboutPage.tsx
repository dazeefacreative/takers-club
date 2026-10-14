import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { BRAND } from "@/lib/brand";
import groupImage from "@/imports/lifestyle-group.webp";
import capImage from "@/imports/lifestyle-cap.webp";

const values = [
  { title: "Fewer, better pieces", body: "Durable fabrics and thoughtful fits — staples made to stay in rotation, not to be replaced next season." },
  { title: "Small runs", body: "We design and produce in limited editions. Less waste, more attention on every piece that leaves the studio." },
  { title: "Made for everyday", body: "Relaxed, unisex cuts built for moving through the city on your own terms." },
];

const ctaButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

export default function AboutPage() {
  useDocumentTitle("About", `Not made for the moment. Made for yours. The story behind ${BRAND.name}.`);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="grid md:grid-cols-[44.6%_1fr] md:min-h-[min(47vw,640px)]">
        <div className="bg-[var(--cream)] flex flex-col justify-center px-6 md:px-[4.2vw] py-14 order-2 md:order-1">
          <p className="text-[10px] tracking-widest uppercase mb-6">Our story</p>
          <h1 className="font-display font-normal text-[52px] md:text-[clamp(52px,5.4vw,80px)] leading-[0.9] tracking-[-0.02em] mb-8">
            Not made for the moment.<br />Made for yours.
          </h1>
          <p className="font-display text-[16px] leading-relaxed max-w-[440px]">
            We believe what you wear should feel natural, useful, and unmistakably you. That means durable fabrics, thoughtful fits, and fewer, better pieces.
          </p>
        </div>
        <div className="relative overflow-hidden bg-muted min-h-[56vh] md:min-h-0 order-1 md:order-2">
          <img src={groupImage} alt="Three friends in Takers Club tees walking down a Lagos street"
            className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </section>

      {/* Values */}
      <section className="grid md:grid-cols-2">
        <div className="relative overflow-hidden bg-muted min-h-[420px]">
          <img src={capImage} alt="Man in a black Takers Club cap" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <Reveal className="bg-[var(--ink)] text-white flex flex-col justify-center px-8 md:px-[6vw] py-16 md:py-24">
          <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-10">What we stand for</p>
          <div className="space-y-10">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="font-wide text-[15px] font-semibold uppercase tracking-[0.04em] mb-2">{v.title}</h3>
                <p className="font-display text-white/70 text-[16px] leading-relaxed max-w-sm">{v.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal>
        <section className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] py-20 md:py-28 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <h2 className="font-display font-normal text-[40px] md:text-[64px] leading-none tracking-[-0.01em] max-w-xl">
            {BRAND.tagline}
          </h2>
          <MotionLink to="/shop"
            initial="rest" whileHover="hover" whileTap={tapScale}
            variants={ctaButtonVariants}
            className="inline-flex items-center gap-6 text-white px-6 h-[54px] text-[13px] font-medium shrink-0">
            Shop the collection <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
          </MotionLink>
        </section>
      </Reveal>

      <SiteFooter />
    </div>
  );
}
