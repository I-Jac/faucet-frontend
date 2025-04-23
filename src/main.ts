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
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([82,223,100,247,46,15,85,199,116,144,243,171,133,84,19,137,105,150,249,230,46,76,210,26,149,206,118,170,140,171,139,179,101,46,221,188,162,223,224,202,54,154,33,236,149,7,73,140,124,57,99,40,224,50,158,101,17,237,161,139,124,106,11,43]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
const MINT_ADDRESSES: { [symbol: string]: string } = {
    "BTC": "AxAnvu2aEshtLU2ruPS6wEcpdJ9Am9RXyAnMmCc4TpF4",
    "ETH": "HU9vkcKzr6iRmF8iaFdhd39Rjcef2X8hZF2ynqR5cBQR",
    "XRP": "BJPbwG3d6NwhPP5mmrxjdKt9UdrYimNXadZhoZA9ThxC",
    "SOL": "2by9PmyRUD4qDP9UTEnGDAf5XAD8EcNkTYJrNxUESTou",
    "ADA": "7u6rLwwtJi2YF9VHiJ7vaH4tb9Zy2dHLbRsGfpxWNRSL",
    "DOGE": "FKgDzGKAgR9FLi5DNUXVaeEnPXfXrX9Sa2GrjtWC5S54",
    "LINK": "8QfgjEENsTrRdcS9txEHkniPeB6i4HqZM1zQWKZ42cNd",
    "SUI": "fGyxNgR77J1apw9Da5qb1kaDis8vaKSn12cZPk8rEPS",
    "AVAX": "3hayoZtFswKSXQVxdQRR7bEEMkaniFDHv7a3mXDvYzEM",
    "SHIB": "CqdMiHziYALajKF9hVHmvJy3vDjVfG8JJ3XYk9QJGwbA",
    "LTC": "638oasgLHW3GtiXAqAU4W4zjGGRUrdGnPDZTYxP9GKH1",
    "DOT": "5uoJKFxSHZBwme4paXr69WpT1QK7oAiWZX8ucREQDmgs",
    "UNI": "GBia5hvKru29WD57vdznWqMCRERdU8t7gexevCZhJ5Ai",
    "ONDO": "8KsQPe6KsSVnXHzYMqPr89K7g6FY2mJBQ7XLX51kstDX",
    "AAVE": "BZatZS8VeGY7KbG3bqyr13SSNzvT9a87BTtjPdJnSKk9",
    "PEPE": "7WRgo6VVpgyn2qARcHpTzvprtNDkemDntVuPTEEdEFeX",
    "TRUMP": "kCGkGdxqm1uXgac94gGNpfDFJJjBFrkfgXro18v2147",
    "POL": "7igmfyZYzZAbAbHStwzo5mJSK3tcG2GFWUenR7NXrCEE",
    "FIL": "4xRBge3h6XreFcgVbK4dwn95v1cTNo2cLsmQYV2if3zX",
    "RENDER": "C8aGqH83jBLGxFePPhpL1vWgM55F6fW4kCBEmDUCyrEq",
    "ARB": "2rCb7gSywdozBHc6TDQ6TM2hXTr9XcH6LuhhDuJsjBD8",
    "JUP": "6BFKbbeVrxJbipFPyQhYPYbMm5mTS5LZo7Wtz51C1AHd",
    "OP": "GC6cirqMvTK2xhzs5FssvWetrhVzVP1DrjQpSwYddn2j",
    "S": "UusgNshchrdLFViJaf673q1qFD9kezDqCvAcP7WpnSz",
    "FET": "4K1oN9wBi5Z5V8ZVEZ6FaS1wJqkPnCqQU6tB63DXrvDX",
    "INJ": "8eJu5VntSttTU3F3zZRx1J9t9LNgjiWKd9oK5JoH2gJV",
    "IMX": "9zcyJo2mRpzoe6kKjgj17uzf2o86pEp9SUqj84uVYb8Y",
    "WLD": "SrthCCyeoN2nSffdvK3eYhqDVsKM7N64NEiRfibWu22",
    "LDO": "E3wC9iB1ZzbW7XQHKECN4V9K72fegN9kbMY5ZbXtBxRK",
    "GRT": "A4vuhBPsetXNU641ifML4wvkdUP7UChAmoNqbzgE9JLr",
    "QNT": "GzDguJtbY6pDH9qcGZW6QspgySynZnM4HSd5gFUJ9dzW",
    "BONK": "HzirAahGXXyuBVFovwVUZLMy8J1yGVfmJe85iG9BKsKk",
    "JTO": "26ULUoaCh7a5DLe9oGVYM1grmLBQRSXb3ENBbnR4FnsU",
    "SAND": "73unUxNG89sp2Pz1gvk6U9iNxQwcR3QrRTD79WRsdX4H",
    "ENS": "CR17gVSncdS1CPbTaYrsnE1ocSe8LDCtrPx6DXaW4ksd",
    "GALA": "GC6gcAFcGtA5jZ8fCF8JfLCnkjip9QB9yXtuYf6Tpwpy",
    "PYTH": "HjKBpd95rUNnCFj4HVmxtfzaKBTDSTDvwxDLijLBRSYv",
    "RAY": "HHU44hXX6533CF1rQid2LnuySzQjNofrPG7zoGXxLBAK",
    "HNT": "A39hBrEn7P1ffthktvESga99j6PdXesm5Tj4UTjGTSTA",
    "AXS": "F7TCiEDj5MLrsgSoe4Mqx5QyYsS1dJjFZjs8CvaYwF3N",
    "MANA": "4dpJUiWfSuJk1LpPoUhKk568KNV2S8qMz4XG2sFAF3pv",
    "CRV": "CWsRUk35XWHBKhrgzRsQho229kunM5cxCRWw9M8wSH9q",
    "WIF": "JCQvpD6RJWfK2Z5BJ3Hr9jH9MQ6QHqvTUvXNfcrzj828",
    "GRASS": "7TADBqvxvgbPRWGqdrvDKVDqntpmH4p6J8t2vCQRyM9f",
    "CAKE": "D3CL2bV3KMMhQAncVWqJU5dCHjkSo6eDj5ZMney8nV1C",
    "VIRTUAL": "Ebp2feEcjMq1mTHYjSF6TzJHFQofwEWqW71mWkkZSSuM",
    "AERO": "8yMmTTpVK3cL4XwfCjt6nffa5uBjDzMGZ1mLTyM5WHxf",
    "CHZ": "65DnToRTxp6CkNbjTzbcSE7YJZ1ChQMY1FmG9mhnWR7u",
    "COMP": "DYJVDQnXstGuVsBiYxamuAvHTEF3kmhqYFPKbQADijaJ",
    "APE": "6tUDLYSB8fHLFLa6pEyGMXW3JL3AjuuZREtSuQfdTTdU"
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