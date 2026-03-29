import React, { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/react';
import { DataService, Transaction } from '../../services/DataService';

const fmt = DataService.formatCurrency;
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

const PAY_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tunai:    { label: 'Tunai',    color: '#1D9E75', bg: '#E1F5EE', icon: '💵' },
  qris:     { label: 'QRIS',    color: '#7C3AED', bg: '#EDE9FE', icon: '📱' },
  transfer: { label: 'Transfer', color: '#185FA5', bg: '#E6F1FB', icon: '🏦' },
  edc_bca:  { label: 'EDC BCA', color: '#BA7517', bg: '#FAEEDA', icon: '💳' },
};

const ReportPage: React.FC = () => {
  const now = new Date();
  const [tab, setTab]         = useState('ringkasan');
  const [selMonth, setMonth]  = useState(now.getMonth());
  const [selYear, setYear]    = useState(now.getFullYear());

  const allTx: Transaction[] = DataService.getHistory();

  const monthTx = useMemo(() =>
    allTx.filter(tx => {
      const d = new Date(tx.id);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }),
    [allTx, selMonth, selYear]
  );

  const revenue   = monthTx.reduce((a, t) => a + t.total, 0);
  const taxTotal  = monthTx.reduce((a, t) => a + t.tax, 0);
  const netRevenue = revenue - taxTotal;

  // Payment breakdown
  const payBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    monthTx.forEach(tx => {
      if (!map[tx.paymentMethod]) map[tx.paymentMethod] = { count: 0, total: 0 };
      map[tx.paymentMethod].count++;
      map[tx.paymentMethod].total += tx.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [monthTx]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.forEach(tx => tx.items.forEach(item => {
      map[item.name] = (map[item.name] ?? 0) + item.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [monthTx]);

  // Per kasir
  const kasirData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    monthTx.forEach(tx => {
      if (!map[tx.kasir]) map[tx.kasir] = { count: 0, total: 0 };
      map[tx.kasir].count++;
      map[tx.kasir].total += tx.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [monthTx]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>📊 Laporan</IonTitle>
        </IonToolbar>

        {/* Month/Year selector */}
        <div style={{
          background: '#1D9E75', padding: '8px 16px 12px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <select
            value={selMonth}
            onChange={e => setMonth(Number(e.target.value))}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
              padding: '8px 12px', fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i} style={{ color: '#2c2c2a' }}>{m}</option>)}
          </select>
          <select
            value={selYear}
            onChange={e => setYear(Number(e.target.value))}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
              padding: '8px 12px', fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ color: '#2c2c2a' }}>{y}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e6df' }}>
          <IonSegment
            value={tab}
            onIonChange={e => setTab(e.detail.value as string)}
            style={{ '--background': 'transparent', padding: '6px 12px' }}
          >
            {[
              { value: 'ringkasan', label: 'Ringkasan' },
              { value: 'pembayaran', label: 'Pembayaran' },
              { value: 'produk', label: 'Produk' },
              { value: 'kasir', label: 'Kasir' },
            ].map(t => (
              <IonSegmentButton
                key={t.value}
                value={t.value}
                style={{ '--color-checked': '#1D9E75', '--indicator-color': '#1D9E75', fontSize: 12 }}
              >
                <IonLabel style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </div>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 12 }}>

          {/* ── Ringkasan ──────────────────────────────────────────────────── */}
          {tab === 'ringkasan' && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                borderRadius: 18, padding: '20px', marginBottom: 14, color: '#fff',
              }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Total Pendapatan — {MONTHS[selMonth]} {selYear}</div>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>{fmt(revenue)}</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Transaksi</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{monthTx.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Pajak</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(taxTotal)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Net</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(netRevenue)}</div>
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>TRANSAKSI TERAKHIR</div>
                {monthTx.slice(0, 8).map(tx => {
                  const ps = PAY_STYLE[tx.paymentMethod] ?? PAY_STYLE.tunai;
                  return (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{ps.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>{tx.no}</div>
                          <div style={{ fontSize: 11, color: '#888780' }}>{tx.kasir}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75' }}>{fmt(tx.total)}</span>
                    </div>
                  );
                })}
                {monthTx.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 20, fontSize: 13 }}>Belum ada transaksi bulan ini</div>}
              </div>
            </>
          )}

          {/* ── Pembayaran ─────────────────────────────────────────────────── */}
          {tab === 'pembayaran' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 16 }}>BREAKDOWN METODE PEMBAYARAN</div>
              {payBreakdown.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 20, fontSize: 13 }}>Belum ada data</div>}
              {payBreakdown.map(([method, data]) => {
                const ps = PAY_STYLE[method] ?? PAY_STYLE.tunai;
                const pct = revenue > 0 ? (data.total / revenue * 100) : 0;
                return (
                  <div key={method} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{ps.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{ps.label}</div>
                        <div style={{ fontSize: 12, color: '#888780' }}>{data.count} transaksi</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: ps.color }}>{fmt(data.total)}</div>
                        <div style={{ fontSize: 11, color: '#888780' }}>{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#f0f4f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: ps.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Produk ─────────────────────────────────────────────────────── */}
          {tab === 'produk' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 16 }}>PRODUK TERLARIS</div>
              {topProducts.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 20, fontSize: 13 }}>Belum ada data</div>}
              {topProducts.map(([name, qty], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#1D9E75',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: '#2c2c2a', fontWeight: 600 }}>{name}</div>
                  <div style={{
                    background: '#E1F5EE', color: '#1D9E75',
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                  }}>
                    {qty} terjual
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Kasir ──────────────────────────────────────────────────────── */}
          {tab === 'kasir' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 16 }}>PERFORMA KASIR</div>
              {kasirData.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 20, fontSize: 13 }}>Belum ada data</div>}
              {kasirData.map(([name, data], i) => {
                const pct = revenue > 0 ? (data.total / revenue * 100) : 0;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={name} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 26 }}>{medals[i] ?? '👤'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2a' }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#888780' }}>{data.count} transaksi</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1D9E75' }}>{fmt(data.total)}</div>
                        <div style={{ fontSize: 11, color: '#888780' }}>{pct.toFixed(1)}% total</div>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#f0f4f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'linear-gradient(to right, #1D9E75, #9FE1CB)',
                        borderRadius: 99, transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportPage;
