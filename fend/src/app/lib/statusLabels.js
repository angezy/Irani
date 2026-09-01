const STATUS_LABELS = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  completed: "تکمیل‌شده",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغوشده",
  canceled: "لغوشده",
  authorized: "تأییدشده",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  refunded: "بازپرداخت‌شده",
  unfulfilled: "در انتظار ارسال",
  fulfilled: "ارسال تکمیل‌شده",
  exception: "نیازمند بررسی",
  packed: "بسته‌بندی‌شده",
  transit: "در مسیر ارسال",
  "in transit": "در مسیر ارسال",
  "out for delivery": "در حال تحویل",
};

export function translateStatus(value, fallback = "در انتظار بررسی") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  return STATUS_LABELS[raw.toLowerCase()] || (/^[\u0600-\u06ff\s‌-]+$/.test(raw) ? raw : fallback);
}
