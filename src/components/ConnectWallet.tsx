import { useWallets, usePrivy } from '@privy-io/react-auth';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";


const ConnectWallet = ({ chains, setSelectedChain, selectedChain }: any) => {
  const { connectWallet } = usePrivy();
  const { ready, wallets } = useWallets();
  const address = wallets.length > 0 && wallets[0].address || '';
  console.log("🚀 ~ ConnectWal ~ address:", address)

  const authenticated = (ready && wallets?.length > 0);

  async function handleLogin() {
    try { await connectWallet() } catch (error) { }
  };

  async function handleLogout() {
    try { wallets?.[0]?.disconnect() } catch (error) { }
  };

  if (authenticated) {
    return (
      <div className='flex flex-row items-center gap-4'>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className='bg-white rounded-full p-1 flex flex-row items-center gap-4 hover:cursor-pointer transition ease-in-out delay-150 hover:scale-110 duration-300'>
              <div className='flex flex-row items-center gap-1'>
                <img src={selectedChain?.logoURI} className='w-8 h-8 rounded-full' />
                <p>{selectedChain?.name}</p>
              </div>

              <div className="flex">
                <svg width="16" height="16" viewBox="0 0 11 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M0.643562 0.232544C0.864944 -0.0441829 1.26874 -0.0890491 1.54547 0.132332L5.4224 3.23388L9.29933 0.132332C9.57606 -0.0890491 9.97985 -0.0441829 10.2012 0.232544C10.4226 0.50927 10.3777 0.913066 10.101 1.13445L5.82324 4.55667C5.58889 4.74415 5.2559 4.74415 5.02155 4.55667L0.743774 1.13445C0.467048 0.913066 0.422181 0.50927 0.643562 0.232544Z" fill="#000" />
                </svg>
              </div>
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


        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className='bg-white rounded-full flex flex-row p-1 items-center gap-4 hover:cursor-pointer transition ease-in-out delay-150 hover:scale-110 duration-300'>
              <div className='bg-yellow-200 rounded-full p-1 border border-yellow-400'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6V17C3 18.8856 3 19.8284 3.58579 20.4142C4.17157 21 5.11438 21 7 21H17C18.8856 21 19.8284 21 20.4142 20.4142C21 19.8284 21 18.8856 21 17V12C21 10.1144 21 9.17157 20.4142 8.58579C19.8284 8 18.8856 8 17 8H7.82843C6.67474 8 6.0979 8 5.56035 7.84678C5.26506 7.7626 4.98044 7.64471 4.71212 7.49543C4.22367 7.22367 3.81578 6.81578 3 6ZM3 6C3 5.06812 3 4.60218 3.15224 4.23463C3.35523 3.74458 3.74458 3.35523 4.23463 3.15224C4.60218 3 5.06812 3 6 3H14C15.1046 3 16 3.89543 16 5" stroke="black" stroke-width="null" stroke-linecap="round" stroke-linejoin="round" class="my-path"></path>
                  <path d="M18 14.5C18 15.3284 17.3284 16 16.5 16C15.6716 16 15 15.3284 15 14.5C15 13.6716 15.6716 13 16.5 13C17.3284 13 18 13.6716 18 14.5Z" stroke="black" stroke-width="null" className="my-path"></path>
                </svg>
              </div>
              <p>{address?.substring?.(0, 4)}....{address?.slice(-4)}</p>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="">
              <div className='bg-white hover:shadow-xl rounded-full p-1 flex flex-row items-center gap-2 pr-4 cursor-pointer' onClick={handleLogout}>
                <span className='bg-red-100 border border-red-400 rounded-full p-1'>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 4C4.58803 5.66502 3 8.50052 3 11.7185C3 16.8445 7.02944 21 12 21C16.9706 21 21 16.8445 21 11.7185C21 8.50052 19.412 5.66502 17 4" stroke="black" stroke-width="null" stroke-linecap="round" class="my-path"></path>
                    <path d="M12 3L12 10" stroke="black" stroke-width="null" stroke-linecap="round" className="my-path"></path>
                  </svg>
                </span>

                Logout
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-full flex flex-row p-2 px-4 items-center gap-4 hover:cursor-pointer transition ease-in-out delay-150 hover:scale-110 duration-300' onClick={handleLogin}>
      <p>Connect wallet</p>
    </div>
  )
}

export default ConnectWallet