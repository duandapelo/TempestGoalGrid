import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NumberPickerProps {
  onSelect: (number: number) => void
  selectedNumber?: number
  disabled?: boolean
  maxNumber?: number
}

export function NumberPicker({
  onSelect,
  selectedNumber,
  disabled = false,
  maxNumber = 100,
}: NumberPickerProps) {
  const [hoveredNumber, setHoveredNumber] = useState<number | null>(null)

  const handleSelect = useCallback(
    (num: number) => {
      if (!disabled) {
        onSelect(num)
      }
    },
    [disabled, onSelect]
  )

  const getNumberColor = (num: number) => {
    if (num === selectedNumber) return 'bg-lottery-gold text-black'
    if (num <= 25) return 'bg-gradient-to-br from-red-500 to-red-600'
    if (num <= 50) return 'bg-gradient-to-br from-blue-500 to-blue-600'
    if (num <= 75) return 'bg-gradient-to-br from-green-500 to-green-600'
    return 'bg-gradient-to-br from-purple-500 to-purple-600'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Pick Your Lucky Number</h3>
        <p className="text-muted-foreground text-sm">
          Choose a number between 1 and {maxNumber}
        </p>
      </div>

      {/* Selected number display */}
      <AnimatePresence mode="wait">
        {selectedNumber && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-lottery-gold via-yellow-500 to-lottery-jackpot flex items-center justify-center text-4xl font-bold text-black shadow-lg shadow-lottery-gold/50"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                    '0 0 40px rgba(255, 215, 0, 0.8)',
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {selectedNumber}
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-lottery-gold"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick pick button */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => handleSelect(Math.floor(Math.random() * maxNumber) + 1)}
          disabled={disabled}
          className="border-lottery-gold/50 text-lottery-gold hover:bg-lottery-gold/10"
        >
          <span className="mr-2">🎲</span>
          Quick Pick
        </Button>
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-10 gap-2 p-4 bg-background/50 rounded-xl backdrop-blur-sm">
        {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => (
          <motion.button
            key={num}
            onClick={() => handleSelect(num)}
            onMouseEnter={() => setHoveredNumber(num)}
            onMouseLeave={() => setHoveredNumber(null)}
            disabled={disabled}
            className={cn(
              'relative w-full aspect-square rounded-lg text-sm font-bold transition-all duration-200',
              'flex items-center justify-center',
              getNumberColor(num),
              num === selectedNumber && 'ring-2 ring-lottery-gold ring-offset-2 ring-offset-background',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && 'hover:scale-110 hover:z-10 cursor-pointer'
            )}
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            {num}
            {hoveredNumber === num && !disabled && (
              <motion.div
                layoutId="hover-highlight"
                className="absolute inset-0 rounded-lg ring-2 ring-white/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Color legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" /> 1-25
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" /> 26-50
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" /> 51-75
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500" /> 76-100
        </span>
      </div>
    </div>
  )
}
