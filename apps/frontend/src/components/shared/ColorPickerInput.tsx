import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'

export function ColorPickerInput({
  id,
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#2563EB'}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
        aria-label={t('common.pickColor')}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        placeholder="#2563EB"
        className="w-28 font-mono uppercase"
      />
    </div>
  )
}
