import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'
import { Header } from '@/components/layout/Header'
import { Home } from '@/pages/Home'
import './index.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FFD700',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}
        >
          <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main>
              <Home />
            </main>
            <footer className="border-t border-border/40 py-8 px-4 text-center text-sm text-muted-foreground">
              <p>Tempest Lottery - Powered by Zama FHE Technology</p>
              <p className="mt-2">Built for the Zama Bounty Program</p>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
