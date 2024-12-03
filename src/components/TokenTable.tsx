// import { Table } from "antd";
import { Table } from "@radix-ui/themes"

export interface TokenType {
  address: string;
  chainId: number;
  coinKey: string;
  decimals: number;
  logoURI: string;
  name: string;
  priceUSD: string;
  symbol: string;
}


interface TokenTableProps {
  tokens: TokenType[],
  handleBuyToken: (token: TokenType) => void
}

const TokenTable = ({ tokens, handleBuyToken }: TokenTableProps) => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">Logo</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">coinKey</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">address</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">chainId</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">decimals</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">priceUSD</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">symbol</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white text-left w-1/8">Action</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {tokens.map?.((token: any, key: number) => (
          <Table.Row key={key} className="hover:opacity-70 hover:cursor-pointer">
            <Table.Cell className="w-1/8" children={<img alt="logo" src={token?.logoURI} className="w-8 h-8 rounded-full border" />} />
            <Table.Cell className="w-1/8 text-white">{token?.coinKey}</Table.Cell>
            <Table.Cell className="w-1/8 text-white">{token?.address}</Table.Cell>
            <Table.Cell className="w-1/8 text-white">{token?.chainId}</Table.Cell>
            <Table.Cell className="w-1/8 text-white">{token?.decimals}</Table.Cell>
            <Table.Cell className="w-1/8 text-white">{token?.priceUSD}</Table.Cell>
            <Table.Cell className="w-1/8 text-white">{token?.symbol}</Table.Cell>
            <Table.Cell>
              <button onClick={() => handleBuyToken(token)} className='bg-yellow-400 hover:opacity-80 p-1 rounded px-5 w-full'>
                <p className='text-[#717A8C]'>Buy</p>
              </button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>

  )
}

export default TokenTable