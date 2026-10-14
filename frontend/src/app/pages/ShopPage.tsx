import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, MotionButton, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { ProductCard, ProductGridSkeleton } from "@/app/components/ProductCard";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { CATEGORIES as STORE_CATEGORIES } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";

const CATEGORIES = [{ label: "All", slug: "" }, ...STORE_CATEGORIES];
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  STORE_CATEGORIES.map((c) => [c.slug, c.label])
);
const TAGS = ["New", "Limited", "Bestseller", "Sale"];

const breadcrumbVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

const pillRestUnselected = { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)", borderColor: "var(--border)" };
const pillHover = { backgroundColor: "rgba(0,0,0,0)", color: "#0a0a0a", borderColor: "#0a0a0a" };
const pillSelected = { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)", borderColor: "var(--foreground)" };

const ghostLinkVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

const loadMoreVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

export default function ShopPage() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts]     = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [activeTag, setActiveTag]   = useState("");
  const [search, setSearch]         = useState(searchParams.get("search") || "");
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCategory = categoryParam || "";
  const activeLabel = CATEGORY_LABELS[activeCategory] || "All Products";
  useDocumentTitle(activeLabel, `Shop the full ${BRAND.name} collection: hoodies, shirts and baseball caps.`);

  useEffect(() => {
    const paramSearch = searchParams.get("search") || "";
    if (paramSearch !== search) {
      setSearch(paramSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [categoryParam, activeTag, search]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 12 };
    if (activeCategory) params.category = activeCategory;
    if (activeTag)      params.tag      = activeTag;
    if (search)         params.search   = search;

    api.get("/products", { params })
      .then(({ data }) => {
        setProducts((prev) => page === 1 ? (data.products || []) : [...prev, ...(data.products || [])]);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, activeTag, search, page]);

  return (
    <>
    <SiteHeader/>
    <div className="min-h-screen bg-background mb-12">
      {/* Page header */}
      <div className="bg-[var(--cream)]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] pt-10 pb-12 md:pt-14 md:pb-16">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-6">
            <MotionLink to="/" initial="rest" whileHover="hover" variants={breadcrumbVariants}>Home</MotionLink> / Shop
          </p>
          <div className="flex items-end justify-between gap-6">
            <h1 className="font-display font-normal text-[48px] md:text-[80px] leading-[0.9] tracking-[-0.02em]">
              {activeCategory ? activeLabel : "All products"}
            </h1>
            <span className="text-muted-foreground text-xs shrink-0 pb-2">{total} items</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] py-8">
        {/* Filters row */}
        <div className="mb-10" id="collections">
          {/* Row 1: category pills + tag filter toggle (full width) */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map((c) => {
                const isActive = activeCategory === c.slug;
                return (
                  <motion.button key={c.slug}
                    onClick={() => navigate(c.slug ? `/shop/${c.slug}` : "/shop")}
                    initial={false}
                    animate={isActive ? pillSelected : pillRestUnselected}
                    whileHover={isActive ? undefined : pillHover}
                    whileTap={tapScaleSm}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-1.5 text-[11px] tracking-wider uppercase border rounded-full">
                    {c.label}
                  </motion.button>
                );
              })}
            </div>
            <MotionButton onClick={() => setFilterOpen(!filterOpen)}
              initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostLinkVariants}
              className="flex items-center gap-2 text-[11px] tracking-widest uppercase border border-border rounded-full px-3 py-1.5 shrink-0">
              <SlidersHorizontal size={12} /> Filter
            </MotionButton>
          </div>

          {/* Row 2: search (full width) */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const cleanSearch = search.trim();
            if (cleanSearch) {
              setSearchParams({ search: cleanSearch });
            } else {
              setSearchParams({});
            }
          }} className="w-full">
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border rounded-full px-5 py-2 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors"
            />
          </form>
        </div>

        {/* Tag filter panel */}
        {filterOpen && (
          <div className="border border-border p-4 mb-8 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground mr-2">Tag:</span>
            {TAGS.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <motion.button key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                  initial={false}
                  animate={isActive ? pillSelected : pillRestUnselected}
                  whileHover={isActive ? undefined : pillHover}
                  whileTap={tapScaleSm}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-1 text-[11px] tracking-wider uppercase border rounded-full">
                  {tag}
                </motion.button>
              );
            })}
            {activeTag && (
              <MotionButton onClick={() => setActiveTag("")}
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostLinkVariants}
                className="flex items-center gap-1 text-[11px] ml-2">
                <X size={10} /> Clear
              </MotionButton>
            )}
          </div>
        )}

        {/* Grid */}
        {loading && page === 1 ? (
          <ProductGridSkeleton count={12} />
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground text-sm">No products found.</div>
        ) : (
          <Reveal y={32}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10 md:gap-y-14">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Reveal>
        )}

        {/* Load more */}
        {page < pages && (
          <div className="text-center mt-14">
            <MotionButton onClick={() => setPage((p) => p + 1)} disabled={loading}
              initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
              variants={loadMoreVariants}
              className="border border-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
              {loading ? "Loading…" : "Load More"}
            </MotionButton>
          </div>
        )}
      </div>
    </div>
    <SiteFooter/>
    </>
  );
}
