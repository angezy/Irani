export const SITE_FONT_OPTIONS = [
  { value: "system", label: "رابط کاربری سیستم", stack: "Vazirmatn, Tahoma, Arial, sans-serif" },
  { value: "arial", label: "Arial", stack: "Arial, Tahoma, sans-serif" },
  { value: "verdana", label: "Verdana", stack: "Verdana, Tahoma, sans-serif" },
  { value: "trebuchet", label: "Trebuchet MS", stack: "\"Trebuchet MS\", Tahoma, sans-serif" },
  { value: "georgia", label: "Georgia", stack: "Georgia, Tahoma, serif" },
  { value: "times", label: "Times New Roman", stack: "\"Times New Roman\", Tahoma, serif" },
  { value: "courier", label: "Courier New", stack: "\"Courier New\", Tahoma, monospace" },
];

export const CUSTOM_FONT_VALUE = "custom";
export const CUSTOM_FONT_OPTION_PREFIX = "custom:";

export const SITE_FONT_FORMAT_OPTIONS = [
  { value: "woff2", label: "WOFF2" },
  { value: "woff", label: "WOFF" },
  { value: "ttf", label: "TrueType (TTF)" },
  { value: "otf", label: "OpenType (OTF)" },
];

export const DEFAULT_SITE_SETTINGS = {
  siteName: process.env.NEXT_PUBLIC_STORE_NAME || "فروشگاه ایرانی",
  siteDescription: `${process.env.NEXT_PUBLIC_STORE_NAME || "فروشگاه ایرانی"}؛ خریدی ساده، امن و مطمئن.`,
  siteTagline: "با اطمینان خرید کنید",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000",
  siteKeywords: "فروشگاه اینترنتی, خرید آنلاین, محصولات, تجارت الکترونیک",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteOgImageUrl: "",
  fontFamily: "system",
  customFontName: "",
  customFontUrl: "",
  customFontFormat: "woff2",
  customFontVariable: false,
  customFontId: "",
  customFonts: [],
  primaryColor: "#FF6B35",
  primaryDarkColor: "#B94016",
  linkHoverColor: "#C94C1B",
  primaryLightColor: "#FFB38A",
  primarySoftColor: "#FFF0E8",
  accentColor: "#315C78",
  accentDarkColor: "#24465C",
  accentLightColor: "#A9C5D6",
  accentSoftColor: "#EDF4F7",
  backgroundColor: "#F7F3EC",
  surfaceColor: "#FFFEFC",
  surfaceMutedColor: "#EEEAE3",
  borderColor: "#D8D2C8",
  textPrimaryColor: "#242321",
  textSecondaryColor: "#68635D",
  successColor: "#287A65",
  warningColor: "#f28c28",
  errorColor: "#c94a4a",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  supportPhone: "",
  supportHours: "پشتیبانی در کمتر از ۲۴ تا ۴۸ ساعت پاسخ‌گو است",
  welcomePopupEnabled: false,
  welcomePopupEyebrow: "خوش‌آمدید",
  welcomePopupTitle: "به فروشگاه ما خوش آمدید",
  welcomePopupDescription: "برای دیدن محصولات و پیشنهادهای ویژه آماده‌اید؟",
  welcomePopupButtonLabel: "شروع خرید",
  welcomePopupCouponCode: "",
  welcomePopupFinePrint: "",
};

export function isValidCustomFontName(value) {
  return /^[A-Za-z][A-Za-z0-9 _-]{0,63}$/.test(String(value || "").trim());
}

export function isValidCustomFontUrl(value) {
  return /^(?:https?:\/\/|\/uploads\/fonts\/)[^\s"'<>]+$/i.test(String(value || "").trim());
}

function isValidCustomFontId(value) {
  return /^[A-Za-z0-9_-]{1,100}$/.test(String(value || "").trim());
}

function normalizeCustomFonts(value) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((font) => {
      const id = String(font?.id || "").trim();
      const name = String(font?.name || "").trim();
      const url = String(font?.url || "").trim();
      const format = SITE_FONT_FORMAT_OPTIONS.some((option) => option.value === font?.format)
        ? font.format
        : DEFAULT_SITE_SETTINGS.customFontFormat;
      if (!isValidCustomFontId(id) || !isValidCustomFontName(name) || !isValidCustomFontUrl(url)) return null;
      return {
        id,
        name,
        url,
        format,
        variable: font?.variable === true || String(font?.variable).toLowerCase() === "true",
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}

export function getSiteFontFamily(value, customFontName = "") {
  if (value === CUSTOM_FONT_VALUE && isValidCustomFontName(customFontName)) {
    return `${JSON.stringify(String(customFontName).trim())}, ${SITE_FONT_OPTIONS[0].stack}`;
  }
  return SITE_FONT_OPTIONS.find((option) => option.value === value)?.stack || SITE_FONT_OPTIONS[0].stack;
}

export function getSiteCustomFontFace(siteSettings = {}) {
  if (
    siteSettings.fontFamily !== CUSTOM_FONT_VALUE ||
    !isValidCustomFontName(siteSettings.customFontName) ||
    !isValidCustomFontUrl(siteSettings.customFontUrl)
  ) return "";

  const format = SITE_FONT_FORMAT_OPTIONS.some((option) => option.value === siteSettings.customFontFormat)
    ? siteSettings.customFontFormat
    : SITE_FONT_FORMAT_OPTIONS[0].value;
  const cssFormat = {
    woff2: "woff2",
    woff: "woff",
    ttf: "truetype",
    otf: "opentype",
  }[format];
  const weight = siteSettings.customFontVariable === true ? "100 900" : "400";
  return `@font-face{font-family:${JSON.stringify(String(siteSettings.customFontName).trim())};src:url(${JSON.stringify(String(siteSettings.customFontUrl).trim())}) format(\"${cssFormat}\");font-style:normal;font-weight:${weight};font-display:swap;}`;
}

export function normalizeSiteSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const colors = [
    "primaryColor", "primaryDarkColor", "linkHoverColor", "primaryLightColor", "primarySoftColor",
    "accentColor", "accentDarkColor", "accentLightColor", "accentSoftColor",
    "backgroundColor", "surfaceColor", "surfaceMutedColor", "borderColor",
    "textPrimaryColor", "textSecondaryColor", "successColor", "warningColor", "errorColor",
  ];
  const safeColors = colors.reduce((result, key) => {
    const candidate = String(source[key] || "").trim();
    result[key] = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(candidate) ? candidate : DEFAULT_SITE_SETTINGS[key];
    return result;
  }, {});
  const fontFamily = source.fontFamily === CUSTOM_FONT_VALUE || SITE_FONT_OPTIONS.some((option) => option.value === source.fontFamily)
    ? source.fontFamily
    : DEFAULT_SITE_SETTINGS.fontFamily;
  let customFontName = isValidCustomFontName(source.customFontName) ? String(source.customFontName).trim() : "";
  let customFontUrl = isValidCustomFontUrl(source.customFontUrl) ? String(source.customFontUrl).trim() : "";
  let customFontFormat = SITE_FONT_FORMAT_OPTIONS.some((option) => option.value === source.customFontFormat)
    ? source.customFontFormat
    : DEFAULT_SITE_SETTINGS.customFontFormat;
  let customFontVariable = source.customFontVariable === true
    || String(source.customFontVariable).toLowerCase() === "true";
  let customFonts = normalizeCustomFonts(source.customFonts);
  let customFontId = isValidCustomFontId(source.customFontId) ? String(source.customFontId).trim() : "";
  const legacyCustomFont = isValidCustomFontName(customFontName) && isValidCustomFontUrl(customFontUrl)
    ? { id: "legacy", name: customFontName, url: customFontUrl, format: customFontFormat, variable: customFontVariable }
    : null;
  if (legacyCustomFont && !customFonts.some((font) => font.id === legacyCustomFont.id || (font.name === legacyCustomFont.name && font.url === legacyCustomFont.url))) {
    customFonts = [legacyCustomFont, ...customFonts].slice(0, 50);
  }
  if (!customFontId || !customFonts.some((font) => font.id === customFontId)) {
    customFontId = customFonts[0]?.id || "";
  }
  if (fontFamily === CUSTOM_FONT_VALUE) {
    const activeCustomFont = customFonts.find((font) => font.id === customFontId);
    if (activeCustomFont) {
      customFontId = activeCustomFont.id;
      customFontName = activeCustomFont.name;
      customFontUrl = activeCustomFont.url;
      customFontFormat = activeCustomFont.format;
      customFontVariable = activeCustomFont.variable === true;
    }
  }
  const welcomePopupEnabled = source.welcomePopupEnabled === undefined
    ? DEFAULT_SITE_SETTINGS.welcomePopupEnabled
    : source.welcomePopupEnabled === true || String(source.welcomePopupEnabled).toLowerCase() === "true";
  return { ...DEFAULT_SITE_SETTINGS, ...source, fontFamily, customFontName, customFontUrl, customFontFormat, customFontVariable, customFontId, customFonts, welcomePopupEnabled, ...safeColors };
}

export async function fetchSiteSettings() {
  const response = await fetch("/api/site-settings", { cache: "no-store" });
  if (!response.ok) throw new Error(`Site settings request failed (${response.status})`);
  return normalizeSiteSettings(await response.json());
}
