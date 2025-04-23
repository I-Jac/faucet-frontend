import './style.css';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// Import the mint addresses data directly (Vite handles JSON imports)
import MINT_ADDRESSES_DATA from './mint-addresses.json';

// --- Configuration --- > PASTE YOUR DATA HERE < ---

// 1. PASTE the secret key array from poolTokens/mint-authority.json here
//    WARNING: THIS KEY WILL BE PUBLICLY VISIBLE IN YOUR FRONTEND CODE!
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([82,223,100,247,46,15,85,199,116,144,243,171,133,84,19,137,105,150,249,230,46,76,210,26,149,206,118,170,140,171,139,179,101,46,221,188,162,223,224,202,54,154,33,236,149,7,73,140,124,57,99,40,224,50,158,101,17,237,161,139,124,106,11,43]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
// const MINT_ADDRESSES: { [symbol: string]: string } = { ... }; // <-- REMOVE HARDCODED OBJECT

// Declare MINT_ADDRESSES - will be populated by fetching
// let MINT_ADDRESSES: { [symbol: string]: string } = {};

// Assign imported data directly (Type assertion might be needed depending on TS config)
const MINT_ADDRESSES: { [symbol: string]: string } = MINT_ADDRESSES_DATA as { [symbol: string]: string };

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
    if (MINT_AUTHORITY_SECRET_KEY[0] === 1 && MINT_AUTHORITY_SECRET_KEY[1] === 2 && MINT_AUTHORITY_SECRET_KEY[2] === 3) {
        updateStatus('ERROR: Placeholder MINT_AUTHORITY_SECRET_KEY found. Paste your actual key.', true);
        return;
    }
    // // Check if mint addresses are empty or placeholder // <-- REMOVE this check as it will be empty initially
    // if (Object.keys(MINT_ADDRESSES).length === 0 || MINT_ADDRESSES["BTC"]?.startsWith('Your')) {
    //     updateStatus('ERROR: Placeholder or empty MINT_ADDRESSES found. Paste your actual mint addresses object.', true);
    //     return;
    // }

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

        // Data is imported, proceed directly
        if (Object.keys(MINT_ADDRESSES).length === 0) {
            // This should ideally not happen if the import worked
            throw new Error('Mint addresses data is empty after import.'); 
        }
        console.log('Successfully loaded MINT_ADDRESSES via import:', MINT_ADDRESSES);

        // Now populate the dropdown after addresses are loaded
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