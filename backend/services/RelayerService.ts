import { ethers } from "ethers";
import { Logger } from "./logger";

export class RelayerService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private logger: Logger;

    constructor(rpcUrl: string, privateKey: string, serviceName: string) {
        this.logger = new Logger(serviceName);
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        this.logger.info(`Initialized RelayerService for ${serviceName}`);
    }

    getWallet(): ethers.Wallet {
        return this.wallet;
    }

    getProvider(): ethers.JsonRpcProvider {
        return this.provider;
    }

    async retry<T>(operation: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                this.logger.warn(`Operation failed, retrying (${i + 1}/${retries})...`, { error: (error as Error).message });
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i))); // Exponential backoff
            }
        }
        this.logger.error(`Operation failed after ${retries} retries`, lastError);
        throw lastError;
    }

    async sendTransaction(
        contract: ethers.Contract,
        methodName: string,
        args: any[],
        overrides: any = {}
    ): Promise<ethers.TransactionReceipt | null> {
        return this.retry(async () => {
            this.logger.info(`Sending transaction: ${methodName}`, args);

            // Get current fee data for reliable gas estimation
            const feeData = await this.provider.getFeeData();

            // Bumping gas slightly for reliability
            const txOverrides = {
                ...overrides,
                maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 120n) / 100n : undefined,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : undefined
            };

            const tx = await contract[methodName](...args, txOverrides);
            this.logger.info(`Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            this.logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

            return receipt;
        });
    }

    async pollEvents(
        contract: ethers.Contract,
        eventName: string,
        fromBlock: number,
        callback: (event: ethers.Log, parsedArgs: any) => Promise<void>
    ) {
        this.logger.info(`Starting event poll for ${eventName} from block ${fromBlock}`);

        let currentFromBlock = fromBlock;

        setInterval(async () => {
            try {
                const latestBlock = await this.provider.getBlockNumber();
                if (latestBlock <= currentFromBlock) return;

                const filter = contract.filters[eventName]();
                const logs = await contract.queryFilter(filter, currentFromBlock, latestBlock);

                for (const log of logs) {
                    if (log instanceof ethers.EventLog) {
                        try {
                            this.logger.info(`Processing event ${eventName} from tx ${log.transactionHash}`);
                            await callback(log, log.args);
                        } catch (err) {
                            this.logger.error(`Error processing event ${eventName}`, err);
                        }
                    }
                }

                currentFromBlock = latestBlock + 1;
            } catch (err) {
                this.logger.error("Error polling events", err);
            }
        }, 5000); // Poll every 5 seconds
    }
}
