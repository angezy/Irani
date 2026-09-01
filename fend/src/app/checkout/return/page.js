"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { confirmPayment, createOrder } from "../../lib/apiClient";
import { clearCheckoutState, readCheckoutState, shippingCost } from "../components/checkoutState";

export default function CheckoutReturnPage() {
  const router = useRouter();
  const finalized = useRef(false);
  const [status, setStatus] = useState("pending");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const providerStatus = query.get("status") || query.get("Status") || "pending";
    const authority = query.get("authority") || query.get("Authority") || "";
    queueMicrotask(() => setReference(authority || query.get("orderId") || ""));

    const isCanceled = ["cancel", "canceled", "cancelled"].includes(providerStatus);
    const isSuccessful = ["success", "succeeded"].includes(providerStatus);
    queueMicrotask(() => setStatus(isCanceled ? "cancelled" : isSuccessful ? "processing" : "pending"));

    if (!isSuccessful || !authority || finalized.current) return undefined;
    finalized.current = true;

    async function finalizeOrder() {
      const checkout = readCheckoutState();
      try {
        await confirmPayment({ paymentId: authority });
        const shipping = checkout.shipping || {};
        const result = await createOrder({
          paymentId: authority,
          paymentMethod: "card",
          customer: checkout.information || {},
          shippingAddress: {
            ...shipping,
            email: checkout.information.email,
            phone: checkout.information.phone,
            shippingMethod: shipping.logisticName || shipping.method,
          },
          shippingCost: shippingCost(shipping),
        });
        const orderId = result.order?.id || result.orderId;
        if (!orderId) throw new Error("پرداخت موفق بود اما شماره سفارش دریافت نشد.");
        clearCheckoutState();
        router.replace(`/checkout/success/${encodeURIComponent(orderId)}`);
      } catch (finalizeError) {
        setStatus("failed");
        setError(finalizeError.message || "تأیید پرداخت و ایجاد سفارش ممکن نشد.");
      }
    }

    finalizeOrder();
    return undefined;
  }, [router]);

  const isCanceled = status === "cancelled";
  const isProcessing = status === "processing";
  const isFailed = status === "failed";

  return (
    <Box sx={{ backgroundColor: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)", py: 8 }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="overline" sx={{ color: isCanceled ? "warning.light" : isFailed ? "error.light" : isProcessing ? "primary.light" : "success.light", letterSpacing: 3 }}>
              بازگشت از درگاه
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
              {isCanceled ? "پرداخت لغو شد" : isProcessing ? "در حال تأیید پرداخت" : isFailed ? "ثبت سفارش انجام نشد" : "بازگشت موفق از درگاه"}
            </Typography>
            <Typography sx={{ color: "var(--color-text-secondary)", mb: 3 }}>
              {isCanceled
                ? "سفارشی ثبت نشد. سبد خرید و اطلاعات تسویه‌حساب شما همچنان محفوظ است."
                : isProcessing
                ? "پرداخت را با زرین‌پال تأیید می‌کنیم و سپس سفارش شما را ثبت خواهیم کرد."
                : isFailed
                ? "پرداخت نیازمند بررسی است. اگر مبلغ از حساب شما کسر شده، تا بررسی پشتیبانی دوباره تلاش نکنید."
                : "وضعیت پرداخت خود را بررسی کنید و ادامه دهید."}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {reference && <Typography variant="body2" sx={{ mb: 3, color: "var(--color-text-secondary)", wordBreak: "break-all" }}>کد مرجع: {reference}</Typography>}
            {!isProcessing && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={Link} href={isCanceled || isFailed ? "/checkout/payment" : "/checkout"} variant="contained" sx={{ borderRadius: 999 }}>
                  {isCanceled ? "بازگشت به تسویه‌حساب" : isFailed ? "تلاش دوباره برای پرداخت" : "ادامه"}
                </Button>
                <Button component={Link} href="/cart" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>
                  مشاهده سبد خرید
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
