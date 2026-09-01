"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./adminRecords.module.css";
import { TablePageSkeleton } from "../../components/LoadingSkeletons";

function display(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString("fa-IR");
  if (typeof value === "number") return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 4 }).format(value);
  return String(value);
}

const columnLabels = {
  "Order number": "شماره سفارش", Customer: "مشتری", "Order status": "وضعیت سفارش", Payment: "پرداخت", Fulfillment: "تکمیل ارسال", Total: "مبلغ کل", Refunded: "بازپرداخت‌شده", Currency: "واحد پول", Created: "ایجادشده",
  Reference: "مرجع", Direction: "جهت", Method: "روش", Status: "وضعیت", Amount: "مبلغ", Processed: "پردازش‌شده",
  Supplier: "تأمین‌کننده", "External order": "سفارش خارجی", "Product cost": "هزینه محصول", "Shipping cost": "هزینه ارسال", "Total cost": "هزینه کل",
  Campaign: "کارزار", Channel: "کانال", Start: "شروع", End: "پایان", Budget: "بودجه", Updated: "به‌روزرسانی‌شده",
  Tier: "سطح", Type: "نوع", Points: "امتیاز", Description: "توضیحات",
};

function columnLabel(value) {
  const raw = String(value || "").trim();
  return columnLabels[raw] || raw;
}

export default function AdminRecordsPage({ area, title }) {
  const [state, setState] = useState({ loading: true, error: "", errorCode: "", missingObjects: [], data: null });
  useEffect(() => {
    const query = typeof window === "undefined" ? "" : window.location.search;
    fetch(`/api/admin/records/${area}${query}`, { credentials: "include", cache: "no-store" })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error("بارگذاری سوابق ممکن نیست.");
          error.code = body.code || "";
          error.missingObjects = body.missingObjects || [];
          throw error;
        }
        return body;
      })
      .then(data => setState({ loading: false, error: "", errorCode: "", missingObjects: [], data }))
      .catch(error => setState({ loading: false, error: /[\u0600-\u06ff]/.test(String(error.message || "")) ? error.message : "بارگذاری سوابق ممکن نیست.", errorCode: error.code || "", missingObjects: error.missingObjects || [], data: null }));
  }, [area]);

  if (state.loading) return <TablePageSkeleton />;

  const rows = state.data?.rows || [];
  const keys = rows.length ? Object.keys(rows[0]).filter(key => key !== "Id") : [];
  return <main className={styles.page}>
    <div className={styles.header}><div><Link href="/dashboard/Overview">بازگشت به گزارش کلی ←</Link><h1>{state.data?.title || title}</h1><p>سوابق پایگاه داده بر اساس فیلترهای انتخاب‌شده در گزارش کلی.</p></div></div>
    {state.error && <div className={`${styles.message} ${styles.error}`}>
      <strong>{state.errorCode === "CANONICAL_SCHEMA_NOT_READY" ? "ارتقای پایگاه داده لازم است" : "بارگذاری سوابق ممکن نیست"}</strong>
      <span>{state.error}</span>
      {state.missingObjects.length > 0 && <small>اجزای مفقود: {state.missingObjects.join(", ")}</small>}
    </div>}
    {!state.loading && !state.error && <div className={styles.tableWrap}>{rows.length ? <table><thead><tr>{keys.map((key, index) => <th key={key}>{columnLabel(state.data.columns?.[index] || key)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.Id || index}>{keys.map(key => <td key={key}>{display(row[key])}</td>)}</tr>)}</tbody></table> : <div className={styles.message}>رکوردی با این فیلترها پیدا نشد.</div>}</div>}
    {rows.length > 0 && <p className={styles.caption}>حداکثر {state.data.limit} رکورد نمایش داده می‌شود. شناسه‌های داخلی و اطلاعات حساس مشتری یا پرداخت عمداً پنهان شده‌اند.</p>}
  </main>;
}
