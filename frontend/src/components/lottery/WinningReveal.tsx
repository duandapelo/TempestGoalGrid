import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fireJackpotConfetti, fireSideConfetti } from '@/components/effects/Confetti'
import { cn } from '@/lib/utils'

interface WinningRevealProps {
  winningNumber: number
  onComplete?: () => void
  autoStart?: boolean
}

export function WinningReveal({
  winningNumber,
  onComplete,
  autoStart = true,
}: WinningRevealProps) {
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'slowing' | 'revealed'>('idle')
  const [displayNumber, setDisplayNumber] = useState(0)
  const [rollSpeed, setRollSpeed] = useState(50)

  const startReveal = useCallback(() => {
    setPhase('rolling')
    setRollSpeed(50)

    // Fast rolling phase
    setTimeout(() => {
      setPhase('slowing')
      setRollSpeed(150)
    }, 2000)

    // Slow down and reveal
    setTimeout(() => {
      setPhase('revealed')
      setDisplayNumber(winningNumber)
      fireJackpotConfetti()
      setTimeout(() => fireSideConfetti(), 500)
      onComplete?.()
    }, 4000)
  }, [winningNumber, onComplete])

  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(startReveal, 500)
      return () => clearTimeout(timer)
    }
  }, [autoStart, startReveal])

  useEffect(() => {
    if (phase === 'rolling' || phase === 'slowing') {
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 100) + 1)
      }, rollSpeed)
      return () => clearInterval(interval)
    }
  }, [phase, rollSpeed])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Outer glow rings */}
        <AnimatePresence>
          {phase === 'revealed' && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4 border-lottery-gold"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{
                    scale: [1, 2 + i * 0.5],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '200px',
                    height: '200px',
                    marginLeft: '-100px',
                    marginTop: '-100px',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main ball */}
        <motion.div
          className={cn(
            'relative w-48 h-48 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-lottery-gold via-yellow-400 to-lottery-jackpot',
            'shadow-2xl'
          )}
          animate={
            phase === 'rolling' || phase === 'slowing'
              ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }
              : phase === 'revealed'
              ? {
                  scale: [1, 1.2, 1],
                }
              : {}
          }
          transition={{
            duration: phase === 'revealed' ? 0.5 : 0.2,
            repeat: phase === 'revealed' ? 0 : Infinity,
          }}
          style={{
            boxShadow:
              phase === 'revealed'
                ? '0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.4)'
                : '0 0 30px rgba(255, 215, 0, 0.5)',
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          </div>

          {/* Number display */}
          <motion.span
            className={cn(
              'text-6xl font-bold text-black relative z-10',
              phase === 'rolling' && 'blur-sm',
              phase === 'slowing' && 'blur-[2px]'
            )}
            animate={
              phase === 'revealed'
                ? {
                    scale: [0.5, 1.2, 1],
                  }
                : {}
            }
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {displayNumber.toString().padStart(2, '0')}
          </motion.span>
        </motion.div>

        {/* Title */}
        <AnimatePresence>
          {phase === 'revealed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center"
            >
              <motion.h2
                className="text-4xl font-bold text-lottery-gold"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(255, 215, 0, 0.5)',
                    '0 0 30px rgba(255, 215, 0, 0.8)',
                    '0 0 10px rgba(255, 215, 0, 0.5)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                WINNING NUMBER!
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rolling indicator */}
        <AnimatePresence>
          {(phase === 'rolling' || phase === 'slowing') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
            >
              <span className="text-lg text-muted-foreground">
                {phase === 'rolling' ? 'Drawing number...' : 'Almost there...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

interface WinCheckResultProps {
  userNumber: number
  winningNumber: number
  tier: number
  prize?: string
  onClose: () => void
}

export function WinCheckResult({
  userNumber,
  winningNumber,
  tier,
  prize,
  onClose,
}: WinCheckResultProps) {
  const isWinner = tier > 0 && tier <= 3

  useEffect(() => {
    if (isWinner) {
      fireJackpotConfetti()
    }
  }, [isWinner])

  const getTierInfo = () => {
    switch (tier) {
      case 1:
        return {
          title: 'JACKPOT!',
          subtitle: 'Exact Match',
          emoji: '👑',
          color: 'text-lottery-gold',
          bgColor: 'from-lottery-gold/20 to-lottery-jackpot/20',
        }
      case 2:
        return {
          title: 'SILVER WINNER!',
          subtitle: 'Within ±5',
          emoji: '🥈',
          color: 'text-gray-300',
          bgColor: 'from-gray-400/20 to-gray-600/20',
        }
      case 3:
        return {
          title: 'BRONZE WINNER!',
          subtitle: 'Within ±10',
          emoji: '🥉',
          color: 'text-amber-500',
          bgColor: 'from-amber-500/20 to-amber-700/20',
        }
      default:
        return {
          title: 'No Win This Time',
          subtitle: 'Better luck next round!',
          emoji: '🎯',
          color: 'text-muted-foreground',
          bgColor: 'from-gray-700/20 to-gray-900/20',
        }
    }
  }

  const tierInfo = getTierInfo()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        className={cn(
          'bg-gradient-to-br',
          tierInfo.bgColor,
          'border border-white/10 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={isWinner ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {tierInfo.emoji}
        </motion.div>

        <motion.h2
          className={cn('text-3xl font-bold mb-2', tierInfo.color)}
          animate={
            isWinner
              ? {
                  textShadow: [
                    '0 0 10px currentColor',
                    '0 0 30px currentColor',
                    '0 0 10px currentColor',
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {tierInfo.title}
        </motion.h2>

        <p className="text-muted-foreground mb-6">{tierInfo.subtitle}</p>

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Your Number</div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold border border-primary/50">
              {userNumber}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Winning Number</div>
            <div className="w-16 h-16 rounded-full bg-lottery-gold/20 flex items-center justify-center text-2xl font-bold border border-lottery-gold text-lottery-gold">
              {winningNumber}
            </div>
          </div>
        </div>

        {isWinner && prize && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-xl p-4 mb-6"
          >
            <div className="text-sm text-muted-foreground mb-1">Your Prize</div>
            <div className="text-3xl font-bold text-lottery-gold">{prize} ETH</div>
          </motion.div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
        >
          {isWinner ? 'Claim Prize' : 'Close'}
        </button>
      </motion.div>
    </motion.div>
  )
}
