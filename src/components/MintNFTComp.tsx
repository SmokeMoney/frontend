import React, { FormEvent, useCallback, useEffect, useState } from "react";
import {
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContracts,
  useReadContract,
} from "wagmi";
import { Address, parseEther } from "viem";
import { arbitrumSepolia, base, baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Flex, HStack, Spinner, VStack } from "@chakra-ui/react";

// You'll need to import your ABI here\
import coreNFTRawAbi from "../abi/CoreNFTContract.abi.json";
import parseDumbAbis from "../abi/parsedCoreNFTAbi";
import { ChevronDownIcon } from "lucide-react";
import { Separator } from "./ui/separator";
import { backendUrl, NFT_CONTRACT_ADDRESS } from "@/CrossChainLendingApp";
import axios from "axios";
import { getChainExplorer, getLZId } from "@/utils/chainMapping";
const coreNFTAbi = parseDumbAbis(coreNFTRawAbi);

const MintNFTComp: React.FC<{
  ethBalance: string;
  updateDataCounter: number;
  setUpdateDataCounter: any;
}> = ({ ethBalance, updateDataCounter, setUpdateDataCounter }) => {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const [faucetHash, setFaucetHash] = useState<string>("");
  const [oldBalance, setOldBalance] = useState<number>(0);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const switchToAdminChain = async () => {
    switchChain({ chainId: base.id });
  };

  async function handleMint(e: any) {
    e.preventDefault();
    setOldBalance(balance);
    writeContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: coreNFTAbi,
      functionName: "mint",
      args: [0],
      value: parseEther("0.002"),
    });
  }
  const getTestnetETH = async () => {
    try {
      setFaucetHash("0xLoading");
      const response = await axios.post(`${backendUrl}/api/testnet-faucet`, {
        walletAddress: address,
      });
      if (response.data.status === "funding_successful") {
        setFaucetHash(response.data.transactionHash);
      } else if (response.data.status === "has_sufficient_balance") {
        setFaucetHash("0x");
      }
    } catch (error) {
      console.error("Error getting testnet ETH:", error);
      return null;
    }
  };

  const handleBridgeClick = (source: string) => {
    const url =
      source === "ethereum"
        ? "https://bridge.arbitrum.io/"
        : "https://jumper.exchange/?toChain=42161&toToken=0x0000000000000000000000000000000000000000";
    window.open(url, "_blank");
  };

  const updateNFTDataBackend = async (nftId: string) => {
    const response = await axios.post(`${backendUrl}/api/updatenft`, {
      nftId: nftId,
      chainId: getLZId(chainId).toString(),
    });
    console.log(response);
    return response.data.status === "update_successful";
  };

  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: coreNFTAbi,
    functionName: "balanceOf",
    args: [address as Address],
  });
  const balance = balanceData ? Number(balanceData) : 0;

  const { data: nftId, refetch: refetchNftId } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: coreNFTAbi,
    functionName: "tokenOfOwnerByIndex",
    args: [address as Address, balance - 1],
  });

  const updateBackend = useCallback(async () => {
    if (isConfirmed && nftId && balanceData) {
      if (balance !== oldBalance) {
        try {
          const status = await updateNFTDataBackend(nftId.toString());
          if (status) {
            setUpdateDataCounter(updateDataCounter + 1);
          }
        } catch (error) {
          console.error("Failed to update backend:", error);
        }
      }
    }
  }, [isConfirmed, nftId, balanceData, balance]);

  useEffect(() => {
    if (isConfirmed) {
      const pollInterval = setInterval(() => {
        refetchBalance();
        refetchNftId();
        if (nftId) {
          updateBackend();
          return () => clearInterval(pollInterval);
        }
      }, 4200); // Poll every 4.20 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isConfirmed, refetchBalance, refetchNftId, updateBackend]);

  useEffect(() => {
    if (error) {
      console.error("Mint error:", error.message);
    }
  }, [error]);


  return (
    <div>
      <Flex justify="center" align="stretch" w="full" px={4}>
        <Flex justify="space-between" align="start" w="full" maxW="900px">
          <VStack spacing={4} align="stretch">
            <Card>
              <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription className="fontSizeLarge">
                  Your NFT is your credit card account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div></div>
                Mint Price: 0.002 ETH
                <div></div>
                <HoverCard>
                  <HoverCardTrigger>
                    Native Credit: 0.002 ETH (!)
                  </HoverCardTrigger>
                  <HoverCardContent>
                    This is a built in native credit you get to spend on any
                    chain.
                  </HoverCardContent>
                </HoverCard>
              </CardContent>
              <CardFooter>
                <Flex direction="column" width="100%">
                  <Flex justify="space-between" wrap="wrap" gap={2}>
                    {!isConnected ? (
                      <ConnectButton />
                    ) : base.id === chainId ? (
                      <Button
                        onClick={handleMint}
                        disabled={isPending || isConfirming}
                        className="flex-grow"
                      >
                        {isPending
                          ? "Confirming..."
                          : isConfirming
                          ? "Processing..."
                          : "Mint"}
                      </Button>
                    ) : (
                      <Button
                        onClick={switchToAdminChain}
                        className="flex-grow"
                      >
                        Switch to Base
                      </Button>
                    )}
                    <Separator orientation="vertical" />
                    {false ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            className="flex-grow"
                            disabled
                          >
                            Bridge to Base{" "}
                            <ChevronDownIcon className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleBridgeClick("ethereum")}
                          >
                            Bridge from Ethereum
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBridgeClick("anywhere")}
                          >
                            Bridge from anywhere
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      ""
                    )}
                  </Flex>
                </Flex>
              </CardFooter>

              {error && (
                <div>
                  Error:{" "}
                  {error.message.includes(
                    "The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account"
                  )
                    ? "Not enough balance to mint. Get from the faucet below. "
                    : error.message}
                </div>
              )}
              {isConfirmed && (
                <Flex padding={20}>
                  {/* <VStack> */}
                  {/* <HStack> */}
                  Transaction confirmed! Indexing, pls wait...
                  <Spinner color="red.500" size="xl" />
                  {/* </HStack> */}
                  {/* </VStack> */}
                  {/* <LoadingAnimation /> */}
                </Flex>
              )}
            </Card>
            {import.meta.env.VITE_NODE_ENV === "testnet" ? (
              <Card style={{ flex: 1, padding: 12 }}>
              <CardHeader>
                <CardTitle>Base Testnet Faucet</CardTitle>
              </CardHeader>
              <CardContent>
                <div color="grey">(Balance: {ethBalance ?? 0} ETH)</div>
              </CardContent>
              <CardFooter>
                <Flex>
                  <VStack>
                    <Button
                      onClick={getTestnetETH}
                      disabled={address ? false : true}
                    >
                      Get 0.021 ETH
                    </Button>
                    <div>
                      {faucetHash == "0x" ? (
                        "Already Funded."
                      ) : faucetHash == "" ? (
                        ""
                      ) : faucetHash == "0xLoading" ? (
                        <Flex>
                          <div>Funding...</div>
                          <Spinner color="red.500" size="xl" />
                        </Flex>
                      ) : (
                        <>
                          {"You've been"}{" "}
                          <a
                            href={
                              getChainExplorer(getLZId(chainId)) +
                              "tx/" +
                              faucetHash
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "blue",
                              textDecoration: "underline",
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent toast from closing
                          >
                            Funded.
                          </a>
                        </>
                      )}
                    </div>
                  </VStack>
                </Flex>
              </CardFooter>
              </Card>
            ) : (
              ""
            )}
          </VStack>
        </Flex>
      </Flex>
    </div>
  );
};

export default MintNFTComp;
