// main.js

const chronik = new window.ChronikClient("https://chronik.e.cash");

let wallet = null;
let connectedMnemonic = null;

const addressDisplay = document.getElementById("wallet-address");
const xecBalanceDisplay = document.getElementById("xec-balance");
const rmzBalanceDisplay = document.getElementById("rmz-balance");
const sendForm = document.getElementById("send-xec-form");
const sendStatus = document.getElementById("send-xec-status");
const connectBtn = document.getElementById("connect-wallet-btn");
const sendBluetoothBtn = document.getElementById("send-bluetooth-btn");
const receiveBluetoothBtn = document.getElementById("receive-bluetooth-btn");

const RMZ_TOKEN_ID = "9e0a9d4720782cf661beaea6c5513f1972e0f3b1541ba4c83f4c87ef65f843dc";

function showSection(sectionId) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
}
window.showSection = showSection;

// Connect wallet with mnemonic
connectBtn.addEventListener("click", async () => {
    const mnemonic = prompt("Enter your 12-word mnemonic:");
    if (!mnemonic || mnemonic.split(" ").length < 12) {
        alert("Invalid mnemonic.");
        return;
    }
    localStorage.setItem("mnemonicKey", mnemonic);
    connectedMnemonic = mnemonic;
    await initializeWallet();
});

async function initializeWallet() {
    const mnemonic = localStorage.getItem("mnemonicKey");
    if (!mnemonic) return;

    const { Wallet } = window.ecashlib;
    wallet = await Wallet.fromMnemonic(mnemonic);
    const address = await wallet.getAddress();
    addressDisplay.innerText = address;

    await updateBalances(address);
}

async function updateBalances(address) {
    try {
        const res = await chronik.address("ecash:" + address);
        const balance = res.balance.confirmed + res.balance.unconfirmed;
        xecBalanceDisplay.innerText = (balance / 100).toFixed(2);

        const tokenInfo = await chronik.token(RMZ_TOKEN_ID);
        const tokenUtxos = await chronik.tokenId(RMZ_TOKEN_ID).utxos();

        let rmzBalance = 0n;
        tokenUtxos.utxos.forEach(utxo => {
            if (utxo.token && utxo.token.category === RMZ_TOKEN_ID && utxo.token.amount) {
                rmzBalance += utxo.token.amount;
            }
        });
        rmzBalanceDisplay.innerText = rmzBalance.toString();
    } catch (err) {
        console.error("Error fetching balances:", err);
    }
}

sendForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const to = document.getElementById("send-to-address").value;
    const amount = parseFloat(document.getElementById("send-amount").value);
    const sats = BigInt(Math.round(amount * 100));

    try {
        const txResp = await wallet.action({ outputs: [{ to, sats }] }).build().broadcast();
        sendStatus.innerText = `Transaction Sent! TXID: ${txResp.txid}`;
        await updateBalances(await wallet.getAddress());
    } catch (err) {
        console.error(err);
        sendStatus.innerText = "Error sending transaction.";
    }
});

sendBluetoothBtn.addEventListener("click", async () => {
    const to = prompt("Enter recipient address:");
    const amount = parseFloat(prompt("Amount to send (XEC):"));
    const sats = BigInt(Math.round(amount * 100));

    const tx = await wallet.action({ outputs: [{ to, sats }] }).build();
    const rawTx = tx.rawHex;

    // Send raw TX via Bluetooth
    const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
    const server = await device.gatt.connect();
    // This example omits characteristics setup - you would define your Bluetooth service/characteristic UUIDs
    console.log("Bluetooth device connected. Ready to send raw TX:", rawTx);
    alert("Simulating Bluetooth send of raw TX: " + rawTx);
});

receiveBluetoothBtn.addEventListener("click", async () => {
    const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
    const server = await device.gatt.connect();
    // Simulate receiving raw TX
    const receivedRawTx = prompt("Simulate received raw TX hex:");
    if (!receivedRawTx) return;

    try {
        await chronik.broadcastTx(receivedRawTx);
        alert("Transaction broadcasted to eCash network!");
    } catch (err) {
        console.error("Broadcast error:", err);
        alert("Error broadcasting transaction.");
    }
});

// Init if mnemonic exists
window.addEventListener("load", () => {
    initializeWallet();
    showSection('balance-section');
});
