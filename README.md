# iKasir v3.0 Pro — Ionic + Capacitor + ESC/POS Bluetooth

Aplikasi kasir Android modern dengan stack:
- **UI**: Ionic React 7 (Material Design)
- **Runtime**: Capacitor 5 (native Android bridge)
- **Print**: ESC/POS Bluetooth via Kotlin native plugin
- **Pembayaran**: Tunai, QRIS, Transfer Bank, EDC BCA

---

## 📁 Struktur Proyek

```
ikasir-ionic/
├── capacitor.config.ts           ← Konfigurasi Capacitor
├── package.json
│
├── public/
│   └── index.html
│
├── src/
│   ├── App.tsx                   ← Router + Tab navigation
│   ├── index.tsx
│   │
│   ├── theme/
│   │   ├── variables.css         ← Ionic CSS variables (brand colors)
│   │   └── global.css            ← Global styles & component tweaks
│   │
│   └── app/
│       ├── services/
│       │   ├── DataService.ts    ← localStorage + types + seed data
│       │   └── PrinterService.ts ← ESC/POS builder + BT bridge
│       │
│       ├── components/
│       │   └── CartDrawer.tsx    ← Bottom-sheet cart
│       │
│       └── pages/
│           ├── login/LoginPage.tsx
│           ├── pos/PosPage.tsx            ← POS utama
│           ├── history/HistoryPage.tsx    ← Riwayat transaksi
│           ├── payment/
│           │   ├── PaymentModal.tsx       ← 4 metode pembayaran
│           │   └── ReceiptModal.tsx       ← Struk + tombol cetak
│           ├── printer/PrinterPage.tsx    ← Manajemen printer BT
│           ├── stock/StockPage.tsx
│           ├── report/ReportPage.tsx
│           └── users/UsersPage.tsx
│
└── android/
    └── app/src/main/
        ├── AndroidManifest.xml
        ├── res/xml/network_security_config.xml
        └── java/com/ikasir/app/
            ├── MainActivity.kt            ← Register plugin
            └── BluetoothPrinterPlugin.kt  ← Kotlin BT plugin
```

---

## 🚀 Setup & Install

### Prasyarat
- Node.js ≥ 18
- Android Studio (Flamingo atau lebih baru)
- Android SDK API 33+
- Java 17

### 1. Install dependencies
```bash
npm install
```

### 2. Build React app
```bash
npm run build
```

### 3. Tambahkan platform Android
```bash
npx cap add android
```

### 4. Sync ke native
```bash
npx cap sync android
```

### 5. Buka di Android Studio
```bash
npx cap open android
```

### 6. Build APK
Di Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## 🖨️ Cara Kerja Print ESC/POS Bluetooth

### Arsitektur
```
React (PaymentModal)
    ↓ panggil
PrinterService.ts  ← encode ESC/POS ke Uint8Array → base64
    ↓ bridge
BluetoothPrinterPlugin.kt (Kotlin)
    ↓ decode base64 → byte[]
BluetoothSocket (SPP UUID)
    ↓
Thermal Printer (58mm / 80mm)
```

### Alur Pengguna
1. Buka tab **Printer** → Scan perangkat BT yang sudah dipasangkan
2. Tap printer → **Hubungkan**
3. Printer tersimpan otomatis (localStorage)
4. Saat cetak struk → `PrinterService.printReceipt(tx)` dipanggil
5. ESC/POS bytes dikirim via Bluetooth socket

### Format ESC/POS yang Dihasilkan
```
[INIT]
[ALIGN_CENTER][FONT_DOUBLE_W]
iKASIR
[FONT_NORMAL]
Toko Serba Ada
...tanggal, no invoice, kasir...
[ALIGN_LEFT][DIVIDER =]
  Item 1 ×2          Rp 30.000
  Item 2 ×1          Rp  8.000
[DIVIDER -]
Subtotal             Rp 38.000
Pajak 10%            Rp  3.800
[DIVIDER =]
TOTAL                Rp 41.800
[payment detail]
[DIVIDER =]
Terima kasih...
[FEED 3][CUT_PARTIAL]
```

### Printer yang Didukung
Semua printer thermal yang support **SPP (Serial Port Profile)** Bluetooth:
- Epson TM-T20 / TM-T82 / TM-T88
- Star TSP143
- Sewoo LK-P21 / LK-T21
- Xprinter XP-58IIH / XP-80C
- Bixolon SRP-350
- RPP02N (portable)
- Dan semua printer ESC/POS compatible lainnya

---

## 💳 Metode Pembayaran

| Metode      | Icon | Data Disimpan |
|-------------|------|---------------|
| Tunai       | 💵   | Uang diterima, kembalian |
| QRIS        | 📱   | Nomor referensi transaksi |
| Transfer BCA| 🏦   | Nomor referensi transfer |
| EDC BCA     | 💳   | Kode approval, nomor referensi |

### Struk per Metode
- **Tunai**: Menampilkan jumlah bayar + kembalian
- **QRIS**: Tampil QR placeholder + field input kode referensi
- **Transfer**: Info rekening tujuan + field no. referensi
- **EDC BCA**: Instruksi langkah + field kode approval + referensi

---

## 📱 Permission Android

```xml
<!-- Bluetooth Classic (SPP) -->
BLUETOOTH_CONNECT    (Android 12+)
BLUETOOTH_SCAN       (Android 12+)
BLUETOOTH            (Android < 12)
BLUETOOTH_ADMIN      (Android < 12)
ACCESS_FINE_LOCATION (Android < 12, diperlukan untuk BT scan)

<!-- Lainnya -->
INTERNET
ACCESS_NETWORK_STATE
VIBRATE
```

---

## 🔧 Konfigurasi

### Ganti info toko (struk)
Edit `PrinterService.ts` bagian `buildReceiptBytes()`:
```typescript
b.textLine('NAMA TOKO ANDA')
 .textLine('Alamat Toko · Kota')
 .textLine('Telp: 021-XXXXXXXX')
```

### Ganti rekening transfer
Edit `PaymentModal.tsx` bagian `transfer`:
```tsx
<div>🏦 BCA 1234567890</div>
<div>a.n. Nama Toko Anda</div>
```

### Ubah pajak
Edit `DataService.ts`:
```typescript
export const TAX_RATE = 0.1; // 10%
```

### Lebar kertas default
Edit `PrinterPage.tsx`:
```typescript
const [paperWidth, setPaperWidth] = useState<58 | 80>(58);
```

---

## 🗂️ Akun Default

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| kasir1   | kasir123  | Kasir |
| kasir2   | kasir123  | Kasir |

---

## 📝 Catatan Pengembangan

- Data disimpan di **localStorage** browser / WebView
- Gunakan Capacitor **Preferences** plugin untuk production
- Plugin BT membutuhkan device fisik (emulator tidak support BT)
- Mode web/dev: print akan buka jendela browser biasa
- Test plugin: gunakan `npx cap run android --livereload`

---

## 🔑 Plugin Native (Kotlin) — BluetoothPrinterPlugin

```kotlin
// Method yang tersedia dari JavaScript:
BluetoothPrinter.isEnabled()         → { value: boolean }
BluetoothPrinter.requestEnable()     → void
BluetoothPrinter.getPairedDevices()  → { devices: Device[] }
BluetoothPrinter.connect({ address })→ void
BluetoothPrinter.disconnect()        → void
BluetoothPrinter.isConnected()       → { value: boolean }
BluetoothPrinter.print({ data })     → void  // data = base64 ESC/POS bytes
BluetoothPrinter.getConnectedDevice()→ Device | null
```

---

*iKasir v3.0 Pro — Dibuat dengan Ionic + Capacitor + Kotlin*
