// bluetoothWallet.js

const chronik = new window.ChronikClient("https://chronik.e.cash");
let wallet = null;
let rawTxToBroadcast = null;

async function connectWallet() {
  const mnemonic = prompt("Enter your 12-word mnemonic phrase:");
  if (!mnemonic || mnemonic.trim().split(" ").length < 12) return alert("Invalid mnemonic");
  localStorage.setItem("mnemonic", mnemonic);
  await initializeWallet();
}

async function initializeWallet() {
  const mnemonic = localStorage.getItem("mnemonic");
  if (!mnemonic) return;
  wallet = await window.ecashlib.Wallet.fromSeed(mnemonic);
  document.getElementById("wallet-address").innerText = await wallet.getAddress();
  await updateBalances();
}

async function updateBalances() {
  if (!wallet) return;
  const res = await chronik.address("ecash:" + await wallet.getAddress());
  const xecBalance = (res.balance.confirmed + res.balance.unconfirmed) / 100;
  document.getElementById("xecBalance").innerText = xecBalance.toFixed(2);
  const token = res.tokenBalances.find(t => t.tokenId === '9e0a9d4720782cf661beaea6c5513f1972e0f3b1541ba4c83f4c87ef65f843dc');
  document.getElementById("rmzBalance").innerText = token ? token.amount : '0';
}

async function sendXEC() {
  const to = document.getElementById("to").value;
  const amount = parseFloat(document.getElementById("amount").value);
  if (!to || !amount) return alert("Fill all fields");
  const sats = BigInt(Math.round(amount * 100));
  const resp = await wallet.action({ outputs: [{ to, sats }] }).build().broadcast();
  alert("Transaction Sent! TXID: " + resp.txid);
  await updateBalances();
}

async function buildRawTransaction() {
  const to = document.getElementById("toBluetooth").value;
  const amount = parseFloat(document.getElementById("amountBluetooth").value);
  if (!to || !amount) return alert("Fill all fields");
  const sats = BigInt(Math.round(amount * 100));
  const tx = await wallet.action({ outputs: [{ to, sats }] }).build();
  rawTxToBroadcast = tx.rawHex;
  alert("Transaction built! Ready to send via Bluetooth.");
}

async function sendViaBluetooth() {
  if (!rawTxToBroadcast) return alert("Build a transaction first");
  const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
  const server = await device.gatt.connect();
  // For simplicity, we're assuming a custom service UUID and characteristic.
  const service = await server.getPrimaryService('12345678-1234-1234-1234-123456789abc');
  const characteristic = await service.getCharacteristic('abcd1234-5678-90ab-cdef-1234567890ab');
  const encoder = new TextEncoder();
  await characteristic.writeValue(encoder.encode(rawTxToBroadcast));
  alert("Transaction sent via Bluetooth!");
}

async function receiveViaBluetooth() {
  const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('12345678-1234-1234-1234-123456789abc');
  const characteristic = await service.getCharacteristic('abcd1234-5678-90ab-cdef-1234567890ab');
  const value = await characteristic.readValue();
  const decoder = new TextDecoder();
  rawTxToBroadcast = decoder.decode(value);
  alert("Transaction received via Bluetooth!");
  document.getElementById("broadcastBtn").style.display = "block";
}

async function broadcastRawTx() {
  if (!rawTxToBroadcast) return alert("No transaction to broadcast");
  await chronik.broadcastTx(rawTxToBroadcast);
  alert("Transaction broadcasted to eCash network!");
  rawTxToBroadcast = null;
  document.getElementById("broadcastBtn").style.display = "none";
  await updateBalances();
}

document.getElementById("connect-wallet").addEventListener("click", connectWallet);
document.getElementById("sendBtn").addEventListener("click", sendXEC);
document.getElementById("buildBluetoothBtn").addEventListener("click", buildRawTransaction);
document.getElementById("sendBluetoothBtn").addEventListener("click", sendViaBluetooth);
document.getElementById("receiveBluetoothBtn").addEventListener("click", receiveViaBluetooth);
document.getElementById("broadcastBtn").addEventListener("click", broadcastRawTx);

initializeWallet();
