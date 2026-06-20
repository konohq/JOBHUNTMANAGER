class CompanySerializer
  def initialize(company, summary: false)
    @company = company
    @summary = summary
  end

  def serializable_hash
    return summary_hash if summary

    summary_hash.merge(
      website_url: company.website_url,
      industry: company.industry,
      location: company.location,
      description: company.description,
      created_at: company.created_at,
      updated_at: company.updated_at
    )
  end

  private

  attr_reader :company, :summary

  def summary_hash
    {
      id: company.id,
      name: company.name
    }
  end
end
