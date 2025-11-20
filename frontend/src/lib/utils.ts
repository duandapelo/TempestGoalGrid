import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEther(value: bigint): string {
  return (Number(value) / 1e18).toFixed(4)
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ended"

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`
  }
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  return `${mins}m ${secs}s`
}

export function getTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return "JACKPOT"
    case 2:
      return "SILVER"
    case 3:
      return "BRONZE"
    default:
      return "NO WIN"
  }
}

export function getTierDescription(tier: number): string {
  switch (tier) {
    case 1:
      return "Exact Match - 50% Pool"
    case 2:
      return "Within ±5 - 30% Pool"
    case 3:
      return "Within ±10 - 20% Pool"
    default:
      return ""
  }
}
