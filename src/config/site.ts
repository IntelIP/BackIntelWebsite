export const siteName = "IntelIP";
export const siteDescription =
  "A shared home for focused products, useful experiments, and the evidence behind how they are built.";

const configuredSiteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "").trim();

if (configuredSiteUrl) {
  const parsedSiteUrl = new URL(configuredSiteUrl);

  if (!["http:", "https:"].includes(parsedSiteUrl.protocol)) {
    throw new Error("PUBLIC_SITE_URL must use http or https.");
  }
}

export const siteOrigin = configuredSiteUrl
  ? new URL(configuredSiteUrl).origin.replace(/\/$/, "")
  : "";

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return siteOrigin ? new URL(normalizedPath, `${siteOrigin}/`).toString() : normalizedPath;
}
