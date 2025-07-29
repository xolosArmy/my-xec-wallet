// bluetooth.js
import bleno from '@abandonware/bleno';


const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

// Mensaje que se desea enviar al celular
let mensaje = {
  destino: 'ecash:qps6u4el...', 
  monto: 1.23, 
  txid: 'abc123...'
};
let mensajeString = JSON.stringify(mensaje);
let mensajeBuffer = Buffer.from(mensajeString).toString('base64');

class XECCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: CHARACTERISTIC_UUID,
      properties: ['read'],
      descriptors: [
        new bleno.Descriptor({
          uuid: '2901',
          value: 'Envía mensaje XEC codificado base64',
        }),
      ],
    });
  }

  onReadRequest(offset, callback) {
    console.log('📡 Lectura solicitada por cliente BLE');
    const buffer = Buffer.from(mensajeBuffer);
    callback(this.RESULT_SUCCESS, buffer);
  }
}

const xecCharacteristic = new XECCharacteristic();

const xecService = new bleno.PrimaryService({
  uuid: SERVICE_UUID,
  characteristics: [xecCharacteristic],
});

bleno.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    console.log('✅ Bluetooth encendido. Iniciando publicidad...');
    bleno.startAdvertising('xecwallet', [SERVICE_UUID]);
  } else {
    console.log('❌ Bluetooth apagado');
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', (error) => {
  if (!error) {
    console.log('📢 Publicidad BLE iniciada');
    bleno.setServices([xecService]);
  } else {
    console.error('⚠️ Error al iniciar publicidad:', error);
  }
});
