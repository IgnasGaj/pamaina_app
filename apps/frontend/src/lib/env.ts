import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
})

function loadEnv() {
  const parsed = envSchema.safeParse(import.meta.env)

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
    throw new Error(`Invalid frontend environment configuration:\n${issues}`)
  }

  return parsed.data
}

export const env = loadEnv()

export const API_BASE_URL = `${env.VITE_API_URL}/api/v1`
