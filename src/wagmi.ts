import { del, get, set } from 'idb-keyval'
import { http, createConfig } from 'wagmi'
import { celo, mainnet, optimism, sepolia, optimismSepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet, 
} from '@rainbow-me/rainbowkit/wallets';

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const indexedDBStorage = {
  async getItem(name: string) {
    return get(name)
  },
  async setItem(name: string, value: string) {
    await set(name, value)
  },
  async removeItem(name: string) {
    await del(name)
  },
}

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [rainbowWallet, walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'My RainbowKit App',
    projectId: import.meta.env.VITE_WC_PROJECT_ID,
  }
);

export const config = createConfig({
  chains: [mainnet, sepolia, optimism, celo, optimismSepolia, arbitrumSepolia, baseSepolia],
  // connectors: [
  //   walletConnect({
  //     projectId: import.meta.env.VITE_WC_PROJECT_ID,
  //   }),
  //   coinbaseWallet(),
  //   metaMask(),
  // ],
  connectors: connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [optimism.id]: http(),
    [celo.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
