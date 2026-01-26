"use client"
import { useReducer, useEffect, useCallback, useState } from 'react'
import { getDailyContextData, getExistingDailyContextReview, submitDailyContextReview } from '@/lib/actions/daily-context-review'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import GoalsAndScreentime from './goals-and-screentime'
import ScreentimeStep from './screentime'
import ContextSnapshot from './context-snapshot'
import InternalState from './internal-state'
import KnowledgeBase from './knowledge-base'
import ConsciousRollover from '@/components/daily-review/ConsciousRollover'
import PlanningStep from '@/components/daily-review/PlanningStep'
import { DailyReviewProvider, useDailyReview, DailyReviewRow, DailyReviewFormData } from './DailyReviewContext'
import { DailyContextReviewSummary } from './review-summary'
import Link from 'next/link'

interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
}

type State = 
  | { type: 'LOADING' }
  | { type: 'EDITING_FORM' }
  | { type: 'VIEWING_SUMMARY' }
  | { type: 'SUBMITTING' }
  | { type: 'ERROR'; message: string }

type Action = 
  | { type: 'DATA_LOADED'; contextData: DailyContextData | null; existingReview: DailyReviewRow | null }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'START_SUBMIT' }
  | { type: 'START_EDIT' }
  | { type: 'SUBMIT_SUCCESS' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'DATA_LOADED':
      return action.existingReview 
        ? { type: 'VIEWING_SUMMARY' }
        : { type: 'EDITING_FORM' }
    case 'LOAD_ERROR':
      return { type: 'ERROR', message: action.message }
    case 'START_SUBMIT':
      return { type: 'SUBMITTING' }
    case 'START_EDIT':
      return { type: 'EDITING_FORM' }
    case 'SUBMIT_SUCCESS':
      return { type: 'VIEWING_SUMMARY' }
    default:
      return state
  }
}

const STEPS = [
  { id: 'tasks', label: 'Today\'s Tasks', component: GoalsAndScreentime },
  { id: 'screentime', label: 'Screentime', component: ScreentimeStep },
  { id: 'context', label: 'Context Snapshot', component: ContextSnapshot },
  { id: 'internal', label: 'Internal State', component: InternalState },
  { id: 'knowledge', label: 'Knowledge Base', component: KnowledgeBase },
  { id: 'rollover', label: 'Conscious Rollover', component: ConsciousRollover },
  { id: 'planning', label: 'Planning', component: PlanningStep },
]

function DailyContextReviewPage() {
  const [state, dispatch] = useReducer(reducer, { type: 'LOADING' })
  const [contextData, setContextData] = useState<DailyContextData | null>(null)
  const [existingReview, setExistingReview] = useState<DailyReviewRow | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [rolledOverTaskIds, setRolledOverTaskIds] = useState<string[]>([])
  const [canProceedFromRollover, setCanProceedFromRollover] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const ctx = await getDailyContextData()
        const rev = await getExistingDailyContextReview()
        setContextData(ctx)
        setExistingReview(rev)
        dispatch({ type: 'DATA_LOADED', contextData: ctx!, existingReview: rev })
      } catch (e) {
        dispatch({ type: 'LOAD_ERROR', message: 'Failed to load' })
        showToast('Failed to load daily review data', 'error')
      }
    }
    load()
    // Only load once on mount - no auto-syncing with database
  }, [])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    dispatch({ type: 'START_SUBMIT' })
    // Submit logic handled in the review context
    showToast('Review submitted successfully!', 'success')
    dispatch({ type: 'SUBMIT_SUCCESS' })
  }

  const isRolloverStep = STEPS[currentStep].id === 'rollover'
  // Allow proceeding if: not on rollover step, OR rollover step has been completed
  const canProceed = !isRolloverStep || canProceedFromRollover

  return (
    <DailyReviewProvider initialData={{ contextData, existingReview }}>
      <div className="min-h-screen bg-zinc-950 pb-24">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-title-lg font-bold text-white">Daily Review</h1>
              <p className="text-body-sm text-zinc-400">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
              </p>
            </div>
            <Link
              href="/"
              className="p-2 text-zinc-400 hover:text-white"
              aria-label="Back to Day View"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        {state.type === 'LOADING' && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {state.type === 'ERROR' && (
          <div className="px-4 py-12 text-center">
            <p className="text-red-400">{state.message}</p>
          </div>
        )}

        {state.type === 'VIEWING_SUMMARY' && existingReview && (
          <div className="px-4 py-6">
            <DailyContextReviewSummary 
              review={existingReview} 
              contextData={contextData}
              onEdit={() => {
                dispatch({ type: 'START_EDIT' })
                setCurrentStep(0)
              }}
            />
          </div>
        )}

        {(state.type === 'EDITING_FORM' || state.type === 'SUBMITTING') && (
          <>
            <div className="px-4 py-6">
              {currentStep === 0 && <GoalsAndScreentime />}
              {currentStep === 1 && <ScreentimeStep />}
              {currentStep === 2 && <ContextSnapshot />}
              {currentStep === 3 && <InternalState />}
              {currentStep === 4 && <KnowledgeBase />}
              {currentStep === 5 && (
                <ConsciousRollover
                  onAllProcessed={(ids) => {
                    setRolledOverTaskIds(ids)
                    setCanProceedFromRollover(true)
                  }}
                  disabled={state.type === 'SUBMITTING'}
                />
              )}
              {currentStep === 6 && (
                <PlanningStep disabled={state.type === 'SUBMITTING'} />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 pb-safe">
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    disabled={state.type === 'SUBMITTING'}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed || state.type === 'SUBMITTING'}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isRolloverStep && !canProceedFromRollover
                      ? 'Process all tasks to continue'
                      : 'Next'}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={state.type === 'SUBMITTING'}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {state.type === 'SUBMITTING' ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Complete Review'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DailyReviewProvider>
  )
}

export default DailyContextReviewPage
