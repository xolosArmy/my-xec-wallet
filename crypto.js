import crypto from 'crypto';
import fs from 'fs';
import bluetooth from 'node-bluetooth';

const device = new bluetooth.DeviceINQ();

// Buscar dispositivos
device.listPairedDevices(console.log);


const secret = 'xolos123!'; // Se guarda localmente en .env o prompt

// Encriptar
const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

// Desencriptar
const decrypt = (encrypted) => {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};

// Guardar clave privada encriptada
const wif = 'L1...'; // clave privada ejemplo
const encrypted = encrypt(wif);
fs.writeFileSync('cartera.json', JSON.stringify({ encrypted }));

// Leer y desencriptar
const data = JSON.parse(fs.readFileSync('cartera.json'));
const decrypted = decrypt(data.encrypted);
console.log('Clave privada:', decrypted);
