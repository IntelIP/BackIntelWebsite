import { absoluteUrl, siteOrigin } from "../config/site";

export function GET() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "",
    "User-agent: ExaSearchBot",
    "Allow: /",
  ];

  if (siteOrigin) {
    lines.push("", `Sitemap: ${absoluteUrl("/sitemap.xml")}`);
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
