export const STORE_CURRENCY = String(process.env.NEXT_PUBLIC_STORE_CURRENCY || "IRR").trim().toUpperCase();

export function formatMoney(value, currency = STORE_CURRENCY) {
  const amount = Number(value) || 0;
  const digits = Number.isInteger(amount) ? 0 : 2;
  const number = amount.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const normalizedCurrency = String(currency || STORE_CURRENCY).trim().toUpperCase();
  const label = normalizedCurrency === "IRT" || normalizedCurrency === "TOMAN" ? "تومان" : normalizedCurrency === "USD" ? "دلار" : normalizedCurrency === "EUR" ? "یورو" : "ریال";
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
