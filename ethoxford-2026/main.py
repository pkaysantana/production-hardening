from web3 import Web3
from eth_account import Account

# ---- CONFIG ----

# Public Plasma RPC (OK for testing; for production use your own/provider RPC)
PLASMA_RPC_URL = "https://rpc.plasma.to"  # mainnet beta RPC[web:53][web:54]

# Your marketplace wallet private key (KEEP THIS SECRET!)
MARKETPLACE_PRIVATE_KEY = "0xYOUR_PRIVATE_KEY_HERE"

# USDT contract on Plasma (check plasmascan.to if this changes)
USDT_CONTRACT_ADDRESS = Web3.to_checksum_address(
    "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb"
)  # USDT0 on Plasma[web:61]

# Buyer / recipient Plasma address
RECIPIENT_ADDRESS = Web3.to_checksum_address("0xBUYER_PLASMA_ADDRESS_HERE")

# Amount to send: in USDT units (e.g. 10 = 10 USDT)
AMOUNT_USDT = 10

# ---- SETUP WEB3 ----

w3 = Web3(Web3.HTTPProvider(PLASMA_RPC_URL))
assert w3.is_connected(), "Could not connect to Plasma RPC"

chain_id = 9745  # Plasma Mainnet Beta chain ID[web:53][web:54]

# Load marketplace account
account = Account.from_key(MARKETPLACE_PRIVATE_KEY)
sender_address = account.address

# ---- USDT ABI (minimal ERC-20) ----
erc20_abi = [
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
]

usdt = w3.eth.contract(address=USDT_CONTRACT_ADDRESS, abi=erc20_abi)

# ---- BUILD TRANSFER ----

# Fetch decimals so we can convert human amount -> smallest units
decimals = usdt.functions.decimals().call()
amount_wei = int(AMOUNT_USDT * (10 ** decimals))

nonce = w3.eth.get_transaction_count(sender_address)

tx = usdt.functions.transfer(RECIPIENT_ADDRESS, amount_wei).build_transaction(
    {
        "from": sender_address,
        "nonce": nonce,
        "chainId": chain_id,
        # you can tweak gas values; these are examples
        "gas": 150000,
        "gasPrice": w3.to_wei("0.0000001", "gwei"),
    }
)

# ---- SIGN & SEND ----

signed_tx = w3.eth.account.sign_transaction(tx, private_key=MARKETPLACE_PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

print(f"Sent! Tx hash: {tx_hash.hex()}")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Confirmed in block:", receipt.blockNumber)
