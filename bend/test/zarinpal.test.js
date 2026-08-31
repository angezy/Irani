const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ZARINPAL_SANDBOX_API,
  callbackSucceeded,
  requestZarinpalPayment,
  toZarinpalAmount,
  verifyZarinpalPayment,
} = require("../utils/zarinpal");

const env = {
  ZARINPAL_MERCHANT_ID: "merchant-test",
  ZARINPAL_CALLBACK_URL: "https://shop.example.test/api/payment/zarinpal/callback",
  ZARINPAL_SANDBOX: "true",
  ZARINPAL_AMOUNT_UNIT: "RIAL",
};

function response(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(payload),
  };
}

test("Zarinpal amount conversion keeps RIAL exact and converts TOMAN once", () => {
  assert.equal(toZarinpalAmount(10000, "RIAL"), 10000);
  assert.equal(toZarinpalAmount(1000, "TOMAN"), 10000);
  assert.throws(() => toZarinpalAmount(9999, "RIAL"), /at least 10,000/);
});

test("Zarinpal request creates an authority with the exact server-side amount", async () => {
  const calls = [];
  const payment = await requestZarinpalPayment({
    amount: 125000,
    description: "سفارش آزمایشی",
    email: "customer@example.test",
    mobile: "09120000000",
  }, {
    env,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return response({ data: { code: 100, authority: "A000000000000000000000000001" }, errors: {} });
    },
  });

  assert.equal(calls[0].url, ZARINPAL_SANDBOX_API + "/request.json");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.merchant_id, env.ZARINPAL_MERCHANT_ID);
  assert.equal(body.amount, 125000);
  assert.equal(body.email, "customer@example.test");
  assert.equal(body.mobile, "09120000000");
  assert.match(payment.paymentUrl, /StartPay\/A000000000000000000000000001$/);
});

test("Zarinpal verification accepts an already-verified authority", async () => {
  const verification = await verifyZarinpalPayment({
    authority: "A000000000000000000000000001",
    amount: 125000,
  }, {
    env,
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.amount, 125000);
      assert.equal(body.authority, "A000000000000000000000000001");
      return response({ data: { code: 101, ref_id: 987654 }, errors: {} });
    },
  });

  assert.equal(verification.verified, true);
  assert.equal(verification.alreadyVerified, true);
  assert.equal(verification.refId, "987654");
});

test("Zarinpal callback status is case-insensitive", () => {
  assert.equal(callbackSucceeded("OK"), true);
  assert.equal(callbackSucceeded("ok"), true);
  assert.equal(callbackSucceeded("NOK"), false);
});
