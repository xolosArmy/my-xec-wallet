// enviar.js – envía una cantidad de XEC a una dirección dada
// Uso:   node enviar.js <destino_ecash> <monto_XEC>
// Ej.:   node enviar.js ecash:qq.... 12.34

import fs from 'fs';
import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';
import { Script } from 'ecash-lib';

// --- 1. Valida argumentos de CLI -------------------------------------------
if (process.argv.length !== 4) {
  console.error('Uso: node enviar.js <destino_ecash> <monto_XEC>');
  process.exit(1);
}
const [ , , destino, montoStr ] = process.argv;
const montoXec = Number(montoStr);
if (isNaN(montoXec) || montoXec <= 0) {
  console.error('Monto no válido');
  process.exit(1);
}

// --- 2. Carga wallet --------------------------------------------------------
const { mnemonic } = JSON.parse(fs.readFileSync('cartera.json', 'utf8'));
const chronik = new ChronikClient('https://chronik.e.cash');
const wallet  = Wallet.fromMnemonic(mnemonic, chronik);
await wallet.sync();

// --- 3. Prepara y construye la transacción ----------------------------------
const sats = BigInt(Math.round(montoXec * 100));      // XEC → sats (×100)
const destScript = Script.fromAddress(destino);

try {
  const resp = await wallet
    .action({ outputs: [ { script: destScript, sats } ] })
    .build()
    .broadcast();

  console.log(`✅ Tx enviada. TXID: ${resp.txid}`);
} catch (err) {
  console.error(`❌ Error al enviar XEC: ${err.message}`);
}

