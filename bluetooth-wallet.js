// File: bluetooth-wallet.js

// Import ecash-lib (assuming it's included in window.ecashlib)
const { Wallet, Script } = window.ecashlib;
const chronik = new window.ChronikClient('https://chronik.e.cash');

// Wallet instance shared by all actions
let currentWallet = null;
let lastHandshakeAddress = null;

// ======= 1. Build Raw Transaction Locally =======
async function createRawTransaction(toAddress, amountSats, tokenId = null, tokenAmount = null) {
  // Validate destination address as a basic handshake/validation
  Script.fromAddress(toAddress);

  await currentWallet.sync();

  const outputs = [{ to: toAddress, sats: amountSats }];

  const tokenActions = tokenId
    ? [
        {
          type: 'SEND',
          tokenId,
          tokenType: window.ecashlib.SLP_TOKEN_TYPE_FUNGIBLE,
        },
      ]
    : [];

  const action = {
    outputs,
    tokenActions,
  };

  const builtTx = await currentWallet.action(action).build();
  return builtTx.toHex();
}

// ======= 2. Send Raw TX via Bluetooth =======
async function sendTxViaBluetooth(rawTxHex) {
  const options = {
    acceptAllDevices: true,
    optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'], // Example Service UUID
  };

  try {
    const device = await navigator.bluetooth.requestDevice(options);
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(
      '0000ffe0-0000-1000-8000-00805f9b34fb',
    );
    const characteristic = await service.getCharacteristic(
      '0000ffe1-0000-1000-8000-00805f9b34fb',
    );

    const encoder = new TextEncoder();
    // Handshake first
    const handshake = JSON.stringify({
      type: 'handshake',
      address: currentWallet.address,
    });
    await characteristic.writeValue(encoder.encode(handshake));

    // Small delay to allow the receiver to process the handshake
    await new Promise((r) => setTimeout(r, 200));

    // Send the transaction payload
    const payload = JSON.stringify({ type: 'tx', rawTx: rawTxHex });
    await characteristic.writeValue(encoder.encode(payload));

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
    optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'],
  };

  try {
    const device = await navigator.bluetooth.requestDevice(options);
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(
      '0000ffe0-0000-1000-8000-00805f9b34fb',
    );
    const characteristic = await service.getCharacteristic(
      '0000ffe1-0000-1000-8000-00805f9b34fb',
    );

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const decoder = new TextDecoder();
      const msg = decoder.decode(event.target.value);

      try {
        const data = JSON.parse(msg);
        if (data.type === 'handshake') {
          try {
            Script.fromAddress(data.address);
            lastHandshakeAddress = data.address;
            alert('Handshake received from ' + data.address);
          } catch (e) {
            console.warn('Invalid handshake address');
          }
          return;
        }

        if (data.type === 'tx') {
          if (!lastHandshakeAddress) {
            console.warn('No handshake. Ignoring tx');
            return;
          }

          const txs = JSON.parse(
            localStorage.getItem('pendingRawTxs') || '[]',
          );
          txs.push({ from: lastHandshakeAddress, rawTx: data.rawTx });
          localStorage.setItem('pendingRawTxs', JSON.stringify(txs));
          alert('Received TX via Bluetooth from ' + lastHandshakeAddress);
          lastHandshakeAddress = null;
        }
      } catch (err) {
        console.error('Invalid message', err);
      }
    });

    alert('Waiting for transaction via Bluetooth...');
  } catch (error) {
    console.error('Bluetooth Reception Error:', error);
    alert('Bluetooth error: ' + error);
  }
}

// ======= 4. Broadcast TX to eCash Network =======
async function broadcastStoredTxs() {
  const stored = JSON.parse(localStorage.getItem('pendingRawTxs') || '[]');
  if (stored.length === 0) {
    alert('No transactions stored. Receive one via Bluetooth first.');
    return;
  }

  const remaining = [];
  for (const tx of stored) {
    try {
      await chronik.broadcastTx(tx.rawTx);
    } catch (error) {
      console.error('Broadcast Error:', error);
      remaining.push(tx); // keep tx for retry
    }
  }

  localStorage.setItem('pendingRawTxs', JSON.stringify(remaining));
  alert(
    `Broadcasted ${stored.length - remaining.length} tx(s); ${remaining.length} remaining`,
  );
}

// ======= Wallet Initialization from Mnemonic =======
async function initWallet(mnemonic) {
  currentWallet = Wallet.fromMnemonic(mnemonic, chronik);
  await currentWallet.sync();
  alert('Wallet connected!');
  return currentWallet.address;
}

// Expose functions globally for UI integration
window.initWallet = initWallet;
window.createRawTransaction = createRawTransaction;
window.sendTxViaBluetooth = sendTxViaBluetooth;
window.receiveTxViaBluetooth = receiveTxViaBluetooth;
window.broadcastStoredTxs = broadcastStoredTxs;
