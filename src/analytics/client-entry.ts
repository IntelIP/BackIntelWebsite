import type { AnalyticsConfig } from "./config.ts";
import { readPrivacySignals, startAnalytics } from "./client.ts";
import { loadOpenPanel } from "./openpanel.ts";

const CONSENT_EVENT = "intelip:analytics-consent";

function runAnalytics(config: AnalyticsConfig) {
  let started = false;
  let loading = false;
  let loadGeneration = 0;
  let cancelOpenPanelLoad: (() => void) | undefined;
  let observer: MutationObserver | undefined;

  const allowed = () => {
    const privacy = readPrivacySignals();
    return !(
      (config.respectDoNotTrack && privacy.doNotTrack) ||
      privacy.consent === "denied" ||
      (config.requireConsent && privacy.consent !== "granted")
    );
  };

  const disable = () => {
    loadGeneration += 1;
    cancelOpenPanelLoad?.();
    cancelOpenPanelLoad = undefined;
    loading = false;
    started = false;
    startAnalytics(config);
  };

  const activate = () => {
    if (started || loading) return true;
    if (!allowed()) return false;

    if (config.provider === "openpanel" && config.requireConsent) {
      const generation = ++loadGeneration;
      loading = true;
      cancelOpenPanelLoad = loadOpenPanel(config, () => {
        if (generation !== loadGeneration) return;
        cancelOpenPanelLoad = undefined;
        loading = false;
        if (!allowed()) {
          started = false;
          startAnalytics(config);
          return;
        }
        started = true;
        startAnalytics(config);
      });
    } else {
      started = true;
      startAnalytics(config);
    }

    return true;
  };

  const onPrivacyChange = () => {
    if (!allowed()) {
      if (started || loading || window.intelipAnalytics?.enabled) disable();
      return;
    }
    activate();
  };

  activate();
  window.addEventListener(CONSENT_EVENT, onPrivacyChange);
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(onPrivacyChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-analytics-consent"],
    });
  }

  if (!window.intelipAnalytics) startAnalytics(config);
}

const configElement = document.querySelector(
  'meta[name="intelip-analytics-config"]',
);

if (!configElement) {
  console.warn("[analytics] Analytics config metadata is missing; client skipped.");
} else {
  try {
    runAnalytics(JSON.parse((configElement as HTMLMetaElement).content));
  } catch (error) {
    console.warn("[analytics] Analytics client could not start; skipped.", error);
  }
}
