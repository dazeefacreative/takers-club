import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Reveal } from "@/app/components/motion/Reveal";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

export default function AdminCustomersPage() {
  useDocumentTitle("Admin · Customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/customers").then(({ data }) => setCustomers(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Customers</h1>
        <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">{customers.length} from paid orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-secondary animate-pulse" />)}</div>
      ) : (
        <Reveal>
          <div className="border border-border overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_160px_80px_100px] gap-4 px-5 py-3 border-b border-border bg-secondary">
                {["Customer", "Email", "Orders", "Spent"].map((h) => (
                  <p key={h} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>
              {customers.map((c) => (
                <motion.div key={c.email}
                  initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                  className="grid grid-cols-[1fr_160px_80px_100px] gap-4 px-5 py-3 border-b border-border last:border-0 items-center">
                  <div>
                    <p className="text-xs font-medium">{c.first_name} {c.last_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  <p className="text-xs text-center">{c.order_count}</p>
                  <p className="text-xs font-semibold">₦{Number(c.total_spent).toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
