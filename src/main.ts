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
    "BTC": "4MFjqvcP1Pq2GfFhj2M9GWrz3B8owXTQpEoRpCyqygpV",
    "ETH": "J6FGQGgV39ngnsyK1SHG2eZqVn6H2ur6HfoUrzKhJfkv",
    "XRP": "4cHRzXVoh1c7GW7wunAjukBZtQNuUAyjGbJ9LTehwica",
    "SOL": "3ABmnx1KTRPyDKVKA29JpQZw4PTz5mN3QHASUj49CUgg",
    "ADA": "8d5DvZrRsJeTLjSjCdWdaXE68VW6A18DHFEe3br9mfrp",
    "DOGE": "DDMGpAXEdpM4x6Uvhzh8PjzMmvYXvXiMq5e3k7KMNynQ",
    "LINK": "66NeAwtuNf4dzEsGRTL23aejUBDH5HMQ8oEzDjbyScuA",
    "SUI": "HHA2vVm6iyXgNx7mFFdP4UwBqYoYT5zf9grZyFMxPRLf",
    "AVAX": "CVogF91uMnQttfWMBPyV3xZDfe2cmE9Hwh61Nd2JsXhN",
    "SHIB": "EHy6Ke6vbVqKTZQGPeUCgsxYmEnA1CBfYsBx9rngDwZv",
    "LTC": "BuZfePS2SEGZSnzDFEb58M3VKbBqTT8s3jusG2coWrHD",
    "DOT": "AB3UfxRRhqGY6kBze5v38A4N5kP5xErMM6qDFP9EfSQD",
    "UNI": "DN2BSnkYgWMKRfWN4CPcryVJ9P84rDQnsnRo9uuH6JMu",
    "ONDO": "7MtxyevyzGkSxTm5pproU1CF2hv8eVuKBUt7Z5v3BYyD",
    "AAVE": "BJttLFrNAQ7uMZdsfxZvtvbHs8pJiFTFFANSRqRL2sGL",
    "PEPE": "ARkVZKcieBwxvK7xDsk7hjCH7tAo57jYivSVm6Q3a4R",
    "TRUMP": "CNxvs13xcAvEyWoKg8kDusHwpSvcE5EKTW35gyamJjfJ",
    "POL": "9NWgXZJbbocTLtTL7nouv61iJ1LCmvVcHduc7Q7f1Ygn",
    "FIL": "9jLb5JAmbuiPUF5cRg1JxE6FpaL59Bzxro4b3Wa9R25b",
    "RENDER": "6r8e3ZrXLytpwpUvrKrGdtVST9x8Wzuw1K4MDrSS5rG4",
    "ARB": "Adw47jrokVb2DHeBDwY8mgYpqTZpTBUjy4JzZqt4AvxY",
    "JUP": "364hztUYDDaJAXc7tug1T3zd9Se29n6SEC42u1nHroJf",
    "OP": "BGpdVYc4ic3JHLEL44eRxFsLDGmmSi54ZnV58MPEucbT",
    "S": "8d5yh6rHeP1poH8UcfjTxMHbpZ4Qye3VW6GYxTR1kzgr",
    "FET": "9fABtG7ogb89K8pYGBzMkhPnSg3zUjPxVYm6NVDHiwFy",
    "INJ": "Gb4JodxfMxu8AzYMW2zkvq7WhyVsPzFwJ7oSHLqKqy3c",
    "IMX": "29HY7nA8Tcd3xBw7f31yGVMp1PZm4odSaKgTXkpHzEc2",
    "WLD": "74qNZxKsFZA7RNdJm8bthXUmyp51N8Lp2KqaGDv8SpiP",
    "LDO": "5tMPS8f2CAn1J1QZb8wc2tK8QTcmieAVk5RDfmvdDQY9",
    "GRT": "CwgUdZA9HqUgs9zdCfWkpG256ocx3w8djn5kbPYcXqRb",
    "QNT": "3LPY7TmwgwYZ9HbwrnurVmzbJMjdcBDF8jE2nzq76ooJ",
    "BONK": "39VRjatjw1rotyMGRqR3Jr5ErsGGANDe1AA8VhuQDGkZ",
    "JTO": "EqoC981jVAmBydpTnGXc2tRXaQQDaG1dv2QXeSc4ZceF",
    "SAND": "5o7yyQ5PZjUpRiSA3LeqTjTLC5LrT6qR3kALUkFt3CZu",
    "ENS": "D5XRo1xpMX6Y9L2m92qevH445rvnzYMtQzT2cr5xyiT3",
    "GALA": "61WpLUMBuEh72EEo51tLgiY15p3BTZ7zbvUNvq88GgPZ",
    "PYTH": "4EZZexfmosuQKTTSgdmnBfkuvt6NY2T79HGy6rWCbkAK",
    "RAY": "6xC2SbAjtrfvb9rKoMCtdbEhiSRDM8wrh9hiXH8wzCiJ",
    "HNT": "8Paq5C6otyRTfRC2b6f4AR9ohRtiGWA9ANYyUFpw2WWe",
    "AXS": "8fS74kXsqtEV4yTrk71E9sM6R7ahV5HDgJkoYditSywB",
    "MANA": "BBofdSG85bj51DmKjKgCtUeFpbPx81T9am5ERmniGDrW",
    "CRV": "4E1qjtzmWRcrYwo19yHDcQoNQht4RRR2hzSxFxoTxST8",
    "WIF": "4GRrXuHvVr1qdHsUofyYj3u98B2XjAomZu4xvycRnTaP",
    "GRASS": "CeHc5s9XjdPvrRKEgmdA2Syb4Bab5FZybx7P3n8VqG6d",
    "CAKE": "CsVKe3ZQTH7Ephs2djh557x7Q7pqYMbPvuoD8YCr72Ri",
    "VIRTUAL": "HZCa6SFg2sK68hckgBJ4u5EWW96wuknLXqqtviSi8w5o",
    "AERO": "ADZcS3mV3ekfjVWnDSkKvjPF8FSt2eHeufzysivUM2TA",
    "CHZ": "DkAzxRP5Y73WZpV4YREwsrSchvZR1N2sdZqMUC9Y1HJT",
    "COMP": "Eh8t8Gvh3zyKT2X75msMiW7wYaSyQcCCg2y33crfTX3M",
    "APE": "49ZQYNt1zck2966hKaqaPqceEnHe1NGGbYKGvZVKniWK"
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