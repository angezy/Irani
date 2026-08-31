import defaultContent from "../../../data/about.json";
import AboutSection from "../components/aboutSection";
import { readPageContent } from "../lib/pageContentServer";

export const dynamic = "force-dynamic";

export default async function AboutUsPage() {
  const content = await readPageContent("about.json", defaultContent);
  return <AboutSection initialContent={content} />;
}
