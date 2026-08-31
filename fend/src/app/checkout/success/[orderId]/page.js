"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Divider, Stack, Typography } from "@mui/material";
import OrderOutcomeLayout, { OutcomeButton } from "../../components/OrderOutcomeLayout";
import { fetchOrderById } from "../../../lib/apiClient";
import { hasConsent } from "../../../lib/cookies";
import { formatMoney, STORE_CURRENCY } from "../../../lib/locale";
import { useParams } from "next/navigation";

export default function CheckoutSuccessOrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const tracked = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchOrderById(orderId);
        if (!result?.order) throw new Error("سفارش پیدا نشد");
        if (active) setOrder(result.order);
      } catch (loadError) {
        if (active) setError(loadError.message || "جزئیات سفارش هنوز در حال پردازش است.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (orderId) load();
    return () => { active = false; };
  }, [orderId]);

  useEffect(() => {
    if (!order || tracked.current) return;
    tracked.current = true;
    const purchase = { transaction_id: order.id, value: Number(order.total || 0), currency: STORE_CURRENCY, items: order.items || [] };
    if (hasConsent("analytics")) window.gtag?.("event", "purchase", purchase);
    if (hasConsent("marketing")) {
      window.fbq?.("track", "Purchase", { value: purchase.value, currency: purchase.currency });
      window.ttq?.track?.("CompletePayment", purchase);
    }
  }, [order]);

  if (loading) {
    return <OrderOutcomeLayout type="cancelled" eyebrow="تأیید سفارش" title="در حال بررسی سفارش" description="رکورد سفارش را پیش از نمایش جزئیات بررسی می‌کنیم." actions={<OutcomeButton href="/checkout">بازگشت به تسویه‌حساب</OutcomeButton>} />;
  }

  if (error || !order) {
    return (
      <OrderOutcomeLayout type="cancelled" eyebrow="سفارش تأیید نشد" title="امکان تأیید این سفارش نیست" description="این صفحه پس از ثبت موفق سفارش پرداخت‌شده در دسترس قرار می‌گیرد." actions={<><OutcomeButton href="/checkout">بازگشت به تسویه‌حساب</OutcomeButton><OutcomeButton href="/cart" variant="outlined">مشاهده سبد خرید</OutcomeButton></>}>
        <Alert severity="warning">سفارش پرداخت‌شده‌ای برای این پیوند پیدا نشد.</Alert>
      </OrderOutcomeLayout>
    );
  }

  const shipping = order?.shippingAddress || {};
  const arrival = shipping.shippingWindow || "برای آخرین زمان تحویل، رهگیری سفارش را ببینید";

  return (
    <OrderOutcomeLayout type="success" eyebrow="سفارش تأیید شد" title="از خرید شما سپاسگزاریم!" description="سفارش شما با موفقیت ثبت شد. مراحل آماده‌سازی و ارسال را به شما اطلاع می‌دهیم." orderId={orderId} actions={<><OutcomeButton href="/tracking">رهگیری سفارش</OutcomeButton><OutcomeButton href="/shop" variant="outlined">ادامه خرید</OutcomeButton></>}>
      {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2.5}>
        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>ایمیل مشتری</Typography>
          <Typography>{shipping.email || "جزئیات تأیید در حساب کاربری شما موجود است."}</Typography>
          <Typography variant="body2" color="var(--color-text-secondary)">ایمیل تأیید پس از فعال‌سازی ارسال ایمیل فرستاده می‌شود.</Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>خلاصه سفارش</Typography>
          <Stack spacing={1}>
            {(order?.items || []).map((item, index) => (
              <Stack direction="row" justifyContent="space-between" key={`${item.title}-${index}`}>
                <Typography>{item.quantity} × {item.title}</Typography>
                <Typography>{formatMoney(Number(item.price || 0))}</Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ borderColor: "var(--color-border)", my: 2 }} />
          <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 900 }}>مبلغ پرداخت‌شده</Typography><Typography sx={{ fontWeight: 900 }}>{formatMoney(Number(order?.total || 0))}</Typography></Stack>
        </Box>
        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>اطلاعات ارسال</Typography>
          <Typography color="var(--color-primary)">زمان تقریبی تحویل: {arrival}</Typography>
          <Typography sx={{ mt: 1 }}>{shipping.fullName}</Typography>
          <Typography color="var(--color-text-secondary)">{[shipping.addressLine1, shipping.addressLine2, shipping.city, shipping.region, shipping.postalCode, shipping.country].filter(Boolean).join(", ") || "جزئیات ارسال در حال پردازش است."}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>مرحله بعد چیست؟</Typography>
          <Stack spacing={0.75} color="var(--color-text-secondary)">
            <Typography>✓ سفارش تأیید شد</Typography><Typography>✓ آماده‌سازی سفارش</Typography><Typography>✓ ایجاد اطلاعات رهگیری</Typography><Typography>✓ تحویل</Typography>
          </Stack>
        </Box>
        <Typography variant="body2" textAlign="center" color="var(--color-text-secondary)">کمک لازم دارید؟ <a href="/contact" style={{ color: "inherit" }}>تماس با پشتیبانی Weluxo</a> · <a href={`/invoice/${encodeURIComponent(orderId)}`} style={{ color: "inherit" }}>مشاهده فاکتور</a></Typography>
      </Stack>
    </OrderOutcomeLayout>
  );
}
