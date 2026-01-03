import Link from 'next/link'

const navItems = [
  { href: '/d/dashboard', label: 'Dashboard' },
  { href: '/d/finance', label: 'Finance' },
  { href: '/d/gym', label: 'Gym' },
  { href: '/d/career', label: 'Career' },
  { href: '/d/digital', label: 'Digital' },
  { href: '/d/analytics', label: 'Analytics' },
]

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="w-64 border-r border-zinc-800 p-6">
        <h1 className="text-xl font-bold mb-8">LifeOS</h1>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
