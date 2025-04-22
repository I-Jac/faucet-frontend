import './style.css';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// --- Configuration --- > PASTE YOUR DATA HERE < ---

// 1. PASTE the secret key array from poolTokens/mint-authority.json here
//    WARNING: THIS KEY WILL BE PUBLICLY VISIBLE IN YOUR FRONTEND CODE!
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([
    233,191,209,129,122,82,155,200,136,117,162,214,216,130,245,255,227,27,53,209,30,62,35,66,94,129,130,194,216,63,13,96,199,192,55,247,48,74,89,53,135,68,164,13,240,118,31,97,177,225,103,229,8,249,219,174,3,178,153,227,0,65,35,74
]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
const MINT_ADDRESSES: { [symbol: string]: string } = {
  "BTC": "92Be1yH2o3wBZ6Dyb5gzREbhB5djN8734WQx2MbpeLTC",
  "ETH": "9NQU7yekZjshq8wZViaTLksA7EMAuxBALJyx5WL2E3jK",
  "XRP": "C4j9f1twWEmoeKProW4pfZdrpEMaWzvdRyjVb69348Nk",
  "SOL": "6cT9t8yjWc2bmSqps8DBMA4zWj9qzfvANv8F8ki3pMa5",
  "ADA": "GhYZ7BHormyZ8VKrtRmJZscqNmpWUbUnKvvUv5tbTdhn",
  "DOGE": "H93Tht5JrUR42iWYG9x2QML8CryPAmxsfW5ZdxaTqFGH",
  "LINK": "9pBncRR3kUnRFye3Hr2p4JAW73TNaJqU8dhB3gXNaBcH",
  "SUI": "zMPka6dTdmoYYHybYgE9KLGx6Y5QeeoVGtxwmjGFueK",
  "AVAX": "8FugzSxvvMHYY7HB2inoFiRKiMopEabdhNhcSkhgWSek",
  "SHIB": "5q33TzukJjUZtkam2QwmpmLefehsPbCNsgS5DD73Pq21",
  "LTC": "Hmq25D4AUN3LioLxNx82We2PszTAf7AaK73WZDJzBZFd",
  "DOT": "4sezH6HNyb1nq7LsFGXG2UKCb9aF92HeSwE3Nyf4xvAS",
  "UNI": "5bG35VduuViFB2DtJX8McCyoLU24kHHDHw9Vpj8BjFt1",
  "ONDO": "CvJq62L2913H5WcMozV9AdARSSbtfSRvmMVkmR5c1TUC",
  "AAVE": "2PPLizWp96HU7zv9HTrtEs3NyKiuf93igVy4jt3SdE8a",
  "PEPE": "HnuEHGQeGc8dB2KcsPiJbyKJuQTfGHGEsCj7NcrFm1Po",
  "TRUMP": "5MrAz84nrgxsx3w2EQtB98PwnScoUvwhXUEnYzR5ao4U",
  "POL": "87QbHtGNeYgUExiSPuWEA1DL5vznKSay4XdTj2XnCWXM",
  "FIL": "4K5HSG6BmWsUAvowbA9oyH9v3b847DwyT2SSf51G92KL",
  "RENDER": "8xYVXEa6GED6u8HyCAvT3DvKgHjn4eRgCv1P3BBDbfKg",
  "ARB": "Cux14uQ6E7DSRETejufqsvGYZpenKX14ZRqFw25b5mCn",
  "JUP": "CAhtsqJLernvntbLFVQq9EeHDV89sSn9ZGHLfHo48eRp",
  "OP": "6L8GAWMF7NSTx5wJA16tm7EbeBdXGhspN4nQDnyVehqH",
  "S": "7wtA9cGLSS1FfrN2EeKsWGFuqD8bwzSJ6KN9hNosAydR",
  "FET": "2ju2CYTwjPyijTZpwuLHmYiB9CQbb1KR8rSo2uAydpxr",
  "INJ": "3EdutwremFE1NB94QBjpQhMSGJ8J2Wf6WBDzbLNSfpKU",
  "IMX": "AAHdYH6E2Tr8ogss8uUy4U4Yg415ziKvtCyAKU635XLo",
  "WLD": "9D5e7pbuCPeY1RTqpeM2cRbzjpbo3qFjCwRDNZTJQqck",
  "LDO": "Fuz5KcbwTtk4KW33ybpUQueTK4FnPktFjPkDgHEgW7u3",
  "GRT": "FXwn7i7KEDKJFGq2dh2JNfBb89ZkG979YVatcGwQPwXw",
  "QNT": "4W3oAUtMM1dJQH4Dm4AES5EDTDjrQvEQtJbAVnPTzLg5",
  "BONK": "6kyU4onDBzMjYfoUon77fmS4Zi3vNyZoE8X16vxQKGLE",
  "JTO": "3wwWU76iPJR4DLoXghc9FqT6vmtx4723JvrSDZ5CTmhk",
  "SAND": "DW5c4HBSbv4oBcJVNQkj7TNXqXXg125aJZ7vseAFDSB6",
  "ENS": "GcxhBvsfJLeurQb4mNhzwrUQQgXuSfXCsJvzwmA3gi48",
  "GALA": "7iHa59HS61ryWCw9kXR4gZLCNHNpzVgkFCT1RcujDqvp",
  "PYTH": "134QzLhCjFG5Q5YmnULEKYxtQhMQZTkQzQYZKNgNnsPp",
  "RAY": "32d2iqqK3jZ5Z7bDaZ1nVaQ8Djf1GCaasMYea5uEPRys",
  "HNT": "25RDxqX5ZGJWzGdiP8P3Fa4TVHLGkpbcSZ3kMibMCR9r",
  "AXS": "A4s3XwiNnGhvV3Fg8V13zkNUvvaeZXk4PxPC85QyuEE2",
  "MANA": "9FkwBsHCZ2stioFPeNCvFb349SUsdf9buBx11wHH7Zhw",
  "CRV": "BcFE4CgUj6nhCW1cppgjPfZv7mmGYEegQVzdxcKDk22C",
  "WIF": "7G8Y4PBcvjaBiZPCV93kCFzhSopUppW8iczm5omaeshJ",
  "GRASS": "DyF7qWk73vKD3uKtsBrJEGSzmfoYneTwUDUwzNqNxfAC",
  "CAKE": "aLXKnuHmFuZ2tafS8jyXTv6AeqogW4pr91UAZVoWEiC",
  "VIRTUAL": "4XnVUrRjbfB4w6qzG381eiJouWFzuHEWvxvHWzkmpiMV",
  "AERO": "EtTkRzUwMgm6XYKiC539xNX1WGMGtUtPYwmDyXUZxgMy",
  "CHZ": "fEGkhvzPSpEQwCMrJLGRvNyAV16sn2JEybop1habgS3",
  "COMP": "HLTarpPfCgnJUhuD1hUZuunAzKhYqYqjVimRx1Awk3AJ",
  "APE": "HqGKQ6JwTGmkJG2wSjwPnXQySLwujPPowsmMwFG7h1TP"
};

// 3. Configure your RPC Endpoint (localhost, devnet, etc.)
const RPC_ENDPOINT = 'http://127.0.0.1:8900'; // Or your desired endpoint

// 4. Configure faucet amount (display units)
const FAUCET_AMOUNT_DISPLAY = 100;

// --- End Configuration ---

// Globals
let connection: Connection;
let mintAuthority: Keypair;

// UI Elements
const recipientInput = document.getElementById('recipient-address') as HTMLInputElement;
const tokenSelect = document.getElementById('token-select') as HTMLSelectElement;
const mintButton = document.getElementById('mint-button') as HTMLButtonElement;
const statusArea = document.getElementById('status-area') as HTMLDivElement;
const txSignatureEl = document.getElementById('tx-signature') as HTMLParagraphElement;

/**
 * Update the status display.
 */
function updateStatus(message: string, isError = false) {
    console.log(message);
    statusArea.innerHTML = `<p class="${isError ? 'error' : ''}">Status: ${message}</p>`;
    txSignatureEl.textContent = '';
}

/**
 * Update status with transaction signature link.
 */
function showSignature(signature: string) {
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${getClusterName()}`;
    txSignatureEl.innerHTML = `Transaction: <a href="${explorerUrl}" target="_blank">${signature}</a>`;
}

/**
 * Get cluster name for Solana Explorer URL.
 */
function getClusterName(): string {
    if (RPC_ENDPOINT.includes('devnet')) return 'devnet';
    if (RPC_ENDPOINT.includes('testnet')) return 'testnet';
    if (RPC_ENDPOINT.includes('mainnet')) return 'mainnet-beta';
    return 'custom'; // Add '?customUrl=' + encodeURIComponent(RPC_ENDPOINT) if needed
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
    if (!connection || !mintAuthority || !recipientInput || !tokenSelect || !mintButton) {
        updateStatus('Initialization error. Check console.', true);
        return;
    }

    const recipientAddressStr = recipientInput.value.trim();
    const selectedSymbol = tokenSelect.value;

    if (!recipientAddressStr) {
        updateStatus('Please enter a recipient address.', true);
        return;
    }

    if (!selectedSymbol) {
        updateStatus('Please select a token.', true);
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
    updateStatus(`Minting ${FAUCET_AMOUNT_DISPLAY} ${selectedSymbol} to ${recipientAddressStr}...`);

    try {
        // Need to get mint info to know decimals
        const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
        if (!mintInfo || !mintInfo.value || !('parsed' in mintInfo.value.data))
        {
            throw new Error('Could not fetch mint info or data is not parsed');
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;
        const amountToMint = BigInt(FAUCET_AMOUNT_DISPLAY) * (10n ** BigInt(decimals));

        updateStatus(`Fetching/creating token account for recipient...`);

        // Get or create the associated token account for the recipient
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            mintAuthority, // Payer (using mint authority keypair for simplicity here)
            mintPublicKey,
            recipientPublicKey,
            false, // Allow owner off curve
            'confirmed',
            undefined,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        updateStatus(`Minting ${amountToMint} (raw) tokens...`);

        // Mint the tokens
        const signature = await mintTo(
            connection,
            mintAuthority, // Payer
            mintPublicKey, // Mint
            recipientTokenAccount.address, // Destination ATA
            mintAuthority, // Authority controlling the minting
            amountToMint, // Amount to mint (considering decimals)
            [], // Signers if multi-sig
            { commitment: 'confirmed' },
            TOKEN_PROGRAM_ID
        );

        updateStatus(`Successfully minted ${FAUCET_AMOUNT_DISPLAY} ${selectedSymbol}!`);
        showSignature(signature);

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
    // Check if mint addresses are empty or placeholder
    if (Object.keys(MINT_ADDRESSES).length === 0 || MINT_ADDRESSES["BTC"]?.startsWith('Your')) {
         updateStatus('ERROR: Placeholder or empty MINT_ADDRESSES found. Paste your actual mint addresses object.', true);
        return;
    }

    try {
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