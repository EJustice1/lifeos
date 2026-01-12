'use client'

import { SessionProvider as BaseSessionProvider } from '@/context/SessionContext'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseSessionProvider>
      {children}
    </BaseSessionProvider>
  )
}