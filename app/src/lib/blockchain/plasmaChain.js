import { defineChain } from "viem";

export const plasmaChain = defineChain({
    id: 9746,
    name: "Plasma Testnet",
    network: "plasma-testnet",
    nativeCurrency: {
        name: "XPL",
        symbol: "XPL",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://testnet-rpc.plasma.to"],
        },
    },
    blockExplorers: {
        default: {
            name: "Plasma Explorer",
            url: "https://explorer.plasma.to",
        },
    },
});