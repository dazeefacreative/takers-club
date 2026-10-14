import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, Image, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionButton, tapScaleSm } from "@/app/components/motion/primitives";

const nav = [
  { to: "/admin",           label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products",  label: "Products",  icon: Package },
  { to: "/admin/orders",    label: "Orders",    icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings",  label: "Site Content", icon: Image },
  { to: "/admin/admins",    label: "Admins", icon: ShieldCheck },
];

const itemRestInactive = { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)" };
const itemHoverInactive = { backgroundColor: "var(--secondary)", color: "#0a0a0a" };
const itemActive = { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)" };

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-background">
        <div>
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground leading-none">Takers Club</p>
          <p className="text-xs font-bold tracking-wide uppercase leading-none mt-0.5">Admin</p>
        </div>
        <motion.button whileTap={tapScaleSm} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </motion.button>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-56 shrink-0 border-r border-border flex flex-col py-8 px-4 bg-background
        fixed inset-y-0 left-0 z-40 transition-transform duration-200
        ${menuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}>
        <div className="mb-10 px-2">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Takers Club</p>
          <p className="text-xs font-bold tracking-wide uppercase">Admin</p>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="block" onClick={() => setMenuOpen(false)}>
              {({ isActive }) => (
                <motion.div
                  initial={false}
                  animate={isActive ? itemActive : itemRestInactive}
                  whileHover={isActive ? undefined : itemHoverInactive}
                  whileTap={tapScaleSm}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest uppercase">
                  <Icon size={14} strokeWidth={1.5} /> {label}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
        <MotionButton onClick={() => { logout(); navigate("/"); }}
          initial="rest" whileHover="hover" whileTap={tapScaleSm}
          variants={{ rest: { color: "var(--muted-foreground)" }, hover: { color: "#0a0a0a" } }}
          className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest uppercase">
          <LogOut size={14} strokeWidth={1.5} /> Sign Out
        </MotionButton>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
