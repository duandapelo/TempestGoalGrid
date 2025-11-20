import { motion } from 'framer-motion'
import { Lock, Eye, Trophy, Ticket } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatAddress } from '@/lib/utils'

interface LotteryTicketProps {
  ticketId: number
  owner: string
  isEncrypted: boolean
  revealedNumber?: number
  winTier?: number
  prizeAmount?: string
  isCurrentUser?: boolean
  animate?: boolean
}

export function LotteryTicket({
  ticketId,
  owner,
  isEncrypted,
  revealedNumber,
  winTier,
  prizeAmount,
  isCurrentUser = false,
  animate = true,
}: LotteryTicketProps) {
  const getTierStyles = () => {
    switch (winTier) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-lottery-gold via-yellow-400 to-lottery-jackpot',
          text: 'text-black',
          label: 'JACKPOT',
          icon: '👑',
        }
      case 2:
        return {
          bg: 'bg-gradient-to-br from-slate-300 via-gray-200 to-slate-400',
          text: 'text-gray-800',
          label: 'SILVER',
          icon: '🥈',
        }
      case 3:
        return {
          bg: 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700',
          text: 'text-white',
          label: 'BRONZE',
          icon: '🥉',
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800',
          text: 'text-gray-300',
          label: null,
          icon: null,
        }
    }
  }

  const tierStyles = getTierStyles()

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20, rotateX: -20 } : false}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="perspective-1000"
    >
      <Card
        className={cn(
          'relative overflow-hidden p-0 border-0',
          tierStyles.bg,
          isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {/* Ticket pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.1) 10px,
                rgba(255,255,255,0.1) 20px
              )`,
            }}
          />
        </div>

        {/* Win badge */}
        {winTier && winTier <= 3 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <div className="bg-lottery-gold text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {tierStyles.label}
            </div>
          </motion.div>
        )}

        <div className={cn('p-4', tierStyles.text)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              <span className="font-mono text-sm">#{ticketId.toString().padStart(4, '0')}</span>
            </div>
            {isCurrentUser && (
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">Your Ticket</span>
            )}
          </div>

          {/* Number display */}
          <div className="flex justify-center my-6">
            <motion.div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold',
                isEncrypted
                  ? 'bg-black/30 border-2 border-white/30'
                  : 'bg-white/90 text-gray-900 shadow-inner'
              )}
              animate={
                isEncrypted
                  ? {
                      borderColor: ['rgba(255,255,255,0.3)', 'rgba(255,215,0,0.8)', 'rgba(255,255,255,0.3)'],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isEncrypted ? (
                <Lock className="w-8 h-8 text-lottery-gold" />
              ) : (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {revealedNumber}
                </motion.span>
              )}
            </motion.div>
          </div>

          {/* Status */}
          <div className="text-center text-sm mb-3">
            {isEncrypted ? (
              <div className="flex items-center justify-center gap-2 opacity-80">
                <Lock className="w-4 h-4" />
                <span>FHE Encrypted</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Revealed</span>
              </div>
            )}
          </div>

          {/* Prize amount */}
          {prizeAmount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-2 bg-black/20 rounded-lg"
            >
              <div className="text-xs opacity-80">Prize Won</div>
              <div className="text-lg font-bold">{prizeAmount} ETH</div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs opacity-70">
            <span>Owner: {formatAddress(owner)}</span>
            {tierStyles.icon && <span className="text-lg">{tierStyles.icon}</span>}
          </div>
        </div>

        {/* Perforated edge effect */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-background rounded-r-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-8 bg-background rounded-l-full" />
      </Card>
    </motion.div>
  )
}

export function LotteryTicketSkeleton() {
  return (
    <Card className="overflow-hidden p-0 border-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 bg-gray-600 rounded" />
          <div className="h-4 w-16 bg-gray-600 rounded-full" />
        </div>
        <div className="flex justify-center my-6">
          <div className="w-20 h-20 rounded-full bg-gray-600" />
        </div>
        <div className="h-4 w-24 mx-auto bg-gray-600 rounded mb-3" />
        <div className="mt-4 pt-3 border-t border-gray-600 flex items-center justify-between">
          <div className="h-3 w-24 bg-gray-600 rounded" />
        </div>
      </div>
    </Card>
  )
}
