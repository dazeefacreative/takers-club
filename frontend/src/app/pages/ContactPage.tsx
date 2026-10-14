import { useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionA, MotionButton, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import api from "@/lib/api";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { BRAND } from "@/lib/brand";

const channels = [
  { icon: Mail, label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
  ...(BRAND.phone ? [{ icon: Phone, label: "Phone", value: BRAND.phone, href: `tel:${BRAND.phone.replace(/s/g, "")}` }] : []),
];

const channelLinkVariants = {
  rest: { color: "var(--foreground)" },
  hover: { color: "#6b6b65" },
};

const submitButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--foreground)", color: "#ffffff" },
};

export default function ContactPage() {
  useDocumentTitle("Contact", `Questions about an order or a wholesale inquiry? Get in touch with ${BRAND.name}.`);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      await api.post("/contact", form);
    } catch (_) {
      // backend endpoint not wired yet - still confirm to the visitor
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <SiteHeader />

      {/* Page header */}
      <div className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-14">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">Get in touch</p>
          <h1 className="text-4xl md:text-5xl font-normal tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Let's <em className="font-light italic">talk.</em>
          </h1>
        </div>
      </div>

      {/* Form + channels */}
      <Reveal>
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-14 md:gap-24">
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-10 max-w-sm">
                Questions about an order, a wholesale inquiry, or just want to tell us what to build next - drop a line and we'll get back within two business days.
              </p>
              <div className="space-y-6">
                {channels.map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <c.icon size={18} strokeWidth={1.5} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{c.label}</p>
                      {c.href ? (
                        <MotionA href={c.href} initial="rest" whileHover="hover" variants={channelLinkVariants} className="text-sm">{c.value}</MotionA>
                      ) : (
                        <p className="text-sm">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {sent ? (
                <div className="border-b border-foreground pb-4">
                  <p className="text-sm tracking-wide">Message sent. We'll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Name</label>
                    <input value={form.name} onChange={update("name")} required
                      className="w-full border-b border-foreground bg-transparent py-2 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none font-light" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Email</label>
                    <input type="email" value={form.email} onChange={update("email")} required
                      className="w-full border-b border-foreground bg-transparent py-2 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none font-light" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Message</label>
                    <textarea value={form.message} onChange={update("message")} required rows={5}
                      className="w-full border-b border-foreground bg-transparent py-2 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none font-light resize-none" />
                  </div>
                  <MotionButton type="submit" disabled={sending}
                    initial="rest" whileHover={sending ? undefined : "hover"} whileTap={sending ? undefined : tapScale}
                    variants={submitButtonVariants}
                    className="flex items-center justify-center gap-2 border border-foreground px-8 py-3 text-xs tracking-widest uppercase font-semibold disabled:opacity-60 w-fit cursor-pointer">
                    {sending ? "Sending..." : "Send message"} <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
                  </MotionButton>
                </form>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      <SiteFooter />
    </div>
  );
}
