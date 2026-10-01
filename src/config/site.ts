export const siteName = "BackIntel by IntelIP";
export const siteDescription =
  "An autonomous agent for data engineering, data science and dataset analysis. Prepare data, compare models and keep workflow results current with human oversight.";
export const repositoryUrl = "https://github.com/IntelIP/BackIntel";

const siteMode = import.meta.env.PUBLIC_SITE_MODE ?? "preview";
if (!["preview", "public"].includes(siteMode)) {
  throw new Error("PUBLIC_SITE_MODE must be preview or public.");
}
export const siteIsPublic = siteMode === "public";

const configuredSiteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "").trim();

if (configuredSiteUrl) {
  const parsedSiteUrl = new URL(configuredSiteUrl);

  if (!["http:", "https:"].includes(parsedSiteUrl.protocol)) {
    throw new Error("PUBLIC_SITE_URL must use http or https.");
  }
  if (
    parsedSiteUrl.username ||
    parsedSiteUrl.password ||
    parsedSiteUrl.search ||
    parsedSiteUrl.hash ||
    parsedSiteUrl.pathname !== "/"
  ) {
    throw new Error(
      "PUBLIC_SITE_URL must be an origin without credentials, path, query or fragment.",
    );
  }
  if (
    siteIsPublic &&
    (parsedSiteUrl.protocol !== "https:" ||
      /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(parsedSiteUrl.hostname))
  ) {
    throw new Error("Public builds require a non-local HTTPS origin.");
  }
}
if (siteIsPublic && !configuredSiteUrl) {
  throw new Error(
    "Public builds require an explicit PUBLIC_SITE_URL deployment origin.",
  );
}

export const siteOrigin = configuredSiteUrl
  ? new URL(configuredSiteUrl).origin.replace(/\/$/, "")
  : "";

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return siteOrigin
    ? new URL(normalizedPath, `${siteOrigin}/`).toString()
    : normalizedPath;
}
