import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { CareerTracker } from './career-tracker'

export default async function StudyPage() {
  const [buckets, todaySessions] = await Promise.all([
    getBuckets(),
    getTodaySessions(),
  ])

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white">
      <CareerTracker buckets={buckets} todaySessions={todaySessions} />
    </div>
  )
}
