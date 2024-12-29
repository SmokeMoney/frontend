import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ChainType, getChains, getTokens } from "@lifi/sdk";
import { parseEther } from "viem";
import { ethers } from "ethers";
import { createPublicClient, http } from 'viem'

import { useApi } from "./components/ApiContextProvider";
import TokenTable, { TokenType } from "./components/TokenTable";
import ConnectWallet from "./components/ConnectWallet";
import logo from "../public/logo4.png";
import { addressToBytes32 } from "./utils/addressConversion";
import BorrowAndSwapERC20 from "./abi/BorrowAndSwapERC20.json";
import { getChainExplorer, getChainLendingAddress, getLZId, getNftAddress } from "./utils/chainMapping";
import { backendUrl, NFT } from "./CrossChainLendingApp";
import { toast } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";
import { ToastAction } from "./components/ui/toast";
import axios from "axios";
import { getBalance } from "viem/actions";
import { requestGaslessBorrow } from "./utils/borrowUtils";
import spendingRawAbi from "./abi/SmokeSpendingContract.abi.json";
import { Flex } from "@chakra-ui/react";
import SmokeCard from "./components/SmokeCard";
import getTopTokens from "./utils/dexRabbitUtils";

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
    fetchRequest
  } = useApi();
  
  const { wallets } = useWallets();
  const { sendTransaction, signTypedData, ready, authenticated } = usePrivy();

  const [chains, setChains] = useState<ChainTypes[]>([]);
  const [allTokens, setAllTokens] = useState<any>([]);
  const [tokens, setTokens] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  // const [listNFTs, setListNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT>();
  const [updateDataCounter, setUpdateDataCounter] = useState<number>(0);
  const [alreadyApproved, setAlreadyApproved] = useState<boolean>(false);

  const allowedChains = [10, 42161, 8453];
  const address = (wallets?.length > 0 && wallets?.[0].connectorType === "embedded" && wallets?.[0].address) || "";
  const [lendingAddress, setLendingAddress] = useState<
    `0x${string}` | undefined
  >(undefined);

  useEffect(() => {
    _getChains();
    getAllTokens();
  }, []);

  useEffect(() => {
    if (selectedChain && selectedChain.id !== 0) {
      setTokens(allTokens[selectedChain.id]);
    } else {
      const combinedTokens = Object.values(allTokens).flat();
      setTokens(combinedTokens);
    }
  }, [selectedChain, allTokens]);

  useEffect(() => {
    if (ready && !authenticated) {
      if (wallets[0]) {
        wallets[0].loginOrLink();
      }
    }
  }, [ready, authenticated, wallets]);

  useEffect(() => {
    if (selectedNFT) {
      const totalLimit = BigInt(
        Object.entries(selectedNFT?.chainLimits ?? {}).reduce(
          (sum: number, [, amount]) => sum + parseFloat(amount),
          0
        )
      );
      setAlreadyApproved(totalLimit > 0);
    } else {
      setAlreadyApproved(false);
    }
  }, [selectedNFT]);

  async function getAllTokens() {
    const { tokens }: any = await getTokens({ chains: allowedChains });
    setAllTokens(tokens);
    const topTokens = await getTopTokens("base", "2024-12-26T12:43:20Z");
    console.log("topTokens", topTokens);
  }

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
          setSelectedNFT(undefined);
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

  const fetchAndRefillBalance = async (selectedChain: any) => {
    if (address && selectedNFT && alreadyApproved) {
      const client = createPublicClient({ 
        transport: http(selectedChain.metamask.rpcUrls[0]),
        chain: {
          id: selectedChain.id,
          name: selectedChain.name,
          network: selectedChain.name.toLowerCase(),
          nativeCurrency: selectedChain.metamask.nativeCurrency,
          rpcUrls: {
            default: { http: selectedChain.metamask.rpcUrls },
            public: { http: selectedChain.metamask.rpcUrls },
          },
        }
      });
      
      try {
        const freshBalance = await getBalance(client, { 
          address: address as `0x${string}`
        });
        if (freshBalance < parseEther("0.00005")) {
          try {
            setLendingAddress(getChainLendingAddress(getLZId(selectedChain.id)))
            const nonce = await client.readContract({
              address: lendingAddress as `0x${string}`,
              abi: spendingRawAbi,
              functionName: 'getCurrentNonce',
              args: [
                lendingAddress,
                selectedNFT?.id ? BigInt(selectedNFT.id) : BigInt(0)
              ],
            });
            
            if (nonce !== undefined) {
              const timestamp = BigInt(Math.floor(Date.now() / 1000));
              const gasAmount = parseEther("0.0001");
              const signatureValidity = BigInt(120); // 2 minutes
              try {
                if (!address || nonce == undefined) return null;
                const signature = await signTypedData({
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
                    amount: gasAmount.toString(),
                    timestamp: timestamp.toString(),
                    signatureValidity: signatureValidity.toString(),
                    nonce: nonce.toString(),
                    recipient: address,
                  },
                });
                if (typeof signature === "string") {
                  toast({
                    title: "Refilling gas on " + selectedChain.name + "...",
                    description: "processing",
                  });
                  if (!address || !selectedNFT || !gasAmount) return null;
                  
                  const result = await requestGaslessBorrow(
                    address,
                    selectedNFT.id.toString(),
                    gasAmount.toString(),
                    timestamp.toString(),
                    getLZId(selectedChain.id).toString(),
                    address,
                    signature,
                    false,
                    0,
                    true
                  );
          
                  if (result) {
                    if (result.status === "borrow_approved") {
                      toast({
                        description: "Gas refilled successfully",
                        action: (
                          <ToastAction altText="View on Explorer">
                            <a
                              href={
                                getChainExplorer(getLZId(selectedChain.id)) + "tx/" + result.hash
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on Explorer
                            </a>
                          </ToastAction>
                        ),
                      });
                    } else {
                      toast({
                        description: result.status === "not_enough_limit" 
                          ? "Borrow Failed: You don't have enough borrow limit"
                          : result.status === "insufficient_issuer_balance"
                          ? "Borrow unavailable right now"
                          : result.status === "invalid_signature"
                          ? "Your previous txn was still processing, try again. If it repeats, reach out via Discord."
                          : "Unknown error, please reach out via Discord",
                      });
                    }
                  } else {
                    throw new Error(
                      "Failed to get transaction hash from gasless borrow"
                    );
                  }
                } else {
                  throw new Error("Failed to sign message");
                }
              } catch (signError) {
                if (signError instanceof Error) {
                  if (signError.message.includes("User rejected the request")) {
                    toast({ description: "Signature request was rejected" });
                  } else {
                    toast({
                      description: "Failed to sign message: " + signError.message,
                    });
                  }
                } else {
                  toast({ description: "An unknown error occurred during signing" });
                }
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching nonce:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      if (ready && authenticated && address) {
        const fetchedNFTs: NFT[] = await fetchWalletData(
          addressToBytes32(address)
        );
        if (
          fetchedNFTs.length > 0 &&
          (!selectedNFT || selectedNFT.id === "0")
        ) {
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
          console.log("selectedNFT HERHEHROIASNFOD", selectedNFT);
          setSelectedNFT(
            fetchedNFTs.find((nft) => nft.id === selectedNFT.id)
          );
        }
      }
    };

    const runEffects = async () => {
      if (selectedChain && selectedChain?.id !== 0) {
        await fetchAndRefillBalance(selectedChain);
      }
      fetchNFTs();
    };

    runEffects();
  }, [ready, address, selectedNFT, selectedChain, lendingAddress, authenticated, updateDataCounter]);
 
  async function _getChains() {
    try {
      const _res = await getChains({
        chainTypes: [ChainType.EVM],
      });
      if (_res && _res?.length > 0) {
        setChains(_res.filter(chain => chain.logoURI) as ChainTypes[]);
        const baseChain = _res.find(chain => chain.id === 8453);
        setSelectedChain(baseChain || _res[0]);
      }
    } catch (error) {}
  }

  /**
   * Attempts to buy a token and shows toast notifications for success/failure.
   * On success, displays a link to the explorer.
   * On failure, allows "Try again" action which re-attempts the purchase.
   */
  async function handleBuyToken(token: TokenType) {
    if (!token || !token.amount || !token.address) {
      console.error("Invalid token data");
      toast({
        description: `Invalid token data.`,
        variant: "destructive",
      });
      return;
    }
  
    try {
  
      const bytes32Address = addressToBytes32(address);
      const walletData = selectedNFT;
      if (!walletData) {
        throw new Error("No wallet data found");
      }
  
      const borrowSwapContract = {
        10: "0x9cA9D67f613c50741E30e5Ef88418891e254604d", // optimism
        42161: "0x3a771f2D212979363715aB06F078F0Fb4d6e96Cb", // arbitrum
        8453: "0x9b6f6F895a011c2C90857596A1AE2f537B097f52", // base
      };
  
      // Step 1: Fetching Quote
      toast({
        description: `Fetching quote to buy...`,
      });
  
      const qouteReqBody: any = {
        fromToken: "ETH",
        toChain: token.chainId,
        toToken: token?.address,
        fromAddress: borrowSwapContract[token.chainId as keyof typeof borrowSwapContract],
        toAddress: address,
        fromChain: token.chainId,
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
  
      // Borrow request body
      const borrowReqBody = {
        recipient: borrowSwapContract[token.chainId as keyof typeof borrowSwapContract],
        amount: parseEther(token.amount)?.toString(),
        walletAddress: bytes32Address,
        nftId: selectedNFT?.id?.toString(),
        chainId: getLZId(token.chainId).toString(),
        freshNonce: true,
      };
  
      const borrowRes = await fetchRequest({
        url: `${backendUrl}/api/borrow`,
        body: borrowReqBody,
        method: "POST",
        model: "BorrowToken",
      });
  
      if (borrowRes?.status !== "borrow_approved") {
        throw new Error("Borrow not approved");
      }
  
      const issuerSignature = borrowRes?.signature;
      const nonce = BigInt(borrowRes?.nonce.hex ?? borrowRes?.nonce).toString();
  
      const userSignature = await signTypedData({
        domain: {
          name: "SmokeSpendingContract",
          version: "1",
          chainId: token.chainId,
          verifyingContract: getChainLendingAddress(getLZId(token.chainId)),
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
          recipient: borrowSwapContract[token.chainId as keyof typeof borrowSwapContract],
        },
      });
  
      const contractInterface = new ethers.Interface(BorrowAndSwapERC20);
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
          recipient: borrowSwapContract[token.chainId as keyof typeof borrowSwapContract],
          integrator: 0
        },
        userSignature,
        issuerSignature,
        quoteRes?.transactionRequest.data
      ]);
   
      const txRequest = {
        to: borrowSwapContract[token.chainId as keyof typeof borrowSwapContract],
        data: unsignedTx,
        value: 0,
        chainId: token.chainId
      };
  
      // Step 2: Submitting Transaction
      toast({
        description: `Submitting transaction...`,
      });
  
      const txResponse = await sendTransaction(txRequest);
      console.log("txResponse", txResponse);
      // Step 3: Transaction Successful
      toast({
        description: `Transaction Successful, bought ${token.amount} worth of ${token.symbol}`,
        action: (
          <ToastAction altText="View on Explorer">
            <a
              href={
                getChainExplorer(getLZId(token.chainId)) + "tx/" + txResponse?.transactionHash
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              View on Explorer
            </a>
          </ToastAction>
        ),
      });
  
      return txResponse;
    } catch (error: any) {
      if (error?.message.includes("Wallet has insufficient funds for this transaction")) {
        const currentChain = chains.find(chain => chain.id === token.chainId);
        toast({ description: "Gas low on "+ currentChain?.name + ". Refilling gas..." });
        await fetchAndRefillBalance(currentChain);
        await handleBuyToken(token);
      } else {
        toast({
            description: `Token purchase failed: ${error?.message || "Unknown error"}`,
            variant: "destructive",
            action: (
            <ToastAction
              altText="Try again"
              onClick={() => handleBuyToken(token)}
            >
              Try again
            </ToastAction>
          ),
        });
        console.error("Token purchase failed:", error);
      }
    }
  }
  

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

            <Flex flexDirection="row" justifyContent="center" alignItems="center">
              <SmokeCard
                ready={ready}
                selectedNFT={selectedNFT!} 
                address={address}
                selectedChain={selectedChain}
                setUpdateDataCounter={setUpdateDataCounter}
              />
              <ConnectWallet/>
            </Flex>
          </div>
        </header>
      </div>

      <div className="bg-[#0F1018] pt-20 min-h-screen">
        <div className="w-full px-10 md:px-10">
          {/* Removed BuyTokenModal */}

          <TokenTable
            tokens={tokens}
            chains={chains || []}
            selectedChain={selectedChain}
            setSelectedChain={handleChangeChain}
            handleBuyToken={(token: TokenType) => {
              handleBuyToken(token);
            }}
            allowedChains={allowedChains}
          />

          <Toaster />
        </div>
      </div>
    </div>
  );
}

export default BuyTokenApp;
