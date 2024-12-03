// import Header from "./component/header"
import TokenTable, { TokenType } from "./components/TokenTable";
import BuyTokenModal from "./components/BuyTokenModal";
import ConnectWallet from "./components/ConnectWallet";

import { useEffect, useState } from "react";
import logo from "../public/logo4.png";
import { getChains, getTokens } from "@lifi/sdk";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { ChainType } from "@lifi/sdk";
import { useSendTransaction, useAccount } from "wagmi";
import { parseEther } from "viem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function BuyTokenApp() {
  const { ready, wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const [chains, setChains] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [tokens, setTokens] = useState<any>([]);
  const [selectedToken, setSelectedToken] = useState<any>(null);

  /**
   * when connected wallet get all chain
   */
  useEffect(() => {
    if (wallets?.length > 0) {
      _getChains();
      fetchTokenData(wallets?.[0]?.address);
    }
  }, [wallets]);

  /**
   * when changed chain get tokens
   */
  useEffect(() => {
    if (selectedChain?.chainType) {
      getTokensFilterByChainType(selectedChain?.id);
    }
  }, [selectedChain]);

  async function _getChains() {
    try {
      const _res: any[] = await getChains({ chainTypes: [ChainType.EVM] });
      if (_res && _res?.length > 0) {
        setChains(_res);
        setSelectedChain(_res[0]);
      }
    } catch (error) {}
  }

  async function fetchTokenData(address: string) {
    try {
      const response = await fetch(
        `https://api.smoke.money/api/walletdata/${address}`
        // `https://api.smoke.money/api/walletdata/${address}`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch token data:", error);
      return null;
    }
  }

  async function getTokensFilterByChainType(chainType: any) {
    try {
      const { tokens }: any = await getTokens({ chains: [chainType] });
      setTokens(tokens?.[chainType]);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleBuyToken(token: TokenType) {
    const responce = await fetch(
      `https://li.quest/v1/quote?fromChain=8453&toChain=${
        token?.chainId
      }&fromToken=ETH&toToken=${
        token?.address
      }&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&fromAmount=${parseEther(
        token?.amount
      )}`
    );

    const data = await responce.json();

    // fromChain=8453   1
    // toChain=8453
    // fromToken=ETH
    // toToken=0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92
    // fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0
    // fromAmount=1000000000000000
    // );

    const smokResponse = await fetch("https://api.smoke.money/api/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress:
          "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
        nftId: "3",
        amount: "100000000000",
        chainId: "30111",
        recipient:
          "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
      }),
    });

    const result = await smokResponse.json();

    if (result?.status === "borrow_approved" && responce?.status === 200) {
      try {
        // sendTransaction({
        //   to: "0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92",
        //   value: parseEther("0.01"),
        // });

        console.log(data?.transactionRequest);

        sendTransaction({
          data: data?.transactionRequest,
          to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
          value: parseEther(token?.amount),
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function handleChangeChain(_chain: any) {
    setSelectedChain(_chain);
    setTokens([]);
  }

  return (
    <div className="select-none">
      <div className="absolute w-full bg-[#2D3542] shadow-xl">
        <header>
          <div className="container mx-auto flex flex-row items-center justify-between p-2">
            <div className="flex flex-row items-center animate-pulse">
              <img src={logo} className="w-24" />
            </div>

            <div className="">
              <ConnectWallet
                chains={chains}
                selectedChain={selectedChain}
                setSelectedChain={handleChangeChain}
              />
            </div>
          </div>
        </header>
      </div>

      <div className="bg-[#1B202A] pt-20 min-h-screen">
        <div className="container w-full">
          <BuyTokenModal
            isOpen={!!selectedToken}
            onClose={() => setSelectedToken(null)}
            token={selectedToken}
            onSwapToken={handleBuyToken}
          />

          <TokenTable
            tokens={tokens}
            handleBuyToken={(token: TokenType) => setSelectedToken(token)}
          />
        </div>
      </div>
    </div>
  );
}

export default BuyTokenApp;
