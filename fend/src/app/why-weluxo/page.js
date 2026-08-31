import WhyWeluxoSection from "../components/WhyWeluxoSection";
import defaultContent from "../../../data/why-weluxo.json";
import { readPageContent } from "../lib/pageContentServer";

export const dynamic = "force-dynamic";

export default async function WhyWeluxoPage() {
  const content = await readPageContent("why-weluxo.json", defaultContent);
  return <WhyWeluxoSection initialContent={content} />;
}
