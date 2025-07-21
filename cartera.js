import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';
import bip39 from 'bip39';
import fs from 'fs';

const main = async () => {
  const chronik = new ChronikClient('https://chronik.fabien.cash');
  const mnemonic = bip39.generateMnemonic();

  const wallet = Wallet.fromMnemonic(mnemonic, chronik);

  try {
    await wallet.sync();
  } catch (err) {
    console.warn('\n⚠️ La dirección aún no tiene historial en blockchain');
  }

  const data = {
    mnemonic,
    address: wallet.address,
  };

  fs.writeFileSync('cartera.json', JSON.stringify(data, null, 2));
  console.log('\n✅ Archivo "cartera.json" creado con tu dirección y frase de recuperación.');
  console.log('\n📮 Dirección:\n' + wallet.address);
};

main();

