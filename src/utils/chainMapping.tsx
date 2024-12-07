// src/utils/chains.ts
export interface Chain {
  id: number;
  legacyId: number;
  mainnet: boolean;
  name: string;
  rpcUrl: string;
  lendingAddress: string;
  depositAddress: string;
  wethAddress: string;
  wstethAddress: string;
  explorer: string;
}
// src/utils/chains.ts

export const chains: Chain[] = [
  {
    id: 40245,
    legacyId: 84532,
    mainnet: false,
    name: "Base Sepolia",
    rpcUrl: import.meta.env.VITE_BASSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_BAS_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_BAS_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_BAS_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_BAS_WSTETH_ADDRESS!,
    explorer: "https://sepolia.basescan.org/",
  },
  {
    id: 40231,
    legacyId: 421614,
    mainnet: false,
    name: "Arbitrum Sepolia",
    rpcUrl: import.meta.env.VITE_ARBSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_ARB_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_ARB_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_ARB_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_ARB_WSTETH_ADDRESS!,
    explorer: "https://sepolia.arbiscan.io/",
  },
  {
    id: 40232,
    legacyId: 11155420,
    mainnet: false,
    name: "Optimism Sepolia",
    rpcUrl: import.meta.env.VITE_OPTSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_OPT_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_OPT_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_OPT_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_OPT_WSTETH_ADDRESS!,
    explorer: "https://sepolia-optimism.etherscan.io/",
  },
  {
    id: 40161,
    legacyId: 11155111,
    mainnet: false,
    name: "Ethereum Sepolia",
    rpcUrl: import.meta.env.VITE_ETHSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_ETH_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_ETH_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_ETH_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_ETH_WSTETH_ADDRESS!,
    explorer: "https://sepolia.etherscan.io/",
  },
  {
    id: 40249,
    legacyId: 999999999,
    mainnet: false,
    name: "Zora Sepolia",
    rpcUrl: import.meta.env.VITE_ZORASEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_ZORA_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_ZORA_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_ZORA_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_ZORA_WSTETH_ADDRESS!,
    explorer: "https://sepolia.explorer.zora.energy/",
  },
  {
    id: 40243,
    legacyId: 168587773,
    mainnet: false,
    name: "Blast Sepolia",
    rpcUrl: import.meta.env.VITE_BLASTSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_BLAST_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_BLAST_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_BLAST_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_BLAST_WSTETH_ADDRESS!,
    explorer: "https://sepolia.blastscan.io/",
  },
  {
    id: 40170,
    legacyId: 534351,
    mainnet: false,
    name: "Scroll Sepolia",
    rpcUrl: import.meta.env.VITE_SCROLLSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_SCROLL_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_SCROLL_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_SCROLL_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_SCROLL_WSTETH_ADDRESS!,
    explorer: "https://sepolia.scrollscan.com/",
  },
  {
    id: 40287,
    legacyId: 59141,
    mainnet: false,
    name: "Linea Sepolia",
    rpcUrl: import.meta.env.VITE_LINEASEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_LINEA_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_LINEA_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_LINEA_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_LINEA_WSTETH_ADDRESS!,
    explorer: "https://sepolia.lineascan.build/",
  },
  {
    id: 40305,
    legacyId: 300,
    mainnet: false,
    name: "zkSync Sepolia",
    rpcUrl: import.meta.env.VITE_ZKSYNCSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_ZKSYNC_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_ZKSYNC_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_ZKSYNC_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_ZKSYNC_WSTETH_ADDRESS!,
    explorer: "https://sepolia.explorer.zksync.io/",
  },
  {
    id: 40322,
    legacyId: 2810,
    mainnet: false,
    name: "Morph Holesky",
    rpcUrl: import.meta.env.VITE_MORPHSEPOLIA_RPC_URL!,
    lendingAddress: import.meta.env.VITE_MORPH_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_MORPH_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_MORPH_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_MORPH_WSTETH_ADDRESS!,
    explorer: "https://explorer-holesky.morphl2.io/",
  },
  // {
  //   id: 40291,
  //   legacyId: 80084,
  //   name: "Berachain Bartio",
  //   rpcUrl: import.meta.env.VITE_BASSEPOLIA_RPC_URL!,
  //   lendingAddress: import.meta.env.VITE_BER_LENDING_ADDRESS!,
  //   depositAddress: import.meta.env.VITE_BER_DEPOSIT_ADDRESS!,
  //   wethAddress: import.meta.env.VITE_BER_WETH_ADDRESS!,
  //   wstethAddress: import.meta.env.VITE_BER_WSTETH_ADDRESS!,
  //   explorer: "https://bartio.beratrail.io/",
  // },

  {
    id: 30184,
    mainnet: true,
    legacyId: 8453,
    name: "Base Mainnet",
    rpcUrl: import.meta.env.BASEMAINNET_RPC_URL!,
    lendingAddress: import.meta.env.VITE_BAS_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_BAS_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_BAS_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_BAS_WSTETH_ADDRESS!,
    explorer: "https://basescan.org/",
  },
  {
    id: 30110,
    mainnet: true,
    legacyId: 42161,
    name: "Arbitrum Mainnet",
    rpcUrl: import.meta.env.ARBMAINNET_RPC_URL!,
    lendingAddress: import.meta.env.VITE_ARB_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_ARB_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_ARB_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_ARB_WSTETH_ADDRESS!,
    explorer: "https://arbiscan.io/",
  },
  {
    id: 30111,
    mainnet: true,
    legacyId: 10,
    name: "Optimism Mainnet",
    rpcUrl: import.meta.env.OPTMAINNET_RPC_URL!,
    lendingAddress: import.meta.env.VITE_OPT_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_OPT_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_OPT_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_OPT_WSTETH_ADDRESS!,
    explorer: "https://optimistic.etherscan.io/",
  },
  {
    id: 30214,
    mainnet: true,
    legacyId: 534352,
    name: "Scroll Mainnet",
    rpcUrl: import.meta.env.SCROLLMAINNET_RPC_URL!,
    lendingAddress: import.meta.env.VITE_SCROLL_LENDING_ADDRESS!,
    depositAddress: import.meta.env.VITE_SCROLL_DEPOSIT_ADDRESS!,
    wethAddress: import.meta.env.VITE_SCROLL_WETH_ADDRESS!,
    wstethAddress: import.meta.env.VITE_SCROLL_WSTETH_ADDRESS!,
    explorer: "https://scrollscan.com/",
  },
];

// ... (keep the existing functions)

const isMainnet = import.meta.env.VITE_NODE_ENV === 'mainnet'; // or any other condition

// Filter chains based on the configuration
const filteredChains = chains.filter(chain => 
  isMainnet ? chain.mainnet : !chain.mainnet
);

export const chainIds = filteredChains.map((chain) => chain.id);

export function getChainName(chainId: number): string | undefined {
  const chain = chains.find((c) => c.id === chainId);
  return chain?.name;
}

export function getLegacyId(chainId: number): number | undefined {
  const chain = chains.find((c) => c.id === chainId);
  return chain?.legacyId;
}

export function getLZId(chainId: number): number {
  const chain = chains.find((c) => c.legacyId === chainId);
  if (chain?.id) {
    return chain?.id
  }
  else {
    return 0
  }
}

export function getChainRPC(chainId: number): string | undefined {
  const chain = chains.find((c) => c.id === chainId);
  return chain?.rpcUrl;
}

export function getChainLendingAddress(chainId: number): `0x${string}` {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.lendingAddress) {
    return chain?.lendingAddress as `0x${string}`
  }
  else {
    throw Error('lendingAddress not found');
  }
}

export function getDepositAddress(chainId: number): `0x${string}` {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.depositAddress) {
    return chain?.depositAddress as `0x${string}`
  }
  else {
    throw Error('deposit address not found');
  }
}

export function getWETHAddress(chainId: number): `0x${string}` {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.wethAddress) {
    return chain?.wethAddress as `0x${string}`
  }
  else {
    throw Error("WETH Address not found");
  }
}

export function getWstETHAddress(chainId: number): `0x${string}` {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.wstethAddress) {
    return chain?.wstethAddress as `0x${string}`
  }
  else {
    throw Error('wstETH Address not found');
  }
}

export function getChainExplorer(chainId: number): string {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.explorer) {
    return chain?.explorer
  }
  else {
    throw Error('wstETH Address not found');
  }
}

export function isValidChainId(chainId: number): boolean {
  return chains.some((chain) => chain.id === chainId);
}

export function getNftAddress(): string {
  if (import.meta.env.VITE_NFT_CONTRACT_ADDRESS !== undefined) {
    return import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  } else {
    throw Error("NFT Address not found");
  }
}
