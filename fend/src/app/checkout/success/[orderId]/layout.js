import { getSitePageMetadata } from "../../../lib/siteSettingsServer";

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return {
    ...(await getSitePageMetadata({ title: "سفارش تأیید شد", description: "سفارش شما با موفقیت تأیید شد. مرسوله را رهگیری کنید و به‌روزرسانی‌ها را ببینید.", path: `/checkout/success/${encodeURIComponent(orderId)}` })),
  };
}

export default function SuccessOrderLayout({ children }) {
  return children;
}
