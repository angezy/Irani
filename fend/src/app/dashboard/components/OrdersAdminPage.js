"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import styles from "./ordersAdmin.module.css";
import { TablePageSkeleton } from "../../components/LoadingSkeletons";

const DEFAULT_FILTERS = {
  range: "last30",
  from: "",
  to: "",
  currency: "",
  status: "",
  paymentStatus: "",
  fulfillmentStatus: "",
};

const RANGE_OPTIONS = [
  ["today", "امروز"],
  ["yesterday", "دیروز"],
  ["last7", "۷ روز گذشته"],
  ["last30", "۳۰ روز گذشته"],
  ["thismonth", "این ماه"],
  ["lastmonth", "ماه گذشته"],
  ["thisyear", "امسال"],
  ["custom", "بازه سفارشی"],
];

const LABELS = {
  paid: "پرداخت‌شده", pending: "در انتظار", processing: "در حال پردازش", completed: "تکمیل‌شده", shipped: "ارسال‌شده", delivered: "تحویل‌شده", cancelled: "لغوشده", canceled: "لغوشده", failed: "ناموفق", refunded: "بازپرداخت‌شده", authorized: "تأییدشده", unfulfilled: "ارسال‌نشده", open: "باز", draft: "پیش‌نویس", "in transit": "در مسیر ارسال", "partially refunded": "بخشی بازپرداخت‌شده", blocked: "مسدود", zarinpal: "زرین‌پال", manual: "دستی", card: "کارت بانکی", shipping: "ارسال", billing: "صورتحساب", standard: "استاندارد", express: "سریع",
  order: "سفارش", orders: "سفارش‌ها", customer: "مشتری", customers: "مشتریان", status: "وضعیت", payment: "پرداخت", fulfillment: "تکمیل ارسال", "sales channel": "کانال فروش", source: "منبع", supplier: "تأمین‌کننده", suppliers: "تأمین‌کنندگان", tracking: "پیگیری", carrier: "حمل‌کننده", shipped: "ارسال‌شده", shipping: "ارسال", billing: "صورتحساب", product: "محصول", products: "محصولات", sku: "شناسه محصول", qty: "تعداد", quantity: "تعداد", total: "مبلغ کل", subtotal: "جمع جزء", discount: "تخفیف", tax: "مالیات", refunded: "بازپرداخت‌شده", name: "نام", email: "ایمیل", phone: "تلفن", address: "نشانی", addresses: "نشانی‌ها", invoices: "فاکتورها", refunds: "بازپرداخت‌ها", method: "روش", provider: "ارائه‌دهنده", reference: "مرجع", amount: "مبلغ", source: "منبع", created: "ایجادشده", paid: "پرداخت‌شده", completed: "تکمیل‌شده", cancelled: "لغوشده", "last updated": "آخرین به‌روزرسانی", "customer number": "شماره مشتری", "order id": "شناسه سفارش", "legacy order id": "شناسه قدیمی سفارش", "order status": "وضعیت سفارش", "order information": "اطلاعات سفارش", "order summary": "خلاصه سفارش", "order detail": "جزئیات سفارش", "order activity": "فعالیت سفارش", "status and tracking history": "سوابق وضعیت و پیگیری", "supplier orders": "سفارش‌های تأمین‌کننده", "line item": "قلم سفارش", "line items": "قلم سفارش", transaction: "تراکنش", transactions: "تراکنش‌ها", shipment: "مرسوله", shipments: "مرسوله‌ها", invoices: "فاکتورها", issued: "صادرشده", "no sku": "بدون شناسه محصول",
};

function label(value) {
  if (value == null || value === "") return "—";
  const raw = String(value).trim();
  if (LABELS[raw.toLowerCase()]) return LABELS[raw.toLowerCase()];
  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function value(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function dateValue(input, withTime = false) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return value(input);
  return new Intl.DateTimeFormat("fa-IR", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function money(amount, currency = "IRR") {
  const code = /^[A-Za-z]{3}$/.test(String(currency || "")) ? String(currency).toUpperCase() : "IRR";
  return new Intl.NumberFormat("fa-IR", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(Number(amount || 0));
}

function number(amount) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(Number(amount || 0));
}

function tone(status) {
  const normalized = String(status || "").toLowerCase();
  if (["paid", "completed", "delivered", "shipped", "authorized"].includes(normalized)) return "success";
  if (["processing", "in transit", "partially refunded"].includes(normalized)) return "info";
  if (["pending", "unfulfilled", "open", "draft"].includes(normalized)) return "warning";
  if (["cancelled", "canceled", "failed", "refunded", "blocked"].includes(normalized)) return "danger";
  return "neutral";
}

function StatusPill({ status }) {
  return <span className={`${styles.status} ${styles[tone(status)]}`}>{label(status)}</span>;
}

function StatCard({ icon: Icon, label: statLabel, value: statValue, detail, tone: cardTone = "blue" }) {
  return (
    <article className={`${styles.statCard} ${styles[`stat${cardTone}`]}`}>
      <span className={styles.statIcon}><Icon fontSize="small" /></span>
      <div className={styles.statCopy}>
        <span>{statLabel}</span>
        <strong>{statValue}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function DetailSection({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`${styles.detailSection} ${className}`}>
      <div className={styles.detailSectionHeading}>
        <div>
          {eyebrow && <span className={styles.detailEyebrow}>{eyebrow}</span>}
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailValue({ label: detailLabel, children, wide = false }) {
  return <div className={`${styles.detailValue} ${wide ? styles.wide : ""}`}><span>{detailLabel}</span><strong>{children}</strong></div>;
}

function AddressCard({ address, title }) {
  if (!address) {
    return <div className={styles.emptyInline}>نشانی {title} برای این سفارش ثبت نشده است.</div>;
  }

  const fullName = [address.FirstName, address.LastName].filter(Boolean).join(" ");
  const lines = [
    fullName,
    address.Company,
    address.AddressLine1,
    address.AddressLine2,
    [address.City, address.StateProvince, address.PostalCode].filter(Boolean).join(", "),
    address.CountryCode,
  ].filter(Boolean);

  return (
    <div className={styles.addressCard}>
      <div className={styles.addressCardTop}><span>{title}</span>{address.Phone && <small>{address.Phone}</small>}</div>
      <address>{lines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</address>
    </div>
  );
}

function EmptyRows({ children = "No records captured." }) {
  return <div className={styles.emptyInline}>{children}</div>;
}

function DetailModal({ selected, detail, loading, error, onClose, onRetry }) {
  useEffect(() => {
    if (!selected) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, selected]);

  if (!selected) return null;

  const order = detail?.order || selected;
  const items = detail?.items || [];
  const addresses = detail?.addresses || [];
  const shippingAddress = addresses.find((address) => String(address.AddressType).toLowerCase() === "shipping");
  const billingAddress = addresses.find((address) => String(address.AddressType).toLowerCase() === "billing");
  const currency = order.Currency || selected.Currency || "IRR";
  const customerName = order.FullName || [order.FirstName, order.LastName].filter(Boolean).join(" ");

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <header className={styles.modalHeader}>
          <div className={styles.modalHeading}>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="بستن جزئیات سفارش"><CloseRoundedIcon /></button>
            <div>
              <span className={styles.detailEyebrow}>جزئیات سفارش</span>
              <h2 id="order-detail-title">{value(order.OrderNumber || selected.OrderNumber)}</h2>
              <p>ثبت‌شده در {dateValue(order.PlacedAt || order.CreatedAt || selected.CreatedAt, true)}</p>
            </div>
          </div>
          <div className={styles.modalActions}>
            <StatusPill status={order.OrderStatus || selected.OrderStatus} />
            <button className={styles.closeButton} type="button" onClick={onClose}>بستن</button>
          </div>
        </header>

        <div className={styles.modalScroll} onMouseDown={(event) => event.stopPropagation()}>
          {loading && <div className={styles.detailLoading}><span className={styles.spinner} /> در حال بارگذاری جزئیات کامل سفارش…</div>}
          {error && <div className={styles.detailError}><strong>بارگذاری این سفارش ممکن نیست.</strong><span>{error}</span><button type="button" onClick={onRetry}>تلاش دوباره</button></div>}

          {!loading && !error && detail && <>
            <div className={styles.statusStrip}>
              <div><span>وضعیت سفارش</span><StatusPill status={order.OrderStatus} /></div>
              <div><span>پرداخت</span><StatusPill status={order.PaymentStatus} /></div>
              <div><span>ارسال</span><StatusPill status={order.FulfillmentStatus} /></div>
              <div><span>کانال فروش</span><strong>{label(order.SalesChannel)}</strong></div>
            </div>

            <div className={styles.detailLayout}>
              <div className={styles.detailMain}>
                <DetailSection title="محصولات" eyebrow={`${items.length} قلم سفارش`}>
                  {items.length ? (
                    <div className={styles.innerTableWrap}>
                      <table className={styles.innerTable}>
                        <thead><tr><th>محصول</th><th>شناسه</th><th>تعداد</th><th>قیمت واحد</th><th className={styles.alignRight}>مبلغ کل</th></tr></thead>
                        <tbody>{items.map((item) => <tr key={item.Id}>
                          <td><strong>{value(item.ProductName)}</strong>{item.VariantName && <small>{item.VariantName}</small>}</td>
                          <td>{value(item.SKU)}</td>
                          <td>{number(item.Quantity)}</td>
                          <td>{money(item.UnitPrice, currency)}</td>
                          <td className={styles.alignRight}><strong>{money(item.TotalAmount, currency)}</strong></td>
                        </tr>)}</tbody>
                      </table>
                    </div>
                  ) : <EmptyRows>هیچ قلمی برای این سفارش ثبت نشده است.</EmptyRows>}
                </DetailSection>

                <DetailSection title="پرداخت‌ها" eyebrow={`${(detail.payments || []).length} تراکنش`}>
                  {detail.payments?.length ? <div className={styles.innerTableWrap}><table className={styles.innerTable}>
                    <thead><tr><th>روش</th><th>ارائه‌دهنده</th><th>مرجع</th><th>وضعیت</th><th className={styles.alignRight}>مبلغ</th></tr></thead>
                    <tbody>{detail.payments.map((payment) => <tr key={payment.Id}>
                      <td>{label(payment.PaymentMethod)}</td><td>{label(payment.PaymentProvider)}</td><td className={styles.mono}>{value(payment.ExternalTransactionId)}</td><td><StatusPill status={payment.Status} /></td><td className={styles.alignRight}><strong>{money(payment.Amount, payment.Currency || currency)}</strong><small>{dateValue(payment.ProcessedAt || payment.CreatedAt)}</small></td>
                    </tr>)}</tbody>
                  </table></div> : <EmptyRows>هیچ تراکنش پرداختی به این سفارش متصل نیست.</EmptyRows>}
                </DetailSection>

                <DetailSection title="ارسال" eyebrow={`${(detail.shipments || []).length} مرسوله`}>
                  {detail.shipments?.length ? <div className={styles.fulfillmentList}>{detail.shipments.map((shipment) => <article className={styles.fulfillmentCard} key={shipment.Id}>
                    <div className={styles.fulfillmentTop}><div><strong>{value(shipment.ShipmentNumber)}</strong><span>{value(shipment.Supplier)}{shipment.Service ? ` · ${shipment.Service}` : ""}</span></div><StatusPill status={shipment.Status} /></div>
                    <div className={styles.fulfillmentMeta}><span>حمل‌کننده <strong>{value(shipment.Carrier)}</strong></span><span>پیگیری <strong className={styles.mono}>{value(shipment.TrackingNumber)}</strong></span><span>ارسال‌شده <strong>{dateValue(shipment.ShippedAt)}</strong></span></div>
                    {shipment.TrackingUrl && <a className={styles.externalLink} href={shipment.TrackingUrl} target="_blank" rel="noreferrer">باز کردن پیگیری <LaunchRoundedIcon fontSize="inherit" /></a>}
                  </article>)}</div> : <EmptyRows>هنوز مرسوله‌ای ایجاد نشده است.</EmptyRows>}
                  {detail.supplierOrders?.length > 0 && <div className={styles.supplierOrders}><span className={styles.subsectionLabel}>سفارش‌های تأمین‌کننده</span>{detail.supplierOrders.map((supplierOrder) => <div className={styles.supplierRow} key={supplierOrder.Id}><span><strong>{value(supplierOrder.PurchaseOrderNumber)}</strong><small>{value(supplierOrder.Supplier)}{supplierOrder.ExternalOrderId ? ` · ${supplierOrder.ExternalOrderId}` : ""}</small></span><StatusPill status={supplierOrder.Status} /><strong>{money(supplierOrder.TotalCost, supplierOrder.Currency || currency)}</strong></div>)}</div>}
                </DetailSection>

                <DetailSection title="فعالیت سفارش" eyebrow="سوابق وضعیت و پیگیری">
                  {(detail.history?.length || detail.trackingEvents?.length) ? <div className={styles.timeline}>
                    {[...(detail.history || []).map((event) => ({ ...event, kind: "status", date: event.CreatedAt, title: `${label(event.PreviousStatus)} → ${label(event.NewStatus)}`, description: event.Reason })), ...(detail.trackingEvents || []).map((event) => ({ ...event, kind: "tracking", date: event.EventAt, title: event.Status, description: event.Description, location: event.Location }))].sort((a, b) => new Date(b.date) - new Date(a.date)).map((event, index) => <div className={styles.timelineItem} key={`${event.Id || event.TrackingEventId}-${index}`}><span className={`${styles.timelineDot} ${event.kind === "tracking" ? styles.timelineTracking : ""}`} /><div><div className={styles.timelineTop}><strong>{value(event.title)}</strong><time>{dateValue(event.date, true)}</time></div>{event.description && <p>{event.description}</p>}{event.location && <small>{event.location}</small>}</div></div>)}
                  </div> : <EmptyRows>هنوز فعالیتی ثبت نشده است.</EmptyRows>}
                </DetailSection>
              </div>

              <aside className={styles.detailAside}>
                <DetailSection title="خلاصه سفارش">
                  <div className={styles.summaryRows}>
                    <div><span>جمع جزء</span><strong>{money(order.SubtotalAmount, currency)}</strong></div>
                    <div><span>تخفیف</span><strong>−{money(order.DiscountAmount, currency)}</strong></div>
                    <div><span>ارسال</span><strong>{money(order.ShippingAmount, currency)}</strong></div>
                    <div><span>مالیات</span><strong>{money(order.TaxAmount, currency)}</strong></div>
                    <div className={styles.summaryTotal}><span>مبلغ کل</span><strong>{money(order.TotalAmount, currency)}</strong></div>
                    {Number(order.RefundedAmount || 0) > 0 && <div className={styles.summaryRefund}><span>بازپرداخت‌شده</span><strong>−{money(order.RefundedAmount, currency)}</strong></div>}
                  </div>
                </DetailSection>

                <DetailSection title="اطلاعات سفارش">
                  <div className={styles.detailValues}>
                    <DetailValue label="شناسه سفارش" wide><span className={styles.mono}>{value(order.Id)}</span></DetailValue>
                    <DetailValue label="منبع">{label(order.Source || order.SalesChannel)}</DetailValue>
                    <DetailValue label="شناسه قدیمی سفارش">{value(order.LegacyOrderId)}</DetailValue>
                    <DetailValue label="ایجادشده">{dateValue(order.CreatedAt, true)}</DetailValue>
                    <DetailValue label="پرداخت‌شده">{dateValue(order.PaidAt, true)}</DetailValue>
                    <DetailValue label="تکمیل‌شده">{dateValue(order.CompletedAt, true)}</DetailValue>
                    <DetailValue label="لغوشده">{dateValue(order.CancelledAt, true)}</DetailValue>
                    <DetailValue label="آخرین به‌روزرسانی">{dateValue(order.UpdatedAt, true)}</DetailValue>
                  </div>
                </DetailSection>

                <DetailSection title="مشتری">
                  <div className={styles.detailValues}>
                    {customerName && <DetailValue label="نام">{customerName}</DetailValue>}
                    <DetailValue label="ایمیل" wide>{value(order.CustomerEmail)}</DetailValue>
                    <DetailValue label="تلفن">{value(order.CustomerPhone)}</DetailValue>
                    <DetailValue label="شماره مشتری">{value(order.CustomerNumber)}</DetailValue>
                  </div>
                </DetailSection>

                <DetailSection title="نشانی‌ها">
                  <div className={styles.addressList}><AddressCard address={shippingAddress} title="ارسال" /><AddressCard address={billingAddress} title="صورتحساب" /></div>
                </DetailSection>

                {detail.invoices?.length > 0 && <DetailSection title="فاکتورها"><div className={styles.compactList}>{detail.invoices.map((invoice) => <div className={styles.compactRow} key={invoice.Id}><span><strong>{value(invoice.InvoiceNumber)}</strong><small>{label(invoice.Status)} · صادرشده در {dateValue(invoice.IssueDate)}</small></span><strong>{money(invoice.TotalAmount, invoice.Currency || currency)}</strong></div>)}</div></DetailSection>}
                {detail.refunds?.length > 0 && <DetailSection title="بازپرداخت‌ها"><div className={styles.compactList}>{detail.refunds.map((refund) => <div className={styles.compactRow} key={refund.Id}><span><strong>{value(refund.RefundNumber)}</strong><small>{label(refund.Status)} · {value(refund.Reason)}</small></span><strong>{money(refund.Amount, refund.Currency || currency)}</strong></div>)}</div></DetailSection>}
              </aside>
            </div>
          </>}
        </div>
      </section>
    </div>
  );
}

export default function OrdersAdminPage({ title = "سفارش‌ها" }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequestRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queueMicrotask(() => setFilters((current) => ({
      ...current,
      range: params.get("range") || current.range,
      from: params.get("from") || "",
      to: params.get("to") || "",
      currency: params.get("currency") || "",
      status: params.get("status") || params.get("orderStatus") || "",
      paymentStatus: params.get("paymentStatus") || "",
      fulfillmentStatus: params.get("fulfillmentStatus") || "",
    })));
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, filterValue]) => { if (filterValue) params.set(key, filterValue); });
    params.set("limit", "100");
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let active = true;
    queueMicrotask(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      setErrorCode("");
      try {
        const response = await fetch(`/api/admin/records/orders?${query}`, { credentials: "include", cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const requestError = new Error(body.error || "Unable to load orders");
          requestError.code = body.code || "";
          throw requestError;
        }
        if (active) setOrders(Array.isArray(body.rows) ? body.rows : []);
      } catch (requestError) {
        if (active) { setOrders([]); setError(requestError.message || "Unable to load orders"); setErrorCode(requestError.code || ""); }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [query, reloadKey]);

  const openDetails = useCallback(async (order) => {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelected(order);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.Id)}`, { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to load order details");
      if (detailRequestRef.current === requestId) setDetail(body);
    } catch (requestError) {
      if (detailRequestRef.current === requestId) setDetailError(requestError.message || "Unable to load order details");
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    detailRequestRef.current += 1;
    setSelected(null);
    setDetail(null);
    setDetailError("");
  }, []);

  const retryDetails = useCallback(() => {
    if (selected) openDetails(selected);
  }, [openDetails, selected]);

  const visibleOrders = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return orders;
    return orders.filter((order) => [order.OrderNumber, order.CustomerEmail, order.OrderStatus, order.PaymentStatus, order.FulfillmentStatus].some((field) => String(field || "").toLowerCase().includes(queryText)));
  }, [orders, search]);

  const stats = useMemo(() => {
    const currency = filters.currency || orders[0]?.Currency || "IRR";
    const revenue = orders.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0);
    const paid = orders.filter((order) => ["paid", "authorized"].includes(String(order.PaymentStatus || "").toLowerCase())).length;
    const attention = orders.filter((order) => ["pending", "failed", "cancelled", "canceled"].includes(String(order.OrderStatus || order.PaymentStatus || "").toLowerCase())).length;
    return { currency, revenue, paid, attention };
  }, [filters.currency, orders]);

  const updateFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setSearch(""); };

  if (loading && !orders.length && !error) return <TablePageSkeleton rows={8} columns={6} />;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/dashboard/Overview" className={styles.backLink}><ArrowBackRoundedIcon fontSize="inherit" /> گزارش کلی</Link>
          <p className={styles.eyebrow}>فروش / عملیات</p>
          <h1>{title}</h1>
          <p className={styles.subtitle}>همه سفارش‌های مشتریان را از یکجا جست‌وجو، بررسی و پیگیری کنید.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => setReloadKey((key) => key + 1)} disabled={loading}><RefreshRoundedIcon fontSize="small" /> {loading ? "در حال تازه‌سازی" : "تازه‌سازی"}</button>
      </header>

      <section className={styles.statsGrid} aria-label="خلاصه سفارش‌ها">
        <StatCard icon={ShoppingBagOutlinedIcon} label="سفارش‌های نمایش‌داده‌شده" value={number(orders.length)} detail="بر اساس فیلترهای فعلی" />
        <StatCard icon={ShoppingBagOutlinedIcon} label="سفارش‌های پرداخت‌شده" value={number(stats.paid)} detail={orders.length ? `${Math.round((stats.paid / orders.length) * 100)}٪ از سفارش‌ها` : "سفارشی نمایش داده نمی‌شود"} tone="green" />
        <StatCard icon={ShoppingBagOutlinedIcon} label="فروش نمایش‌داده‌شده" value={money(stats.revenue, stats.currency)} detail={`مبلغ سفارش‌ها به ${stats.currency}`} tone="violet" />
        <StatCard icon={FilterListRoundedIcon} label="نیازمند توجه" value={number(stats.attention)} detail="در انتظار، ناموفق یا لغوشده" tone="amber" />
      </section>

      <section className={styles.filtersCard} aria-label="فیلترهای سفارش">
        <div className={styles.searchField}><SearchRoundedIcon fontSize="small" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی شماره سفارش یا ایمیل مشتری" aria-label="جست‌وجوی سفارش‌ها" /></div>
        <label>بازه زمانی<select value={filters.range} onChange={updateFilter("range")}>{RANGE_OPTIONS.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select></label>
        {filters.range === "custom" && <label>از<input type="date" value={filters.from} onChange={updateFilter("from")} /></label>}
        {filters.range === "custom" && <label>تا<input type="date" value={filters.to} onChange={updateFilter("to")} /></label>}
        <label>وضعیت<select value={filters.status} onChange={updateFilter("status")}><option value="">همه وضعیت‌ها</option><option>Pending</option><option>Processing</option><option>Completed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></label>
        <label>پرداخت<select value={filters.paymentStatus} onChange={updateFilter("paymentStatus")}><option value="">همه پرداخت‌ها</option><option>Pending</option><option>Authorized</option><option>Paid</option><option>Failed</option><option>Refunded</option></select></label>
        <label>ارسال<select value={filters.fulfillmentStatus} onChange={updateFilter("fulfillmentStatus")}><option value="">همه وضعیت‌های ارسال</option><option>Unfulfilled</option><option>Processing</option><option>Shipped</option><option>Delivered</option></select></label>
        <label>واحد پول<select value={filters.currency} onChange={updateFilter("currency")}><option value="">همه واحدها</option><option value="IRR">ریال</option></select></label>
        <button type="button" className={styles.clearButton} onClick={clearFilters}>پاک کردن فیلترها</button>
      </section>

      {error && <div className={styles.errorMessage}><strong>{errorCode === "CANONICAL_SCHEMA_NOT_READY" ? "ارتقای پایگاه داده لازم است." : "سفارش‌ها در دسترس نیستند."}</strong><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)}>تلاش دوباره</button></div>}

      {!error && <section className={styles.tableCard}>
        <div className={styles.tableHeader}><div><h2>همه سفارش‌ها</h2><p>{search ? `نمایش ${visibleOrders.length} مورد از ${orders.length} سفارش بارگذاری‌شده` : `نمایش ${orders.length} سفارش از بازه انتخاب‌شده`}</p></div><span className={styles.tableHint}>برای مشاهده جزئیات کامل، یک سفارش را انتخاب کنید <ExpandMoreRoundedIcon fontSize="small" /></span></div>
        {visibleOrders.length ? <div className={styles.tableScroll}><table className={styles.ordersTable}><thead><tr><th>سفارش</th><th>مشتری</th><th>ثبت‌شده</th><th>وضعیت</th><th>پرداخت</th><th>ارسال</th><th className={styles.alignRight}>مبلغ کل</th><th aria-label="عملیات" /></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order.Id || order.OrderNumber} onClick={() => openDetails(order)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(order); } }} tabIndex={0}>
          <td><button type="button" className={styles.orderNumber} onClick={(event) => { event.stopPropagation(); openDetails(order); }}>{value(order.OrderNumber)}<small>{String(order.Id || "").slice(0, 8)}</small></button></td>
          <td><span className={styles.customerCell}>{value(order.CustomerEmail)}</span></td>
          <td className={styles.dateCell}>{dateValue(order.CreatedAt || order.PlacedAt)}</td>
          <td><StatusPill status={order.OrderStatus} /></td>
          <td><StatusPill status={order.PaymentStatus} /></td>
          <td><StatusPill status={order.FulfillmentStatus} /></td>
          <td className={`${styles.alignRight} ${styles.totalCell}`}>{money(order.TotalAmount, order.Currency)}</td>
          <td><button type="button" className={styles.viewButton} onClick={(event) => { event.stopPropagation(); openDetails(order); }}>مشاهده <LaunchRoundedIcon fontSize="inherit" /></button></td>
        </tr>)}</tbody></table></div> : <div className={styles.emptyState}><div className={styles.emptyIcon}><ShoppingBagOutlinedIcon /></div><h3>{search ? "سفارش مطابقی پیدا نشد" : "سفارشی در این بازه وجود ندارد"}</h3><p>{search ? "شماره سفارش، وضعیت یا ایمیل مشتری دیگری را امتحان کنید." : "بازه زمانی را بیشتر کنید یا فیلترها را پاک کنید."}</p></div>}
        <div className={styles.tableFooter}><span>در هر بار حداکثر ۱۰۰ سفارش بارگذاری می‌شود.</span><span>برای مشاهده جزئیات کامل روی هر ردیف کلیک کنید.</span></div>
      </section>}

      <DetailModal selected={selected} detail={detail} loading={detailLoading} error={detailError} onClose={closeDetails} onRetry={retryDetails} />
    </main>
  );
}
