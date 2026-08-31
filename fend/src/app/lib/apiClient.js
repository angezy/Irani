// Browser requests stay on the public frontend origin. Next.js proxies /api
// server-side using BACKEND_URL, so a deployed browser never calls localhost.
import { endLiveChatSession } from "./chatSession";

export const API_BASE = "";

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch (_err) {
    return null;
  }
}

export async function loginRequest(email, password, expectedRole) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, expectedRole }),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const message = apiError(data, "ورود ناموفق بود.");
    throw new Error(message);
  }
  return data;
}

async function passwordResetRequest(path, body, fallbackMessage) {
  const res = await fetch(`${API_BASE}/api/password-reset/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(apiError(data, fallbackMessage));
  }
  return data || {};
}

export function requestPasswordReset(email) {
  return passwordResetRequest("request", { email }, "ارسال کد بازیابی ممکن نیست.");
}

export function verifyPasswordResetCode(email, code) {
  return passwordResetRequest("verify", { email, code }, "تأیید کد بازیابی ممکن نیست.");
}

export function resetPassword(email, resetToken, password) {
  return passwordResetRequest("reset", { email, resetToken, password }, "بازنشانی رمز عبور ممکن نیست.");
}

export async function logoutRequest() {
  await endLiveChatSession();
  await fetch(`${API_BASE}/api/auth/signout?role=customer`, { method: "POST", credentials: "include" });
}

export async function fetchSession() {
  const res = await fetch(`${API_BASE}/api/session`, { credentials: "include" });
  if (res.status === 401) return null;
  const data = await parseJsonSafe(res);
  return data?.user ? data : null;
}

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/api/profile`, { credentials: "include" });
  if (res.status === 401) return null;
  const data = await parseJsonSafe(res);
  return data;
}

export async function updateProfileName(username) {
  const res = await fetch(`${API_BASE}/api/profile/name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const message = apiError(data, "به‌روزرسانی ناموفق بود.");
    throw new Error(message);
  }
  return data;
}

export async function fetchAccountDetails() {
  const res = await fetch(`${API_BASE}/api/account/details`, { credentials: "include", cache: "no-store" });
  if (res.status === 401) return null;
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(apiError(data, "بارگذاری اطلاعات حساب ممکن نیست."));
  return data || { profile: null, preferences: {}, addresses: [] };
}

export async function updateAccountProfile(details) {
  const res = await fetch(`${API_BASE}/api/account/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "به‌روزرسانی پروفایل ممکن نیست."));
  return data;
}

export async function updateAccountPreferences(preferences) {
  const res = await fetch(`${API_BASE}/api/account/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "به‌روزرسانی ترجیحات ممکن نیست."));
  return data;
}

export async function updateAccountPassword(details) {
  const res = await fetch(`${API_BASE}/api/account/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "تغییر رمز عبور ممکن نیست."));
  return data;
}

export async function fetchAccountAddresses() {
  const res = await fetch(`${API_BASE}/api/account/addresses`, { credentials: "include", cache: "no-store" });
  if (res.status === 401) return null;
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(apiError(data, "بارگذاری نشانی‌ها ممکن نیست."));
  return data || { addresses: [] };
}

export async function createAccountAddress(address) {
  const res = await fetch(`${API_BASE}/api/account/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(address),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "ذخیره نشانی ممکن نیست."));
  return data;
}

export async function updateAccountAddress(addressId, address) {
  const res = await fetch(`${API_BASE}/api/account/addresses/${encodeURIComponent(addressId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(address),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "به‌روزرسانی نشانی ممکن نیست."));
  return data;
}

export async function removeAccountAddress(addressId) {
  const res = await fetch(`${API_BASE}/api/account/addresses/${encodeURIComponent(addressId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "حذف نشانی ممکن نیست."));
  return data;
}

function apiError(data, fallback) {
  const message = String(data?.error || data?.message || "").trim();
  return /[\u0600-\u06ff]/.test(message) ? message : fallback;
}

export async function saveCheckoutDetails(details) {
  const res = await fetch(`${API_BASE}/api/account/checkout-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "ذخیره جزئیات پرداخت ممکن نیست."));
  return data || { ok: true };
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASE}/api/orders`, { credentials: "include" });
  if (res.status === 401) return { orders: [] };
  const data = await parseJsonSafe(res);
  return data || { orders: [] };
}

export async function fetchOrderById(orderId) {
  const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(orderId)}`, {
    credentials: "include",
  });
  if (res.status === 401) throw new Error("unauthorized");
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(apiError(data, "جست‌وجوی سفارش ناموفق بود."));
  }
  return data;
}

export async function checkoutCart(details = {}) {
  const hasDetails = details && typeof details === "object" && Object.keys(details).length > 0;
  const res = await fetch(`${API_BASE}/api/orders/checkout`, {
    method: "POST",
    headers: hasDetails ? { "Content-Type": "application/json" } : undefined,
    body: hasDetails ? JSON.stringify(details) : undefined,
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(apiError(data, "تسویه‌حساب ناموفق بود."));
  }
  return data;
}

function notifyCartUpdated(data) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("weluxo:cart-updated", { detail: data || { items: [], subtotal: 0 } }));
  }
}

export async function createPayment(details) {
  const res = await fetch(`${API_BASE}/api/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "شروع پرداخت ممکن نیست."));
  return data;
}

export async function confirmPayment(details) {
  const res = await fetch(`${API_BASE}/api/payment/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "پرداخت ناموفق بود."));
  return data;
}

export async function createOrder(details) {
  const res = await fetch(`${API_BASE}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "ایجاد سفارش ممکن نیست."));
  return data;
}

export async function fetchCart() {
  const res = await fetch(`${API_BASE}/api/cart`, { credentials: "include" });
  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(apiError(data, "بارگذاری سبد خرید ناموفق بود."));
  return data || { items: [], subtotal: 0 };
}

export async function addToCart(item) {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(item),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "افزودن به سبد خرید ناموفق بود."));
  notifyCartUpdated(data);
  return data;
}

export async function updateCartItem(productId, quantity) {
  const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "به‌روزرسانی سبد خرید ناموفق بود."));
  notifyCartUpdated(data);
  return data;
}

export async function removeCartItem(productId) {
  const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "حذف از سبد خرید ناموفق بود."));
  notifyCartUpdated(data);
  return data;
}

export async function applyCartCoupon(code) {
  const res = await fetch(`${API_BASE}/api/cart/apply-coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "اعمال کد تخفیف ممکن نیست."));
  return data;
}

export async function estimateCartShipping(details) {
  const res = await fetch(`${API_BASE}/api/cart/shipping-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(details),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "برآورد هزینه ارسال ممکن نیست."));
  return data;
}

export async function saveCartItem(item) {
  const res = await fetch(`${API_BASE}/api/cart/save-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(item),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "ذخیره محصول ممکن نیست."));
  notifyCartUpdated(data);
  return data;
}

export async function fetchSavedProducts() {
  const res = await fetch(`${API_BASE}/api/saved-products`, { credentials: "include", cache: "no-store" });
  if (res.status === 401) throw new Error("unauthorized");
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(apiError(data, "بارگذاری محصولات ذخیره‌شده ممکن نیست."));
  return data || { items: [] };
}

export async function saveProduct(productId) {
  const res = await fetch(`${API_BASE}/api/saved-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId }),
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "ذخیره محصول ممکن نیست."));
  return data;
}

export async function removeSavedProduct(productId) {
  const res = await fetch(`${API_BASE}/api/saved-products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJsonSafe(res);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(apiError(data, "حذف محصول ذخیره‌شده ممکن نیست."));
  return data;
}
