import { getTodayReview } from '@/lib/actions/daily-review'
import { ReviewForm } from './review-form'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export default async function DailyReviewPage() {
  const existingReview = await getTodayReview()

  return (
    <div className="space-y-4">
      <MobileHeader title="Daily Review" />
      <div className="px-4 pb-20">
        <ReviewForm existingReview={existingReview} />
      </div>
    </div>
  )
}
