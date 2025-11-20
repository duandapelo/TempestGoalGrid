import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Sparkles, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NumberPicker } from './NumberPicker'
import { cn, formatEther } from '@/lib/utils'
import { fireSideConfetti } from '@/components/effects/Confetti'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  roundId: string
  ticketPrice: bigint
  onPurchase: (number: number) => Promise<void>
}

type PurchaseStep = 'select' | 'confirm' | 'processing' | 'success' | 'error'

export function PurchaseModal({
  isOpen,
  onClose,
  roundId,
  ticketPrice,
  onPurchase,
}: PurchaseModalProps) {
  const [step, setStep] = useState<PurchaseStep>('select')
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>()
  const [error, setError] = useState<string>('')

  const handleNumberSelect = (num: number) => {
    setSelectedNumber(num)
  }

  const handleConfirm = () => {
    if (!selectedNumber) return
    setStep('confirm')
  }

  const handlePurchase = async () => {
    if (!selectedNumber) return

    setStep('processing')
    setError('')

    try {
      await onPurchase(selectedNumber)
      setStep('success')
      fireSideConfetti()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('select')
    setSelectedNumber(undefined)
    setError('')
    onClose()
  }

  const renderContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            <NumberPicker
              onSelect={handleNumberSelect}
              selectedNumber={selectedNumber}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="jackpot"
                onClick={handleConfirm}
                disabled={!selectedNumber}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Confirm Purchase</h3>
              <p className="text-muted-foreground text-sm">
                Your number will be encrypted using FHE technology
              </p>
            </div>

            <Card className="bg-muted/30 border-lottery-gold/30 p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Round</span>
                  <span className="font-mono">{roundId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Number</span>
                  <motion.span
                    className="w-12 h-12 rounded-full bg-lottery-gold flex items-center justify-center text-xl font-bold text-black"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {selectedNumber}
                  </motion.span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="text-xl font-bold text-lottery-gold">
                    {formatEther(ticketPrice)} ETH
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">
                Your number will be encrypted on-chain using Zama's FHE technology.
                Nobody can see your number until the round is settled.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button variant="jackpot" onClick={handlePurchase} className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Buy Ticket
              </Button>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="py-12 text-center space-y-6">
            <motion.div
              className="w-20 h-20 mx-auto rounded-full border-4 border-lottery-gold border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Processing Transaction</h3>
              <p className="text-muted-foreground text-sm">
                Encrypting your number and submitting to the blockchain...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 text-lottery-gold" />
              FHE Encryption in progress
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="py-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Ticket Purchased!</h3>
              <p className="text-muted-foreground text-sm">
                Your encrypted ticket has been submitted successfully
              </p>
            </div>
            <Card className="bg-muted/30 p-4">
              <div className="flex items-center justify-center gap-3">
                <Lock className="w-5 h-5 text-lottery-gold" />
                <span className="text-sm">
                  Your number <span className="font-bold text-lottery-gold">{selectedNumber}</span> is now encrypted on-chain
                </span>
              </div>
            </Card>
            <Button variant="default" onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="py-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"
            >
              <AlertCircle className="w-10 h-10 text-red-500" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Failed</h3>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="default" onClick={() => setStep('confirm')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={cn(
              'relative bg-card border border-border/50 rounded-2xl shadow-2xl',
              'max-w-lg w-full max-h-[90vh] overflow-y-auto'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lottery-gold" />
                Buy Lottery Ticket
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">{renderContent()}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
