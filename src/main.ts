import './style.css';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    AccountMeta,
    ComputeBudgetProgram,
    Commitment
} from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import * as anchor from "@coral-xyz/anchor";
import AutoNumeric from 'autonumeric';

// Import the mock price feed program IDL type and program ID
import IDL from './mock_price_feed.json';

// Import the mint addresses data directly (Vite handles JSON imports)
import MINT_ADDRESSES_DATA from './mint-addresses.json';
// Import the mock price feed data (Vite handles JSON imports)
import MOCK_PRICE_FEEDS_DATA from './mockPriceFeeds.json';

// --- Constants --- Added Price Update Constants
const UPDATE_PRICE_DISCRIMINATOR = Buffer.from([61, 34, 117, 155, 75, 34, 123, 208]);
const PRIORITY_FEE = 10000;
const COMPUTE_UNIT_LIMIT = 200000;
const PRICE_EXPONENT = -8; // Hardcoded exponent

// --- Configuration --- > PASTE YOUR DATA HERE < ---

// 1. PASTE the secret key array from poolTokens/mint-authority.json here
//    WARNING: THIS KEY WILL BE PUBLICLY VISIBLE IN YOUR FRONTEND CODE!
const MINT_AUTHORITY_SECRET_KEY = new Uint8Array([108,33,192,134,193,113,214,240,173,244,13,28,245,31,248,45,178,55,192,61,67,193,121,67,45,153,223,144,229,12,200,162,182,253,241,230,123,255,221,138,58,97,0,8,26,10,89,227,156,135,223,237,72,14,242,106,79,101,79,123,137,209,139,134]);

// 2. PASTE the JSON object from poolTokens/mint-addresses.json here
// const MINT_ADDRESSES: { [symbol: string]: string } = { ... }; // <-- REMOVE HARDCODED OBJECT

// Declare MINT_ADDRESSES - will be populated by fetching
// let MINT_ADDRESSES: { [symbol: string]: string } = {};

// Assign imported data directly (Type assertion might be needed depending on TS config)
const MINT_ADDRESSES: { [symbol: string]: string } = MINT_ADDRESSES_DATA as { [symbol: string]: string };
// Assign imported price feed data
const MOCK_PRICE_FEEDS: { [symbol: string]: string } = MOCK_PRICE_FEEDS_DATA as { [symbol: string]: string };

// 3. Configure your RPC Endpoint (localhost, devnet, etc.)
const RPC_ENDPOINT = 'http://127.0.0.1:8900'; // Use port 8900

// --- End Configuration ---

// --- REMOVED Simple Wallet Implementation ---

// Globals
let connection: Connection;
let mintAuthority: Keypair; // Acts as payer for both minting and price updates
let currentClusterInfo: ClusterInfo; // Store cluster info globally

// Interface for cluster information
interface ClusterInfo {
    explorerClusterParam: string; // For explorer.solana.com
    solscanClusterParam: string;  // For solscan.io
}

// --- Minting UI Elements ---
const recipientInput = document.getElementById('recipient-address') as HTMLInputElement;
const tokenSelect = document.getElementById('token-select') as HTMLSelectElement;
const amountInput = document.getElementById('mint-amount') as HTMLInputElement;
const mintButton = document.getElementById('mint-button') as HTMLButtonElement;
const mintAllCheckbox = document.getElementById('mint-all-checkbox') as HTMLInputElement;
const statusMessageEl = document.getElementById('status-message') as HTMLParagraphElement; // For minting status
const txSignatureEl = document.getElementById('tx-signature') as HTMLParagraphElement; // For minting TX
const recipientLinksArea = document.getElementById('recipient-links-area') as HTMLDivElement;

// --- Price Update UI Elements --- Added
const priceFeedSelect = document.getElementById('price-feed-select') as HTMLSelectElement;
const newPriceInput = document.getElementById('new-price') as HTMLInputElement;
const updatePriceButton = document.getElementById('update-price-button') as HTMLButtonElement;
const updateStatusMessageEl = document.getElementById('update-status-message') as HTMLParagraphElement; // Dedicated status for price updates
const updateTxSignatureEl = document.getElementById('update-tx-signature') as HTMLParagraphElement; // Dedicated TX link for price updates
const feedAccountLinkArea = document.getElementById('feed-account-link-area') as HTMLDivElement; // Dedicated link area for feed account

// Global reference for the AutoNumeric instance
let priceInputAutoNumeric: AutoNumeric | null = null;

/**
 * Update the MINTING status display and clear minting links.
 */
function updateStatus(message: string, isError = false) {
    console.log(`Mint Status: ${message}`); // Log distinction
    if (statusMessageEl) {
        statusMessageEl.textContent = `Mint Status: ${message}`;
        statusMessageEl.className = isError ? 'error' : '';
    }
    // Clear minting links only
    if (txSignatureEl) txSignatureEl.innerHTML = '';
    if (recipientLinksArea) recipientLinksArea.innerHTML = '';
}

/**
 * Update the PRICE UPDATE status display and clear price update links. Added
 */
function updatePriceUpdateStatus(message: string, isError = false) {
    console.log(`Price Update Status: ${message}`); // Log distinction
    if (updateStatusMessageEl) {
        updateStatusMessageEl.textContent = `Update Status: ${message}`;
        updateStatusMessageEl.className = isError ? 'error' : '';
    }
    // Clear price update links only
    if (updateTxSignatureEl) updateTxSignatureEl.innerHTML = '';
    if (feedAccountLinkArea) feedAccountLinkArea.innerHTML = '';
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
    const solscanType = type === 'account' ? 'account' : type;
    return `https://solscan.io/${solscanType}/${id}?cluster=${clusterInfo.solscanClusterParam}`;
}

/**
 * Update status with MINTING transaction signature links.
 */
function showTransactionLinks(signature: string) {
    if (!currentClusterInfo) {
        currentClusterInfo = getClusterInfo();
    }
    if (!txSignatureEl) return;

    const solscanUrl = generateSolscanUrl('tx', signature, currentClusterInfo);
    txSignatureEl.innerHTML = `Mint Transaction: <a href="${solscanUrl}" target="_blank" title="View on Solscan">${signature}</a>`;
}

/**
 * Show links for the recipient address.
 */
function showRecipientLinks(address: string) {
    if (!recipientLinksArea || !currentClusterInfo) return;

    const solscanUrl = generateSolscanUrl('account', address, currentClusterInfo);
    const shortAddress = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    recipientLinksArea.innerHTML = `<a href="${solscanUrl}" target="_blank" title="View Recipient on Solscan">Recipient (${shortAddress})</a>`;
}

/**
 * Update status with PRICE UPDATE transaction signature links. Added
 */
function showPriceUpdateTransactionLinks(signature: string) {
    if (!currentClusterInfo) {
        currentClusterInfo = getClusterInfo();
    }
    if (!updateTxSignatureEl) return;

    const solscanUrl = generateSolscanUrl('tx', signature, currentClusterInfo);
    updateTxSignatureEl.innerHTML = `Update Transaction: <a href="${solscanUrl}" target="_blank" title="View on Solscan">${signature}</a>`;
}

/**
 * Show link to the price feed account. Added
 */
function showPriceFeedAccountLink(address: string) {
    if (!feedAccountLinkArea || !currentClusterInfo) return;

    const solscanUrl = generateSolscanUrl('account', address, currentClusterInfo);
    const shortAddress = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    feedAccountLinkArea.innerHTML = `Price Feed Account: <a href="${solscanUrl}" target="_blank" title="View Price Feed Account on Solscan">${shortAddress}</a>`;
}

/**
 * Populate the token dropdown.
 */
function populateTokenDropdown() {
    if (!tokenSelect) return;
    tokenSelect.innerHTML = '<option value="">-- Select Token --</option>'; // Clear existing
    
    if (Object.keys(MINT_ADDRESSES).length === 0) {
        console.warn('MINT_ADDRESSES not populated yet for dropdown.');
        return;
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
 * Populate the mock price feed dropdown. Added
 */
function populatePriceFeedDropdown() {
    if (!priceFeedSelect) return;
    priceFeedSelect.innerHTML = '<option value="">-- Select Feed --</option>'; // Clear existing

    if (Object.keys(MOCK_PRICE_FEEDS).length === 0) {
        console.warn('MOCK_PRICE_FEEDS not populated yet for dropdown.');
        updatePriceUpdateStatus('Error: Price feed list not loaded. Did you run `anchor test` in mockPriceFeed?', true);
        return;
    }

    const sortedSymbols = Object.keys(MOCK_PRICE_FEEDS).sort();

    for (const symbol of sortedSymbols) {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        priceFeedSelect.appendChild(option);
    }
}

// --- Utility Functions --- Added
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Builds the instruction data buffer for the `update_price` instruction. Added
 */
function buildUpdatePriceInstructionData(newPrice: anchor.BN, newExpo: number): Buffer {
    const buffer = Buffer.alloc(8 + 8 + 4);
    UPDATE_PRICE_DISCRIMINATOR.copy(buffer, 0);
    const priceBuffer = newPrice.toArrayLike(Buffer, 'le', 8);
    priceBuffer.copy(buffer, 8);
    const expoBuffer = Buffer.alloc(4);
    expoBuffer.writeInt32LE(newExpo, 0);
    expoBuffer.copy(buffer, 8 + 8);
    return buffer;
}

/**
 * Sends and confirms a transaction with retry logic. Added
 */
async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  payer: Keypair,
  maxRetries: number = 3,
  retryDelayMs: number = 2000,
  commitment: Commitment = "confirmed"
): Promise<string> {
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
        const latestBlockhash = await connection.getLatestBlockhash(commitment);
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.feePayer = payer.publicKey;

        transaction.sign(payer);

        const rawTransaction = transaction.serialize();
        const options = {
            skipPreflight: true,
            commitment: commitment,
            maxRetries: 0
        };

        const txSignature = await connection.sendRawTransaction(rawTransaction, options);
        console.log(`    Transaction sent (Attempt ${i + 1}/${maxRetries}): ${txSignature}`);

        const confirmation = await connection.confirmTransaction({
            signature: txSignature,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: transaction.lastValidBlockHeight
        }, commitment);

        if (confirmation.value.err) {
            console.error(`    Transaction confirmation failed (Attempt ${i + 1}/${maxRetries}):`, confirmation.value.err);
            throw new Error(`Transaction failed confirmation: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log(`    Transaction confirmed successfully: ${txSignature}`);
        return txSignature; // Success

    } catch (err: any) {
        lastError = err;
        const errorMessage = err.message || "";

        if (
            errorMessage.includes("Blockhash not found") ||
            errorMessage.includes("block height exceeded") ||
            errorMessage.includes("TransactionExpiredTimeoutError") ||
            errorMessage.includes("timed out") ||
            errorMessage.includes("Node is behind") ||
            errorMessage.includes("Network request failed") ||
            errorMessage.includes("failed confirmation")
        ) {
            if (i < maxRetries - 1) {
                console.warn(`    Transaction failed (Attempt ${i + 1}/${maxRetries}): ${errorMessage}. Retrying in ${retryDelayMs}ms...`);
                await sleep(retryDelayMs);
            } else {
                console.error(`    Transaction failed after ${maxRetries} attempts.`);
            }
        } else {
            console.error("    Non-retryable transaction error:", err);
            throw err;
        }
    }
  }
  console.error("Send and confirm failed after all retries.", lastError);
  throw lastError;
}
// --- End Utility Functions ---

/**
 * Handle the mint button click (Single Token).
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
        updateStatus('Please select a token to mint.', true);
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
    if (txSignatureEl) txSignatureEl.innerHTML = '';

    try {
        const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
        if (!mintInfo || !mintInfo.value || !('parsed' in mintInfo.value.data)) {
            throw new Error('Could not fetch mint info or data is not parsed');
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;

        const scale = 10n ** BigInt(decimals);
        const u64Max = 18446744073709551615n; 
        const maxSafeDisplayAmount = u64Max / scale;

        const userAmountDisplay = parseInt(amountStr, 10);
        if (isNaN(userAmountDisplay) || userAmountDisplay <= 0) {
            throw new Error('Please enter a valid positive amount.');
        }

        if (BigInt(userAmountDisplay) > maxSafeDisplayAmount) {
             throw new Error(`Amount too large for ${decimals} decimals. Max: ${maxSafeDisplayAmount}`);
        }
        
        const amountToMint = BigInt(userAmountDisplay) * scale;

        updateStatus(`Fetching/creating token account for ${selectedSymbol}...`);

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, mintAuthority, mintPublicKey, recipientPublicKey, false,
            'confirmed', undefined, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
        );

        updateStatus(`Minting ${amountToMint} (raw) ${selectedSymbol}...`);

        const signature = await mintTo(
            connection, mintAuthority, mintPublicKey, recipientTokenAccount.address,
            mintAuthority, amountToMint, [], { commitment: 'confirmed' }, TOKEN_PROGRAM_ID
        );

        updateStatus(`Successfully minted ${userAmountDisplay} ${selectedSymbol}!`);
        showTransactionLinks(signature);
        showRecipientLinks(recipientAddressStr);

    } catch (error: any) {
        updateStatus(`Minting ${selectedSymbol} failed: ${error.message || error}`, true);
        console.error(`Minting error (${selectedSymbol}):`, error);
    } finally {
        mintButton.disabled = false;
    }
}

/**
 * Handle the mint all button click.
 */
async function handleMintAll() {
    if (!connection || !mintAuthority || !recipientInput || !amountInput || !mintButton) {
        updateStatus('Initialization error. Check console.', true);
        return;
    }
    const recipientAddressStr = recipientInput.value.trim();
    const amountStr = amountInput.value.trim();

    if (!recipientAddressStr) {
        updateStatus('Please enter a recipient address.', true);
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

    mintButton.disabled = true;
    if (txSignatureEl) txSignatureEl.innerHTML = '';
    updateStatus(`Starting bulk mint of ${amountStr} for each token...`);
    showRecipientLinks(recipientAddressStr);

    const userAmountDisplay = parseInt(amountStr, 10);
    if (isNaN(userAmountDisplay) || userAmountDisplay <= 0) {
        updateStatus('Please enter a valid positive amount.', true);
        mintButton.disabled = false;
        return;
    }

    const allSymbols = Object.keys(MINT_ADDRESSES).sort();
    const results = { succeeded: [] as string[], failed: [] as { symbol: string; error: string }[] };
    let overallStatus = '';

    for (const symbol of allSymbols) {
        const mintAddressStr = MINT_ADDRESSES[symbol];
        const mintPublicKey = new PublicKey(mintAddressStr);
        updateStatus(`Processing ${symbol}...`);
        
        try {
            const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
            if (!mintInfo || !mintInfo.value || !('parsed' in mintInfo.value.data)) {
                throw new Error('Could not fetch mint info');
            }
            const decimals = mintInfo.value.data.parsed.info.decimals;
            const scale = 10n ** BigInt(decimals);
            const u64Max = 18446744073709551615n; 
            const maxSafeDisplayAmount = u64Max / scale;

            if (BigInt(userAmountDisplay) > maxSafeDisplayAmount) {
                throw new Error(`Amount too large for ${decimals} decimals. Max: ${maxSafeDisplayAmount}`);
            }
            const amountToMint = BigInt(userAmountDisplay) * scale;

            updateStatus(`Fetching/creating token account for ${symbol}...`);
            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection, mintAuthority, mintPublicKey, recipientPublicKey, false,
                'confirmed', undefined, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
            );

            updateStatus(`Minting ${amountToMint} (raw) ${symbol}...`);
            const signature = await mintTo(
                connection, mintAuthority, mintPublicKey, recipientTokenAccount.address,
                mintAuthority, amountToMint, [], { commitment: 'confirmed' }, TOKEN_PROGRAM_ID
            );
            console.log(`Minted ${symbol}, Tx: ${signature}`);
            results.succeeded.push(symbol);

        } catch (error: any) {
            const errorMsg = error.message || String(error);
            console.error(`Failed to mint ${symbol}:`, error);
            results.failed.push({ symbol, error: errorMsg });
        }
         await sleep(500);
    }

    overallStatus = `Bulk Mint Complete. Success: ${results.succeeded.length}. Failed: ${results.failed.length}.`;
    if (results.failed.length > 0) {
        overallStatus += ` Failures: ${results.failed.map(f => `${f.symbol} (${f.error.substring(0, 30)}...)`).join(', ')}`;
    }
    updateStatus(overallStatus, results.failed.length > 0);

    mintButton.disabled = false;
}

/**
 * Handle the update price button click. Use AutoNumeric getter.
 */
async function handleUpdatePrice() {
    if (!connection || !mintAuthority || !priceFeedSelect || !newPriceInput || !updatePriceButton || !priceInputAutoNumeric) {
        updatePriceUpdateStatus('Initialization error (AutoNumeric). Check console.', true);
        return;
    }

    const selectedSymbol = priceFeedSelect.value;
    
    const priceNum = priceInputAutoNumeric.getNumber();

    if (!selectedSymbol) {
        updatePriceUpdateStatus('Please select a price feed symbol.', true);
        return;
    }

    if (priceNum === null || typeof priceNum === 'undefined' || priceNum < 0) { 
        updatePriceUpdateStatus('Please enter a valid non-negative price.', true);
        return; 
    }

    let newPriceRaw: anchor.BN;
    const hardcodedExponent = PRICE_EXPONENT;
    const displayPriceStr = String(priceNum);

    try {
        const parts = displayPriceStr.split('.'); 
        const integerPart = parts[0];
        const fractionalPart = parts[1] || '';
        const numZerosToAdd = Math.abs(hardcodedExponent);
        if (fractionalPart.length > numZerosToAdd) {
            throw new Error(`Input precision (${fractionalPart.length} decimals) exceeds exponent precision (${numZerosToAdd}).`);
        }
        const paddedFractional = fractionalPart.padEnd(numZerosToAdd, '0');
        const rawValueString = integerPart + paddedFractional; 
        newPriceRaw = new anchor.BN(rawValueString);

    } catch (error: any) {
        updatePriceUpdateStatus(`Invalid price input/calculation: ${error.message || 'Error processing price.'}`, true);
        console.error(error);
        return;
    }

    const formattedDisplayPrice = priceInputAutoNumeric.getFormatted();

    const mockFeedAddressStr = MOCK_PRICE_FEEDS[selectedSymbol];
    if (!mockFeedAddressStr) {
        updatePriceUpdateStatus(`Mock feed address not found for ${selectedSymbol}. Check mockPriceFeeds.json.`, true);
        return;
    }

    const mockFeedPublicKey = new PublicKey(mockFeedAddressStr);
    const programId = new PublicKey(IDL.address); 

    updatePriceButton.disabled = true;
    updatePriceUpdateStatus(`Building transaction for ${selectedSymbol} to ${formattedDisplayPrice} (raw: ${newPriceRaw.toString()}, exponent: ${hardcodedExponent})...`);
    if (feedAccountLinkArea) feedAccountLinkArea.innerHTML = ''; 

    try {
        const instructionData = buildUpdatePriceInstructionData(newPriceRaw, hardcodedExponent);
        const accounts: AccountMeta[] = [
            { pubkey: mockFeedPublicKey, isSigner: false, isWritable: true },
        ];
        const instruction = new TransactionInstruction({
            keys: accounts,
            programId: programId,
            data: instructionData,
        });

        const transaction = new Transaction()
            .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_FEE }))
            .add(ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }))
            .add(instruction);

        updatePriceUpdateStatus(`Sending transaction for ${selectedSymbol}...`);

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            mintAuthority 
        );

        updatePriceUpdateStatus(`Successfully updated price for ${selectedSymbol}!`);
        showPriceUpdateTransactionLinks(signature);
        showPriceFeedAccountLink(mockFeedPublicKey.toBase58());

    } catch (error: any) {
        updatePriceUpdateStatus(`Update failed: ${error.message || error}`, true);
        console.error('Price update error:', error);
    } finally {
        updatePriceButton.disabled = false;
    }
}

/**
 * Initialize the faucet script.
 */
async function initialize() {
    updateStatus('Initializing...');
    updatePriceUpdateStatus('Initializing...');

    if (MINT_AUTHORITY_SECRET_KEY.length !== 64) {
        const errorMsg = 'ERROR: Invalid MINT_AUTHORITY_SECRET_KEY length. Paste the 64-byte array.';
        updateStatus(errorMsg, true);
        updatePriceUpdateStatus(errorMsg, true);
        return;
    }
    if (MINT_AUTHORITY_SECRET_KEY[0] === 1 && MINT_AUTHORITY_SECRET_KEY[1] === 2 && MINT_AUTHORITY_SECRET_KEY[2] === 3) {
        const errorMsg = 'ERROR: Placeholder MINT_AUTHORITY_SECRET_KEY found. Paste your actual key.';
        updateStatus(errorMsg, true);
        updatePriceUpdateStatus(errorMsg, true);
        return;
    }

    try {
        currentClusterInfo = getClusterInfo();
        console.log('Cluster Info:', currentClusterInfo);

        mintAuthority = Keypair.fromSecretKey(MINT_AUTHORITY_SECRET_KEY);
        console.log('Authority/Payer Key:', mintAuthority.publicKey.toBase58());

        connection = new Connection(RPC_ENDPOINT, 'confirmed');
        console.log('Connected to:', RPC_ENDPOINT);
        await connection.getVersion();
        console.log('Connection successful.');

        if (Object.keys(MINT_ADDRESSES).length === 0) {
             throw new Error('Mint addresses data is empty after import.');
        }
        console.log('Successfully loaded MINT_ADDRESSES via import:', MINT_ADDRESSES);

        if (Object.keys(MOCK_PRICE_FEEDS).length === 0) {
            console.warn('Mock price feed addresses data is empty after import. Ensure `anchor test` was run in mockPriceFeed project.');
            updatePriceUpdateStatus('Warning: Price feed list empty. Run `anchor test` in mockPriceFeed?', true);
        } else {
            console.log('Successfully loaded MOCK_PRICE_FEEDS via import:', MOCK_PRICE_FEEDS);
        }

        populateTokenDropdown();
        populatePriceFeedDropdown();

        if (newPriceInput) {
            priceInputAutoNumeric = new AutoNumeric(newPriceInput, {
                digitGroupSeparator: ' ',
                decimalCharacter: '.',
                decimalPlaces: 8,
                minimumValue: '0',
            });
            console.log('AutoNumeric initialized on price input.');
        } else {
            console.error('Price input element not found for AutoNumeric.');
             updatePriceUpdateStatus('Initialization error: Price input field missing.', true);
        }

        if (mintButton) {
            mintButton.addEventListener('click', () => {
                if (mintAllCheckbox?.checked) {
                    handleMintAll();
                } else {
                    const selectedValue = tokenSelect?.value;
                    if (selectedValue) {
                        handleMint();
                    } else {
                        updateStatus('Please select a specific token or check "Mint All Tokens Instead".', true);
                    }
                }
            });
        }
        if (updatePriceButton) {
            updatePriceButton.addEventListener('click', handleUpdatePrice);
        }

        // --- Link Checkbox and Dropdown --- Added
        if (mintAllCheckbox && tokenSelect) {
            // When checkbox changes
            mintAllCheckbox.addEventListener('change', () => {
                if (mintAllCheckbox.checked) {
                    // If checking the box, reset the dropdown
                    tokenSelect.value = ''; // Set to the value of "-- Select Token --"
                }
            });

            // When dropdown changes
            tokenSelect.addEventListener('change', () => {
                if (tokenSelect.value !== '') { // If a specific token is selected
                    // Uncheck the "Mint All" checkbox
                    mintAllCheckbox.checked = false;
                }
            });
        }
        // --- End Link Checkbox and Dropdown ---

        updateStatus('Ready. Enter address, select token, and click Mint.');
        updatePriceUpdateStatus('Ready. Select feed, enter price, and click Update.');

    } catch (error: any) {
         const errorMsg = `Initialization failed: ${error.message || error}`;
        updateStatus(errorMsg, true);
        updatePriceUpdateStatus(errorMsg, true);
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initialize);