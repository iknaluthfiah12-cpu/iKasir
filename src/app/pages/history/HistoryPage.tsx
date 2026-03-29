import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonRefresher,
  IonRefresherContent, IonToast,
} from '@ionic/react';
import { printOutline, timeOutline, cardOutline } from 'ionicons/icons';
import { DataService, Transaction } from '../../services/DataService';
import { PrinterService } from '../../services/PrinterService';
import ReceiptModal from '../payment/ReceiptModal';

const fmt = DataService.formatCurrency;

const PAY_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tunai:    { label: 'Tunai',    color: '#1D9E75', bg: '#E1F5EE', icon: '💵' },
  qris:     { label: 'QRIS',    color: '#7C3AED', bg: '#EDE9FE', icon: '📱' },
  transfer: { label: 'Transfer', color: '#185FA5', bg: '#E6F1FB', icon: '🏦' },
  edc_bca:  { label: 'EDC BCA', color: '#BA7517', bg: '#FAEEDA', icon: '💳' },
};

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>(() => DataService.getHistory());
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<string>('semua');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [toast, setToast]     = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const refreshHistory = () => setHistory(DataService.getHistory());

  const filtered = history.filter(tx => {
    const matchSearch = tx.no.toLowerCase().includes(search.toLowerCase()) ||
      tx.kasir.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'semua' || tx.paymentMethod === filter;
    return matchSearch && matchFilter;
  });

  const handlePrint = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await PrinterService.printReceipt(tx);
    if (ok) {
      setToastColor('success');
      setToast('✅ Struk dicetak!');
    } else {
      setToastColor('danger');
      setToast('❌ Printer tidak terhubung');
    }
  };

  const doRefresh = (e: CustomEvent) => {
    refreshHistory();
    setTimeout(() => (e.target as HTMLIonRefresherElement).complete(), 500);
  };

  const totalHari = history
    .filter(tx => tx.date.includes(new Date().toLocaleDateString('id-ID', { weekday: 'short' })))
    .reduce((a, tx) => a + tx.total, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>🧾 Riwayat</IonTitle>
        </IonToolbar>
        <IonToolbar style={{ '--background': '#1D9E75', '--border-width': 0, padding: '0 12px 10px' }}>
          <IonSearchbar
            value={search}
            onIonInput={e => setSearch(e.detail.value ?? '')}
            placeholder="Cari nomor / kasir..."
            style={{ '--background': '#fff', '--border-radius': '12px', '--box-shadow': 'none' }}
            showCancelButton="never"
          />
        </IonToolbar>

        {/* Filter chips */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e8e6df',
          display: 'flex', overflowX: 'auto', padding: '10px 12px',
          gap: 8, scrollbarWidth: 'none',
        }}>
          {['semua', 'tunai', 'qris', 'transfer', 'edc_bca'].map(f => (
            <IonChip
              key={f}
              onClick={() => setFilter(f)}
              style={{
                '--background': filter === f ? '#1D9E75' : '#f0f4f0',
                '--color': filter === f ? '#fff' : '#444441',
                flexShrink: 0, fontWeight: 600, fontSize: 12,
              }}
            >
              <IonLabel>
                {f === 'semua' ? 'Semua'
                  : f === 'tunai' ? '💵 Tunai'
                  : f === 'qris' ? '📱 QRIS'
                  : f === 'transfer' ? '🏦 Transfer'
                  : '💳 EDC BCA'}
              </IonLabel>
            </IonChip>
          ))}
        </div>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: 12 }}>
          {/* Summary card */}
          <div style={{
            background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
            borderRadius: 18, padding: '18px 20px', marginBottom: 14,
            color: '#fff',
          }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total {history.length} transaksi</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              {fmt(history.reduce((a, t) => a + t.total, 0))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {Object.entries(PAY_STYLE).map(([k, v]) => {
                const count = history.filter(t => t.paymentMethod === k).length;
                if (!count) return null;
                return (
                  <div key={k} style={{ fontSize: 12, opacity: 0.9 }}>
                    {v.icon} {count}x
                  </div>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>
              <div style={{ fontSize: 40 }}>🧾</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>Belum ada transaksi</div>
            </div>
          ) : (
            filtered.map(tx => {
              const ps = PAY_STYLE[tx.paymentMethod] ?? PAY_STYLE.tunai;
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  style={{
                    background: '#fff', borderRadius: 14, padding: '14px 16px',
                    marginBottom: 10, cursor: 'pointer',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  {/* Method icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: ps.bg, fontSize: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {ps.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>{tx.no}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1D9E75' }}>{fmt(tx.total)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#888780' }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: 11, verticalAlign: 'middle', marginRight: 3 }} />
                        {tx.kasir} · {tx.items.length} item
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 99, background: ps.bg, color: ps.color,
                        }}>
                          {ps.label}
                        </span>
                        <button
                          onClick={(e) => handlePrint(tx, e)}
                          style={{
                            background: '#f0f4f0', border: 'none', borderRadius: 8,
                            width: 28, height: 28, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer',
                          }}
                        >
                          <IonIcon icon={printOutline} style={{ fontSize: 14, color: '#1D9E75' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </IonContent>

      <ReceiptModal
        isOpen={!!selected}
        transaction={selected}
        onClose={() => setSelected(null)}
      />

      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={2500}
        color={toastColor}
        position="bottom"
        onDidDismiss={() => setToast('')}
      />
    </IonPage>
  );
};

export default HistoryPage;
