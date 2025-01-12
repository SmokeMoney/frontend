import { Table } from "@radix-ui/themes";
import { ChainTypes } from "../BuyTokenApp";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import * as Switch from "@radix-ui/react-switch";
import { useRef, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import EhtLogo from "../../public/eth.svg";
import { toast } from "./ui/use-toast";

import { ToastAction } from "@/components/ui/toast";
import { getEmbeddedConnectedWallet, useWallets } from "@privy-io/react-auth";
import LightningBoltIcon from './icons/LightningBoltIcon';
import CartIcon from './icons/CartIcon';

export interface TokenType {
  address: string;
  chainId: number;
  coinKey: string;
  decimals: number;
  logoURI: string;
  name: string;
  priceUSD: string;
  symbol: string;
  amount: string;
  action: string;
}

interface TokenTableProps {
  chains: ChainTypes[];
  tokens: TokenType[];
  setSelectedChain: (value: ChainTypes) => void;
  selectedChain: ChainTypes;
  handleBuyToken: (token: TokenType) => void;
  allowedChains?: number[];
  isMobile?: boolean;
}

const columnsDic = {
  chain: "Chain",
  logoURI: "Token",
  priceUSD: "Price (USD)",
  action: "Action",
};

function TokenTable({
  tokens,
  handleBuyToken,
  chains,
  setSelectedChain,
  selectedChain,
  allowedChains,
  isMobile,
}: TokenTableProps) {
  // State for quick-buy
  const quickBuyInputRef = useRef<HTMLInputElement | null>(null);
  const [isQuickBuy, setIsQuickBuy] = useState(true);
  const [buyAmount, setBuyAmount] = useState<string>("0.00001");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null);
  const [modalBuyAmount, setModalBuyAmount] = useState("0.00001");

  const wallets = useWallets();
  const dummyChain = {
    id: 0,
    name: "Test Chain",
    chainType: "EVM",
    coin: "TEST",
    key: "test",
    logoURI: "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg",
    mainnet: true,
    metamask: {
      chainId: '0x0',
      blockExplorerUrls: ['https://etherscan.io'],
      chainName: 'Test Chain',
      nativeCurrency: {
        name: 'TEST',
        symbol: 'TEST',
        decimals: 18
      },
      rpcUrls: ['https://rpc.test.network']
    },
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 0,
      symbol: 'TEST',
      decimals: 18,
      name: 'TEST',
      priceUSD: '1',
      coinKey: 'TEST',
      logoURI: "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg"
    },
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    permit2Proxy: "0x6307119078556Fc8aD77781DFC67df20d75FB4f9",
    tokenlistUrl: "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
    diamondAddress: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
  };

  // -------------------------------------------
  // 1. Persist newly added tokens by chain ID
  // -------------------------------------------
  const [addedTokens, setAddedTokens] = useState<TokenType[]>([]);
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customChain, setCustomChain] = useState<ChainTypes>(selectedChain);

  // On mount or whenever selectedChain changes, load existing tokens for that chain from localStorage
  useEffect(() => {
    if(selectedChain?.id) {
    const storedTokens = localStorage.getItem(`addedTokens_${selectedChain.id}`);
    if (storedTokens) {
      setAddedTokens(JSON.parse(storedTokens));
    } else {
      setAddedTokens([]);
    }
  }
  }, [selectedChain]);

  // Add allChainsMode state
  const [allChainsMode, setAllChainsMode] = useState(false);

  // Modify the chain selection handler
  const handleChainSelect = (chain: ChainTypes | null) => {
    // If clicking the same chain that's already selected, do nothing
    if (chain?.id === selectedChain?.id && !allChainsMode) {
      return;
    }

    if (chain === null) {
      setAllChainsMode(true);
      setSelectedChain(dummyChain); // Keep first chain as default for adding tokens
    } else {
      setAllChainsMode(false);
      setSelectedChain(chain);
    }
  };

  // Update the tokens filtering logic
  const filteredTokens = useMemo(() => {
    return tokens?.filter(token => ![ "ETH", "WETH", "USDbC"].includes(token.symbol));
  }, [tokens, selectedChain, allChainsMode, allowedChains]);

  // Modify the columns definition to be more mobile-friendly
  const columnHelper = createColumnHelper<TokenType>();
  const defaultColumns = [
    columnHelper.accessor("logoURI", {
      header: "Token",
      cell: (info) => {
        const symbol = info.row.original.symbol;
        const fullName = info.row.original.name;
        const truncatedSymbol =
          symbol && symbol.length > 10
            ? symbol.slice(0, 10) + "..."
            : symbol;
        const truncatedName =
          fullName && fullName.length > 10
            ? fullName.slice(0, 10) + "..."
            : fullName;

        return (
          <div className="flex items-center gap-2">
            <img
              src={chains.find((c) => c.id === info.row.original.chainId)?.logoURI}
              alt={chains.find((c) => c.id === info.row.original.chainId)?.name}
              className="w-5 h-5 rounded-full"
            />
            <img
              src={info.row.original.logoURI}
              alt={fullName}
              className="w-5 h-5 rounded-full"
            />
            <div className="flex flex-col">
              {isMobile ? (
                <span>{truncatedSymbol}</span>
              ) : (
                <span>{symbol}</span>
              )}

              {/* Truncated token name for mobile */}
              {isMobile ? (
                <span className="text-xs text-zinc-500">{truncatedName}</span>
              ) : (
                <span className="text-xs text-zinc-500 hidden sm:inline">
                  {fullName}
                </span>
              )}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("priceUSD", {
      header: "Price (USD)",
      cell: (info) => {
        const priceValue = Number(info.getValue());
        let displayed: string;

        // if price >= 1 => 3 decimal places
        // if price < 1 => 6 decimal places
        if (priceValue >= 1) {
          displayed = priceValue.toFixed(3);
        } else {
          displayed = priceValue.toFixed(6);
        }

        return (
          <span className="text-sm">
            ${displayed}
          </span>
        );
      },
    }),
    columnHelper.accessor("action", {
      header: "Action"
    }),
  ];

  const table = useReactTable({
    data: filteredTokens,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleChangeQuickBuySwitch(checked: boolean) {
    setIsQuickBuy(checked);
    if (checked) {
      quickBuyInputRef.current?.focus();
    }
  }

  function onBlurQuickBuyInput(e: React.FocusEvent<HTMLInputElement>) {
    setBuyAmount(e.target.value);
  }

  function handleClickOnQuickBuy(row: TokenType) {
    handleBuyToken({ ...row, amount: buyAmount });
  }

  // Fetch token name & symbol using ethers
  async function fetchErc20Metadata(tokenAddress: string, chainId: number): Promise<{ name: string; symbol: string }> {
    try {
      await wallets.wallets[0].switchChain(selectedChain.id);
      const embeddedWallet = getEmbeddedConnectedWallet(wallets.wallets);
      const provider1193 = await embeddedWallet?.getEthereumProvider();
      const provider = new ethers.BrowserProvider(provider1193!);

      const erc20Abi = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
      ];
      
      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const [name, symbol] = await Promise.all([
        contract.name(),
        contract.symbol()
      ]);
      
      return { name, symbol };
    } catch (error: any) {
      if (error?.message?.includes("BAD_DATA")) {
        toast({
          title: "Wrong network",
          description: "Please switch to the correct network",
          variant: "destructive",
        });
      }
      console.error("Error in fetchErc20Metadata:", error);
      throw error;
    }
  }

  // -------------------------------------------
  // 2. Add token to local state & local storage
  // -------------------------------------------
  async function handleAddToken() {
    if (!customTokenAddress) return;

    // Check if token already exists for this chain
    const tokenExists = addedTokens.some(
      token => 
        token.address.toLowerCase() === customTokenAddress.toLowerCase() && 
        token.chainId === customChain.id
    );

    if (tokenExists) {
      toast({
        title: "Token already exists",
        description: "This token has already been added for this chain",
        variant: "destructive",
      });
      return;
    }

    try {
      const { name, symbol } = await fetchErc20Metadata(customTokenAddress, customChain.id);

      const newToken: TokenType = {
        address: customTokenAddress,
        chainId: customChain.id,
        coinKey: "",
        decimals: 18,
        logoURI: "",
        name,
        priceUSD: "0",
        symbol,
        amount: "0",
        action: "",
      };

      // Add locally and persist in localStorage for the specific chain
      setAddedTokens((prev) => {
        const updatedTokens = [...prev, newToken];
        localStorage.setItem(`addedTokens_${customChain.id}`, JSON.stringify(updatedTokens));
        return updatedTokens;
      });
      setCustomTokenAddress("");
    } catch (err) {
      console.error("Error fetching token metadata", err);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-2">
        {/* Chain Selection & Add Token Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex items-center">
            <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1">
              <button
                onClick={() => handleChainSelect(null)}
                className={`flex items-center gap-2 p-2 rounded-md border whitespace-nowrap ${
                  allChainsMode 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-[#171821] border-zinc-500 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>All Chains</span>
              </button>
              
              {chains
                ?.filter((chain) => !allowedChains || allowedChains.includes(chain.id))
                ?.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSelect(chain)}
                    className={`flex items-center gap-2 p-2 rounded-md border whitespace-nowrap ${
                      selectedChain?.id === chain.id && !allChainsMode
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#171821] border-zinc-500 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <img
                      src={chain.logoURI}
                      alt={chain.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{chain.name}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              className="bg-[#171821] text-zinc-300 p-2 rounded-md border border-zinc-500 focus:outline-none w-full sm:w-auto"
              placeholder="New token address"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
            />

            <select
              className="bg-[#171821] text-zinc-300 p-2 rounded-md border border-zinc-500 w-full sm:w-auto"
              value={customChain?.id}
              onChange={(e) => {
                const chainId = Number(e.target.value);
                const found = chains.find((c) => c.id === chainId);
                if (found) setCustomChain(found);
              }}
            >
              {chains
                ?.filter(
                  (chain) => !allowedChains || allowedChains.includes(chain.id)
                )
                ?.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
            </select>

            <button
              onClick={handleAddToken}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
            >
              Add Token
            </button>
          </div>
        </div>

        {/* Quick Buy Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <LightningBoltIcon />
            <label className="text-zinc-300">Quick Buy</label>
            <Switch.Root
              checked={isQuickBuy}
              onCheckedChange={handleChangeQuickBuySwitch}
              className={`w-9 h-5 bg-zinc-500 rounded-full relative ${
                isQuickBuy ? "bg-indigo-600" : ""
              }`}
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform duration-100 transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`border border-zinc-500 rounded-full ${
                isQuickBuy ? "hover:border-zinc-300" : "opacity-60"
              }`}
            >
              <label className="relative gap-1 inline-flex items-center rounded-full p-2 bg-[#171821]">
                <img src={EhtLogo} className="w-6 h-6 rounded-full bg-transparent" />
                <input
                  ref={quickBuyInputRef}
                  disabled={!isQuickBuy}
                  type="text"
                  placeholder={`${buyAmount}`}
                  className="w-[90px] bg-transparent text-zinc-300 outline-none mr-2"
                />
                <p className="text-zinc-400">ETH</p>
              </label>
            </div>
            <button
              onClick={(e) => {
                if (quickBuyInputRef.current) {
                  setBuyAmount(quickBuyInputRef.current.value);
                }
              }}
              disabled={!isQuickBuy}
              className={`px-4 py-2 rounded-md ${
                isQuickBuy 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                  : "bg-zinc-600 text-zinc-400 cursor-not-allowed"
              }`}
            >
              Set Amount
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#14151d] z-3 text-[#717A8C] text-left">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-16">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 ${
                      header.column.id === "logoURI"
                        ? "sticky left-0 z-30 bg-[#14151d]"
                        : header.column.id === "action"
                        ? "sticky right-0 z-30 bg-[#14151d]"
                        : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="select-none text-zinc-300">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="odd:bg-[#191a21] hover:bg-[#171821] h-14"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 ${
                      cell.column.id === "logoURI"
                        ? "sticky left-0 z-30 bg-[#191a21]"
                        : cell.column.id === "action"
                        ? "sticky right-0 z-30 bg-[#191a21]"
                        : ""
                    }`}
                  >
                    {cell.column.id === "action" ? (
                      <div className="flex items-center gap-2">
                        {isQuickBuy && (
                          <button
                            onClick={() => handleClickOnQuickBuy(row.original)}
                            disabled={Number(buyAmount) <= 0}
                            className={`inline-flex items-center p-1 rounded-full border gap-2 px-4 ${
                              Number(buyAmount) <= 0 
                                ? 'opacity-50 cursor-not-allowed border-zinc-600' 
                                : 'hover:bg-zinc-800'
                            }`}
                          >
                            <LightningBoltIcon />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedToken(row.original);
                            setShowBuyModal(true);
                          }}
                          className="inline-flex items-center p-1 rounded-full border gap-2 px-4 hover:bg-zinc-800"
                        >
                          <CartIcon />
                        </button>
                      </div>
                    ) : (
                      flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBuyModal && selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#171821] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-semibold text-zinc-100 mb-4">
              Buy {selectedToken.symbol}
            </h3>
            <div className="mb-4">
              <div className="relative border borden r-zinc-500 rounded-full hover:border-zinc-300">
                <label className="relative gap-1 inline-flex items-center rounded-full p-2 bg-[#171821] w-full">
                  <img src={EhtLogo} className="w-6 h-6 rounded-full bg-transparent" />
                  <input
                    type="number"
                    value={modalBuyAmount}
                    onChange={(e) => setModalBuyAmount(e.target.value)}
                    className="w-full bg-transparent text-zinc-300 outline-none mx-2"
                    placeholder="0.00001"
                    min="0"
                    step="0.00001"
                  />
                  <p className="text-zinc-400">ETH</p>
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowBuyModal(false)}
                className="px-4 py-2 rounded-md border border-zinc-500 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleBuyToken({ ...selectedToken, amount: modalBuyAmount });
                  setShowBuyModal(false);
                }}
                disabled={Number(modalBuyAmount) <= 0}
                className={`px-4 py-2 rounded-md ${
                  Number(modalBuyAmount) <= 0
                    ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenTable;
