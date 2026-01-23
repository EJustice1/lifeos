import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS - Daily Review',
  description: 'Daily context review and reflection',
  manifest: '/m/daily-context-review/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daily Review',
  },
}

export default function DailyReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
