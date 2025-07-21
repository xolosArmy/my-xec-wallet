import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';
import fs from 'fs';

const main = async () => {
  const chronik = new ChronikClient('https://chronik.e.cash');

  const { mnemonic } = JSON.parse(fs.readFileSync('cartera.json'));
  const wallet = Wallet.fromMnemonic(mnemonic, chronik);
  await wallet.sync();

  const utxos = wallet.spendableSatsOnlyUtxos();
  const total = Wallet.sumUtxosSats(utxos);
  const fee = 300n;

  if (total <= fee) {
    console.error('❌ No hay suficiente saldo para cubrir la comisión.');
    return;
  }

  const destino = 'ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw'; // ← pon tu dirección de destino real
  const monto = total - fee;

  // 🔧 Este es el formato correcto para `wallet.action()`
  const tx = wallet
    .action([
      {
        to: destino,
        value: monto,
        tokenId: null,     // importante: null explícito
        tokenType: null,   // lo espera el validador interno
      },
    ])
    .build();

  await chronik.broadcastTx(tx.hex);
  console.log('\n🚀 Transacción enviada:');
  console.log(tx.hex);
};

main();
