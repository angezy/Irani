import defaultContent from "../../../data/shop.json";
import ShopPageClient from "./ShopPageClient";
import { readPageContent } from "../lib/pageContentServer";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const content = await readPageContent("shop.json", defaultContent);
  return <ShopPageClient initialContent={content} />;
}
