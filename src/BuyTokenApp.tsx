import { getChains, getTokens } from "@lifi/sdk";
import { useWallets } from "@privy-io/react-auth";
import { useSendTransaction } from "wagmi";

import TokenTable, { TokenType } from "./components/TokenTable";
import BuyTokenModal from "./components/BuyTokenModal";
import ConnectWallet from "./components/ConnectWallet";

import { useEffect, useState } from "react";
import logo from "../public/logo4.png";
import { ChainType } from "@lifi/sdk";
import { parseEther } from "viem";
import { useApi } from "./components/ApiContextProvider";

function BuyTokenApp() {
  const { fetchRequest, isBorrowToken } = useApi()
  const { wallets } = useWallets();
  const { sendTransactionAsync } = useSendTransaction();

  const [chains, setChains] = useState<any>([]);
  const [tokens, setTokens] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [selectedToken, setSelectedToken] = useState<any>(null);

  const address = wallets?.length > 0 && wallets?.[0].address;

  /**
   * when connected wallet get all chain
   */
  useEffect(() => {
    if (wallets?.length > 0) {
      _getChains();
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
    } catch (error) { }
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
    try {
      // get walletdata
      const walletData = await fetchRequest({ url: `https://api.smoke.money/api/walletdata/${address}`, model: "BorrowToken" });

      console.log("🚀 ~ handleBuyToken ~ walletData:", walletData)
      // qoute transaction get info
      const qouteReqBody: any = {
        fromChain: 8453,
        toChain: token.chainId,
        fromToken: "ETH",
        toToken: token?.address,
        fromAddress: '0x9cb16f99eb162bf6f970791ba90bbf30c1cd1929',
        fromAmount: parseEther(token.amount)
      }

      console.log("🚀 ~ handleBuyToken ~ qouteReqBody:", qouteReqBody)

      const queryString = new URLSearchParams(qouteReqBody).toString();
      console.log("🚀 ~ handleBuyToken ~ queryString:", queryString)
      const quoteRes = await fetchRequest({ url: `https://li.quest/v1/quote?${queryString}`, model: "BorrowToken" })

      // 2. get nft meta data
      const borrowReqBody = {
        walletAddress: "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
        nftId: "3",
        amount: "100000000000",
        chainId: "30111",
        recipient: "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
      };
      console.log("🚀 ~ handleBuyToken ~ borrowReqBody:", borrowReqBody)

      const borrowRes = await fetchRequest({
        url: 'https://api.smoke.money/api/borrow', body: borrowReqBody,
        method: "POST",
        model: "BorrowToken"
      })

      console.log("🚀 ~ handleBuyToken ~ borrowRes:", borrowRes)


      const sendTransactionRes = await sendTransactionAsync({
        data: quoteRes?.transactionRequest,
        to: "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        value: parseEther(token.amount),
      });

      console.log("🚀 ~ handleBuyToken ~ sendTransactionRes:", sendTransactionRes)

      // sendTransaction({
      //   to: "0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92",
      //   value: parseEther("0.01"),
      // });
    } catch (error) {

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
            loading={isBorrowToken || false}
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
