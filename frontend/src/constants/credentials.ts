import type { CredentialCategory } from "@/client"

export const CREDENTIAL_CATEGORY_LABELS: Record<CredentialCategory, string> = {
  "github-copilot": "GitHub Copilot",
  cursor: "Cursor",
  "cluade-code": "Cluade Code",
}

export const CREDENTIAL_CATEGORY_OPTIONS = Object.entries(
  CREDENTIAL_CATEGORY_LABELS,
).map(([value, label]) => ({
  value: value as CredentialCategory,
  label,
}))

export const getCredentialCategoryLabel = (category?: CredentialCategory) => {
  if (!category) return "Unknown"
  return CREDENTIAL_CATEGORY_LABELS[category] ?? category
}

export const maskCredentialPat = (pat?: string) => {
  if (!pat) return "N/A"
  if (pat.length <= 4) {
    return "*".repeat(pat.length)
  }
  const visible = pat.slice(-4)
  return `${"*".repeat(pat.length - 4)}${visible}`
}
