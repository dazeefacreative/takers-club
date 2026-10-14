import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionButton, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { COLOR_CATEGORY_SLUG } from "@/lib/constants";

const STATUSES = ["pending","paid","processing","shipped","delivered","cancelled","refunded"];
const STATUS_STYLES: Record<string, string> = {
  pending:"text-yellow-600", paid:"text-green-600", processing:"text-blue-600",
  shipped:"text-purple-600", delivered:"text-green-700", cancelled:"text-red-600", refunded:"text-gray-500"
};

const pillRestUnselected = { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)", borderColor: "var(--border)" };
const pillHover = { backgroundColor: "rgba(0,0,0,0)", color: "#0a0a0a", borderColor: "#0a0a0a" };
const pillSelected = { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)", borderColor: "var(--foreground)" };

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

export default function AdminOrdersPage() {
  useDocumentTitle("Admin · Orders");
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);

  const load = () => {
    const params: any = { limit: 50 };
    if (filterStatus) params.status = filterStatus;
    api.get("/admin/orders", { params })
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/admin/orders/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Orders</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">{orders.length} orders</p>
        </div>
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {["", ...STATUSES].map((s) => {
            const isActive = filterStatus === s;
            return (
              <motion.button key={s}
                onClick={() => setFilter(s)}
                initial={false}
                animate={isActive ? pillSelected : pillRestUnselected}
                whileHover={isActive ? undefined : pillHover}
                whileTap={tapScaleSm}
                transition={{ duration: 0.2 }}
                className="px-3 py-1.5 text-[10px] tracking-widest uppercase border">
                {s || "All"}
              </motion.button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary animate-pulse" />)}</div>
      ) : (
        <Reveal>
          <div className="border border-border overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1fr_160px_80px_120px_120px] gap-4 px-5 py-3 border-b border-border bg-secondary">
                {["Order / Customer", "Date", "Total", "Status", "Update"].map((h) => (
                  <p key={h} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>
              {orders.map((o) => (
                <div key={o.id} className="border-b border-border last:border-0">
                  <motion.div initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                    className="grid grid-cols-[1fr_160px_80px_120px_120px] gap-4 px-5 py-3 items-center">
                    <div>
                      <MotionButton onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                        initial="rest" whileHover="hover" whileTap={tapScaleSm}
                        variants={{ rest: { opacity: 1 }, hover: { opacity: 0.65 } }}
                        className="text-xs font-medium underline underline-offset-2 text-left">
                        {o.order_number}
                      </MotionButton>
                      <p className="text-[10px] text-muted-foreground">{o.first_name} {o.last_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs font-semibold">₦{Number(o.total).toLocaleString()}</p>
                    <span className={`text-[10px] tracking-widest uppercase font-medium ${STATUS_STYLES[o.status] || ""}`}>
                      {o.status}
                    </span>
                    <select value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-[10px] tracking-widest uppercase border border-border px-2 py-1.5 bg-transparent focus:outline-none focus:border-foreground">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </motion.div>

                  {/* Expanded row */}
                  {expanded === o.id && (
                    <div className="px-5 pb-4 pt-0 border-t border-border/50 bg-secondary/40">
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                        <p><span className="font-medium text-foreground">Email:</span> {o.email}</p>
                        <p><span className="font-medium text-foreground">Phone:</span> {o.phone || "—"}</p>
                        <p className="col-span-2"><span className="font-medium text-foreground">Address:</span> {o.address_line1}, {o.city}, {o.state}, {o.country}</p>
                        <p><span className="font-medium text-foreground">Ref:</span> {o.paystack_reference || "—"}</p>
                        <p><span className="font-medium text-foreground">Paid at:</span> {o.paid_at ? new Date(o.paid_at).toLocaleString() : "—"}</p>
                      </div>
                      {o.items?.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="font-medium text-foreground text-xs mb-2">Items</p>
                          <div className="space-y-1">
                            {o.items.map((it: any) => (
                              <div key={it.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{it.product_name} ({it.category_slug === COLOR_CATEGORY_SLUG ? "Color" : "Size"}: {it.size}) × {it.quantity}</span>
                                <span>₦{Number(it.subtotal).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
