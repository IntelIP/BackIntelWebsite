import { getCollection } from "astro:content";
import { absoluteUrl, siteDescription, siteName, siteOrigin } from "../config/site";

const linkFor = (path: string) =>
  path.startsWith("#") || /^https?:\/\//.test(path) ? path : siteOrigin ? absoluteUrl(path) : path;

export async function GET() {
  const products = await getCollection("products", ({ data }) => data.visibility === "public");
  const lines = [
    `# ${siteName}`,
    `> ${siteDescription}`,
    "",
    "This is a compact public index. Use the linked product pages for the full, visible context.",
    "",
    "## Projects",
  ];

  for (const { id, data } of products) {
    const productPath = `/projects/${id}/`;
    const url = linkFor(productPath);
    const ctaUrl = data.cta.href.startsWith("#") ? `${url}${data.cta.href}` : linkFor(data.cta.href);
    lines.push(
      `### ${data.name}`,
      `- URL: [${data.name}](${url})`,
      `- Type: ${data.kind}`,
      `- Status: ${data.status}`,
      `- Summary: ${data.summary}`,
      `- Description: ${data.description}`,
      `- Audience: ${data.audience}`,
      `- Problem: ${data.problem}`,
      `- Solution: ${data.solution}`,
      `- Features: ${data.features.map(({ title }) => title).join(", ")}`,
      `- Proof points: ${data.proofPoints.map(({ label, value }) => `${label}: ${value}`).join("; ")}`,
      `- Primary CTA: [${data.cta.label}](${ctaUrl})`,
      `- Topics: ${data.tags.join(", ")}`,
      "",
    );
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
