output "pages_project_name" {
  description = "Cloudflare Pages project name for the direct-upload command."
  value       = cloudflare_pages_project.site.name
}

output "pages_subdomain" {
  description = "Cloudflare Pages default subdomain."
  value       = cloudflare_pages_project.site.subdomain
}

output "custom_domain" {
  description = "Configured custom domain, or null when no domain was requested."
  value       = var.custom_domain == "" ? null : cloudflare_pages_domain.site[0].name
}
