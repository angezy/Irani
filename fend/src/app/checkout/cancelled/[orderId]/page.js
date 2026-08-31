"use client";

import { Alert, Stack, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import OrderOutcomeLayout, { OutcomeButton } from "../../components/OrderOutcomeLayout";

export default function CheckoutCancelledOrderPage() {
  const { orderId } = useParams();
  return (
    <OrderOutcomeLayout type="cancelled" eyebrow="تسویه‌حساب لغو شد" title="سفارش ثبت نشد" description="پرداختی انجام نشده است. سبد خرید شما محفوظ است و هر زمان آماده باشید می‌توانید ادامه دهید." orderId={orderId} actions={<><OutcomeButton href="/checkout">بازگشت به تسویه‌حساب</OutcomeButton><OutcomeButton href="/cart" variant="outlined">مشاهده سبد خرید</OutcomeButton><OutcomeButton href="/shop" variant="outlined">ادامه خرید</OutcomeButton></>}>
      <Stack spacing={2}><Alert severity="warning">محصولات و تعداد آن‌ها در سبد خرید شما محفوظ مانده است.</Alert><Typography textAlign="center" color="var(--color-text-secondary)">کمک لازم دارید؟ <a href="/contact" style={{ color: "inherit" }}>تماس با پشتیبانی Weluxo</a>.</Typography></Stack>
    </OrderOutcomeLayout>
  );
}
