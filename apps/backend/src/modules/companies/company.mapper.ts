import { Company } from "@prisma/client";
import { CompanyResponseDto } from "@/modules/companies/company.dto";

export function toCompanyResponseDto(company: Company): CompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    email: company.email,
    phone: company.phone,
    address: company.address,
    city: company.city,
    country: company.country,
    timezone: company.timezone,
    legalCode: company.legalCode,
    vatCode: company.vatCode,
    isActive: company.isActive,
    createdAt: company.createdAt.toISOString(),
  };
}
