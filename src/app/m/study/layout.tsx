import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS - Study',
  description: 'Track your study sessions and career progress',
  manifest: '/m/study/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Study',
  },
}

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
