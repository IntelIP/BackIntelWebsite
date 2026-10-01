import { getCollection } from "astro:content";
import { absoluteUrl, siteIsPublic } from "../config/site";

function escapeXml(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export async function GET() {
  const products = await getCollection(
    "products",
    ({ id, data }) => data.visibility === "public" && id !== "backintel",
  );
  const paths = siteIsPublic
    ? ["/", ...products.map(({ id }) => `/projects/${id}/`)]
    : [];
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
