import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { StudyTimer } from './study-timer'

export default async function StudyPage() {
  const [buckets, todaySessions] = await Promise.all([
    getBuckets(),
    getTodaySessions(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Study Session</h1>
        <p className="text-zinc-400 text-sm">Track time or tasks</p>
      </header>

      <StudyTimer buckets={buckets} todaySessions={todaySessions} />
    </div>
  )
}
