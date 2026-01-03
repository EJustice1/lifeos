import { getRecentTransactions } from '@/lib/actions/finance'
import { FinanceLogger } from './finance-logger'

export default async function FinancePage() {
  const recentTransactions = await getRecentTransactions(5)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Quick Entry</h1>
        <p className="text-zinc-400 text-sm">Log income or expense</p>
      </header>

      <FinanceLogger recentTransactions={recentTransactions} />
    </div>
  )
}
