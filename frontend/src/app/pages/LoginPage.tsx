import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionLink, MotionButton, fadeHoverVariants, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { BRAND } from "@/lib/brand";
import logoSrc from "@/imports/takers-logo.png";
import sideImage from "@/imports/lifestyle-cap.webp";

const solidButtonVariants = {
  rest: { backgroundColor: "#000000" },
  hover: { backgroundColor: "#2b2b2b" },
};

// Store-owner login for the admin panel. Shoppers never sign in.
export default function LoginPage() {
  useDocumentTitle("Admin sign in");
  const { user, isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const signedIn = await login(email, password);
      if (signedIn.role !== "admin") {
        logout();
        setError("This account doesn't have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border-b border-foreground bg-transparent py-3 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors";

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-muted">
        <img src={sideImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants} className="inline-block mb-12">
            <img src={logoSrc} alt={BRAND.name} className="h-8 w-auto" />
          </MotionLink>
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">Store admin</p>
          <h1 className="font-display font-normal text-[44px] leading-none tracking-[-0.02em] mb-10">Sign in.</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="email" placeholder="Email address" required value={email} autoComplete="username"
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            <input type="password" placeholder="Password" required value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} className={inputCls} />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <MotionButton type="submit" disabled={loading}
              initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
              variants={solidButtonVariants}
              className="w-full flex items-center justify-center gap-3 text-white h-[54px] text-[13px] font-medium disabled:opacity-50">
              {loading ? "Signing in…" : <>Sign in <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span></>}
            </MotionButton>
          </form>
        </div>
      </div>
    </div>
  );
}
