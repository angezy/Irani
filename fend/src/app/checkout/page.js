"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import CheckoutLayout, { CheckoutAuthPrompt, CheckoutLoading } from "./components/CheckoutLayout";
import { readCheckoutState } from "./components/checkoutState";
import { useCheckoutData } from "./components/useCheckoutData";

function shippingText(shipping) {
  return [shipping.addressLine1, shipping.addressLine2, shipping.city, shipping.region, shipping.postalCode, shipping.country]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const { user, items, subtotal, discount, couponCode, loading, error } = useCheckoutData();
  const [checkout, setCheckout] = useState(readCheckoutState());

  useEffect(() => {
    queueMicrotask(() => setCheckout(readCheckoutState()));
  }, [user]);

  if (loading) return <CheckoutLoading />;

  return (
    <CheckoutLayout currentStep="overview" items={items} subtotal={subtotal} discount={discount} couponCode={couponCode} shippingMethod={checkout.shipping}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!user ? (
        <CheckoutAuthPrompt />
      ) : !items.length ? (
        <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>سبد خرید شما خالی است</Typography>
            <Typography sx={{ color: "var(--color-text-secondary)", mb: 2 }}>پیش از شروع پرداخت امن، محصولی به سبد خرید اضافه کنید.</Typography>
            <Button component={Link} href="/shop" variant="contained" sx={{ borderRadius: 999 }}>ادامه خرید</Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>اطلاعات مشتری</Typography>
                  <Typography>{checkout.information.email || user.email || "ایمیل ثبت نشده است"}</Typography>
                  <Typography color="var(--color-text-secondary)">{checkout.information.phone || "شماره تماس ثبت نشده است"}</Typography>
                </Box>
                <Button component={Link} href="/checkout/information" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>ویرایش</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>نشانی ارسال</Typography>
                  <Typography>{checkout.shipping.fullName || "نشانی ثبت نشده است"}</Typography>
                  <Typography color="var(--color-text-secondary)">{shippingText(checkout.shipping) || "نشانی ارسال را انتخاب کنید"}</Typography>
                  <Typography color="var(--color-primary)" sx={{ mt: 1 }}>{checkout.shipping.label || checkout.shipping.logisticName || "روش ارسال انتخاب نشده است"}</Typography>
                </Box>
                <Button component={Link} href="/checkout/shipping" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>ویرایش</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>پرداخت</Typography>
                  <Typography sx={{ textTransform: "capitalize" }}>{checkout.payment.method || "زرین‌پال"}</Typography>
                  <Typography color="var(--color-text-secondary)">پیش از ثبت سفارش، تأیید امن درگاه پرداخت ضروری است.</Typography>
                </Box>
                <Button component={Link} href="/checkout/payment" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>ویرایش</Button>
              </Stack>
            </CardContent>
          </Card>

          <Alert severity="info">جزئیات سفارش شما هنگام طی مراحل پرداخت روی این دستگاه ذخیره می‌شود.</Alert>
          <Button component={Link} href="/checkout/information" variant="contained" size="large" sx={{ borderRadius: 999, py: 1.4, fontWeight: 800 }}>
            ادامه به اطلاعات
          </Button>
        </Stack>
      )}
    </CheckoutLayout>
  );
}
