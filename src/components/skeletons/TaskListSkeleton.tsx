interface TaskListSkeletonProps {
  count?: number
}

export function TaskListSkeleton({ count = 5 }: TaskListSkeletonProps) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 bg-zinc-800 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-6 bg-zinc-800 rounded"></div>
              <div className="w-8 h-6 bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
