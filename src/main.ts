import './style.css';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
// import * as anchor from "@coral-xyz/anchor"; // Removed Anchor import
// Remove the explicit Wallet import

// Import the mock price feed program IDL type and program ID
// Adjust the path based on your project structure relative to faucet-frontend
// import { MockPriceFeed } from './mock_price_feed'; // Removed Type import
// import IDL from './mock_price_feed.json'; // Removed IDL import

// Import the mint addresses data directly (Vite handles JSON imports)
import MINT_ADDRESSES_DATA from './mint-addresses.json';
// Import the mock price feed data (Vite handles JSON imports)
// import MOCK_PRICE_FEEDS_DATA from './mockPriceFeeds.json'; // Removed price feed import

// --- Configuration --- > PASTE YOUR DATA HERE < ---

// 1. PASTE the secret key array from poolTokens/mint-authority.json here
//    WARNING: THIS KEY WILL BE PUBLICLY VISIBLE IN YOUR FRONTEND CODE!
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([185,5,173,91,12,63,86,174,120,179,229,194,245,205,82,82,137,52,163,143,21,55,213,6,102,201,68,20,176,119,206,157,229,191,141,162,2,203,2,42,35,182,157,129,223,64,80,91,24,44,18,37,71,35,150,42,170,85,72,61,231,13,227,199]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
// const MINT_ADDRESSES: { [symbol: string]: string } = { ... }; // <-- REMOVE HARDCODED OBJECT

// Declare MINT_ADDRESSES - will be populated by fetching
// let MINT_ADDRESSES: { [symbol: string]: string } = {};

// Assign imported data directly (Type assertion might be needed depending on TS config)
const MINT_ADDRESSES: { [symbol: string]: string } = MINT_ADDRESSES_DATA as { [symbol: string]: string };
// Assign imported price feed data
// const MOCK_PRICE_FEEDS: { [symbol: string]: string } = MOCK_PRICE_FEEDS_DATA as { [symbol: string]: string }; // Removed

// 3. Configure your RPC Endpoint (localhost, devnet, etc.)
const RPC_ENDPOINT = 'http://127.0.0.1:8900'; // Use port 8900

// --- End Configuration ---

// --- Simple Wallet Implementation for Keypair ---
// This might be needed if we were using Anchor Provider, but not needed for direct SPL calls. Can be removed if unused later.
// class KeypairWallet implements anchor.Wallet {
//     constructor(readonly keypair: Keypair) {}
//
//     async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
//         if (tx instanceof VersionedTransaction) {
//             tx.sign([this.keypair]);
//         } else { // Legacy Transaction
//             tx.partialSign(this.keypair);
//         }
//         return tx;
//     }
//
//     async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
//         return txs.map((t) => {
//             if (t instanceof VersionedTransaction) {
//                 t.sign([this.keypair]);
//             } else { // Legacy Transaction
//                  t.partialSign(this.keypair);
//             }
//             return t;
//         });
//     }
//
//     get publicKey(): PublicKey {
//         return this.keypair.publicKey;
//     }
// }
// ---------------------------------------------

// Globals
let connection: Connection;
let mintAuthority: Keypair;
let currentClusterInfo: ClusterInfo; // Store cluster info globally
// let provider: anchor.AnchorProvider; // Removed Anchor provider
// let mockPriceFeedProgram: anchor.Program<MockPriceFeed>; // Removed program instance

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

// --- Removed UI Elements for Price Update ---
// const priceFeedSelect = document.getElementById('price-feed-select') as HTMLSelectElement;
// const newPriceInput = document.getElementById('new-price') as HTMLInputElement;
// const updatePriceButton = document.getElementById('update-price-button') as HTMLButtonElement;
// const updateStatusMessageEl = document.getElementById('update-status-message') as HTMLParagraphElement;
// const updateTxSignatureEl = document.getElementById('update-tx-signature') as HTMLParagraphElement;

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

    // Ensure MINT_ADDRESSES is populated before using it
    if (Object.keys(MINT_ADDRESSES).length === 0) {
        console.warn('MINT_ADDRESSES not populated yet for dropdown.');
        updateStatus('Error: Token list not loaded. Check console.', true);
        return; // Don't populate if data isn't ready
    }

    const sortedSymbols = Object.keys(MINT_ADDRESSES).sort();

    for (const symbol of sortedSymbols) {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        tokenSelect.appendChild(option);
    }
}

// --- Removed populatePriceFeedDropdown function ---
// function populatePriceFeedDropdown() { ... }

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

        // Use mintAuthority Keypair directly, no need for Wallet wrapper if not using Anchor Provider
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            mintAuthority, // Payer for creation is the mint authority
            mintPublicKey,
            recipientPublicKey,
            false, // Allow owner off curve (not relevant here)
            'confirmed', // Commitment level
            undefined, // Confirm options
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Update status message with raw amount
        updateStatus(`Minting ${amountToMint} (raw) tokens...`);

        // Use mintAuthority Keypair directly
        const signature = await mintTo(
            connection,
            mintAuthority, // Payer for the mint fee is the mint authority
            mintPublicKey,
            recipientTokenAccount.address,
            mintAuthority, // Mint authority signer
            amountToMint, // Use validated & scaled amount
            [], // Multi-signers (none needed here)
            { commitment: 'confirmed' }, // Confirm options
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

// --- Removed handleUpdatePrice function ---
// async function handleUpdatePrice() { ... }

// --- Removed Price Update status functions ---
// function updatePriceUpdateStatus(message: string, isError = false) { ... }
// function showPriceUpdateTransactionLinks(signature: string) { ... }
// function showPriceFeedAccountLink(address: string) { ... }

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
    if (MINT_AUTHORITY_SECRET_KEY[0] === 1 && MINT_AUTHORITY_SECRET_KEY[1] === 2 && MINT_AUTHORITY_SECRET_KEY[2] === 3) {
        updateStatus('ERROR: Placeholder MINT_AUTHORITY_SECRET_KEY found. Paste your actual key.', true);
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

        // --- Removed Anchor Setup ---
        // const wallet = new KeypairWallet(mintAuthority);
        // provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
        // anchor.setProvider(provider);
        // const programId = new PublicKey("rYhXyYZMT5jDnd3UyXBhi8qvJfmbaZ53sFVV3tP1t4W");
        // console.log(`Attempting to fetch IDL for Program ID: ${programId.toBase58()}`);
        // const fetchedIdl = await anchor.Program.fetchIdl(programId, provider);
        // if (!fetchedIdl) {
        //     throw new Error(`Could not fetch IDL for program ${programId.toBase58()}. Is the IDL deployed?`);
        // }
        // console.log("Successfully fetched IDL from cluster.");
        // console.log("Fetched IDL content:", JSON.stringify(fetchedIdl, null, 2));
        // mockPriceFeedProgram = new anchor.Program<MockPriceFeed>(fetchedIdl, programId, provider);
        // console.log(`Mock Price Feed Program loaded. Program ID: ${mockPriceFeedProgram.programId.toBase58()}`);
        // --- End Anchor Setup ---

        // Data is imported, proceed directly
        if (Object.keys(MINT_ADDRESSES).length === 0) {
            // This should ideally not happen if the import worked
            throw new Error('Mint addresses data is empty after import.');
        }
        console.log('Successfully loaded MINT_ADDRESSES via import:', MINT_ADDRESSES);

        // Now populate the dropdown after addresses are loaded
        populateTokenDropdown();
        // Removed price feed dropdown population
        // populatePriceFeedDropdown();

        if (mintButton) {
            mintButton.addEventListener('click', handleMint);
        }
        // Removed listener for the update button
        // if (updatePriceButton) {
        //     updatePriceButton.addEventListener('click', handleUpdatePrice);
        // }

        updateStatus('Ready. Enter address, select token, and click Mint.');
        // Removed price update status update
        // updatePriceUpdateStatus('Ready. Select feed, enter price/exponent, and click Update.');

    } catch (error: any) {
        updateStatus(`Initialization failed: ${error.message || error}`, true);
        console.error('Initialization error:', error);
    }
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initialize); 