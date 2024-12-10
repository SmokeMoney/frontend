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
import { getChainExplorer, getChainLendingAddress, getLZId, getNftAddress } from "./utils/chainMapping";
import { backendUrl, NFT } from "./CrossChainLendingApp";
import { toast } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";
import { ToastAction } from "./components/ui/toast";
import axios from "axios";
import { getBalance } from "viem/actions";

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
    // console.log("🚀 ~ BuyTokenApp ~ errWalletData:", errWalletData)
  const { wallets } = useWallets();
  const { sendTransaction, signMessage, signTypedData, ready } = usePrivy();

  const [chains, setChains] = useState<ChainTypes[]>([]);
  const [tokens, setTokens] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [isError, setIsError] = useState(false);
  const [listNFTs, setListNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT>();

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

  const fetchWalletData = async (address: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/walletdata/${address}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error === "Wallet not found") {
          console.log("Wallet not found");
          return [];
        }
      }
      console.error("Error fetching wallet data:", error);
      return [];
    }
  };

  function areNFTsDifferent(nft1: NFT, nft2: NFT): boolean {
    return JSON.stringify(nft1) !== JSON.stringify(nft2);
  }

  const mergeAndDeduplicateNFTs = (
    existingNFTs: NFT[],
    newNFTs: NFT[]
  ): NFT[] => {
    const combinedNFTs = [...existingNFTs, ...newNFTs];

    const nftMap = new Map<string, NFT>();

    combinedNFTs.forEach((nft) => {
      if (!nftMap.has(nft.id) || nft.owner) {
        nftMap.set(nft.id, nft);
      }
    });

    return Array.from(nftMap.values());
  };

  useEffect(() => {
    const fetchNFTsAndBalance = async () => {
      if (ready && address) {
        const fetchedNFTs: NFT[] = await fetchWalletData(
          addressToBytes32(address)
        );
        setListNFTs((prevNFTs) =>
          mergeAndDeduplicateNFTs(prevNFTs, fetchedNFTs)
        );

        if (
          fetchedNFTs.length > 0 &&
          (!selectedNFT || selectedNFT.id === "0")
        ) {
          console.log("Setting new selected NFT:", fetchedNFTs[0]);
          setSelectedNFT(fetchedNFTs[0]);
        }
        if (
          selectedNFT &&
          fetchedNFTs.length > 0 &&
          areNFTsDifferent(
            selectedNFT,
            fetchedNFTs.find((nft) => nft.id === selectedNFT.id) as NFT
          )
        ) {
          console.log("Setting new selected NFT: ASFbsajidfb", fetchedNFTs);
          setSelectedNFT(fetchedNFTs.find((nft) => nft.id === selectedNFT.id));
        }
      } else {
        console.log("Conditions not met for setting NFT");
      }
      // if (address) {
      //   const freshBalance = await getBalance(config, { address: address });
      //   setEthBalance(Number(formatEther(freshBalance.value)).toPrecision(4));
      // }
    };
    fetchNFTsAndBalance();
  }, [ready, address, selectedNFT]);

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
      const walletData = selectedNFT;
      if (!walletData ) {
        throw new Error("No wallet data found");
      }

      console.log("bi end bh esgui");
      console.log("selectedNFT", selectedNFT);

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

      const borrowSwapContract = {
        10: "0x9cA9D67f613c50741E30e5Ef88418891e254604d", // optimism
        42161: "0x3a771f2D212979363715aB06F078F0Fb4d6e96Cb", // arbitrum
        8453: "0x9b6f6F895a011c2C90857596A1AE2f537B097f52", // base
      };

      const borrowReqBody = {
        recipient: borrowSwapContract[selectedChain.id as keyof typeof borrowSwapContract],
        amount: parseEther(token.amount)?.toString(),
        walletAddress: bytes32Address,
        nftId: selectedNFT?.id?.toString(),
        chainId: getLZId(selectedChain.id).toString(),
        // failedBorrow: "0x3b662a7a24210788b8c13b0ce489a3fa658e44e0dcf8fd7d1c5bb1eab13e5b8b3f5fd650d675deef77e1864a9377efab0072e4297184767f9fa0866f22297e461b",
      };

      const borrowRes = await fetchRequest({
        url: `${backendUrl}/api/borrow`,
        body: borrowReqBody,
        method: "POST",
        model: "BorrowToken",
      });

      if (borrowRes?.status !== "borrow_approved") {
        console.log("borrowRes", borrowRes);
        throw new Error("Borrow not approved");
      }

      console.log("borrowRes", borrowRes);

      const issuerSignature = borrowRes?.signature;
      
      const nonce = BigInt(borrowRes?.nonce.hex).toString();

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
          nftId: selectedNFT?.id?.toString(),
          amount: borrowRes?.amount,
          timestamp: borrowRes?.timestamp,
          signatureValidity: 120,
          nonce: nonce,
          recipient: borrowSwapContract[selectedChain.id as keyof typeof borrowSwapContract],
        },
      });
      console.log("userSignature", userSignature);

      // Create contract interface
      const contractInterface = new ethers.Interface(BorrowAndSwapERC20);

      // Encode function data
      const unsignedTx = contractInterface.encodeFunctionData("borrowAndSwap", [
        {
          borrower: address,
          issuerNFT: getNftAddress() as `0x${string}`,
          nftId: selectedNFT?.id?.toString(),
          amount: borrowRes?.amount,
          timestamp: borrowRes?.timestamp,
          signatureValidity: 120,
          nonce: nonce,
          repayGas: 0,
          weth: false,
          recipient: borrowSwapContract[selectedChain.id as keyof typeof borrowSwapContract],
          integrator: 0
        },
        userSignature,
        issuerSignature,
        quoteRes?.transactionRequest.data
      ]);
      // Create the transaction request
      const txRequest = {
        to: borrowSwapContract[selectedChain.id as keyof typeof borrowSwapContract],
        data: unsignedTx,
        value: 0, // or parseEther("0")
        chainId: selectedChain.id
      };
      
      const txResponse = await sendTransaction(txRequest);
      console.log("txResponse", txResponse);

      toast({
        description: "Bought " + token.amount + " ETH worth of " + token.name,
        action: (
          <ToastAction altText="Try again">
            {" "}
            <a
              href={
                getChainExplorer(getLZId(selectedChain.id)) + "tx/" + txResponse?.transactionHash
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent toast from closing
            >
              View on Explorer
            </a>
          </ToastAction>
        ),
      });

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
              handleBuyToken(token );
            }}
            allowedChains={[10, 42161, 8453]}
          />
          
      <Toaster />
        </div>
      </div>
    </div>
  );
}

export default BuyTokenApp;
