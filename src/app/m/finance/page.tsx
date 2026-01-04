import { getRecentTransactions } from '@/lib/actions/finance'
import { FinanceLogger } from './finance-logger'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export default async function FinancePage() {
  const recentTransactions = await getRecentTransactions(5)

  return (
    <div className="space-y-4">
      <MobileHeader title="Quick Entry" />
      <div className="px-4 pb-20">
        <FinanceLogger recentTransactions={recentTransactions} />
      </div>
    </div>
  )
}
