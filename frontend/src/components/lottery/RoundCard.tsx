import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Trophy, Wallet, ChevronRight, Lock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatCountdown, formatEther } from '@/lib/utils'

export type RoundStatus = 'active' | 'pending' | 'settling' | 'settled' | 'cancelled'

interface RoundCardProps {
  roundId: string
  prizePool: bigint
  ticketPrice: bigint
  ticketCount: number
  endTime: number
  status: RoundStatus
  winningNumber?: number
  onParticipate?: () => void
  onViewDetails?: () => void
  featured?: boolean
}

export function RoundCard({
  roundId,
  prizePool,
  ticketPrice,
  ticketCount,
  endTime,
  status,
  winningNumber,
  onParticipate,
  onViewDetails,
  featured = false,
}: RoundCardProps) {
  const [countdown, setCountdown] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = endTime - now
      setTimeLeft(remaining)
      setCountdown(formatCountdown(remaining))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Active
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'settling':
        return (
          <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full text-xs">
            <Lock className="w-3 h-3 animate-spin" />
            Settling
          </span>
        )
      case 'settled':
        return (
          <span className="flex items-center gap-1 text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full text-xs">
            <Trophy className="w-3 h-3" />
            Settled
          </span>
        )
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full text-xs">
            Cancelled
          </span>
        )
    }
  }

  const isUrgent = timeLeft > 0 && timeLeft < 3600 // Less than 1 hour

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300',
          featured && 'ring-2 ring-lottery-gold/50 shadow-lg shadow-lottery-gold/20',
          isUrgent && status === 'active' && 'animate-pulse-slow'
        )}
      >
        {/* Featured banner */}
        {featured && (
          <div className="bg-gradient-to-r from-lottery-gold via-yellow-500 to-lottery-jackpot px-4 py-1.5 text-black text-center text-sm font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Featured Round
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono">{roundId}</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prize Pool */}
          <div className="text-center py-4 bg-gradient-to-br from-lottery-gold/10 to-lottery-jackpot/10 rounded-xl">
            <div className="text-sm text-muted-foreground mb-1">Prize Pool</div>
            <motion.div
              className="text-3xl font-bold text-lottery-gold"
              animate={featured ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatEther(prizePool)} ETH
            </motion.div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Wallet className="w-3 h-3" />
                Ticket Price
              </div>
              <div className="font-semibold">{formatEther(ticketPrice)} ETH</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Users className="w-3 h-3" />
                Participants
              </div>
              <div className="font-semibold">{ticketCount}</div>
            </div>
          </div>

          {/* Countdown or Winning Number */}
          {status === 'active' && (
            <div
              className={cn(
                'rounded-lg p-3 text-center',
                isUrgent ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/50'
              )}
            >
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Clock className="w-3 h-3" />
                Time Remaining
              </div>
              <div
                className={cn(
                  'font-mono text-xl font-bold',
                  isUrgent && 'text-red-400 animate-pulse'
                )}
              >
                {countdown}
              </div>
            </div>
          )}

          {status === 'settled' && winningNumber && (
            <div className="bg-lottery-gold/10 rounded-lg p-3 text-center border border-lottery-gold/30">
              <div className="text-sm text-muted-foreground mb-2">Winning Number</div>
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-lottery-gold to-lottery-jackpot flex items-center justify-center text-2xl font-bold text-black mx-auto"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {winningNumber}
              </motion.div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {status === 'active' && onParticipate && (
              <Button
                variant={featured ? 'jackpot' : 'default'}
                className="flex-1"
                onClick={onParticipate}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Buy Ticket
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="outline"
                className={status === 'active' ? '' : 'flex-1'}
                onClick={onViewDetails}
              >
                Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function RoundCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="py-4 bg-muted/30 rounded-xl">
          <div className="h-4 w-20 bg-muted rounded mx-auto mb-2" />
          <div className="h-8 w-32 bg-muted rounded mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 h-16" />
          <div className="bg-muted/30 rounded-lg p-3 h-16" />
        </div>
        <div className="bg-muted/30 rounded-lg p-3 h-16" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted rounded-xl" />
          <div className="h-10 w-24 bg-muted rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}
