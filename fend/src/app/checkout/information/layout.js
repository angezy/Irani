import { getSitePageMetadata } from "../../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "اطلاعات ارسال و تسویه‌حساب", description: "سفارش خود را با اطلاعات امن مشتری و تحویل کامل کنید.", path: "/checkout/information" });
}

export default function CheckoutInformationLayout({ children }) {
  return children;
}
