import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md mx-auto text-center space-y-8">
        <h1 className="text-5xl font-bold">LifeOS</h1>
        <p className="text-xl text-zinc-400">
          Your mobile-first personal data platform for tracking everything that matters.
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

            <div className="space-y-4 mt-12">
              {/* Mobile Quick Entry */}
              <div className="bg-zinc-900 rounded-2xl p-8 text-left">
                <h2 className="text-2xl font-semibold mb-2">Quick Entry</h2>
                <p className="text-zinc-400 text-sm mb-6">Log your data on the go</p>
                <div className="space-y-2">
                  <Link
                    href="/m/gym"
                    className="block w-full bg-orange-600 hover:bg-orange-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Gym Logger
                  </Link>
                  <Link
                    href="/m/study"
                    className="block w-full bg-blue-600 hover:bg-blue-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Study Session
                  </Link>
                  <Link
                    href="/m/daily-context-review"
                    className="block w-full bg-indigo-600 hover:bg-indigo-500 rounded-lg p-3 text-center transition-colors"
                  >
                    Daily Review
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
