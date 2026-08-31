import defaultContent from "../../../data/blog.json";
import BlogSection from "../components/blog";
import { readPageContent } from "../lib/pageContentServer";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const content = await readPageContent("blog.json", defaultContent);
  return <BlogSection initialContent={content} />;
}
