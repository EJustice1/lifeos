"use client"
import { useMemo, Suspense } from 'react'
import GoalsAndScreentime from './goals-and-screentime'
import ScreentimeStep from './screentime'
import ContextSnapshot from './context-snapshot'
import InternalState from './internal-state'
import KnowledgeBase from './knowledge-base'
import ConsciousRollover from '@/components/daily-review/ConsciousRollover'
import PlanningStep from '@/components/daily-review/PlanningStep'
import { DailyReviewProvider, useDailyReview } from './DailyReviewContext'
import { DailyContextReviewSummary } from './review-summary'
import Link from 'next/link'
import { useDailyReviewController } from '@/lib/hooks/useDailyReviewController'

// Define all available steps with flag indicating if they're only for today
const ALL_STEPS = [
  { id: 'tasks', label: 'Today\'s Tasks', component: GoalsAndScreentime, onlyToday: true },
  { id: 'screentime', label: 'Screentime', component: ScreentimeStep, onlyToday: false },
  { id: 'context', label: 'Context Snapshot', component: ContextSnapshot, onlyToday: false },
  { id: 'internal', label: 'Internal State', component: InternalState, onlyToday: false },
  { id: 'knowledge', label: 'Knowledge Base', component: KnowledgeBase, onlyToday: false },
  { id: 'rollover', label: 'Conscious Rollover', component: ConsciousRollover, onlyToday: true },
  { id: 'planning', label: 'Planning', component: PlanningStep, onlyToday: true },
]

function DailyReviewSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-24 w-full bg-zinc-800 rounded-xl animate-pulse"></div>
        <div className="h-24 w-full bg-zinc-800 rounded-xl animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-16 w-full bg-zinc-800 rounded-xl animate-pulse"></div>
      </div>
    </div>
  )
}

function DailyContextReviewPageInner({
  controller,
}: {
  controller: ReturnType<typeof useDailyReviewController>
}) {
  const { contextData, existingReview, formData } = useDailyReview()
  const {
    state,
    selectedDate,
    isViewingPast,
    canGoPrev,
    canGoNext,
    oldestDate,
    newestDate,
    goToPrevDay,
    goToNextDay,
    setDate,
    loadData,
    handleSubmit,
    startEdit,
    currentStep,
    setCurrentStep,
    setRolledOverTaskIds,
    canProceedFromRollover,
    setCanProceedFromRollover,
  } = controller

  // Show all steps regardless of date
  const STEPS = useMemo(() => {
    // Show all steps for both today and past dates
    return ALL_STEPS
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

  const isRolloverStep = STEPS[currentStep].id === 'rollover'
  // Allow proceeding if: viewing past (no rollover gate), not on rollover step, OR rollover step has been completed
  const canProceed = isViewingPast || !isRolloverStep || canProceedFromRollover

  return (
      <div className="min-h-screen bg-zinc-950 pb-24">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1">
              <h1 className="text-title-lg font-bold text-white">Daily Review</h1>
              <div className="flex items-center gap-2 mt-1">
                {/* Date Navigation */}
                <button
                  onClick={goToPrevDay}
                  disabled={!canGoPrev || state.type === 'LOADING'}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous day"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={oldestDate}
                    max={newestDate}
                    value={selectedDate}
                    onChange={(event) => setDate(event.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-body-sm rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500"
                    aria-label="Select review date"
                  />
                  {isViewingPast && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-label-xs rounded-full border border-blue-500/30">
                      Viewing Past
                    </span>
                  )}
                </div>

                <button
                  onClick={goToNextDay}
                  disabled={!canGoNext || state.type === 'LOADING'}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next day"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-body-sm text-zinc-400 mt-0.5">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={state.type === 'LOADING'}
                className="p-2 text-zinc-400 hover:text-white disabled:opacity-50"
                aria-label="Refresh"
              >
                <svg className={`w-5 h-5 ${state.type === 'LOADING' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
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
          <DailyReviewSkeleton />
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
                startEdit()
                setCurrentStep(0)
              }}
            />
          </div>
        )}

        {(state.type === 'EDITING_FORM' || state.type === 'SUBMITTING') && (
          <>
            <div className="px-4 py-6">
              {(() => {
                const CurrentStepComponent = STEPS[currentStep].component
                const stepId = STEPS[currentStep].id

                // Render component with appropriate props based on step ID
                if (stepId === 'rollover') {
                  return <CurrentStepComponent
                    onAllProcessed={(ids) => {
                      setRolledOverTaskIds(ids)
                      setCanProceedFromRollover(true)
                    }}
                    disabled={state.type === 'SUBMITTING'}
                  />
                } else if (stepId === 'planning') {
                  return <CurrentStepComponent disabled={state.type === 'SUBMITTING'} />
                } else {
                  return <CurrentStepComponent />
                }
              })()}
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
                    onClick={() => {
                      handleSubmit({
                        executionScore: formData.executionScore,
                        unfocusedFactors: formData.unfocusedFactors,
                        lessonLearned: formData.lessonLearned,
                        highlights: formData.highlights,
                        screenTimeMinutes: formData.screenTimeMinutes,
                        executionScoreSuggested: formData.executionScoreSuggested,
                        executionScoreLocked: formData.executionScoreLocked ?? false,
                      })
                    }}
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
                      isViewingPast ? 'Save Review' : 'Complete Review'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
  )
}

function DailyContextReviewPage() {
  const controller = useDailyReviewController()
  return (
    <DailyReviewProvider
      initialData={{ contextData: controller.contextData, existingReview: controller.existingReview }}
      reviewDate={controller.selectedDate}
    >
      <DailyContextReviewPageInner controller={controller} />
    </DailyReviewProvider>
  )
}

export default function DailyContextReviewPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-full">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
            <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse"></div>
            <div className="mt-2 h-4 w-44 bg-zinc-800 rounded animate-pulse"></div>
          </div>
          <DailyReviewSkeleton />
        </div>
      </div>
    }>
      <DailyContextReviewPage />
    </Suspense>
  )
}
