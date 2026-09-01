import AdminTicketList from "../../components/support/AdminTicketList";

export const dynamic = "force-dynamic";
export const metadata = { title: "تیکت‌های پشتیبانی | مدیریت", robots: { index: false, follow: false } };

export default function DashboardTicketsPage() {
  return <AdminTicketList />;
}
