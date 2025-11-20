import { motion } from 'framer-motion'
import { Ticket, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-lottery-gold to-lottery-jackpot flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(255, 215, 0, 0.3)',
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                    '0 0 10px rgba(255, 215, 0, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Ticket className="w-6 h-6 text-black" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-lottery-gold to-lottery-jackpot bg-clip-text text-transparent">
                Tempest Lottery
              </h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>FHE Encrypted</span>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="#rounds">Rounds</NavLink>
            <NavLink href="#my-tickets">My Tickets</NavLink>
            <NavLink href="#winners">Winners</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
          </nav>

          {/* Wallet Connection - RainbowKit */}
          <div className="flex items-center gap-3">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-lottery-gold to-lottery-jackpot text-black font-semibold hover:opacity-90 transition-opacity"
                          >
                            Connect Wallet
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold"
                          >
                            Wrong network
                          </button>
                        )
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            {chain.hasIcon && (
                              <div
                                className="w-4 h-4 rounded-full overflow-hidden"
                                style={{ background: chain.iconBackground }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                            <span className="text-sm">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-mono">
                              {account.displayName}
                            </span>
                            {account.displayBalance && (
                              <span className="hidden sm:inline text-sm text-muted-foreground">
                                ({account.displayBalance})
                              </span>
                            )}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.nav
          initial={false}
          animate={{
            height: mobileMenuOpen ? 'auto' : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          className={cn('md:hidden overflow-hidden', !mobileMenuOpen && 'pointer-events-none')}
        >
          <div className="py-4 space-y-2 border-t border-border/40">
            <MobileNavLink href="#rounds" onClick={() => setMobileMenuOpen(false)}>
              Rounds
            </MobileNavLink>
            <MobileNavLink href="#my-tickets" onClick={() => setMobileMenuOpen(false)}>
              My Tickets
            </MobileNavLink>
            <MobileNavLink href="#winners" onClick={() => setMobileMenuOpen(false)}>
              Winners
            </MobileNavLink>
            <MobileNavLink href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </MobileNavLink>
          </div>
        </motion.nav>
      </div>
    </header>
  )
}

interface NavLinkProps {
  href: string
  active?: boolean
  children: React.ReactNode
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'text-sm font-medium transition-colors hover:text-lottery-gold',
        active ? 'text-lottery-gold' : 'text-muted-foreground'
      )}
    >
      {children}
    </a>
  )
}

interface MobileNavLinkProps {
  href: string
  onClick: () => void
  children: React.ReactNode
}

function MobileNavLink({ href, onClick, children }: MobileNavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-lottery-gold hover:bg-muted rounded-lg transition-colors"
    >
      {children}
    </a>
  )
}
