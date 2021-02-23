export const l1EthRpcUrl = 'https://kovan.rpc.hop.exchange'
export const l2ArbitrumRpcUrl = 'https://kovan3.arbitrum.io/rpc'
export const l2OptimismRpcUrl = 'https://kovan.optimism.rpc.hop.exchange'
export const l2xDaiRpcUrl = 'https://sokol.poa.network'

export const tokens = {
  DAI: {
    kovan: {
      l1CanonicalToken: '0x7d669A64deb8a4A51eEa755bb0E19FD39CE25Ae9',
      l1Bridge: '0xe74EFb19BBC46DbE28b7BaB1F14af6eB7158B4BE'
    },
    arbitrum: {
      l1CanonicalBridge: '0xE681857DEfE8b454244e701BA63EfAa078d7eA85',
      l2CanonicalToken: '0x7d669A64deb8a4A51eEa755bb0E19FD39CE25Ae9',
      l2Bridge: '0xf3af9B1Edc17c1FcA2b85dd64595F914fE2D3Dde',
      uniswapRouter: '0x2B6812d2282CF676044cBdE2D0222c08e6E1bdb2',
      uniswapFactory: '0xd28B241aB439220b85b8B90B912799DefECA8CCe',
      uniswapExchange: '0xD637bf04dF4FDFDf951C06e3c87f7801c85b161f'
    },
    optimism: {
      l1CanonicalBridge: '0xA6e9F1409fe85c84CEACD5936800A12d721009cE',
      l2CanonicalToken: '0x57eaeE3D9C99b93D8FD1b50EF274579bFEC8e14B',
      l2Bridge: '0x6d2f304CFF4e0B67dA4ab38C6A5C8184a2424D05',
      uniswapRouter: '0x3C67B82D67B4f31A54C0A516dE8d3e93D010EDb3',
      uniswapFactory: '0x3e4CFaa8730092552d9425575E49bB542e329981',
      uniswapExchange: '0x65F72DF8a668BC6272B059BB7F53ADc91066540C'
    },
    xdai: {
      l1CanonicalBridge: '0xA960d095470f7509955d5402e36d9DB984B5C8E2',
      l2CanonicalToken: '0x714983a8Dc3329bf3BeB8F36b49878CF944E5A3B',
      l2Bridge: '0x774CAB547c3BD28eC0e688639bC74e87748C187f',
      uniswapRouter: '0xA7f6C324c44ba178938Ce804F3E877340B48d918',
      uniswapFactory: '0x81190779A522B1fBA5f80abd9BADA3618A66ca02',
      uniswapExchange: '0xdB00b4f81c69D8b59B75EAF859dcAEb52bfBee05'
    }
  },
  ARB: {
    kovan: {
      l1CanonicalToken: '0xE41d965f6e7541139f8D9F331176867FB6972Baf',
      l1Bridge: '0xFb157C509F27a4c474b23Ef23BDD4dE16fabF627'
    },
    arbitrum: {
      l1CanonicalBridge: '0xE681857DEfE8b454244e701BA63EfAa078d7eA85',
      l2CanonicalToken: '0xE41d965f6e7541139f8D9F331176867FB6972Baf',
      l2Bridge: '0x428f09F093c836fE2b6be59d14Ed0c9DFCe4608F',
      uniswapRouter: '0x2B6812d2282CF676044cBdE2D0222c08e6E1bdb2',
      uniswapFactory: '0xd28B241aB439220b85b8B90B912799DefECA8CCe',
      uniswapExchange: '0xeA7BC91aB88759039a977AB8E774f09BF33c9A20'
    }
  }
}