"use client"

import { useEffect, useState, useCallback, memo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Clock, Film } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const supabase = createClient()

export function TotalFootage({ brand }: { brand: string }) {
  const [totalDuration, setTotalDuration] = useState<string | null>(null)
  const [clipCount, setClipCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('modular_clips')
        .select('duration')
        .eq('brand', brand)

      if (error) throw error

      setClipCount(data.length)

      const totalSeconds = data.reduce((acc, clip) => {
        if (!clip.duration) return acc
        
        const parts = clip.duration.split(':').map(Number)
        if (parts.length === 2) {
          const [minutes, seconds] = parts
          return acc + minutes * 60 + seconds
        }
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts
          return acc + hours * 3600 + minutes * 60 + seconds
        }
        return acc
      }, 0)

      setTotalDuration(formatDuration(totalSeconds))
    } catch (error) {
      console.error('Error calculating total duration:', error)
      setError('Failed to load data. Please try again.')
      setTotalDuration(null)
      setClipCount(null)
    } finally {
      setIsLoading(false)
    }
  }, [brand])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-none overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StatItem
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              label="Total Footage"
              value={totalDuration}
              isLoading={isLoading}
              tooltipContent="Total duration of all clips"
            />
            <StatItem
              icon={<Film className="h-4 w-4 text-blue-500" />}
              label="Total Clips"
              value={clipCount}
              isLoading={isLoading}
              tooltipContent="Number of clips available"
            />
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
      </Card>
    </TooltipProvider>
  )
}

const StatItem = memo(function StatItem({ 
  icon, 
  label, 
  value, 
  isLoading,
  tooltipContent
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number | null,
  isLoading: boolean,
  tooltipContent: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{label}</div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 tabular-nums">
              {isLoading ? (
                <Skeleton className="h-7 w-15" />
                          ) : (
                value ?? 'N/A'
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  )
})

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}