import React, { useState, useEffect } from "react";
import { Address } from "viem";
import {
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  BaseError,
  useAccount,
} from "wagmi";
import axios from "axios";
import { parseEther, formatEther } from "viem";
import { ChevronDownCircle, ChevronUpCircle } from "lucide-react";
import { addressToBytes32, bytes32ToAddress } from "../utils/addressConversion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as Popover from "@radix-ui/react-popover";
import { base, baseSepolia } from "wagmi/chains";
import { NFT_CONTRACT_ADDRESS, backendUrl } from "../CrossChainLendingApp";
import { WalletConfig, NFT } from "../types";
import { getChainName, getLZId } from "../utils/chainMapping";
import { Flex } from "@chakra-ui/react";
import parseDumbAbis from "../abi/parsedCoreNFTAbi";
import coreNFTRawAbi from "../abi/CoreNFTContract.abi.json";
const coreNFTAbi = parseDumbAbis(coreNFTRawAbi);

interface ManageTabProps {
  selectedNFT: NFT | undefined;
  wallets: WalletConfig[];
  setWallets: React.Dispatch<React.SetStateAction<WalletConfig[]>>;
  chainList2: string[];
  updateDataCounter: number;
  setUpdateDataCounter: React.Dispatch<React.SetStateAction<number>>;
}

const ManageTab: React.FC<ManageTabProps> = ({
  selectedNFT,
  wallets,
  setWallets,
  chainList2,
  updateDataCounter,
  setUpdateDataCounter,
}) => {
  const [newWalletAddress, setNewWalletAddress] = useState<string>("");
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address, isConnected } = useAccount();
  
  const handleWalletAutogasToggle = (index: number, chainIndex?: number) => {
    setWallets((prev) => {
      const newWallets = [...prev];
      const targetWallet = { ...newWallets[index] };
      let isChanged = false;

      if (chainIndex !== undefined) {
        // Toggle for specific chain
        const newValue = !targetWallet.autogasEnabled[chainIndex];
        if (targetWallet.autogasEnabled[chainIndex] !== newValue) {
          targetWallet.autogasEnabled = [...targetWallet.autogasEnabled];
          targetWallet.autogasEnabled[chainIndex] = newValue;
          isChanged = true;
        }
      } else {
        // Toggle for all chains
        const allTrue = targetWallet.autogasEnabled.every(Boolean);
        const newValue = !allTrue;
        if (targetWallet.autogasEnabled.some((value) => value !== newValue)) {
          targetWallet.autogasEnabled = targetWallet.autogasEnabled.map(
            () => newValue
          );
          isChanged = true;
        }
      }

      if (isChanged) {
        targetWallet.isModified = true;
        newWallets[index] = targetWallet;
        return newWallets;
      }

      return prev;
    });
  };

  const handleWalletLimitChange = (
    index: number,
    value: string,
    chainIndex?: number
  ) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split(".");
    const formattedValue = parts[0] + (parts.length > 1 ? "." + parts[1] : "");

    setWallets((prev) => {
      const newWallets = [...prev];
      const targetWallet = { ...newWallets[index] };
      const newLimits = [...targetWallet.limits];

      try {
        if (chainIndex !== undefined) {
          newLimits[chainIndex] = formattedValue;
        } else {
          newLimits.fill(formattedValue);
        }
      } catch (error) {
        if (chainIndex !== undefined) {
          newLimits[chainIndex] = formattedValue;
        } else {
          newLimits.fill(formattedValue);
        }
      }

      targetWallet.limits = newLimits;
      targetWallet.isModified = true;
      newWallets[index] = targetWallet;
      return newWallets;
    });
  };

  const handleAddWallet = () => {
    if (newWalletAddress) {
      setWallets((prev) => [
        ...prev,
        {
          address: addressToBytes32(newWalletAddress),
          autogasEnabled: chainList2.map(() => false),
          limits: chainList2.map(() => "0"),
          isModified: true,
          isExpanded: false,
          transactionHash: null,
        },
      ]);
      setNewWalletAddress("");
    }
  };

  const switchToAdminChain = async () => {
    switchChain({ chainId: baseSepolia.id });
  };
  
  const updateNFTDataBackend = async (nftId: string) => {
    const response = await axios.post(`${backendUrl}/api/updatenft`, {
      nftId: nftId,
      chainId: getLZId(chainId).toString(),
    });
    console.log(response);
    return response.data.status === "update_successful";
  };

  const saveChanges = (wallet: WalletConfig, index: number) => {
    const {
      data: hash,
      isPending,
      error,
      writeContract,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
      useWaitForTransactionReceipt({
        hash,
      });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedNFT || chainList2.length === 0) {
        return;
      }

      const newLimits = wallet.limits.map((limit) =>
        BigInt(parseEther(limit))
      );
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: coreNFTAbi,
        functionName: "setHigherBulkLimits",
        args: [
          BigInt(selectedNFT.id),
          wallet.address as Address,
          chainList2.map(BigInt),
          newLimits,
          wallet.autogasEnabled,
        ],
      });
    };

    React.useEffect(() => {
      const updateLimitsDataMeta = async () => {
        if (isConfirmed && address) {
          const updateStatus = await updateNFTDataBackend(
            selectedNFT?.id ?? "0"
          );
          if (updateStatus) {
            setUpdateDataCounter(updateDataCounter + 1);
          }
          setWallets((prev) => {
            const newWallets = [...prev];
            newWallets[index] = {
              ...newWallets[index],
              isModified: false,
              transactionHash: null,
            };
            return newWallets;
          });
        }
      };
      updateLimitsDataMeta();
    }, [isConfirmed]);

    return (
      <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
        <form onSubmit={handleSubmit}>
          <Button
            type="submit"
            disabled={!wallet.isModified || isConfirming || isPending}
          >
            {isPending
              ? "Waiting..."
              : isConfirming
              ? "Confirming..."
              : wallet.isModified
              ? "Save Changes"
              : "No Changes"}
          </Button>
          {error && (
            <div>
              Error: {(error as BaseError).shortMessage || error.message}
            </div>
          )}
          {isConfirming && <div>Waiting for confirmation...</div>}
          {isConfirmed && <div>Changes saved successfully!</div>}
        </form>
        <Button size="icon" onClick={() => toggleExpand(index)}>
          {wallet.isExpanded ? (
            <ChevronUpCircle className="h-5 w-5" />
          ) : (
            <ChevronDownCircle className="h-5 w-5" />
          )}
        </Button>
      </div>
    );
  };

  const forceRefresh = () => {
    window.location.reload();
  };
  
  const toggleExpand = (index: number) => {
    setWallets((prev) => {
      const newWallets = [...prev];
      const targetWallet = newWallets[index];
      const newIsExpanded = !targetWallet.isExpanded;
      // Only update if the state is actually changing
      if (targetWallet.isExpanded !== newIsExpanded) {
        newWallets[index] = { ...targetWallet, isExpanded: newIsExpanded };
        return newWallets;
      }
      newWallets[index].isExpanded = !newWallets[index].isExpanded;
      // If no change is needed, return the previous state
      return prev;
    });
  };

  const WalletConfigTable: React.FC = () => {
    const getAutogasDisplay = (wallet: WalletConfig, chainIndex?: number) => {
      if (chainIndex !== undefined) {
        const autogasConfig: boolean = wallet.autogasEnabled[chainIndex];
        return (
          <Checkbox
            disabled={!selectedNFT?.owner}
            checked={autogasConfig}
            onCheckedChange={() =>
              handleWalletAutogasToggle(wallets.indexOf(wallet), chainIndex)
            }
          />
        );
      } else {
        const allTrue = wallet.autogasEnabled.every(Boolean);
        const allFalse = wallet.autogasEnabled.every((value) => !value);

        if (!allTrue && !allFalse) {
          return <span>&#9646;</span>; // Display a dash for mixed state
        }
        return (
          <Checkbox
            disabled={!selectedNFT?.owner}
            checked={allTrue}
            onCheckedChange={() =>
              handleWalletAutogasToggle(wallets.indexOf(wallet))
            }
          />
        );
      }
    };

    const getEditButton = (
      wallet: WalletConfig,
      index: number,
      chainIndex?: number
    ) => {
      const [currentLimit, setCurrentLimit] = useState<string>(
        wallet.limits[chainIndex ? chainIndex : 0]
      );
      const [alertLowerLimit, setAlertLowerLimit] = useState<boolean>(false);
      const modifyLimit = () => {
        if (currentLimit < wallet.limits[chainIndex ?? 0]) {
          setAlertLowerLimit(true);
          setCurrentLimit(wallet.limits[chainIndex ?? 0]);
        } else {
          handleWalletLimitChange(index, currentLimit, chainIndex);
        }
      };
      return (
        <>
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button
                disabled={
                  !selectedNFT?.owner ||
                  (wallet.isExpanded && chainIndex === undefined)
                }
              >
                Edit
              </Button>
            </Popover.Trigger>

            <Popover.Content sideOffset={5}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Input
                  value={currentLimit}
                  onChange={(e) => setCurrentLimit(e.target.value)}
                  placeholder="Enter new limit"
                />
                <Button onClick={() => modifyLimit()}>Accept</Button>
                <Popover.Close asChild>
                  <Button>Close</Button>
                </Popover.Close>
                <Popover.Arrow className="PopoverArrow" />
                {alertLowerLimit ? (
                  <Alert>
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                      For now you can only increase the limit.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <></>
                )}
              </div>
            </Popover.Content>
          </Popover.Root>
        </>
      );
    };

    return (
      <div>
        <Card>
          <Table className="fontSizeLarge">
            <TableHeader>
              <TableRow>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Autogas</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Input
                      type="text"
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      placeholder="Enter new wallet address"
                    />
                    <Button onClick={handleAddWallet}>Add Wallet</Button>
                  </div>
                </TableCell>
              </TableRow>
              {wallets.map((wallet, index) => (
                <React.Fragment key={wallet.address}>
                  <TableRow>
                    <TableCell>
                      {bytes32ToAddress(wallet.address as `0x${string}`)}
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 10,
                          alignItems: "center",
                          textAlign: "right",
                        }}
                      >
                        {wallet.limits.every(
                          (limit) => limit === wallet.limits[0]
                        )
                          ? wallet.isExpanded
                            ? "Being Configured"
                            : `${wallet.limits[0]} ETH`
                          : "Different limits"}
                        {getEditButton(wallet, index)}
                      </div>
                    </TableCell>
                    <TableCell>{getAutogasDisplay(wallet)}</TableCell>
                    <TableCell>{saveChanges(wallet, index)}</TableCell>
                  </TableRow>
                  {wallet.isExpanded && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Table className="fontSizeLarge">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Chain ID</TableHead>
                              <TableHead>Autogas</TableHead>
                              <TableHead>Limit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {chainList2.map((chainId, chainIndex) => (
                              <TableRow key={chainId.toString()}>
                                <TableCell>
                                  {getChainName(Number(chainId))}
                                </TableCell>
                                <TableCell>
                                  {getAutogasDisplay(wallet, chainIndex)}
                                </TableCell>
                                <TableCell>
                                  {wallet.limits[chainIndex]} ETH
                                  {getEditButton(wallet, index, chainIndex)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };


  return (
    <div className="tab-content">
      <Flex justify="center" align="stretch" w="full" px={4} paddingTop={10}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="center"
          align="stretch"
          gap={16}
          w="full"
          px={40}
        >
          { chainId === (import.meta.env.VITE_NODE_ENV === "mainnet"? base.id : baseSepolia.id) ? (
            <>
              {wallets.length > 0 && (
                <div>
                  <WalletConfigTable />
                </div>
              )}
            </>
          ) : (
            <Button onClick={switchToAdminChain}>
              Switch to Base
            </Button>
          )}
        </Flex>
      </Flex>
    </div>
  );
};

export default ManageTab;
