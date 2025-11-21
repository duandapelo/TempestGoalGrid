import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Sparkles, Shield, Zap, RefreshCw, Wallet } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoundCard, RoundCardSkeleton } from '@/components/lottery/RoundCard'
import { LotteryTicket } from '@/components/lottery/LotteryTicket'
import { PurchaseModal } from '@/components/lottery/PurchaseModal'
import { ParticleBackground } from '@/components/effects/ParticleBackground'
import { useLottery, formatEth, Round } from '@/hooks/useLottery'
import { RoundStatus } from '@/constants/contract'

export function Home() {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)

  const {
    rounds,
    userTickets,
    userAddress,
    isConnected,
    isLoading,
    error,
    fetchRounds,
    purchaseTicket,
  } = useLottery()

  // Calculate total prize pool
  const totalPrizePool = useMemo(() => {
    return rounds.reduce((sum, round) => sum + round.prizePool, BigInt(0))
  }, [rounds])

  // Calculate total participants
  const totalParticipants = useMemo(() => {
    return rounds.reduce((sum, round) => sum + round.ticketCount, 0)
  }, [rounds])

  // Filter active rounds
  const activeRounds = useMemo(() => {
    return rounds.filter(r => r.status === RoundStatus.Active)
  }, [rounds])

  const handleParticipate = (round: Round) => {
    setSelectedRound(round)
    setPurchaseModalOpen(true)
  }

  const handlePurchase = async (number: number) => {
    if (!selectedRound) return
    await purchaseTicket(selectedRound.roundId, number)
  }

  // Convert userTickets Map to array for display
  const userTicketsList = useMemo(() => {
    const tickets: Array<{
      ticketId: number
      roundId: string
      owner: string
      isEncrypted: boolean
      claimed: boolean
    }> = []

    userTickets.forEach((ticket, roundId) => {
      if (ticket.exists) {
        tickets.push({
          ticketId: ticket.purchaseTime,
          roundId,
          owner: userAddress || '',
          isEncrypted: true,
          claimed: ticket.claimed,
        })
      }
    })

    return tickets
  }, [userTickets, userAddress])

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lottery-gold/10 border border-lottery-gold/30 rounded-full text-lottery-gold text-sm mb-6">
              <Shield className="w-4 h-4" />
              Powered by Zama FHE
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-lottery-gold via-yellow-400 to-lottery-jackpot bg-clip-text text-transparent">
                Tempest Lottery
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The first fully encrypted on-chain lottery. Your numbers stay private until reveal.
              Fair, transparent, and secured by homomorphic encryption.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {isConnected ? (
                <Button
                  variant="jackpot"
                  size="xl"
                  onClick={() => activeRounds[0] && handleParticipate(activeRounds[0])}
                  disabled={activeRounds.length === 0}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Buy Ticket Now
                </Button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => (
                    <Button
                      variant="jackpot"
                      size="xl"
                      onClick={openConnectModal}
                      disabled={!mounted}
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
              <Button variant="outline" size="lg" onClick={fetchRounds} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="mt-4 text-red-500 text-sm">
                {error}
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
          >
            <StatCard
              icon={Trophy}
              label="Total Prize Pool"
              value={`${formatEth(totalPrizePool)} ETH`}
              highlight
            />
            <StatCard icon={Users} label="Total Participants" value={totalParticipants.toString()} />
            <StatCard icon={Zap} label="Active Rounds" value={activeRounds.length.toString()} />
            <StatCard icon={Shield} label="FHE Protected" value="100%" />
          </motion.div>
        </div>
      </section>

      {/* Active Rounds Section */}
      <section id="rounds" className="py-16 px-4 scroll-mt-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Active Rounds</h2>
              <p className="text-muted-foreground">Pick your lucky numbers and win big!</p>
            </div>
            <Button variant="outline" onClick={fetchRounds} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {rounds.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No rounds available yet.</p>
              <Button variant="outline" onClick={fetchRounds}>
                Refresh to check
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading && rounds.length === 0 ? (
                <>
                  <RoundCardSkeleton />
                  <RoundCardSkeleton />
                  <RoundCardSkeleton />
                </>
              ) : (
                rounds.map((round, index) => (
                  <RoundCard
                    key={round.roundId}
                    roundId={round.roundId}
                    prizePool={round.prizePool}
                    ticketPrice={round.ticketPrice}
                    ticketCount={round.ticketCount}
                    endTime={round.endTime}
                    status={
                      round.status === RoundStatus.Active
                        ? 'active'
                        : round.status === RoundStatus.Settled
                        ? 'settled'
                        : round.status === RoundStatus.Cancelled
                        ? 'cancelled'
                        : 'pending'
                    }
                    winningNumber={round.winningNumber}
                    featured={index === 0 && round.status === RoundStatus.Active}
                    onParticipate={() => handleParticipate(round)}
                    onViewDetails={() => console.log('View details:', round.roundId)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Your Tickets Section */}
      <section id="my-tickets" className="py-16 px-4 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Tickets</h2>
              <p className="text-muted-foreground">Track your encrypted lottery entries</p>
            </div>
          </div>

          {!isConnected ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Connect your wallet to view your tickets.</p>
            </Card>
          ) : userTicketsList.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't purchased any tickets yet.</p>
              <Button
                variant="jackpot"
                onClick={() => activeRounds[0] && handleParticipate(activeRounds[0])}
                disabled={activeRounds.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Buy Your First Ticket
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userTicketsList.map((ticket) => (
                <LotteryTicket
                  key={`${ticket.roundId}-${ticket.ticketId}`}
                  ticketId={ticket.ticketId}
                  owner={ticket.owner}
                  isEncrypted={ticket.isEncrypted}
                  isCurrentUser
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Winners Section */}
      <section id="winners" className="py-16 px-4 scroll-mt-20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Recent Winners</h2>
            <p className="text-muted-foreground">Celebrate our lucky winners!</p>
          </div>

          {rounds.filter(r => r.status === RoundStatus.Settled && r.winningNumber !== undefined).length === 0 ? (
            <Card className="p-8 text-center max-w-md mx-auto">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-lottery-gold" />
              <p className="text-muted-foreground">No winners yet. Be the first!</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {rounds
                .filter(r => r.status === RoundStatus.Settled && r.winningNumber !== undefined)
                .map((round) => (
                  <Card key={round.roundId} className="p-6 text-center border-lottery-gold/30">
                    <Trophy className="w-10 h-10 mx-auto mb-3 text-lottery-gold" />
                    <h3 className="font-bold text-lg mb-1">{round.roundId}</h3>
                    <p className="text-lottery-gold text-2xl font-bold mb-2">
                      Winning #: {round.winningNumber}
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Tier 1 Winners: {round.tier1Winners}</p>
                      <p>Tier 2 Winners: {round.tier2Winners}</p>
                      <p>Tier 3 Winners: {round.tier3Winners}</p>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 scroll-mt-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-muted-foreground">Fully encrypted lottery powered by Zama FHE</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <HowItWorksCard
              step={1}
              title="Pick Your Number"
              description="Choose a lucky number between 1-100. Your selection is encrypted using FHE before being stored on-chain."
              icon="🎯"
            />
            <HowItWorksCard
              step={2}
              title="Wait for Draw"
              description="The winning number is generated using FHE random. Nobody can predict or manipulate the result."
              icon="⏳"
            />
            <HowItWorksCard
              step={3}
              title="Claim Prize"
              description="Winners are determined by proximity to the winning number. Exact match wins the jackpot!"
              icon="🏆"
            />
          </div>

          {/* Prize Tiers */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-6">Prize Tiers</h3>
            <div className="space-y-3">
              <PrizeTier tier={1} label="JACKPOT" match="Exact Match" percentage={50} />
              <PrizeTier tier={2} label="SILVER" match="Within ±5" percentage={30} />
              <PrizeTier tier={3} label="BRONZE" match="Within ±10" percentage={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Purchase Modal */}
      {selectedRound && (
        <PurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => {
            setPurchaseModalOpen(false)
            setSelectedRound(null)
          }}
          roundId={selectedRound.roundId}
          ticketPrice={selectedRound.ticketPrice}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}

function StatCard({ icon: Icon, label, value, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-lottery-gold/50 bg-lottery-gold/5' : ''}>
      <CardContent className="p-4 text-center">
        <Icon className={`w-6 h-6 mx-auto mb-2 ${highlight ? 'text-lottery-gold' : 'text-muted-foreground'}`} />
        <div className={`text-2xl font-bold ${highlight ? 'text-lottery-gold' : ''}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

interface HowItWorksCardProps {
  step: number
  title: string
  description: string
  icon: string
}

function HowItWorksCard({ step, title, description, icon }: HowItWorksCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step * 0.1 }}
    >
      <Card className="text-center p-6 h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-lottery-gold text-black text-sm font-bold mb-4">
          {step}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </motion.div>
  )
}

interface PrizeTierProps {
  tier: number
  label: string
  match: string
  percentage: number
}

function PrizeTier({ tier, label, match, percentage }: PrizeTierProps) {
  const tierColors = {
    1: 'from-lottery-gold to-lottery-jackpot text-black',
    2: 'from-gray-300 to-gray-400 text-gray-800',
    3: 'from-amber-500 to-amber-600 text-white',
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]} flex items-center justify-center font-bold`}>
        {percentage}%
      </div>
      <div className="flex-1">
        <div className="font-bold">{label}</div>
        <div className="text-sm text-muted-foreground">{match}</div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{percentage}%</div>
        <div className="text-xs text-muted-foreground">of pool</div>
      </div>
    </div>
  )
}
