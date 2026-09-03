import type { AnalyticsConfig } from "./config.ts";
import {
  createMeasurement,
  type ConsentState,
  type EventProperties,
  type Measurement,
  type PrivacySignals,
} from "./measurement.ts";
import { createAnalyticsProvider } from "./providers.ts";

declare global {
  interface Navigator {
    globalPrivacyControl?: boolean;
  }

  interface Window {
    __INTELIP_ANALYTICS_CONSENT__?: ConsentState | boolean;
    doNotTrack?: string;
    intelipAnalytics?: Measurement;
  }
}

function readConsentState(): ConsentState {
  const explicit = window.__INTELIP_ANALYTICS_CONSENT__;
  const dataset = document.documentElement.dataset.analyticsConsent;

  if (explicit === false || explicit === "denied" || dataset === "denied") {
    return "denied";
  }
  if (explicit === true || explicit === "granted" || dataset === "granted") {
    return "granted";
  }
  return "unknown";
}

export function readPrivacySignals(): PrivacySignals {
  const doNotTrack =
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.globalPrivacyControl === true;

  return {
    doNotTrack,
    consent: readConsentState(),
  };
}

function clickedCta(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest(
    "a.product-button--solid, a.button--solid, [data-analytics-cta]",
  );
}

let ctaListener: ((event: Event) => void) | undefined;

function ensureCtaListener() {
  if (ctaListener) return;

  ctaListener = (event) => {
    const measurement = window.intelipAnalytics;
    if (!measurement?.enabled) return;

    const cta = clickedCta(event.target);
    if (!cta) return;

    const properties: EventProperties = {
      label: cta.textContent?.trim() || null,
      href: cta.getAttribute("href"),
    };
    measurement.ctaClick(properties);
  };
  document.addEventListener("click", ctaListener, { passive: true });
}

export function startAnalytics(config: AnalyticsConfig): Measurement {
  const measurement = createMeasurement(
    config,
    createAnalyticsProvider(config),
    readPrivacySignals(),
  );

  window.intelipAnalytics = measurement;
  if (!measurement.enabled) return measurement;

  measurement.pageView();
  ensureCtaListener();

  return measurement;
}
