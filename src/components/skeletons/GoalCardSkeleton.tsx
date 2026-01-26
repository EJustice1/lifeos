interface GoalCardSkeletonProps {
  count?: number
}

export function GoalCardSkeleton({ count = 3 }: GoalCardSkeletonProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 bg-zinc-800 rounded w-48"></div>
              <div className="h-5 bg-zinc-800 rounded w-20"></div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="h-5 bg-zinc-800 rounded w-16"></div>
              <div className="h-5 bg-zinc-800 rounded w-16"></div>
            </div>
            <div className="h-4 bg-zinc-800 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="h-3 bg-zinc-800 rounded w-16 mb-1"></div>
                <div className="h-5 bg-zinc-800 rounded w-8"></div>
              </div>
              <div>
                <div className="h-3 bg-zinc-800 rounded w-16 mb-1"></div>
                <div className="h-5 bg-zinc-800 rounded w-8"></div>
              </div>
              <div>
                <div className="h-3 bg-zinc-800 rounded w-16 mb-1"></div>
                <div className="h-5 bg-zinc-800 rounded w-12"></div>
              </div>
            </div>
            
            {/* Projects skeleton */}
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="border-l-2 border-zinc-800 pl-4">
                  <div className="h-5 bg-zinc-800 rounded w-40 mb-2"></div>
                  <div className="h-3 bg-zinc-800 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
