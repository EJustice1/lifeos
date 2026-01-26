'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getMuscleGroupTargets, updateMuscleGroupTarget } from '@/lib/actions/gym'
import { MUSCLE_GROUPS } from '@/lib/gym-utils'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

export default function GymTargetsPage() {
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  useEffect(() => {
    async function loadTargets() {
      setLoading(true)
      const data = await getMuscleGroupTargets()
      if (data) {
        setTargets(data)
      }
      setLoading(false)
    }
    loadTargets()
  }, [])

  const handleTargetChange = (muscleGroup: string, value: number) => {
    setTargets(prev => ({ ...prev, [muscleGroup]: value }))
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        // Update all targets
        await Promise.all(
          MUSCLE_GROUPS.map(mg =>
            updateMuscleGroupTarget(mg, targets[mg] || 12)
          )
        )
        showToast('Targets saved successfully!', 'success')
      } catch (error) {
        showToast('Failed to save targets', 'error')
      }
    })
  }

  const handleResetDefaults = () => {
    const defaults: Record<string, number> = {}
    MUSCLE_GROUPS.forEach(mg => { defaults[mg] = 12 })
    setTargets(defaults)
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/m/gym"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-title-lg font-bold">Training Targets</h1>
          <div className="w-12"></div> {/* Spacer */}
        </div>

        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Weekly Volume Goals</h3>
          <p className="text-body-sm text-zinc-400 mb-6">
            Set weekly target sets for each muscle group. Exercises count as 1.0 for primary muscles and 0.5 for secondary muscles.
          </p>

          <div className="space-y-4">
            {MUSCLE_GROUPS.map(mg => (
              <div key={mg} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-body-sm font-medium">{capitalize(mg)}</label>
                  <span className="text-emerald-400 font-bold">{targets[mg] || 12} sets/week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={targets[mg] || 12}
                  onChange={(e) => handleTargetChange(mg, parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgba(168, 85, 247, 1) 0%, rgba(168, 85, 247, 1) ${((targets[mg] || 12) / 30) * 100}%, rgba(63, 63, 70, 1) ${((targets[mg] || 12) / 30) * 100}%, rgba(63, 63, 70, 1) 100%)`
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <PrimaryButton
              variant="primary"
              size="lg"
              onClick={handleSave}
              disabled={isPending}
              loading={isPending}
              className="w-full"
            >
              Save Targets
            </PrimaryButton>

            <button
              onClick={handleResetDefaults}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
            >
              Reset to Defaults (12 sets/week)
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Recommended Ranges (Mike Israetel)</h3>
          <div className="text-label-sm text-zinc-400 space-y-1">
            <p>• <span className="text-white">10-20 sets/week:</span> Most muscle groups</p>
            <p>• <span className="text-white">12-18 sets/week:</span> Chest, Back, Quads</p>
            <p>• <span className="text-white">8-12 sets/week:</span> Biceps, Triceps, Calves</p>
            <p>• <span className="text-white">15-22 sets/week:</span> Hamstrings, Glutes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
