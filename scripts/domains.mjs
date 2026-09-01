const command = process.argv[2];

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!accountId || !apiToken) {
  fail(
    "Domain lookup blocked: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the ignored .env file or environment.",
  );
}

async function cloudflareRequest(path, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    const errors = (payload.errors ?? []).map((item) => item.message).join("; ");
    fail(`Cloudflare domain lookup failed (${response.status}): ${errors || "unknown API error"}`);
  }

  return payload.result ?? {};
}

async function search() {
  const query = process.argv.slice(3).join(" ").trim();
  if (!query) fail("Usage: npm run domain:search -- keyword or partial-domain");

  const params = new URLSearchParams({ q: query, limit: "20" });
  const result = await cloudflareRequest(`/registrar/domain-search?${params}`);
  const domains = result.domains ?? [];

  console.log(`Search results for: ${query}`);
  for (const domain of domains) {
    const pricing = domain.pricing ?? {};
    const price = pricing.registration_cost ? `USD ${pricing.registration_cost}/yr` : "price unavailable";
    console.log(`${domain.name ?? "unknown"}\t${domain.registrable ? "candidate" : "unavailable"}\t${price}`);
  }
}

async function check() {
  const domains = process.argv.slice(3).map((item) => item.trim()).filter(Boolean);
  if (domains.length === 0 || domains.length > 20) {
    fail("Usage: npm run domain:check -- example.com example.dev (1–20 domains)");
  }

  const result = await cloudflareRequest("/registrar/domain-check", {
    method: "POST",
    body: JSON.stringify({ domains }),
  });

  console.log(JSON.stringify({ operation: "read-only-domain-check", domains: result.domains ?? [] }, null, 2));
}

if (command === "search") {
  await search();
} else if (command === "check") {
  await check();
} else {
  fail("Usage: npm run domain:search -- keyword | npm run domain:check -- example.com");
}
