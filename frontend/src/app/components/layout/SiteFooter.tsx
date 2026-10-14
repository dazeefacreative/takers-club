import { MotionLink, MotionA } from "@/app/components/motion/primitives";
import { BRAND } from "@/lib/brand";
import logoWhite from "@/imports/takers-logo-white.png";

const columns = [
  { heading: "Index", links: [{ label: "All Products", to: "/shop" }, { label: "Collections", to: "/shop#collections" }] },
  { heading: "Support", links: [{ label: "Shipping & Returns", to: "/shipping" }, { label: "About", to: "/about" }, { label: "Contact", to: "/contact" }] },
  { heading: "Legal", links: [{ label: "Shipping Policy", to: "/shipping" }, { label: "Return Policy", to: "/returns" }, { label: "Privacy Policy", to: "/privacy-policy" }, { label: "Terms of Service", to: "/terms-of-service" }] },
];

const linkVariants = {
  rest: { color: "rgba(255,255,255,0.85)" },
  hover: { color: "#ffffff" },
};

export function SiteFooter() {
  return (
    <footer className="bg-[var(--ink)] text-white">
      <div className="max-w-[1440px] mx-auto px-6 md:px-[4.2vw] pt-16 md:pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_0.8fr] gap-x-8 gap-y-12 mb-20 md:mb-28">
          <div className="col-span-2 md:col-span-1">
            <img src={logoWhite} alt={BRAND.name} className="h-8 w-auto mb-6" />
            <p className="font-wide text-[12px] leading-relaxed max-w-[200px] text-white/90">{BRAND.description}</p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h5 className="font-display text-[11px] tracking-[0.08em] uppercase font-bold mb-5">{col.heading}</h5>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <MotionLink to={link.to} initial="rest" whileHover="hover" variants={linkVariants}
                      className="font-wide text-[12px]">
                      {link.label}
                    </MotionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[10px] tracking-widest uppercase text-white/50">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          {BRAND.instagram && (
            <MotionA href={BRAND.instagram} target="_blank" rel="noreferrer"
              initial="rest" whileHover="hover" variants={linkVariants}>
              Instagram
            </MotionA>
          )}
        </div>
      </div>
    </footer>
  );
}
