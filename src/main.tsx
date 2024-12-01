import { Buffer } from "buffer";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, deserialize, serialize } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  lightTheme,
  midnightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "@/components/theme-provider";
import "./index.css";

// `@coinbase-wallet/sdk` uses `Buffer`
globalThis.Buffer = Buffer;

import App from "./App.tsx";
import { config } from "./wagmi.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
      networkMode: "offlineFirst",
      refetchOnWindowFocus: false,
      retry: 0,
    },
    mutations: { networkMode: "offlineFirst" },
  },
});

const persister = createSyncStoragePersister({
  key: "vite-react.cache",
  serialize,
  storage: window.localStorage,
  deserialize,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <RainbowKitProvider showRecentTransactions={true}>
            <App />
          </RainbowKitProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
