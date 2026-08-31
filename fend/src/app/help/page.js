import { redirect } from "next/navigation";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "راهنما", description: "راهنمای محصولات، سفارش‌ها، ارسال، مرجوعی و پشتیبانی.", path: "/help" });
}

export default function HelpAliasPage() {
  redirect("/help-center");
}
