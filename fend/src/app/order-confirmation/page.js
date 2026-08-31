import InfoPage from "../components/InfoPage";
import { getSitePageMetadata } from "../lib/siteSettingsServer";

export async function generateMetadata() {
  return getSitePageMetadata({ title: "تأیید سفارش", description: "تأیید سفارش، رهگیری و لینک فاکتور خود را پیدا کنید.", path: "/order-confirmation" });
}

export default function OrderConfirmationPage() {
  return <InfoPage eyebrow="سفارش‌ها" title="تأیید سفارش" description="پس از پرداخت، شماره سفارش، مبلغ، اطلاعات ارسال، رهگیری و لینک فاکتور در صفحه تأیید نمایش داده می‌شود." sections={[
    { title: "سفارش خود را ثبت کرده‌اید؟", body: "برای دیدن خریدهای اخیر، به بخش سفارش‌های حساب کاربری بروید یا با شماره سفارش آن را رهگیری کنید." },
    { title: "فاکتور خود را می‌خواهید؟", body: "از لینک فاکتور در صفحه تأیید سفارش استفاده کنید. برای دیدن جزئیات سفارش باید وارد حساب کاربری باشید." },
  ]} />;
}
