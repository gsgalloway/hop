import { mainnet as mainnetAddresses } from '@hop-protocol/addresses'
import { mainnet as networks } from '@hop-protocol/networks'
import { Chains } from './types'

const chains: Chains = {
  ethereum: {},
  xdai: {},
  polygon: {}
}

for (let chain in chains) {
  chains[chain].name = networks[chain]?.name
  chains[chain].chainId = networks[chain]?.networkId
  chains[chain].rpcUrl = networks[chain]?.rpcUrls?.[0]
  chains[chain].explorerUrl = networks[chain]?.explorerUrls?.[0]
}

const addresses = mainnetAddresses.bridges
const bonders = mainnetAddresses.bonders
export { addresses, chains, bonders }