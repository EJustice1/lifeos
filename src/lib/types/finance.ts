export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  accountType: 'checking' | 'savings' | 'investment' | 'credit' | 'other';
  currentBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  nextOccurrence: string;
}

export interface StockTransaction {
  id: string;
  accountId: string;
  symbol: string;
  companyName: string;
  transactionType: 'buy' | 'sell' | 'dividend';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  fee: number;
  date: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurringId?: string;
  bank?: string;
  tags?: string[];
  receiptUrl?: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
  stockGains: number;
  netWorth: number;
}

export interface NetWorthProjection {
  currentNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  projectionMonths: number;
  historicalData: { date: string; value: number }[];
  projectedData: { date: string; value: number }[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  unrealizedGains: number;
  returnPercentage: number;
  stocks: StockHolding[];
}

export interface StockHolding {
  symbol: string;
  companyName: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  returnPercentage: number;
}

export interface CategoryDistribution {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export interface ChartDataPoint {
  date: string;
  value: number;
  isProjection?: boolean;
}