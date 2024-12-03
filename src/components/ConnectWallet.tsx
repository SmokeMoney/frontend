import { useWallets, usePrivy } from '@privy-io/react-auth';
import walletIcon from "../../public/wallet.svg"

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";



const ConnectWallet = ({ chains, setSelectedChain, selectedChain }: any) => {
  console.log("🚀 ~ ConnectWal ~ selectedChain:", selectedChain)
  const { connectWallet } = usePrivy();
  const { ready, wallets } = useWallets();

  const authenticated = (ready && wallets?.length > 0);

  async function handleLogin() {
    try { await connectWallet() } catch (error) { }
  };

  async function handleLogout() {
    try { wallets?.[0]?.disconnect() } catch (error) { }
  };

  if (authenticated) {
    return (
      <div className='flex flex-row items-center gap-2'>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className='bg-white rounded-full p-1 flex flex-row items-center gap-1 pr-2 hover:cursor-pointer'>
              <img src={selectedChain?.logoURI} className='w-8 h-8 rounded-full' />
              <p>{selectedChain?.name}</p>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="">
              <div className="flex flex-col gap-2 overflow-auto h-80 bg-white rounded-xl p-4">
                {chains?.map?.((x: any) => (
                  <DropdownMenu.Item className="outline-none">
                    <div onClick={() => setSelectedChain(x)} className="flex flex-row items-center gap-2 cursor-pointer relative" key={x?.key}>
                      <img src={x?.logoURI} className="w-8 h-8 rounded-md" />
                      <span>{x?.name}</span>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>


        <button className='bg-[#252B36] hover:shadow-xl text-white rounded-full p-2 px-4' onClick={handleLogout}>
          Disconnect wallet
        </button>
      </div>
    )
  }

  return (
    <div className=''>
      <button className='bg-[#252B36] hover:shadow-xl text-white rounded-full p-2 px-4' onClick={handleLogin}>
        Connect wallet
      </button>
    </div>
  )
}

export default ConnectWallet