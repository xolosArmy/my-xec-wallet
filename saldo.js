import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';
import fs from 'fs';

const main = async () => {
  const chronik = new ChronikClient('https://chronik.e.cash');

  // Leer la cartera desde el archivo
  const raw = fs.readFileSync('cartera.json');
  const { mnemonic } = JSON.parse(raw);

  // Restaurar el wallet y sincronizar
  const wallet = Wallet.fromMnemonic(mnemonic, chronik);
  await wallet.sync();

  // Obtener saldo disponible
  const utxos = wallet.spendableSatsOnlyUtxos();
  const total = Wallet.sumUtxosSats(utxos);

  console.log('\n💰 Saldo disponible: ' + Number(total) / 1e8 + ' XEC');
};

main();
