import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
