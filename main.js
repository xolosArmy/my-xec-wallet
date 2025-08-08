// main.js

let chronik;
let wallet;

const addressDisplay = document.getElementById("wallet-address");
const xecBalanceDisplay = document.getElementById("xec-balance");
const rmzBalanceDisplay = document.getElementById("rmz-balance");
const sendForm = document.getElementById("send-xec-form");
const sendStatus = document.getElementById("send-xec-status");
const connectBtn = document.getElementById("connect-wallet-btn");
const sendToInput = document.getElementById("send-to-address");
const sendAmountInput = document.getElementById("send-amount");

const generateRawTxBtn = document.getElementById("generate-raw-tx-btn");
const rawTxOutput = document.getElementById("raw-tx-output");
const sendBluetoothBtn = document.getElementById("send-bluetooth-btn");
const bluetoothSendStatus = document.getElementById("bluetooth-send-status");
const receiveBluetoothBtn = document.getElementById("receive-bluetooth-btn");
const receivedRawTx = document.getElementById("received-raw-tx");
const broadcastReceivedTxBtn = document.getElementById("broadcast-received-tx-btn");
const bluetoothReceiveStatus = document.getElementById("bluetooth-receive-status");

const RMZ_TOKEN_ID = "9e0a9d4720782cf661beaea6c5513f1972e0f3b1541ba4c83f4c87ef65f843dc";

function showSection(sectionId) {
  const sections = document.querySelectorAll('main > section');
  sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
}
window.showSection = showSection;

connectBtn.addEventListener("click", () => {
  openMnemonicModal();
});

function openMnemonicModal() {
  const modal = document.createElement("div");
  modal.id = "mnemonic-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Enter your 12-word mnemonic</h3>
      <input type="password" id="mnemonic-input" placeholder="Mnemonic" />
      <button id="mnemonic-submit-btn">Connect</button>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("mnemonic-submit-btn").addEventListener("click", async () => {
    const mnemonic = document.getElementById("mnemonic-input").value.trim();
    if (mnemonic.split(" ").length < 12) {
      alert("Invalid mnemonic");
      return;
    }
    localStorage.setItem("mnemonicKey", mnemonic);
    await initializeWallet(mnemonic);
    modal.remove();
  });
}

async function initializeWallet(mnemonic) {
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

    let rmzBalance = 0n;
    res.utxos.forEach(utxo => {
      if (utxo.token && utxo.token.category === RMZ_TOKEN_ID) {
        rmzBalance += BigInt(utxo.token.amount);
      }
    });
    rmzBalanceDisplay.innerText = rmzBalance.toString();
  } catch (err) {
    console.error("Error fetching balances:", err);
  }
}

sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!wallet) return;
  const to = sendToInput.value.trim();
  const amount = parseFloat(sendAmountInput.value);
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

function bluetoothSendPlaceholder() {
  bluetoothSendStatus.innerText = "Bluetooth send not implemented";
}

function bluetoothReceivePlaceholder() {
  bluetoothReceiveStatus.innerText = "Bluetooth receive not implemented";
}

function generateRawTxPlaceholder() {
  rawTxOutput.value = "Raw transaction placeholder";
  bluetoothSendStatus.innerText = "Raw TX generation not implemented";
}

function broadcastReceivedTxPlaceholder() {
  bluetoothReceiveStatus.innerText = "Broadcast not implemented";
}

generateRawTxBtn.addEventListener("click", generateRawTxPlaceholder);
sendBluetoothBtn.addEventListener("click", bluetoothSendPlaceholder);
receiveBluetoothBtn.addEventListener("click", bluetoothReceivePlaceholder);
broadcastReceivedTxBtn.addEventListener("click", broadcastReceivedTxPlaceholder);

window.addEventListener("load", async () => {
  chronik = new window.ChronikClient("https://chronik.e.cash");
  const storedMnemonic = localStorage.getItem("mnemonicKey");
  if (storedMnemonic) {
    await initializeWallet(storedMnemonic);
  }
  showSection('balance-section');
});

