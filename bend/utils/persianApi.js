const exactMessages = new Map([
  ["Cart is empty", "سبد خرید خالی است."],
  ["Payment session is required", "نشست پرداخت لازم است."],
  ["Payment confirmation is required before creating the order", "پیش از ایجاد سفارش، تأیید پرداخت لازم است."],
  ["Checkout session was not found", "نشست تسویه‌حساب پیدا نشد."],
  ["Durable checkout session was not found", "نشست پایدار تسویه‌حساب پیدا نشد."],
  ["Checkout already has an order", "برای این تسویه‌حساب قبلاً سفارش ایجاد شده است."],
  ["Payment amount does not match the checkout", "مبلغ پرداخت با مبلغ تسویه‌حساب یکسان نیست."],
  ["Payment amount does not match the current cart", "مبلغ پرداخت با مبلغ فعلی سبد خرید یکسان نیست."],
  ["Shipping method does not match the paid checkout", "روش ارسال با تسویه‌حساب پرداخت‌شده یکسان نیست."],
  ["Choose a shipping service before payment", "پیش از پرداخت، روش ارسال را انتخاب کنید."],
  ["A valid checkout email is required", "ایمیل معتبر برای تسویه‌حساب لازم است."],
  ["Complete customer and shipping information before starting payment", "پیش از شروع پرداخت، اطلاعات مشتری و ارسال را کامل کنید."],
  ["Complete shipping and customer information before creating the order", "پیش از ایجاد سفارش، اطلاعات مشتری و ارسال را کامل کنید."],
  ["That promo code is not valid", "این کد تخفیف معتبر نیست."],
  ["That promo code has expired", "این کد تخفیف منقضی شده است."],
  ["That promo code is inactive", "این کد تخفیف فعال نیست."],
  ["Product not found", "محصول پیدا نشد."],
  ["Order not found", "سفارش پیدا نشد."],
  ["Ticket not found", "تیکت پیدا نشد."],
  ["Review not found", "دیدگاه پیدا نشد."],
  ["Invalid credentials", "اطلاعات ورود نادرست است."],
  ["Email already registered", "این ایمیل قبلاً ثبت شده است."],
  ["Session could not be revoked", "لغو نشست ممکن نیست."],
  ["Payment provider is not configured. Checkout is temporarily unavailable.", "درگاه پرداخت تنظیم نشده است؛ تسویه‌حساب موقتاً در دسترس نیست."],
  ["Unable to start secure payment checkout", "شروع پرداخت امن ممکن نیست."],
  ["Unable to verify payment with the provider", "تأیید پرداخت از درگاه ممکن نیست."],
  ["Checkout is temporarily unavailable", "تسویه‌حساب موقتاً در دسترس نیست."],
]);

const patterns = [
  [/^Unable to (load|save|create|update|delete|remove|send|submit|track|verify|start|clear|add|change|calculate|download|insert|reset)/i, "انجام این عملیات ممکن نیست."],
  [/^Failed to/i, "انجام این عملیات ممکن نیست."],
  [/^Request failed/i, "درخواست انجام نشد."],
  [/^Invalid /i, "مقدار واردشده معتبر نیست."],
  [/^A valid /i, "مقدار معتبر لازم است."],
  [/^Please /i, "لطفاً اطلاعات لازم را کامل کنید."],
  [/^Complete /i, "لطفاً اطلاعات لازم را کامل کنید."],
  [/^Choose /i, "لطفاً گزینه‌ی معتبر را انتخاب کنید."],
  [/^The checkout/i, "اطلاعات تسویه‌حساب معتبر نیست."],
  [/^That /i, "مقدار انتخاب‌شده معتبر نیست."],
  [/^Your /i, "اطلاعات واردشده معتبر نیست."],
  [/^Payment /i, "پرداخت انجام نشد."],
  [/^Order /i, "ثبت سفارش ممکن نیست."],
  [/^Cart /i, "عملیات سبد خرید انجام نشد."],
  [/^Quantity /i, "تعداد انتخاب‌شده معتبر نیست."],
  [/^Username /i, "نام کاربری معتبر نیست."],
  [/^Email /i, "ایمیل معتبر نیست."],
  [/^Password /i, "گذرواژه معتبر نیست."],
];

function localizeApiError(value) {
  const message = String(value || "").trim();
  if (!message || /[\u0600-\u06ff]/.test(message)) return message;
  if (exactMessages.has(message)) return exactMessages.get(message);
  const match = patterns.find(([pattern]) => pattern.test(message));
  return match ? match[1] : "امکان انجام این درخواست وجود ندارد.";
}

function persianApiErrorMiddleware(_req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && typeof body.error === "string") {
      return json({ ...body, error: localizeApiError(body.error) });
    }
    return json(body);
  };
  next();
}

module.exports = { localizeApiError, persianApiErrorMiddleware };
