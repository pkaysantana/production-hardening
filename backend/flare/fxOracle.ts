/**
 * Mock Oracle Service
 * 
 * In a production environment, this would interface with the Flare FTSO (Flare Time Series Oracle)
 * to retrieve real-time decentralized price feeds.
 * 
 * For this prototype, we simulate fetching the stablecoin/C2FLR rate.
 */

export async function getFxRate(pair: string): Promise<number> {
    console.log(`[Oracle] Fetching price for ${pair}...`);

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock logic
    if (pair === "USDT/C2FLR") {
        // Return a dummy rate (e.g. 100 C2FLR per USDT)
        // Hardcoded for demo stability
        return 100;
    }

    throw new Error(`Unsupported currency pair: ${pair}`);
}
