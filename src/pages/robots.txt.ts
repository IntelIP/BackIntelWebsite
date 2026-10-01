import { absoluteUrl, siteIsPublic } from "../config/site";

export function GET() {
  const directive = siteIsPublic ? "Allow: /" : "Disallow: /";
  const lines = [
    "User-agent: *",
    directive,
    "",
    "User-agent: OAI-SearchBot",
    directive,
    "",
    "User-agent: ChatGPT-User",
    directive,
    "",
    "User-agent: ExaSearchBot",
    directive,
  ];

  if (siteIsPublic) {
    lines.push("", `Sitemap: ${absoluteUrl("/sitemap.xml")}`);
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
