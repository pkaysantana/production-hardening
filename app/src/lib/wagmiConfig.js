import { createConfig, http } from 'wagmi'
import { plasmaChain } from './plasmaChain'

export const config = createConfig({
    chains: [plasmaChain],
    transports: {
        [plasmaChain.id]: http(),
    },
})