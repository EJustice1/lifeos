import { getTodayReview } from '@/lib/actions/daily-review'
import { ReviewForm } from './review-form'

export default async function DailyReviewPage() {
  const existingReview = await getTodayReview()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Daily Review</h1>
        <p className="text-zinc-400 text-sm">End of day reflection</p>
      </header>

      <ReviewForm existingReview={existingReview} />
    </div>
  )
}
