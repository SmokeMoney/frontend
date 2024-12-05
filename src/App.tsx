import { useAccountEffect } from "wagmi";

import CrossChainLendingApp from "./CrossChainLendingApp";
import { usePrivy } from "@privy-io/react-auth";

import LifiComponent from "./components/LifiComponent";
import BuyTokenApp from "./BuyTokenApp";

function App() {
  const { authenticated } = usePrivy();

  useAccountEffect({
    onConnect(_data) {
      // console.log('onConnect', data)
    },
    onDisconnect() {
      // console.log('onDisconnect')
    },
  });

  return (
    <>
      {/* <CrossChainLendingApp /> */}

      <BuyTokenApp />
    </>
  );
}

export default App;
