"use client";

import { useEffect, useState } from "react";
import { fetchOrders, fetchSession } from "../../lib/apiClient";
import { AccountPageSkeleton } from "../../components/LoadingSkeletons";
import { formatMoney } from "../../lib/locale";
import { translateStatus } from "../../lib/statusLabels";
import styles from "../account.module.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const session = await fetchSession();
      if (!session) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);
      const ord = await fetchOrders();
      setOrders(ord.orders || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <AccountPageSkeleton variant="orders" />;
  if (!authed) return <div className={styles.heroTitle}>برای دیدن سفارش‌ها وارد شوید.</div>;

  return (
    <div>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroTitle}>سفارش‌ها</div>
          <div className={styles.heroSub}>خریدهای اخیر و وضعیت آن‌ها.</div>
        </div>
      </div>

      <section className={styles.panel} id="orders">
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>سفارش‌های اخیر</div>
          <span style={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}>{orders.length} سفارش</span>
        </div>
        {orders.length === 0 ? (
          <div style={{ color: "#475569" }}>هنوز سفارشی ثبت نشده است. خریدهای شما اینجا نمایش داده می‌شوند.</div>
        ) : (
          <div className={styles.orders}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <strong>#{order.id}</strong>
                  <span className={styles.pill} style={{ background: order.status === "Delivered" ? "#dcfce7" : "#fef9c3" }}>
                    {translateStatus(order.status, "در حال پردازش")}
                  </span>
                </div>
                <div style={{ color: "#475569", marginBottom: 6 }}>
                  ثبت‌شده در: {order.placedAt ? new Date(order.placedAt).toLocaleString("fa-IR") : "-"}
                </div>
                <div style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  مبلغ کل: {formatMoney(order.total, order.currency)}
                </div>
                <div style={{ color: "#475569", fontSize: 13 }}>
                  {order.items?.map((item, idx) => (
                    <div key={`${order.id}-${idx}`}>
                      {item.quantity} × {item.title} – {formatMoney(item.price, item.currency || order.currency)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
