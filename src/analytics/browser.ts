import type { AnalyticsConfig } from "./config.ts";
import { buildOpenPanelBootstrap } from "./openpanel.ts";

export interface BrowserAnalyticsRuntime {
  enabled: boolean;
  scriptUrl?: string;
  bootstrap?: string;
}

export function getBrowserAnalyticsRuntime(
  config: AnalyticsConfig,
): BrowserAnalyticsRuntime {
  if (config.provider === "none") return { enabled: false };

  if (config.provider === "openpanel") {
    if (config.requireConsent) return { enabled: true };

    return {
      enabled: true,
      scriptUrl: config.scriptUrl,
      bootstrap: buildOpenPanelBootstrap(config),
    };
  }

  return { enabled: false };
}
