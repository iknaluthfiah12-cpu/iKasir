import React, { useState } from 'react';
import {
  IonModal, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { closeOutline, checkmarkCircle } from 'ionicons/icons';
import { CartItem, PaymentMethod, Transaction, DataService, TAX_RATE } from '../../services/DataService';

interface Props {
  isOpen: boolean;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  user: { name: string; id: number };
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'tunai',    label: 'Tunai',         icon: '💵', color: '#1D9E75', bg: '#E1F5EE' },
  { id: 'qris',     label: 'QRIS',          icon: '📱', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'transfer', label: 'Transfer Bank', icon: '🏦', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'edc_bca',  label: 'EDC BCA',       icon: '💳', color: '#BA7517', bg: '#FAEEDA' },
];

const fmt = DataService.formatCurrency;

const PaymentModal: React.FC<Props> = ({
  isOpen, cart, subtotal, tax, total, user, onClose, onSuccess,
}) => {
  const [method, setMethod]         = useState<PaymentMethod>('tunai');
  const [cash, setCash]             = useState('');
  const [referenceNo, setReference] = useState('');
  const [approvalCode, setApproval] = useState('');
  const [loading, setLoading]       = useState(false);

  const kembalian = method === 'tunai' ? (parseFloat(cash) || 0) - total : 0;

  // Referensi & approval sekarang OPSIONAL
  const canConfirm = () => {
    if (method === 'tunai') return parseFloat(cash) >= total;
    return true; // semua metode non-tunai langsung bisa konfirmasi
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const tx: Transaction = {
      id: Date.now(),
      no: DataService.generateInvNo(),
      date: DataService.nowStr(),
      kasir: user.name,
      kasirId: user.id,
      items: cart,
      subtotal, tax, total,
      paymentMethod: method,
      printed: false,
      ...(method === 'tunai' ? { cash: parseFloat(cash), kembalian } : {}),
      ...(referenceNo ? { referenceNo } : {}),
      ...(approvalCode ? { edcApprovalCode: approvalCode } : {}),
    };

    DataService.addTransaction(tx);
    setLoading(false);
    setCash(''); setReference(''); setApproval(''); setMethod('tunai');
    onSuccess(tx);
  };

  const handleClose = () => {
    setCash(''); setReference(''); setApproval(''); setMethod('tunai');
    onClose();
  };

  const quickAmounts = [
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000, 200000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4);

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '2px solid #e8e6df', borderRadius: 12,
    padding: '13px 14px', fontSize: 14, background: '#f8f8f7',
    color: '#2c2c2a', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#1D9E75', '--color': '#fff' }}>
          <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>Proses Pembayaran</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} style={{ '--color': '#fff' }}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8f8f7' }}>
        <div style={{ padding: '16px 16px 40px' }}>

          {/* Order Summary */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 12 }}>RINGKASAN PESANAN</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#444441' }}>
                <span>{item.icon} {item.name} ×{item.qty}</span>
                <span>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #e8e6df', marginTop: 10, paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888780', marginBottom: 4 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888780', marginBottom: 8 }}>
                <span>Pajak 10%</span><span>{fmt(tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 10 }}>METODE PEMBAYARAN</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} onClick={() => { setMethod(m.id); setCash(''); setReference(''); setApproval(''); }} style={{
                  border: `2px solid ${method === m.id ? m.color : '#e8e6df'}`,
                  background: method === m.id ? m.bg : '#fff',
                  borderRadius: 14, padding: '14px 12px',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: method === m.id ? m.color : '#444441' }}>{m.label}</div>
                  {method === m.id && <IonIcon icon={checkmarkCircle} style={{ color: m.color, fontSize: 16, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* TUNAI */}
          {method === 'tunai' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 10 }}>JUMLAH UANG BAYAR</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => setCash(String(a))} style={{
                    background: parseFloat(cash) === a ? '#1D9E75' : '#f0f4f0',
                    color: parseFloat(cash) === a ? '#fff' : '#444441',
                    border: 'none', borderRadius: 8, padding: '6px 12px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{fmt(a)}</button>
                ))}
              </div>
              <input
                type="number" value={cash} onChange={e => setCash(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, fontSize: 22, fontWeight: 800, textAlign: 'right' }}
              />
              {cash && (
                <div style={{
                  marginTop: 12, padding: '12px 14px', borderRadius: 12,
                  background: kembalian >= 0 ? '#E1F5EE' : '#FCEBEB',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: kembalian >= 0 ? '#0F6E56' : '#E24B4A' }}>
                    {kembalian >= 0 ? 'Kembalian' : 'Kurang'}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: kembalian >= 0 ? '#1D9E75' : '#E24B4A' }}>
                    {fmt(Math.abs(kembalian))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* QRIS */}
          {method === 'qris' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 160, height: 160, margin: '0 auto',
                  background: '#EDE9FE', borderRadius: 16,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed #7C3AED',
                }}>
                  <div style={{ fontSize: 48 }}>📱</div>
                  <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginTop: 6 }}>Scan QRIS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED' }}>{fmt(total)}</div>
                </div>
                <div style={{ fontSize: 12, color: '#888780', marginTop: 10 }}>Scan menggunakan aplikasi e-wallet manapun</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                NOMOR REFERENSI <span style={{ color: '#d3d1c7', fontWeight: 400 }}>(opsional)</span>
              </div>
              <input value={referenceNo} onChange={e => setReference(e.target.value)}
                placeholder="Kode transaksi dari QRIS" style={inputStyle} />
            </div>
          )}

          {/* TRANSFER */}
          {method === 'transfer' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #185FA5' }}>
                <div style={{ fontSize: 11, color: '#185FA5', fontWeight: 600, marginBottom: 6 }}>TRANSFER KE REKENING</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2c2c2a' }}>🏦 BCA 1234567890</div>
                <div style={{ fontSize: 13, color: '#185FA5', marginTop: 4 }}>a.n. Toko Serba Ada</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1D9E75', marginTop: 8 }}>Jumlah: {fmt(total)}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                NOMOR REFERENSI <span style={{ color: '#d3d1c7', fontWeight: 400 }}>(opsional)</span>
              </div>
              <input value={referenceNo} onChange={e => setReference(e.target.value)}
                placeholder="No. referensi transfer" style={inputStyle} />
            </div>
          )}

          {/* EDC BCA */}
          {method === 'edc_bca' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #BA7517', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 40 }}>💳</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#BA7517' }}>EDC BCA · Debit / Kredit / Tap</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2c2c2a', marginTop: 4 }}>{fmt(total)}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#888780', marginBottom: 14, lineHeight: 1.8 }}>
                1. Masukkan atau tap kartu pada mesin EDC<br/>
                2. Minta customer masukkan PIN<br/>
                3. Catat kode approval dari struk EDC (opsional)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                KODE APPROVAL <span style={{ color: '#d3d1c7', fontWeight: 400 }}>(opsional)</span>
              </div>
              <input value={approvalCode} onChange={e => setApproval(e.target.value.toUpperCase())}
                placeholder="Contoh: 123456"
                style={{ ...inputStyle, fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                NOMOR REFERENSI <span style={{ color: '#d3d1c7', fontWeight: 400 }}>(opsional)</span>
              </div>
              <input value={referenceNo} onChange={e => setReference(e.target.value)}
                placeholder="No referensi dari struk EDC" style={inputStyle} />
            </div>
          )}

          {/* Confirm Button */}
          <button onClick={handleConfirm} disabled={!canConfirm() || loading} style={{
            width: '100%',
            background: canConfirm() ? '#1D9E75' : '#d3d1c7',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 16, fontWeight: 800,
            cursor: canConfirm() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s',
          }}>
            {loading ? (
              <>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Memproses...
              </>
            ) : `✅ Konfirmasi Pembayaran · ${fmt(total)}`}
          </button>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </IonContent>
    </IonModal>
  );
};

export default PaymentModal;