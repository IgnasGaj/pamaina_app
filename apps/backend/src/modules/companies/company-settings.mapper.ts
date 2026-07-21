import { CompanySettings } from "@prisma/client";
import { CompanySettingsResponseDto } from "@/modules/companies/company-settings.dto";

export function toCompanySettingsResponseDto(settings: CompanySettings): CompanySettingsResponseDto {
  return {
    id: settings.id,
    companyId: settings.companyId,
    logoUrl: settings.logoUrl,
    preferredLanguage: settings.preferredLanguage,
    businessType: settings.businessType,
    workWeekType: settings.workWeekType,
    vacationPolicy: settings.vacationPolicy,
    annualVacationDays: settings.annualVacationDays,
    onboardingCompletedAt: settings.onboardingCompletedAt?.toISOString() ?? null,
  };
}
