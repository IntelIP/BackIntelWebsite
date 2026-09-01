resource "cloudflare_pages_project" "site" {
  account_id        = var.cloudflare_account_id
  name              = var.pages_project_name
  production_branch = var.production_branch

  build_config = {
    build_caching   = true
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "/"
  }
}

resource "cloudflare_pages_domain" "site" {
  count = var.custom_domain == "" ? 0 : 1

  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.site.name
  name         = var.custom_domain
}
