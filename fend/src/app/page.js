import Section from "./components/section";
import BlogSection from "./components/blog";
import defaultHomeContent from "../../data/home.json";
import defaultBlogContent from "../../data/blog.json";
import { readPageContent } from "./lib/pageContentServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [homeContent, blogContent] = await Promise.all([
    readPageContent("home.json", defaultHomeContent),
    readPageContent("blog.json", defaultBlogContent),
  ]);

  return (
    <>
      <Section initialContent={homeContent} />
      <BlogSection initialContent={blogContent} />
    </>
  );
}
