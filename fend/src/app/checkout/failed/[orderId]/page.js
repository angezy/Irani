"use client";

import { Alert, Box, Stack, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import OrderOutcomeLayout, { OutcomeButton } from "../../components/OrderOutcomeLayout";

export default function CheckoutFailedOrderPage() {
  const { orderId } = useParams();
  return (
    <OrderOutcomeLayout type="failed" eyebrow="پرداخت ناموفق بود" title="پرداخت شما تکمیل نشد" description="محصولات و تعداد آن‌ها محفوظ مانده است. دوباره تلاش کنید یا با پشتیبانی تماس بگیرید." orderId={orderId} actions={<><OutcomeButton href="/checkout/payment?retry=true">تلاش دوباره برای پرداخت</OutcomeButton><OutcomeButton href="/cart" variant="outlined">مشاهده سبد خرید</OutcomeButton></>}>
      <Stack spacing={2.5}>
        <Alert severity="error">پرداخت تأیید نشد و سفارش تکمیل‌شده‌ای ایجاد نشده است.</Alert>
        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>دلیل احتمالی</Typography>
          <Typography color="var(--color-text-secondary)">ممکن است پرداخت رد شده باشد، به تأیید بیشتری نیاز داشته باشد یا خطای ارتباطی رخ داده باشد.</Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>به کمک نیاز دارید؟</Typography>
          <Typography color="var(--color-text-secondary)">با پشتیبانی Weluxo تماس بگیرید و کد #{orderId} را اعلام کنید.</Typography>
        </Box>
      </Stack>
    </OrderOutcomeLayout>
  );
}
