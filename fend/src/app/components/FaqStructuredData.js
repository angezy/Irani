import { getSiteSettingsServer, siteUrlFor } from "../lib/siteSettingsServer";

export default async function FaqStructuredData({ content }) {
  const site = await getSiteSettingsServer();
  const siteUrl = siteUrlFor(site);
  const items = Array.isArray(content?.faq?.items) ? content.faq.items : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: site.siteName,
        url: siteUrl,
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/faq#webpage`,
        url: `${siteUrl}/faq`,
        name: content?.seo?.title || content?.hero?.title || `پرسش‌های متداول ${site.siteName}`,
        description: content?.seo?.description || content?.hero?.intro || `پرسش‌های متداول و پاسخ‌های ${site.siteName}.`,
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: site.siteName,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "پرسش‌های متداول", item: `${siteUrl}/faq` },
        ],
      },
      ...(items.length
        ? [{
            "@type": "FAQPage",
            "@id": `${siteUrl}/faq#questions`,
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }]
        : []),
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
