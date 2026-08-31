import { redirect } from "next/navigation";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "پشتیبانی گارانتی", description: "اطلاعات گارانتی و پشتیبانی محصولات را پیدا کنید.", path: "/warranty" });
}

export default function WarrantyPage() {
  redirect("/help-center");
}
