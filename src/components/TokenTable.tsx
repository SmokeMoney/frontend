import { Table } from "@radix-ui/themes";

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
}

interface TokenTableProps {
  tokens: TokenType[];
  handleBuyToken: (token: TokenType) => void;
}

const TokenTable = ({ tokens, handleBuyToken }: TokenTableProps) => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row className="">
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            LOGO
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            COINKEY
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            ADDRESS
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            CHAINID
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            DECIMALS
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            PRICEUSD
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            SYMBOL
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-[#717A8C]">
            ACTION
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {tokens.map?.((token: any, key: number) => (
          <Table.Row
            key={key}
            className="hover:opacity-70 hover:cursor-pointer h-10"
          >
            <Table.Cell
              className=""
              children={
                <img
                  alt="logo"
                  src={token?.logoURI}
                  className="w-8 h-8 rounded-full border"
                />
              }
            />
            <Table.Cell className=" text-[#717A8C]">
              {token?.coinKey}
            </Table.Cell>
            <Table.Cell className=" text-[#717A8C]">
              {token?.address.substring(0, 6)}....{token.address.slice(-4)}
            </Table.Cell>
            <Table.Cell className=" text-[#717A8C]">
              {token?.chainId}
            </Table.Cell>
            <Table.Cell className=" text-[#717A8C]">
              {token?.decimals}
            </Table.Cell>
            <Table.Cell className=" text-[#717A8C]">
              $ {Number(token?.priceUSD).toFixed(2)}
            </Table.Cell>
            <Table.Cell className=" text-[#717A8C]">
              {token?.symbol}
            </Table.Cell>
            <Table.Cell>
              <button
                onClick={() => handleBuyToken(token)}
                className="bg-yellow-400 hover:opacity-80 p-1 rounded-full px-5 w-full"
              >
                <p className="text-[#000]">Buy</p>
              </button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default TokenTable;
