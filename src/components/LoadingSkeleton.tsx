'use client'

export function CardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-2/3"></div>
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg animate-pulse">
            <div className="w-12 h-12 bg-white/10 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/10 animate-pulse">
          <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-white/10 rounded w-20 mx-auto mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-24 mx-auto"></div>
        </div>
      ))}
    </div>
  )
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-5 bg-white/10 rounded w-24"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CalculatorSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 border border-white/10 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/3 mb-6"></div>
      <div className="space-y-6">
        <div className="h-12 bg-white/10 rounded"></div>
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-white/10 rounded"></div>
          ))}
        </div>
        <div className="h-2 bg-white/10 rounded"></div>
        <div className="h-32 bg-white/10 rounded"></div>
      </div>
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-blue-500/20 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-full"></div>
        </div>
        <div>
          <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
          <div className="h-8 bg-white/10 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}