import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { ProductCard, ProductGridSkeleton, type ProductSummary } from "@/app/components/ProductCard";
import { MotionLink, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { BRAND } from "@/lib/brand";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import heroImage from "@/imports/hero-blue-tee.webp";

const HERO_VIDEO_CACHE_KEY = "tc-hero-video-url";

const shopButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

export default function HomePage() {
  useDocumentTitle("Home", `${BRAND.name}: ${BRAND.tagline} Hoodies, shirts and caps designed in small runs.`);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(() => {
    try { return localStorage.getItem(HERO_VIDEO_CACHE_KEY); } catch { return null; }
  });

  useEffect(() => {
    api.get("/products", { params: { limit: 16 } })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        const videoUrl = data.hero_video_url || null;
        setHeroVideoUrl(videoUrl);
        try {
          if (videoUrl) localStorage.setItem(HERO_VIDEO_CACHE_KEY, videoUrl);
          else localStorage.removeItem(HERO_VIDEO_CACHE_KEY);
        } catch { /* localStorage unavailable (e.g. private browsing) */ }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="grid md:grid-cols-[44.6%_1fr] md:min-h-[min(47vw,680px)]">
        <div className="bg-[var(--cream)] flex flex-col justify-center px-6 md:px-[4.2vw] py-14 md:py-12 order-2 md:order-1">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display font-normal text-[64px] md:text-[clamp(56px,6.4vw,92px)] leading-[0.86] tracking-[-0.02em] mb-8 md:mb-10">
            Wear<br />your<br />own<br />crown.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="font-display text-[15px] leading-[1.35] max-w-[420px] mb-10">
            Considered staples for moving through the world on your own terms. Designed in small runs, made to stay in rotation.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <MotionLink to="/shop"
              initial="rest" whileHover="hover" whileTap={tapScale}
              variants={shopButtonVariants}
              className="inline-flex items-center gap-6 text-white px-6 h-[54px] text-[13px] font-medium">
              Shop the collection
              <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
            </MotionLink>
          </motion.div>
        </div>

        <div className="relative overflow-hidden bg-muted min-h-[62vh] md:min-h-0 order-1 md:order-2">
          {heroVideoUrl ? (
            <video key={heroVideoUrl} autoPlay muted loop playsInline poster={heroImage}
              className="absolute inset-0 w-full h-full object-cover">
              <source src={getImageUrl(heroVideoUrl)} type={heroVideoUrl.endsWith(".mp4") ? "video/mp4" : "video/webm"} />
            </video>
          ) : (
            <motion.img
              src={heroImage}
              alt="Man in a light blue Takers Club tee leaning on a yellow Lagos bus"
              initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full object-cover object-[60%_30%]"
            />
          )}
        </div>
      </section>

      {/* Fresh in the fold */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] pt-20 md:pt-28 pb-20 md:pb-28">
        <Reveal className="mb-10 md:mb-14">
          <h2 className="font-display font-normal text-[40px] md:text-[64px] leading-none tracking-[-0.01em]">
            Fresh in the fold
          </h2>
        </Reveal>

        {loadingProducts ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-sm py-16">New pieces are on the way. Check back soon.</p>
        ) : (
          <Reveal delay={0.1} y={32}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10 md:gap-y-14">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Reveal>
        )}

        {products.length >= 16 && (
          <div className="mt-16 text-center">
            <MotionLink to="/shop"
              initial="rest" whileHover="hover" whileTap={tapScale}
              className="inline-flex items-center gap-4 border border-foreground px-8 h-[50px] text-[13px] font-medium hover:bg-foreground hover:text-background transition-colors">
              View all products <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
            </MotionLink>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
