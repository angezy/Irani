import { getSitePageMetadata } from "../../../lib/siteSettingsServer";

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return getSitePageMetadata({ title: "پرداخت ناموفق بود", description: "پرداخت شما تکمیل نشد. با امنیت دوباره تلاش کنید یا روش پرداخت دیگری را انتخاب کنید.", path: `/checkout/failed/${encodeURIComponent(orderId)}` });
}

export default function FailedOrderLayout({ children }) { return children; }
