import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSendTransaction } from "wagmi";
import { ChainType, getChains, getTokens } from "@lifi/sdk";
import { parseEther } from "viem";
import { BrowserProvider, ethers } from "ethers";
import { PrivyProvider } from "@privy-io/react-auth";

import { useApi } from "./components/ApiContextProvider";
import TokenTable, { TokenType } from "./components/TokenTable";
import BuyTokenModal from "./components/BuyTokenModal";
import ConnectWallet from "./components/ConnectWallet";
import logo from "../public/logo4.png";
import { set } from "idb-keyval";
import { addressToBytes32 } from "./utils/addressConversion";
import BorrowAndSwapERC20 from "./abi/BorrowAndSwapERC20.json";
import { getChainLendingAddress, getLZId, getNftAddress } from "./utils/chainMapping";

export interface ChainTypes {
  key: string;
  chainType: string;
  name: string;
  coin: string;
  id: number;
  mainnet: boolean;
  logoURI: string;
  tokenlistUrl: string;
  multicallAddress: string;
  metamask: {
    chainId: string;
    blockExplorerUrls: string[];
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
  };
  nativeToken: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    name: string;
    coinKey: string;
    logoURI: string;
    priceUSD: string;
  };
  diamondAddress: string;
  permit2: string;
  permit2Proxy: string;
}

function BuyTokenApp() {
  const {
    fetchRequest,
    isWalletData,
    resWalletData,
    errWalletData,
    isQoute,
    resQoute,
    errQoute,
    isBorrowToken,
    resBorrowToken,
    errBorrowToken,
    // isWalletData,
    // resWalletData,
    // errWalletData,
    clearModelValue,
  } = useApi();
    console.log("🚀 ~ BuyTokenApp ~ errWalletData:", errWalletData)
  const { wallets } = useWallets();
  const { sendTransaction, signMessage, signTypedData } = usePrivy();

  const [chains, setChains] = useState<ChainTypes[]>([]);
  const [tokens, setTokens] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [isError, setIsError] = useState(false);

  const address = (wallets?.length > 0 && wallets?.[0].address) || "";

  /**
   * when connected wallet get all chain
   */
  useEffect(() => {
    _getChains();
  }, []);

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
      const _res: ChainTypes[] | null = await getChains({
        chainTypes: [ChainType.EVM],
      });
      if (_res && _res?.length > 0) {
        setChains(_res);
        const optimismChain = _res.find(chain => chain.id === 10);
        setSelectedChain(optimismChain || _res[0]);
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
   * Clears the model values in the state.
   */
  function clearModels() {
    clearModelValue("WalletData");
    clearModelValue("Qoute");
    clearModelValue("BorrowToken");
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
    if (!token || !token.amount || !token.address) {
      console.log("Invalid token data", token);
      console.error("Invalid token data");
      setIsError(true);
      return;
    }

    try {
      setIsError(false);

      const bytes32Address = addressToBytes32(address);

      const walletData = await fetchRequest({
        url: `https://mainnet.smoke.money/api/walletdata/${bytes32Address}`,
        model: "WalletData",
      });

      if (!walletData || walletData.length === 0 || walletData.error) {
        throw new Error("No wallet data found");
      }

      console.log("bi end bh esgui");

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
        model: "Qoute",
      });

      if (!quoteRes?.transactionRequest) {
        throw new Error("No transaction request found in quote");
      }

      const borrowReqBody = {
        recipient: bytes32Address,
        amount: parseEther(token.amount)?.toString(),
        walletAddress: bytes32Address,
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
        console.log("borrowRes", borrowRes);
        throw new Error("Borrow not approved");
      }

      const provider = await wallets[0].getEthereumProvider();
      const borrowSwapContract = "0x9cA9D67f613c50741E30e5Ef88418891e254604d"; // optimism
      const issuerSignature = borrowRes?.signature;
      
      const userSignature = await signTypedData({
        domain: {
          name: "SmokeSpendingContract",
          version: "1",
          chainId: selectedChain.id,
          verifyingContract: getChainLendingAddress(getLZId(selectedChain.id)),
        },
        types: {
          Borrow: [
            { name: "borrower", type: "address" },
            { name: "issuerNFT", type: "address" },
            { name: "nftId", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "timestamp", type: "uint256" },
            { name: "signatureValidity", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "recipient", type: "address" },
          ],
        },
        primaryType: "Borrow",
        message: {
          borrower: address,
          issuerNFT: getNftAddress() as `0x${string}`,
          nftId: walletData[0].id?.toString(),
          amount: parseEther(token.amount),
          timestamp: borrowRes?.timestamp,
          signatureValidity: 120,
          nonce: borrowRes?.nonce,
          recipient: borrowSwapContract,
        },
      });

      // Create contract interface
      const contractInterface = new ethers.Interface(BorrowAndSwapERC20);

      // Encode function data
      const unsignedTx = contractInterface.encodeFunctionData("borrowAndSwap", [
        {
          borrower: address,
          issuerNFT: getNftAddress() as `0x${string}`,
          nftId: walletData[0].id?.toString(),
          amount: borrowRes?.amount,
          timestamp: borrowRes?.timestamp,
          signatureValidity: 120,
          nonce: borrowRes?.nonce,
          repayGas: 0,
          weth: false,
          recipient: borrowSwapContract,
          integrator: 0
        },
        userSignature,
        issuerSignature,
        quoteRes?.transactionRequest.data
      ]);

      // Create the transaction request
      const txRequest = {
        to: borrowSwapContract,
        data: unsignedTx,
        value: "0", // or parseEther("0")
        chainId: selectedChain.id
      };

      const txResponse = await sendTransaction(txRequest);
      console.log("txResponse", txResponse);

      return txResponse;
    } catch (error) {
      setIsError(true);
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
      <div className="absolute w-full bg-[#171821] shadow-xl">
        <header>
          <div className="mx-auto flex flex-row items-center justify-between p-2">
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

      <div className="bg-[#0F1018] pt-20 min-h-screen">
        <div className="w-full px-10 md:px-10">
          <BuyTokenModal
            isOpen={!!selectedToken}
            onClose={() => setSelectedToken(null)}
            token={selectedToken}
            onSwapToken={handleBuyToken}
            error={isError}
            clearModel={clearModels}
            loading={[
              {
                loading: isWalletData,
                success: resWalletData,
                error: errWalletData, //isWalletData, resWalletData, errWalletDate
              },
              {
                loading: isQoute,
                success: resQoute,
                error: errQoute,
              },
              {
                loading: isBorrowToken,
                success: resBorrowToken,
                error: errBorrowToken,
              },
              // {
              //   loading: false,
              //   // success: false,
              //   // error: "Hello",
              // },
            ]}
            chain={selectedChain}
          />

          <TokenTable
            tokens={tokens}
            chains={chains || []}
            selectedChain={selectedChain}
            setSelectedChain={handleChangeChain}
            handleBuyToken={(token: TokenType) => {
              setSelectedToken(token);
              handleBuyToken(token);
            }}
            allowedChains={[10, 42161, 8453]}
          />
        </div>
      </div>
    </div>
  );
}

export default BuyTokenApp;
