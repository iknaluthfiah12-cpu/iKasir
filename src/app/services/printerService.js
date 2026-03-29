import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';

export const printThermal = async (tx) => {

  const receipt = `
iKasir
--------------------------
No : ${tx.no}
Kasir : ${tx.kasir}
${tx.date}
--------------------------
${tx.items.map(i =>
`${i.name} x${i.qty}   Rp ${i.price * i.qty}`
).join('\n')}
--------------------------
TOTAL : Rp ${tx.total}
BAYAR : Rp ${tx.cash}
KEMBALI : Rp ${tx.kembalian}

Terima kasih
`;

  try {
    BluetoothSerial.connect('MAC_PRINTER').subscribe(
      () => {
        BluetoothSerial.write(receipt + '\x1D\x56\x00');
      },
      (err) => {
        console.log('Gagal connect printer', err);
      }
    );
  } catch (error) {
    console.log(error);
  }
};
