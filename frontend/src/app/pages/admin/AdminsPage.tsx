import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { Reveal } from "@/app/components/motion/Reveal";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

interface Admin { id: number; first_name: string; last_name: string; email: string; created_at: string; }

const emptyForm = { first_name: "", last_name: "", email: "", password: "" };

export default function AdminsPage() {
  useDocumentTitle("Admin · Admins");
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [resetting, setResetting] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = () =>
    api.get("/admin/admins").then(({ data }) => setAdmins(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const fail = (err: any, fallback: string) =>
    setMessage({ type: "error", text: err.response?.data?.error || fallback });

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/admin/admins", form);
      setMessage({ type: "ok", text: `${form.email} can now sign in at /admin/login. Share the password with them privately.` });
      setForm({ ...emptyForm });
      load();
    } catch (err) {
      fail(err, "Could not add admin.");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (id: number) => {
    setMessage(null);
    try {
      await api.put(`/admin/admins/${id}/password`, { password: newPassword });
      setMessage({ type: "ok", text: "Password updated." });
      setResetting(null);
      setNewPassword("");
    } catch (err) {
      fail(err, "Could not update password.");
    }
  };

  const removeAdmin = async (admin: Admin) => {
    if (!window.confirm(`Remove ${admin.email} as an admin? They will no longer be able to sign in.`)) return;
    setMessage(null);
    try {
      await api.delete(`/admin/admins/${admin.id}`);
      setMessage({ type: "ok", text: `${admin.email} removed.` });
      load();
    } catch (err) {
      fail(err, "Could not remove admin.");
    }
  };

  const inputCls = "w-full border border-border px-3 py-2.5 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground";
  const buttonCls = "bg-foreground text-primary-foreground px-5 py-2.5 text-xs tracking-widest uppercase font-semibold disabled:opacity-50";

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Admins</h1>
        <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">
          People who can sign in to this panel · {admins.length}
        </p>
      </div>

      {message && (
        <p className={`text-xs mb-6 ${message.type === "error" ? "text-red-500" : "text-green-700"}`}>{message.text}</p>
      )}

      {loading ? (
        <div className="space-y-3 mb-10">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-secondary animate-pulse" />)}</div>
      ) : (
        <Reveal>
          <div className="border border-border mb-10">
            {admins.map((a) => (
              <div key={a.id} className="px-5 py-4 border-b border-border last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {a.first_name} {a.last_name}
                      {a.id === user?.id && <span className="ml-2 text-[10px] tracking-widest uppercase text-muted-foreground">You</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <div className="flex gap-4 text-[11px] tracking-widest uppercase">
                    <button type="button" className="underline underline-offset-4"
                      onClick={() => { setResetting(resetting === a.id ? null : a.id); setNewPassword(""); }}>
                      {resetting === a.id ? "Cancel" : "Reset password"}
                    </button>
                    {a.id !== user?.id && (
                      <button type="button" className="underline underline-offset-4 text-red-600" onClick={() => removeAdmin(a)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {resetting === a.id && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <input type="password" placeholder="New password (10+ characters)" value={newPassword} minLength={10}
                      onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className={inputCls} />
                    <button type="button" className={`${buttonCls} shrink-0`} disabled={newPassword.length < 10}
                      onClick={() => resetPassword(a.id)}>
                      Save password
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      )}

      <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">Add an admin</h2>
      <form onSubmit={addAdmin} className="grid grid-cols-2 gap-4">
        <input placeholder="First name" required value={form.first_name} onChange={set("first_name")} className={inputCls} />
        <input placeholder="Last name" required value={form.last_name} onChange={set("last_name")} className={inputCls} />
        <input type="email" placeholder="Email" required value={form.email} onChange={set("email")}
          className={`col-span-2 ${inputCls}`} autoComplete="off" />
        <input type="password" placeholder="Temporary password (10+ characters)" required minLength={10}
          value={form.password} onChange={set("password")} className={`col-span-2 ${inputCls}`} autoComplete="new-password" />
        <div className="col-span-2">
          <button type="submit" disabled={saving} className={buttonCls}>{saving ? "Adding…" : "Add admin"}</button>
          <p className="text-[11px] text-muted-foreground mt-3">
            They sign in at /admin/login with this email and password. Admins can manage products, orders and other admins.
          </p>
        </div>
      </form>
    </div>
  );
}
