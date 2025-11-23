'use client';

import {PrivyProvider} from '@privy-io/react-auth';

export default function Providers({children, appId}: {children: React.ReactNode, appId: string}) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        // Solo EVM chains, sin Solana
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            network: 'ethereum',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://eth.llamarpc.com'],
              },
            },
          },
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://mainnet.base.org'],
              },
            },
          },
          {
            id: 84532,
            name: 'Base Sepolia',
            network: 'base-sepolia',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia.base.org'],
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

