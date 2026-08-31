"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import journeyFallback from "../../../../data/customer-email-journey.json";
import styles from "./marketing.module.css";

const TinyMceEditor = dynamic(() => import("@tinymce/tinymce-react").then((module) => module.Editor), { ssr: false });

const triggerOptions = [
  { value: "account_created_or_opt_in", label: "ایجاد حساب یا موافقت با ایمیل", keys: ["account_created", "email_opt_in"] },
  { value: "account_created", label: "ایجاد حساب", keys: ["account_created"] },
  { value: "email_opt_in", label: "موافقت با ایمیل بازاریابی", keys: ["email_opt_in"] },
  { value: "signed_up_no_purchase", label: "ثبت‌نام بدون خرید", keys: ["signed_up_no_purchase"] },
  { value: "cart_inactive", label: "بی‌فعالیتی سبد خرید", keys: ["cart_inactive"] },
  { value: "payment_confirmed", label: "تأیید پرداخت", keys: ["payment_confirmed"] },
  { value: "order_packed", label: "بسته‌بندی سفارش یا ایجاد پیگیری", keys: ["order_packed"] },
  { value: "out_for_delivery", label: "خروج برای تحویل", keys: ["out_for_delivery"] },
  { value: "order_delivered", label: "تحویل سفارش", keys: ["order_delivered"] },
];

const scheduleOptions = [
  { value: "immediate", label: "بلافاصله" },
  { value: "delay", label: "پس از تأخیر" },
  { value: "event", label: "هنگام رخداد رویداد" },
];

const triggerOptionFor = (step) => {
  const keys = Array.isArray(step?.triggerKeys) ? step.triggerKeys : [];
  return triggerOptions.find((option) => option.keys.length === keys.length && option.keys.every((key) => keys.includes(key)))
    || triggerOptions.find((option) => option.value === step?.triggerKey)
    || triggerOptions[0];
};

const scheduleTypeFor = (step) => scheduleOptions.some((option) => option.value === step?.scheduleType)
  ? step.scheduleType
  : /immediate|right away|now/i.test(step?.timing || "")
    ? "immediate"
    : /status changes|carrier milestone|when .* occurs/i.test(step?.timing || "") ? "event" : "delay";

const delayMinutesFor = (step) => {
  const explicit = Number(step?.delayMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(43_200, Math.round(explicit));
  const timing = String(step?.timing || "").toLowerCase();
  const amount = Number(timing.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
  if (/day/.test(timing)) return Math.round((amount || 1) * 1_440);
  if (/hour/.test(timing)) return Math.round((amount || 1) * 60);
  return Math.round(amount || 60);
};

const delayUnitFor = (minutes) => minutes % 1_440 === 0 ? "days" : minutes % 60 === 0 ? "hours" : "minutes";
const delayValueFor = (minutes) => minutes % 1_440 === 0 ? minutes / 1_440 : minutes % 60 === 0 ? minutes / 60 : minutes;
const delayToMinutes = (value, unit) => Math.min(43_200, Math.max(1, Math.round(Number(value) * (unit === "days" ? 1_440 : unit === "hours" ? 60 : 1)) || 1));
const timingFor = (scheduleType, minutes) => scheduleType === "immediate" ? "بلافاصله" : scheduleType === "event" ? "هنگام رخداد رویداد" : `${delayValueFor(minutes)} ${delayUnitFor(minutes) === "days" ? "روز" : delayUnitFor(minutes) === "hours" ? "ساعت" : "دقیقه"} پس از رویداد`;

const emptyStep = {
  key: "new-touchpoint",
  stage: "نقطه تماس جدید",
  triggerKey: "account_created",
  triggerKeys: ["account_created"],
  trigger: "فعالیت مشتری با این مرحله مطابقت دارد",
  scheduleType: "immediate",
  delayMinutes: 0,
  timing: "هنگام آماده‌سازی",
  type: "Marketing",
  subject: "یک به‌روزرسانی کاربردی از فروشگاه ایرانی",
  body: "سلام،\n\nمتن ایمیل این نقطه تماس را وارد کنید.",
  purpose: "مشتری را با یک گام بعدی روشن در جریان نگه دارید.",
  cta: "اطلاعات بیشتر",
  href: "/shop",
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export default function MarketingPage() {
  const [content, setContent] = useState(() => clone(journeyFallback));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bodyEditor, setBodyEditor] = useState(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/dashboard/marketing", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("load");
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;
        setContent(data);
        setDirty(false);
      })
      .catch(() => mounted && setError("بارگذاری آخرین محتوای بازاریابی ممکن نبود؛ پیش‌نویس ذخیره‌شده همچنان در دسترس است."))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const steps = useMemo(() => Array.isArray(content.steps) ? content.steps : [], [content.steps]);
  const guardrails = useMemo(() => Array.isArray(content.guardrails) ? content.guardrails : [], [content.guardrails]);
  const metrics = useMemo(() => ({
    total: steps.length,
    marketing: steps.filter((step) => step.type !== "Transactional").length,
    transactional: steps.filter((step) => step.type === "Transactional").length,
    guardrails: guardrails.length,
  }), [guardrails, steps]);

  const markChanged = () => {
    setDirty(true);
    setMessage("");
    setError("");
  };

  const updateField = (field, value) => {
    setContent((current) => ({ ...current, [field]: value }));
    markChanged();
  };

  const updateStep = (index, field, value) => {
    setContent((current) => ({
      ...current,
      steps: (current.steps || []).map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      ),
    }));
    markChanged();
  };

  const updateStepAutomation = (index, field, value) => {
    setContent((current) => ({
      ...current,
      steps: (current.steps || []).map((step, stepIndex) => {
        if (stepIndex !== index) return step;
        const next = { ...step };
        if (field === "trigger") {
          const option = triggerOptions.find((item) => item.value === value) || triggerOptions[0];
          next.triggerKey = option.keys[0];
          next.triggerKeys = option.keys;
          next.trigger = option.label;
        }
        if (field === "scheduleType") {
          next.scheduleType = value;
          next.delayMinutes = value === "delay" ? delayMinutesFor(step) : 0;
          next.timing = timingFor(value, next.delayMinutes || 60);
        }
        if (field === "delayMinutes") {
          next.scheduleType = "delay";
          next.delayMinutes = delayToMinutes(value, delayUnitFor(delayMinutesFor(step)));
          next.timing = timingFor("delay", next.delayMinutes);
        }
        if (field === "delayUnit") {
          next.scheduleType = "delay";
          next.delayMinutes = delayToMinutes(delayValueFor(delayMinutesFor(step)), value);
          next.timing = timingFor("delay", next.delayMinutes);
        }
        return next;
      }),
    }));
    markChanged();
  };

  const addStep = () => {
    setContent((current) => ({
      ...current,
      steps: [...(current.steps || []), { ...emptyStep }],
    }));
    markChanged();
  };

  const removeStep = (index) => {
    setContent((current) => ({
      ...current,
      steps: (current.steps || []).filter((_, stepIndex) => stepIndex !== index),
    }));
    markChanged();
  };

  const updateGuardrail = (index, value) => {
    setContent((current) => ({
      ...current,
      guardrails: (current.guardrails || []).map((item, itemIndex) => itemIndex === index ? value : item),
    }));
    markChanged();
  };

  const addGuardrail = () => {
    setContent((current) => ({
      ...current,
      guardrails: [...(current.guardrails || []), "Add a clear rule for this journey."],
    }));
    markChanged();
  };

  const removeGuardrail = (index) => {
    setContent((current) => ({
      ...current,
      guardrails: (current.guardrails || []).filter((_, itemIndex) => itemIndex !== index),
    }));
    markChanged();
  };

  const openBodyEditor = (index) => {
    setBodyEditor({ index, draft: steps[index]?.body || "" });
    setMessage("");
    setError("");
  };

  const closeBodyEditor = () => setBodyEditor(null);

  const saveBodyEditor = () => {
    if (!bodyEditor) return;
    updateStep(bodyEditor.index, "body", bodyEditor.draft);
    closeBodyEditor();
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/dashboard/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "save");
      setContent(data.content || content);
      setDirty(false);
      setMessage("تغییرات ذخیره شد");
    } catch (saveError) {
      setError(saveError.message === "Admin access required" ? "نشست مدیریت شما منقضی شده است؛ دوباره وارد شوید." : "ذخیره‌سازی ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard/Overview" className={styles.backLink}>
              <ArrowBackRoundedIcon fontSize="inherit" />
              گزارش کلی
            </Link>
            <span aria-hidden="true">/</span>
            <span>بازاریابی</span>
          </div>
          <div className={styles.topActions}>
            <Link href="/" target="_blank" rel="noreferrer" className={styles.secondaryButton}>
              مشاهده فروشگاه
              <LaunchRoundedIcon fontSize="small" />
            </Link>
            <button type="button" className={styles.primaryButton} onClick={saveChanges} disabled={saving || !dirty}>
              <SaveOutlinedIcon fontSize="small" />
              {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </button>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><CampaignOutlinedIcon fontSize="small" /> بازاریابی چرخه عمر</div>
            <h1>هر تعامل با مشتری را به تجربه‌ای بهتر تبدیل کنید.</h1>
            <p>برای هر مرحله، مسیر ارتباطی سنجیده‌ای با پیام، زمان‌بندی و گام بعدی مناسب بسازید.</p>
          </div>
          <div className={styles.heroStatus}>
            <span className={styles.liveDot} />
            <div>
              <strong>{content.status || "آماده فعال‌سازی"}</strong>
              <span>{loading ? "در حال همگام‌سازی آخرین پیش‌نویس" : dirty ? "تغییرات ذخیره‌نشده" : "آخرین محتوای ذخیره‌شده بارگذاری شد"}</span>
            </div>
          </div>
        </section>

        {(message || error) && (
          <div className={`${styles.notice} ${error ? styles.noticeError : styles.noticeSuccess}`} role={error ? "alert" : "status"}>
            {error || message}
          </div>
        )}

        <section className={styles.metricGrid} aria-label="خلاصه مسیر ارتباطی">
          <Metric icon={<AutoAwesomeOutlinedIcon />} label="مجموع نقاط تماس" value={metrics.total} detail="در کل چرخه عمر" />
          <Metric icon={<CampaignOutlinedIcon />} label="پیام‌های بازاریابی" value={metrics.marketing} detail="ارتباط بر اساس رضایت" tone="violet" />
          <Metric icon={<ScheduleOutlinedIcon />} label="به‌روزرسانی سفارش" value={metrics.transactional} detail="پیام‌های تراکنشی همیشگی" tone="amber" />
          <Metric icon={<ShieldOutlinedIcon />} label="قواعد محافظ" value={metrics.guardrails} detail="قوانین حفظ اعتماد" tone="green" />
        </section>

        <section className={styles.panel} aria-labelledby="settings-title">
          <PanelHeading id="settings-title" eyebrow="تنظیمات کمپین" title="پایه مسیر را تنظیم کنید" copy="نام مسیر و وضعیت فعال‌سازی را برای تمام تیم روشن نگه دارید." />
          <div className={styles.settingsGrid}>
            <Field label="نام مسیر" value={content.title} onChange={(value) => updateField("title", value)} />
            <label className={styles.field}>
              <span>وضعیت</span>
              <select value={content.status || ""} onChange={(event) => updateField("status", event.target.value)}>
                <option value="Ready to activate">آماده فعال‌سازی</option>
                <option value="Draft">پیش‌نویس</option>
                <option value="Active">فعال</option>
                <option value="Paused">متوقف</option>
              </select>
            </label>
            <Field
              label="توضیحات"
              value={content.description}
              onChange={(value) => updateField("description", value)}
              multiline
              className={styles.descriptionField}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="touchpoints-title">
          <div className={styles.sectionHeading}>
            <PanelHeading id="touchpoints-title" eyebrow="سازنده مسیر" title="نقاط تماس با مشتری" copy="هر پیام را در همین صفحه ویرایش کنید و زمان‌بندی و محرک‌ها را دقیق نگه دارید." />
            <button type="button" className={styles.addButton} onClick={addStep}>
              <AddRoundedIcon fontSize="small" />
              افزودن نقطه تماس
            </button>
          </div>

          <div className={styles.stepList}>
            {steps.map((step, index) => (
              <article className={styles.stepCard} key={`${step.number || "step"}-${index}`}>
                <div className={styles.stepRail}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {index < steps.length - 1 && <i aria-hidden="true" />}
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <div>
                      <span className={styles.stepEyebrow}>نقطه تماس {index + 1}</span>
                      <h3>{step.stage || "نقطه تماس بدون عنوان"}</h3>
                    </div>
                    <div className={styles.stepActions}>
                      <span className={`${styles.typePill} ${step.type === "Transactional" ? styles.typeTransactional : ""}`}>
                        {step.type === "Transactional" ? "تراکنشی" : "بازاریابی"}
                      </span>
                      <button type="button" className={styles.deleteButton} onClick={() => removeStep(index)} aria-label={`حذف ${step.stage || `نقطه تماس ${index + 1}`}`}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <Field label="نام مرحله" value={step.stage} onChange={(value) => updateStep(index, "stage", value)} />
                    <label className={styles.field}>
                      <span>نوع پیام</span>
                      <select value={step.type || "Marketing"} onChange={(event) => updateStep(index, "type", event.target.value)}>
                        <option value="Marketing">بازاریابی</option>
                        <option value="Transactional">تراکنشی</option>
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>رویداد محرک</span>
                      <select value={triggerOptionFor(step).value} onChange={(event) => updateStepAutomation(index, "trigger", event.target.value)}>
                        {triggerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>زمان‌بندی</span>
                      <select value={scheduleTypeFor(step)} onChange={(event) => updateStepAutomation(index, "scheduleType", event.target.value)}>
                        {scheduleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    {scheduleTypeFor(step) === "delay" ? (
                      <label className={styles.field}>
                        <span>ارسال پس از</span>
                        <div className={styles.inlineControl}>
                          <input
                            type="number"
                            min="1"
                            value={delayValueFor(delayMinutesFor(step))}
                            onChange={(event) => updateStepAutomation(index, "delayMinutes", event.target.value)}
                          />
                          <select value={delayUnitFor(delayMinutesFor(step))} onChange={(event) => updateStepAutomation(index, "delayUnit", event.target.value)} aria-label="واحد تأخیر">
                            <option value="minutes">دقیقه</option>
                            <option value="hours">ساعت</option>
                            <option value="days">روز</option>
                          </select>
                        </div>
                        <small className={styles.fieldHint}>زمان‌سنج با رخ دادن محرک انتخاب‌شده آغاز می‌شود.</small>
                      </label>
                    ) : (
                      <div className={styles.automationHint}>
                        <span>زمان اجرا</span>
                        <strong>{timingFor(scheduleTypeFor(step), delayMinutesFor(step))}</strong>
                      </div>
                    )}
                    <Field label="موضوع ایمیل" value={step.subject} onChange={(value) => updateStep(index, "subject", value)} className={styles.wideField} />
                    <EmailBodyField value={step.body} onOpen={() => openBodyEditor(index)} className={styles.wideField} />
                    <Field label="هدف" value={step.purpose} onChange={(value) => updateStep(index, "purpose", value)} multiline className={styles.wideField} />
                    <Field label="برچسب دکمه" value={step.cta} onChange={(value) => updateStep(index, "cta", value)} />
                    <Field label="نشانی دکمه" value={step.href} onChange={(value) => updateStep(index, "href", value)} />
                  </div>
                </div>
              </article>
            ))}
            {steps.length === 0 && <EmptyState copy="هنوز نقطه تماسی وجود ندارد؛ اولین مرحله را برای ساخت مسیر اضافه کنید." action="افزودن نقطه تماس" onClick={addStep} />}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.guardrailPanel}`} aria-labelledby="guardrails-title">
          <div className={styles.sectionHeading}>
            <PanelHeading id="guardrails-title" eyebrow="اعتماد و انطباق" title="قواعد محافظ مسیر" copy="قوانین ساده، ارتباطات را کاربردی، به‌موقع و محترمانه نگه می‌دارند." />
            <button type="button" className={styles.addButton} onClick={addGuardrail}>
              <AddRoundedIcon fontSize="small" />
              افزودن قانون
            </button>
          </div>
          <div className={styles.guardrailList}>
            {guardrails.map((guardrail, index) => (
              <div className={styles.guardrailRow} key={`guardrail-${index}`}>
                <span className={styles.ruleNumber}>{String(index + 1).padStart(2, "0")}</span>
                <input aria-label={`قانون محافظ ${index + 1}`} value={guardrail} onChange={(event) => updateGuardrail(index, event.target.value)} />
                <button type="button" className={styles.deleteButton} onClick={() => removeGuardrail(index)} aria-label={`حذف قانون محافظ ${index + 1}`}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </button>
              </div>
            ))}
            {guardrails.length === 0 && <EmptyState copy="هنوز قانون محافظی وجود ندارد؛ برای حفظ تجربه مشتری یک قانون اضافه کنید." action="افزودن قانون" onClick={addGuardrail} />}
          </div>
        </section>

        <footer className={styles.footerActions}>
          <div>
            <strong>{dirty ? "تغییرات ذخیره‌نشده دارید" : "مسیر شما به‌روز است"}</strong>
            <span>تغییرات در فضای بازاریابی ذخیره شده و آماده بررسی هستند.</span>
          </div>
          <button type="button" className={styles.primaryButton} onClick={saveChanges} disabled={saving || !dirty}>
            <SaveOutlinedIcon fontSize="small" />
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </footer>
      </div>

      {bodyEditor && (
        <div className={styles.editorBackdrop} role="presentation" onMouseDown={closeBodyEditor}>
          <section className={styles.editorDialog} role="dialog" aria-modal="true" aria-labelledby="email-body-editor-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.editorHeader}>
              <div>
                <span className={styles.stepEyebrow}>ویرایش متن ایمیل</span>
                <h2 id="email-body-editor-title">بهینه‌سازی {steps[bodyEditor.index]?.stage || "نقطه تماس"}</h2>
                <p>پیش از ذخیره، متن را قالب‌بندی کنید، لینک اضافه کنید و خوانایی آن را بهبود دهید.</p>
              </div>
              <button type="button" className={styles.editorClose} onClick={closeBodyEditor} aria-label="بستن ویرایشگر متن ایمیل">×</button>
            </div>
            <div className={styles.editorCanvas}>
              <TinyMceEditor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"}
                value={bodyEditor.draft}
                onEditorChange={(value) => setBodyEditor((current) => current ? { ...current, draft: value } : current)}
                init={{
                  height: 430,
                  menubar: false,
                  plugins: ["autolink", "lists", "link", "image", "table", "code", "preview"],
                  toolbar: "undo redo | blocks | bold italic underline removeformat | bullist numlist | link image table | preview code",
                  automatic_uploads: true,
                  images_file_types: "jpg,jpeg,png,gif,webp",
                  images_upload_handler: async (blobInfo) => {
                    const formData = new FormData();
                    formData.append("image", blobInfo.blob(), blobInfo.filename());
                    const response = await fetch("/api/dashboard/marketing/upload", {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.location) throw new Error(data.error || "بارگذاری تصویر ناموفق بود.");
                    return data.location;
                  },
                  branding: false,
                  promotion: false,
                  content_style: "body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.65; padding: 12px; color: #1f2d42; } p { margin: 0 0 1em; }",
                }}
              />
            </div>
            <div className={styles.editorFooter}>
              <span>قالب‌بندی HTML پیش از ذخیره‌سازی پاک‌سازی می‌شود.</span>
              <div>
                <button type="button" className={styles.secondaryButton} onClick={closeBodyEditor}>انصراف</button>
                <button type="button" className={styles.primaryButton} onClick={saveBodyEditor}>ذخیره متن ایمیل</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function PanelHeading({ id, eyebrow, title, copy }) {
  return (
    <div className={styles.panelHeading}>
      <span>{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function Metric({ icon, label, value, detail, tone = "blue" }) {
  return (
    <div className={`${styles.metric} ${styles[`metric${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <div className={styles.metricIcon}>{icon}</div>
      <div className={styles.metricCopy}>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, rows = 3, className = "" }) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={rows} />
      ) : (
        <input value={value || ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function EmailBodyField({ value, onOpen, className = "" }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <div className={styles.fieldHeader}>
        <span>متن ایمیل</span>
        <button type="button" className={styles.optimizeButton} onClick={onOpen}>
          <AutoAwesomeOutlinedIcon fontSize="inherit" />
          بهینه‌سازی با ویرایشگر
        </button>
      </div>
      <button type="button" className={styles.bodyPreview} onClick={onOpen}>
        <span>{plainText(value) || "متن ایمیل این نقطه تماس را وارد کنید."}</span>
        <span className={styles.bodyPreviewHint}>باز کردن ویرایشگر</span>
      </button>
    </div>
  );
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EmptyState({ copy, action, onClick }) {
  return (
    <div className={styles.emptyState}>
      <span>{copy}</span>
      <button type="button" className={styles.textButton} onClick={onClick}>{action}</button>
    </div>
  );
}
