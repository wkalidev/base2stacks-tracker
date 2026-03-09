'use client'

export function LiveIndicator({ connected, blockHeight }: {
  connected: boolean;
  blockHeight: number | null;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'
      }`} />
      <span className="text-gray-400">
        {connected
          ? `Live ${blockHeight ? `· Block #${blockHeight.toLocaleString()}` : ''}`
          : 'Reconnecting...'}
      </span>
    </div>
  )
}