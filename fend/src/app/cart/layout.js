import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "سبد خرید", description: "سبد خرید خود را بررسی و تسویه‌حساب امن را با روش‌های ارسال قابل پشتیبانی کامل کنید.", path: "/cart" });
}

export default function CartLayout({ children }) {
  return children;
}
