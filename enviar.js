import { Wallet } from 'ecash-wallet';
import { ChronikClient } from 'chronik-client';
import fs from 'fs';

// Leer la mnemonic desde cartera.json
const cartera = JSON.parse(fs.readFileSync('./cartera.json', 'utf-8'));

const main = async () => {
  const chronik = new ChronikClient('https://chronik.fabien.cash');
  const wallet = Wallet.fromMnemonic(cartera.mnemonic, chronik);

  // Cambia estos valores:
  const destino = 'ecash:qqa4zjj0mt6gkm3uh6wcmxtzdr3p6f7cky4y7vujuw'; // Dirección destino real
  const montoXEC = 0.001;
const sats = BigInt(Math.round(montoXEC * 1e8)); // ✅ BigInt para evitar errores


  try {
    const resp = await wallet
      .action({
        outputs: [{ to: destino, sats }],
      })
      .build()
      .broadcast();

    console.log('✅ Transacción enviada: ', resp.txid);
  } catch (err) {
    console.error('❌ Error al enviar XEC:', err.message || err);
  }
};

main();
