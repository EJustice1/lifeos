import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { CareerTracker } from './career-tracker'

export default async function StudyPage() {
  const [buckets, todaySessions] = await Promise.all([
    getBuckets(),
    getTodaySessions(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Career Tracker</h1>
        <p className="text-zinc-400 text-sm">Track time, manage tasks & buckets</p>
      </header>

      <CareerTracker buckets={buckets} todaySessions={todaySessions} />
    </div>
  )
}
