const ZARINPAL_PRODUCTION_API = "https://payment.zarinpal.com/pg/v4/payment";
const ZARINPAL_SANDBOX_API = "https://sandbox.zarinpal.com/pg/v4/payment";
const ZARINPAL_PRODUCTION_GATEWAY = "https://www.zarinpal.com/pg/StartPay";
const ZARINPAL_SANDBOX_GATEWAY = "https://sandbox.zarinpal.com/pg/StartPay";

class ZarinpalError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ZarinpalError";
    Object.assign(this, details);
  }
}

function zarinpalAmountUnit(env = process.env) {
  const value = String(env.ZARINPAL_AMOUNT_UNIT || "RIAL").trim().toUpperCase();
  if (!["RIAL", "IRR", "TOMAN", "IRT"].includes(value)) {
    throw new ZarinpalError("ZARINPAL_AMOUNT_UNIT must be RIAL or TOMAN", { code: "INVALID_AMOUNT_UNIT" });
  }
  return value === "IRR" ? "RIAL" : value === "IRT" ? "TOMAN" : value;
}

// Store totals are kept in the configured storefront currency. This is the
// only conversion used before calling Zarinpal; callers must not convert them
// again. RIAL/IRR values are sent as-is, TOMAN/IRT values are multiplied by 10.
function toZarinpalAmount(storeAmount, unit = zarinpalAmountUnit()) {
  const amount = Number(storeAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ZarinpalError("Payment amount must be a non-negative number", { code: "INVALID_AMOUNT" });
  }
  const normalizedUnit = String(unit).trim().toUpperCase();
  const multiplier = ["TOMAN", "IRT"].includes(normalizedUnit) ? 10 : 1;
  const result = Math.round(amount * multiplier);
  if (!Number.isSafeInteger(result) || result < 10000) {
    throw new ZarinpalError("Zarinpal payment amount must be at least 10,000 RIAL", { code: "AMOUNT_TOO_SMALL" });
  }
  return result;
}

function zarinpalConfig(env = process.env) {
  const merchantId = String(env.ZARINPAL_MERCHANT_ID || "").trim();
  const callbackUrl = String(env.ZARINPAL_CALLBACK_URL || "").trim();
  const sandbox = String(env.ZARINPAL_SANDBOX ?? "true").trim().toLowerCase() === "true";
  const amountUnit = zarinpalAmountUnit(env);
  return {
    merchantId,
    callbackUrl,
    sandbox,
    amountUnit,
    apiBaseUrl: sandbox ? ZARINPAL_SANDBOX_API : ZARINPAL_PRODUCTION_API,
    gatewayBaseUrl: sandbox ? ZARINPAL_SANDBOX_GATEWAY : ZARINPAL_PRODUCTION_GATEWAY,
    configured: Boolean(merchantId && /^https?:\/\//i.test(callbackUrl)),
  };
}

async function zarinpalRequest(pathname, body, { fetchImpl = global.fetch, env = process.env } = {}) {
  const config = zarinpalConfig(env);
  if (!config.configured) throw new ZarinpalError("Zarinpal payment provider is not configured", { code: "NOT_CONFIGURED" });
  if (typeof fetchImpl !== "function") throw new ZarinpalError("Fetch is unavailable for Zarinpal", { code: "FETCH_UNAVAILABLE" });

  let response;
  try {
    response = await fetchImpl(`${config.apiBaseUrl}${pathname}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: config.merchantId, ...body }),
    });
  } catch (error) {
    throw new ZarinpalError("Zarinpal request failed", { code: "NETWORK_ERROR", cause: error });
  }

  const raw = await response.text();
  let payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch (_error) { payload = {}; }
  const data = payload?.data || {};
  const errors = payload?.errors || {};
  const code = Number(data.code ?? errors.code ?? response.status);
  if (!response.ok || (Number.isFinite(code) && code < 0)) {
    throw new ZarinpalError("Zarinpal rejected the payment request", {
      code: Number.isFinite(code) ? code : "PROVIDER_ERROR",
      providerMessage: String(errors.message || data.message || "").slice(0, 300),
    });
  }
  return { ...payload, data, errors, code };
}

async function requestZarinpalPayment({ amount, description, email, mobile, callbackUrl }, options = {}) {
  const config = zarinpalConfig(options.env || process.env);
  const gatewayAmount = toZarinpalAmount(amount, config.amountUnit);
  const response = await zarinpalRequest("/request.json", {
    amount: gatewayAmount,
    description: String(description || "فروشگاه Weluxo").slice(0, 255),
    callback_url: String(callbackUrl || config.callbackUrl).trim(),
    ...(email ? { email: String(email).slice(0, 255) } : {}),
    ...(mobile ? { mobile: String(mobile).slice(0, 40) } : {}),
  }, options);
  const authority = String(response.data?.authority || "").trim();
  if (!authority) throw new ZarinpalError("Zarinpal did not return an authority", { code: "MISSING_AUTHORITY" });
  return {
    authority,
    gatewayAmount,
    code: response.code,
    paymentUrl: `${config.gatewayBaseUrl}/${encodeURIComponent(authority)}`,
  };
}

async function verifyZarinpalPayment({ authority, amount }, options = {}) {
  const config = zarinpalConfig(options.env || process.env);
  const normalizedAuthority = String(authority || "").trim();
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(normalizedAuthority)) {
    throw new ZarinpalError("Invalid Zarinpal authority", { code: "INVALID_AUTHORITY" });
  }
  const gatewayAmount = toZarinpalAmount(amount, config.amountUnit);
  const response = await zarinpalRequest("/verify.json", {
    amount: gatewayAmount,
    authority: normalizedAuthority,
  }, options);
  const refId = response.data?.ref_id ?? response.data?.refId ?? null;
  const code = Number(response.data?.code ?? response.code);
  if (![100, 101].includes(code)) {
    throw new ZarinpalError("Zarinpal could not verify the payment", {
      code: Number.isFinite(code) ? code : "VERIFY_FAILED",
      providerMessage: String(response.errors?.message || response.data?.message || "").slice(0, 300),
    });
  }
  return { verified: true, alreadyVerified: code === 101, code, refId: refId ? String(refId) : null, gatewayAmount };
}

function callbackSucceeded(status) {
  return String(status || "").trim().toUpperCase() === "OK";
}

module.exports = {
  ZARINPAL_PRODUCTION_API,
  ZARINPAL_SANDBOX_API,
  ZarinpalError,
  callbackSucceeded,
  requestZarinpalPayment,
  toZarinpalAmount,
  verifyZarinpalPayment,
  zarinpalAmountUnit,
  zarinpalConfig,
};
