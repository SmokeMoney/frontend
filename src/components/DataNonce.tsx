import React, { useCallback, useEffect } from "react";
import { NFT } from "@/CrossChainLendingApp";
import { getChainLendingAddress, getLZId, getNftAddress } from "@/utils/chainMapping";
import { useChainId, useReadContract } from "wagmi";

import spendingRawAbi from "../abi/SmokeSpendingContract.abi.json";

const DataNonce: React.FC<
{selectedNFT: NFT | undefined; 
    lendingAddress: `0x${string}` | undefined;
    setLendingAddress: any;
    setBorrowNonce: any;}
> = ({
    lendingAddress,
    setLendingAddress,
    setBorrowNonce,
    selectedNFT
}) => {

    const chainId = useChainId();
  useEffect(() => {
    try {
      const address2 = getChainLendingAddress(getLZId(chainId));
      setLendingAddress(address2);
    } catch (error) {
      console.error("Error getting lending address:", error);
      setLendingAddress(undefined);
    }
  }, [chainId]);

  const { data: nonce, refetch: refetchNonce } = useReadContract({
    address: lendingAddress,
    abi: spendingRawAbi,
    functionName: "getCurrentNonce",
    args: [
      getNftAddress(),
      selectedNFT?.id ? BigInt(selectedNFT.id) : BigInt(0),
    ],
  });

  useEffect(() => {
    console.log("nonce", nonce);
    if (nonce !== null && nonce !== undefined) {
      setBorrowNonce(BigInt(nonce.toString()));
    } else {
      setBorrowNonce(undefined);
    }
  }, [nonce]);

  const refreshNonce = useCallback(() => {
    if (selectedNFT?.id && lendingAddress) {
      refetchNonce();
    }
  }, [selectedNFT?.id, lendingAddress, refetchNonce]);

  useEffect(() => {
    // Set up the interval to refresh the nonce every 30 seconds
    const intervalId = setInterval(refreshNonce, 3000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshNonce]);

  useEffect(() => {
    // Initial nonce fetch when component mounts or dependencies change
    refreshNonce();
  }, [refreshNonce]);

  useEffect(() => {
    if (selectedNFT?.id) {
      refetchNonce();
    } else {
      setBorrowNonce(undefined);
    }
  }, [selectedNFT?.id, refetchNonce]);

  return (
    <div className="fontSizeLarge">
    </div>
  );
};

export default DataNonce;
