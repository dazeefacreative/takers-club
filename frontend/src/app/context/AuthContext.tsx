import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { safeJsonParse } from "@/lib/safeJson";

// Shoppers never sign in — the store is guest-checkout only. This context
// exists solely for the store owner's admin session.
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("tc_token");
    const savedUser  = safeJsonParse<User | null>("tc_user", null);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("tc_token", data.token);
    localStorage.setItem("tc_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user as User;
  };

  const logout = () => {
    localStorage.removeItem("tc_token");
    localStorage.removeItem("tc_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin: user?.role === "admin", loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
