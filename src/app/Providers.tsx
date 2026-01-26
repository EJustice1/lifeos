'use client'

import { TaskProvider } from '@/contexts/TaskContext'
import { ToastProvider } from '@/components/mobile/feedback/ToastProvider'
import { SessionProvider } from '@/context/SessionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <TaskProvider>
          {children}
        </TaskProvider>
      </SessionProvider>
    </ToastProvider>
  )
}
