import { getPredefinedExercises } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export default async function GymPage() {
  const exercises = await getPredefinedExercises()

  return (
    <div className="space-y-4">
      <MobileHeader title="Workout Logger" />
      <div className="px-4 pb-20">
        <GymLogger exercises={exercises} />
      </div>
    </div>
  )
}
