export type CompanySummary = {
  id: number
  name: string
}

export type Company = CompanySummary & {
  website_url: string | null
  industry: string | null
  location: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type CompanyInput = {
  name: string
  website_url: string
  industry: string
  location: string
  description: string
}
