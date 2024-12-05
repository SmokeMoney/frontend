import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as Popover from "@radix-ui/react-popover";
import { ModeToggle } from "./custom/mode-toggle";
import NFTSelector from "../components/NFTSelector";
import FAQContent from "../components/custom/FAQ";
import { usePrivy } from "@privy-io/react-auth";
import logo from "/logo4.png";
import { NFT } from "../CrossChainLendingApp";
import "./Header.css";
import { HStack } from "@chakra-ui/react";

const Header: React.FC<{
  listNFTs: NFT[];
  selectedNFT: NFT | undefined;
  setSelectedNFT: any;
  isMobile: boolean;
}> = ({ listNFTs, selectedNFT, setSelectedNFT, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { authenticated, login, logout, ready } = usePrivy();

  const disableLogin = !ready || (ready && authenticated);

  const handleSignOut = async () => {
    await logout(); // Provided by Privy to log the user out
  };

  const handleLogin = async () => {
    await login(); // Log in to Privy
  };
  const toggleMenu = () => setIsOpen(!isOpen);

  const SmokeButton = () => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size={"lg"} className="fontSizeMed">
          What is Smoke?
        </Button>
      </Popover.Trigger>
      <Popover.Content className="bg-primary bg-primary-foreground">
        <Card style={{ maxWidth: "400px" }}>
          <FAQContent />
        </Card>
      </Popover.Content>
    </Popover.Root>
  );

  return (
    <div className="header">
      <div className="header-content">
        <div
          className="logo-container"
          style={{ marginRight: isMobile ? "" : "3%" }}
        >
          <img src={logo} alt="Logo" className="app-logo" />
          {!isMobile && <SmokeButton />}
        </div>

        {listNFTs.length > 0 && (
          <NFTSelector
            listNFTs={listNFTs}
            selectedNFT={selectedNFT}
            setSelectedNFT={setSelectedNFT}
            isMobile={isMobile}
          />
        )}

        <Button className="menu-toggle" onClick={toggleMenu}>
          {isOpen ? "✕" : "☰"}
        </Button>

        <div className={`menu-items ${isOpen ? "open bg-popover" : ""}`}>
          <HStack className="connect-mode-toggle">
            {disableLogin ? (
              <button
                disabled={!disableLogin}
                onClick={handleSignOut}
                className={`${
                  disableLogin ? "bg-gray-400 p-4 rounded text-white" : ""
                }`}
              >
                sign out
              </button>
            ) : (
              <button
                disabled={disableLogin}
                onClick={handleLogin}
                className={`${
                  disableLogin ? "bg-blue-500 p-4 rounded text-white" : ""
                }`}
              >
                Log in
              </button>
            )}

            <ModeToggle />
          </HStack>
          {isMobile && <SmokeButton />}
        </div>
      </div>
    </div>
  );
};

export default Header;
