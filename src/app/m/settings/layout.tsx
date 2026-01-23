import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS - Settings',
  description: 'App settings and preferences',
  manifest: '/m/settings/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Settings',
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
