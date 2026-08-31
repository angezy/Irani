"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginRequest, fetchSession } from "../lib/apiClient";
import { toast } from "../lib/notifications";

const googleSignInMessages = {
  google_cancelled: "ورود با گوگل لغو شد.",
  google_invalid_state: "مهلت ورود با گوگل تمام شده است. دوباره تلاش کنید.",
  google_admin_not_allowed: "حساب‌های مدیر باید از صفحه ورود مدیر استفاده کنند.",
  google_unavailable: "ورود با گوگل در حال حاضر در دسترس نیست.",
  google_signin_failed: "ورود با گوگل انجام نشد. دوباره تلاش کنید.",
};

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const s = localStorage.getItem('signinEmail')
      if (s) queueMicrotask(() => setEmail(s))
    } catch (e) {}

    const googleError = new URLSearchParams(window.location.search).get("error");
    if (googleError) {
      queueMicrotask(() => setError(googleSignInMessages[googleError] || googleSignInMessages.google_signin_failed));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [])

  function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    router.push('/api/auth/google');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('')
    setLoading(true)
    try {
      await loginRequest(email, password, "user");
      try { localStorage.setItem('signinEmail', email) } catch (e) {}
      const session = await fetchSession();
      window.dispatchEvent(new CustomEvent("weluxo:session-updated", { detail: session?.user || null }));
      toast.success('ورود موفق بود!', { description: 'در حال انتقال به حساب شما...', duration: 700 });
      setTimeout(() => router.push('/account'), 700);
    } catch (err) {
      setError(err.message || 'خطای ارتباط با سرور')
      toast.error('خطای ارتباط با سرور', { description: err.message || 'خطایی رخ داد' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>خوش آمدید</h1>
        <p style={{ marginTop: 8, marginBottom: 20, color: '#475569' }}>برای ورود به حساب مشتری خود وارد شوید</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          <span aria-hidden="true" style={{ color: '#4285F4', fontSize: 18, fontWeight: 800 }}>G</span>
          ادامه با گوگل
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: '#94a3b8', fontSize: 12 }}>
          <span style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
          یا با ایمیل وارد شوید
          <span style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit} aria-describedby={error ? 'signin-error' : undefined}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#334155' }}>ایمیل</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', width: '100%' }}
                disabled={loading}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#334155' }}>رمز عبور</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', width: '100%' }}
                disabled={loading}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
              <Link href="/forgot-password" style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </div>

            {error && (
              <div id="signin-error" role="alert" style={{ color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  minWidth: 120,
                }}
              >
                {loading ? 'در حال ورود...' : 'ورود'}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setEmail(''); setPassword(''); setError('') }} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer' }}>
                  پاک کردن
                </button>
                <button type="button" onClick={() => router.push('/signup')} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                  ساخت حساب
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
