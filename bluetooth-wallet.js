// File: bluetooth-wallet.js

// Import ecash-lib (assuming it's included in window.ecashlib)
const { Wallet } = window.ecashlib;
const chronik = new window.ChronikClient("https://chronik.e.cash");

let currentWallet = null;

// ======= 1. Build Raw Transaction Locally =======
async function createRawTransaction(toAddress, amountSats, tokenId = null, tokenAmount = null) {
    await currentWallet.sync();

    const outputs = [
        { to: toAddress, sats: amountSats }
    ];

    const tokenActions = tokenId ? [
        {
            type: 'SEND',
            tokenId,
            tokenType: window.ecashlib.SLP_TOKEN_TYPE_FUNGIBLE
        }
    ] : [];

    const action = {
        outputs,
        tokenActions
    };

    const builtTx = await currentWallet.action(action).build();
    const rawTxHex = builtTx.toHex();
    return rawTxHex;
}

// ======= 2. Send Raw TX via Bluetooth =======
async function sendTxViaBluetooth(rawTxHex) {
    const options = {
        acceptAllDevices: true,
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'] // Example Service UUID
    };

    try {
        const device = await navigator.bluetooth.requestDevice(options);
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');

        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(rawTxHex));
        alert('Transaction sent via Bluetooth!');

    } catch (error) {
        console.error('Bluetooth Transmission Error:', error);
        alert('Bluetooth error: ' + error);
    }
}

// ======= 3. Receive Raw TX via Bluetooth =======
async function receiveTxViaBluetooth() {
    const options = {
        acceptAllDevices: true,
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
    };

    try {
        const device = await navigator.bluetooth.requestDevice(options);
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const decoder = new TextDecoder();
            const rawTxHex = decoder.decode(event.target.value);
            alert('Received TX via Bluetooth:\n' + rawTxHex);

            // Store to localStorage for broadcasting later
            localStorage.setItem('pendingRawTx', rawTxHex);
        });

        alert('Waiting for transaction via Bluetooth...');

    } catch (error) {
        console.error('Bluetooth Reception Error:', error);
        alert('Bluetooth error: ' + error);
    }
}

// ======= 4. Broadcast TX to eCash Network =======
async function broadcastStoredTx() {
    const rawTxHex = localStorage.getItem('pendingRawTx');
    if (!rawTxHex) {
        alert('No transaction stored. Receive one via Bluetooth first.');
        return;
    }

    try {
        await chronik.broadcastTx(rawTxHex);
        alert('Transaction broadcasted successfully!');
        localStorage.removeItem('pendingRawTx');
    } catch (error) {
        console.error('Broadcast Error:', error);
        alert('Broadcast failed: ' + error);
    }
}

// ======= Wallet Initialization from Mnemonic =======
async function connectMnemonic(mnemonic) {
    currentWallet = await Wallet.fromSeed(mnemonic);
    alert('Wallet connected!');
}
