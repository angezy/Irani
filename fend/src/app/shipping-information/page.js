import { redirect } from "next/navigation";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "اطلاعات ارسال", description: "زمان ارسال، شهرهای تحت پوشش، پیگیری و اطلاعات تحویل سفارش.", path: "/shipping-information" });
}

export default function ShippingInformationPage() {
  redirect("/shipping-policy");
}
