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

  /**
   * Fetch all chains which type is EVM
   * @returns {Promise<void>}
   */
  async function _getChains() {
    try {
      const _res: any[] = await getChains({ chainTypes: [ChainType.EVM] });
      if (_res && _res?.length > 0) {
        setChains(_res);
        setSelectedChain(_res[0]);
      }
    } catch (error) { }
  }

  /**
   * fetch tokens by chain type
   * @param {string} chainType - chain type
   * @returns {Promise<void>}
   */
  async function getTokensFilterByChainType(chainType: any) {
    try {
      const { tokens }: any = await getTokens({ chains: [chainType] });
      setTokens(tokens?.[chainType]);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Initiates the process to buy a token by interacting with various APIs and sending a transaction.
   *
   * @param {TokenType} token - The token object containing details such as chainId and address.
   * 
   * The function performs the following steps:
   * 1. Fetches wallet data from a specified API.
   * 2. Constructs a request body for a quote transaction and retrieves the quote from an external service.
   * 3. Prepares a request body for borrowing NFT metadata and sends it to an API.
   * 4. Sends a transaction using the data obtained from the quote response.
   * 
   * Logs various data throughout the process for debugging purposes.
   * Catches and logs any errors that occur during execution.
   */
  async function handleBuyToken(token: TokenType) {
    try {
      // get walletdata
      const mockWalletAddress = '0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929' //address
      const walletData = await fetchRequest({ url: `https://api.smoke.money/api/walletdata/${mockWalletAddress}`, model: "BorrowToken" });
      console.log("🚀 ~walletData:", walletData);

      // qoute transaction get info
      const qouteReqBody: any = {
        fromChain: 8453,
        toChain: 8453, //token.chainId,
        fromToken: "ETH",
        toToken: '0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92', //token?.address,
        fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0',
        fromAmount: 1000000000000000
      }

      // https://li.quest/v1/quote?fromChain=8453&toChain=8453&fromToken=ETH&toToken=0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92&
      // fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&fromAmount=1000000000000000

      const queryString = new URLSearchParams(qouteReqBody).toString();
      const quoteRes = await fetchRequest({ url: `https://li.quest/v1/quote?${queryString}`, model: "BorrowToken" })
      console.log("🚀 ~ quoteRes:", quoteRes);

      // 2. get nft meta data
      const borrowReqBody = {
        walletAddress: "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
        nftId: "3",
        amount: "100000000000",
        chainId: "30111",
        recipient: "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
      };

      console.log("🚀 ~ borrowReqBody:", borrowReqBody)

      const borrowRes = await fetchRequest({
        url: 'https://api.smoke.money/api/borrow', 
        body: borrowReqBody,
        method: "POST",
        model: "BorrowToken"
      })

      console.log("🚀 ~ borrowRes:", borrowRes)


      const sendTransactionRes = await sendTransactionAsync({
        data: quoteRes?.transactionRequest,
        to: "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        value: parseEther(token.amount),
      });

      console.log("🚀 ~ sendTransactionRes:", sendTransactionRes)

      // sendTransaction({
      //   to: "0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92",
      //   value: parseEther("0.01"),
      // });
    } catch (error) {

    }
  }

  /**
   * Handles the event of changing the selected blockchain network.
   * 
   * @param {any} _chain - The new chain object or identifier to switch to.
   * 
   * This function updates the selected blockchain network and resets the token list.
   */
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
            chain={selectedChain}
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
