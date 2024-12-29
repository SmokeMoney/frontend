import axios from 'axios';

const getTopTokens = async (network: string, time_ago: string) => {
    let data = JSON.stringify({
    "query": "query topTokens($network: evm_network, $time_ago: DateTime!) {\n  EVM(network: $network) {\n    DEXTradeByTokens(\n      orderBy: {descendingByField: \"count\"}\n      limit: {count: 100}\n      where: {Block: {Time: {since: $time_ago}}}\n    ) {\n      Trade {\n        Currency {\n          Symbol\n          SmartContract\n          Fungible\n          Name\n        }\n        Amount(maximum: Block_Number)\n        AmountInUSD(maximum: Block_Number)\n      }\n      pairs: uniq(of: Trade_Side_Currency_SmartContract)\n      dexes: uniq(of: Trade_Dex_SmartContract)\n      amount: sum(of: Trade_Amount)\n      usd: sum(of: Trade_AmountInUSD)\n      buyers: uniq(of: Trade_Buyer)\n      sellers: uniq(of: Trade_Sender)\n      count\n    }\n  }\n}\n",
    "variables": "{\n  \"network\": \"base\",\n  \"time_ago\": \"2024-12-26T12:43:20Z\"\n}"
    });

    let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://streaming.bitquery.io/graphql',
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ory_at_PP4qg-V9t9j0kJCykbIu0auKYGwiWi436Idxhn8fD9U.I8h1JEydSReim1TYjstAv1rH44NBZuzqirc6a_DMq7c'
    },
    data : data
    };

    axios.request(config)
    .then((response) => {
        console.log(JSON.stringify(response.data));
        return response.data;
    })
    .catch((error) => {
        console.log(error);
    });
}

export default getTopTokens;