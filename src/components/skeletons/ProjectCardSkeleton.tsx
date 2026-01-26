interface ProjectCardSkeletonProps {
  count?: number
}

export function ProjectCardSkeleton({ count = 4 }: ProjectCardSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-zinc-800 rounded w-40"></div>
            <div className="h-5 bg-zinc-800 rounded w-24"></div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 bg-zinc-800 rounded w-16"></div>
            <div className="h-4 bg-zinc-800 rounded w-24"></div>
          </div>
          
          <div className="h-3 bg-zinc-800 rounded w-full mb-2"></div>
          <div className="h-3 bg-zinc-800 rounded w-2/3 mb-3"></div>
          
          <div className="h-1 bg-zinc-800 rounded-full w-full"></div>
        </div>
      ))}
    </div>
  )
}
