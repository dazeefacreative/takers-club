import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, MotionButton, ghostHoverVariants, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const addButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

const dangerHoverVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

export default function AdminProductsPage() {
  useDocumentTitle("Admin · Products");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    api.get("/admin/products")
      .then(({ data }) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: number, current: boolean) => {
    await api.put(`/products/${id}`, { is_active: current ? 0 : 1 });
    load();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Products</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">
            {products.filter((p) => p.is_active).length} active · {products.length} total
          </p>
        </div>
        <MotionLink to="/admin/products/new"
          initial="rest" whileHover="hover" whileTap={tapScale} variants={addButtonVariants}
          className="flex items-center gap-2 text-primary-foreground px-5 py-2.5 text-xs tracking-widest uppercase font-semibold">
          <Plus size={14} /> Add Product
        </MotionLink>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-secondary animate-pulse" />)}
        </div>
      ) : (
        <Reveal>
          <div className="border border-border overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[64px_1fr_120px_80px_100px_80px] gap-4 px-5 py-3 border-b border-border bg-secondary">
                {["", "Product", "Category", "Price", "Tag", ""].map((h, i) => (
                  <p key={i} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>

              {products.map((p) => (
                <motion.div key={p.id}
                  initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                  className={`grid grid-cols-[64px_1fr_120px_80px_100px_80px] gap-4 px-5 py-3 border-b border-border last:border-0 items-center ${!p.is_active ? "opacity-40" : ""}`}>
                  <div className="w-12 h-14 bg-secondary overflow-hidden shrink-0">
                    {p.image && <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.slug}{!p.is_active && " · Hidden"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.category || "—"}</p>
                  <p className="text-xs font-semibold">₦{Number(p.price).toLocaleString()}</p>
                  <span>
                    {p.tag ? (
                      <span className="text-[10px] tracking-widest uppercase border border-border px-2 py-0.5">{p.tag}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <MotionLink to={`/admin/products/${p.id}/edit`}
                      initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}>
                      <Pencil size={14} />
                    </MotionLink>
                    <MotionButton onClick={() => toggleActive(p.id, p.is_active)}
                      title={p.is_active ? "Deactivate" : "Activate"}
                      initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={dangerHoverVariants}>
                      {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </MotionButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
