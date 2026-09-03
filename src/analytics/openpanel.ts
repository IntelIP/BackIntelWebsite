import type { AnalyticsConfig } from "./config.ts";
import type { MeasurementEvent, MeasurementProvider } from "./measurement.ts";

export type OpenPanelFunction = (...args: unknown[]) => void;

export interface OpenPanelTarget {
  op?: OpenPanelFunction;
}

declare global {
  interface Window {
    op?: OpenPanelFunction;
    __intelipOpenPanelStub__?: OpenPanelFunction;
  }
}

export function createOpenPanelProvider(
  target?: OpenPanelTarget,
): MeasurementProvider {
  return {
    name: "openpanel",
    track(event: MeasurementEvent) {
      const openPanel =
        target?.op ?? (typeof window !== "undefined" ? window.op : undefined);

      if (typeof openPanel !== "function") {
        console.warn(
          "[analytics] OpenPanel is enabled but its browser client is unavailable; event skipped.",
        );
        return;
      }

      openPanel("track", event.name, {
        ...event.properties,
        ...event.metadata,
      });
    },
  };
}

export function buildOpenPanelBootstrap(config: AnalyticsConfig) {
  if (config.provider !== "openpanel" || !config.clientId) return "";

  const openPanelConfig = JSON.stringify({
    ...(config.apiUrl ? { apiUrl: config.apiUrl } : {}),
    clientId: config.clientId,
    trackScreenViews: false,
    trackOutgoingLinks: false,
    trackAttributes: false,
  }).replace(/</g, "\\u003c");

  return `window.op=window.op||function(){var n=[];return new Proxy(function(){arguments.length&&n.push([].slice.call(arguments))},{get:function(t,r){return"q"===r?n:function(){n.push([r].concat([].slice.call(arguments)))}} ,has:function(t,r){return"q"===r}}) }();window.__intelipOpenPanelStub__=window.op;window.op('init',${openPanelConfig});`;
}

export function loadOpenPanel(config: AnalyticsConfig, onReady: () => void) {
  let cancelled = false;
  let cleanup = () => {
    cancelled = true;
  };
  const ready = () => {
    if (!cancelled) onReady();
  };

  if (typeof document === "undefined" || config.provider !== "openpanel" || !config.scriptUrl) {
    ready();
    return cleanup;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-intelip-analytics-provider="openpanel"]',
  );
  if (existingScript) {
    if (
      typeof window.op === "function" &&
      window.op !== window.__intelipOpenPanelStub__
    ) {
      ready();
      return cleanup;
    }
    const handleLoad = () => ready();
    const handleError = () => {
      console.warn("[analytics] OpenPanel script failed to load; events may be skipped.");
      ready();
    };
    existingScript.addEventListener("load", handleLoad, { once: true });
    existingScript.addEventListener(
      "error",
      handleError,
      { once: true },
    );
    cleanup = () => {
      cancelled = true;
      existingScript.removeEventListener("load", handleLoad);
      existingScript.removeEventListener("error", handleError);
    };
    return cleanup;
  }

  const bootstrap = buildOpenPanelBootstrap(config);
  let bootstrapScript: HTMLScriptElement | undefined;
  if (bootstrap) {
    bootstrapScript = document.createElement("script");
    bootstrapScript.dataset.intelipAnalyticsBootstrap = "true";
    bootstrapScript.textContent = bootstrap;
    document.head.append(bootstrapScript);
  }

  const providerScript = document.createElement("script");
  providerScript.async = true;
  providerScript.defer = true;
  providerScript.dataset.intelipAnalyticsProvider = "openpanel";
  providerScript.src = config.scriptUrl;
  const handleLoad = () => ready();
  const handleError = () => {
    console.warn("[analytics] OpenPanel script failed to load; events may be skipped.");
    ready();
  };
  providerScript.addEventListener("load", handleLoad, { once: true });
  providerScript.addEventListener(
    "error",
    handleError,
    { once: true },
  );
  document.head.append(providerScript);
  cleanup = () => {
    cancelled = true;
    providerScript.removeEventListener("load", handleLoad);
    providerScript.removeEventListener("error", handleError);
    providerScript.remove();
    bootstrapScript?.remove();
    if (
      window.__intelipOpenPanelStub__ &&
      window.op === window.__intelipOpenPanelStub__
    ) {
      window.op = undefined;
    }
    window.__intelipOpenPanelStub__ = undefined;
  };
  return cleanup;
}
