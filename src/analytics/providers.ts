import type { AnalyticsConfig } from "./config.ts";
import { NOOP_PROVIDER, type MeasurementProvider } from "./measurement.ts";
import { createOpenPanelProvider, type OpenPanelTarget } from "./openpanel.ts";

export function createAnalyticsProvider(
  config: AnalyticsConfig,
  target?: OpenPanelTarget,
): MeasurementProvider {
  if (config.provider === "none") return NOOP_PROVIDER;
  return createOpenPanelProvider(target);
}
