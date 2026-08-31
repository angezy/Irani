"use client";

import { useEffect, useState } from "react";
import { AccountPageSkeleton } from "../../components/LoadingSkeletons";
import { fetchAccountDetails, updateAccountPassword, updateAccountPreferences } from "../../lib/apiClient";
import styles from "../account.module.css";

export default function SettingsPage() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetchAccountDetails()
      .then((accountDetails) => {
        if (!active) return;
        setDetails(accountDetails || null);
        setEmailMarketing(Boolean(accountDetails?.preferences?.emailMarketing));
      })
      .catch((loadError) => active && setError(loadError.message || "بارگذاری تنظیمات انجام نشد"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function updatePasswordField(event) {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("رمزهای عبور جدید یکسان نیستند.");
      return;
    }
    try {
      setSavingPassword(true);
      await updateAccountPassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("رمز عبور با موفقیت تغییر کرد.");
    } catch (saveError) {
      setError(saveError.message || "تغییر رمز عبور انجام نشد");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePreferenceChange(event) {
    const nextValue = event.target.checked;
    setEmailMarketing(nextValue);
    setError("");
    setSuccess("");
    try {
      setSavingPreference(true);
      const preferences = await updateAccountPreferences({ emailMarketing: nextValue });
      setDetails((current) => ({ ...current, preferences }));
      setSuccess("تنظیمات ایمیل به‌روزرسانی شد.");
    } catch (saveError) {
      setEmailMarketing(!nextValue);
      setError(saveError.message || "به‌روزرسانی تنظیمات ایمیل انجام نشد");
    } finally {
      setSavingPreference(false);
    }
  }

  if (loading) return <AccountPageSkeleton variant="settings" />;
  if (!details?.profile) return <div className={styles.heroTitle}>برای مدیریت تنظیمات وارد شوید.</div>;

  return (
    <div className={styles.subPage}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>کنترل حساب</p>
          <div className={styles.heroTitle}>تنظیمات و امنیت</div>
          <div className={styles.heroSub}>رمز عبور و تنظیمات ارتباطی خود را مدیریت کنید.</div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>تغییر رمز عبور</div>
            <div className={styles.panelSubtitle}>از رمز عبوری قوی با حداقل ۸ نویسه استفاده کنید.</div>
          </div>
        </div>
        <form className={styles.accountForm} onSubmit={handlePasswordSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>رمز عبور فعلی</span>
              <input className={styles.formInput} name="currentPassword" type="password" value={passwords.currentPassword} onChange={updatePasswordField} autoComplete="current-password" required />
            </label>
            <label className={styles.formField}>
              <span>رمز عبور جدید</span>
              <input className={styles.formInput} name="newPassword" type="password" value={passwords.newPassword} onChange={updatePasswordField} autoComplete="new-password" minLength={8} required />
            </label>
            <label className={styles.formField}>
              <span>تکرار رمز عبور جدید</span>
              <input className={styles.formInput} name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={updatePasswordField} autoComplete="new-password" minLength={8} required />
            </label>
          </div>
          <div className={styles.formFooter}>
            <span className={error ? styles.formError : styles.formSuccess} role="status">{error || success}</span>
            <button className={styles.primaryBtn} type="submit" disabled={savingPassword}>{savingPassword ? "در حال به‌روزرسانی..." : "تغییر رمز عبور"}</button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>تنظیمات ایمیل</div>
            <div className={styles.panelSubtitle}>انتخاب کنید که اخبار محصولات و پیشنهادها را دریافت کنید یا نه.</div>
          </div>
        </div>
        <label className={styles.preferenceRow}>
          <span>
            <strong>ایمیل‌های تبلیغاتی</strong>
            <small>اخبار، به‌روزرسانی محصولات و پیشنهادهای گاه‌به‌گاه را دریافت کنید.</small>
          </span>
          <input type="checkbox" checked={emailMarketing} onChange={handlePreferenceChange} disabled={savingPreference} />
        </label>
      </section>
    </div>
  );
}
