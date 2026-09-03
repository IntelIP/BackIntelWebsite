export const ANALYTICS_PROVIDERS = ["none", "openpanel"] as const;

export type AnalyticsProviderName = (typeof ANALYTICS_PROVIDERS)[number];

export interface AnalyticsContext {
  project: string;
  environment: string;
  route: string;
}

export interface AnalyticsConfig extends AnalyticsContext {
  provider: AnalyticsProviderName;
  requireConsent: boolean;
  respectDoNotTrack: boolean;
  clientId?: string;
  apiUrl?: string;
  scriptUrl?: string;
}

export class AnalyticsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsConfigError";
  }
}

function readString(env: Record<string, unknown>, key: string) {
  const value = env[key];
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(
  env: Record<string, unknown>,
  key: string,
  fallback: boolean,
) {
  const value = readString(env, key).toLowerCase();

  if (!value) return fallback;
  if (["true", "1", "yes"].includes(value)) return true;
  if (["false", "0", "no"].includes(value)) return false;

  throw new AnalyticsConfigError(
    `${key} must be true or false when configured; received ${JSON.stringify(value)}.`,
  );
}

function validateUrl(key: string, value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new AnalyticsConfigError(
      `${key} must be an absolute HTTP(S) URL when configured; received ${JSON.stringify(value)}.`,
    );
  }
}

export function readAnalyticsConfig(
  env: Record<string, unknown>,
  context: AnalyticsContext,
): AnalyticsConfig {
  const configuredProvider =
    readString(env, "PUBLIC_ANALYTICS_PROVIDER") || "none";
  const project = context.project.trim() || "site";
  const environment =
    readString(env, "PUBLIC_ANALYTICS_ENVIRONMENT") ||
    context.environment.trim() ||
    "production";
  const route = context.route.trim() || "/";
  const requireConsent = readBoolean(
    env,
    "PUBLIC_ANALYTICS_REQUIRE_CONSENT",
    false,
  );
  const respectDoNotTrack = readBoolean(
    env,
    "PUBLIC_ANALYTICS_RESPECT_DNT",
    true,
  );

  if (!ANALYTICS_PROVIDERS.includes(configuredProvider as AnalyticsProviderName)) {
    throw new AnalyticsConfigError(
      `PUBLIC_ANALYTICS_PROVIDER must be one of ${ANALYTICS_PROVIDERS.join(", ")}; received ${JSON.stringify(configuredProvider)}.`,
    );
  }

  const provider = configuredProvider as AnalyticsProviderName;

  if (provider === "none") {
    return {
      provider,
      project,
      environment,
      route,
      requireConsent,
      respectDoNotTrack,
    };
  }

  const clientId = readString(env, "PUBLIC_OPENPANEL_CLIENT_ID");
  if (!clientId) {
    throw new AnalyticsConfigError(
      "OpenPanel is enabled, but PUBLIC_OPENPANEL_CLIENT_ID is missing.",
    );
  }

  if (readString(env, "PUBLIC_OPENPANEL_CLIENT_SECRET")) {
    throw new AnalyticsConfigError(
      "Do not expose an OpenPanel server secret in PUBLIC_OPENPANEL_CLIENT_SECRET; browser analytics only needs the public client ID.",
    );
  }

  const apiUrl = readString(env, "PUBLIC_OPENPANEL_API_URL");
  const scriptUrl =
    readString(env, "PUBLIC_OPENPANEL_SCRIPT_URL") ||
    "https://openpanel.dev/op1.js";

  if (apiUrl) validateUrl("PUBLIC_OPENPANEL_API_URL", apiUrl);
  validateUrl("PUBLIC_OPENPANEL_SCRIPT_URL", scriptUrl);

  return {
    provider,
    project,
    environment,
    route,
    requireConsent,
    respectDoNotTrack,
    clientId,
    ...(apiUrl ? { apiUrl } : {}),
    scriptUrl,
  };
}
