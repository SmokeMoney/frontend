import { Table } from "@radix-ui/themes";
import { ChainTypes } from "../BuyTokenApp";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import * as Switch from "@radix-ui/react-switch";
import { useRef, useState } from "react";
import EhtLogo from "../../public/eth.svg";

export interface TokenType {
  address: string;
  chainId: number;
  coinKey: string;
  decimals: number;
  logoURI: string;
  name: string;
  priceUSD: string;
  symbol: string;
  amount: string;
  action: string;
}

interface TokenTableProps {
  chains: ChainTypes[];
  tokens: TokenType[];
  setSelectedChain: (value: ChainTypes) => void;
  selectedChain: ChainTypes;
  handleBuyToken: (token: TokenType) => void;
}

const columnsDic = {
  "logoURI": "Token",
  "priceUSD": "Price (USD)",
  "action": "Action",
}

const columnHelper = createColumnHelper<TokenType>();
const defaultColumns: any = [
  columnHelper.accessor('logoURI', {
    cell: (info) => <div className="flex flex-row items-center gap-2 text-zinc-400 p-2">
      <img src={info.getValue()} className="w-8 h-8 rounded-full" />

      <div className="flex flex-col">
        <p>{info.row.original.symbol} {`${info.row.original.name !== info.row.original.symbol ? `(${info.row.original.name})` : ''}`}</p>
        <p className="text-zinc-400 text-xs">{info.row.original.address?.slice(0, 4)}...{info.row.original.address?.slice(-4)}</p>
      </div>
    </div>,
    header: () => <span className="text-zinc-400">{columnsDic.logoURI}</span>,
  }),
  columnHelper.accessor('priceUSD', {
    header: () => <span className="text-zinc-400">{columnsDic.priceUSD}</span>,
    cell: (info: any) => <span className="text-zinc-400">$ {Number(info.getValue())?.toLocaleString()}</span>,
  }),
  columnHelper.accessor('action', {
    header: () => <span className="text-zinc-400">{columnsDic.action}</span>,
  }),
]

const TokenTable = ({ tokens, handleBuyToken, chains, setSelectedChain, selectedChain }: TokenTableProps) => {
  const quickBuyInputRef: any = useRef(null);

  const [isQuickBuy, setIsQuickBuy] = useState(true);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columns] = useState<typeof defaultColumns>(() => defaultColumns);


  const table = useReactTable({
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    columns: columns,
    data: tokens,
  })

  function handleChangeQuickBuySwitch(e: any) {
    setIsQuickBuy(e.target.checked);
    setColumnVisibility({ ...columnVisibility, action: e.target.checked });

    if (e.target.checked) {
      quickBuyInputRef?.current?.focus?.();
    }
  }

  function onBlurQuickBuyInput(e: any) {
    // TODO: validate input value
    setBuyAmount(e.target.value);
  }

  function handleClickOnQuickBuy(row: TokenType) {
    handleBuyToken({ ...row, amount: buyAmount });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between sticky top-0">
        <div className="flex flex-row items-center gap-4">
          {/** columns visible change */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <div className='bg-[#171821] text-zinc-400 rounded-full p-2 px-4 flex flex-row items-center gap-4 hover:cursor-pointer border border-zinc-400'>
                <div className='flex flex-row items-center gap-1'>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-zinc-400">
                    <path d="M8.00898 15.2001C6.46259 15.2001 5.20898 16.4537 5.20898 18.0001C5.20898 19.5465 6.46259 20.8001 8.00898 20.8001C9.55538 20.8001 10.809 19.5465 10.809 18.0001C10.809 16.4537 9.55538 15.2001 8.00898 15.2001Z" ></path>
                    <path d="M15.9943 3.20015C14.4479 3.20015 13.1943 4.45375 13.1943 6.00015C13.1943 7.54654 14.4479 8.80015 15.9943 8.80015C17.5407 8.80015 18.7943 7.54654 18.7943 6.00015C18.7943 4.45375 17.5407 3.20015 15.9943 3.20015Z" ></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00899 3.19995C8.45082 3.19995 8.80899 3.55812 8.80899 3.99995L8.80899 12C8.80899 12.4418 8.45082 12.8 8.00899 12.8C7.56717 12.8 7.20899 12.4418 7.20899 12L7.20899 3.99995C7.20899 3.55812 7.56717 3.19995 8.00899 3.19995Z" ></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9946 11.2C16.4364 11.2 16.7946 11.5581 16.7946 12V20C16.7946 20.4418 16.4364 20.8 15.9946 20.8C15.5528 20.8 15.1946 20.4418 15.1946 20V12C15.1946 11.5581 15.5528 11.2 15.9946 11.2Z" ></path>
                  </svg>

                  <p>Filter</p>
                </div>

                <div className="flex">
                  <svg width="16" height="16" viewBox="0 0 11 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-zinc-400">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.643562 0.232544C0.864944 -0.0441829 1.26874 -0.0890491 1.54547 0.132332L5.4224 3.23388L9.29933 0.132332C9.57606 -0.0890491 9.97985 -0.0441829 10.2012 0.232544C10.4226 0.50927 10.3777 0.913066 10.101 1.13445L5.82324 4.55667C5.58889 4.74415 5.2559 4.74415 5.02155 4.55667L0.743774 1.13445C0.467048 0.913066 0.422181 0.50927 0.643562 0.232544Z" />
                  </svg>
                </div>
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content className="">
                <div className="gap-2 overflow-auto m-h-80 bg-[#171821] text-zinc-400 rounded-xl mt-2 border shadow-xl">
                  <div className="border-b p-3">Filter columns</div>

                  <div className="flex flex-col gap-2 p-3">
                    {table.getAllLeafColumns().map(column => {
                      return column.id !== "action" && (
                        <div key={column.id} className="flex flex-row items-center text-sm gap-2">
                          <input
                            {...{
                              type: 'checkbox',
                              checked: column.getIsVisible(),
                              onChange: column.getToggleVisibilityHandler(),
                              className: 'w-5 h-5 border cursor-pointer border-gray-300 checked:bg-red-200',
                            }}
                          />
                          {/** @ts-ignore */}
                          <label>{columnsDic?.[column.id] || ''}</label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/** switch quick buy and input amount */}
          <div className="flex flex-row items-center gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-zinc-300">Quick Buy</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" checked={isQuickBuy} onChange={handleChangeQuickBuySwitch} />
                <div className="w-9 h-5 bg-zinc-500 peer-focus:outline-0 peer-focus:ring-transparent rounded-full peer transition-all ease-in-out duration-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 hover:peer-checked:bg-[#6A60E8]"></div>
              </label>
            </div>

            <div className={`border border-zinc-500 rounded-full ${isQuickBuy ? 'hover:border-zinc-300' : 'opacity-60 user-select-none'}`}>
              <label className="relative gap-1 inline-flex items-center rounded-full p-2  bg-[#171821]">
                <img src={EhtLogo} className="w-6 h-6 rounded-full bg-transparent" />
                <input ref={quickBuyInputRef} disabled={!isQuickBuy} onBlur={onBlurQuickBuyInput} type="text" placeholder="0.0" className="w-[50px] bg-transparent text-zinc-300 outline-none mr-2" />
              </label>
            </div>
          </div>
        </div>

        {/** switch between chains */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className='bg-[#171821] rounded-full p-1 flex flex-row items-center gap-4 hover:cursor-pointer text-zinc-400 border'>
              <div className='flex flex-row items-center gap-1'>
                <img src={selectedChain?.logoURI} className='w-8 h-8 rounded-full' />
                <p>{selectedChain?.name}</p>
              </div>

              <div className="flex">
                <svg width="16" height="16" viewBox="0 0 11 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-zinc-400">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0.643562 0.232544C0.864944 -0.0441829 1.26874 -0.0890491 1.54547 0.132332L5.4224 3.23388L9.29933 0.132332C9.57606 -0.0890491 9.97985 -0.0441829 10.2012 0.232544C10.4226 0.50927 10.3777 0.913066 10.101 1.13445L5.82324 4.55667C5.58889 4.74415 5.2559 4.74415 5.02155 4.55667L0.743774 1.13445C0.467048 0.913066 0.422181 0.50927 0.643562 0.232544Z" />
                </svg>
              </div>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="">
              <div className="mt-2 overflow-auto h-80 bg-[#171821] rounded-xl text-zinc-400 border">
                <div className="border-b p-3 font-bold sticky top-0 bg-[#171821] z-50">Switch Network</div>

                <div className="flex flex-col gap-2 p-4">
                  {chains?.map?.((x: any) => (
                    <DropdownMenu.Item className="outline-none">
                      <div onClick={() => setSelectedChain(x)} className="flex flex-row items-center gap-2 cursor-pointer relative" key={x?.key}>
                        <img src={x?.logoURI} className="w-8 h-8 rounded-md" />
                        <span>{x?.name}</span>
                      </div>
                    </DropdownMenu.Item>
                  ))}
                </div>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <table className="overflow-auto max-h-[80vh]">
        <thead className="sticky top-0 bg-[#14151d] z-3 text-[#717A8C] text-left">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="h-16">
              {headerGroup.headers.map(header => {
                return (
                  <th key={header.id} className="">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                )
              })}
            </tr>
          ))}

        </thead>
        <tbody className="">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={`odd:bg-[#191a21] hover:bg-[#171821] h-14`}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {cell?.column?.id === "action" ? (
                    <div className="flex flex-row items-center gap-2">
                      <div title="Quick Buy" onClick={() => handleClickOnQuickBuy(cell.row.original)} className="inline-flex items-center p-1 z-3 rounded-full border gap-2 px-4 hover:cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.8022 9.00005C12.8022 9.07683 12.8022 9.14203 12.8027 9.1995C12.8602 9.20002 12.9254 9.20005 13.0022 9.20005L19.144 9.20004C19.5178 9.19995 19.883 9.19986 20.1694 9.24211C20.4678 9.28613 20.9441 9.41174 21.1982 9.89668C21.4523 10.3816 21.2845 10.8448 21.1508 11.1152C21.0226 11.3746 20.8147 11.6749 20.6018 11.9822L14.4501 20.8692C14.1042 21.369 13.8 21.8085 13.5347 22.1031C13.3974 22.2556 13.2222 22.4256 13.0071 22.5421C12.767 22.6721 12.4535 22.746 12.1146 22.6401C11.7756 22.5342 11.5599 22.2951 11.4365 22.0516C11.326 21.8333 11.2787 21.5938 11.2525 21.3903C11.2021 20.9971 11.2021 20.4626 11.2022 19.8548L11.2022 14.8L4.8582 14.8001C4.48427 14.8001 4.11903 14.8002 3.83269 14.758C3.53428 14.714 3.05786 14.5884 2.80376 14.1034C2.54966 13.6183 2.7176 13.1552 2.85128 12.8848C2.97955 12.6253 3.18754 12.3251 3.40048 12.0177L9.55437 3.12992C9.90026 2.6303 10.2044 2.19091 10.4697 1.8964C10.6071 1.74397 10.7823 1.57402 10.9974 1.45754C11.2374 1.32755 11.5509 1.25377 11.8898 1.35965C12.2287 1.46553 12.4445 1.70464 12.5678 1.94814C12.6783 2.16636 12.7257 2.40585 12.7518 2.60934C12.8023 3.00249 12.8022 3.53688 12.8022 4.14453L12.8022 9.00005Z" fill="#FFFF00"></path>
                        </svg>

                        <span className="text-zinc-400">{buyAmount || '0.0'}</span>
                      </div>

                      {/* <div title="Quick Buy" onClick={() => handleClickOnQuickBuy(cell.row.original)} className="inline-flex items-center p-1 z-3 rounded-full border gap-2 px-4 cursor-pointer bg-[#6A60E8]">
                        <span className="text-white">Buy token</span>
                      </div> */}
                    </div>
                  ) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;
