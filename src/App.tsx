import { useAccountEffect } from "wagmi";

import CrossChainLendingApp from "./CrossChainLendingApp";
import { usePrivy } from "@privy-io/react-auth";

import LifiComponent from "./components/LifiComponent";

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
      <CrossChainLendingApp />
      {authenticated && <LifiComponent />}
    </>
  );
}

export default App;
