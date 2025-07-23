// saldo.js – muestra dirección y saldo disponible en XEC
// Requiere: cartera.json (con mnemonic) en el mismo folder

import fs from 'fs';
import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';

// --- 1. Cargamos frase de recuperación ------------------------------------
const { mnemonic } = JSON.parse(fs.readFileSync('cartera.json', 'utf8'));

// --- 2. Inicializamos Chronik (instancia pública) --------------------------
const chronik = new ChronikClient('https://chronik.e.cash');

// --- 3. Reconstruimos el wallet y lo sincronizamos -------------------------
const wallet = Wallet.fromMnemonic(mnemonic, chronik);
await wallet.sync();                                  // actualiza UTXOs

// --- 4. Obtenemos UTXOs directamente con Chronik ---------------------------
// Nota: .getUtxos() ya no existe en ecash-wallet v0.12+.  Usamos Chronik.
const { address } = wallet;                           // ej. ecash:q....
const utxoRes = await chronik.address(address).utxos();

const totalSats = utxoRes.utxos
  .reduce((acc, utxo) => acc + BigInt(utxo.sats), 0n);

// eCash: 1 XEC  = 100 sats → dividimos entre 100 para mostrar 2 decimales
const balanceXec = Number(totalSats) / 100;

console.log(`\n🏦 Dirección: ${address}`);
console.log(`💰 Saldo disponible: ${balanceXec.toFixed(2)} XEC`);

