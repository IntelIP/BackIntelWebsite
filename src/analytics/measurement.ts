import type { AnalyticsConfig, AnalyticsProviderName } from "./config.ts";

export const CORE_EVENT_NAMES = [
  "page_view",
  "cta_click",
  "signup_start",
  "signup_complete",
  "activation",
] as const;

export type CoreEventName = (typeof CORE_EVENT_NAMES)[number];
export type ProjectEventName = `project:${string}`;
export type MeasurementEventName = CoreEventName | ProjectEventName;
export type EventProperty = string | number | boolean | null;
export type EventProperties = Readonly<Record<string, EventProperty>>;

export interface EventMetadata {
  project: string;
  environment: string;
  route: string;
}

export interface MeasurementEvent {
  name: MeasurementEventName;
  metadata: EventMetadata;
  properties: EventProperties;
}

export interface MeasurementProvider {
  readonly name: AnalyticsProviderName;
  track(event: MeasurementEvent): void | Promise<void>;
}

export type ConsentState = "granted" | "denied" | "unknown";

export interface PrivacySignals {
  doNotTrack?: boolean;
  consent?: ConsentState;
}

export interface Measurement {
  readonly enabled: boolean;
  readonly provider: AnalyticsProviderName;
  track(name: MeasurementEventName, properties?: EventProperties): void;
  pageView(properties?: EventProperties): void;
  ctaClick(properties?: EventProperties): void;
  signupStart(properties?: EventProperties): void;
  signupComplete(properties?: EventProperties): void;
  activation(properties?: EventProperties): void;
  project(name: string, properties?: EventProperties): void;
}

export const NOOP_PROVIDER: MeasurementProvider = {
  name: "none",
  track() {},
};

function isAllowed(config: AnalyticsConfig, privacy: PrivacySignals) {
  if (config.provider === "none") return false;
  if (config.respectDoNotTrack && privacy.doNotTrack) return false;
  if (privacy.consent === "denied") return false;
  if (config.requireConsent && privacy.consent !== "granted") return false;
  return true;
}

function validProjectEventName(name: string) {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(name);
}

function warnProviderFailure(error: unknown) {
  console.warn("[analytics] Provider failed; event skipped.", error);
}

export function createMeasurement(
  config: AnalyticsConfig,
  provider: MeasurementProvider = NOOP_PROVIDER,
  privacy: PrivacySignals = {},
): Measurement {
  const enabled = isAllowed(config, privacy);

  const track = (
    name: MeasurementEventName,
    properties: EventProperties = {},
  ) => {
    if (!enabled) return;

    const event: MeasurementEvent = {
      name,
      properties: { ...properties },
      metadata: {
        project: config.project,
        environment: config.environment,
        route: config.route,
      },
    };

    try {
      Promise.resolve(provider.track(event)).catch(warnProviderFailure);
    } catch (error) {
      warnProviderFailure(error);
    }
  };

  return {
    enabled,
    provider: config.provider,
    track,
    pageView: (properties) => track("page_view", properties),
    ctaClick: (properties) => track("cta_click", properties),
    signupStart: (properties) => track("signup_start", properties),
    signupComplete: (properties) => track("signup_complete", properties),
    activation: (properties) => track("activation", properties),
    project: (name, properties) => {
      if (!validProjectEventName(name)) {
        console.warn(
          `[analytics] Project event names must be lowercase letters, numbers, dots, dashes, or underscores; received ${JSON.stringify(name)}.`,
        );
        return;
      }
      track(`project:${name}`, properties);
    },
  };
}
