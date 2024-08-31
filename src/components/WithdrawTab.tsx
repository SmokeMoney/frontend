import React, { useState, useEffect, useMemo } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { formatEther, parseEther } from "viem";
import { Address } from "viem";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import HandleBorrow from "./HandleBorrow";
import { getChainName, getLZId, chains, getLegacyId } from "../utils/chainMapping";
import { NFT, PositionData } from "../CrossChainLendingApp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { addressToBytes32 } from "@/utils/addressConversion";

interface WithdrawTabProps {
  selectedNFT: NFT | undefined;
  address: Address | undefined;
  ethBalance: string;
  ethPrice: string;
  updateDataCounter: number;
  setUpdateDataCounter: React.Dispatch<React.SetStateAction<number>>;
  totalWethDeposits: bigint;
  totalWstEthDeposits: bigint;
  wstETHRatio: string;
}

const WithdrawTab: React.FC<WithdrawTabProps> = ({
  selectedNFT,
  address,
  ethBalance,
  ethPrice,
  updateDataCounter,
  setUpdateDataCounter,
  totalWethDeposits,
  totalWstEthDeposits,
  wstETHRatio,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0.00042");
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState<string>(
    getLZId(chainId).toString() ?? "1"
  );

  const walletBorrowPositions = useMemo(
    () =>
      selectedNFT?.borrowPositions?.find(
        (position) => position.walletAddress === addressToBytes32(address??"" as `0x${string}`)
      )?.borrowPositions ?? [],
    [selectedNFT, address, updateDataCounter]
  );

  const totalDeposits = useMemo(
    () =>
      totalWethDeposits +
      (totalWstEthDeposits * BigInt(wstETHRatio)) / parseEther("1"),
    [totalWethDeposits, totalWstEthDeposits, wstETHRatio]
  );

  const availableToBorrow = useMemo(
    () =>
      (totalDeposits * BigInt(90)) / BigInt(100) +
      BigInt(selectedNFT?.nativeCredit ?? "0") -
      BigInt(selectedNFT?.totalBorrowPosition ?? 0),
    [totalDeposits, selectedNFT]
  );

  const calculateAvailable = (chainId: string, limit: string) => {
    const chainBorrowAmount = BigInt(
      walletBorrowPositions.find((position) => position.chainId === chainId)
        ?.amount ?? "0"
    );
    const chainLimit = BigInt(limit);
    const chainAvailable = chainLimit - chainBorrowAmount;
    const minLimits =
      chainAvailable > availableToBorrow ? availableToBorrow : chainAvailable;
    return BigInt(minLimits);
  };

  const selectedChainAvailable = useMemo(() => {
    if (selectedNFT?.chainLimits && selectedChain in selectedNFT.chainLimits) {
      return calculateAvailable(
        selectedChain,
        selectedNFT.chainLimits[selectedChain]
      );
    }
    return BigInt(0);
  }, [
    selectedChain,
    selectedNFT?.chainLimits,
    walletBorrowPositions,
    availableToBorrow,
  ]);


  const switchToChain = async (newChainId: any) => {
    switchChain({ chainId: newChainId });
  };

  useEffect(() => {
    const selChain = getLegacyId(Number(selectedChain));
    if (selChain !== chainId) {
      switchToChain(selChain)
    }
  }, [selectedChain]);

  return (
    <div className="tab-content">
      {selectedNFT && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Withdraw</CardTitle>
            <CardDescription className="text-xl">
              Withdraw {selectedChain === "40291" ? "BERA" : "ETH"} on{" "}
              {getChainName(Number(selectedChain))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VStack align="stretch" spacing={8}>
              <Box>
                <Text className="font-semibold mb-2 text-lg">Select Chain</Text>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="text-lg py-6 px-4 min-w-[200px]">
                      <span className="mr-2">{getChainName(Number(selectedChain))}</span>
                      <ChevronDownIcon className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {Object.entries(selectedNFT?.chainLimits ?? {}).map(
                      ([chainId2, _]) => (
                        <DropdownMenuItem
                          key={chainId2}
                          onClick={() => setSelectedChain(chainId2)}
                          className="text-lg py-3"
                        >
                          {getChainName(Number(chainId2))}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Box>
              
              <Box>
                <Text className="font-semibold mb-2 text-lg">Chain Information</Text>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" className="text-lg">
                    <Text>Available to Withdraw:</Text>
                    <Text className="font-semibold">
                      {Number(formatEther(selectedChainAvailable)).toPrecision(4)}{" "}
                      {selectedChain === "40291" ? "BERA" : "ETH"}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" className="text-lg">
                    <Text>Interest rate:</Text>
                    <Text className="font-semibold">5%</Text>
                  </HStack>
                  {/* <HStack justify="space-between" className="text-lg">
                    <Text>Balance:</Text>
                    <Text className="font-semibold">{ethBalance} {selectedChain === "40291" ? "BERA" : "ETH"}</Text>
                  </HStack> */}
                </VStack>
              </Box>

              <Box>
                <Text className="font-semibold mb-2 text-lg">Withdraw Amount</Text>
                <HStack>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-grow text-lg py-6"
                  />
                  <Text className="w-20 text-center text-lg">
                    {selectedChain === "40291" ? "BERA" : "ETH"}
                  </Text>
                </HStack>
                <Text className="text-base text-gray-500 mt-2">
                  (${(Number(ethPrice) * Number(withdrawAmount)).toPrecision(5)})
                </Text>
              </Box>
            </VStack>
          </CardContent>
          <CardFooter>
            <HandleBorrow
              selectedNFT={selectedNFT}
              withdrawAmount={withdrawAmount}
              chainId={chainId}
              selectedChain={selectedChain}
              updateDataCounter={updateDataCounter}
              setUpdateDataCounter={setUpdateDataCounter}
            />
          </CardFooter>
        </Card>
      )}
    </div>  );
};

export default WithdrawTab;