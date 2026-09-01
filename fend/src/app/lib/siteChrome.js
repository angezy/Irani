import persistedSiteChrome from "../../../data/site-chrome.json";

export const DEFAULT_SITE_CHROME = persistedSiteChrome;

export async function fetchSiteChrome() {
  const response = await fetch("/api/site-chrome", { cache: "no-store" });
  if (!response.ok) throw new Error(`دریافت تنظیمات سربرگ و پابرگ با وضعیت ${response.status} ناموفق بود`);
  return response.json();
}
