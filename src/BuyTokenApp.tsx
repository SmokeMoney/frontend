import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useSendTransaction } from "wagmi";
import { ChainType, getChains, getTokens } from "@lifi/sdk";
import { parseEther } from "viem";
import { BrowserProvider } from "ethers";

import { useApi } from "./components/ApiContextProvider";
import TokenTable, { TokenType } from "./components/TokenTable";
import BuyTokenModal from "./components/BuyTokenModal";
import ConnectWallet from "./components/ConnectWallet";
import logo from "../public/logo4.png";

function BuyTokenApp() {
  const { fetchRequest, isBorrowToken } = useApi();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const [chains, setChains] = useState<any>([]);
  const [tokens, setTokens] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [selectedToken, setSelectedToken] = useState<any>(null);

  const address = (wallets?.length > 0 && wallets?.[0].address) || "";

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
    } catch (error) {}
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
    console.log(token);
    if (!token || !token.amount || !token.address) {
      console.error("Invalid token data");
      return;
    }

    try {
      const cleanAddress = address.replace(/^0x/, "").toLocaleLowerCase();
      const paddedAddress = "0x" + cleanAddress.padStart(64, "0");

      const walletData = await fetchRequest({
        url: `https://mainnet.smoke.money/api/walletdata/${paddedAddress}`,
        model: "BorrowToken",
      });

      if (!walletData || walletData.length === 0) {
        throw new Error("No wallet data found");
      }

      const qouteReqBody: any = {
        fromToken: "ETH",
        toChain: token.chainId,
        toToken: token?.address,
        fromAddress: address,
        fromChain: selectedChain.id,
        fromAmount: parseEther(token.amount)?.toString(),
      };

      const queryString = new URLSearchParams(qouteReqBody).toString();

      const quoteRes = await fetchRequest({
        url: `https://li.quest/v1/quote?${queryString}`,
        model: "BorrowToken",
      });

      if (!quoteRes?.transactionRequest) {
        throw new Error("No transaction request found in quote");
      }

      const borrowReqBody = {
        recipient: paddedAddress,
        amount: parseEther(token.amount)?.toString(),
        walletAddress: paddedAddress,
        nftId: walletData[0].id?.toString(),
        chainId: "30111",
      };

      const borrowRes = await fetchRequest({
        url: "https://mainnet.smoke.money/api/borrow",
        body: borrowReqBody,
        method: "POST",
        model: "BorrowToken",
      });

      if (borrowRes?.status !== "borrow_approved") {
        throw new Error("Borrow not approved");
      }

      const provider = new BrowserProvider(window.ethereum); // Use BrowserProvider instead
      const signer = await provider.getSigner();

      const txResponse = await signer.sendTransaction(
        quoteRes?.transactionRequest
      );

      return txResponse;
    } catch (error) {
      console.error("Token purchase failed:", error);
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
