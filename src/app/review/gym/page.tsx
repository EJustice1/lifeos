import { Suspense } from 'react'
import { SessionReviewForm } from '@/components/review/SessionReviewForm'
import { SessionReviewSkeleton } from '@/components/skeletons'
import { GYM_REVIEW_CONFIG } from '@/lib/config/review-configs'

export default function GymReviewPage() {
  return (
    <Suspense fallback={<SessionReviewSkeleton config={GYM_REVIEW_CONFIG} />}>
      <SessionReviewForm config={GYM_REVIEW_CONFIG} />
    </Suspense>
  )
}
