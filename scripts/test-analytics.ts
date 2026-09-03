import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  AnalyticsConfigError,
  readAnalyticsConfig,
} from "../src/analytics/config.ts";
import { getBrowserAnalyticsRuntime } from "../src/analytics/browser.ts";
import { loadOpenPanel } from "../src/analytics/openpanel.ts";
import { createAnalyticsProvider } from "../src/analytics/providers.ts";
import {
  createMeasurement,
  type MeasurementEvent,
} from "../src/analytics/measurement.ts";

const context = {
  project: "Tabellio",
  environment: "test",
  route: "/projects/tabellio/",
};

function expectConfigError(action: () => unknown, text: string) {
  assert.throws(action, (error: unknown) => {
    if (!(error instanceof AnalyticsConfigError)) return false;
    assert.match(error.message, new RegExp(text));
    return true;
  });
}

const disabled = readAnalyticsConfig({}, context);
assert.equal(disabled.provider, "none");
assert.equal(disabled.requireConsent, false);
assert.equal(disabled.respectDoNotTrack, true);
assert.equal(createAnalyticsProvider(disabled).name, "none");

expectConfigError(
  () => readAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: "other" }, context),
  "PUBLIC_ANALYTICS_PROVIDER",
);
expectConfigError(
  () => readAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: "openpanel" }, context),
  "PUBLIC_OPENPANEL_CLIENT_ID",
);
expectConfigError(
  () =>
    readAnalyticsConfig(
      {
        PUBLIC_ANALYTICS_PROVIDER: "openpanel",
        PUBLIC_OPENPANEL_CLIENT_ID: "client",
        PUBLIC_OPENPANEL_API_URL: "not-a-url",
      },
      context,
    ),
  "PUBLIC_OPENPANEL_API_URL",
);

const disabledEvents: MeasurementEvent[] = [];
const disabledMeasurement = createMeasurement(disabled, {
  name: "openpanel",
  track: (event) => {
    disabledEvents.push(event);
  },
});
disabledMeasurement.pageView();
disabledMeasurement.ctaClick({ placement: "hero" });
disabledMeasurement.signupStart();
disabledMeasurement.signupComplete();
disabledMeasurement.activation();
disabledMeasurement.project("demo_started");
assert.equal(disabledMeasurement.enabled, false);
assert.deepEqual(disabledEvents, []);

const enabled = readAnalyticsConfig(
  {
    PUBLIC_ANALYTICS_PROVIDER: "openpanel",
    PUBLIC_OPENPANEL_CLIENT_ID: "test-client",
    PUBLIC_ANALYTICS_REQUIRE_CONSENT: "true",
  },
  context,
);
const consentRuntime = getBrowserAnalyticsRuntime(enabled);
assert.equal(consentRuntime.enabled, true);
assert.equal(consentRuntime.scriptUrl, undefined);
assert.equal(consentRuntime.bootstrap, undefined);

const immediateRuntime = getBrowserAnalyticsRuntime({
  ...enabled,
  requireConsent: false,
});
assert.equal(immediateRuntime.scriptUrl, enabled.scriptUrl);
assert.ok(immediateRuntime.bootstrap);

const events: MeasurementEvent[] = [];
const enabledMeasurement = createMeasurement(
  enabled,
  {
    name: "openpanel",
    track: (event) => {
      events.push(event);
    },
  },
  { consent: "granted", doNotTrack: false },
);
enabledMeasurement.pageView();
enabledMeasurement.ctaClick({ placement: "hero" });
enabledMeasurement.signupStart();
enabledMeasurement.signupComplete();
enabledMeasurement.activation();
enabledMeasurement.project("demo_started", { surface: "mockup" });
assert.equal(enabledMeasurement.enabled, true);
assert.deepEqual(
  events.map((event) => event.name),
  [
    "page_view",
    "cta_click",
    "signup_start",
    "signup_complete",
    "activation",
    "project:demo_started",
  ],
);
assert.deepEqual(events[0].metadata, context);
assert.equal(events.at(-1)?.properties.surface, "mockup");

const noConsentMeasurement = createMeasurement(
  enabled,
  {
    name: "openpanel",
    track: () => {
      events.push({
        name: "page_view",
        metadata: context,
        properties: {},
      });
    },
  },
  { consent: "unknown", doNotTrack: false },
);
noConsentMeasurement.pageView();
assert.equal(noConsentMeasurement.enabled, false);

const dntMeasurement = createMeasurement(
  readAnalyticsConfig(
    {
      PUBLIC_ANALYTICS_PROVIDER: "openpanel",
      PUBLIC_OPENPANEL_CLIENT_ID: "test-client",
    },
    context,
  ),
  {
    name: "openpanel",
    track: () => {
      events.push({
        name: "page_view",
        metadata: context,
        properties: {},
      });
    },
  },
  { consent: "granted", doNotTrack: true },
);
dntMeasurement.pageView();
assert.equal(dntMeasurement.enabled, false);

const providerWarnings: unknown[][] = [];
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  providerWarnings.push(args);
};
try {
  const failingMeasurement = createMeasurement(
    enabled,
    {
      name: "openpanel",
      track: () => {
        throw new Error("simulated provider outage");
      },
    },
    { consent: "granted", doNotTrack: false },
  );
  failingMeasurement.pageView();
} finally {
  console.warn = originalWarn;
}
assert.equal(providerWarnings.length, 1);

const opCalls: unknown[][] = [];
const openPanelProvider = createAnalyticsProvider(enabled, {
  op: (...args) => opCalls.push(args),
});
openPanelProvider.track(events[0]);
assert.deepEqual(opCalls[0]?.slice(0, 2), ["track", "page_view"]);
assert.equal(
  (opCalls[0]?.[2] as Record<string, unknown>).project,
  context.project,
);

const runtimeGlobals = globalThis as Record<string, any>;
const previousWindow = runtimeGlobals.window;
const previousDocument = runtimeGlobals.document;
const appendedScripts: any[] = [];
const fakeWindow: Record<string, any> = {};
const fakeDocument = {
  head: {
    append(script: any) {
      appendedScripts.push(script);
      if (script.dataset.intelipAnalyticsBootstrap) {
        Function("window", script.textContent)(fakeWindow);
      }
    },
  },
  createElement() {
    const listeners = new Map<string, () => void>();
    return {
      async: false,
      defer: false,
      dataset: {} as Record<string, string>,
      textContent: "",
      addEventListener(name: string, callback: () => void) {
        listeners.set(name, callback);
      },
      removeEventListener(name: string, callback: () => void) {
        if (listeners.get(name) === callback) listeners.delete(name);
      },
      dispatch(name: string) {
        listeners.get(name)?.();
      },
      remove() {
        this.removed = true;
      },
      removed: false,
    };
  },
  querySelector(selector: string) {
    if (selector.includes("analytics-provider")) {
      return appendedScripts.find(
        (script) => script.dataset.intelipAnalyticsProvider && !script.removed,
      );
    }
    return undefined;
  },
};
runtimeGlobals.window = fakeWindow;
runtimeGlobals.document = fakeDocument;
try {
  let readyCalls = 0;
  const cancel = loadOpenPanel(enabled, () => readyCalls++);
  assert.equal(appendedScripts.length, 2);
  fakeWindow.op("track", "page_view", { shouldNotSend: true });
  cancel();
  appendedScripts[1].dispatch("load");
  assert.equal(readyCalls, 0);
  assert.equal(fakeWindow.op, undefined);
  assert.equal(appendedScripts[1].removed, true);

  const retry = loadOpenPanel(enabled, () => readyCalls++);
  assert.equal(appendedScripts.filter((script) => !script.removed).length, 2);
  appendedScripts.at(-1).dispatch("error");
  assert.equal(readyCalls, 1);
  retry();
} finally {
  if (previousWindow === undefined) delete runtimeGlobals.window;
  else runtimeGlobals.window = previousWindow;
  if (previousDocument === undefined) delete runtimeGlobals.document;
  else runtimeGlobals.document = previousDocument;
}

await mkdir("artifacts/validation", { recursive: true });
await writeFile(
  "artifacts/validation/analytics.json",
  `${JSON.stringify(
    {
      schemaVersion: "tabellio-validator-evidence/v0.1",
      validatorId: "analytics-provider-tests",
      status: "passed",
      summary: "Analytics provider selection, privacy gating, and event contracts passed.",
      metrics: [
        { name: "events_tested", value: 6, unit: "events" },
        { name: "disabled_provider_calls", value: disabledEvents.length, unit: "calls" },
      ],
      cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
      artifacts: [],
    },
    null,
    2,
  )}\n`,
);
console.log("Analytics provider tests passed.");
