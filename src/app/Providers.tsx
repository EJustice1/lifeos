'use client'

import { TaskProvider } from '@/contexts/TaskContext'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { GoalProvider } from '@/contexts/GoalContext'
import { ToastProvider } from '@/components/mobile/feedback/ToastProvider'
import { SessionProvider } from '@/context/SessionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <GoalProvider>
          <ProjectProvider>
            <TaskProvider>
              {children}
            </TaskProvider>
          </ProjectProvider>
        </GoalProvider>
      </SessionProvider>
    </ToastProvider>
  )
}
