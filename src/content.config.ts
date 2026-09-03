import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const hasTwoSentences = (value: string) => value.trim().split(/[.!?]+(?=\s|$)/).filter(Boolean).length >= 2;

const product = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/products" }),
  schema: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    kind: z.string().min(1),
    status: z.string().min(1),
    mark: z.string().min(1),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    summary: z.string().min(1),
    description: z.string().min(1).refine(hasTwoSentences, "description must contain at least two sentences"),
    audience: z.string().min(1),
    problem: z.string().min(1),
    solution: z.string().min(1),
    seoTitle: z.string().min(1).optional(),
    seoDescription: z.string().min(1).optional(),
    tags: z.array(z.string()).min(1),
    preview: z.enum(["workspace", "signals", "ledger"]),
    previewPath: z.string().min(1),
    previewTitle: z.string().min(1),
    previewBadge: z.string().min(1),
    previewBars: z.array(z.number().min(0).max(100)).length(6),
    previewRows: z.array(z.object({ label: z.string(), value: z.string() })).length(2),
    image: z.string().min(1),
    imageAlt: z.string().min(1),
    mediaType: z.string().min(1),
    mediaCaption: z.string().min(1),
    demoDuration: z.string().min(1),
    demoStatus: z.string().min(1),
    visibility: z.enum(["public", "private", "internal"]).default("public"),
    featured: z.boolean().default(false),
    hero: z.object({
      kicker: z.string().min(1),
      title: z.string().min(1),
      titleAccent: z.string().min(1),
    }),
    meta: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
    features: z
      .array(z.object({ number: z.string(), title: z.string(), copy: z.string() }))
      .min(3)
      .max(6),
    flow: z.array(z.object({ number: z.string(), label: z.string(), copy: z.string() })).length(3),
    proofPoints: z
      .array(z.object({ label: z.string(), value: z.string(), copy: z.string() }))
      .min(2)
      .max(4),
    quote: z.string().min(1),
    cta: z.object({
      title: z.string().min(1),
      titleAccent: z.string().min(1),
      label: z.string().min(1),
      href: z.string().regex(/^(#|\/|https?:\/\/)/, "cta.href must be a crawlable relative or absolute URL"),
    }),
    liveMockup: z
      .object({
        appName: z.string().min(1),
        title: z.string().min(1),
        eyebrow: z.string().min(1),
        description: z.string().min(1),
        records: z
          .array(
            z.object({
              id: z.string().min(1),
              title: z.string().min(1),
              type: z.string().min(1),
              owner: z.string().min(1),
              status: z.enum(["queued", "active", "closed"]),
              updated: z.string().min(1),
            }),
          )
          .min(1),
      })
      .optional(),
  }),
});

export const collections = { products: product };
