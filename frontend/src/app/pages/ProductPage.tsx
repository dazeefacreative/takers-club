import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { useCart } from "@/app/context/CartContext";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { ProductCard } from "@/app/components/ProductCard";
import { BRAND } from "@/lib/brand";

import { MotionLink, MotionButton, ghostHoverVariants, tapScale, tapScaleSm, tapScaleLg } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { COLOR_CATEGORY_SLUG } from "@/lib/constants";

const thumbRest = { borderColor: "rgba(0,0,0,0)" };
const thumbHover = { borderColor: "var(--border)" };
const thumbActive = { borderColor: "var(--foreground)" };

const addToBagVariants = {
  rest: { backgroundColor: "#0a0a0a" },
  hover: { backgroundColor: "rgba(10,10,10,0.8)" },
};


export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity]     = useState(1);
  const [activeImage, setActiveImage]   = useState(0);
  const [adding, setAdding]         = useState(false);
  const [sizeError, setSizeError]   = useState(false);
  const [related, setRelated]       = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        setActiveImage(0);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate("/shop"); });
  }, [slug]);

  const allImages = product?.images?.length
    ? product.images.map((img: any) => getImageUrl(img.image_url))
    : [];

  const sellsByColor = product?.category_slug === COLOR_CATEGORY_SLUG;
  const availableSizes = product?.sizes?.filter((s: any) => s.stock_quantity > 0) || [];

  useEffect(() => {
    if (!selectedSize && availableSizes.length) {
      setSelectedSize(availableSizes[0].size);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (!product?.category_slug) { setRelated([]); return; }
    api.get("/products", { params: { category: product.category_slug, limit: 5 } })
      .then(({ data }) => setRelated((data.products || []).filter((p: any) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [product]);

  const handleAddToCart = async () => {
    if (!selectedSize) { setSizeError(true); return; }
    setAdding(true);
    const primaryImage = product.images?.find((img: any) => img.is_primary)?.image_url || product.images?.[0]?.image_url;
    await addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: primaryImage, category_slug: product.category_slug }, selectedSize, quantity);
    setAdding(false);
  };

  useDocumentTitle(
    product?.name || "Product",
    product?.description?.slice(0, 160) || (product?.name ? `Shop the ${product.name} at ${BRAND.name}.` : undefined),
    product ? allImages[0] : undefined
  );

  // Product structured data for search engines (price, availability, image).
  useEffect(() => {
    if (!product) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || `${product.name} from ${BRAND.name}.`,
      image: allImages,
      sku: String(product.id),
      brand: { "@type": "Brand", name: BRAND.name },
      offers: {
        "@type": "Offer",
        url: window.location.href,
        priceCurrency: "NGN",
        price: product.price,
        availability: availableSizes.length > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xs tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <SiteHeader />
      
      {/* Breadcrumb */}        
      <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <div className="border-b border-border px-6 md:px-12 py-3">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground">
            <MotionLink to="/" initial="rest" whileHover="hover" variants={ghostHoverVariants}>Home</MotionLink>
            <span>/</span>
            <MotionLink to="/shop" initial="rest" whileHover="hover" variants={ghostHoverVariants}>Shop</MotionLink>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 shrink-0">
                {allImages.map((img: string, i: number) => {
                  const isActive = activeImage === i;
                  return (
                    <motion.button key={i} onClick={() => setActiveImage(i)}
                      initial={false}
                      animate={isActive ? thumbActive : thumbRest}
                      whileHover={isActive ? undefined : thumbHover}
                      whileTap={tapScaleSm}
                      transition={{ duration: 0.2 }}
                      className="aspect-[6/7] overflow-hidden border-2">
                      <img src={img} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()}
                        className="w-full h-full object-cover protected-img" />
                    </motion.button>
                  );
                })}
              </div>
            )}
            {/* Main image — all images rendered & preloaded, only active is visible */}
            <div className="flex-1 aspect-[6/7] overflow-hidden bg-secondary relative">
              {allImages.map((img: string, i: number) => (
                <img key={i} src={img} alt={i === 0 ? product.name : ""}
                  draggable={false} onContextMenu={(e) => e.preventDefault()}
                  className={`absolute inset-0 w-full h-full object-cover protected-img transition-none ${i === activeImage ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
              ))}
              {product.tag && (
                <span className="absolute top-4 left-4 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1 z-10">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <MotionButton onClick={() => navigate(-1)}
              initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
              className="flex items-center gap-2 text-[10px] tracking-widest uppercase mb-8 w-fit">
              <ArrowLeft size={12} /> Back
            </MotionButton>

            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{product.category}</p>
            <h1 className="font-display font-normal text-[36px] md:text-[52px] leading-[0.95] tracking-[-0.02em] mb-4">
              {product.name}
            </h1>
            <p className="font-wide text-lg font-semibold mb-6">₦{Number(product.price).toLocaleString()}</p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8 font-light">{product.description}</p>

            {/* Size / Color picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-widest uppercase font-bold">
                  {sellsByColor ? "Select Color" : "Select Size"} {selectedSize && <span className="font-normal text-muted-foreground ml-1">- {selectedSize}</span>}
                </p>
              </div>
              {sizeError && <p className="text-red-500 text-xs mb-2">Please select a {sellsByColor ? "color" : "size"}</p>}
              <div className="flex flex-wrap gap-2">
                {availableSizes.length ? availableSizes.map((s: any) => {
                  const isSelected = selectedSize === s.size;
                  if (sellsByColor) {
                    return (
                      <motion.button key={s.size} onClick={() => { setSelectedSize(s.size); setSizeError(false); }}
                        whileTap={tapScaleSm} title={s.size}
                        className={`w-12 h-12 rounded-full border-2 transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-slate-400/40 ${
                          isSelected ? "border-[#0f172a] ring-2 ring-offset-2 ring-[#0f172a]" : "border-slate-300 hover:border-[var(--action-border)]"
                        }`}
                        style={{ backgroundColor: s.hex_code || "#ccc" }}>
                        <span className="sr-only">{s.size}</span>
                      </motion.button>
                    );
                  }
                  return (
                    <motion.button key={s.size} onClick={() => { setSelectedSize(s.size); setSizeError(false); }}
                      whileTap={tapScaleSm}
                      className={`w-12 h-12 border text-xs font-medium rounded transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-slate-400/40 ${
                        isSelected
                          ? "bg-[#0f172a] text-white border-[#0f172a]"
                          : "bg-transparent text-[#0f172a] border-slate-300 hover:bg-[var(--action)] hover:text-[var(--action-foreground)] hover:border-[var(--action-border)]"
                      }`}>
                      {s.size}
                    </motion.button>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">Out of stock</p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-[10px] tracking-widest uppercase font-bold">Quantity</p>
              <div className="flex items-center border border-border">
                <MotionButton onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                  className="w-10 h-10 flex items-center justify-center">
                  <Minus size={12} />
                </MotionButton>
                <span className="w-10 h-10 flex items-center justify-center text-sm font-medium">{quantity}</span>
                <MotionButton onClick={() => setQuantity((q) => q + 1)}
                  initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                  className="w-10 h-10 flex items-center justify-center">
                  <Plus size={12} />
                </MotionButton>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <MotionButton onClick={handleAddToCart} disabled={adding || !availableSizes.length}
                initial="rest" whileHover={adding ? undefined : "hover"} whileTap={adding ? undefined : tapScaleLg}
                variants={addToBagVariants}
                className="flex-1 flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
                {adding ? "Adding…" : (
                  <><Plus size={12} /> Add to cart</>
                )}
              </MotionButton>
            </div>

            {/* Perks */}
            <div className="border-t border-border pt-6 space-y-3">
              {[`Free shipping on orders over ₦${BRAND.freeShippingThreshold.toLocaleString()}`, "Free 30-day returns", "Secure checkout with Paystack", "No account needed — check out as a guest"].map((perk) => (
                <p key={perk} className="text-xs text-muted-foreground flex items-center gap-2 font-light">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" /> {perk}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 pb-16 md:pb-24 border-t border-border pt-12 md:pt-16">
            <h2 className="font-display font-normal text-[32px] md:text-[44px] leading-none tracking-[-0.01em] mb-8">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
