import { getCollection } from "astro:content";
import { absoluteUrl, siteOrigin } from "../config/site";

function escapeXml(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}

export async function GET() {
  const products = await getCollection("products", ({ data }) => data.visibility === "public");
  const paths = ["/", ...products.map(({ id }) => `/projects/${id}/`)];
  const sitemapOrigin = siteOrigin || "http://localhost:4321";
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, `${sitemapOrigin}/`).toString())}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
