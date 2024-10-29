import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useSwitchChain,
  useReadContract,
  useReadContracts,
  useChainId,
} from "wagmi";
import { getBalance } from "@wagmi/core";
import { formatEther, formatUnits, parseEther } from "viem";
import { Address } from "viem";
import axios from "axios";
import {
  PriceFeed,
  PriceServiceConnection,
} from "@pythnetwork/price-service-client";

import DepositTabComp from "@/components/DepositTab"; // Adjust the import path as necessary
import RepayTab from "@/components/RepayTab"; // Add this import
import WithdrawTab from "./components/WithdrawTab"; // Add this import
import NFTSelector from "./components/NFTSelector"; // Add this import
import ManageTab from "./components/ManageTab"; // Add this import

import logo from "/logo4.png";
import * as Popover from "@radix-ui/react-popover";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardDescription,
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
import "./CrossChainLendingApp.css";
import parseDumbAbis from "./abi/parsedCoreNFTAbi";
import coreNFTRawAbi from "./abi/CoreNFTContract.abi.json";
import { chainIds, chains, getLZId } from "./utils/chainMapping";

import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons"; // Import the HamburgerIcon

import { ModeToggle } from "./components/custom/mode-toggle";
import { config } from "./wagmi";
import OverviewStrip from "./components/OverviewStrip";
import MintNFTComp from "./components/MintNFTComp";
import AddWalletComp from "./components/AddWalletComp";
import FAQContent from "./components/custom/FAQ";
import { addressToBytes32 } from "./utils/addressConversion";
import Header from "./components/Header";
import ZoraTab from "./components/ZoraTab";
import NFTTab from "./components/NFTTab";
import DataNonce from "./components/DataNonce";

export const NFT_CONTRACT_ADDRESS = import.meta.env
  .VITE_NFT_CONTRACT_ADDRESS as Address;

const priceFeedIdETH =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"; // ETH/USD
const priceFeedIdwstETH =
  "0x6df640f3b8963d8f8358f791f352b8364513f6ab1cca5ed3f1f7b5448980e784"; // wstETH/USD
export const backendUrl = import.meta.env.VITE_BACKEND_URL!;
const coreNFTAbi = parseDumbAbis(coreNFTRawAbi);

interface WalletConfig {
  address: string;
  autogasEnabled: boolean[];
  limits: string[];
  isModified: boolean;
  isExpanded: boolean;
  transactionHash: string | null;
}

export interface PositionData {
  chainId: string;
  amount: string;
}

export interface WalletBorrowPosition {
  walletAddress: string;
  borrowPositions: PositionData[];
}

export interface NFT {
  id: string;
  owner: boolean;
  wethDeposits: PositionData[];
  wstEthDeposits: PositionData[];
  borrowPositions: WalletBorrowPosition[];
  totalBorrowPosition: string;
  chainLimits: { [chainId: string]: string };
  nativeCredit: string;
}

const CrossChainLendingApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("withdraw");
  const [ethPrice, setEthPrice] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<string>("");
  const [ethOrUSD, setEthOrUSD] = useState<boolean>(false);
  const [wstETHRatio, setWstethRatio] = useState<string>("");
  const [listNFTs, setListNFTs] = useState<NFT[]>([]);
  const [wallets, setWallets] = useState<WalletConfig[]>([]);
  const [supportedChain, setSupportedChain] = useState<boolean>(false);
  const [updateDataCounter, setUpdateDataCounter] = useState<number>(0);

  const [borrowNonce, setBorrowNonce] = useState<bigint | undefined>(undefined);
  const [lendingAddress, setLendingAddress] = useState<
    `0x${string}` | undefined
  >(undefined);

  const [chainList2, setChainList2] = useState<string[]>([]);
  const { address, isConnected } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<NFT>();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const { data: balanceData } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: coreNFTAbi,
    functionName: "balanceOf",
    args: [address as Address],
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (chainId) {
      const legacyId = getLZId(chainId);
      if (legacyId && chainIds.some((chain) => chain === legacyId)) {
        setSupportedChain(true);
      } else {
        setSupportedChain(false);
      }
    } else {
      setSupportedChain(false);
    }
  }, [chainId, chains]);

  const balance = balanceData ? Number(balanceData) : 0;

  const blankNFT = (tokenId: bigint) => {
    return {
      id: formatUnits(tokenId, 0).toString(),
      owner: true,
      wethDeposits: [],
      wstEthDeposits: [],
      borrowPositions: [],
      totalBorrowPosition: "0",
      chainLimits: {},
      nativeCredit: "0",
    };
  };

  const switchToChain = async (newChainId: any) => {
    switchChain({ chainId: newChainId });
  };
  // const { data: nftData } = useReadContracts({
  //   contracts: Array.from({ length: balance }, (_, i) => ({
  //     address: NFT_CONTRACT_ADDRESS,
  //     abi: coreNFTAbi,
  //     functionName: "tokenOfOwnerByIndex",
  //     args: [address, BigInt(i)],
  //   })),
  // });

  // useEffect(() => {
  //   if (nftData && chainId === baseSepolia.id) {
  //     const nfts: NFT[] = nftData
  //       .map((item) => item.result)
  //       .filter((tokenId): tokenId is bigint => tokenId !== undefined)
  //       .map((tokenId) => blankNFT(tokenId));
  //     setListNFTs((prevNFTs) => mergeAndDeduplicateNFTs(prevNFTs, nfts));
  //     if (nfts.length > 0 && !selectedNFT) {
  //       setSelectedNFT(nfts[0]);
  //     }
  //   }
  // }, [nftData]);

  const { data: fetchedChainList } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: coreNFTAbi,
    functionName: "getChainList",
  }) as { data: bigint[] | undefined };

  const { data: walletList } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: coreNFTAbi,
    functionName: "getWallets",
    args: selectedNFT ? [BigInt(selectedNFT?.id)] : undefined,
  }) as { data: Address[] | undefined };

  useEffect(() => {
    if (fetchedChainList) {
      setChainList2(fetchedChainList.map((chain) => formatUnits(chain, 0)));
    }
  }, [fetchedChainList]);

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

  const { data: walletConfigs } = useReadContracts({
    contracts:
      walletList && selectedNFT
        ? walletList
            .map((wallet) => [
              {
                address: NFT_CONTRACT_ADDRESS,
                abi: coreNFTAbi,
                functionName: "getLimitsConfig",
                args: [BigInt(selectedNFT.id), wallet],
              },
              {
                address: NFT_CONTRACT_ADDRESS,
                abi: coreNFTAbi,
                functionName: "getAutogasConfig",
                args: [BigInt(selectedNFT.id), wallet],
              },
            ])
            .flat()
        : [],
  });

  useEffect(() => {
    if (walletList && walletConfigs && selectedNFT) {
      const configs = walletList.map((wallet, index) => {
        const limitsData = walletConfigs[index * 2]?.result as
          | bigint[]
          | undefined;
        const autogasData = walletConfigs[index * 2 + 1]?.result as
          | boolean[]
          | undefined;
        return {
          address: wallet,
          autogasEnabled: autogasData || [],
          limits: limitsData
            ? limitsData.map((limit) => formatEther(limit))
            : [],
          isModified: false,
          isExpanded: false,
          transactionHash: null,
        };
      });
      setWallets(configs);
    } else {
      const emptyConfigs: WalletConfig[] = [];
      setWallets(emptyConfigs);
    }
  }, [walletList, walletConfigs, selectedNFT]);

  function areNFTsDifferent(nft1: NFT, nft2: NFT): boolean {
    return JSON.stringify(nft1) !== JSON.stringify(nft2);
  }

  const fetchOracleData = async (): Promise<{
    eth: string;
    wsteth: string;
  }> => {
    let newETHPrice = "0";
    let newWstETHPrice = "0";
    try {
      const priceFeedIds = [priceFeedIdETH, priceFeedIdwstETH];
      const connection = new PriceServiceConnection(
        "https://hermes.pyth.network"
      );
      const priceFeeds = await connection.getLatestPriceFeeds(priceFeedIds);

      if (priceFeeds && priceFeeds.length > 0) {
        priceFeeds.forEach((feed: PriceFeed, index: number) => {
          const price = feed.getPriceUnchecked(); // Get price no older than 60 seconds
          if (price) {
            const priceString = (
              Number(price.price) *
              10 ** price.expo
            ).toFixed(6);
            if (index === 0) {
              newETHPrice = priceString;
            } else if (index === 1) {
              newWstETHPrice = priceString;
            }
          }
        });
      } else {
        console.warn("No price feeds re turned from Pyth Network");
      }
      return { eth: newETHPrice, wsteth: newWstETHPrice };
    } catch (error) {
      console.error("Error fetching prices:", error);
      return { eth: newETHPrice, wsteth: newWstETHPrice };
    }
  };

  useEffect(() => {
    const updatePrices = async () => {
      const oracleData: { eth: string; wsteth: string } =
        await fetchOracleData();
      if (Number(oracleData.eth) > 0) {
        setEthPrice(oracleData.eth);
        const wstETHRatio =
          (parseEther(oracleData.wsteth) * parseEther("1")) /
          parseEther(oracleData.eth);
        setWstethRatio(wstETHRatio.toString());
      }
    };
    updatePrices();
  }, [isConnected, address, selectedNFT, updateDataCounter]);

  useEffect(() => {
    const fetchNFTsAndBalance = async () => {
      if (isConnected && address) {
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
      if (address) {
        const freshBalance = await getBalance(config, { address: address });
        setEthBalance(Number(formatEther(freshBalance.value)).toPrecision(4));
      }
    };
    fetchNFTsAndBalance();
  }, [isConnected, address, selectedNFT, updateDataCounter]);

  useEffect(() => {
    const balanceUpdate = async () => {
      if (address) {
        const freshBalance = await getBalance(config, { address: address });
        setEthBalance(Number(formatEther(freshBalance.value)).toPrecision(4));
      }
    };
    balanceUpdate();
  }, [isConnected, address, chainId]);

  useEffect(() => {
    setListNFTs([]);
    setSelectedNFT(undefined);
  }, [address]);

  const DepositTab: React.FC = () => {
    return (
      <DepositTabComp
        selectedNFT={selectedNFT ?? blankNFT(BigInt(0))}
        updateDataCounter={updateDataCounter}
        setUpdateDataCounter={setUpdateDataCounter}
        isMobile={isMobile}
      />
    );
  };

  const totalWethDeposits = BigInt(
    selectedNFT?.wethDeposits?.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    ) ?? 0
  );

  const totalWstEthDeposits = BigInt(
    selectedNFT?.wstEthDeposits?.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    ) ?? 0
  );

  return (
    <div className="app-container">
      <div className="main-content">
        <Header
          listNFTs={listNFTs}
          selectedNFT={selectedNFT}
          setSelectedNFT={setSelectedNFT}
          isMobile={isMobile}
        />
        {listNFTs.length > 0 ? (
          selectedNFT &&
          Object.values(selectedNFT.chainLimits).reduce(
            (sum, limit) => sum + Number(limit),
            0
          ) === 0 &&
          selectedNFT.owner ? (
            <AddWalletComp
              nftId={selectedNFT.id}
              chainList={chainList2}
              updateDataCounter={updateDataCounter}
              setUpdateDataCounter={setUpdateDataCounter}
            />
          ) : supportedChain ? (
            <>
              <Flex justify="center" align="stretch" w="full" px={4}>
                <Flex
                  direction={{ base: "column", md: "row" }} // Adjust direction for mobile
                  justify="center"
                  align="stretch"
                  gap={16}
                  padding={10}
                  w="full"
                  px={{ base: 4, md: 400 }} // Adjust padding for mobile
                >
                  <HStack spacing={10} wrap="wrap">
                    {" "}
                    // Allow wrapping for mobile
                    <Button
                      className="fontSizeLarge"
                      onClick={() => setActiveTab("manage")}
                      variant={
                        activeTab === "manage" ? "destructive" : "default"
                      }
                    >
                      Manage
                    </Button>
                    <Button
                      className="fontSizeLarge"
                      onClick={() => setActiveTab("withdraw")}
                      variant={
                        activeTab === "withdraw" ? "destructive" : "default"
                      }
                    >
                      Smoke
                    </Button>
                    <Button
                      className="fontSizeLarge"
                      onClick={() => setActiveTab("deposit")}
                      variant={
                        activeTab === "deposit" ? "destructive" : "default"
                      }
                    >
                      Deposit
                    </Button>
                    <Button
                      className="fontSizeLarge"
                      onClick={() => setActiveTab("repay")}
                      variant={
                        activeTab === "repay" ? "destructive" : "default"
                      }
                    >
                      Repay
                    </Button>
                    {/* <Button
                      className="fontSizeLarge"
                      onClick={() => setActiveTab("nft")}
                      variant={activeTab === "nft" ? "destructive" : "default"}
                    >
                      NFT
                    </Button> */}
                  </HStack>
                </Flex>
              </Flex>
              <OverviewStrip
                ethOrUSD={ethOrUSD}
                setEthOrUSD={setEthOrUSD}
                ethPrice={ethPrice}
                totalWethDeposits={totalWethDeposits}
                totalWstEthDeposits={totalWstEthDeposits}
                wstETHRatio={wstETHRatio}
                selectedNFT={selectedNFT}
                nativeCredit={selectedNFT?.nativeCredit ?? "0"}
                isMobile={isMobile}
              />
              {activeTab === "manage" && (
                <ManageTab
                  selectedNFT={selectedNFT}
                  wallets={wallets}
                  setWallets={setWallets}
                  chainList2={chainList2}
                  updateDataCounter={updateDataCounter}
                  setUpdateDataCounter={setUpdateDataCounter}
                />
              )}
              {activeTab === "withdraw" && (
                <WithdrawTab
                  selectedNFT={selectedNFT}
                  borrowNonce={borrowNonce}
                  address={address}
                  ethBalance={ethBalance}
                  ethPrice={ethPrice}
                  updateDataCounter={updateDataCounter}
                  setUpdateDataCounter={setUpdateDataCounter}
                  totalWethDeposits={totalWethDeposits}
                  totalWstEthDeposits={totalWstEthDeposits}
                  wstETHRatio={wstETHRatio}
                />
              )}
              {activeTab === "deposit" && <DepositTab />}
              {activeTab === "repay" && (
                <RepayTab
                  selectedNFT={selectedNFT}
                  updateDataCounter={updateDataCounter}
                  setUpdateDataCounter={setUpdateDataCounter}
                  isMobile={isMobile}
                />
              )}
              {activeTab === "nft" && (
                <NFTTab
                  selectedNFT={selectedNFT}
                  updateDataCounter={updateDataCounter}
                  setUpdateDataCounter={setUpdateDataCounter}
                  borrowNonce={borrowNonce}
                  isMobile={isMobile}
                />
              )}
            </>
          ) : (
            <VStack>
              <Box flex={2}>
                <Card style={{ padding: 0 }}>
                  <CardHeader>
                    <CardTitle>Chain not supported</CardTitle>
                    <CardDescription>Supported Chains: </CardDescription>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chain</TableHead>
                        <TableHead>Switch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chains.map((chain) => (
                        <TableRow key={chain.legacyId}>
                          <TableCell>
                            <Text>{chain.name}</Text>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => switchToChain(chain.legacyId)}
                            >
                              Switch Chain
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Box>
            </VStack>
          )
        ) : (
          <MintNFTComp
            ethBalance={ethBalance}
            updateDataCounter={updateDataCounter}
            setUpdateDataCounter={setUpdateDataCounter}
          />
        )}
        <DataNonce
          selectedNFT={selectedNFT}
          lendingAddress={lendingAddress}
          setLendingAddress={setLendingAddress}
          setBorrowNonce={setBorrowNonce}
        />
      </div>
    </div>
  );
};

export default CrossChainLendingApp;
