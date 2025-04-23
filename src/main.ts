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
    "BTC": "8TEZpfG73hBJzLPtGboVsamr2RJ83MZuaMUx64ghixPa",
    "ETH": "B4aDwjZsdr5VDWWLA7vMr1QCYaURauKWbLFHzK1tu3uF",
    "XRP": "Cnu6XkqwCNvGSVwss7UaBcougviBWy1d3F4ohDYuQ6tX",
    "SOL": "EaD92embZxyTum1gfWRoyXpH9yuPUPJmpRrWEjtaeW7c",
    "ADA": "DteuwQbromPMYE2AkW4EnTErK7qXEbKddvusaaUKdVYt",
    "DOGE": "KajHTMqyJEWPvCU3X4RJHa5PGfA1A4RVPDYwyxhGhiz",
    "LINK": "6X9yUhJ11BqoDLLNMni2znNu4GHinDHxEUQyQBmCQpR2",
    "SUI": "2UmGYkicTu4FnVYBDBU95Baf7YcmW2PatFyYJRcAZwTu",
    "AVAX": "7KaFaR7t21suiffA9zU5rMPoTGwtvHTe6VjTCCRTJfnc",
    "SHIB": "FjirMjMQnhLPcvD4uiGSGKmfjDgUkoUq1uRPanW1wEFb",
    "LTC": "9Qmvm4fAE1EyajiPk7uCvcLRMyfeNoCE9M2Ekn6b2L8v",
    "DOT": "A5S1yALfsV6mCCizXRgUrXr6HHYq63ZwwjfWV81ND1xy",
    "UNI": "2J8ign74KuumXJZH1vpywgtpcoqEdVfTnVvyYEwH3Z3Q",
    "ONDO": "Ca5uUdDpmdRcf9zmXaZ7mfMYLwyagdjcSzikguJvwnHN",
    "AAVE": "5uwvndmbLAd63EYPe9VL7sUytNhmAjaDQ6ZBYxBshNLE",
    "PEPE": "34miCuk9GRYqgMse86SZkPo7xTHfg59z3TtiBhYd5eJd",
    "TRUMP": "8XPnUq8H9Ezyn64gBreagj5V9B6mfp9zwM2siDviKtt8",
    "POL": "8mdgmidJD2Wf3joSFGv5u2jQ3uHdQM4L1c5kb3D7xpiy",
    "FIL": "HZWYL7LZr38a1KugfmLm3WbwHjD84ed2ubeRyRdENitR",
    "RENDER": "2igi6sZ9EQHahZHDvfSNEfyVJqYxk1N5zppGezsVZM6S",
    "ARB": "41Fw3LeckLHQ2BBDSqMGgS8UauYPNnSWXGws1tt1e9yc",
    "JUP": "EXGsQkTw3Gdy1ZmhuaeU7cBfHgTLobXLTrm7HkXm2rbS",
    "OP": "9jdUAubZiSxuTjpR9ZRHG9cz9EQ3vkohvQ8YehcKKHzW",
    "S": "BzSvgHopc4NziDFz6EE9JYNFu4PckQ3xs9n1WWHHtyqF",
    "FET": "JDHmTAifSLH7KRTdEPizWSnTqzHTCcsXBqqhztypbtXT",
    "INJ": "AHcmTL9tHbYbeT4xxpPDqKEzGYKP9g66Jhvt8aJehBSF",
    "IMX": "CPCgf1poFEJf9DzMRcxPBhDmoLDqKCUCrkYGpbq1ynPo",
    "WLD": "BbuQ7nE8HN7VW5E3BC9qQdoSsmnNM7b1AAzht2aQ6swy",
    "LDO": "49tRYf6nKDLHxqhvy2vzUd8Yc76M7XiS6jE5WdTMot8A",
    "GRT": "45nBtTEA8xgzLzL35zGtGWeGrBo4ubGZauaesGyLmp8p",
    "QNT": "7By5hcUWMrJF9qRByYZQc5nciAYyB6U2ZfDMCt7pZks1",
    "BONK": "62EE7RtZjMhYonwZqX5YXN5zoovUPfhpc8D2KUaHt3MG",
    "JTO": "25ZKkuJGXjVniX38jscQ2AucDcVBUwMt8w7dyUKvUPLF",
    "SAND": "GfBJV4Z4goVdkJc5rJ9Sictou1SxRbnC4gbdbjC67nhf",
    "ENS": "DkYT39GXcd2NuMMvWiC6Qz14LBKETCE5EPcGLx7S1wkd",
    "GALA": "DN4JzZ4kNWnhNshaqSknRdbXaWPvEkWmcZ7EikAsASEs",
    "PYTH": "6Vzkk9Y6EbpCjAELcymaEhd29g5CcjbxR1RVi782YgEd",
    "RAY": "FQtsUf8KQwSaj7nskPJjvHtqaRdePmwcnNbV9KqJxQF8",
    "HNT": "F3GhzxLhoYnxm4pvi8Kj6vKAsacB5C66GcfWiJ7FES5H",
    "AXS": "FqikvtSgviUQhs5biftgBXsFWN5RAo9JPrmw3E1Hu4xJ",
    "MANA": "G578RigAgsrodmpUJWroKhAK32fH56Gv9dBnesgGfwFd",
    "CRV": "DVgx2EEo7634RTQuBj7zo2zfwW4iCQw7Vmfdpo3KCskN",
    "WIF": "AhxrvgyMFG6fmfv1ouhFG2KUGoPST41wYNnYhe2yYiqy",
    "GRASS": "DgPQNuE6apymTMdAxknzfM52M656s8kCoMogZtpphrjZ",
    "CAKE": "G8jXVGvi485sgtjbe8qaDTASE1Z8eubW7GyGU7BzGhn8",
    "VIRTUAL": "4q5mukGNTM2MzKngSZ14nkTVGSNkJzfkFZtSKfzYjSpd",
    "AERO": "GRZYi4MwERgntsmegikw3s54ukjYghsct2WurnF6brTA",
    "CHZ": "29YyyrnsvFJmQVRZAf2a4qot8TZn8f77FamTf6G5BdGa",
    "COMP": "5WK8uMMgWG3M3xcjpvrvPebMXtmL5KG4ez3sQH6oRycL",
    "APE": "3JUY1aw15h3ak3kbSKeZrGTUuGApQvz6vGXnERobqBhb"
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