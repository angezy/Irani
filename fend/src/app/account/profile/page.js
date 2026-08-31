"use client";

import { useEffect, useState } from "react";
import { AccountPageSkeleton } from "../../components/LoadingSkeletons";
import { fetchAccountDetails, updateAccountProfile } from "../../lib/apiClient";
import styles from "../account.module.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetchAccountDetails()
      .then((details) => {
        if (!active) return;
        const current = details?.profile;
        setProfile(current || null);
        setForm({ name: current?.name || current?.username || "", email: current?.email || "", phone: current?.phone || "" });
      })
      .catch((loadError) => active && setError(loadError.message || "بارگذاری پروفایل انجام نشد"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const updated = await updateAccountProfile(form);
      setProfile(updated);
      setForm({ name: updated?.name || updated?.username || form.name, email: updated?.email || form.email, phone: updated?.phone || "" });
      setSuccess("پروفایل با موفقیت به‌روزرسانی شد.");
    } catch (saveError) {
      setError(saveError.message || "به‌روزرسانی پروفایل انجام نشد");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AccountPageSkeleton variant="profile" />;
  if (!profile) return <div className={styles.heroTitle}>برای مشاهده پروفایل وارد شوید.</div>;

  return (
    <div className={styles.subPage}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>اطلاعات شما</p>
          <div className={styles.heroTitle}>جزئیات پروفایل</div>
          <div className={styles.heroSub}>اطلاعات تماس خود را به‌روز نگه دارید.</div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>اطلاعات تماس</div>
            <div className={styles.panelSubtitle}>این اطلاعات برای حساب و به‌روزرسانی سفارش‌ها استفاده می‌شود.</div>
          </div>
        </div>
        <form className={styles.accountForm} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>نام و نام خانوادگی</span>
              <input className={styles.formInput} name="name" value={form.name} onChange={updateField} autoComplete="name" required />
            </label>
            <label className={styles.formField}>
              <span>آدرس ایمیل</span>
              <input className={styles.formInput} name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
            </label>
            <label className={styles.formField}>
              <span>شماره تلفن <em>اختیاری</em></span>
              <input className={styles.formInput} name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="tel" placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷" />
            </label>
          </div>
          <div className={styles.formFooter}>
            <span className={error ? styles.formError : styles.formSuccess} role="status">{error || success}</span>
            <button className={styles.primaryBtn} type="submit" disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</button>
          </div>
        </form>
      </section>

      <section className={styles.infoCard}>
        <div className={styles.sectionHeaderCompact}>
          <div>
            <p className={styles.eyebrow}>وضعیت حساب</p>
            <h2>جزئیات عضویت</h2>
          </div>
        </div>
        <dl className={styles.detailList}>
          <div><dt>نوع حساب</dt><dd>{profile.role || "مشتری"}</dd></div>
          <div><dt>عضویت از</dt><dd>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fa-IR") : "—"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
