import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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
      lead: z.string().min(1),
    }),
    meta: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
    capabilities: z
      .array(z.object({ number: z.string(), title: z.string(), copy: z.string() }))
      .length(3),
    flow: z.array(z.object({ number: z.string(), label: z.string(), copy: z.string() })).length(3),
    quote: z.string().min(1),
  }),
});

export const collections = { products: product };
