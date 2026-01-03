import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold">LifeOS</h1>
        <p className="text-xl text-zinc-400">
          Your personal data warehouse for financial, physical, professional, and digital health.
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-zinc-500">Sign in to start tracking your life.</p>
            <Link
              href="/auth/login"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 rounded-lg px-8 py-3 font-semibold transition-colors"
            >
              Sign In / Sign Up
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">Signed in as {user.email}</p>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              {/* Mobile / Data Entry */}
              <div className="bg-zinc-900 rounded-2xl p-8 text-left">
                <h2 className="text-2xl font-semibold mb-2">Mobile</h2>
                <p className="text-zinc-400 text-sm mb-6">Quick data entry on the go</p>
                <div className="space-y-2">
                  <Link
                    href="/m/gym"
                    className="block w-full bg-orange-600 hover:bg-orange-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Gym Logger
                  </Link>
                  <Link
                    href="/m/finance"
                    className="block w-full bg-emerald-600 hover:bg-emerald-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Quick Entry
                  </Link>
                  <Link
                    href="/m/study"
                    className="block w-full bg-blue-600 hover:bg-blue-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Study Session
                  </Link>
                  <Link
                    href="/m/daily-review"
                    className="block w-full bg-purple-600 hover:bg-purple-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Daily Review
                  </Link>
                </div>
              </div>

              {/* Desktop / Analytics */}
              <div className="bg-zinc-900 rounded-2xl p-8 text-left">
                <h2 className="text-2xl font-semibold mb-2">Desktop</h2>
                <p className="text-zinc-400 text-sm mb-6">Mission Control analytics</p>
                <div className="space-y-2">
                  <Link
                    href="/d/dashboard"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/d/finance"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Finance
                  </Link>
                  <Link
                    href="/d/gym"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Gym
                  </Link>
                  <Link
                    href="/d/career"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Career
                  </Link>
                  <Link
                    href="/d/digital"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Digital
                  </Link>
                  <Link
                    href="/d/analytics"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 rounded-lg p-3 text-center transition-colors"
                  >
                    Analytics
                  </Link>
                </div>
              </div>
            </div>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
