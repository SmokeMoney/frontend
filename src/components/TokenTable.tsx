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
}: TokenTableProps) {
  // State for quick-buy
  const quickBuyInputRef = useRef<HTMLInputElement | null>(null);
  const [isQuickBuy, setIsQuickBuy] = useState(true);
  const [buyAmount, setBuyAmount] = useState<string>("0.0000042");
  const [columnVisibility, setColumnVisibility] = useState({});

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

  // Toggle column visibility based on quick buy
  useEffect(() => {
    setColumnVisibility({ action: isQuickBuy });
  }, [selectedChain, isQuickBuy]);

  // Whenever user switches selectedChain, also reset your customChain
  useEffect(() => {
    setCustomChain(selectedChain);
  }, [selectedChain]);

  // Add allChainsMode state
  const [allChainsMode, setAllChainsMode] = useState(false);

  // Modify the chain selection handler
  const handleChainSelect = (chain: ChainTypes | null) => {
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

  // Move these definitions up, before the useReactTable call
  const columnHelper = createColumnHelper<TokenType>();
  const defaultColumns = [
    columnHelper.accessor("chainId", {
      cell: (info) => (
        <div className="flex items-center">
          <img 
            src={chains.find(c => c.id === info.row.original.chainId)?.logoURI} 
            className="w-6 h-6 rounded-full"
            alt={chains.find(c => c.id === info.row.original.chainId)?.name}
            title={chains.find(c => c.id === info.row.original.chainId)?.name}
          />
        </div>
      ),
      header: () => <span className="text-zinc-400">{columnsDic.chain}</span>,
    }),
    columnHelper.accessor("logoURI", {
      cell: (info) => (
        <div className="flex flex-row items-center gap-2 text-zinc-400 p-2">
          <img src={info.getValue()} className="w-8 h-8 rounded-full" />
          <div className="flex flex-col">
            <p>
              {info.row.original.symbol}{" "}
              {`${
                info.row.original.name !== info.row.original.symbol
                  ? `(${info.row.original.name})`
                  : ""
              }`}
            </p>
            <p className="text-zinc-400 text-xs">
              {info.row.original.address?.slice(0, 4)}...
              {info.row.original.address?.slice(-4)}
            </p>
          </div>
        </div>
      ),
      header: () => <span className="text-zinc-400">{columnsDic.logoURI}</span>,
    }),
    columnHelper.accessor("priceUSD", {
      header: () => <span className="text-zinc-400">{columnsDic.priceUSD}</span>,
      cell: (info: any) => (
        <span className="text-zinc-400">
          $ {Number(info.getValue())?.toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("action", {
      header: () => <span className="text-zinc-400">{columnsDic.action}</span>,
    }),
  ];

  // React Table
  const table = useReactTable({
    data: filteredTokens,
    columns: defaultColumns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
  });

  function handleChangeQuickBuySwitch(e: React.ChangeEvent<HTMLInputElement>) {
    setIsQuickBuy(e.target.checked);
    setColumnVisibility({ ...columnVisibility, action: e.target.checked });
    if (e.target.checked) {
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
      {/* Update the chain selection tabs */}
      <div className="flex flex-row items-center justify-between sticky top-0">
        <div className="flex flex-row items-center gap-2 overflow-x-auto">
          <div
            onClick={() => handleChainSelect(null)}
            className={`flex flex-row items-center gap-2 p-2 px-4 rounded-full cursor-pointer transition-all duration-200 ${
              allChainsMode
                ? "bg-indigo-600 text-white"
                : "bg-[#171821] text-zinc-400 hover:bg-[#1f2029]"
            }`}
          >
            <span>All Chains</span>
          </div>
          {chains
            ?.filter((chain) => !allowedChains || allowedChains.includes(chain.id))
            ?.map?.((chain: ChainTypes) => (
              <div
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className={`flex flex-row items-center gap-2 p-2 px-4 rounded-full cursor-pointer transition-all duration-200 ${
                  selectedChain?.id === chain.id && !allChainsMode
                    ? "bg-indigo-600 text-white"
                    : "bg-[#171821] text-zinc-400 hover:bg-[#1f2029]"
                }`}
              >
                <img src={chain?.logoURI} className="w-6 h-6 rounded-full" />
                <span>{chain?.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 1. Add Token Section */}
      <div className="flex flex-row items-center justify-between gap-2 border-b border-zinc-600 pb-3">
        {/* Left side controls */}
        <div className="flex flex-row items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <div className="bg-[#171821] text-zinc-400 rounded-full p-2 px-4 flex flex-row items-center gap-4 hover:cursor-pointer border border-zinc-400">
                <div className="flex flex-row items-center gap-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-zinc-400"
                  >
                    <path d="M8.00898 15.2001C6.46259 15.2001 5.20898 16.4537 5.20898 18.0001C5.20898 19.5465 6.46259 20.8001 8.00898 20.8001C9.55538 20.8001 10.809 19.5465 10.809 18.0001C10.809 16.4537 9.55538 15.2001 8.00898 15.2001Z"></path>
                    <path d="M15.9943 3.20015C14.4479 3.20015 13.1943 4.45375 13.1943 6.00015C13.1943 7.54654 14.4479 8.80015 15.9943 8.80015C17.5407 8.80015 18.7943 7.54654 18.7943 6.00015C18.7943 4.45375 17.5407 3.20015 15.9943 3.20015Z"></path>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.00899 3.19995C8.45082 3.19995 8.80899 3.55812 8.80899 3.99995L8.80899 12C8.80899 12.4418 8.45082 12.8 8.00899 12.8C7.56717 12.8 7.20899 12.4418 7.20899 12L7.20899 3.99995C7.20899 3.55812 7.56717 3.19995 8.00899 3.19995Z"
                    ></path>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.9946 11.2C16.4364 11.2 16.7946 11.5581 16.7946 12V20C16.7946 20.4418 16.4364 20.8 15.9946 20.8C15.5528 20.8 15.1946 20.4418 15.1946 20V12C15.1946 11.5581 15.5528 11.2 15.9946 11.2Z"
                    ></path>
                  </svg>

                  <p>Filter</p>
                </div>
                <div className="flex">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 11 5"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-zinc-400"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.643562 0.232544C0.864944 -0.0441829 1.26874 -0.0890491 1.54547 0.132332L5.4224 3.23388L9.29933 0.132332C9.57606 -0.0890491 9.97985 -0.0441829 10.2012 0.232544C10.4226 0.50927 10.3777 0.913066 10.101 1.13445L5.82324 4.55667C5.58889 4.74415 5.2559 4.74415 5.02155 4.55667L0.743774 1.13445C0.467048 0.913066 0.422181 0.50927 0.643562 0.232544Z"
                    />
                  </svg>
                </div>
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content className="">
                <div className="gap-2 overflow-auto m-h-80 bg-[#171821] text-zinc-400 rounded-xl mt-2 border shadow-xl">
                  <div className="border-b p-3">Filter columns</div>
                  <div className="flex flex-col gap-2 p-3">
                    {table.getAllLeafColumns().map((column) => {
                      return (
                        column.id !== "action" && (
                          <div
                            key={column.id}
                            className="flex flex-row items-center text-sm gap-2"
                          >
                            <input
                              {...{
                                type: "checkbox",
                                checked: column.getIsVisible(),
                                onChange: column.getToggleVisibilityHandler(),
                                className:
                                  "w-5 h-5 border cursor-pointer border-gray-300 checked:bg-red-200",
                              }}
                            />
                            {/* @ts-ignore */}
                            <label>{columnsDic?.[column.id] || ""}</label>
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <input
            type="text"
            className="bg-[#171821] text-zinc-300 p-2 rounded-md border border-zinc-500 focus:outline-none"
            placeholder="New token address"
            value={customTokenAddress}
            onChange={(e) => setCustomTokenAddress(e.target.value)}
          />

          <select
            className="bg-[#171821] text-zinc-300 p-2 rounded-md border border-zinc-500"
            value={customChain?.id}
            onChange={(e) => {
              const chainId = Number(e.target.value);
              const found = chains.find((c) => c.id === chainId);
              if (found) {
                setCustomChain(found);
              }
            }}
          >
            {chains
              ?.filter((chain) => !allowedChains || allowedChains.includes(chain.id))
              ?.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
          </select>

          <button
            onClick={handleAddToken}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Token
          </button>
        </div>

        {/* Right side quick buy controls */}
        <div className="flex flex-row items-center gap-2">
          <div className="flex flex-row items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.8022 9.00005C12.8022 9.07683 12.8022 9.14203 12.8027 9.1995C12.8602 9.20002 12.9254 9.20005 13.0022 9.20005L19.144 9.20004C19.5178 9.19995 19.883 9.19986 20.1694 9.24211C20.4678 9.28613 20.9441 9.41174 21.1982 9.89668C21.4523 10.3816 21.2845 10.8448 21.1508 11.1152C21.0226 11.3746 20.8147 11.6749 20.6018 11.9822L14.4501 20.8692C14.1042 21.369 13.8 21.8085 13.5347 22.1031C13.3974 22.2556 13.2222 22.4256 13.0071 22.5421C12.767 22.6721 12.4535 22.746 12.1146 22.6401C11.7756 22.5342 11.5599 22.2951 11.4365 22.0516C11.326 21.8333 11.2787 21.5938 11.2525 21.3903C11.2021 20.9971 11.2021 20.4626 11.2022 19.8548L11.2022 14.8L4.8582 14.8001C4.48427 14.8001 4.11903 14.8002 3.83269 14.758C3.53428 14.714 3.05786 14.5884 2.80376 14.1034C2.54966 13.6183 2.7176 13.1552 2.85128 12.8848C2.97955 12.6253 3.18754 12.3251 3.40048 12.0177L9.55437 3.12992C9.90026 2.6303 10.2044 2.19091 10.4697 1.8964C10.6071 1.74397 10.7823 1.57402 10.9974 1.45754C11.2374 1.32755 11.5509 1.25377 11.8898 1.35965C12.2287 1.46553 12.4445 1.70464 12.5678 1.94814C12.6783 2.16636 12.7257 2.40585 12.7518 2.60934C12.8023 3.00249 12.8022 3.53688 12.8022 4.14453L12.8022 9.00005Z"
                fill="#FFFF00"
              ></path>
            </svg>
            <label className="text-zinc-300">Quick Buy</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={isQuickBuy}
                onChange={handleChangeQuickBuySwitch}
              />
              <div className="w-9 h-5 bg-zinc-500 peer-focus:outline-0 peer-focus:ring-transparent rounded-full peer transition-all ease-in-out duration-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 hover:peer-checked:bg-[#6A60E8]"></div>
            </label>
          </div>

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
                onBlur={onBlurQuickBuyInput}
                type="text"
                placeholder={`${buyAmount} ETH`}
                className="w-[75px] bg-transparent text-zinc-300 outline-none mr-2"
              />
              <p className="text-zinc-400">ETH</p>
            </label>
          </div>
        </div>
      </div>

      <table className="overflow-auto max-h-[80vh]">
        {/* Rendering table header & body as in your existing code */}
        <thead className="sticky top-0 bg-[#14151d] z-3 text-[#717A8C] text-left">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="h-16">
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} className="">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={`odd:bg-[#191a21] hover:bg-[#171821] h-14`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {cell.column.id === "action" ? (
                    <div className="flex flex-row items-center gap-2">
                      <div
                        title="Quick Buy"
                        onClick={() => handleClickOnQuickBuy(cell.row.original)}
                        className="inline-flex items-center p-1 z-3 rounded-full border gap-2 px-4 hover:cursor-pointer"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.8022 9.00005C12.8022 9.07683 12.8022 9.14203 12.8027 9.1995C12.8602 9.20002 12.9254 9.20005 13.0022 9.20005L19.144 9.20004C19.5178 9.19995 19.883 9.19986 20.1694 9.24211C20.4678 9.28613 20.9441 9.41174 21.1982 9.89668C21.4523 10.3816 21.2845 10.8448 21.1508 11.1152C21.0226 11.3746 20.8147 11.6749 20.6018 11.9822L14.4501 20.8692C14.1042 21.369 13.8 21.8085 13.5347 22.1031C13.3974 22.2556 13.2222 22.4256 13.0071 22.5421C12.767 22.6721 12.4535 22.746 12.1146 22.6401C11.7756 22.5342 11.5599 22.2951 11.4365 22.0516C11.326 21.8333 11.2787 21.5938 11.2525 21.3903C11.2021 20.9971 11.2021 20.4626 11.2022 19.8548L11.2022 14.8L4.8582 14.8001C4.48427 14.8001 4.11903 14.8002 3.83269 14.758C3.53428 14.714 3.05786 14.5884 2.80376 14.1034C2.54966 13.6183 2.7176 13.1552 2.85128 12.8848C2.97955 12.6253 3.18754 12.3251 3.40048 12.0177L9.55437 3.12992C9.90026 2.6303 10.2044 2.19091 10.4697 1.8964C10.6071 1.74397 10.7823 1.57402 10.9974 1.45754C11.2374 1.32755 11.5509 1.25377 11.8898 1.35965C12.2287 1.46553 12.4445 1.70464 12.5678 1.94814C12.6783 2.16636 12.7257 2.40585 12.7518 2.60934C12.8023 3.00249 12.8022 3.53688 12.8022 4.14453L12.8022 9.00005Z"
                            fill="#FFFF00"
                          ></path>
                        </svg>
                        <span className="text-zinc-400">
                          {buyAmount || "0.0"}
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        
                      </div>
                    </div>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TokenTable;
