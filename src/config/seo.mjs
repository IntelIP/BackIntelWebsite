export function buildSiteJsonLd({ name, description, url }) {
  const organizationId = `${url}#organization`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name,
      url,
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}#website`,
      name,
      url,
      description,
      publisher: { "@id": organizationId },
    },
  ];
}

export function buildProductJsonLd({
  siteName,
  siteUrl,
  productUrl,
  product,
  title,
  description,
  applicationCategory = product.kind,
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${productUrl}#webpage`,
      url: productUrl,
      name: title,
      description,
      isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
      about: { "@type": "Thing", name: product.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${productUrl}#software`,
      name: product.name,
      description,
      url: productUrl,
      applicationCategory,
      audience: { "@type": "Audience", audienceType: product.audience },
      featureList: product.features.map(
        ({ title: featureTitle }) => featureTitle,
      ),
    },
    ...(siteUrl === productUrl
      ? []
      : [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: siteName,
                item: siteUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: product.name,
                item: productUrl,
              },
            ],
          },
        ]),
  ];
}
