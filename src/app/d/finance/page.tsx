import { getNetWorth, getMonthlyStats, getAccounts, getRecentTransactions } from '@/lib/actions/finance'

export default async function FinanceAnalyticsPage() {
  const now = new Date()
  const [netWorth, monthlyStats, accounts, recentTransactions] = await Promise.all([
    getNetWorth(),
    getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
    getAccounts(),
    getRecentTransactions(10),
  ])

  const formatCurrency = (n: number) => `$${n.toLocaleString()}`
  const cashPercent = netWorth && netWorth.total > 0 ? Math.round((netWorth.cash / netWorth.total) * 100) : 0
  const investPercent = netWorth && netWorth.total > 0 ? Math.round((netWorth.investments / netWorth.total) * 100) : 0

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Financial Health</h1>
        <p className="text-zinc-400">Track wealth accumulation and cash flow</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Net Worth</p>
          <p className="text-3xl font-bold text-white">
            {netWorth ? formatCurrency(netWorth.total) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            {accounts.length} active accounts
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Monthly Savings</p>
          <p className="text-3xl font-bold text-emerald-400">
            {monthlyStats ? formatCurrency(monthlyStats.savings) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            {monthlyStats?.savingsRate ?? 0}% savings rate
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Investments</p>
          <p className="text-3xl font-bold text-blue-400">
            {netWorth ? formatCurrency(netWorth.investments) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            {investPercent}% of net worth
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Asset Breakdown */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Asset Breakdown</h2>
          {netWorth && netWorth.total > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cash & Savings</span>
                  <span>{formatCurrency(netWorth.cash)} ({cashPercent}%)</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cashPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Investments</span>
                  <span>{formatCurrency(netWorth.investments)} ({investPercent}%)</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${investPercent}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No accounts set up yet
            </div>
          )}
        </div>

        {/* Accounts list */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Accounts</h2>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{account.type}</p>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No accounts added
            </div>
          )}
        </div>
      </div>

      {/* Monthly Cash Flow */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Monthly Cash Flow</h2>
        {monthlyStats ? (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-emerald-400 mb-3">Income - {formatCurrency(monthlyStats.income)}</h3>
              <div className="space-y-2">
                {Object.entries(monthlyStats.byCategory)
                  .filter(([, amount]) => amount > 0)
                  .map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{category}</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="text-red-400 mb-3">Expenses - {formatCurrency(monthlyStats.expenses)}</h3>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No transactions this month
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-20">{t.date}</span>
                  <span className="text-zinc-300">{t.category}</span>
                  {t.description && <span className="text-zinc-500 text-sm">- {t.description}</span>}
                </div>
                <span className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No transactions logged yet
          </div>
        )}
      </div>
    </div>
  )
}
