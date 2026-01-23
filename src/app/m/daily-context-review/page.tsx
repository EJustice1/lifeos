'use client'

import { useReducer, useEffect, useCallback, useState } from 'react'
import { getDailyContextData, getExistingDailyContextReview, submitDailyContextReview } from '@/lib/actions/daily-context-review'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import GoalsAndScreentime from './goals-and-screentime'
import ContextSnapshot from './context-snapshot'
import InternalState from './internal-state'
import KnowledgeBase from './knowledge-base'
import TomorrowGoals from './tomorrow-goals'
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

// State Machine States
type AppState = 
  | { type: 'LOADING' }
  | { type: 'ERROR'; message: string }
  | { type: 'VIEWING_SUMMARY'; review: DailyReviewRow }
  | { type: 'EDITING_FORM'; step: number }
  | { type: 'SUBMITTING'; step: number }

// State Machine Actions
type AppAction =
  | { type: 'DATA_LOADED'; contextData: DailyContextData; existingReview: DailyReviewRow | null }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'START_EDIT' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'START_SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; review: DailyReviewRow }
  | { type: 'SUBMIT_ERROR' }

function stateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'DATA_LOADED':
      // Only transition from LOADING state
      if (state.type !== 'LOADING') return state
      
      if (action.existingReview) {
        return { type: 'VIEWING_SUMMARY', review: action.existingReview }
      }
      return { type: 'EDITING_FORM', step: 1 }
    
    case 'LOAD_ERROR':
      // Only transition from LOADING state
      if (state.type !== 'LOADING') return state
      return { type: 'ERROR', message: action.message }
    
    case 'START_EDIT':
      // Only transition from VIEWING_SUMMARY state
      if (state.type !== 'VIEWING_SUMMARY') return state
      return { type: 'EDITING_FORM', step: 1 }
    
    case 'NEXT_STEP':
      // Only transition from EDITING_FORM state
      if (state.type !== 'EDITING_FORM') return state
      if (state.step < 5) {
        return { type: 'EDITING_FORM', step: state.step + 1 }
      }
      return state
    
    case 'PREV_STEP':
      // Only transition from EDITING_FORM state
      if (state.type !== 'EDITING_FORM') return state
      if (state.step > 1) {
        return { type: 'EDITING_FORM', step: state.step - 1 }
      }
      return state
    
    case 'START_SUBMIT':
      // Only transition from EDITING_FORM state when on step 5
      if (state.type !== 'EDITING_FORM' || state.step !== 5) return state
      return { type: 'SUBMITTING', step: 5 }
    
    case 'SUBMIT_SUCCESS':
      // Only transition from SUBMITTING state
      if (state.type !== 'SUBMITTING') return state
      return { type: 'VIEWING_SUMMARY', review: action.review }
    
    case 'SUBMIT_ERROR':
      // Only transition from SUBMITTING state
      if (state.type !== 'SUBMITTING') return state
      return { type: 'EDITING_FORM', step: 5 }
    
    default:
      return state
  }
}

export default function DailyContextReviewPage() {
  const [state, dispatch] = useReducer(stateReducer, { type: 'LOADING' })
  const [contextData, setContextData] = useState<DailyContextData | null>(null)
  const [existingReview, setExistingReview] = useState<DailyReviewRow | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        // Load context data first (most critical)
        const context = await getDailyContextData();

        if (!mounted) return;

        if (context) {
          setContextData(context);
        }

        // Load existing review
        const review = await getExistingDailyContextReview();

        if (mounted) {
          setExistingReview(review);
          dispatch({ 
            type: 'DATA_LOADED', 
            contextData: context!, 
            existingReview: review 
          });
        }
      } catch (err) {
        console.error('Failed to load daily review data:', err);
        if (!mounted) return;

        let errorMessage = 'Failed to load daily review data';
        if (err instanceof Error) {
          errorMessage = `Failed to load daily review data: ${err.message}`;
        }
        
        dispatch({ type: 'LOAD_ERROR', message: errorMessage });
        showToast(errorMessage, 'error');
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleEdit = useCallback(() => {
    dispatch({ type: 'START_EDIT' });
  }, []);

  const handleNextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const handlePrevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const handleSubmit = useCallback(async (formData: DailyReviewFormData) => {
    try {
      if (!contextData) return;

      dispatch({ type: 'START_SUBMIT' });

      await submitDailyContextReview(
        contextData.date,
        formData.executionScore,
        formData.focusQuality,
        formData.physicalVitality,
        formData.unfocusedFactors,
        formData.lessonLearned,
        formData.highlights,
        formData.tomorrowGoals || [],
        formData.productiveScreenMinutes,
        formData.distractedScreenMinutes,
        formData.executionScoreSuggested,
        formData.executionScoreLocked || false
      );

      showToast('Daily review saved successfully!', 'success');

      // Refresh existing review data
      const updatedReview = await getExistingDailyContextReview();
      
      if (updatedReview) {
        setExistingReview(updatedReview);
        dispatch({ type: 'SUBMIT_SUCCESS', review: updatedReview });
      }
    } catch (err) {
      console.error('Failed to save daily review:', err);
      let errorMessage = 'Failed to save daily review';

      // Handle Supabase error objects
      if (err && typeof err === 'object' && 'message' in err) {
        const supabaseError = err as { message: string; code?: string; hint?: string; details?: string };
        errorMessage = `Failed to save daily review: ${supabaseError.message}`;

        // Check for common Supabase errors
        if (supabaseError.message.includes('permission denied')) {
          errorMessage = 'Permission denied. Please check your database permissions.';
        } else if (supabaseError.message.includes('relation') && supabaseError.message.includes('does not exist')) {
          errorMessage = 'Database table not found. Please check your database schema.';
        } else if (supabaseError.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid data format. Please check your input values.';
        } else if (supabaseError.code) {
          errorMessage = `Database error (${supabaseError.code}): ${supabaseError.message}`;
          if (supabaseError.hint) {
            errorMessage += ` - ${supabaseError.hint}`;
          }
          if (supabaseError.details) {
            errorMessage += ` - ${supabaseError.details}`;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = `Failed to save daily review: ${err.message}`;
      }

      showToast(errorMessage, 'error');
      dispatch({ type: 'SUBMIT_ERROR' });
    }
  }, [contextData, showToast]);

  // Render based on state
  switch (state.type) {
    case 'LOADING':
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-900">
          <Link 
            href="/" 
            className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading daily review...</p>
          </div>
        </div>
      );

    case 'ERROR':
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center bg-zinc-900">
          <Link 
            href="/" 
            className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <div className="bg-red-900/50 p-6 rounded-lg border border-red-500 mb-4">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Daily Review</h2>
            <p className="text-red-300 mb-4">{state.message}</p>
            {state.message.includes('relation') && state.message.includes('does not exist') && (
              <p className="text-red-300 text-sm mb-4">
                The daily_context_reviews table may not exist in your database.
                Please run the database migrations or check your Supabase setup.
              </p>
            )}
            {state.message.includes('permission denied') && (
              <p className="text-red-300 text-sm mb-4">
                Database permission issue. Please check your Supabase Row Level Security policies.
              </p>
            )}
            <PrimaryButton
              variant="primary"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </PrimaryButton>
          </div>
        </div>
      );

    case 'VIEWING_SUMMARY':
      return (
        <>
          <Link 
            href="/" 
            className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <DailyContextReviewSummary 
            review={state.review}
            contextData={contextData}
            onEdit={handleEdit}
          />
        </>
      );

    case 'EDITING_FORM':
      return (
        <DailyReviewProvider initialData={{ contextData, existingReview }} key="form-provider">
          <div className="min-h-screen bg-zinc-900 p-4">
            <Link 
              href="/" 
              className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            <DailyReviewForm 
              currentStep={state.step}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onSubmit={handleSubmit}
              isSubmitting={false}
            />
          </div>
        </DailyReviewProvider>
      );

    case 'SUBMITTING':
      return (
        <DailyReviewProvider initialData={{ contextData, existingReview }} key="form-provider">
          <div className="min-h-screen bg-zinc-900 p-4">
            <Link 
              href="/" 
              className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            <DailyReviewForm 
              currentStep={state.step}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onSubmit={handleSubmit}
              isSubmitting={true}
            />
          </div>
        </DailyReviewProvider>
      );

    default:
      return null;
  }
}

// Extracted form component
function DailyReviewForm({ 
  currentStep, 
  onNextStep, 
  onPrevStep, 
  onSubmit,
  isSubmitting 
}: { 
  currentStep: number
  onNextStep: () => void
  onPrevStep: () => void
  onSubmit: (data: DailyReviewFormData) => void
  isSubmitting: boolean
}) {
  const { formData } = useDailyReview();

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === currentStep ? 'bg-white' : s < currentStep ? 'bg-zinc-500' : 'bg-zinc-600'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Step content - only render current step */}
      {currentStep === 1 && <GoalsAndScreentime onNext={onNextStep} />}
      {currentStep === 2 && <ContextSnapshot onNext={onNextStep} />}
      {currentStep === 3 && <InternalState onNext={onNextStep} onBack={onPrevStep} />}
      {currentStep === 4 && <KnowledgeBase onNext={onNextStep} onBack={onPrevStep} />}
      {currentStep === 5 && <TomorrowGoals onSubmit={handleSubmit} onBack={onPrevStep} isSubmitting={isSubmitting} />}
    </div>
  );
}
