import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { plasmaChain } from './lib/blockchain/plasmaChain'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { config } from './lib/blockchain/wagmiConfig'
import { Buffer } from "buffer";

import App from './App'

const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById('root'))

window.Buffer = Buffer;

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        supportedChains: [plasmaChain],
        defaultChain: plasmaChain,
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </React.StrictMode>
)