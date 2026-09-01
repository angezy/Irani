"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  CUSTOM_FONT_VALUE,
  CUSTOM_FONT_OPTION_PREFIX,
  getSiteFontFamily,
  isValidCustomFontName,
  isValidCustomFontUrl,
  normalizeSiteSettings,
  SITE_FONT_FORMAT_OPTIONS,
  SITE_FONT_OPTIONS,
} from "../../lib/siteSettings";
import { useSiteSettings } from "../../components/SiteThemeProvider";

function normalizeHexColor(value) {
  const candidate = String(value || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(candidate)) {
    return `#${candidate.slice(1).split("").map((digit) => `${digit}${digit}`).join("")}`;
  }
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : "";
}

const COLOR_RECOMMENDATIONS = [
  { label: "غروب", value: "#FF6B35" },
  { label: "جنگل", value: "#287A65" },
  { label: "اقیانوس", value: "#315C78" },
  { label: "طلایی", value: "#F28C28" },
  { label: "رز", value: "#C94A4A" },
  { label: "خاکستری", value: "#475569" },
];

function getColorRecommendations(value) {
  const query = String(value || "").trim().toLowerCase();
  if (!query || query === "#") return COLOR_RECOMMENDATIONS;

  const matches = COLOR_RECOMMENDATIONS.filter((recommendation) => (
    recommendation.value.toLowerCase().startsWith(query)
    || recommendation.label.toLowerCase().includes(query.replace(/^#/, ""))
  ));
  return matches.length ? matches : COLOR_RECOMMENDATIONS;
}

function getFontOptions(siteSettings) {
  const customFonts = Array.isArray(siteSettings?.customFonts) ? siteSettings.customFonts : [];
  const customOptions = customFonts.map((font) => ({
    value: `${CUSTOM_FONT_OPTION_PREFIX}${font.id}`,
    label: `${font.name} · واردشده`,
    stack: getSiteFontFamily(CUSTOM_FONT_VALUE, font.name),
  }));
  const activeCustomId = String(siteSettings?.customFontId || "").trim();

  // Keep legacy/incomplete custom settings selectable while they are being
  // repaired or saved. MUI warns when a controlled Select value has no item.
  if (siteSettings?.fontFamily === CUSTOM_FONT_VALUE) {
    if (activeCustomId && !customOptions.some((option) => option.value === `${CUSTOM_FONT_OPTION_PREFIX}${activeCustomId}`)) {
      customOptions.push({
        value: `${CUSTOM_FONT_OPTION_PREFIX}${activeCustomId}`,
        label: `${siteSettings.customFontName || "فونت سفارشی"} · فعال`,
        stack: getSiteFontFamily(CUSTOM_FONT_VALUE, siteSettings.customFontName),
      });
    } else if (!activeCustomId) {
      customOptions.push({
        value: CUSTOM_FONT_VALUE,
        label: `${siteSettings.customFontName || "فونت سفارشی"} · فعال`,
        stack: getSiteFontFamily(CUSTOM_FONT_VALUE, siteSettings.customFontName),
      });
    }
  }

  return [
    ...SITE_FONT_OPTIONS,
    ...customOptions,
  ];
}

const FIELD_GROUPS = [
  {
    title: "هویت برند",
    description: "این مقادیر در سربرگ، پابرگ، داشبورد و بخش‌های مشتری نمایش داده می‌شوند.",
    fields: [
      { key: "siteName", label: "نام فروشگاه", required: true },
      { key: "siteTagline", label: "شعار کوتاه" },
      { key: "siteDescription", label: "توضیحات فروشگاه", multiline: true, minRows: 3, required: true },
      { key: "siteLogoUrl", label: "نشانی لوگو", placeholder: "https://example.com/logo.svg" },
      { key: "siteFaviconUrl", label: "نشانی favicon", placeholder: "https://example.com/favicon.ico" },
    ],
  },
  {
    title: "رنگ‌های کامل سایت",
    description: "تمام رنگ‌های مشترک فروشگاه را ویرایش کنید. هر فیلد انتخاب‌گر رنگ یا کد هگز #RRGGBB / #RGB را می‌پذیرد.",
    fields: [
      { key: "primaryColor", label: "اصلی", type: "color", helperText: "دکمه‌ها و لینک‌های اصلی" },
      { key: "primaryDarkColor", label: "اصلی تیره", type: "color", helperText: "حالت‌های فعال و هاور" },
      { key: "linkHoverColor", label: "هاور لینک", type: "color", helperText: "حالت هاور لینک‌های سربرگ و متن" },
      { key: "primaryLightColor", label: "اصلی روشن", type: "color", helperText: "برجسته‌سازی ملایم" },
      { key: "primarySoftColor", label: "اصلی نرم", type: "color", helperText: "پس‌زمینه‌های انتخاب‌شده" },
      { key: "accentColor", label: "تأکیدی", type: "color", helperText: "عملیات ثانویه" },
      { key: "accentDarkColor", label: "تأکیدی تیره", type: "color", helperText: "حالت هاور رنگ تأکیدی" },
      { key: "accentLightColor", label: "تأکیدی روشن", type: "color", helperText: "برجسته‌سازی تأکیدی" },
      { key: "accentSoftColor", label: "تأکیدی نرم", type: "color", helperText: "پس‌زمینه‌های تأکیدی" },
      { key: "backgroundColor", label: "پس‌زمینه صفحه", type: "color", helperText: "پس‌زمینه اصلی سایت" },
      { key: "surfaceColor", label: "سطح", type: "color", helperText: "کارت‌ها و پنل‌ها" },
      { key: "surfaceMutedColor", label: "سطح ملایم", type: "color", helperText: "جست‌وجو و پنل‌های ظریف" },
      { key: "borderColor", label: "حاشیه‌ها", type: "color", helperText: "جداکننده‌ها و خطوط" },
      { key: "textPrimaryColor", label: "متن اصلی", type: "color", helperText: "عنوان‌ها و متن اصلی" },
      { key: "textSecondaryColor", label: "متن ثانویه", type: "color", helperText: "برچسب‌ها و متن پشتیبان" },
      { key: "successColor", label: "موفقیت", type: "color", helperText: "پیام‌های موفقیت" },
      { key: "warningColor", label: "هشدار", type: "color", helperText: "پیام‌های هشدار" },
      { key: "errorColor", label: "خطا", type: "color", helperText: "پیام‌های خطا" },
    ],
  },
  {
    title: "تایپوگرافی",
    description: "برای فروشگاه، صفحات حساب و داشبورد فونت آماده انتخاب یا فونت جدید بارگذاری کنید. فایل‌های متغیر WOFF2/TTF پشتیبانی می‌شوند.",
    fields: [
      { key: "fontFamily", label: "فونت سایت", type: "select", options: SITE_FONT_OPTIONS, helperText: "فونت‌های سفارشی با دکمه زیر مدیریت می‌شوند." },
    ],
  },
  {
    title: "سئو و اشتراک‌گذاری",
    description: "برای متادیتای مرورگر، پیش‌نمایش جست‌وجو، اشتراک‌گذاری اجتماعی و لینک‌های canonical استفاده می‌شود.",
    fields: [
      { key: "siteUrl", label: "نشانی canonical سایت", required: true, placeholder: "https://example.com" },
      { key: "siteKeywords", label: "کلمات کلیدی سئو", multiline: true, minRows: 2, helperText: "کلمات کلیدی را با ویرگول جدا کنید." },
      { key: "siteOgImageUrl", label: "نشانی تصویر پیش‌نمایش اجتماعی", placeholder: "https://example.com/social-card.jpg" },
    ],
  },
  {
    title: "ارتباط با مشتری",
    description: "وقتی صفحات پشتیبانی و تماس مقدار جداگانه‌ای نداشته باشند، این اطلاعات نمایش داده می‌شود.",
    fields: [
      { key: "supportEmail", label: "ایمیل پشتیبانی", type: "email" },
      { key: "supportPhone", label: "تلفن پشتیبانی" },
      { key: "supportHours", label: "ساعات پشتیبانی" },
    ],
  },
  {
    title: "پیشنهاد خوشامدگویی بازدید اول",
    description: "پنجره اختیاری نمایش‌داده‌شده به بازدیدکنندگان جدید را ویرایش کنید. ابتدا کد تخفیف بسازید و سپس پیشنهاد را فعال کنید.",
    fields: [
      { key: "welcomePopupEnabled", label: "نمایش پنجره خوشامدگویی", type: "toggle", helperText: "پیشنهاد بازدید اول را فعال یا غیرفعال کنید." },
      { key: "welcomePopupEyebrow", label: "برچسب بالایی" },
      { key: "welcomePopupTitle", label: "عنوان پیشنهاد", fullWidth: true, required: true },
      { key: "welcomePopupDescription", label: "توضیحات پیشنهاد", multiline: true, minRows: 2, fullWidth: true, required: true },
      { key: "welcomePopupButtonLabel", label: "برچسب دکمه" },
      { key: "welcomePopupCouponCode", label: "کد تخفیف", helperText: "از کدی استفاده کنید که در داشبورد ← کدهای تخفیف وجود دارد." },
      { key: "welcomePopupFinePrint", label: "توضیحات ریز", fullWidth: true },
    ],
  },
];

export default function SiteSettingsPage() {
  const siteSettings = useSiteSettings();
  const [form, setForm] = useState(siteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [customFontDialogOpen, setCustomFontDialogOpen] = useState(false);
  const customFontInputRef = useRef(null);
  const [customFontDraft, setCustomFontDraft] = useState({
    name: "",
    url: "",
    format: "woff2",
    variable: false,
    id: "",
    fileName: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeColorField, setActiveColorField] = useState(null);

  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
    let active = true;
    fetch("/api/dashboard/settings", { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : response.json().then((body) => Promise.reject(new Error(body.error || "بارگذاری تنظیمات ممکن نیست"))))
      .then((data) => active && setForm((current) => normalizeSiteSettings({ ...current, ...(data.site || {}) })))
      .catch((loadError) => active && setError(loadError.message || "بارگذاری تنظیمات ممکن نیست"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const updateField = (key, value) => {
    // Keep the color draft exactly as entered. Expanding #RGB while the user is
    // typing makes the controlled input jump and prevents deleting/editing it.
    const draftValue = key.endsWith("Color") ? String(value) : value;
    const normalizedValue = key.endsWith("Color") ? normalizeHexColor(draftValue) : draftValue;
    setForm((current) => ({ ...current, [key]: draftValue }));
    if (typeof window !== "undefined" && (key === "fontFamily" || key.startsWith("customFont") || (key.endsWith("Color") && normalizedValue))) {
      window.dispatchEvent(new CustomEvent("site-settings-updated", {
        detail: { [key]: normalizedValue },
      }));
    }
    setMessage("");
    setError("");
  };

  const openCustomFontDialog = () => {
    setCustomFontDraft({
      name: form.customFontName || "",
      url: form.customFontUrl || "",
      format: form.customFontFormat || "woff2",
      variable: form.customFontVariable === true,
      id: form.customFontId || "",
      fileName: form.customFontUrl?.split("/").pop() || "",
    });
    setCustomFontDialogOpen(true);
    setMessage("");
    setError("");
  };

  const closeCustomFontDialog = () => {
    if (uploadingFont) return;
    setCustomFontDialogOpen(false);
  };

  const updateCustomFontDraft = (key, value) => {
    setCustomFontDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  const uploadFont = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingFont(true);
    setMessage("");
    setError("");
    try {
      const payload = new FormData();
      payload.append("font", file);
      const response = await fetch("/api/dashboard/settings/font-upload", {
        method: "POST",
        credentials: "include",
        body: payload,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "بارگذاری فونت ممکن نیست");

      setCustomFontDraft((current) => ({
        ...current,
        url: body.url,
        format: body.format,
        variable: body.variable === true,
        id: body.id || current.id,
        fileName: body.name || file.name,
      }));
      setMessage("فونت بارگذاری شد. نام آن را وارد و سپس روی سایت اعمال کنید.");
    } catch (uploadError) {
      setError(uploadError.message || "بارگذاری فونت ممکن نیست");
    } finally {
      setUploadingFont(false);
    }
  };

  const applyCustomFont = () => {
    const name = String(customFontDraft.name || "").trim();
    const url = String(customFontDraft.url || "").trim();
    if (!isValidCustomFontName(name)) {
      setError("نام فونت باید با حرف شروع شود و فقط شامل حروف، عدد، فاصله، خط تیره یا زیرخط باشد.");
      return;
    }
    if (!isValidCustomFontUrl(url)) {
      setError("پیش از اعمال فونت، یک فایل فونت انتخاب کنید یا نشانی HTTPS معتبر برای فونت سفارشی وارد کنید.");
      return;
    }

    const fontId = customFontDraft.id || `font-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const importedFont = {
      id: fontId,
      name,
      url,
      format: customFontDraft.format,
      variable: customFontDraft.variable === true,
    };
    const existingFonts = Array.isArray(form.customFonts) ? form.customFonts : [];
    const customFonts = existingFonts.some((font) => font.id === fontId)
      ? existingFonts.map((font) => font.id === fontId ? importedFont : font)
      : [...existingFonts, importedFont];
    const nextValues = {
      fontFamily: CUSTOM_FONT_VALUE,
      customFontName: name,
      customFontUrl: url,
      customFontFormat: customFontDraft.format,
      customFontVariable: customFontDraft.variable === true,
      customFontId: fontId,
      customFonts,
    };
    setForm((current) => ({ ...current, ...nextValues }));
    window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: nextValues }));
    setCustomFontDialogOpen(false);
    setMessage(`${name} آماده است. برای انتشار فونت، تنظیمات سایت را ذخیره کنید.`);
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.siteName.trim() || !form.siteDescription.trim() || !form.siteUrl.trim()) {
      setError("نام فروشگاه، توضیحات فروشگاه و نشانی canonical سایت الزامی است.");
      return;
    }
    const colorFields = [
      "primaryColor", "primaryDarkColor", "primaryLightColor", "primarySoftColor",
      "linkHoverColor",
      "accentColor", "accentDarkColor", "accentLightColor", "accentSoftColor",
      "backgroundColor", "surfaceColor", "surfaceMutedColor", "borderColor",
      "textPrimaryColor", "textSecondaryColor", "successColor", "warningColor", "errorColor",
    ];
    const invalidColor = colorFields.find((key) => !normalizeHexColor(form[key]));
    if (invalidColor) {
      setError(`مقدار رنگ «${invalidColor}» باید یک رنگ هگز مانند #FF6B35 باشد.`);
      return;
    }
    if (form.fontFamily === CUSTOM_FONT_VALUE) {
      if (!isValidCustomFontName(form.customFontName)) {
        setError("پیش از ذخیره، نام معتبر فونت سفارشی را وارد کنید.");
        return;
      }
      if (!isValidCustomFontUrl(form.customFontUrl)) {
        setError("پیش از ذخیره، یک فایل فونت بارگذاری کنید یا نشانی HTTPS معتبر برای فونت سفارشی وارد کنید.");
        return;
      }
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: form }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "ذخیره تنظیمات سایت ممکن نیست");
      if (body.site) setForm((current) => normalizeSiteSettings({ ...current, ...body.site }));
      if (body.site && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: body.site }));
      }
      setMessage("تنظیمات سایت ذخیره شد و فونت انتخاب‌شده در سراسر سایت اعمال شد.");
    } catch (saveError) {
      setError(saveError.message || "ذخیره تنظیمات سایت ممکن نیست");
    } finally {
      setSaving(false);
    }
  };

  const selectFont = (value) => {
    if (!value.startsWith(CUSTOM_FONT_OPTION_PREFIX)) {
      updateField("fontFamily", value);
      return;
    }
    const fontId = value.slice(CUSTOM_FONT_OPTION_PREFIX.length);
    const selectedFont = (Array.isArray(form.customFonts) ? form.customFonts : []).find((font) => font.id === fontId);
    if (!selectedFont) return;
    const nextValues = {
      fontFamily: CUSTOM_FONT_VALUE,
      customFontId: selectedFont.id,
      customFontName: selectedFont.name,
      customFontUrl: selectedFont.url,
      customFontFormat: selectedFont.format,
      customFontVariable: selectedFont.variable === true,
    };
    setForm((current) => ({ ...current, ...nextValues }));
    window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: nextValues }));
    setMessage("");
    setError("");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 850, letterSpacing: "0.14em" }}>پیکربندی فروشگاه</Typography>
        <Typography component="h1" sx={{ mt: 0.5, color: "#0f172a", fontSize: { xs: 28, md: 36 }, fontWeight: 900, letterSpacing: "-0.04em" }}>هویت سایت و سئو</Typography>
        <Typography sx={{ mt: 0.75, color: "#64748b", maxWidth: 720 }}>نام فروشگاه، فونت، رنگ‌ها، پیش‌فرض‌های سئو، لوگو و اطلاعات پشتیبانی را از یکجا تغییر دهید. این تنظیمات بین فروشگاه عمومی و داشبورد مشترک هستند.</Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2.5} component="form" onSubmit={save}>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <Stack spacing={2.5}>
            {FIELD_GROUPS.map((group) => (
              <Card key={group.title} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 25px rgba(15,23,42,0.05)" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
                  <Typography sx={{ color: "#0f172a", fontSize: 19, fontWeight: 850 }}>{group.title}</Typography>
                  <Typography sx={{ mt: 0.5, mb: 2.5, color: "#64748b", fontSize: 13 }}>{group.description}</Typography>
                  <Grid container spacing={2}>
                    {group.fields.map((field) => (
                      <Grid
                        key={field.key}
                        size={{
                          xs: 12,
                          sm: field.fullWidth || field.key === "siteDescription" || field.key === "siteKeywords" ? 12 : 6
                        }}>
                        {field.type === "color" ? (
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <TextField
                              type="color"
                              label={field.label}
                              value={normalizeHexColor(form[field.key]) || "#000000"}
                              onChange={(event) => updateField(field.key, event.target.value)}
                              disabled={hydrated && (loading || saving)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ width: 78, flexShrink: 0, "& input": { height: 40, p: 0.5, cursor: "pointer" } }}
                              size="small"
                            />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <TextField
                                fullWidth
                                label={`${field.label} hex code`}
                                value={form[field.key] || ""}
                                onFocus={() => setActiveColorField(field.key)}
                                onChange={(event) => updateField(field.key, event.target.value)}
                                placeholder="#FF6B35"
                                helperText={field.helperText || "قالب مجاز: #RRGGBB"}
                                error={Boolean(form[field.key]) && !normalizeHexColor(form[field.key])}
                                disabled={hydrated && (loading || saving)}
                                inputProps={{ maxLength: 7, spellCheck: false }}
                                size="small"
                              />
                              {activeColorField === field.key && (
                                <Box sx={{ mt: 0.75 }}>
                                  <Typography sx={{ mb: 0.5, color: "#64748b", fontSize: 11, fontWeight: 700 }}>
                                    رنگ‌های پیشنهادی
                                  </Typography>
                                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                    {getColorRecommendations(form[field.key]).map((recommendation) => (
                                      <Box
                                        key={recommendation.value}
                                        component="button"
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => updateField(field.key, recommendation.value)}
                                        aria-label={`استفاده از ${recommendation.label} ${recommendation.value}`}
                                        sx={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          px: 0.75,
                                          py: 0.35,
                                          border: "1px solid #e2e8f0",
                                          borderRadius: 999,
                                          backgroundColor: "#ffffff",
                                          color: "#475569",
                                          cursor: "pointer",
                                          font: "inherit",
                                          fontSize: 11,
                                          "&:hover": { borderColor: recommendation.value, backgroundColor: "#f8fafc" },
                                        }}
                                      >
                                        <Box sx={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: recommendation.value, border: "1px solid rgba(15,23,42,0.15)" }} />
                                        {recommendation.label}
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          </Stack>
                        ) : field.type === "select" ? (
                          <TextField
                            fullWidth
                            select
                            label={field.label}
                            value={field.key === "fontFamily" && form.fontFamily === CUSTOM_FONT_VALUE && form.customFontId
                              ? `${CUSTOM_FONT_OPTION_PREFIX}${form.customFontId}`
                              : (form[field.key] || "")}
                            onChange={(event) => field.key === "fontFamily" ? selectFont(event.target.value) : updateField(field.key, event.target.value)}
                            helperText={field.helperText}
                            disabled={hydrated && (loading || saving)}
                            size="small"
                          >
                            {(field.key === "fontFamily" ? getFontOptions(form) : (field.options || SITE_FONT_OPTIONS)).map((option) => (
                              <MenuItem key={option.value} value={option.value} sx={option.stack ? { fontFamily: option.stack } : undefined}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : field.type === "toggle" ? (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minHeight: 40 }}>
                            <Switch
                              checked={Boolean(form[field.key])}
                              onChange={(event) => updateField(field.key, event.target.checked)}
                              disabled={hydrated && (loading || saving)}
                              color="primary"
                            />
                            <Box>
                              <Typography sx={{ color: "#0f172a", fontWeight: 750, fontSize: 14 }}>{field.label}</Typography>
                              {field.helperText && <Typography sx={{ color: "#64748b", fontSize: 12 }}>{field.helperText}</Typography>}
                            </Box>
                          </Stack>
                        ) : (
                          <TextField
                            fullWidth
                            label={field.label}
                            value={form[field.key] || ""}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            required={field.required}
                            type={field.type || "text"}
                            multiline={field.multiline}
                            minRows={field.minRows}
                            placeholder={field.placeholder}
                            helperText={field.helperText}
                            disabled={hydrated && (loading || saving)}
                            size="small"
                          />
                        )}
                      </Grid>
                    ))}
                  </Grid>
                  {group.title === "تایپوگرافی" && (
                    <Stack spacing={0.75} sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #e2e8f0" }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography sx={{ color: "#0f172a", fontSize: 14, fontWeight: 800 }}>
                            {form.fontFamily === CUSTOM_FONT_VALUE ? "فونت سفارشی فعال است" : "افزودن فونت سفارشی"}
                          </Typography>
                          <Typography sx={{ color: "#64748b", fontSize: 12 }}>
                            {form.fontFamily === CUSTOM_FONT_VALUE
                              ? `${form.customFontName || "فونت بدون نام"}${form.customFontVariable ? " · متغیر" : ""}`
                              : "فایل فونت را در پنجره بازشده بارگذاری کنید؛ در فهرست آماده نمایش داده نمی‌شود."}
                          </Typography>
                        </Box>
                        {form.fontFamily === CUSTOM_FONT_VALUE && form.customFontVariable && <Chip size="small" label="متغیر" color="primary" variant="outlined" />}
                      </Stack>
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={form.fontFamily === CUSTOM_FONT_VALUE ? <EditOutlinedIcon /> : <CloudUploadOutlinedIcon />}
                        onClick={openCustomFontDialog}
                        disabled={hydrated && (loading || saving)}
                        sx={{ alignSelf: "flex-start", mt: 0.5, borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {form.fontFamily === CUSTOM_FONT_VALUE ? "ویرایش فونت سفارشی" : "بارگذاری فونت سفارشی"}
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Card sx={{ position: { lg: "sticky" }, top: { lg: 84 }, borderRadius: 3, bgcolor: "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", boxShadow: "0 12px 35px rgba(43,43,43,0.08)" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography sx={{ color: "var(--color-accent)", fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase" }}>پیش‌نمایش زنده</Typography>
              <Typography sx={{ mt: 1.5, fontSize: 30, fontWeight: 950, letterSpacing: "-0.05em", color: form.primaryColor, fontFamily: getSiteFontFamily(form.fontFamily, form.customFontName) }}>{form.siteName || "نام سایت شما"}</Typography>
              <Typography sx={{ mt: 1, color: "var(--color-text-secondary)", lineHeight: 1.7, fontFamily: getSiteFontFamily(form.fontFamily, form.customFontName) }}>{form.siteDescription || "توضیحات سایت شما اینجا نمایش داده می‌شود."}</Typography>
              <Divider sx={{ my: 2.5, borderColor: form.backgroundColor }} />
              <Typography sx={{ fontSize: 12, color: "var(--color-text-secondary)" }}>عنوان مرورگر</Typography>
              <Typography sx={{ mt: 0.4, fontWeight: 800 }}>{form.siteName || "نام سایت شما"}</Typography>
              <Typography sx={{ mt: 2, fontSize: 12, color: "var(--color-text-secondary)" }}>شعار کوتاه</Typography>
              <Typography sx={{ mt: 0.4, fontWeight: 800 }}>{form.siteTagline || "شعار کوتاه شما"}</Typography>
              <Button type="submit" fullWidth variant="contained" startIcon={<SaveOutlinedIcon />} disabled={hydrated && (loading || saving)} sx={{ mt: 3, bgcolor: form.primaryColor, color: "#ffffff", borderRadius: 999, py: 1.15, textTransform: "none", fontWeight: 900, "&:hover": { bgcolor: form.primaryColor } }}>
                {saving ? "در حال ذخیره…" : "ذخیره تنظیمات سایت"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={customFontDialogOpen} onClose={closeCustomFontDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ paddingInlineStart: 6, color: "#0f172a", fontWeight: 850 }}>
          بارگذاری فونت سفارشی
          <IconButton aria-label="بستن پنجره فونت سفارشی" onClick={closeCustomFontDialog} disabled={uploadingFont} sx={{ position: "absolute", top: 10, insetInlineStart: 12 }}>
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
              فایل WOFF2، WOFF، TTF یا OTF را بارگذاری کنید. فایل‌های متغیر Google Fonts در صورت علامت‌گذاری به‌عنوان متغیر پشتیبانی می‌شوند.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              required
              label="نام خانواده فونت"
              value={customFontDraft.name}
              onChange={(event) => updateCustomFontDraft("name", event.target.value)}
              placeholder="مثلاً وزیر سنس"
              helperText="فقط حروف، عدد، فاصله، خط تیره و زیرخط مجاز است."
              disabled={uploadingFont}
            />
            <Box sx={{ p: 1.5, border: "1px dashed #cbd5e1", borderRadius: 2, bgcolor: "#f8fafc" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 800 }}>فایل فونت</Typography>
                  <Typography sx={{ color: "#64748b", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {customFontDraft.fileName || "هنوز فایلی بارگذاری نشده است"}
                  </Typography>
                </Box>
                <Button type="button" variant="contained" startIcon={<CloudUploadOutlinedIcon />} onClick={() => customFontInputRef.current?.click()} disabled={uploadingFont} sx={{ flexShrink: 0, textTransform: "none", fontWeight: 800 }}>
                  {uploadingFont ? "در حال بارگذاری…" : "انتخاب فایل"}
                </Button>
                <input ref={customFontInputRef} hidden type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" onChange={uploadFont} />
              </Stack>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={customFontDraft.variable} onChange={(event) => updateCustomFontDraft("variable", event.target.checked)} disabled={uploadingFont} />}
              label={<Box><Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 750 }}>این فونت متغیر است</Typography><Typography sx={{ color: "#64748b", fontSize: 12 }}>برای فونت‌های متغیر دانلودشده از Google Fonts این گزینه را فعال کنید تا همه وزن‌ها از محور فونت استفاده کنند.</Typography></Box>}
              sx={{ alignItems: "flex-start", marginInline: 0 }}
            />
            <Divider />
            <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 750 }}>یا از فایل فونتی که قبلاً میزبانی شده استفاده کنید</Typography>
            <TextField
              fullWidth
              label="نشانی فایل فونت"
              value={customFontDraft.url}
              onChange={(event) => updateCustomFontDraft("url", event.target.value)}
              placeholder="/uploads/fonts/acme-sans.woff2"
              helperText="از فایل بارگذاری‌شده یا نشانی HTTPS با CORS فعال استفاده کنید."
              disabled={uploadingFont}
            />
            <TextField
              select
              fullWidth
              label="قالب فونت"
              value={customFontDraft.format}
              onChange={(event) => updateCustomFontDraft("format", event.target.value)}
              helperText="قالب متناسب با نشانی را انتخاب کنید."
              disabled={uploadingFont}
            >
              {SITE_FONT_FORMAT_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeCustomFontDialog} disabled={uploadingFont} sx={{ textTransform: "none", fontWeight: 750 }}>انصراف</Button>
          <Button onClick={applyCustomFont} variant="contained" disabled={uploadingFont} sx={{ textTransform: "none", fontWeight: 800 }}>استفاده از این فونت</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
