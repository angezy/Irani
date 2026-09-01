import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "درخواست‌های پشتیبانی | مدیریت", robots: { index: false, follow: false } };

export default function AdminTicketsPage() {
  redirect("/dashboard/tikects");
}
