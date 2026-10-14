import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, Users, Package } from "lucide-react";
import api from "@/lib/api";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, ghostHoverVariants } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const STATUS_STYLES: Record<string, string> = {
  pending:    "text-yellow-600",
  paid:       "text-green-600",
  processing: "text-blue-600",
  shipped:    "text-purple-600",
  delivered:  "text-green-700",
  cancelled:  "text-red-600",
};

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

export default function DashboardPage() {
  useDocumentTitle("Admin · Dashboard");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Revenue",  value: "₦" + Number(stats.revenue).toLocaleString(), icon: TrendingUp },
    { label: "Total Orders",   value: stats.orders,                                  icon: ShoppingBag },
    { label: "Customers",      value: stats.customers,                               icon: Users },
    { label: "Active Products",value: stats.products,                                icon: Package },
  ] : [];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
        <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">Store overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-secondary animate-pulse rounded" />)}
        </div>
      ) : (
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</p>
                  <Icon size={16} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* Recent orders */}
      <Reveal delay={0.1}>
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold tracking-wide uppercase">Recent Orders</h2>
            <MotionLink to="/admin/orders" initial="rest" whileHover="hover" variants={ghostHoverVariants}
              className="text-[10px] tracking-widest uppercase">
              View all →
            </MotionLink>
          </div>
          <div className="border border-border overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_140px_100px_100px] gap-4 px-5 py-3 border-b border-border bg-secondary">
                {["Order / Customer", "Email", "Total", "Status"].map((h) => (
                  <p key={h} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>
              {stats?.recentOrders?.map((o: any) => (
                <motion.div key={o.order_number}
                  initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                  className="grid grid-cols-[1fr_140px_100px_100px] gap-4 px-5 py-3 border-b border-border last:border-0 items-center">
                  <div>
                    <p className="text-xs font-medium">{o.order_number}</p>
                    <p className="text-[10px] text-muted-foreground">{o.first_name} {o.last_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{o.email}</p>
                  <p className="text-xs font-semibold">₦{Number(o.total).toLocaleString()}</p>
                  <span className={`text-[10px] tracking-widest uppercase font-medium ${STATUS_STYLES[o.status] || ""}`}>
                    {o.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
