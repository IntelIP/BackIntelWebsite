import { getCollection } from "astro:content";
import { absoluteUrl, siteDescription, siteName, siteOrigin } from "../config/site";

const linkFor = (path: string) => (siteOrigin ? absoluteUrl(path) : path);

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
    const url = linkFor(`/projects/${id}/`);
    lines.push(
      `### ${data.name}`,
      `- URL: [${data.name}](${url})`,
      `- Type: ${data.kind}`,
      `- Status: ${data.status}`,
      `- Summary: ${data.summary}`,
      `- Product context: ${data.hero.lead}`,
      `- Topics: ${data.tags.join(", ")}`,
      "",
    );
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
