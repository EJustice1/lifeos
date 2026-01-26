import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Strategy Hub | LifeOS',
  description: 'Manage your life goals, projects, and tasks',
}

export default function StrategyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
