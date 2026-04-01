import React, { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/react';
import { DataService, Transaction } from '../../services/DataService';

const fmt = DataService.formatCurrency;
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const DAYS   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const PAY_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tunai:    { label: 'Tunai',    color: '#1D9E75', bg: '#E1F5EE', icon: '💵' },
  qris:     { label: 'QRIS',    color: '#7C3AED', bg: '#EDE9FE', icon: '📱' },
  transfer: { label: 'Transfer', color: '#185FA5', bg: '#E6F1FB', icon: '🏦' },
  edc_bca:  { label: 'EDC BCA', color: '#BA7517', bg: '#FAEEDA', icon: '💳' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateShort(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
const ReportPage: React.FC = () => {
  const now = new Date();
  const [tab, setTab]         = useState('harian');
  const [selMonth, setMonth]  = useState(now.getMonth());
  const [selYear, setYear]    = useState(now.getFullYear());
  const [selDate, setSelDate] = useState(startOfDay(now));
  const [weekOffset, setWeekOffset] = useState(0); // 0 = minggu ini, -1 = minggu lalu, dst

  const allTx: Transaction[] = DataService.getHistory();

  // ── Filter per periode ────────────────────────────────────────────────────
  const dailyTx = useMemo(() => {
    return allTx.filter(tx => sameDay(new Date(tx.id), selDate));
  }, [allTx, selDate]);

  const weekStart = useMemo(() => {
    const base = startOfWeek(now);
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weeklyTx = useMemo(() => {
    return allTx.filter(tx => {
      const d = new Date(tx.id);
      return d >= weekStart && d <= addDays(weekEnd, 1);
    });
  }, [allTx, weekStart, weekEnd]);

  const monthTx = useMemo(() =>
    allTx.filter(tx => {
      const d = new Date(tx.id);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }),
    [allTx, selMonth, selYear]
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = (txList: Transaction[]) => ({
    revenue: txList.reduce((a, t) => a + t.total, 0),
    tax: txList.reduce((a, t) => a + t.tax, 0),
    count: txList.length,
    net: txList.reduce((a, t) => a + t.total - t.tax, 0),
  });

  const dailyStats  = stats(dailyTx);
  const weeklyStats = stats(weeklyTx);
  const monthStats  = stats(monthTx);

  // ── Daily chart data (per jam) ─────────────────────────────────────────────
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0, count: 0 }));
    dailyTx.forEach(tx => {
      const h = new Date(tx.id).getHours();
      hours[h].total += tx.total;
      hours[h].count++;
    });
    return hours.filter(h => h.hour >= 7 && h.hour <= 22);
  }, [dailyTx]);

  // ── Weekly chart data (per hari) ──────────────────────────────────────────
  const weeklyDayData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const txs = weeklyTx.filter(tx => sameDay(new Date(tx.id), day));
      return {
        day,
        label: DAYS[day.getDay()],
        dateLabel: formatDateShort(day),
        total: txs.reduce((a, t) => a + t.total, 0),
        count: txs.length,
        isToday: sameDay(day, now),
      };
    });
  }, [weeklyTx, weekStart]);

  // ── Payment breakdown ─────────────────────────────────────────────────────
  const payBreakdown = (txList: Transaction[]) => {
    const map: Record<string, { count: number; total: number }> = {};
    txList.forEach(tx => {
      if (!map[tx.paymentMethod]) map[tx.paymentMethod] = { count: 0, total: 0 };
      map[tx.paymentMethod].count++;
      map[tx.paymentMethod].total += tx.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  };

  // ── Top products ──────────────────────────────────────────────────────────
  const topProducts = (txList: Transaction[]) => {
    const map: Record<string, number> = {};
    txList.forEach(tx => tx.items.forEach(item => {
      map[item.name] = (map[item.name] ?? 0) + item.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  // ── Kasir performance ─────────────────────────────────────────────────────
  const kasirData = (txList: Transaction[]) => {
    const map: Record<string, { count: number; total: number }> = {};
    txList.forEach(tx => {
      if (!map[tx.kasir]) map[tx.kasir] = { count: 0, total: 0 };
      map[tx.kasir].count++;
      map[tx.kasir].total += tx.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  };

  // ── Sub-components ────────────────────────────────────────────────────────
  const StatCard = ({ txList, label }: { txList: Transaction[]; label: string }) => {
    const s = stats(txList);
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
        borderRadius: 18, padding: '20px', marginBottom: 14, color: '#fff',
      }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Total Pendapatan — {label}</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>{fmt(s.revenue)}</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Transaksi</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.count}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Pajak</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(s.tax)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Net</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(s.net)}</div>
          </div>
        </div>
      </div>
    );
  };

  const PayBreakdownCard = ({ txList }: { txList: Transaction[] }) => {
    const pb = payBreakdown(txList);
    const rev = stats(txList).revenue;
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>METODE PEMBAYARAN</div>
        {pb.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 16, fontSize: 13 }}>Belum ada data</div>}
        {pb.map(([method, data]) => {
          const ps = PAY_STYLE[method] ?? PAY_STYLE.tunai;
          const pct = rev > 0 ? (data.total / rev * 100) : 0;
          return (
            <div key={method} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{ps.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>{ps.label}</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>{data.count} transaksi</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: ps.color }}>{fmt(data.total)}</div>
                  <div style={{ fontSize: 10, color: '#888780' }}>{pct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{ height: 6, background: '#f0f4f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: ps.color, borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const TopProductsCard = ({ txList }: { txList: Transaction[] }) => {
    const tp = topProducts(txList);
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>PRODUK TERLARIS</div>
        {tp.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 16, fontSize: 13 }}>Belum ada data</div>}
        {tp.map(([name, qty], i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: '#E1F5EE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#1D9E75',
            }}>{i + 1}</div>
            <div style={{ flex: 1, fontSize: 13, color: '#2c2c2a', fontWeight: 600 }}>{name}</div>
            <div style={{ background: '#E1F5EE', color: '#1D9E75', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
              {qty} terjual
            </div>
          </div>
        ))}
      </div>
    );
  };

  const KasirCard = ({ txList }: { txList: Transaction[] }) => {
    const kd = kasirData(txList);
    const rev = stats(txList).revenue;
    const medals = ['🥇', '🥈', '🥉'];
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>PERFORMA KASIR</div>
        {kd.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 16, fontSize: 13 }}>Belum ada data</div>}
        {kd.map(([name, data], i) => {
          const pct = rev > 0 ? (data.total / rev * 100) : 0;
          return (
            <div key={name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 22 }}>{medals[i] ?? '👤'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>{data.count} transaksi</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>{fmt(data.total)}</div>
                  <div style={{ fontSize: 10, color: '#888780' }}>{pct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{ height: 6, background: '#f0f4f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(to right, #1D9E75, #9FE1CB)', borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const RecentTxCard = ({ txList }: { txList: Transaction[] }) => (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>TRANSAKSI TERAKHIR</div>
      {txList.slice(0, 6).map(tx => {
        const ps = PAY_STYLE[tx.paymentMethod] ?? PAY_STYLE.tunai;
        return (
          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ps.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>{tx.no}</div>
                <div style={{ fontSize: 11, color: '#888780' }}>{tx.kasir} · {new Date(tx.id).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>{fmt(tx.total)}</span>
          </div>
        );
      })}
      {txList.length === 0 && <div style={{ textAlign: 'center', color: '#888780', padding: 16, fontSize: 13 }}>Belum ada transaksi</div>}
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>📊 Laporan</IonTitle>
        </IonToolbar>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e6df' }}>
          <IonSegment
            value={tab}
            onIonChange={e => setTab(e.detail.value as string)}
            style={{ '--background': 'transparent', padding: '6px 8px' }}
          >
            {[
              { value: 'harian', label: 'Harian' },
              { value: 'mingguan', label: 'Mingguan' },
              { value: 'bulanan', label: 'Bulanan' },
            ].map(t => (
              <IonSegmentButton key={t.value} value={t.value}
                style={{ '--color-checked': '#1D9E75', '--indicator-color': '#1D9E75' }}>
                <IonLabel style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </div>

        {/* Period Selector */}
        {tab === 'harian' && (
          <div style={{ background: '#1D9E75', padding: '8px 16px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setSelDate(addDays(selDate, -1))}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
            >‹</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {sameDay(selDate, now) ? '📅 Hari Ini' : formatDate(selDate)}
            </div>
            <button
              onClick={() => setSelDate(addDays(selDate, 1))}
              disabled={sameDay(selDate, now)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 16, opacity: sameDay(selDate, now) ? 0.4 : 1 }}
            >›</button>
          </div>
        )}

        {tab === 'mingguan' && (
          <div style={{ background: '#1D9E75', padding: '8px 16px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
            >‹</button>
            <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              {weekOffset === 0 ? '📅 Minggu Ini' : weekOffset === -1 ? 'Minggu Lalu' : `${formatDateShort(weekStart)} – ${formatDateShort(weekEnd)}`}
            </div>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 16, opacity: weekOffset >= 0 ? 0.4 : 1 }}
            >›</button>
          </div>
        )}

        {tab === 'bulanan' && (
          <div style={{ background: '#1D9E75', padding: '8px 16px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={selMonth} onChange={e => setMonth(Number(e.target.value))} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {MONTHS.map((m, i) => <option key={i} value={i} style={{ color: '#2c2c2a' }}>{m}</option>)}
            </select>
            <select value={selYear} onChange={e => setYear(Number(e.target.value))} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ color: '#2c2c2a' }}>{y}</option>)}
            </select>
          </div>
        )}
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 12 }}>

          {/* ── HARIAN ─────────────────────────────────────────────────────── */}
          {tab === 'harian' && (
            <>
              <StatCard txList={dailyTx} label={sameDay(selDate, now) ? 'Hari Ini' : formatDate(selDate)} />

              {/* Bar chart per jam */}
              {dailyTx.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>TRANSAKSI PER JAM</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, overflowX: 'auto' }}>
                    {(() => {
                      const maxVal = Math.max(...hourlyData.map(h => h.total), 1);
                      return hourlyData.map(h => (
                        <div key={h.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28, flex: 1 }}>
                          <div style={{
                            width: '100%', background: h.total > 0 ? '#1D9E75' : '#f0f4f0',
                            borderRadius: '4px 4px 0 0',
                            height: `${(h.total / maxVal) * 64}px`,
                            minHeight: h.total > 0 ? 4 : 0,
                            transition: 'height 0.3s ease',
                          }} />
                          <div style={{ fontSize: 9, color: '#888780', marginTop: 4, fontWeight: 600 }}>
                            {h.hour}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <PayBreakdownCard txList={dailyTx} />
              <TopProductsCard txList={dailyTx} />
              <KasirCard txList={dailyTx} />
              <RecentTxCard txList={dailyTx} />
            </>
          )}

          {/* ── MINGGUAN ───────────────────────────────────────────────────── */}
          {tab === 'mingguan' && (
            <>
              <StatCard txList={weeklyTx} label={weekOffset === 0 ? 'Minggu Ini' : weekOffset === -1 ? 'Minggu Lalu' : `${formatDateShort(weekStart)}–${formatDateShort(weekEnd)}`} />

              {/* Bar chart per hari */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 14 }}>PENDAPATAN PER HARI</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                  {(() => {
                    const maxVal = Math.max(...weeklyDayData.map(d => d.total), 1);
                    return weeklyDayData.map(d => (
                      <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        {d.total > 0 && (
                          <div style={{ fontSize: 9, color: '#1D9E75', fontWeight: 700, marginBottom: 2 }}>
                            {d.count}tx
                          </div>
                        )}
                        <div style={{
                          width: '100%',
                          background: d.isToday
                            ? 'linear-gradient(to top, #1D9E75, #9FE1CB)'
                            : d.total > 0 ? '#E1F5EE' : '#f0f4f0',
                          borderRadius: '6px 6px 0 0',
                          height: `${(d.total / maxVal) * 72}px`,
                          minHeight: d.total > 0 ? 6 : 0,
                          border: d.isToday ? '2px solid #1D9E75' : 'none',
                          transition: 'height 0.3s ease',
                        }} />
                        <div style={{ fontSize: 10, color: d.isToday ? '#1D9E75' : '#888780', marginTop: 4, fontWeight: d.isToday ? 800 : 600 }}>
                          {d.label}
                        </div>
                        <div style={{ fontSize: 9, color: '#aaa' }}>{d.dateLabel}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Detail per hari */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>DETAIL PER HARI</div>
                {weeklyDayData.map(d => (
                  <div key={d.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid #f0f4f0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: d.isToday ? '#E1F5EE' : '#f8f8f7',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: d.isToday ? '#1D9E75' : '#888780' }}>{d.label}</div>
                        <div style={{ fontSize: 9, color: '#aaa' }}>{d.dateLabel}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>
                          {d.isToday ? 'Hari Ini' : formatDate(d.day)}
                        </div>
                        <div style={{ fontSize: 11, color: '#888780' }}>{d.count} transaksi</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: d.total > 0 ? '#1D9E75' : '#ccc' }}>
                      {d.total > 0 ? fmt(d.total) : '-'}
                    </div>
                  </div>
                ))}
              </div>

              <PayBreakdownCard txList={weeklyTx} />
              <TopProductsCard txList={weeklyTx} />
              <KasirCard txList={weeklyTx} />
            </>
          )}

          {/* ── BULANAN ────────────────────────────────────────────────────── */}
          {tab === 'bulanan' && (
            <>
              <StatCard txList={monthTx} label={`${MONTHS[selMonth]} ${selYear}`} />
              <PayBreakdownCard txList={monthTx} />
              <TopProductsCard txList={monthTx} />
              <KasirCard txList={monthTx} />
              <RecentTxCard txList={monthTx} />
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportPage;