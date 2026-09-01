variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the Pages project."
  type        = string
}

variable "cloudflare_api_token" {
  description = "Sensitive Cloudflare API token with the permissions required by this plan."
  type        = string
  sensitive   = true
}

variable "pages_project_name" {
  description = "Cloudflare Pages project name used by the direct-upload command."
  type        = string
  default     = "intelip-portfolio"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,62}$", var.pages_project_name))
    error_message = "pages_project_name must use lowercase letters, numbers, and hyphens."
  }
}

variable "production_branch" {
  description = "Branch label Cloudflare should treat as production metadata."
  type        = string
  default     = "main"
}

variable "custom_domain" {
  description = "Optional hostname to associate with the Pages project; leave empty to skip it."
  type        = string
  default     = ""
}
