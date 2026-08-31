import InfoPage from "../components/InfoPage";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "امنیت پرداخت", description: "با روش‌های حفاظت از اطلاعات پرداخت و تسویه‌حساب در فروشگاه ما آشنا شوید.", path: "/payment-security" });
}

export default function PaymentSecurityPage() {
  return <InfoPage eyebrow="امنیت" title="امنیت پرداخت" description="فرآیند پرداخت شما باید شفاف، امن و قابل فهم باشد." sections={[
    { title: "پرداخت از طریق زرین‌پال", body: "ولکسو مبلغ سفارش را برای ایجاد تراکنش به درگاه زرین‌پال ارسال می‌کند. اطلاعات خام کارت، تاریخ انقضا و CVV در ولکسو ذخیره نمی‌شود." },
    { title: "وضعیت پرداخت", body: "در سفارش‌ها مشخص است که پرداخت در انتظار تأیید است یا تأیید شده. سفارش فقط پس از تأیید سمت سرور و تطبیق مبلغ پرداخت‌شده نهایی می‌شود." },
    { title: "حفاظت از حساب", body: "سفارش‌ها و جزئیات مرتبط با پرداخت فقط از طریق نشست احراز هویت‌شده مشتری در دسترس هستند. رمز عبور و کدهای یک‌بارمصرف خود را با دیگران به اشتراک نگذارید." },
  ]} />;
}
