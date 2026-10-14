import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionLink, MotionButton, fadeHoverVariants, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { BRAND } from "@/lib/brand";
import api from "@/lib/api";
import logoSrc from "@/imports/takers-logo.png";

const solidButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

// One-time creation of the store's FIRST admin. The server only allows it
// while no admin exists and with the ADMIN_SETUP_TOKEN from cPanel.
export default function AdminSetupPage() {
  useDocumentTitle("Admin setup");
  const { user, isAdmin, startSession } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<{ needsSetup: boolean; setupEnabled: boolean } | null>(null);
  const [form, setForm] = useState({ setup_code: "", first_name: "", last_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/auth/setup-status")
      .then(({ data }) => setStatus(data))
      .catch(() => setError("Couldn't reach the server. Try again shortly."));
  }, []);

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      const { confirm: _confirm, ...payload } = form;
      const { data } = await api.post("/auth/setup", payload);
      startSession(data.token, data.user);
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Setup failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border-b border-foreground bg-transparent py-3 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors";

  const body = () => {
    if (!status) return <p className="text-sm text-muted-foreground">{error || "Checking…"}</p>;
    if (!status.needsSetup) {
      return (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Setup is already complete — an admin account exists.</p>
          <MotionLink to="/admin/login" className="inline-block underline underline-offset-4 text-sm">Go to admin sign in</MotionLink>
        </div>
      );
    }
    if (!status.setupEnabled) {
      return (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Setup is locked. In cPanel → Setup Node.js App, add an environment variable named{" "}
          <code className="bg-secondary px-1">ADMIN_SETUP_TOKEN</code> with a secret code of your choice, save,
          restart the app, then reload this page.
        </p>
      );
    }
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="password" placeholder="Setup code (ADMIN_SETUP_TOKEN)" required value={form.setup_code}
          onChange={set("setup_code")} autoComplete="off" className={inputCls} />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="First name" required value={form.first_name} onChange={set("first_name")}
            autoComplete="given-name" className={inputCls} />
          <input placeholder="Last name" required value={form.last_name} onChange={set("last_name")}
            autoComplete="family-name" className={inputCls} />
        </div>
        <input type="email" placeholder="Email address" required value={form.email} onChange={set("email")}
          autoComplete="username" className={inputCls} />
        <input type="password" placeholder="Password (10+ characters)" required minLength={10} value={form.password}
          onChange={set("password")} autoComplete="new-password" className={inputCls} />
        <input type="password" placeholder="Confirm password" required minLength={10} value={form.confirm}
          onChange={set("confirm")} autoComplete="new-password" className={inputCls} />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <MotionButton type="submit" disabled={saving}
          initial="rest" whileHover={saving ? undefined : "hover"} whileTap={saving ? undefined : tapScale}
          variants={solidButtonVariants}
          className="w-full flex items-center justify-center gap-3 text-white h-[54px] text-[13px] font-medium disabled:opacity-50">
          {saving ? "Creating…" : <>Create admin account <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span></>}
        </MotionButton>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-16 bg-[var(--cream)]">
      <div className="w-full max-w-md bg-background p-8 md:p-12">
        <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants} className="inline-block mb-10">
          <img src={logoSrc} alt={BRAND.name} className="h-8 w-auto" />
        </MotionLink>
        <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">First-time setup</p>
        <h1 className="font-display font-normal text-[40px] leading-none tracking-[-0.02em] mb-8">Create the admin.</h1>
        {body()}
      </div>
    </div>
  );
}
