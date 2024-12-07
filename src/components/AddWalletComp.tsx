import React, { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardBody, HStack, Link, Spinner } from "@chakra-ui/react";

import { backendUrl, NFT_CONTRACT_ADDRESS } from "@/CrossChainLendingApp";
import coreNFTRawAbi from "../abi/CoreNFTContract.abi.json";
import parseDumbAbis from "../abi/parsedCoreNFTAbi";
import axios from "axios";
import { Flex, VStack } from "@chakra-ui/react";
import { Label } from "./ui/label";
import CardFooterContent from "./custom/CardFooterContent";
import { addressToBytes32 } from "@/utils/addressConversion";
import { getChainName } from "@/utils/chainMapping";
import { Separator } from "./ui/separator";
const coreNFTAbi = parseDumbAbis(coreNFTRawAbi);

interface AddWalletProps {
  nftId: string;
  chainList: string[];
  updateDataCounter: number;
  setUpdateDataCounter: React.Dispatch<React.SetStateAction<number>>;
}

interface AutogasHashes {
  chainId: string;
  hash: string;
}

const AddWalletComp: React.FC<AddWalletProps> = ({
  nftId,
  chainList = [], // Provide a default empty array
  updateDataCounter,
  setUpdateDataCounter,
}) => {
  const { address } = useAccount();
  const [limit, setLimit] = useState("0.02");
  const [autogas, setAutogas] = useState(true);
  const [autogasConfig, setAutogasConfig] = useState<Record<string, boolean>>(
    {}
  );

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [autogasHashes, setAutogasHashes] = useState<AutogasHashes[]>([]);
  const [countdown, setCountdown] = useState(10);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  useEffect(() => {
    // const defaultAutogasChains = ['40231', '40161', '40232', '40245', '40287', '40243'];
    const defaultAutogasChains = ['40161', '40232', '40287', '40243'];
    // Initialize autogasConfig with false for each chain
    const initialConfig = chainList.reduce((acc, chain) => {
      // acc[chain] = !defaultAutogasChains.includes(chain);
      acc[chain] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setAutogasConfig(initialConfig);
  }, [chainList]);

  const handleAutogasChange = (chain: string, checked: boolean) => {
    setAutogasConfig((prev) => ({ ...prev, [chain]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !nftId || chainList.length === 0) return;

    const limits = chainList.map(() => parseEther(limit));
    const autogasConfigArray = chainList.map((chain) => autogasConfig[chain]);

    console.log("comparing addyes");
    console.log(chainList);
    console.log(addressToBytes32(walletAddress));

    writeContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: coreNFTAbi,
      functionName: "setHigherBulkLimits",
      args: [
        BigInt(nftId),
        addressToBytes32(walletAddress),
        chainList.map(BigInt),
        limits,
        autogasConfigArray,
      ],
    });
  };

  const updateLimitsData = async (nftId: string, walletAddress: string) => {
    try {
      const response = await axios.post(`${backendUrl}/api/updatelimits`, {
        nftId: nftId,
        walletAddress: walletAddress,
      });
      return response.data.status === "update_successful";
    } catch (error) {
      console.error("Error updating limits:", error);
      return false;
    }
  };

  const updateBackend = useCallback(async () => {
    if (isConfirmed && walletAddress !== "") {
      try {
        const status = await updateLimitsData(
          nftId.toString(),
          addressToBytes32(walletAddress)
        );
        if (status) {
          setUpdateDataCounter((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Failed to update backend:", error);
      }
    }
  }, [isConfirmed, nftId, walletAddress, setUpdateDataCounter]);

  useEffect(() => {
    if (isConfirmed) {
      const pollInterval = setInterval(() => {
        if (nftId) {
          updateBackend();
        }
      }, 4200);

      return () => clearInterval(pollInterval);
    }
  }, [isConfirmed, updateBackend, nftId]);

  useEffect(() => {
    if (error) {
      console.error("Mint error:", error.message);
    }
  }, [error]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConfirmed && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      window.location.reload();
    }
    return () => clearTimeout(timer);
  }, [isConfirmed, countdown]);

  return (
    <Flex justify="center" align="stretch" w="full" px={4}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="center"
        align="stretch"
        gap={16}
        w="full"
        px={40}
      >
        <VStack>
          <Card>
            <CardHeader>
              <CardTitle>Approve Your Wallet To Spend</CardTitle>
              <CardDescription>
                {/* Never worry about gas again.
                <p>Autogas refills your wallet soon as it </p>
                <p>goes below a certain threshold</p> */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* <div>
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      type="text"
                      value={walletAddress || ""}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="limit">Limit (ETH)</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div> */}
                  {/* <div>
                    <Label>Enable Autogas for Chains</Label>
                    <CardDescription>
                      (You can change this later)
                    </CardDescription>
                    {chainList.map((chain) => (
                      <div key={chain} className="flex items-center mt-2">
                        <HStack>
                          <Checkbox
                            id={`autogas-${chain}`}
                            checked={autogasConfig[chain]}
                            onCheckedChange={(checked) =>
                              handleAutogasChange(chain, checked as boolean)
                            }
                          />
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Label htmlFor={`autogas-${chain}`}>
                                {getChainName(Number(chain))}
                              </Label>
                            </HoverCardTrigger>
                            <HoverCardContent>
                              Autogas periodically checks your wallet balance on{" "}
                              {chain} and refills if it falls below a threshold.
                              Current set threshold: 0.001 ETH
                            </HoverCardContent>
                          </HoverCard>
                        </HStack>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <Label>Current Threshold: 0.001 ETH</Label> */}
                </div>
                <Button
                  type="submit"
                  className="mt-4"
                  disabled={
                    !address ||
                    isPending ||
                    isConfirming ||
                    chainList.length === 0
                  }
                >
                  {isPending
                    ? "Confirming..."
                    : isConfirming
                    ? "Processing..."
                    : "Approve"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <CardFooterContent isConfirmed={isConfirmed} error={error} />
            </CardFooter>
          </Card>
        </VStack>
      </Flex>
    </Flex>
  );
};

export default AddWalletComp;
