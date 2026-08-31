export const STORE_CURRENCY = String(process.env.NEXT_PUBLIC_STORE_CURRENCY || "IRR").trim().toUpperCase();

export function formatMoney(value) {
  const amount = Number(value) || 0;
  const digits = Number.isInteger(amount) ? 0 : 2;
  const number = amount.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const label = STORE_CURRENCY === "IRT" || STORE_CURRENCY === "TOMAN" ? "تومان" : STORE_CURRENCY === "USD" ? "دلار" : "ریال";
  return `${number} ${label}`;
}

export const fa = {
  addToCart: "افزودن به سبد",
  adding: "در حال افزودن…",
  cart: "سبد خرید",
  checkout: "تسویه‌حساب",
  continueShopping: "ادامه خرید",
  payment: "پرداخت",
  payWithZarinpal: "پرداخت امن با زرین‌پال",
};
