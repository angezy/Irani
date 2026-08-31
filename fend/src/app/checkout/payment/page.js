"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Radio, Stack, Typography } from "@mui/material";
import { Country, State } from "country-state-city";
import CheckoutLayout, { CheckoutAuthPrompt, CheckoutLoading } from "../components/CheckoutLayout";
import { isInformationComplete, isShippingComplete, readCheckoutState, shippingCost, updateCheckoutState } from "../components/checkoutState";
import { useCheckoutData } from "../components/useCheckoutData";
import { createPayment } from "../../lib/apiClient";
import { toast } from "../../lib/notifications";
import { STORE_CURRENCY } from "../../lib/locale";

const paymentOptions = [
  { value: "card", label: "کارت بانکی", detail: "پرداخت امن از طریق زرین‌پال" },
];

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { user, items, subtotal, discount, couponCode, loading, error: cartError } = useCheckoutData();
  const [checkout, setCheckout] = useState(readCheckoutState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => queueMicrotask(() => setCheckout(readCheckoutState())), [user]);

  useEffect(() => {
    const state = readCheckoutState();
    if (!isInformationComplete(state)) {
      router.replace("/checkout/information");
    } else if (!isShippingComplete(state)) {
      router.replace("/checkout/shipping");
    }
  }, [router]);

  const countryName = useMemo(() => Country.getCountryByCode(checkout.shipping.country)?.name || checkout.shipping.country, [checkout.shipping.country]);
  const regionName = useMemo(() => State.getStateByCodeAndCountry(checkout.shipping.region, checkout.shipping.country)?.name || checkout.shipping.region, [checkout.shipping.region, checkout.shipping.country]);

  function selectPayment(method) {
    const next = { ...checkout, payment: { ...checkout.payment, method } };
    setCheckout(next);
    updateCheckoutState({ payment: next.payment });
  }

  async function handlePlaceOrder() {
    setError("");
    if (!checkout.information.email || !checkout.information.phone) {
      setError("پیش از ثبت سفارش، اطلاعات تماس را کامل کنید.");
      toast.warning("اطلاعات ناقص است", { description: "پیش از ثبت سفارش، اطلاعات تماس را کامل کنید." });
      return;
    }
    if (!checkout.shipping.fullName || !checkout.shipping.addressLine1 || !checkout.shipping.country || !checkout.shipping.region || !checkout.shipping.city || !checkout.shipping.postalCode) {
      setError("پیش از ثبت سفارش، اطلاعات ارسال را کامل کنید.");
      toast.warning("اطلاعات ارسال ناقص است", { description: "پیش از ثبت سفارش، اطلاعات ارسال را کامل کنید." });
      return;
    }
    setSubmitting(true);
    try {
      const total = Math.max(0, subtotal + shippingCost(checkout.shipping) - discount);
      const payment = await createPayment({
        amount: total,
        currency: STORE_CURRENCY,
        method: "card",
        customerEmail: checkout.information.email,
        shippingMethod: checkout.shipping.logisticName || checkout.shipping.method,
        couponCode,
        checkoutDetails: {
          information: checkout.information,
          shipping: checkout.shipping,
        },
      });
      const checkoutUrl = payment.payment?.checkoutUrl || payment.checkoutUrl;
      if (!checkoutUrl) throw new Error("درگاه پرداخت امن در دسترس نیست.");
      window.location.assign(checkoutUrl);
    } catch (submitError) {
      if (submitError.message === "unauthorized") {
        setError("نشست شما منقضی شده است. برای ثبت سفارش وارد شوید.");
        toast.error("نشست منقضی شد", { description: "برای ثبت سفارش وارد شوید." });
      } else {
        setError(submitError.message || "Payment could not be completed.");
        toast.error("خطا در پرداخت", { description: submitError.message || "پرداخت انجام نشد." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <CheckoutLoading />;
  if (!user) {
    return <CheckoutLayout currentStep="payment" items={items} subtotal={subtotal} discount={discount} couponCode={couponCode} shippingMethod={checkout.shipping}><CheckoutAuthPrompt /></CheckoutLayout>;
  }

  return (
    <CheckoutLayout currentStep="payment" items={items} subtotal={subtotal} discount={discount} couponCode={couponCode} shippingMethod={checkout.shipping}>
      {(cartError || error) && <Alert severity="error" sx={{ mb: 3 }}>{error || cartError}</Alert>}
      <Stack spacing={2.5}>
        <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>روش پرداخت</Typography>
            <Typography sx={{ color: "var(--color-text-secondary)", mb: 3 }}>پرداخت در صفحه امن زرین‌پال انجام می‌شود و اطلاعات کارت بانکی هرگز به Weluxo ارسال نمی‌شود.</Typography>
            <Stack spacing={1.5}>
              {paymentOptions.map((option) => {
                const selected = checkout.payment.method === option.value;
                return (
                  <Card key={option.value} onClick={() => selectPayment(option.value)} sx={{ cursor: "pointer", bgcolor: selected ? "var(--color-primary-soft)" : "var(--color-surface-muted)", color: "var(--color-text-primary)", border: selected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)" }}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <FormControlLabel control={<Radio checked={selected} onChange={() => selectPayment(option.value)} />} label={<Box><Typography sx={{ fontWeight: 800 }}>{option.label}</Typography><Typography variant="body2" color="var(--color-text-secondary)">{option.detail}</Typography></Box>} />
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
            <Alert severity="info" sx={{ mt: 3 }}>پس از تأیید پرداخت توسط زرین‌پال، به این فروشگاه بازگردانده می‌شوید.</Alert>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
          <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>نشانی صورتحساب</Typography>
          <Typography color="var(--color-text-secondary)">✓ همان نشانی ارسال</Typography>
            <Typography variant="body2" sx={{ color: "var(--color-text-secondary)", mt: 1 }}>{checkout.shipping.fullName}, {checkout.shipping.addressLine1}, {checkout.shipping.city}, {regionName}, {countryName}</Typography>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button onClick={handlePlaceOrder} variant="contained" size="large" disabled={submitting} sx={{ borderRadius: 999, py: 1.3, fontWeight: 900 }}>{submitting ? "در حال انتقال به درگاه…" : "پرداخت و ثبت سفارش"}</Button>
          <Button component={Link} href="/checkout/shipping" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>بازگشت به ارسال</Button>
        </Stack>
        <Alert severity="info">برای پرداخت، شناسه پذیرنده و نشانی بازگشت زرین‌پال باید در محیط سرور تنظیم شده باشد.</Alert>
      </Stack>
    </CheckoutLayout>
  );
}
