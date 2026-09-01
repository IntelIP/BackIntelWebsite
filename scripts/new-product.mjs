import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [slug] = process.argv.slice(2);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

if (!slug || !slugPattern.test(slug)) {
  console.error("Usage: npm run new:product -- product-slug");
  console.error("Slug must use lowercase letters, numbers, and single hyphens.");
  process.exit(1);
}

const root = process.cwd();
const templatePath = join(root, "templates", "product.md");
const targetPath = join(root, "src", "content", "products", `${slug}.md`);

if (existsSync(targetPath)) {
  console.error(`Product already exists: ${targetPath}`);
  process.exit(1);
}

const template = readFileSync(templatePath, "utf8").replaceAll("PRODUCT_SLUG", slug);
writeFileSync(targetPath, template);
console.log(`Created ${targetPath}`);
console.log("Edit the frontmatter, add the product media, then run npm run package.");
