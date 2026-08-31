"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, CardMedia, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { canAccessCheckoutStep, readCheckoutState, shippingCost, shippingLabel } from "./checkoutState";
import { CheckoutPageSkeleton } from "../../components/LoadingSkeletons";
import { formatMoney } from "../../lib/locale";

export const CHECKOUT_STEPS = [
  { key: "overview", label: "تسویه‌حساب", href: "/checkout" },
  { key: "information", label: "اطلاعات", href: "/checkout/information" },
  { key: "shipping", label: "ارسال", href: "/checkout/shipping" },
  { key: "payment", label: "پرداخت", href: "/checkout/payment" },
  { key: "confirmation", label: "تأیید", href: "/checkout/success" },
];

const money = formatMoney;

export default function CheckoutLayout({ currentStep, children, items = [], subtotal = 0, discount = null, couponCode = "", shippingMethod = "" }) {
  const shipping = shippingCost(shippingMethod);
  const hasShippingSelection = typeof shippingMethod === "object"
    ? Boolean(shippingMethod?.logisticName || shippingMethod?.method)
    : Boolean(shippingMethod);
  const tax = 0;
  const checkoutState = readCheckoutState();
  const appliedDiscount = discount == null ? Number(checkoutState.coupon?.discount) || 0 : Math.max(0, Number(discount) || 0);
  const appliedCouponCode = couponCode || checkoutState.coupon?.code || "";
  const total = Math.max(0, subtotal + shipping + tax - appliedDiscount);

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--color-background)", color: "var(--color-text-primary)", py: 3 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
          <Link href="/checkout" style={{ color: "var(--color-text-primary)", textDecoration: "none" }}>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: "-0.04em" }}>
              Weluxo
            </Typography>
          </Link>
          <Button component={Link} href="/checkout/cancelled/current" variant="text" sx={{ color: "var(--color-text-secondary)" }}>
            انصراف از تسویه‌حساب
          </Button>
        </Stack>

        <Card sx={{ mb: 4, bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
          <CardContent sx={{ py: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 0 }} justifyContent="space-between">
              {CHECKOUT_STEPS.map((step, index) => {
                const active = step.key === currentStep;
                const complete = CHECKOUT_STEPS.findIndex((item) => item.key === currentStep) > index;
                const accessible = canAccessCheckoutStep(checkoutState, step.key) && step.key !== "confirmation";
                return (
                  <Box key={step.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        bgcolor: active || complete ? "primary.main" : "#f1ece4",
                        color: active || complete ? "#ffffff" : "var(--color-text-secondary)",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {complete ? "✓" : index + 1}
                    </Box>
                    <Typography
                      component={accessible ? Link : "span"}
                      href={accessible ? step.href : undefined}
                      onClick={(event) => {
                        if (!accessible) event.preventDefault();
                      }}
                      sx={{
                        color: active ? "var(--color-text-primary)" : accessible ? "var(--color-text-secondary)" : "#a0a2a5",
                        fontWeight: active ? 800 : 600,
                        textDecoration: "none",
                        cursor: accessible ? "pointer" : "not-allowed",
                      }}
                      aria-current={active ? "step" : undefined}
                      aria-disabled={!accessible}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid
            sx={{ minWidth: 0, width: "100%" }}
            size={{
              xs: 12,
              md: 7
            }}>
            {children}
          </Grid>
          <Grid
            sx={{ minWidth: 0, width: "100%" }}
            size={{
              xs: 12,
              md: 5
            }}>
            <Card sx={{ width: "100%", minWidth: 0, bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", position: { md: "sticky" }, top: { md: 24 } }}>
              <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  خلاصه سفارش
                </Typography>
                <Stack spacing={1.5}>
                  {items.length ? items.map((item) => (
                    <Stack direction="row" spacing={1.5} alignItems="center" key={item.productId}>
                      <CardMedia component="img" image={item.image || "https://placehold.co/72x72?text=Weluxo"} alt={item.title || "محصول"} sx={{ width: 60, height: 60, borderRadius: 2, objectFit: "cover" }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 700 }}>{item.title || "محصول"}</Typography>
                        <Typography variant="body2" sx={{ color: "var(--color-text-secondary)" }}>تعداد {item.quantity}</Typography>
                      </Box>
                      <Typography>{money(Number(item.price) * Number(item.quantity))}</Typography>
                    </Stack>
                  )) : <Typography color="var(--color-text-secondary)">سبد خرید شما خالی است.</Typography>}
                </Stack>
                <Divider sx={{ borderColor: "var(--color-border)", my: 2 }} />
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography color="var(--color-text-secondary)">جمع جزء</Typography><Typography>{money(subtotal)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography color="var(--color-text-secondary)">{shippingLabel(shippingMethod)}</Typography><Typography>{!hasShippingSelection ? "در انتظار انتخاب" : shipping ? money(shipping) : "رایگان"}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography color="var(--color-text-secondary)">مالیات</Typography><Typography>{tax ? money(tax) : "بعداً محاسبه می‌شود"}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}><Typography color="var(--color-text-secondary)">تخفیف {appliedCouponCode && `(${appliedCouponCode})`}</Typography><Typography>{appliedDiscount ? `−${money(appliedDiscount)}` : "—"}</Typography></Stack>
                <Divider sx={{ borderColor: "var(--color-border)", mb: 2 }} />
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 900 }}>مبلغ کل</Typography><Typography variant="h6" sx={{ fontWeight: 900 }}>{money(total)}</Typography></Stack>
                <Button component={Link} href="/cart" fullWidth sx={{ mt: 2, color: "var(--color-primary)" }}>بازگشت به سبد خرید</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 4, color: "var(--color-text-secondary)" }}>
          <Typography variant="body2">کمک لازم دارید؟ <Link href="/contact" style={{ color: "inherit" }}>تماس با پشتیبانی</Link></Typography>
          <Link href="/shipping-policy" style={{ color: "inherit", fontSize: 14 }}>قوانین ارسال</Link>
          <Link href="/return-refund-policy" style={{ color: "inherit", fontSize: 14 }}>مرجوعی و بازپرداخت</Link>
          <Link href="/payment-security" style={{ color: "inherit", fontSize: 14 }}>امنیت پرداخت</Link>
        </Stack>
      </Container>
    </Box>
  );
}

export function CheckoutLoading() {
  return <CheckoutPageSkeleton />;
}

export function CheckoutAuthPrompt() {
  return (
    <Card sx={{ bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>برای ادامه وارد شوید</Typography>
        <Typography sx={{ color: "var(--color-text-secondary)", mb: 2 }}>برای ثبت امن سفارش، سبد خرید باید به حساب کاربری شما متصل باشد.</Typography>
        <Stack direction="row" spacing={1.5}><Button component={Link} href="/signin" variant="contained" sx={{ borderRadius: 999 }}>ورود</Button><Button component={Link} href="/cart" variant="outlined" sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", borderRadius: 999 }}>بازگشت به سبد خرید</Button></Stack>
      </CardContent>
    </Card>
  );
}
