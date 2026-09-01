"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchOrders, fetchProfile, fetchSavedProducts, fetchSession, logoutRequest } from "../lib/apiClient";
import { AccountPageSkeleton } from "../components/LoadingSkeletons";
import { formatMoney } from "../lib/locale";
import { translateStatus } from "../lib/statusLabels";
import styles from "./account.module.css";

function displayName(profile, user) {
  return profile?.name || profile?.username || user?.name || user?.username || "دوست عزیز";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fa-IR", { month: "short", day: "numeric", year: "numeric" });
}

function statusClass(status) {
  const normalized = String(status || "processing").toLowerCase();
  if (normalized.includes("deliver")) return styles.statusDelivered;
  if (normalized.includes("cancel")) return styles.statusCancelled;
  if (normalized.includes("ship")) return styles.statusShipped;
  return styles.statusProcessing;
}

function productCount(order) {
  return Array.isArray(order?.items)
    ? order.items.reduce((total, item) => total + (Number(item.quantity) || 1), 0)
    : 0;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const session = await fetchSession();
        if (!session) return;

        if (active) {
          setUser(session.user);
          setProfile(session.user);
        }

        const [prof, ord, saved] = await Promise.all([
          fetchProfile(),
          fetchOrders(),
          fetchSavedProducts().catch(() => ({ items: [] })),
        ]);

        if (!active) return;
        setUser(session.user);
        setProfile(prof || session.user);
        setOrders(Array.isArray(ord?.orders) ? ord.orders : []);
        setSavedProducts(Array.isArray(saved?.items) ? saved.items : []);
      } catch (_loadError) {
        if (active) setError("حساب شما بارگذاری نشد. لطفاً صفحه را تازه کنید و دوباره تلاش کنید.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await logoutRequest();
    window.dispatchEvent(new CustomEvent("weluxo:session-updated", { detail: null }));
    router.push("/signin");
  }

  if (loading) {
    return <AccountPageSkeleton />;
  }

  if (!user) {
    return (
      <section className={styles.stateCard}>
        <div className={styles.stateIcon} aria-hidden="true">↗</div>
        <div>
          <p className={styles.eyebrow}>حساب مشتری</p>
          <h2>برای مشاهده حساب وارد شوید</h2>
          <p>سفارش‌ها، محصولات ذخیره‌شده و اطلاعات حساب را یک‌جا ببینید.</p>
        </div>
        <Link className={styles.primaryBtn} href="/signin">ورود</Link>
      </section>
    );
  }

  const name = displayName(profile, user);
  const firstName = name.split(" ")[0];
  const recentOrders = orders.slice(0, 4);

  return (
    <div className={styles.overviewPage}>
      {error && <div className={styles.savedError} role="alert">{error}</div>}

      <section className={styles.welcomePanel}>
        <div>
          <p className={styles.eyebrow}>نمای کلی حساب</p>
          <h2>خوش آمدید، {firstName}</h2>
          <p>سفارش‌ها، محصولات ذخیره‌شده و اطلاعات شخصی خود را مدیریت کنید.</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link className={styles.primaryBtn} href="/shop">ادامه خرید</Link>
          <button className={styles.ghostBtn} type="button" onClick={handleLogout}>خروج</button>
        </div>
      </section>

      <section className={styles.quickLinks} aria-label="میانبرهای حساب">
        <Link className={styles.quickLink} href="/account/orders">
          <span className={styles.quickIcon} aria-hidden="true">01</span>
          <span><strong>سفارش‌ها</strong><small>{orders.length ? `${orders.length} مورد` : "هنوز سفارشی ندارید"}</small></span>
          <span className={styles.quickArrow} aria-hidden="true">←</span>
        </Link>
        <Link className={styles.quickLink} href="/account/saved">
          <span className={styles.quickIcon} aria-hidden="true">02</span>
          <span><strong>محصولات ذخیره‌شده</strong><small>{savedProducts.length ? `${savedProducts.length} مورد` : "ذخیره برای بعد"}</small></span>
          <span className={styles.quickArrow} aria-hidden="true">←</span>
        </Link>
        <Link className={styles.quickLink} href="/account/profile">
          <span className={styles.quickIcon} aria-hidden="true">03</span>
          <span><strong>جزئیات پروفایل</strong><small>مشاهده اطلاعات شما</small></span>
          <span className={styles.quickArrow} aria-hidden="true">←</span>
        </Link>
      </section>

      <section className={styles.panel} aria-labelledby="recent-orders-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>تاریخچه سفارش</p>
            <h2 id="recent-orders-title">سفارش‌های اخیر</h2>
          </div>
        <Link className={styles.textLink} href="/account/orders">مشاهده همه سفارش‌ها <span aria-hidden="true">←</span></Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div>
              <h3>تاریخچه سفارش شما خالی است</h3>
              <p>پس از ثبت سفارش، جزئیات و وضعیت ارسال آن را اینجا می‌بینید.</p>
            </div>
            <Link className={styles.secondaryBtn} href="/shop">مشاهده محصولات</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            <div className={`${styles.orderRow} ${styles.orderRowHeader}`} aria-hidden="true">
              <span>سفارش</span><span>تاریخ</span><span>وضعیت</span><span>مبلغ</span><span />
            </div>
            {recentOrders.map((order) => (
              <div className={styles.orderRow} key={order.id}>
                <div className={styles.orderCell}>
                  <span className={styles.mobileCellLabel}>سفارش</span>
                  <strong>#{order.id}</strong>
                  <small>{productCount(order)} قلم</small>
                </div>
                <div className={styles.orderCell}>
                  <span className={styles.mobileCellLabel}>تاریخ</span>
                  <span>{formatDate(order.placedAt)}</span>
                </div>
                <div className={styles.orderCell}>
                  <span className={styles.mobileCellLabel}>وضعیت</span>
                  <span className={`${styles.statusPill} ${statusClass(order.status)}`}>{translateStatus(order.status, "در حال پردازش")}</span>
                </div>
                <div className={styles.orderCell}>
                  <span className={styles.mobileCellLabel}>مبلغ</span>
                  <strong>{formatMoney(order.total)}</strong>
                </div>
                <div className={styles.orderAction}>
                  <Link className={styles.textLink} href={`/invoice/${encodeURIComponent(order.id)}`}>مشاهده سفارش <span aria-hidden="true">←</span></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoCard}>
          <div className={styles.sectionHeaderCompact}>
            <div>
              <p className={styles.eyebrow}>جزئیات حساب</p>
              <h2>اطلاعات تماس</h2>
            </div>
            <Link className={styles.textLink} href="/account/settings">ویرایش</Link>
          </div>
          <dl className={styles.detailList}>
            <div><dt>نام</dt><dd>{profile?.name || profile?.username || "عضو"}</dd></div>
            <div><dt>ایمیل</dt><dd>{profile?.email || user?.email || "—"}</dd></div>
            <div><dt>عضویت از</dt><dd>{formatDate(profile?.createdAt)}</dd></div>
          </dl>
        </article>
        <article className={`${styles.infoCard} ${styles.helpCard}`}>
          <p className={styles.eyebrow}>به کمک نیاز دارید؟</p>
          <h2>ما برای کمک اینجا هستیم.</h2>
          <p>پاسخ پرسش‌ها را پیدا کنید، با پشتیبانی تماس بگیرید یا وضعیت سفارش را ببینید.</p>
          <div className={styles.helpLinks}>
            <Link className={styles.textLink} href="/account/support">ارتباط با پشتیبانی <span aria-hidden="true">←</span></Link>
            <Link className={styles.textLink} href="/account/tracking">رهگیری سفارش <span aria-hidden="true">←</span></Link>
          </div>
        </article>
      </section>
    </div>
  );
}
