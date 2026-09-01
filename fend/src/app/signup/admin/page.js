"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "../../lib/notifications";

const API_BASE = "";

export default function AdminSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.email || !form.password) {
      setError("تکمیل همه فیلدها الزامی است");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/register/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/signin/admin");
          return;
        }
        throw new Error(data.error || data.message || "ثبت‌نام مدیر ناموفق بود");
      }
      toast.success("مدیر ساخته شد", { duration: 1000 });
      router.push("/signin/admin");
    } catch (err) {
      setError(err.message || "ثبت‌نام ناموفق بود");
      toast.error("ثبت‌نام ناموفق بود", { description: err.message || "دوباره تلاش کنید." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background)", color: "var(--color-text-primary)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460, background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid var(--color-border)", boxShadow: "0 20px 60px rgba(43,43,43,0.08)" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>ثبت‌نام مدیر</h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>برای ساخت حساب مدیر دیگر، یک مدیر فعلی باید وارد شده باشد.</p>
        {error && (
          <div style={{ color: "#fca5a5", background: "#7f1d1d", padding: 10, borderRadius: 8, border: "1px solid #f87171", marginBottom: 12 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="نام کاربری"
            value={form.username}
            onChange={handleChange("username")}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
            required
          />
          <input
            placeholder="ایمیل"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
            required
          />
          <input
            placeholder="رمز عبور"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px 14px", background: "var(--color-primary)", border: "none", color: "#ffffff", borderRadius: 10, cursor: loading ? "default" : "pointer", fontWeight: 700 }}
          >
            {loading ? "در حال ساخت…" : "ساخت حساب مدیر"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/signin/admin")}
            style={{ background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer" }}
          >
            حساب مدیر دارید؟ وارد شوید
          </button>
        </form>
      </div>
    </div>
  );
}
