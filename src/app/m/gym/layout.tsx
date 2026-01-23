import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS - Gym',
  description: 'Track your workouts and fitness progress',
  manifest: '/m/gym/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gym',
  },
}

export default function GymLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
