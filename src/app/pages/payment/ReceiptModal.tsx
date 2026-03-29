import React, { useState } from 'react';
import {
  IonModal, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonToast,
} from '@ionic/react';
import { closeOutline, printOutline } from 'ionicons/icons';
import { Transaction, DataService } from '../../services/DataService';
import { PrinterService } from '../../services/PrinterService';

interface Props {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const fmt = DataService.formatCurrency;

const PAY_LABEL: Record<string, string> = {
  tunai:    '💵 Tunai',
  qris:     '📱 QRIS',
  transfer: '🏦 Transfer Bank',
  edc_bca:  '💳 EDC BCA',
};

const ReceiptModal: React.FC<Props> = ({ isOpen, transaction: tx, onClose }) => {
  const [printing, setPrinting]     = useState(false);
  const [toast, setToast]           = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const handlePrint = async () => {
    if (!tx) return;
    setPrinting(true);
    try {
      const ok = await PrinterService.printReceipt(tx);
      if (ok) {
        setToastColor('success');
        setToast('✅ Struk berhasil dicetak!');
      } else {
        setToastColor('danger');
        setToast('❌ Gagal mencetak. Cek koneksi printer.');
      }
    } catch (e) {
      setToastColor('danger');
      setToast('❌ Error: ' + String(e));
    }
    setPrinting(false);
  };

  return (
    <>
      {/* Hapus initialBreakpoint & breakpoints — pakai fullscreen biasa */}
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#1D9E75', '--color': '#fff' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>Struk Transaksi</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose} style={{ '--color': '#fff' }}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8f8f7' }}>
          {tx && (
            <div style={{ padding: '16px 16px 40px' }}>

              {/* Receipt Paper */}
              <div style={{
                background: '#fff', borderRadius: 16, padding: '20px 16px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: '#1D9E75',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: -0.5,
                  }}>iKASIR</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>Toko Serba Ada · Jakarta</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>{tx.date}</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>No: {tx.no}</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>Kasir: {tx.kasir}</div>
                  <div style={{
                    display: 'inline-block', marginTop: 6,
                    background: '#f0f4f0', borderRadius: 6,
                    padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#444441',
                  }}>
                    {PAY_LABEL[tx.paymentMethod] ?? tx.paymentMethod}
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #d3d1c7', marginBottom: 12 }} />

                {/* Items */}
                {tx.items.map(item => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#2c2c2a' }}>{item.icon} {item.name}</span>
                      <span style={{ color: '#2c2c2a', fontWeight: 600 }}>{fmt(item.price * item.qty)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#888780', paddingLeft: 4 }}>
                      {item.qty} × {fmt(item.price)}
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px dashed #d3d1c7', margin: '10px 0' }} />

                {/* Subtotal & Tax */}
                {[['Subtotal', fmt(tx.subtotal)], ['Pajak 10%', fmt(tx.tax)]].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, marginBottom: 5, color: '#888780',
                  }}>
                    <span>{label}</span><span>{value}</span>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 18, fontWeight: 800, color: '#1D9E75',
                  borderTop: '2px solid #e8e6df', paddingTop: 10, marginTop: 6,
                }}>
                  <span>TOTAL</span><span>{fmt(tx.total)}</span>
                </div>

                <div style={{ borderTop: '1px dashed #d3d1c7', margin: '10px 0' }} />

                {/* Payment detail */}
                {tx.paymentMethod === 'tunai' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#444441', marginBottom: 5 }}>
                      <span>Tunai</span><span>{fmt(tx.cash ?? 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#1D9E75' }}>
                      <span>Kembalian</span><span>{fmt(tx.kembalian ?? 0)}</span>
                    </div>
                  </>
                )}
                {tx.paymentMethod === 'qris' && (
                  <div style={{ fontSize: 12, color: '#7C3AED' }}>QRIS Ref: {tx.referenceNo ?? '-'}</div>
                )}
                {tx.paymentMethod === 'transfer' && (
                  <div style={{ fontSize: 12, color: '#185FA5' }}>Transfer Ref: {tx.referenceNo ?? '-'}</div>
                )}
                {tx.paymentMethod === 'edc_bca' && (
                  <>
                    <div style={{ fontSize: 12, color: '#BA7517' }}>Approval: {tx.edcApprovalCode ?? '-'}</div>
                    <div style={{ fontSize: 12, color: '#BA7517' }}>Ref: {tx.referenceNo ?? '-'}</div>
                  </>
                )}

                <div style={{ borderTop: '1px dashed #d3d1c7', margin: '12px 0' }} />
                <div style={{ textAlign: 'center', fontSize: 11, color: '#888780' }}>
                  Terima kasih atas kunjungan Anda! 🙏
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  style={{
                    flex: 1, background: '#fff', color: '#1D9E75',
                    border: '2px solid #1D9E75', borderRadius: 12,
                    padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {printing ? (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px solid #1D9E7544', borderTopColor: '#1D9E75',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  ) : (
                    <IonIcon icon={printOutline} style={{ fontSize: 18 }} />
                  )}
                  {printing ? 'Mencetak...' : 'Cetak Struk'}
                </button>

                <button
                  onClick={onClose}
                  style={{
                    flex: 1, background: '#1D9E75', color: '#fff',
                    border: 'none', borderRadius: 12,
                    padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ✅ Selesai
                </button>
              </div>
            </div>
          )}

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={3000}
        color={toastColor}
        onDidDismiss={() => setToast('')}
        position="bottom"
      />
    </>
  );
};

export default ReceiptModal;
