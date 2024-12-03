// import Header from "./component/header"

import { useEffect, useState } from "react"
import logo from "../public/logo4.png"
import { getChains, getTokens } from "@lifi/sdk"
import { useWallets, usePrivy } from '@privy-io/react-auth';

import TokenTable, { TokenType } from "./components/TokenTable";
import BuyTokenModal from "./components/BuyTokenModal";
import ConnectWallet from "./components/ConnectWallet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


function BuyTokenApp() {
  const { ready, wallets } = useWallets();

  const [chains, setChains] = useState<any>([]);
  const [selectedChain, setSelectedChain] = useState<any>();
  const [tokens, setTokens] = useState<any>([])
  const [selectedToken, setSelectedToken] = useState<any>(null);

  /**
   * when connected wallet get all chain
   */
  useEffect(() => {
    if (wallets?.length > 0) {
      _getChains();
    }
  }, [wallets]);

  /**
   * when changed chain get tokens
   */
  useEffect(() => {
    if (selectedChain?.chainType) {
      getTokensFilterByChainType(selectedChain?.id)
    }
  }, [selectedChain])


  async function _getChains() {
    try {
      const _res: any[] = await getChains();
      if (_res && _res?.length > 0) {
        setChains(_res);
        setSelectedChain(_res[0])
      }
    } catch (error) { }
  }


  async function getTokensFilterByChainType(chainType: any) {
    try {
      const { tokens }: any = await getTokens({ chains: [chainType] });
      setTokens(tokens?.[chainType])
    } catch (error) {
      console.error(error);
    }
  }


  async function handleBuyToken(token: TokenType) {
    // await fetch(`https://li.quest/v1/quote?fromChain=8453&toChain=8453&fromToken=ETH&toToken=0x7C4faB325f0D76b2bd3Ae0B5964e5C8F6caCaf92&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&fromAmount=1000000000000000`)

    // await fetch({
    //   method: "POST", body: {
    //     "walletAddress": "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929",
    //     "nftId": "3",
    //     "amount": "100000000000",
    //     "chainId": "30111",
    //     "recipient": "0x0000000000000000000000009cb16f99eb162bf6f970791ba90bbf30c1cd1929"
    //   }
    // })
  }

  async function handleChangeChain(_chain:any) {
    setSelectedChain(_chain);
    setTokens([]);
  }

  return (
    <div className='select-none'>
      <div className='absolute w-full bg-[#2D3542] shadow-xl'>
        <header>
          <div className='container mx-auto flex flex-row items-center justify-between p-2'>
            <div className='flex flex-row items-center animate-pulse'>
              <img src={logo} className='w-24' />
            </div>

            <div className="">
              <ConnectWallet chains={chains} selectedChain={selectedChain} setSelectedChain={handleChangeChain} />
            </div>
          </div>
        </header>
      </div>


      <div className='bg-[#1B202A] pt-20 min-h-screen'>
        <div className="container w-full">
          <BuyTokenModal isOpen={!!selectedToken} onClose={() => setSelectedToken(null)} token={selectedToken} onSwapToken={handleBuyToken} />
          <TokenTable tokens={tokens} handleBuyToken={(token: TokenType) => setSelectedToken(token)} />
        </div>
      </div>
    </div>
  )
}

export default BuyTokenApp
