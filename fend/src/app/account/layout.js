import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_COOKIE_NAME, verifyToken } from "../lib/auth";
import AccountNav from "./AccountNav";
import styles from "./account.module.css";

const navLinks = [
  { label: "نمای کلی", href: "/account", index: "۰۱" },
  { label: "سفارش‌ها", href: "/account/orders", index: "۰۲" },
  { label: "محصولات ذخیره‌شده", href: "/account/saved", index: "۰۳" },
  { label: "پروفایل", href: "/account/profile", index: "۰۴" },
  { label: "نشانی‌ها", href: "/account/addresses", index: "۰۵" },
  { label: "تنظیمات و امنیت", href: "/account/settings", index: "۰۶" },
  { label: "پشتیبانی", href: "/account/support", index: "۰۷" },
  { label: "رهگیری سفارش", href: "/account/tracking", index: "۰۸" },
];

export default async function AccountLayout({ children }) {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || ["admin", "owner"].includes(String(user.role || "").toLowerCase())) redirect("/signin");

  return (
    <div className={styles.page}>
      <div className={styles.accountHeader}>
        <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
          <Link href="/">خانه</Link><span aria-hidden="true">/</span><span>حساب کاربری من</span>
        </nav>
        <div className={styles.accountHeaderRow}>
          <div>
            <p className={styles.eyebrow}>حساب مشتری</p>
            <h1>حساب کاربری من</h1>
            <p>سفارش‌ها، پروفایل و محصولات ذخیره‌شده خود را مدیریت کنید.</p>
          </div>
          <Link className={styles.shopLink} href="/shop">ادامه خرید <span aria-hidden="true">←</span></Link>
        </div>
      </div>

      <div className={styles.main}>
        <aside className={styles.sidebar} aria-label="Account navigation">
          <div className={styles.sidebarTitle}>منوی حساب</div>
          <AccountNav links={navLinks} />
          <div className={styles.sidebarNote}>
            <span>کمک لازم دارید؟</span>
          <Link href="/help-center">مرکز راهنما</Link>
          </div>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
