# Cloudflare Pages launch kit

This directory defines the Cloudflare account-side state for the private portfolio repository:

- a Pages project with Astro's `dist/` output settings;
- an optional custom-domain association;
- no GitHub integration and no automatic deployment trigger.

The repository remains private and local until a human intentionally runs Terraform or the guarded deploy command. Direct upload is handled separately by Wrangler:

```sh
npm run package
CLOUDFLARE_DEPLOY_CONFIRM=DEPLOY npm run deploy:cloudflare
```

The deploy command requires `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, and explicit `CLOUDFLARE_DEPLOY_CONFIRM=DEPLOY`. Authentication may use `CLOUDFLARE_API_TOKEN` from an approved secret store, or `CLOUDFLARE_USE_WRANGLER_AUTH=true` to reuse an authenticated local Wrangler OAuth session. It uses `dist/` and never passes a token as a command-line argument.

## First setup, when approved

1. Copy `terraform.tfvars.example` to `terraform.tfvars` locally, or provide equivalent `TF_VAR_*` values. The real `.tfvars` file is ignored.
2. Export `TF_VAR_cloudflare_api_token` from the approved credential store.
3. Run `terraform init` and `terraform plan` in this directory.
4. Review the plan. Run `terraform apply` only after approving the Cloudflare account-side changes.
5. Set `CLOUDFLARE_PAGES_PROJECT` to the resulting project name and use the guarded direct-upload command.

For local operator deployment, authenticate Wrangler with `wrangler login`, set `CLOUDFLARE_USE_WRANGLER_AUTH=true`, and keep `CLOUDFLARE_API_TOKEN` unset. The CLI cache remains the canonical local credential store.

`cloudflare_pages_domain` associates a hostname with Pages. Apex-domain activation still requires the domain's DNS/nameserver process to be completed in Cloudflare. Domain registration is intentionally outside Terraform and outside this repository's default commands.
