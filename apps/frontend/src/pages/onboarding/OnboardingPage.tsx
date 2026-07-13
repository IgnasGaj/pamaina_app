import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, ImageIcon } from 'lucide-react'
import { useState, type ChangeEvent, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCompany,
  useCompanySettings,
  useCompleteOnboarding,
  useUpdateCompany,
  useUpdateCompanySettings,
} from '@/hooks/useCompany'
import { getErrorMessage } from '@/lib/errors'
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  VACATION_POLICY_LABELS,
  VACATION_POLICY_OPTIONS,
  WORK_WEEK_TYPE_LABELS,
  WORK_WEEK_TYPE_OPTIONS,
} from '@/lib/company-options'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { BUSINESS_TYPES, VACATION_POLICY_TYPES, WORK_WEEK_TYPES } from '@/types/company.types'
import type { BusinessType, VacationPolicyType, WorkWeekType } from '@/types/company.types'

const WIZARD_STEPS = [
  { title: 'Company information', description: 'Tell us a bit about your company.' },
  { title: 'Business type', description: 'What kind of business are you running?' },
  { title: 'Work schedule', description: 'How is your working week organized?' },
  { title: 'Vacation policy', description: 'How should vacation days be granted?' },
  { title: 'All set', description: 'Review and head to your dashboard.' },
]

function StepProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="mb-8 flex items-center">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.title} className="flex flex-1 items-center last:flex-none">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
              index < currentIndex && 'border-primary bg-primary text-primary-foreground',
              index === currentIndex && 'border-primary text-primary',
              index > currentIndex && 'border-border text-muted-foreground',
            )}
          >
            {index < currentIndex ? <CheckIcon className="size-4" /> : index + 1}
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div className={cn('mx-2 h-px flex-1', index < currentIndex ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

function OptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary/60',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border',
      )}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  )
}

function WizardFooter({
  onBack,
  onContinueLabel = 'Continue',
  isPending,
  hideBack,
}: {
  onBack?: () => void
  onContinueLabel?: string
  isPending: boolean
  hideBack?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {!hideBack && onBack ? (
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : onContinueLabel}
      </Button>
    </div>
  )
}

const companyInfoSchema = z.object({
  country: z.string().min(1, 'Select a country'),
  timezone: z.string().min(1, 'Select a timezone'),
  preferredLanguage: z.string().min(1, 'Select a language'),
})
type CompanyInfoValues = z.infer<typeof companyInfoSchema>

function CompanyInfoStep({
  defaultValues,
  defaultLogoUrl,
  isPending,
  onSubmit,
}: {
  defaultValues: CompanyInfoValues
  defaultLogoUrl: string | null
  isPending: boolean
  onSubmit: (values: CompanyInfoValues, logoUrl: string | undefined) => void
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultLogoUrl)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyInfoValues>({ resolver: zodResolver(companyInfoSchema), defaultValues })

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) {
      toast.error('Logo must be smaller than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => void handleSubmit((values) => onSubmit(values, logoPreview ?? undefined))(e)}
    >
      <div className="space-y-2">
        <Label>Company logo (optional)</Label>
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo preview" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
            Upload logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.timezone && <p className="text-sm text-destructive">{errors.timezone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred language</Label>
        <Controller
          control={control}
          name="preferredLanguage"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.preferredLanguage && (
          <p className="text-sm text-destructive">{errors.preferredLanguage.message}</p>
        )}
      </div>

      <WizardFooter isPending={isPending} hideBack />
    </form>
  )
}

const businessTypeSchema = z.object({ businessType: z.enum(BUSINESS_TYPES) })
type BusinessTypeValues = z.infer<typeof businessTypeSchema>

function BusinessTypeStep({
  defaultValue,
  isPending,
  onBack,
  onSubmit,
}: {
  defaultValue: BusinessType | null
  isPending: boolean
  onBack: () => void
  onSubmit: (values: BusinessTypeValues) => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessTypeValues>({
    resolver: zodResolver(businessTypeSchema),
    defaultValues: { businessType: defaultValue ?? undefined },
  })

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <Controller
        control={control}
        name="businessType"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-3">
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                title={option.label}
                description={option.description}
                selected={field.value === option.value}
                onClick={() => field.onChange(option.value)}
              />
            ))}
          </div>
        )}
      />
      {errors.businessType && <p className="text-sm text-destructive">Please select a business type</p>}
      <WizardFooter isPending={isPending} onBack={onBack} />
    </form>
  )
}

const workWeekSchema = z.object({ workWeekType: z.enum(WORK_WEEK_TYPES) })
type WorkWeekValues = z.infer<typeof workWeekSchema>

function WorkScheduleStep({
  defaultValue,
  isPending,
  onBack,
  onSubmit,
}: {
  defaultValue: WorkWeekType | null
  isPending: boolean
  onBack: () => void
  onSubmit: (values: WorkWeekValues) => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkWeekValues>({
    resolver: zodResolver(workWeekSchema),
    defaultValues: { workWeekType: defaultValue ?? undefined },
  })

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <Controller
        control={control}
        name="workWeekType"
        render={({ field }) => (
          <div className="space-y-3">
            {WORK_WEEK_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                title={option.label}
                description={option.description}
                selected={field.value === option.value}
                onClick={() => field.onChange(option.value)}
              />
            ))}
          </div>
        )}
      />
      {errors.workWeekType && <p className="text-sm text-destructive">Please select a work schedule</p>}
      <WizardFooter isPending={isPending} onBack={onBack} />
    </form>
  )
}

const vacationPolicySchema = z.object({ vacationPolicy: z.enum(VACATION_POLICY_TYPES) })
type VacationPolicyValues = z.infer<typeof vacationPolicySchema>

function VacationPolicyStep({
  defaultValue,
  isPending,
  onBack,
  onSubmit,
}: {
  defaultValue: VacationPolicyType | null
  isPending: boolean
  onBack: () => void
  onSubmit: (values: VacationPolicyValues) => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VacationPolicyValues>({
    resolver: zodResolver(vacationPolicySchema),
    defaultValues: { vacationPolicy: defaultValue ?? undefined },
  })

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <Controller
        control={control}
        name="vacationPolicy"
        render={({ field }) => (
          <div className="space-y-3">
            {VACATION_POLICY_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                title={option.label}
                description={option.description}
                selected={field.value === option.value}
                onClick={() => field.onChange(option.value)}
              />
            ))}
          </div>
        )}
      />
      {errors.vacationPolicy && <p className="text-sm text-destructive">Please select a vacation policy</p>}
      <WizardFooter isPending={isPending} onBack={onBack} />
    </form>
  )
}

function FinishStep({
  companyName,
  businessType,
  workWeekType,
  vacationPolicy,
  isPending,
  onBack,
  onFinish,
}: {
  companyName: string
  businessType: BusinessType | null
  workWeekType: WorkWeekType | null
  vacationPolicy: VacationPolicyType | null
  isPending: boolean
  onBack: () => void
  onFinish: () => void
}) {
  const summary: { label: string; value: string }[] = [
    { label: 'Company', value: companyName },
    { label: 'Business type', value: businessType ? BUSINESS_TYPE_LABELS[businessType] : '—' },
    { label: 'Work schedule', value: workWeekType ? WORK_WEEK_TYPE_LABELS[workWeekType] : '—' },
    { label: 'Vacation policy', value: vacationPolicy ? VACATION_POLICY_LABELS[vacationPolicy] : '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border">
        {summary.map((row, index) => (
          <div
            key={row.label}
            className={cn('flex items-center justify-between px-4 py-3 text-sm', index > 0 && 'border-t border-border')}
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        You're all set. You can change any of this later from Company settings.
      </p>
      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button type="button" onClick={onFinish} disabled={isPending}>
          {isPending ? 'Finishing…' : 'Go to dashboard'}
        </Button>
      </div>
    </div>
  )
}

export function OnboardingPage(): ReactNode {
  const user = useAuthStore((state) => state.user)
  const companyId = user?.companyId ?? undefined
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  const companyQuery = useCompany(companyId)
  const settingsQuery = useCompanySettings(companyId)
  const updateCompany = useUpdateCompany(companyId ?? '')
  const updateSettings = useUpdateCompanySettings(companyId ?? '')
  const completeOnboarding = useCompleteOnboarding(companyId ?? '')

  if (user?.onboardingCompletedAt) {
    return <Navigate to="/" replace />
  }

  const isLoading = !companyQuery.data || !settingsQuery.data

  async function handleCompanyInfoSubmit(values: CompanyInfoValues, logoUrl: string | undefined) {
    try {
      await Promise.all([
        updateCompany.mutateAsync({ country: values.country, timezone: values.timezone }),
        updateSettings.mutateAsync({ preferredLanguage: values.preferredLanguage, logoUrl }),
      ])
      setStepIndex(1)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleBusinessTypeSubmit(values: BusinessTypeValues) {
    try {
      await updateSettings.mutateAsync(values)
      setStepIndex(2)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleWorkScheduleSubmit(values: WorkWeekValues) {
    try {
      await updateSettings.mutateAsync(values)
      setStepIndex(3)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleVacationPolicySubmit(values: VacationPolicyValues) {
    try {
      await updateSettings.mutateAsync(values)
      setStepIndex(4)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleFinish() {
    try {
      await completeOnboarding.mutateAsync()
      void navigate('/', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const currentStep = WIZARD_STEPS[stepIndex]

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <StepProgress currentIndex={stepIndex} />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              {stepIndex === 0 && (
                <CompanyInfoStep
                  defaultValues={{
                    country: companyQuery.data!.country,
                    timezone: companyQuery.data!.timezone,
                    preferredLanguage: settingsQuery.data!.preferredLanguage,
                  }}
                  defaultLogoUrl={settingsQuery.data!.logoUrl}
                  isPending={updateCompany.isPending || updateSettings.isPending}
                  onSubmit={(values, logoUrl) => void handleCompanyInfoSubmit(values, logoUrl)}
                />
              )}
              {stepIndex === 1 && (
                <BusinessTypeStep
                  defaultValue={settingsQuery.data!.businessType}
                  isPending={updateSettings.isPending}
                  onBack={() => setStepIndex(0)}
                  onSubmit={(values) => void handleBusinessTypeSubmit(values)}
                />
              )}
              {stepIndex === 2 && (
                <WorkScheduleStep
                  defaultValue={settingsQuery.data!.workWeekType}
                  isPending={updateSettings.isPending}
                  onBack={() => setStepIndex(1)}
                  onSubmit={(values) => void handleWorkScheduleSubmit(values)}
                />
              )}
              {stepIndex === 3 && (
                <VacationPolicyStep
                  defaultValue={settingsQuery.data!.vacationPolicy}
                  isPending={updateSettings.isPending}
                  onBack={() => setStepIndex(2)}
                  onSubmit={(values) => void handleVacationPolicySubmit(values)}
                />
              )}
              {stepIndex === 4 && (
                <FinishStep
                  companyName={companyQuery.data!.name}
                  businessType={settingsQuery.data!.businessType}
                  workWeekType={settingsQuery.data!.workWeekType}
                  vacationPolicy={settingsQuery.data!.vacationPolicy}
                  isPending={completeOnboarding.isPending}
                  onBack={() => setStepIndex(3)}
                  onFinish={() => void handleFinish()}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
