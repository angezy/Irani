const DEFAULT_STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "فروشگاه شما";
const DEFAULT_CHAT_CONFIG = {
  enabled: true,
  title: `پشتیبانی هوشمند ${DEFAULT_STORE_NAME}`,
  subtitle: `پاسخ‌ها از کتابخانه راهنمای ${DEFAULT_STORE_NAME}`,
  greeting: `سلام؛ من پشتیبان هوشمند ${DEFAULT_STORE_NAME} هستم. امروز برای پیدا کردن چه چیزی کمک می‌خواهید؟`,
  placeholder: "درباره سفارش یا ارسال بپرسید…",
  triggerLabel: "باز کردن گفت‌وگوی زنده",
  thinking: "در حال بررسی…",
  fallback: `پاسخ دقیقی در راهنمای ${DEFAULT_STORE_NAME} پیدا نشد. درباره ارسال، سفارش، مرجوعی، پرداخت، محصولات یا حساب خود بپرسید.`,
  error: "در حال حاضر دسترسی به پشتیبانی ممکن نیست. دوباره تلاش کنید.",
};

function envText(name, fallback) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getChatConfig() {
  const configuredEnabled = process.env.CHAT_ENABLED ?? process.env.WELUXO_CHAT_ENABLED;
  return {
    enabled: configuredEnabled !== "false",
    title: envText("CHAT_TITLE", envText("WELUXO_CHAT_TITLE", DEFAULT_CHAT_CONFIG.title)),
    subtitle: envText("CHAT_SUBTITLE", envText("WELUXO_CHAT_SUBTITLE", DEFAULT_CHAT_CONFIG.subtitle)),
    greeting: envText("CHAT_GREETING", envText("WELUXO_CHAT_GREETING", DEFAULT_CHAT_CONFIG.greeting)),
    placeholder: envText("CHAT_PLACEHOLDER", envText("WELUXO_CHAT_PLACEHOLDER", DEFAULT_CHAT_CONFIG.placeholder)),
    triggerLabel: envText("CHAT_TRIGGER_LABEL", envText("WELUXO_CHAT_TRIGGER_LABEL", DEFAULT_CHAT_CONFIG.triggerLabel)),
    thinking: envText("CHAT_THINKING", envText("WELUXO_CHAT_THINKING", DEFAULT_CHAT_CONFIG.thinking)),
    fallback: envText("CHAT_FALLBACK", envText("WELUXO_CHAT_FALLBACK", DEFAULT_CHAT_CONFIG.fallback)),
    error: envText("CHAT_ERROR", envText("WELUXO_CHAT_ERROR", DEFAULT_CHAT_CONFIG.error)),
  };
}
