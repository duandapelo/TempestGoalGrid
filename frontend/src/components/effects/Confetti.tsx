import { useCallback, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const hasTriggered = useRef(false)

  const fireConfetti = useCallback(() => {
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        onComplete?.()
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF6B35', '#00FF88', '#FF69B4', '#00CED1'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF6B35', '#00FF88', '#FF69B4', '#00CED1'],
      })
    }, 250)
  }, [onComplete])

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true
      fireConfetti()
    }
  }, [trigger, fireConfetti])

  return null
}

export function fireJackpotConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#FFD700'],
  })
  fire(0.2, {
    spread: 60,
    colors: ['#FF6B35'],
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#FFD700', '#FF6B35'],
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#FFD700'],
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#FF6B35', '#00FF88'],
  })
}

export function fireSideConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors: ['#FFD700', '#FF6B35', '#00FF88'],
    zIndex: 9999,
  })
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors: ['#FFD700', '#FF6B35', '#00FF88'],
    zIndex: 9999,
  })
}
