import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { CareerTracker } from './career-tracker'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export default async function StudyPage() {
  const [buckets, todaySessions] = await Promise.all([
    getBuckets(),
    getTodaySessions(),
  ])

  return (
    <div className="space-y-4">
      <MobileHeader title="Career Tracker" />
      <div className="px-4 pb-20">
        <CareerTracker buckets={buckets} todaySessions={todaySessions} />
      </div>
    </div>
  )
}
