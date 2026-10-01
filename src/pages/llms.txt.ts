import { getCollection } from "astro:content";
import {
  absoluteUrl,
  repositoryUrl,
  siteDescription,
  siteName,
  siteOrigin,
} from "../config/site";

const linkFor = (path: string) =>
  path.startsWith("#") || /^https?:\/\//.test(path)
    ? path
    : siteOrigin
      ? absoluteUrl(path)
      : path;

export async function GET() {
  const products = await getCollection(
    "products",
    ({ id, data }) => data.visibility === "public" && id !== "backintel",
  );
  const lines = [
    `# ${siteName}`,
    `> ${siteDescription}`,
    "",
    "BackIntel is an autonomous agent specializing in data engineering, data science and dataset analysis. It executes approved, repeatable data workflows with traceable evidence and human oversight. Demonstrations support this capability explanation.",
    "",
    "## Projects",
    "",
    "## BackIntel",
    `- URL: ${linkFor("/")}`,
    "- Audience: Data engineers, data scientists, analysts and teams building repeatable data workflows.",
    "- Problem: Data teams repeatedly collect records, interpret reports, prepare features and compare models. Dataset updates require reruns and can leave earlier findings stale.",
    "- Inputs: Operational records, measurements and free-text reports.",
    "- Output: A finding with source evidence, experimental predictions, limitations and human review.",
    "- Capabilities: Check and prepare records, interpret reports, prepare features, compare predictions, refresh affected analysis and prepare human review within an approved workflow.",
    "- Technology: Python and PostgreSQL retain records and versions. Jev converts reports into validated typed observations. CatBoost and TabICLv2 compare predictions against a baseline. LangGraph coordinates approved steps; Aegra owns scheduling. Durable jobs and versioned evidence retain progress and refresh affected findings. React and optional Reflex read shared review data.",
    "- Intended value: Less repeated preparation, fewer stale findings and shorter decision delays; business benefits remain unmeasured.",
    "- Current status: Working local demonstration on synthetic Support and Equipment cases.",
    "- Recorded execution: 54 actual Jev responses; 90 completed background jobs; CatBoost, TabICLv2, and baseline comparison.",
    "- Limits: Customer accuracy, savings, revenue, local compute cost, and net benefit are unproven. Full operating and real-world release acceptance remain pending.",
    "- Demo guide: /demo-guide.txt",
    `- GitHub: ${repositoryUrl} (open source; MIT license).`,
  ];

  for (const { id, data } of products) {
    const productPath = `/projects/${id}/`;
    const url = linkFor(productPath);
    const ctaUrl = data.cta.href.startsWith("#")
      ? `${url}${data.cta.href}`
      : linkFor(data.cta.href);
    lines.push(
      `### ${data.name}`,
      `- URL: [${data.name}](${url})`,
      `- Type: ${data.kind}`,
      `- Status: ${data.status}`,
      `- Summary: ${data.summary}`,
      `- Description: ${data.description}`,
      `- Audience: ${data.audience}`,
      `- Problem: ${data.problem}`,
      `- Solution: ${data.solution}`,
      `- Features: ${data.features.map(({ title }) => title).join(", ")}`,
      `- Proof points: ${data.proofPoints.map(({ label, value }) => `${label}: ${value}`).join("; ")}`,
      `- Primary CTA: [${data.cta.label}](${ctaUrl})`,
      `- Topics: ${data.tags.join(", ")}`,
      "",
    );
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
