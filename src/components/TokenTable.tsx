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
          <Table.ColumnHeaderCell className="text-white">
            LOGO
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            COINKEY
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            ADDRESS
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            CHAINID
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            DECIMALS
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            PRICEUSD
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
            SYMBOL
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-white">
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
              className="w-1/8"
              children={
                <img
                  alt="logo"
                  src={token?.logoURI}
                  className="w-8 h-8 rounded-full border"
                />
              }
            />
            <Table.Cell className="w-1/8 text-white">
              {token?.coinKey}
            </Table.Cell>
            <Table.Cell className="w-1/8 text-white">
              {token?.address.substring(0, 6)}....{token.address.slice(-4)}
            </Table.Cell>
            <Table.Cell className="w-1/8 text-white">
              {token?.chainId}
            </Table.Cell>
            <Table.Cell className="w-1/8 text-white">
              {token?.decimals}
            </Table.Cell>
            <Table.Cell className="w-1/8 text-white">
              {token?.priceUSD}
            </Table.Cell>
            <Table.Cell className="w-1/8 text-white">
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
