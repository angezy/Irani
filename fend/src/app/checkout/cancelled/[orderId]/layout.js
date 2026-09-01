import { getSitePageMetadata } from "../../../lib/siteSettingsServer";

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return getSitePageMetadata({ title: "پرداخت لغو شد", description: "پرداخت شما لغو شد. سبد خریدتان تا زمان آمادگی شما حفظ می‌شود.", path: `/checkout/cancelled/${encodeURIComponent(orderId)}` });
}

export default function CancelledOrderLayout({ children }) { return children; }
