'use client'

import { useState, useEffect, memo } from 'react'
import { getDailyContextData, getExistingDailyContextReview, submitDailyContextReview } from '@/lib/actions/daily-context-review'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import GoalsAndScreentime from './goals-and-screentime'
import ContextSnapshot from './context-snapshot'
import InternalState from './internal-state'
import KnowledgeBase from './knowledge-base'
import TomorrowGoals from './tomorrow-goals'
import { DailyReviewProvider, useDailyReview, DailyReviewRow, DailyReviewFormData } from './DailyReviewContext'

interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
}

export default function DailyContextReviewPage() {
  const [contextData, setContextData] = useState<DailyContextData | null>(null)
  const [existingReview, setExistingReview] = useState<DailyReviewRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // Load context data first (most critical)
        const context = await getDailyContextData();

        if (!mounted) return;

        if (context) {
          setContextData(context);
        }

        // Allow page to render with context data
        setLoading(false);

        // Load existing review in background
        const review = await getExistingDailyContextReview();

        if (mounted && review) {
          setExistingReview(review);
        }
      } catch (err) {
        console.error('Failed to load daily review data:', err);
        if (!mounted) return;

        let errorMessage = 'Failed to load daily review data';
        if (err instanceof Error) {
          errorMessage = `Failed to load daily review data: ${err.message}`;
        }
        setError(errorMessage);
        showToast(errorMessage, 'error');
        setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleSubmit = async (formData: DailyReviewFormData) => {
    try {
      if (!contextData) return;

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
      setExistingReview(updatedReview);
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading daily review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center bg-zinc-900">
        <div className="bg-red-900/50 p-6 rounded-lg border border-red-500 mb-4">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Daily Review</h2>
          <p className="text-red-300 mb-4">{error}</p>
          {error.includes('relation') && error.includes('does not exist') && (
            <p className="text-red-300 text-sm mb-4">
              The daily_context_reviews table may not exist in your database.
              Please run the database migrations or check your Supabase setup.
            </p>
          )}
          {error.includes('permission denied') && (
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
  }

  return (
    <DailyReviewProvider initialData={{ contextData, existingReview }}>
      <div className="min-h-screen bg-zinc-900 p-4">
        <DailyReviewContent onSubmit={handleSubmit} />
      </div>
    </DailyReviewProvider>
  );
}

// Memoized content to avoid unnecessary re-renders
const DailyReviewContent = memo(function DailyReviewContent({ onSubmit }: { onSubmit: (data: DailyReviewFormData) => void }) {
  const [step, setStep] = useState(1);
  const { formData } = useDailyReview();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

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
                s === step ? 'bg-white' : s < step ? 'bg-zinc-500' : 'bg-zinc-600'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Step content - only render current step */}
      {step === 1 && <GoalsAndScreentime onNext={nextStep} />}
      {step === 2 && <ContextSnapshot onNext={nextStep} />}
      {step === 3 && <InternalState onNext={nextStep} onBack={prevStep} />}
      {step === 4 && <KnowledgeBase onNext={nextStep} onBack={prevStep} />}
      {step === 5 && <TomorrowGoals onSubmit={handleSubmit} onBack={prevStep} />}
    </div>
  );
});

DailyReviewContent.displayName = 'DailyReviewContent';
