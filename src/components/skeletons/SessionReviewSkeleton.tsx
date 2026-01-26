import type { SessionReviewConfig } from '@/lib/config/review-configs'

interface SessionReviewSkeletonProps {
  config: SessionReviewConfig
}

export function SessionReviewSkeleton({ config }: SessionReviewSkeletonProps) {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 animate-pulse">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-6 bg-zinc-800 rounded w-32"></div>
          <div className="w-6 h-6 bg-zinc-800 rounded"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* First Rating Widget Skeleton */}
        <div>
          <div className="h-6 bg-zinc-800 rounded w-40 mb-3"></div>
          <div className="h-4 bg-zinc-800 rounded w-56 mb-4"></div>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 bg-zinc-800 rounded-full"></div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-zinc-800 rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second Rating Widget Skeleton */}
        <div>
          <div className="h-6 bg-zinc-800 rounded w-40 mb-3"></div>
          <div className="h-4 bg-zinc-800 rounded w-56 mb-4"></div>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 bg-zinc-800 rounded-full"></div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-zinc-800 rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Skeleton */}
        <div>
          <div className="h-5 bg-zinc-800 rounded w-32 mb-2"></div>
          <div className="h-24 bg-zinc-800 rounded w-full"></div>
        </div>
      </div>

      {/* Fixed Bottom Button Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <div className="h-12 bg-zinc-800 rounded-lg w-full"></div>
      </div>
    </div>
  )
}
