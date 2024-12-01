import { useAccountEffect } from "wagmi";

import CrossChainLendingApp from "./CrossChainLendingApp";
import LifiComponent from "./components/LifiComponent";

function App() {
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
      <LifiComponent />
    </>
  );
}

export default App;
