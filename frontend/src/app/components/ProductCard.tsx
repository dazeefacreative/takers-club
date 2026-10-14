import { motion } from "framer-motion";
import { MotionLink } from "@/app/components/motion/primitives";
import { getImageUrl } from "@/lib/media";

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  price: number | string;
  image?: string | null;
  category?: string | null;
  tag?: string | null;
}

const imageVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.04 },
};

export function ProductCard({ product }: { product: ProductSummary }) {
  const src = getImageUrl(product.image);
  return (
    <MotionLink to={`/product/${product.slug}`} initial="rest" whileHover="hover" className="block group">
      <div className="relative overflow-hidden bg-secondary aspect-[6/7] mb-3">
        {src && (
          <motion.img
            src={src}
            alt={product.name}
            loading="lazy"
            variants={imageVariants}
            transition={{ duration: 0.7 }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 w-full h-full object-cover protected-img"
          />
        )}
        {product.tag && (
          <span className="absolute top-3 left-3 bg-foreground text-primary-foreground text-[9px] tracking-widest uppercase px-2 py-1 font-wide">
            {product.tag}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 px-2 mb-1.5">
        <p className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground truncate">{product.category}</p>
        <p className="text-[11px] font-semibold shrink-0">₦{Number(product.price).toLocaleString()}</p>
      </div>
      <h3 className="font-wide text-[12px] md:text-[13px] font-medium leading-snug px-2">{product.name}</h3>
    </MotionLink>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10 md:gap-y-14">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[6/7] bg-secondary mb-3" />
          <div className="h-2.5 bg-secondary w-1/3 mb-2" />
          <div className="h-3.5 bg-secondary w-2/3" />
        </div>
      ))}
    </div>
  );
}
