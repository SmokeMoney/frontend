import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import parseDumbAbis from "@/abi/parsedSpendingAbi";
import { useCapabilities } from "wagmi/experimental";

import spendingRawAbi from "../abi/SmokeSpendingContract.abi.json";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { NFT } from "@/types";
import { getBorrowSignature, requestGaslessMinting } from "@/utils/borrowUtils";
import { addressToBytes32 } from "@/utils/addressConversion";
import { parseEther } from "viem";
import {
  getChainExplorer,
  getChainLendingAddress,
  getLegacyId,
  getLZId,
  getNftAddress,
} from "@/utils/chainMapping";
import {
  useWriteContracts,
  useCallsStatus,
  useShowCallsStatus,
} from "wagmi/experimental";
import { Box, Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { Toaster } from "./ui/toaster";

const NFTTab: React.FC<{
  selectedNFT: NFT | undefined;
  updateDataCounter: number;
  setUpdateDataCounter: any;
  borrowNonce: bigint | undefined;
  isMobile: boolean;
}> = ({
  selectedNFT,
  updateDataCounter,
  setUpdateDataCounter,
  borrowNonce,
  isMobile,
}) => {
  // const { data: capabilities } = useCapabilities();
  // console.log(capabilities);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [recentHash, setRecentHash] = useState<string>("");
  const [minting, setMinting] = useState<string>("");
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addressType, setAddressType] = useState<string | null>(null);

  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const mintCost = "0.002";
  const {
    data: hash,
    isPending,
    error,
    writeContractsAsync,
  } = useWriteContracts();

  const { showCallsStatus } = useShowCallsStatus();

  // useEffect(() => {
  //   const newHash: `0x${string}` | undefined = hash as `0x${string}`;
  //   const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } =
  //     useWaitForTransactionReceipt({
  //       newHash,
  //     });
  // }, [hash, isPending, error]);

  // useEffect(() => {
  //   if (!isPending && hash !== undefined) {
  //     console.log("weird ", hash);
  //     setRecentHash(hash);
  //     setMinting("");
  //   }
  //   console.log(showCallsStatus);

  //   const { data: callsStatus } = useCallsStatus({
  //     hash,
  //     query: {
  //       refetchInterval: (data) =>
  //         data.state.data?.status === "CONFIRMED" ? false : 1000,
  //     },
  //   });
  //   console.log(callsStatus);
  // }, [isPending, callsStatus, showCallsStatus]);

  const { signTypedDataAsync } = useSignTypedData();
  const abi = [
    {
      stateMutability: "nonpayable",
      type: "function",
      inputs: [{ name: "to", type: "address" }],
      name: "safeMint",
      outputs: [],
    },
    {
      stateMutability: "payable",
      type: "function",
      inputs: [],
      name: "mint",
      outputs: [],
    },
  ] as const;

  useEffect(() => {
    const checkAddressType = async () => {
      try {
        const bytecode = await publicClient.getCode({
          address: address as `0x${string}`,
        });

        if (bytecode && bytecode !== "0x") {
          setAddressType("Smart Contract");
          //   const { data: capabilities } = useCapabilities();
          //   console.log(capabilities);
        } else {
          setAddressType("EOA (Externally Owned Account)");
        }
      } catch (error) {
        console.error("Error checking address type:", error);
        console.log({
          title: "Error",
          description: "Failed to check address type. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    checkAddressType();
    setRecentHash("");
  }, [address, chainId, publicClient]);

  const switchToChain = async (newChainId: any) => {
    switchChain({ chainId: newChainId });
  };
  const spendingAbi = parseDumbAbis(spendingRawAbi);
  const handleMint = async (index: any) => {
    console.log("asdf");
    if (addressType === "Smart Contract" && chainId == 84532) {
      console.log("inside ");

      if (!address || !selectedNFT) return;
      const signatureData = await getBorrowSignature(
        addressToBytes32(address),
        selectedNFT.id,
        parseEther(mintCost).toString(),
        getLZId(chainId).toString(),
        addressToBytes32(address),
        ""
      );
      if (!signatureData) {
        console.error("Failed to get borrow signature");
        return;
      }
      const {
        timestamp,
        nonce: signatureNonce,
        signature,
        status,
      } = signatureData;

      if (status === "borrow_approved") {
        try {
          const result = await writeContractsAsync({
            contracts: [
              {
                address: getChainLendingAddress(getLZId(chainId)),
                abi: spendingAbi,
                functionName: "borrow",
                args: [
                  getNftAddress(),
                  BigInt(selectedNFT.id),
                  parseEther(mintCost),
                  BigInt(timestamp),
                  BigInt(120), // signature validity
                  BigInt(signatureNonce),
                  address,
                  false,
                  signature,
                  0,
                ],
              },
              {
                address: nfts[0]["nftAddress"] as `0x${string}`,
                abi,
                functionName: "mint",
                args: [],
                value: parseEther("0.002"),
              },
            ],
          });
          const { data: callsStatus } = useCallsStatus({
            result,
            query: {
              refetchInterval: (data) =>
                data.state.data?.status === "CONFIRMED" ? false : 1000,
            },
          });
          console.log(callsStatus);
          setMinting("true");
        } catch (err: unknown) {
          console.log(err);
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else if (typeof err === "string") {
            setErrorMessage(err);
          } else {
            setErrorMessage("An unknown error occurred during the transaction");
          }
        }
        setUpdateDataCounter(updateDataCounter + 1);
      } else if (status === "not_enough_limit") {
        console.error("Borrow limit reached");
        setCustomMessage("You don't have enough limit to borrow");
        return;
      } else {
        setCustomMessage("Unknown error, reach out to us on Discord");
        return;
      }
    } else if (addressType === "EOA (Externally Owned Account)") {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // const borrowAndMintAddress = "0xA27aA06097Bc9276dCA245C66911A238498445F5";
      // const simpleNFTAddress = "0x3bcd37Ea3bB69916F156CB0BC954309bc7B7b4AC";
      console.log("indnex", index);
      const simpleNFTAddress = nfts[index]["nftAddress"];
      const borrowAndMintAddress = borrowAndMintAddresses[index][
        "address"
      ] as `0x${string}`;
      console.log(borrowAndMintAddress);
      const signatureValidity = BigInt(1200); // 2 minutes
      try {
        if (!address || borrowNonce == undefined || !selectedNFT) return null;
        const signature = await signTypedDataAsync({
          domain: {
            name: "SmokeSpendingContract",
            version: "1",
            chainId: chainId,
            verifyingContract: getChainLendingAddress(getLZId(chainId)),
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
            nftId: BigInt(selectedNFT.id),
            amount: parseEther(mintCost),
            timestamp,
            signatureValidity,
            nonce: borrowNonce,
            recipient: borrowAndMintAddress,
          },
        });
        if (typeof signature === "string") {
          if (!address || !selectedNFT) return null;
          setMinting("true");
          const result = await requestGaslessMinting(
            address,
            selectedNFT.id,
            parseEther(mintCost).toString(),
            timestamp.toString(),
            getLZId(chainId).toString(),
            borrowAndMintAddress,
            signature,
            false,
            0,
            simpleNFTAddress
          );
          console.log("MINTING IS HARD", result);
          if (result) {
            console.log("Gasless borrow transaction hash:", result);
            setMinting("");
            if (result.status === "borrow_approved") {
              setCustomMessage("");
              setRecentHash(result.hash);
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
        }
      } catch {
        console.log("asdf");
      }
    }
  };

  const nfts = [
    {
      id: "1",
      name: "BASE NFT",
      image: "/smoke_base.png",
      chain: "Base",
      nftAddress: "0x3bcd37Ea3bB69916F156CB0BC954309bc7B7b4AC",
      chainId: 84532,
    },
    {
      id: "2",
      name: "ARB NFT",
      image: "/smoke_arb.png",
      chain: "Arbitrum",
      nftAddress: "0x475A999e1D6A50D483A207fC8D52B583669DB90c",
      chainId: 421614,
    },
    {
      id: "3",
      name: "OPT NFT",
      image: "/smoke_opt.png",
      chain: "Optimism",
      nftAddress: "0x269488db82d434dC2E08e3B6f428BD1FF90C4325",
      chainId: 11155420,
    },
    {
      id: "4",
      name: "ETH NFT",
      image: "/smoke_eth.png",
      chain: "Ethereum",
      nftAddress: "0xe06883A0caaFe865F23597AdEDC7af4cBEaBA7E2",
      chainId: 11155111,
    },
    {
      id: "5",
      name: "ZORA 3NFT",
      image: "/smoke_zora.png",
      chain: "Zora",
      nftAddress: "0x9b6f6F895a011c2C90857596A1AE2f537B097f52",
      chainId: 999999999,
    },
    {
      id: "6",
      name: "BLAST NFT",
      image: "/smoke_blast.png",
      chain: "Blast",
      nftAddress: "0x244a4b538171D0b5b7f8Ff70812CaE1d43886183",
      chainId: 168587773,
    },
  ];

  const borrowAndMintAddresses = [
    { id: "1", address: "0xA27aA06097Bc9276dCA245C66911A238498445F5" },
    { id: "2", address: "0x0B3dc9af23C391Ca43061b6A5ECDD67c4abA2C0e" },
    { id: "3", address: "0xBF9CB56e2e927AEF651723d07e1eC95dC3F9764d" },
    { id: "4", address: "0x30C0fFa5eC03E33F8c60e2d62f97A0d03bE4aFcf" },
    { id: "5", address: "0x3a771f2D212979363715aB06F078F0Fb4d6e96Cb" },
    { id: "6", address: "0x3431a7631d6fee6a16E10ef3cCd8aAb06E58D555" },
  ];

  return (
    <div className="fontSizeLarge">
      <div className="flex flex-col items-center p-4">
        <h1 className="text-2xl font-bold mb-4">
          Mint Without Gas or Funds on a Chain
        </h1>
        <Box>
          {error && (
            <Box
              mt={2}
              maxHeight="100px"
              overflowY="auto"
              w="full"
              borderColor="red.500"
              borderWidth={1}
              borderRadius="md"
              p={2}
            >
              <Text color="red.500">Error: {errorMessage}</Text>
            </Box>
          )}
          {customMessage !== "" && (
            <Text color="red.500">Error: {customMessage}</Text>
          )}
          {minting !== "" && (
            <Flex>
              <div>Minting...</div>
              <Spinner color="red.500" size="xl" />
            </Flex>
          )}
          {recentHash !== "" && (
            <>
              Minted NFT! ,{" "}
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
          <SimpleGrid columns={isMobile ? 1 : 3} spacing={4}>
            {nfts.map((nft, index) => (
              // <Box key={nft.id} borderWidth={1} borderRadius="lg" overflow="hidden">
              <div
                key={nft.id}
                className="flex items-center flex-col p-4 border rounded-lg"
                style={{ justifyContent: "space-evenly" }}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  // style={{ width: "100%", height: "200px", objectFit: "cover" }}
                  className="w-64 h-64 rounded-lg"
                />
                <Text fontSize="sm" mb={2} p={6} className="font-bold">
                  Smoke on {nft.chain}
                </Text>
                {nft.chainId === chainId ? (
                  <Button
                    onClick={() => handleMint(index)}
                    disabled={nft.chainId == 11155111}
                  >
                    Mint
                  </Button>
                ) : (
                  <Button
                    className="fontSizeLarge"
                    onClick={() => switchToChain(nft.chainId)}
                    disabled={nft.chainId == 11155111}
                  >
                    Switch Chain
                  </Button>
                )}
              </div>
            ))}
          </SimpleGrid>
        </Box>
        <Toaster />
      </div>
    </div>
  );
};
export default NFTTab;
