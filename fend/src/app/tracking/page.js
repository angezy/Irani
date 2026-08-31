import { redirect } from "next/navigation";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "پیگیری سفارش", description: "سفارش خود را پیگیری کنید و وضعیت ارسال را ببینید.", path: "/tracking" });
}

export default function TrackingPage() {
  redirect("/account/tracking");
}
