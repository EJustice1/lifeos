import { Suspense } from 'react'
import { SessionReviewForm } from '@/components/review/SessionReviewForm'
import { SessionReviewSkeleton } from '@/components/skeletons'
import { STUDY_REVIEW_CONFIG } from '@/lib/config/review-configs'

export default function StudyReviewPage() {
  return (
    <Suspense fallback={<SessionReviewSkeleton config={STUDY_REVIEW_CONFIG} />}>
      <SessionReviewForm config={STUDY_REVIEW_CONFIG} />
    </Suspense>
  )
}
