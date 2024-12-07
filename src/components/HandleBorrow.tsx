import React, { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useSignMessage,
  useSignTypedData,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { parseEther, keccak256, toBytes, encodePacked, TypedDataDomain, hashTypedData } from "viem";

import {
  getChainExplorer,
  getChainLendingAddress,
  getLegacyId,
  getLZId,
  getNftAddress,
} from "../utils/chainMapping";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import spendingRawAbi from "../abi/SmokeSpendingContract.abi.json";
import { Toaster } from "./ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "./ui/toast";
import "../CrossChainLendingApp.css";
import { VStack, Text, HStack, Flex } from "@chakra-ui/react";
import { NFT, backendUrl } from "@/CrossChainLendingApp";
import { cn } from "@/lib/utils";
import { addressToBytes32 } from "@/utils/addressConversion";
import { getBorrowSignature, requestGaslessBorrow } from "@/utils/borrowUtils";


const HandleBorrow: React.FC<{
  selectedNFT: NFT | undefined;
  borrowNonce: bigint | undefined;
  withdrawAmount: string;
  chainId: number;
  selectedChain: string;
  updateDataCounter: number;
  setUpdateDataCounter: any;
  recipientAddress: `0x${string}` | undefined;
}> = ({
  selectedNFT,
  borrowNonce,
  withdrawAmount,
  chainId,
  selectedChain,
  updateDataCounter,
  setUpdateDataCounter,
  recipientAddress,
}) => {
  const [gaslessBorrow, setGaslessBorrow] = useState<boolean>(false);
  const [recentBorrowAmount, setRecentBorrowAmount] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [recentHash, setRecentHash] = useState<string>("");
  const [recentSignature, setRecentSignature] = useState<string>("");
  const [failedBorrow, setFailedBorrow] = useState<string>("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);


  const { address } = useAccount();
  const { toast } = useToast();
  const { switchChain } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();

  const switchToChain = async (newChainId: any) => {
    switchChain({ chainId: newChainId });
  };

  const { data: hash, isPending, error, writeContract } = useWriteContract();

  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    setIsConfirming(isTransactionLoading);
    setIsConfirmed(isTransactionSuccess);
  }, [isTransactionLoading, isTransactionSuccess]);

  // Add this effect to reset confirmation states when chainId changes
  useEffect(() => {
    setIsConfirming(false);
    setIsConfirmed(false);
  }, [chainId, gaslessBorrow]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNFT || Number(withdrawAmount) <= 0) {
      return;
    }
    if (gaslessBorrow && borrowNonce !== undefined) {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      const signatureValidity = BigInt(120); // 2 minutes

      try {
        if (!address || borrowNonce == undefined) return null;
        
        // Add digest calculation
        const domain = {
          name: "SmokeSpendingContract",
          version: "1",
          chainId: chainId,
          verifyingContract: getChainLendingAddress(getLZId(chainId)),
        } as const;

        const types = {
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
        } as const;

        const message = {
          borrower: address,
          issuerNFT: getNftAddress() as `0x${string}`,
          nftId: BigInt(selectedNFT.id),
          amount: parseEther(withdrawAmount),
          timestamp,
          signatureValidity,
          nonce: borrowNonce,
          recipient: recipientAddress ?? address,
        } as const;

        // Calculate digest
        const digest = hashTypedData({
          domain,
          types,
          primaryType: 'Borrow',
          message,
        });
        console.log("Frontend calculated digest:", digest);

        const signature = await signTypedDataAsync({
          domain,
          types,
          primaryType: "Borrow",
          message,
        });
        
        console.log(domain);
        console.log(types);
        console.log(message);
        if (typeof signature === "string") {
          toast({
            title: "Processing gasless borrow...",
            description: "processing",
          });
          if (!address || !selectedNFT || !withdrawAmount) return null;
          
          const result = await requestGaslessBorrow(
            address,
            selectedNFT.id,
            parseEther(withdrawAmount).toString(),
            timestamp.toString(),
            getLZId(chainId).toString(),
            recipientAddress ?? address,
            signature,
            false,
            0,
            failedBorrow
          );

          setUpdateDataCounter(updateDataCounter + 1);
          if (result) {
            console.log("Gasless borrow transaction hash:", result);
            if (result.status === "borrow_approved") {
              setIsConfirmed(true);
              setRecentHash(result.hash);
              setRecentBorrowAmount(withdrawAmount);
              setCustomMessage("");
              setFailedBorrow("");
              toast({
                description: "Gasless borrow initiated successfully",
                action: (
                  <ToastAction altText="Try again">
                    {" "}
                    <a
                      href={
                        getChainExplorer(getLZId(chainId)) + "tx/" + result.hash
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
            } else {
              setIsConfirmed(false);
              setCustomMessage(
                result.status === "not_enough_limit" //1
                  ? "Borrow Failed: You don't have enough borrow limit" //1
                  : result.status === "insufficient_issuer_balance" //2
                  ? "Borrow unavailable right now" //2
                  : result.status === "invalid_signature" //3
                  ? "Your previous txn was still processing, try again. If it repeats, reach out via Discord. " //3
                  : "Unknown error, please reach out via Discord"
              ); //0);
            }
          } else {
            throw new Error(
              "Failed to get transaction hash from gasless borrow"
            );
          }
        } else {
          throw new Error("Failed to sign message");
        }
        // Wait for the isPending state to be updated
      } catch (signError) {
        toast({ description: "Signing" });
        if (signError instanceof Error) {
          if (signError.message.includes("User rejected the request")) {
            toast({ description: "Signature request was rejected" });
          } else {
            toast({
              description: "Failed to sign message: " + signError.message,
            });
            console.log(signError.message);
          }
        } else {
          toast({ description: "An unknown error occurred during signing" });
        }
        return;
      }
    } else if (!gaslessBorrow && borrowNonce !== undefined) {
      if (!address || !selectedNFT || !withdrawAmount) return null;

      const signatureData = await getBorrowSignature(
        addressToBytes32(address),
        selectedNFT.id,
        parseEther(withdrawAmount).toString(),
        getLZId(chainId).toString(),
        addressToBytes32(recipientAddress ?? address),
        failedBorrow
      );

      if (!signatureData) {
        console.error("Failed to get borrow signature");
        return;
      }
      console.log(signatureData);

      const {
        timestamp,
        nonce: signatureNonceMix,
        signature,
        status,
      } = signatureData;
      const signatureNonce = signatureNonceMix.hex ? signatureNonceMix.hex : signatureNonceMix;
      console.log(Number(signatureNonce));
      setRecentSignature(signature);

      if (status === "borrow_approved") {
        writeContract({
          address: getChainLendingAddress(getLZId(chainId)),
          abi: spendingRawAbi,
          functionName: "borrow",
          args: [
            getNftAddress(),
            BigInt(selectedNFT.id),
            parseEther(withdrawAmount),
            BigInt(timestamp),
            BigInt(120), // signature validity
            BigInt(signatureNonce),
            recipientAddress ?? address,
            false,
            signature,
            0,
          ],
        });
        setUpdateDataCounter(updateDataCounter + 1);
        setFailedBorrow("");
      } else if (status === "not_enough_limit") {
        console.error("Borrow limit reached");
        setCustomMessage("You don't have enough limit to borrow");
        return;
      } else {
        setCustomMessage("Unknown error, reach out to us on Discord");
        return;
      }
    } else {
      console.log("ALL HELL BROEKK LAOSKEA");
      setCustomMessage("Please wait a few seconds before another borrow");
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      setRecentBorrowAmount(withdrawAmount);
      setRecentHash(hash);
      setCustomMessage("");
    }
    if (error) {
      console.log(error.message);
      setFailedBorrow(recentSignature);
      setCustomMessage(
        error.message.includes("ERC20: burn amount exceeds balance")
          ? error.message.includes("User rejected the request") ? "User rejected the request" : "Borrow unavailable right now"
          : "Unknown reason"
      );
    }
  }, [isConfirmed, withdrawAmount, error]);

  return (
    // <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
    <Flex alignContent="left">
      <VStack align="left">
        <HStack>
          <Text className="text-lg">Gasless</Text>
          <> </>
          <Checkbox
            checked={gaslessBorrow}
            onCheckedChange={() => setGaslessBorrow(!gaslessBorrow)}
          />
        </HStack>
        {getLegacyId(Number(selectedChain)) === chainId ? (
          <form onSubmit={handleSubmit}>
            <Button
              className="fontSizeLarge"
              type="submit"
              disabled={
                Number(withdrawAmount) === 0 || isPending || isConfirming
              }
            >
              {isPending
                ? "Waiting..."
                : isConfirming
                ? "Confirming..."
                : "Withdraw"}
            </Button>
          </form>
        ) : (
          <Button
            className="fontSizeLarge"
            onClick={() => switchToChain(getLegacyId(Number(selectedChain)))}
          >
            Switch Chain
          </Button>
        )}
        <Text>
          {customMessage !== "" ? <>Error: {customMessage}</> : ""}
          {isConfirming && <>Waiting for confirmation...</>}
          {isConfirmed && (
            <>
              Withdrew {recentBorrowAmount},{" "}
              <a
                href={getChainExplorer(getLZId(chainId)) + "tx/" + recentHash}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()} // Prevent toast from closing
              >
                View on Explorer
              </a>
            </>
          )}
        </Text>
      </VStack>
      <Toaster />
    </Flex>
    // </div>
  );
};

export default HandleBorrow;
