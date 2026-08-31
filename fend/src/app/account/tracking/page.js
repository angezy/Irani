"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchOrderById, fetchOrders, fetchSession } from "../../lib/apiClient";
import { hideSupplierBranding } from "../../lib/customerFacingText";
import { formatMoney } from "../../lib/locale";
import { AccountPageSkeleton } from "../../components/LoadingSkeletons";
import styles from "./tracking.module.css";

const STEPS = ["سفارش تأیید شد", "بسته‌بندی شد", "ارسال شد", "در مسیر ارسال", "در حال تحویل", "تحویل شد"];

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fa-IR", { month: "short", day: "numeric", year: "numeric", ...options });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getStepIndex(tracking, order) {
  if (Number.isFinite(Number(tracking?.progressIndex))) return Number(tracking.progressIndex);
  const status = String(order?.status || "processing").toLowerCase();
  if (status.includes("out for")) return 4;
  if (status.includes("deliver")) return 5;
  if (status.includes("transit")) return 3;
  if (status.includes("ship")) return 2;
  if (status.includes("pack")) return 1;
  return 0;
}

export default function AccountTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchSession(), fetchOrders()])
      .then(([sessionData, orderData]) => {
        if (!active) return;
        setSession(sessionData?.user || null);
        setRecentOrders(Array.isArray(orderData?.orders) ? orderData.orders.slice(0, 3) : []);
      })
      .catch(() => {
        if (active) setError("سفارش‌های حساب بارگذاری نشد. لطفاً دوباره تلاش کنید.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // Keep the visible journey current while the customer leaves the tracking
  // page open. The backend provides the latest order/tracking status and applies
  // the next monotonic storefront stage on each lookup.
  useEffect(() => {
    if (!order?.id) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const result = await fetchOrderById(order.id);
        if (active && result?.order) setOrder(result.order);
      } catch (_error) {
        // Keep the last known status visible during a temporary provider error.
      }
    };
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [order?.id]);

  const progressIndex = useMemo(() => getStepIndex(order?.tracking, order), [order]);

  const handleLookup = async (event) => {
    event.preventDefault();
    const value = orderId.trim();
    setError("");
    setOrder(null);
    if (!session) {
      setError("برای مشاهده امن سفارش‌های حساب وارد شوید.");
      return;
    }
    if (!value) {
      setError("برای ادامه شماره سفارش را وارد کنید.");
      return;
    }
    try {
      setLookupLoading(true);
      const result = await fetchOrderById(value);
      setOrder(result.order || null);
      if (!result.order) setError("این سفارش در حساب شما پیدا نشد.");
    } catch (lookupError) {
      setError(lookupError.message === "unauthorized" ? "نشست شما منقضی شده است. دوباره وارد شوید." : lookupError.message || "این سفارش پیدا نشد.");
    } finally {
      setLookupLoading(false);
    }
  };

  const selectRecentOrder = (value) => {
    setOrderId(String(value || ""));
    setError("");
  };

  if (loading) {
    return <AccountPageSkeleton variant="orders" />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>نمایش سفارش · ۱۴۰۵</div>
          <h1>هر ارسال،<br /><span>شفاف و دقیق پیش روی شما.</span></h1>
          <p>سفارش خود را از تأیید تا رسیدن به مقصد، در یک نمای ساده و دقیق دنبال کنید.</p>
          <div className={styles.heroMeta}><span>خصوصی برای حساب شما</span><span>به‌روزرسانی وضعیت ارسال</span></div>
        </div>
          <div className={styles.heroMark} aria-hidden="true"><span>IR</span><small>با اطمینان انتخاب کنید</small></div>
      </section>

      <section className={styles.lookupCard} aria-labelledby="lookup-title">
        <div>
          <div className={styles.sectionKicker}>رهگیری سفارش</div>
          <h2 id="lookup-title">سفارش شما اکنون کجاست؟</h2>
          <p>شماره سفارش را از ایمیل تأیید یا تاریخچه حساب وارد کنید.</p>
        </div>
        <form className={styles.lookupForm} onSubmit={handleLookup}>
          <label htmlFor="order-number">شماره سفارش</label>
          <div className={styles.inputRow}>
            <input id="order-number" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="WLX-20260810-12345" autoComplete="off" />
            <button type="submit" disabled={lookupLoading}>{lookupLoading ? "در حال بررسی…" : "رهگیری سفارش"}</button>
          </div>
        </form>
        {recentOrders.length > 0 && (
          <div className={styles.recentOrders}>
            <span>سفارش‌های اخیر</span>
            {recentOrders.map((recent) => <button type="button" key={recent.id} onClick={() => selectRecentOrder(recent.id)}>#{recent.id}</button>)}
          </div>
        )}
        {error && <div className={styles.error} role="alert">{error}</div>}
      </section>

      {!session && (
        <section className={styles.signInCard}>
          <div><strong>برای مشاهده خصوصی ارسال وارد شوید.</strong><span>تاریخچه سفارش و جزئیات ارسال شما به حساب‌تان متصل می‌ماند.</span></div>
          <Link href="/signin">ورود</Link>
        </section>
      )}

      {order && (
        <section className={styles.resultStack} aria-live="polite">
          <div className={styles.orderHeader}>
            <div><div className={styles.sectionKicker}>سفارش پیدا شد</div><h2>#{order.id}</h2><p>ثبت‌شده در {formatDateTime(order.placedAt)}</p></div>
            <div className={styles.statusBadge}>{order.status || "در حال پردازش"}</div>
          </div>

          <div className={styles.summaryGrid}>
            <div><span>زمان تقریبی تحویل</span><strong>{formatDate(order.tracking?.estimatedDelivery)}</strong><small>بر اساس روش ارسال شما</small></div>
            <div><span>حمل‌کننده</span><strong>{hideSupplierBranding(order.tracking?.carrier, "در زمان ارسال تعیین می‌شود")}</strong><small>{order.tracking?.trackingNumber ? `کد رهگیری ${order.tracking.trackingNumber}` : "کد رهگیری پس از ارسال نمایش داده می‌شود"}</small></div>
            <div><span>مقصد</span><strong>{order.shippingAddress?.city || "نشانی شما"}</strong><small>{order.shippingAddress?.country || "مقصد هنگام تسویه تأیید شد"}</small></div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.progressCard}>
              <div className={styles.cardHeader}><div><div className={styles.sectionKicker}>مسیر ارسال</div><h3>سفارش شما در حال حرکت است</h3></div><span>{Math.round(((progressIndex + 1) / STEPS.length) * 100)}٪</span></div>
              <div className={styles.stepper}>
                {STEPS.map((step, index) => <div className={`${styles.step} ${index < progressIndex ? styles.complete : ""} ${index === progressIndex ? styles.current : ""}`} key={step}><div className={styles.stepDot}>{index < progressIndex ? "✓" : String(index + 1).padStart(2, "0")}</div><div><strong>{step}</strong><small>{index === progressIndex ? "مرحله فعلی" : index < progressIndex ? "تکمیل‌شده" : "مرحله بعدی"}</small></div></div>)}
              </div>
              <div className={styles.progressTrack}><span style={{ width: `${Math.max(8, (progressIndex / (STEPS.length - 1)) * 100)}%` }} /></div>
            </div>

            <div className={styles.detailsCard}>
              <div className={styles.cardHeader}><div><div className={styles.sectionKicker}>جزئیات سفارش</div><h3>اقلام سفارش</h3></div><strong>{formatMoney(order.total)}</strong></div>
              <div className={styles.items}>{order.items?.length ? order.items.map((item, index) => <div className={styles.item} key={`${order.id}-${index}`}><div className={styles.itemThumb}>{String(item.title || "م").slice(0, 1).toUpperCase()}</div><div><strong>{item.title || "محصول فروشگاه ایرانی"}</strong><span>تعداد {item.quantity || 1}</span></div><b>{formatMoney(item.price)}</b></div>) : <p className={styles.muted}>اقلام سفارش اینجا نمایش داده می‌شوند.</p>}</div>
            </div>
          </div>

          <div className={styles.timelineCard}>
            <div className={styles.cardHeader}><div><div className={styles.sectionKicker}>به‌روزرسانی‌ها</div><h3>خط زمانی ارسال</h3></div><span className={styles.location}>{order.tracking?.currentLocation || "در حال پردازش سفارش"}</span></div>
            <div className={styles.timeline}>{(order.tracking?.events || []).map((event, index) => <div className={`${styles.timelineEvent} ${index === 0 ? styles.timelineLatest : ""}`} key={`${event.eventAt || event.createdAt}-${index}`}><div className={styles.timelineRail}><span /></div><div><strong>{hideSupplierBranding(event.title || event.status, "به‌روزرسانی سفارش")}</strong><p>{hideSupplierBranding(event.description, "وضعیت سفارش شما به‌روزرسانی شده است.")}</p><small>{formatDateTime(event.eventAt || event.createdAt)}{event.location ? ` · ${event.location}` : ""}</small></div></div>)}</div>
          </div>
        </section>
      )}

      {!order && !error && <div className={styles.emptyState}><span>۰۱</span><div><strong>برای مشاهده مسیر کامل، شماره سفارش را وارد کنید.</strong><p>به کمک نیاز دارید؟ به <Link href="/account/support">پشتیبانی</Link> سر بزنید.</p></div></div>}
    </div>
  );
}
