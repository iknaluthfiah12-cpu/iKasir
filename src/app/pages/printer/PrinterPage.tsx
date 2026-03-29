import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonToast, IonSpinner,
} from '@ionic/react';
import {
  bluetoothOutline, checkmarkCircleOutline, closeCircleOutline,
  refreshOutline, printOutline, settingsOutline,
} from 'ionicons/icons';
import { PrinterService } from '../../services/PrinterService';
import { DataService, PrinterDevice } from '../../services/DataService';

const PrinterPage: React.FC = () => {
  const [btEnabled, setBtEnabled]       = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [devices, setDevices]           = useState<any[]>([]);
  const [connected, setConnected]       = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [connecting, setConnecting]     = useState<string | null>(null);
  const [paperWidth, setPaperWidth]     = useState<58 | 80>(58);
  const [toast, setToast]               = useState('');
  const [toastColor, setToastColor]     = useState<'success' | 'danger' | 'warning'>('success');
  const [isNative]                      = useState(() => PrinterService.isNative());

  useEffect(() => {
    checkStatus();
    const saved = DataService.getSavedPrinter();
    if (saved) setConnectedDevice(saved);
  }, []);

  const checkStatus = async () => {
    const enabled = await PrinterService.isBluetoothEnabled();
    setBtEnabled(enabled);
    const isConn = await PrinterService.isConnected();
    setConnected(isConn);
  };

  const handleEnableBluetooth = async () => {
    await PrinterService.requestBluetoothEnable();
    await checkStatus();
  };

  const handleScan = async () => {
    if (!btEnabled) {
      setToastColor('warning');
      setToast('⚠️ Aktifkan Bluetooth terlebih dahulu');
      return;
    }
    setScanning(true);
    setDevices([]);
    await new Promise(r => setTimeout(r, 500));
    const paired = await PrinterService.getPairedDevices();
    // Filter to show likely printers (names containing common printer keywords)
    const printerKeywords = ['printer', 'print', 'pos', 'thermal', 'bt', 'rpp', 'mtp', 'btp', 'xp', 'epson', 'star', 'sewoo', 'bixolon'];
    const sorted = [...paired].sort((a, b) => {
      const aIsPrinter = printerKeywords.some(k => a.name.toLowerCase().includes(k));
      const bIsPrinter = printerKeywords.some(k => b.name.toLowerCase().includes(k));
      return (bIsPrinter ? 1 : 0) - (aIsPrinter ? 1 : 0);
    });
    setDevices(sorted);
    setScanning(false);
    if (sorted.length === 0) {
      setToastColor('warning');
      setToast('Tidak ada perangkat Bluetooth yang dipasangkan');
    }
  };

  const handleConnect = async (device: any) => {
    setConnecting(device.address);
    const ok = await PrinterService.connect(device.address);
    setConnecting(null);
    if (ok) {
      const pd: PrinterDevice = { deviceId: device.address, name: device.name, address: device.address };
      setConnectedDevice(pd);
      DataService.savePrinter(pd);
      setConnected(true);
      setToastColor('success');
      setToast(`✅ Terhubung ke ${device.name}`);
    } else {
      setToastColor('danger');
      setToast(`❌ Gagal terhubung ke ${device.name}`);
    }
  };

  const handleDisconnect = async () => {
    await PrinterService.disconnect();
    setConnected(false);
    setConnectedDevice(null);
    DataService.savePrinter(null);
    setToastColor('warning');
    setToast('Printer terputus');
  };

  const handleTestPrint = async () => {
    const testTx = {
      id: 0, no: 'TEST-001',
      date: DataService.nowStr(),
      kasir: 'Test', kasirId: 0,
      items: [
        { id: 1, name: 'Test Item A', price: 15000, qty: 2, cat: '-', icon: '✓', stock: 99 },
        { id: 2, name: 'Test Item B', price: 8000, qty: 1, cat: '-', icon: '✓', stock: 99 },
      ],
      subtotal: 38000, tax: 3800, total: 41800,
      paymentMethod: 'tunai' as const,
      cash: 50000, kembalian: 8200, printed: false,
    };
    const ok = await PrinterService.printReceipt(testTx, paperWidth);
    if (ok) {
      setToastColor('success');
      setToast('✅ Test print berhasil!');
    } else {
      setToastColor('danger');
      setToast('❌ Gagal test print');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>🖨️ Pengaturan Printer</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 16 }}>

          {/* Platform notice */}
          {!isNative && (
            <div style={{
              background: '#FAEEDA', border: '1px solid #BA7517', borderRadius: 14,
              padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#BA7517',
            }}>
              ⚠️ <strong>Mode Web/Dev</strong> — Cetak akan membuka jendela print browser.
              Plugin Bluetooth aktif di build Android.
            </div>
          )}

          {/* Bluetooth status */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>
              STATUS BLUETOOTH
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: btEnabled ? '#E1F5EE' : '#f0f4f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IonIcon
                  icon={bluetoothOutline}
                  style={{ fontSize: 24, color: btEnabled ? '#1D9E75' : '#888780' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2a' }}>
                  Bluetooth {btEnabled ? 'Aktif' : 'Tidak Aktif'}
                </div>
                <div style={{ fontSize: 12, color: '#888780' }}>
                  {btEnabled ? 'Siap mencari printer' : 'Aktifkan untuk menghubungkan printer'}
                </div>
              </div>
              {!btEnabled && (
                <button
                  onClick={handleEnableBluetooth}
                  style={{
                    background: '#1D9E75', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '8px 14px', fontSize: 13,
                    fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Aktifkan
                </button>
              )}
            </div>
          </div>

          {/* Connected printer */}
          {connected && connectedDevice && (
            <div style={{
              background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
              borderRadius: 16, padding: 18, marginBottom: 14, color: '#fff',
            }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>PRINTER TERHUBUNG</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 36 }}>🖨️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{connectedDevice.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                    {connectedDevice.address} · {paperWidth}mm
                  </div>
                </div>
                <div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    ● Online
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={handleTestPrint}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10,
                    padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  🖨️ Test Print
                </button>
                <button
                  onClick={handleDisconnect}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.15)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
                    padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Putuskan
                </button>
              </div>
            </div>
          )}

          {/* Paper width setting */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>
              LEBAR KERTAS
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {([58, 80] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setPaperWidth(w)}
                  style={{
                    flex: 1, padding: '14px',
                    background: paperWidth === w ? '#E1F5EE' : '#f8f8f7',
                    border: `2px solid ${paperWidth === w ? '#1D9E75' : '#e8e6df'}`,
                    borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>
                    {w === 58 ? '📄' : '📋'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: paperWidth === w ? '#1D9E75' : '#2c2c2a' }}>
                    {w}mm
                  </div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                    {w === 58 ? '32 karakter' : '48 karakter'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scan for devices */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888780' }}>
                PERANGKAT TERSEDIA
              </div>
              <button
                onClick={handleScan}
                disabled={scanning}
                style={{
                  background: '#1D9E75', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '8px 14px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 6,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  opacity: scanning ? 0.7 : 1,
                }}
              >
                {scanning ? (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <IonIcon icon={refreshOutline} style={{ fontSize: 16 }} />
                )}
                {scanning ? 'Mencari...' : 'Scan'}
              </button>
            </div>

            {devices.length === 0 && !scanning && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#888780', fontSize: 13 }}>
                Tekan Scan untuk mencari printer Bluetooth yang sudah dipasangkan
              </div>
            )}

            {devices.map(device => {
              const isThis = connectedDevice?.address === device.address;
              const isConn = connecting === device.address;
              return (
                <div
                  key={device.address}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid #f0f4f0',
                  }}
                >
                  <div style={{ fontSize: 28 }}>🖨️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>
                      {device.name || 'Unknown Device'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888780', fontFamily: "'JetBrains Mono', monospace" }}>
                      {device.address}
                    </div>
                  </div>
                  {isThis && connected ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px',
                      borderRadius: 99, background: '#E1F5EE', color: '#1D9E75',
                    }}>
                      ✓ Terhubung
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(device)}
                      disabled={!!connecting}
                      style={{
                        background: '#1D9E75', color: '#fff', border: 'none',
                        borderRadius: 10, padding: '8px 14px', fontSize: 12,
                        fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        opacity: connecting ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {isConn ? (
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff', animation: 'spin 0.7s linear infinite',
                        }} />
                      ) : null}
                      {isConn ? 'Menghubungkan...' : 'Hubungkan'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div style={{
            background: '#E6F1FB', borderRadius: 14, padding: '14px 16px',
            fontSize: 12, color: '#185FA5', lineHeight: 1.7,
          }}>
            <strong>ℹ️ Cara menghubungkan printer ESC/POS:</strong><br/>
            1. Nyalakan printer Bluetooth (58mm / 80mm)<br/>
            2. Pasangkan di Pengaturan Bluetooth Android<br/>
            3. Buka halaman ini → tekan Scan<br/>
            4. Pilih printer dari daftar<br/>
            5. Tes dengan tombol "Test Print"
          </div>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </IonContent>

      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={3000}
        color={toastColor}
        position="bottom"
        onDidDismiss={() => setToast('')}
      />
    </IonPage>
  );
};

export default PrinterPage;
