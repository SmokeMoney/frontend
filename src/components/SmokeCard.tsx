import { NFT } from "@/types";
import { parseEther, formatEther } from "viem";
import { Box, Flex, Text, useDisclosure, Popover, PopoverTrigger, PopoverContent, PopoverCloseButton, PopoverHeader, PopoverBody, PopoverArrow } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { fetchOracleData } from "@/utils/oracleUtils";

const SmokeCard = ({ ready, selectedNFT, address }: { ready: boolean, selectedNFT: NFT, address: string }) => {
    const [ethPrice, setEthPrice] = useState<string>("");
    const [ethBalance, setEthBalance] = useState<string>("");
    const [ethOrUSD, setEthOrUSD] = useState<boolean>(false);
    const [wstETHRatio, setWstethRatio] = useState<string>("");

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
    }, [ready, address, selectedNFT]);
      
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
    
    const calculations = useMemo(() => {
      const wstEthInEth =
          (totalWstEthDeposits * BigInt(wstETHRatio)) / parseEther("1");
      const totalDepositsEth = totalWethDeposits + wstEthInEth;
      const totalDepositsUsd =
          (parseEther(ethPrice) * totalDepositsEth) / parseEther("1");
      const totalBorrowed = BigInt(selectedNFT?.totalBorrowPosition ?? 0);
      const totalBorrowedUsd =
          (parseEther(ethPrice) * totalBorrowed) / parseEther("1");
      const availableToBorrowEth =
          (totalDepositsEth * BigInt(90)) / BigInt(100) +
          BigInt(selectedNFT?.nativeCredit ?? "0") -
          totalBorrowed;
      const availableToBorrowUsd =
          (parseEther(ethPrice) * availableToBorrowEth) / parseEther("1");

      return {
          totalDepositsEth,
          totalDepositsUsd,
          totalBorrowed,
          totalBorrowedUsd,
          availableToBorrowEth,
          availableToBorrowUsd,
          wethDeposits: BigInt(
            selectedNFT?.wethDeposits?.reduce(
                (sum, deposit) => sum + parseFloat(deposit.amount),
                0
            ) ?? 0
          ),
          wstEthDeposits: BigInt(
            selectedNFT?.wstEthDeposits?.reduce(
                (sum, deposit) => sum + parseFloat(deposit.amount),
                0
            ) ?? 0
          ),
      };
    }, [
      ethPrice,
      totalWethDeposits,
      totalWstEthDeposits,
      wstETHRatio,
      selectedNFT,
    ]);

  const formatValue = (value: bigint, decimals: number = 5) =>
    Number(formatEther(value)).toPrecision(decimals);

  const smokeBalance = formatValue(
    ethOrUSD
      ? calculations.availableToBorrowUsd
      : calculations.availableToBorrowEth
  );

  return (
    <Box p="6" bg="gray.800" maxW="sm" zIndex={5}>
      <Flex flexDirection="row" justifyContent="center" alignItems="center">
        {ready ? (
          selectedNFT ? (
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Flex
                  bg="black"
                  borderRadius="xl"
                  py="2"
                  px="3"
                  mr="3"
                  justifyContent="center"
                  alignItems="center"
                  color="white"
                  cursor="pointer"
                >
                  <Box fontSize="md" fontWeight="600" textAlign="center" mr="2">
                    💳 {ethOrUSD ? "$" : ""}
                    {smokeBalance} {ethOrUSD ? "USD" : "ETH"}
                  </Box>
                  <svg
                    fill="none"
                    height="7"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Dropdown</title>
                    <path
                      d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      xmlns="http://www.w3.org/2000/svg"
                    ></path>
                  </svg>
                </Flex>
              </PopoverTrigger>
              <PopoverContent bg="black" color="white" borderRadius="xl" boxShadow="lg">
                <PopoverArrow bg="black" />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold" borderBottomColor="gray.700">Smoke Card</PopoverHeader>
                <PopoverBody>
                  <Text>NFT ID: {selectedNFT?.id.toString()}</Text>
                  <Text fontSize="sm" mt="2">Available Credit:</Text>
                  <Text fontSize="sm">
                    {formatValue(calculations.availableToBorrowEth)} ETH
                  </Text>
                  <Text fontSize="sm">
                    ${formatValue(calculations.availableToBorrowUsd)} USD
                  </Text>
                  <Flex mt={4} gap="2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open("https://app.smoke.money/", "_blank")}
                    >
                      (what is smoke?)
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open("https://test.smoke.money/", "_blank")}
                    >
                      manage card
                    </Button>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          ) : (
            <Box
              fontSize="md"
              fontWeight="600"
              textAlign="center"
              mr="5"
              color="white"
              as="a"
              href="https://app.smoke.money"
              target="_blank"
              _hover={{ textDecoration: "underline" }}
            >
              💳 Get your card now
            </Box>
          )
        ) : null}
      </Flex>
    </Box>
  );
};

export default SmokeCard;
