"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { addToCart, fetchSavedProducts, fetchSession, removeSavedProduct } from "../../lib/apiClient";
import { hideSupplierBranding } from "../../lib/customerFacingText";
import { formatMoney } from "../../lib/locale";
import { AccountPageSkeleton } from "../../components/LoadingSkeletons";
import styles from "../account.module.css";

const FALLBACK_IMAGE = "https://placehold.co/480x480?text=محصول";

function productImage(item) {
  return item?.images?.[0] || item?.img || item?.image || FALLBACK_IMAGE;
}

function productName(item) {
  return hideSupplierBranding(item?.name || item?.title, "محصول فروشگاه ایرانی");
}

export default function SavedProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const session = await fetchSession();
        if (!session) {
          if (active) setAuthed(false);
          return;
        }
        if (active) setAuthed(true);
        const saved = await fetchSavedProducts();
        if (!active) return;
        setItems(Array.isArray(saved.items) ? saved.items : []);
      } catch (loadError) {
        if (active) setError(loadError.message || "بارگذاری محصولات ذخیره‌شده انجام نشد");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleRemove(item) {
    const id = item.id;
    setPendingId(id);
    setError("");
    try {
      const result = await removeSavedProduct(id);
      if (Array.isArray(result.items)) {
        setItems(result.items);
      } else {
        setItems((current) => current.filter((entry) => String(entry.id) !== String(id)));
      }
      setNotice(`${productName(item)} از محصولات ذخیره‌شده حذف شد.`);
    } catch (removeError) {
      setError(removeError.message || "حذف محصول انجام نشد");
    } finally {
      setPendingId(null);
    }
  }

  async function handleMoveToCart(item) {
    const id = item.id;
    setPendingId(id);
    setError("");
    try {
      await addToCart({
        productId: id,
        title: productName(item),
        price: Number(item.price) || 0,
        image: productImage(item),
        quantity: 1,
      });
      await removeSavedProduct(id);
      setItems((current) => current.filter((entry) => String(entry.id) !== String(id)));
      setNotice(`${productName(item)} به سبد خرید منتقل شد.`);
    } catch (moveError) {
      setError(moveError.message || "انتقال محصول به سبد خرید انجام نشد");
    } finally {
      setPendingId(null);
    }
  }

  if (loading) return <AccountPageSkeleton variant="saved" />;

  if (!authed) {
    return (
      <div>
        <div className={styles.hero}>
          <div>
            <div className={styles.heroTitle}>محصولات ذخیره‌شده</div>
            <div className={styles.heroSub}>برای نگه‌داشتن محصولات برای بعد وارد شوید.</div>
          </div>
          <Link className={styles.primaryBtn} href="/signin">ورود</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroTitle}>محصولات ذخیره‌شده</div>
          <div className={styles.heroSub}>محصولاتی که می‌خواهید بعداً دوباره ببینید.</div>
        </div>
        <div className={styles.linkRow}>
          <span className={styles.savedCount}>{items.length} محصول</span>
          <Link className={styles.ghostBtn} href="/shop">ادامه خرید</Link>
        </div>
      </div>

      {(error || notice) && (
        <div className={error ? styles.savedError : styles.savedNotice} role="status">
          {error || notice}
        </div>
      )}

      <section className={styles.panel}>
        {items.length === 0 ? (
          <div className={styles.savedEmpty}>
            <div className={styles.savedEmptyIcon}>♡</div>
            <div className={styles.panelTitle}>هنوز محصولی ذخیره نشده است</div>
            <p>برای نگه‌داشتن محصول، نشان قلب را بزنید تا در بازدید بعدی اینجا باشد.</p>
            <Link className={styles.primaryBtn} href="/shop">مشاهده محصولات</Link>
          </div>
        ) : (
          <div className={styles.savedGrid}>
            {items.map((item) => {
              const id = item.id;
              const busy = pendingId === id;
              const outOfStock = Number(item.stock) === 0;
              return (
                <article className={styles.savedCard} key={id}>
                  <Link href={`/product/${id}`} className={styles.savedImageLink}>
                    <Image className={styles.savedImage} src={productImage(item)} alt={item.alt || productName(item)} width={480} height={480} sizes="(max-width: 600px) 100vw, 240px" unoptimized />
                  </Link>
                  <div className={styles.savedCardBody}>
                    <div className={styles.savedMeta}>{hideSupplierBranding(item.brand, "فروشگاه ایرانی")} · {item.category || "مجموعه"}</div>
                    <Link href={`/product/${id}`} className={styles.savedTitle}>{productName(item)}</Link>
                    <div className={styles.savedPrice}>{formatMoney(item.price)}</div>
                    <div className={styles.savedActions}>
                      <button className={styles.primaryBtn} type="button" onClick={() => handleMoveToCart(item)} disabled={busy || outOfStock}>
                        {busy ? "در حال به‌روزرسانی..." : outOfStock ? "ناموجود" : "انتقال به سبد"}
                      </button>
                      <button className={styles.ghostBtn} type="button" onClick={() => handleRemove(item)} disabled={busy}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
