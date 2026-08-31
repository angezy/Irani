import persistedSiteChrome from "../../../data/site-chrome.json";

export const DEFAULT_SITE_CHROME = persistedSiteChrome;

export async function fetchSiteChrome() {
  const response = await fetch("/api/site-chrome", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
