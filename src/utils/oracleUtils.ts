import { PriceServiceConnection } from "@pythnetwork/price-service-client";

import { PriceFeed } from "@pythnetwork/price-service-client";

const priceFeedIdETH =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"; // ETH/USD
const priceFeedIdwstETH =
  "0x6df640f3b8963d8f8358f791f352b8364513f6ab1cca5ed3f1f7b5448980e784"; // wstETH/USD

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

export { fetchOracleData };