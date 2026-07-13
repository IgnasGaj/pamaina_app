import { companySettingsRepository } from "@/modules/companies/company-settings.repository";
import { toCompanySettingsResponseDto } from "@/modules/companies/company-settings.mapper";
import { CompanySettingsResponseDto, UpdateCompanySettingsDto } from "@/modules/companies/company-settings.dto";

/**
 * Every company gets a CompanySettings row created at registration time
 * (see auth.service.ts#registerCompany). This lazily creates one on read
 * as a defensive fallback only — it should never be needed in practice.
 */
export async function getOrCreateCompanySettings(companyId: string): Promise<CompanySettingsResponseDto> {
  const existing = await companySettingsRepository.findByCompanyId(companyId);
  if (existing) {
    return toCompanySettingsResponseDto(existing);
  }
  const created = await companySettingsRepository.create({ companyId });
  return toCompanySettingsResponseDto(created);
}

export async function updateCompanySettings(
  companyId: string,
  dto: UpdateCompanySettingsDto,
): Promise<CompanySettingsResponseDto> {
  await getOrCreateCompanySettings(companyId);
  const updated = await companySettingsRepository.update(companyId, dto);
  return toCompanySettingsResponseDto(updated);
}

export async function completeOnboarding(companyId: string): Promise<CompanySettingsResponseDto> {
  await getOrCreateCompanySettings(companyId);
  const updated = await companySettingsRepository.update(companyId, { onboardingCompletedAt: new Date() });
  return toCompanySettingsResponseDto(updated);
}
