import './style.css';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// --- Configuration --- > PASTE YOUR DATA HERE < ---

// 1. PASTE the secret key array from poolTokens/mint-authority.json here
//    WARNING: THIS KEY WILL BE PUBLICLY VISIBLE IN YOUR FRONTEND CODE!
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([21,85,39,121,181,44,127,183,45,214,56,231,221,225,109,34,167,195,118,189,106,132,117,6,217,189,60,41,123,62,96,245,228,151,106,227,17,50,221,91,33,255,9,231,119,161,94,15,153,50,51,79,14,108,255,207,249,50,91,70,225,39,118,112]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
const MINT_ADDRESSES: { [symbol: string]: string } = {
    "BTC": "6AegdhgAVjTpzMW1nkArhDjnLGUZpKFXjRFYugWFpyeA",
    "ETH": "F9Udq5xhkTyhas8wvjphby3qdmbGTmipA57ddH4mTWTu",
    "XRP": "9dmskvLKeWAcs7owwoDQWdwb1VKBUUfCvu1VjJWpMz1K",
    "SOL": "6y6xHBexUauwgRit7tzVjc8YUkS1Mo8FGdwBz6coZFUQ",
    "ADA": "8V3RtrQEDDoB9Tdcn7n4Da9oLQu1XdDFFzk1VpRN2LbC",
    "DOGE": "4ZnSLps1AboSEMwiECYpjamAgsVu253fG8xVM9UsiaeX",
    "LINK": "8xkk7n5RGeZnEu97nUyzx3bpVxGpPkGU17GpsttCTWdJ",
    "SUI": "6kAaZ8vpqtzCs2z86snAVvnaNMncsHX9ka4uYnRPWSex",
    "AVAX": "J1pLx5hD8Li1uoDf76NfkidvRGanhBkQuvrDJrTyVvSE",
    "SHIB": "6AGwkr1kYJQSVT2cSxjnDEb44h6rVwZPqqNoWCM4Z3kZ",
    "LTC": "9UBozfZzsE9faZ9tmRg7UCNrzj1qgS4kAFNzioanz57P",
    "DOT": "FvM7NJN8HYXcd2QtZP2CrGuJfmtGqX4omZaqiF3gq1ww",
    "UNI": "A5HrUmyLtDQSSpA23P6Y1A9e7EiszXMDQqqYBQaRhPAk",
    "ONDO": "C7nWPH2N49GAL9MCRAtc4Kf4CnafcJNNRj6pSV9CzTcU",
    "AAVE": "9iwXRcoDpPLdZhZm5eh1UFzrSRSnMkUdmHuBhgV7pJRN",
    "PEPE": "EDFPLjDjwZtSvUEfcPSp17rYPvxGKxHNwFMXWSeoEBU7",
    "TRUMP": "31w4gBF4SMQ3RFaSTfkLEjR2fEaFfDfW5v73uQC61xBk",
    "POL": "9wRTcjsn5wMpLFHQ3V4Ybxb9sESpvF5zHGYnaPyKQ8RF",
    "FIL": "BrLwBb5KP8VewPMgDEUqFqZTEfpahXUFPJXpyNy9JmWg",
    "RENDER": "4V7jcqLn8ZnLBf851SvBZE1gn42upB8BWzCV3VLZkUXW",
    "ARB": "Hcjbru6GToDrs6JbPJ7gFNGNHKxt2dkzfaWM14zgPv8j",
    "JUP": "EDmFSydQg8EuEdCD2kYs1ieT6Etc7vh1rhNZ5b7f523H",
    "OP": "FHCZ3XdzfoQq1JAGrtTxa9b1jnuaQ1g9GE8mjmvnoAGX",
    "S": "HrU9BDjK8yNZHf75eTKrWxZ3S6Em1bCAZownrz3W2pZT",
    "FET": "3QiYAvdDjrhUU1qBUcFdDeCnm9SbTDmuikAAqDF6QQWX",
    "INJ": "D3CF2319ybr5W9DQJJFawnB47quqWDBWrtWDJwPT7HnY",
    "IMX": "H7UdmbDEmghjrJHLaNtTpBaRw1frF3EgJZgCAfvYyyES",
    "WLD": "H2DTH5zm6ZXvJy6ZgqJvDgHAN4WahX4dV8F5BFRHNLbg",
    "LDO": "C6NSxxt5yQrS6wBfSoHatRu9LBV2kSXQGRLuBJMHCGEL",
    "GRT": "J82iuZsc7yoiWYrdUg265Hr9U4Vv73uFhd8nxZ8sAdtB",
    "QNT": "4MpaN6bCFVRrmtqffqe5ougKgHqREpcAqTyAfpFCQjrP",
    "BONK": "GGaYCMjo7G8RkUGhU3SHkrq527wrxd7fZDTqx2hwEYh",
    "JTO": "8sPM4djm1iPPenfrjMnWF8DX51sw1uTJ5nES2n4jsWQ",
    "SAND": "HgnPMfaJshhRqw9HnpHqSPdCjUHJHnSgRfT19VH1gERu",
    "ENS": "AF7gxAJwTi8nhVryWsz3y3SERRe1HD6Jp6uu4EWf2tMp",
    "GALA": "GpC4dbP5T78K18U1MLokjT4DZrLDggBqsE9oxrpPEkfT",
    "PYTH": "HSzvHs55CuTxCSGQd1a2mq1kZ9SnBcgUNUfVWCSKobhm",
    "RAY": "CfkDFjbT6VQnkhUMHyoSJPq8F5rsW83kVk3cFcFevfpN",
    "HNT": "BFVYem5FpqPFnUzJLTsQtMgqTbxHXhNaWwtW16ifDkuH",
    "AXS": "BC7nBLFaBkdrL3ko4jdsjuVGvKEMWi4qrAT4wMDQeVZZ",
    "MANA": "J4oSn2SPWRQFNgn97FFB3QaFwVt6vKdkv4nn7aiYbzW7",
    "CRV": "4sW483oThWKnBjtuVM4A1mR4iAGeCWRNr66U7TdyhzrN",
    "WIF": "9oXBu5cbUFFoRZh4Q2RZcXwX7k6uuoofdCDhi1RoaDM9",
    "GRASS": "7K3VgszKPaWcVhZ4TXtBAGwongDDUm92pcM3iB8BkQGC",
    "CAKE": "DQjPUzT4jcrp2G7kY34HidmSafPpc1Dsogv3zR8p1Ryd",
    "VIRTUAL": "9hPUqWTzRG9vVJRW1urBUEiAvWYhKcbLFA7PdB4f9kVY",
    "AERO": "EGwiqY2x5UjzoSnH7dHPc4HzkEXbqU3Sz8FQD7GzVLjx",
    "CHZ": "A8d4fTffdxAppyBKnpokgTfs4caJfh82399bj3GhHsw",
    "COMP": "D7ZyTQ3yzMShzR4cb2hRVU2wQZFHX5NoMjyzkGHseGEV",
    "APE": "B1M5GTkdqVTNJsWcyNggmKz4DBVcZeJ1PGechNmg9yg8"
};

// 3. Configure your RPC Endpoint (localhost, devnet, etc.)
const RPC_ENDPOINT = 'http://127.0.0.1:8900'; // Use port 8900

// --- End Configuration ---

// Globals
let connection: Connection;
let mintAuthority: Keypair;
let currentClusterInfo: ClusterInfo; // Store cluster info globally

// Interface for cluster information
interface ClusterInfo {
    explorerClusterParam: string; // For explorer.solana.com
    solscanClusterParam: string;  // For solscan.io
}

// UI Elements
const recipientInput = document.getElementById('recipient-address') as HTMLInputElement;
const tokenSelect = document.getElementById('token-select') as HTMLSelectElement;
const amountInput = document.getElementById('mint-amount') as HTMLInputElement;
const mintButton = document.getElementById('mint-button') as HTMLButtonElement;
const statusMessageEl = document.getElementById('status-message') as HTMLParagraphElement;
const txSignatureEl = document.getElementById('tx-signature') as HTMLParagraphElement;
const recipientLinksArea = document.getElementById('recipient-links-area') as HTMLDivElement;

/**
 * Update the status display and clear links.
 */
function updateStatus(message: string, isError = false) {
    console.log(message);
    if (statusMessageEl) {
        statusMessageEl.textContent = `Status: ${message}`;
        statusMessageEl.className = isError ? 'error' : '';
    }
    // Clear links when status updates (except for final success state)
    if (txSignatureEl) txSignatureEl.innerHTML = '';
    if (recipientLinksArea) recipientLinksArea.innerHTML = '';
}

/**
 * Determines cluster parameters for explorer links based on RPC endpoint.
 */
function getClusterInfo(): ClusterInfo {
    if (RPC_ENDPOINT.includes('devnet')) {
        return { explorerClusterParam: 'devnet', solscanClusterParam: 'devnet' };
    }
    if (RPC_ENDPOINT.includes('testnet')) {
        return { explorerClusterParam: 'testnet', solscanClusterParam: 'testnet' };
    }
    if (RPC_ENDPOINT.includes('mainnet')) {
        return { explorerClusterParam: 'mainnet-beta', solscanClusterParam: 'mainnet-beta' };
    }
    // Default to custom cluster
    const customUrlParam = `custom&customUrl=${encodeURIComponent(RPC_ENDPOINT)}`;
    return { explorerClusterParam: customUrlParam, solscanClusterParam: customUrlParam };
}

/**
 * Generates a Solscan URL.
 */
function generateSolscanUrl(type: 'tx' | 'account' | 'token', id: string, clusterInfo: ClusterInfo): string {
    // Note: Solscan uses 'token' for mint addresses, 'account' for other accounts (like token accounts, wallets)
    const solscanType = type === 'account' ? 'account' : type; // Map 'address' to 'account' if needed, or handle separately
    return `https://solscan.io/${solscanType}/${id}?cluster=${clusterInfo.solscanClusterParam}`;
}

/**
 * Update status with transaction signature links.
 */
function showTransactionLinks(signature: string) {
    if (!currentClusterInfo) {
        currentClusterInfo = getClusterInfo(); // Ensure cluster info is available
    }
    if (!txSignatureEl) return; // Check if element exists

    // Only generate Solscan URL
    const solscanUrl = generateSolscanUrl('tx', signature, currentClusterInfo);

    // Make the signature text the link to Solscan
    txSignatureEl.innerHTML = `Transaction: <a href="${solscanUrl}" target="_blank" title="View on Solscan">${signature}</a>`;
}

/**
 * Show links for the recipient address.
 */
function showRecipientLinks(address: string) {
    if (!recipientLinksArea || !currentClusterInfo) return;

    // Only generate Solscan URL
    const solscanUrl = generateSolscanUrl('account', address, currentClusterInfo);
    const shortAddress = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;

    // Make the recipient text the link to Solscan
    recipientLinksArea.innerHTML = `<a href="${solscanUrl}" target="_blank" title="View Recipient on Solscan">Recipient (${shortAddress})</a>`;
}

/**
 * Populate the token dropdown.
 */
function populateTokenDropdown() {
    if (!tokenSelect) return;
    tokenSelect.innerHTML = '<option value="">-- Select Token --</option>'; // Clear existing

    const sortedSymbols = Object.keys(MINT_ADDRESSES).sort();

    for (const symbol of sortedSymbols) {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        tokenSelect.appendChild(option);
    }
}

/**
 * Handle the mint button click.
 */
async function handleMint() {
    if (!connection || !mintAuthority || !recipientInput || !tokenSelect || !amountInput || !mintButton) {
        updateStatus('Initialization error. Check console.', true);
        return;
    }

    const recipientAddressStr = recipientInput.value.trim();
    const selectedSymbol = tokenSelect.value;
    const amountStr = amountInput.value.trim();

    if (!recipientAddressStr) {
        updateStatus('Please enter a recipient address.', true);
        return;
    }

    if (!selectedSymbol) {
        updateStatus('Please select a token.', true);
        return;
    }

    if (!amountStr) {
        updateStatus('Please enter an amount to mint.', true);
        return;
    }

    let recipientPublicKey: PublicKey;
    try {
        recipientPublicKey = new PublicKey(recipientAddressStr);
    } catch (error) {
        updateStatus('Invalid recipient address.', true);
        console.error(error);
        return;
    }

    const mintAddressStr = MINT_ADDRESSES[selectedSymbol];
    if (!mintAddressStr) {
        updateStatus(`Mint address not found for ${selectedSymbol}. Check configuration.`, true);
        return;
    }

    const mintPublicKey = new PublicKey(mintAddressStr);

    mintButton.disabled = true;
    updateStatus(`Minting ${amountStr} ${selectedSymbol} to ${recipientAddressStr}...`);
    if (recipientLinksArea) recipientLinksArea.innerHTML = '';

    try {
        // Need to get mint info to know decimals
        const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
        if (!mintInfo || !mintInfo.value || !('parsed' in mintInfo.value.data)) {
            throw new Error('Could not fetch mint info or data is not parsed');
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;

        // --- Overflow Validation based on Decimals ---
        const scale = 10n ** BigInt(decimals);
        const u64Max = 18446744073709551615n; // Max value for u64
        const maxSafeDisplayAmount = u64Max / scale; // Integer division gives max whole tokens

        const userAmountDisplay = parseInt(amountStr, 10);
        if (isNaN(userAmountDisplay) || userAmountDisplay <= 0) {
            throw new Error('Please enter a valid positive amount.');
        }

        if (BigInt(userAmountDisplay) > maxSafeDisplayAmount) {
             throw new Error(`Amount too large for ${decimals} decimals. Maximum allowed: ${maxSafeDisplayAmount}`);
        }
        // --- End Overflow Validation ---

        const amountToMint = BigInt(userAmountDisplay) * scale;

        updateStatus(`Fetching/creating token account for recipient...`);

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            mintAuthority,
            mintPublicKey,
            recipientPublicKey,
            false,
            'confirmed',
            undefined,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Update status message with raw amount
        updateStatus(`Minting ${amountToMint} (raw) tokens...`);

        const signature = await mintTo(
            connection,
            mintAuthority,
            mintPublicKey,
            recipientTokenAccount.address,
            mintAuthority,
            amountToMint, // Use validated & scaled amount
            [],
            { commitment: 'confirmed' },
            TOKEN_PROGRAM_ID
        );

        // Update final status message with the amount
        updateStatus(`Successfully minted ${userAmountDisplay} ${selectedSymbol}!`);
        showTransactionLinks(signature);
        showRecipientLinks(recipientAddressStr);

    } catch (error: any) {
        updateStatus(`Minting failed: ${error.message || error}`, true);
        console.error('Minting error:', error);
    } finally {
        mintButton.disabled = false;
    }
}

/**
 * Initialize the faucet script.
 */
async function initialize() {
    updateStatus('Initializing...');

    // Validate embedded key
    if (MINT_AUTHORITY_SECRET_KEY.length !== 64) {
        updateStatus('ERROR: Invalid MINT_AUTHORITY_SECRET_KEY length. Paste the 64-byte array.', true);
        return;
    }
    // Check if placeholder key is still there (very basic check)
    // Note: This check needs to be updated if you generate a key starting with [1, 2, 3, ...]
    if (MINT_AUTHORITY_SECRET_KEY[0] === 1 && MINT_AUTHORITY_SECRET_KEY[1] === 2 && MINT_AUTHORITY_SECRET_KEY[2] === 3) {
        updateStatus('ERROR: Placeholder MINT_AUTHORITY_SECRET_KEY found. Paste your actual key.', true);
        return;
    }
    // Check if mint addresses are empty or placeholder
    if (Object.keys(MINT_ADDRESSES).length === 0 || MINT_ADDRESSES["BTC"]?.startsWith('Your')) {
        updateStatus('ERROR: Placeholder or empty MINT_ADDRESSES found. Paste your actual mint addresses object.', true);
        return;
    }

    try {
        // Determine cluster info early
        currentClusterInfo = getClusterInfo();
        console.log('Cluster Info:', currentClusterInfo);

        mintAuthority = Keypair.fromSecretKey(MINT_AUTHORITY_SECRET_KEY);
        console.log('Mint Authority:', mintAuthority.publicKey.toBase58());

        connection = new Connection(RPC_ENDPOINT, 'confirmed');
        console.log('Connected to:', RPC_ENDPOINT);
        await connection.getVersion(); // Test connection
        console.log('Connection successful.');

        populateTokenDropdown();

        if (mintButton) {
            mintButton.addEventListener('click', handleMint);
        }

        updateStatus('Ready. Enter address, select token, and click Mint.');

    } catch (error: any) {
        updateStatus(`Initialization failed: ${error.message || error}`, true);
        console.error('Initialization error:', error);
    }
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initialize); 