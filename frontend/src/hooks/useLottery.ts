import { useState, useCallback, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther } from 'viem'
import { TEMPEST_LOTTERY_ADDRESS, TEMPEST_LOTTERY_ABI, RoundStatus } from '../constants/contract'
import { encryptLotteryNumber, initializeFHE } from '@/lib/fhe'

export interface Round {
  roundId: string
  prizePool: bigint
  ticketPrice: bigint
  ticketCount: number
  startTime: number
  endTime: number
  status: RoundStatus
  winningNumber?: number
  settled: boolean
  cancelled: boolean
  winningNumberReady: boolean
  tier1Winners: number
  tier2Winners: number
  tier3Winners: number
}

export interface Ticket {
  roundId: string
  exists: boolean
  claimed: boolean
  purchaseTime: number
  numberHandle: string
  isEncrypted: boolean
}

export function useLottery() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [userTickets, setUserTickets] = useState<Map<string, Ticket>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { address: userAddress, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Fetch all rounds from contract
  const fetchRounds = useCallback(async () => {
    if (!publicClient) return

    setIsLoading(true)
    setError(null)
    try {
      // Get all round IDs
      const roundIds = await publicClient.readContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'listRoundIds',
      }) as string[]

      // Fetch each round's details
      const roundsData: Round[] = await Promise.all(
        roundIds.map(async (roundId) => {
          const [roundInfo, status] = await Promise.all([
            publicClient.readContract({
              address: TEMPEST_LOTTERY_ADDRESS,
              abi: TEMPEST_LOTTERY_ABI,
              functionName: 'getRound',
              args: [roundId],
            }) as Promise<{
              exists: boolean
              roundId: string
              creator: `0x${string}`
              ticketPrice: bigint
              startTime: bigint
              endTime: bigint
              prizePool: bigint
              ticketCount: bigint
              cancelled: boolean
              settled: boolean
              winningNumberReady: boolean
              revealedWinningNumber: bigint
              tier1Winners: bigint
              tier2Winners: bigint
              tier3Winners: bigint
              winningNumberHandle: `0x${string}`
            }>,
            publicClient.readContract({
              address: TEMPEST_LOTTERY_ADDRESS,
              abi: TEMPEST_LOTTERY_ABI,
              functionName: 'getRoundStatus',
              args: [roundId],
            }) as Promise<number>,
          ])

          return {
            roundId: roundInfo.roundId,
            prizePool: roundInfo.prizePool,
            ticketPrice: roundInfo.ticketPrice,
            ticketCount: Number(roundInfo.ticketCount),
            startTime: Number(roundInfo.startTime),
            endTime: Number(roundInfo.endTime),
            status: status as RoundStatus,
            winningNumber: roundInfo.winningNumberReady ? Number(roundInfo.revealedWinningNumber) : undefined,
            settled: roundInfo.settled,
            cancelled: roundInfo.cancelled,
            winningNumberReady: roundInfo.winningNumberReady,
            tier1Winners: Number(roundInfo.tier1Winners),
            tier2Winners: Number(roundInfo.tier2Winners),
            tier3Winners: Number(roundInfo.tier3Winners),
          }
        })
      )

      setRounds(roundsData)
    } catch (err) {
      console.error('Failed to fetch rounds:', err)
      setError('Failed to fetch rounds')
    } finally {
      setIsLoading(false)
    }
  }, [publicClient])

  // Fetch user's ticket for a specific round
  const fetchUserTicket = useCallback(async (roundId: string) => {
    if (!publicClient || !userAddress) return null

    try {
      const ticket = await publicClient.readContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'getTicket',
        args: [roundId, userAddress],
      }) as {
        exists: boolean
        claimed: boolean
        purchaseTime: bigint
        numberHandle: `0x${string}`
      }

      if (!ticket.exists) return null

      const ticketData: Ticket = {
        roundId,
        exists: ticket.exists,
        claimed: ticket.claimed,
        purchaseTime: Number(ticket.purchaseTime),
        numberHandle: ticket.numberHandle,
        isEncrypted: true,
      }

      setUserTickets(prev => new Map(prev).set(roundId, ticketData))
      return ticketData
    } catch (err: unknown) {
      // TicketMissing error is expected when user hasn't purchased a ticket
      // Silently return null instead of logging error
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('TicketMissing')) {
        return null
      }
      // Only log unexpected errors
      console.error('Failed to fetch ticket:', err)
      return null
    }
  }, [publicClient, userAddress])

  // Fetch all user tickets for all rounds
  const fetchUserTickets = useCallback(async () => {
    if (!publicClient || !userAddress) return

    setIsLoading(true)
    try {
      const roundIds = await publicClient.readContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'listRoundIds',
      }) as string[]

      for (const roundId of roundIds) {
        await fetchUserTicket(roundId)
      }
    } catch (err) {
      console.error('Failed to fetch user tickets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, userAddress, fetchUserTicket])

  // Purchase a ticket with encrypted number
  const purchaseTicket = useCallback(async (roundId: string, number: number) => {
    if (!walletClient || !publicClient || !userAddress) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)
    try {
      // Get round info for ticket price
      const roundInfo = await publicClient.readContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'getRound',
        args: [roundId],
      }) as { ticketPrice: bigint }

      console.log(`Purchasing ticket for round ${roundId} with number ${number}`)
      console.log(`Ticket price: ${formatEther(roundInfo.ticketPrice)} ETH`)

      // Initialize FHE SDK and encrypt the lottery number
      console.log('[PurchaseTicket] Initializing FHE...')
      await initializeFHE()

      console.log('[PurchaseTicket] Encrypting lottery number...')
      const { encryptedNumber, proof } = await encryptLotteryNumber(
        number,
        userAddress
      )

      console.log('[PurchaseTicket] Encrypted data:', {
        encryptedNumber,
        proofLength: proof.length,
      })

      console.log('[PurchaseTicket] Submitting transaction...')
      const hash = await walletClient.writeContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'purchaseTicket',
        args: [roundId, encryptedNumber, proof],
        value: roundInfo.ticketPrice,
      })

      console.log('Transaction submitted:', hash)

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction confirmed!', receipt)

      // Refresh data
      await fetchRounds()
      await fetchUserTicket(roundId)

      return { success: true, txHash: hash }
    } catch (err: unknown) {
      console.error('Failed to purchase ticket:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase ticket'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, publicClient, userAddress, fetchRounds, fetchUserTicket])

  // Claim prize for a winning ticket
  const claimPrize = useCallback(async (roundId: string, playerNumber: number, tier: number) => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log(`Claiming prize for round ${roundId}, tier ${tier}`)

      const hash = await walletClient.writeContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'claimPrize',
        args: [roundId, BigInt(playerNumber), tier],
      })

      console.log('Transaction submitted:', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Prize claimed!', receipt)

      // Refresh data
      await fetchRounds()
      await fetchUserTicket(roundId)

      return { success: true, txHash: hash }
    } catch (err: unknown) {
      console.error('Failed to claim prize:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim prize'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, publicClient, fetchRounds, fetchUserTicket])

  // Claim refund for cancelled round
  const claimRefund = useCallback(async (roundId: string) => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log(`Claiming refund for round ${roundId}`)

      const hash = await walletClient.writeContract({
        address: TEMPEST_LOTTERY_ADDRESS,
        abi: TEMPEST_LOTTERY_ABI,
        functionName: 'claimRefund',
        args: [roundId],
      })

      console.log('Transaction submitted:', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Refund claimed!', receipt)

      // Refresh data
      await fetchRounds()

      return { success: true, txHash: hash }
    } catch (err: unknown) {
      console.error('Failed to claim refund:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim refund'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, publicClient, fetchRounds])

  // Load initial data
  useEffect(() => {
    fetchRounds()
  }, [fetchRounds])

  // Fetch user tickets when wallet connects
  useEffect(() => {
    if (isConnected && userAddress) {
      fetchUserTickets()
    } else {
      setUserTickets(new Map())
    }
  }, [isConnected, userAddress, fetchUserTickets])

  return {
    rounds,
    userTickets,
    userAddress,
    isConnected,
    isLoading,
    error,
    fetchRounds,
    fetchUserTickets,
    fetchUserTicket,
    purchaseTicket,
    claimPrize,
    claimRefund,
  }
}

// Hook for a single round
export function useRound(roundId: string) {
  const [round, setRound] = useState<Round | null>(null)
  const [participants, setParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publicClient = usePublicClient()

  const fetchRound = useCallback(async () => {
    if (!roundId || !publicClient) return

    setIsLoading(true)
    setError(null)
    try {
      const [roundInfo, status, participantsList] = await Promise.all([
        publicClient.readContract({
          address: TEMPEST_LOTTERY_ADDRESS,
          abi: TEMPEST_LOTTERY_ABI,
          functionName: 'getRound',
          args: [roundId],
        }) as Promise<{
          exists: boolean
          roundId: string
          creator: `0x${string}`
          ticketPrice: bigint
          startTime: bigint
          endTime: bigint
          prizePool: bigint
          ticketCount: bigint
          cancelled: boolean
          settled: boolean
          winningNumberReady: boolean
          revealedWinningNumber: bigint
          tier1Winners: bigint
          tier2Winners: bigint
          tier3Winners: bigint
          winningNumberHandle: `0x${string}`
        }>,
        publicClient.readContract({
          address: TEMPEST_LOTTERY_ADDRESS,
          abi: TEMPEST_LOTTERY_ABI,
          functionName: 'getRoundStatus',
          args: [roundId],
        }) as Promise<number>,
        publicClient.readContract({
          address: TEMPEST_LOTTERY_ADDRESS,
          abi: TEMPEST_LOTTERY_ABI,
          functionName: 'getParticipants',
          args: [roundId],
        }) as Promise<`0x${string}`[]>,
      ])

      setRound({
        roundId: roundInfo.roundId,
        prizePool: roundInfo.prizePool,
        ticketPrice: roundInfo.ticketPrice,
        ticketCount: Number(roundInfo.ticketCount),
        startTime: Number(roundInfo.startTime),
        endTime: Number(roundInfo.endTime),
        status: status as RoundStatus,
        winningNumber: roundInfo.winningNumberReady ? Number(roundInfo.revealedWinningNumber) : undefined,
        settled: roundInfo.settled,
        cancelled: roundInfo.cancelled,
        winningNumberReady: roundInfo.winningNumberReady,
        tier1Winners: Number(roundInfo.tier1Winners),
        tier2Winners: Number(roundInfo.tier2Winners),
        tier3Winners: Number(roundInfo.tier3Winners),
      })

      setParticipants(participantsList)
    } catch (err) {
      console.error('Failed to fetch round:', err)
      setError('Failed to fetch round details')
    } finally {
      setIsLoading(false)
    }
  }, [roundId, publicClient])

  useEffect(() => {
    fetchRound()
  }, [fetchRound])

  return {
    round,
    participants,
    isLoading,
    error,
    fetchRound,
  }
}

// Helper to format ETH amounts
export function formatEth(wei: bigint): string {
  return formatEther(wei)
}

// Helper to get status text
export function getStatusText(status: RoundStatus): string {
  const statusMap: Record<RoundStatus, string> = {
    [RoundStatus.NotFound]: 'Not Found',
    [RoundStatus.Active]: 'Active',
    [RoundStatus.Ended]: 'Ended',
    [RoundStatus.Settled]: 'Settled',
    [RoundStatus.Cancelled]: 'Cancelled',
  }
  return statusMap[status] || 'Unknown'
}
