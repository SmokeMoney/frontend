import React from "react";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";

const LifiComponent: React.FC = () => {
  const widgetConfig: WidgetConfig = {
    fromChain: 1, // Set source chain to Ethereum (chainId: 1)
    fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Set source token to ETH
    disabledUI: ["fromToken"],
    // hiddenUI: [
    //   "appearance",
    //   "language",
    //   "poweredBy",
    //   "drawerCloseButton",
    //   "walletMenu",
    //   "integratorStepDetails",
    // ],
  };

  return (
    <>
      <LiFiWidget
        integrator="vite-example"
        config={widgetConfig}
        // formRef={formRef}
      />
    </>
  );
};

export default LifiComponent;
