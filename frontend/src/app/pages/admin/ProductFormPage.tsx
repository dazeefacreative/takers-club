import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionButton, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { COLOR_CATEGORY_SLUG } from "@/lib/constants";

const cancelButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

const submitButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const uploadLabelVariants = {
  rest: { borderColor: "var(--border)" },
  hover: { borderColor: "var(--action-border)" },
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface SizeStock { size: string; stock: number; }
interface ColorStock { name: string; hex: string; stock: number; }
interface ExistingImage { id: number; image_url: string; is_primary: boolean | number; }

// Merges the reusable global color list with a product's existing per-color
// stock (when editing), and folds in any color the product uses that has
// since fallen out of the global list (defensive — shouldn't normally happen
// since publishing always upserts into it).
function buildColorStocks(globalColors: { name: string; hex_code: string }[], productSizes: any[] | null): ColorStock[] {
  const base = globalColors.map((c) => {
    const existing = productSizes?.find((s: any) => s.size.toLowerCase() === c.name.toLowerCase());
    return { name: c.name, hex: c.hex_code, stock: existing?.stock_quantity || 0 };
  });
  const extra = (productSizes || [])
    .filter((s: any) => s.hex_code && !base.some((b) => b.name.toLowerCase() === s.size.toLowerCase()))
    .map((s: any) => ({ name: s.size, hex: s.hex_code, stock: s.stock_quantity }));
  return [...base, ...extra];
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  useDocumentTitle(isEdit ? "Admin · Edit Product" : "Admin · Add Product");

  const [form, setForm] = useState({
    name: "", description: "", price: "", category_id: "", tag: "", is_active: true,
  });
  const [sizes, setSizes] = useState<SizeStock[]>(
    SIZES.map((size) => ({ size, stock: 0 }))
  );
  const [globalColors, setGlobalColors] = useState<{ name: string; hex_code: string }[]>([]);
  const [productSizesData, setProductSizesData] = useState<any[] | null>(null);
  const [colorStocks, setColorStocks] = useState<ColorStock[]>([]);
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorName, setNewColorName] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [error, setError] = useState("");

  const selectedCategory = categories.find((c) => String(c.id) === String(form.category_id));
  const sellsByColor = selectedCategory?.slug === COLOR_CATEGORY_SLUG;

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/colors").then(({ data }) => setGlobalColors(data));
    if (isEdit) {
      // Load existing product - fetch by id via admin endpoint
      api.get(`/admin/products/${id}`)
        .then(({ data }) => {
          setForm({
            name: data.name ?? "",
            description: data.description ?? "",
            price: data.price ?? "",
            category_id: data.category_id ?? "",
            tag: data.tag ?? "",
            is_active: !!data.is_active,
          });
          if (data.sizes) {
            setSizes(SIZES.map((s) => {
              const existing = data.sizes.find((x: any) => x.size === s);
              return { size: s, stock: existing?.stock_quantity || 0 };
            }));
            setProductSizesData(data.sizes);
          }
          if (data.images) setExistingImages(data.images);
        })
        .catch((err) => setError(err.response?.data?.error || "Failed to load product"))
        .finally(() => setLoadingProduct(false));
    }
  }, [id]);

  useEffect(() => {
    setColorStocks(buildColorStocks(globalColors, productSizesData));
  }, [globalColors, productSizesData]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const remainingSlots = Math.max(0, 8 - existingImages.length - images.length);
    const arr = Array.from(files).slice(0, remainingSlots);
    setImages((prev) => [...prev, ...arr]);
    setNewPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = async (imageId: number) => {
    if (!id) return;
    if (existingImages.length === 1 && images.length === 0) {
      setError("Add a replacement image before removing the last one.");
      return;
    }
    setError("");
    try {
      await api.delete(`/products/${id}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove image");
    }
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const setStock = (size: string, stock: number) =>
    setSizes((prev) => prev.map((s) => s.size === size ? { ...s, stock } : s));

  const setColorStock = (name: string, stock: number) =>
    setColorStocks((prev) => prev.map((c) => c.name === name ? { ...c, stock } : c));

  const addColor = () => {
    const name = newColorName.trim();
    if (!name) return;
    setColorStocks((prev) => {
      if (prev.some((c) => c.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { name, hex: newColorHex, stock: 0 }];
    });
    setNewColorName("");
    setNewColorHex("#000000");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (sellsByColor ? !colorStocks.some((c) => c.stock > 0) : !sizes.some((s) => s.stock > 0)) {
      setError(`Add stock for at least one ${sellsByColor ? "color" : "size"} before publishing.`);
      return;
    }

    if (existingImages.length === 0 && images.length === 0) {
      setError("Add at least one product image before publishing.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const variantPayload = sellsByColor
        ? colorStocks.map((c) => ({ size: c.name, stock: c.stock, hex: c.hex }))
        : sizes;
      fd.append("sizes", JSON.stringify(variantPayload));
      images.forEach((img) => fd.append("images", img));

      // Longer timeout than the default 15s — multiple images means real
      // upload time plus sequential server-side compression, which can
      // legitimately take a while, especially on a slower connection.
      const uploadConfig = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };
      if (isEdit) {
        await api.put(`/products/${id}`, fd, uploadConfig);
      } else {
        await api.post("/products", fd, uploadConfig);
      }
      navigate("/admin/products");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "border border-border px-4 py-3 text-[16px] md:text-sm bg-transparent w-full focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
      <h1 className="text-2xl font-normal tracking-tight mb-8" style={{ fontFamily: "var(--font-display)" }}>
        {isEdit ? "Edit Product" : "Add New Product"}
      </h1>

      {loadingProduct ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary animate-pulse" />)}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            Product Info
          </h2>
          <div className="space-y-4">
            <input required placeholder="Product name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls} />
            <textarea rows={4} placeholder="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required type="number" placeholder="Price (₦)" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputCls} />
              <select value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className={inputCls}>
                <option value="">Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                className={inputCls}>
                <option value="">No tag</option>
                <option value="New">New</option>
                <option value="Limited">Limited</option>
                <option value="Bestseller">Bestseller</option>
                <option value="Sale">Sale</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sizes / Colors + stock */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            {sellsByColor ? "Colors & Stock" : "Sizes & Stock"}
          </h2>
          {sellsByColor ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {colorStocks.map(({ name, hex, stock }) => (
                  <div key={name} className="text-center">
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-border mb-1"
                      style={{ backgroundColor: hex }}
                      title={name}
                    />
                    <p className="text-[10px] tracking-widest uppercase mb-2 text-muted-foreground truncate">{name}</p>
                    <input
                      type="number" min="0" value={stock}
                      onChange={(e) => setColorStock(name, Number(e.target.value))}
                      className="border border-border w-full text-center py-2 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <input type="color" value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-11 h-11 border border-border cursor-pointer bg-transparent p-0 shrink-0" />
                <input type="text" placeholder="New color name" value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                  className={`${inputCls} flex-1`} />
                <MotionButton type="button" onClick={addColor}
                  whileTap={tapScaleSm}
                  className="border border-border px-4 py-3 text-xs tracking-widest uppercase shrink-0">
                  Add Color
                </MotionButton>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {sizes.map(({ size, stock }) => (
                <div key={size} className="text-center">
                  <p className="text-[10px] tracking-widest uppercase mb-2 text-muted-foreground">{size}</p>
                  <input
                    type="number" min="0" value={stock}
                    onChange={(e) => setStock(size, Number(e.target.value))}
                    className="border border-border w-full text-center py-2 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Images */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            Product Images
          </h2>
          <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
            className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
            <Upload size={20} className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">Click to upload images (max 8 — please keep each under 2MB)</span>
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </motion.label>
          {(existingImages.length > 0 || newPreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-[4/5] bg-muted overflow-hidden group">
                  <img src={getImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                  {!!img.is_primary && (
                    <span className="absolute bottom-1 left-1 bg-foreground text-primary-foreground text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
                      Primary
                    </span>
                  )}
                  <MotionButton type="button" onClick={() => removeExistingImage(img.id)}
                    whileTap={tapScaleSm}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white">
                    <X size={12} />
                  </MotionButton>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={i} className="relative aspect-[4/5] bg-muted overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {existingImages.length === 0 && i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-foreground text-primary-foreground text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
                      Primary
                    </span>
                  )}
                  <MotionButton type="button" onClick={() => removeNewImage(i)}
                    whileTap={tapScaleSm}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white">
                    <X size={12} />
                  </MotionButton>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Visibility */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="active" checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4" />
          <label htmlFor="active" className="text-sm">Product is active and visible in store</label>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-4">
          <MotionButton type="button" onClick={() => navigate("/admin/products")}
            initial="rest" whileHover="hover" whileTap={tapScale} variants={cancelButtonVariants}
            className="flex-1 border border-border py-3 text-xs tracking-widest uppercase">
            Cancel
          </MotionButton>
          <MotionButton type="submit" disabled={loading}
            initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
            variants={submitButtonVariants}
            className="flex-1 text-primary-foreground py-3 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
            {loading ? "Saving…" : isEdit ? "Update Product" : "Publish Product"}
          </MotionButton>
        </div>
      </form>
      )}
    </div>
  );
}

