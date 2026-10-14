import { useState } from "react";
import { ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MotionLink, tapScaleSm } from "@/app/components/motion/primitives";
import { useCart } from "@/app/context/CartContext";
import { CATEGORIES } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import logoSrc from "@/imports/takers-logo.png";

const navLinkVariants = {
  rest: { opacity: 1 },
  hover: { opacity: 0.55 },
};

export function SiteHeader() {
  const { count: cartCount } = useCart();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    navigate(cleanQuery ? `/shop?search=${encodeURIComponent(cleanQuery)}` : "/shop");
    setMenuOpen(false);
  };

  const searchForm = (className: string) => (
    <form onSubmit={handleSearchSubmit} role="search"
      className={`items-center border border-foreground rounded-full pl-4 pr-1.5 h-8 ${className}`}>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="search"
        aria-label="Search products"
        className="flex-1 min-w-0 bg-transparent text-[16px] md:text-xs outline-none placeholder:text-muted-foreground"
      />
      <button type="submit" aria-label="Search" className="w-6 h-6 flex items-center justify-center cursor-pointer">
        <Search size={15} strokeWidth={2} />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] flex items-center justify-between h-[72px] md:h-[86px] gap-6">
        <div className="flex items-center gap-10 lg:gap-16">
          <MotionLink to="/" whileTap={tapScaleSm} className="shrink-0" aria-label={`${BRAND.name} home`}>
            <img src={logoSrc} alt={BRAND.name} className="h-7 md:h-8 w-auto" />
          </MotionLink>

          <nav className="hidden md:flex items-center gap-10 lg:gap-16 text-[12px] font-medium">
            <MotionLink to="/shop" initial="rest" whileHover="hover" variants={navLinkVariants}>
              All products
            </MotionLink>
            <div className="relative"
              onMouseEnter={() => setCollectionsOpen(true)}
              onMouseLeave={() => setCollectionsOpen(false)}>
              <button type="button" onClick={() => setCollectionsOpen((o) => !o)}
                aria-expanded={collectionsOpen}
                className="flex items-center gap-1 cursor-pointer hover:opacity-55 transition-opacity text-[12px] font-medium leading-normal">
                Collections <ChevronDown size={12} className={`transition-transform ${collectionsOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {collectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-4">
                    <div className="bg-background border border-border py-2 min-w-[180px] shadow-sm">
                      {CATEGORIES.map((c) => (
                        <MotionLink key={c.slug} to={`/shop/${c.slug}`} onClick={() => setCollectionsOpen(false)}
                          className="block px-4 py-2 text-[12px] hover:bg-secondary">
                          {c.label}
                        </MotionLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <MotionLink to="/contact" initial="rest" whileHover="hover" variants={navLinkVariants}>
              Contact
            </MotionLink>
          </nav>
        </div>

        <div className="flex items-center gap-6 lg:gap-14">
          {searchForm("hidden md:flex w-44 lg:w-[180px]")}
          <motion.button whileTap={tapScaleSm} onClick={() => navigate("/cart")}
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative cursor-pointer">
            <ShoppingCart size={22} strokeWidth={2} fill="currentColor" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 bg-foreground text-primary-foreground text-[10px] flex items-center justify-center rounded-full font-bold ring-2 ring-background">
                {cartCount}
              </span>
            )}
          </motion.button>
          <motion.button whileTap={tapScaleSm} className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </motion.button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="px-6 py-6 flex flex-col gap-4">
            {searchForm("flex w-full mb-2 h-10")}
            {[{ label: "All products", to: "/shop" }, ...CATEGORIES.map((c) => ({ label: c.label, to: `/shop/${c.slug}` })), { label: "Contact", to: "/contact" }].map((link) => (
              <MotionLink key={link.to} to={link.to} whileTap={tapScaleSm}
                className="font-display text-2xl border-b border-border pb-4"
                onClick={() => setMenuOpen(false)}>
                {link.label}
              </MotionLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
