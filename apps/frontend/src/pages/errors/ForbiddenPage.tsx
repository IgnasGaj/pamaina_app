import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-sm font-medium text-destructive">403</p>
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        You don't have permission to view this page. Contact your company owner if you think this is a mistake.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  )
}
