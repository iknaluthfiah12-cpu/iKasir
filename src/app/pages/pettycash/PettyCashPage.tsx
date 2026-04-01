import React, { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonModal, IonButtons, IonButton, IonIcon, IonToast,
  IonSegment, IonSegmentButton, IonLabel, IonAlert,
} from '@ionic/react';
import {
  addOutline, closeOutline, trashOutline, lockClosedOutline,
  walletOutline, arrowUpOutline, arrowDownOutline, alertCircleOutline,
} from 'ionicons/icons';
import { DataService, CashSession, PettyCashEntry, User } from '../../services/DataService';

const fmt = DataService.formatCurrency;

interface Props { user: User; }

const PettyCashPage: React.FC<Props> = ({ user }) => {
  const [session, setSession]         = useState<CashSession | null>(() => DataService.getActiveCashSession());
  const [sessions, setSessions]       = useState<CashSession[]>(() => DataService.getCashSessions());
  const [entries, setEntries]         = useState<PettyCashEntry[]>(() => DataService.getPettyCash());
  const [tab, setTab]                 = useState('kas');
  const [toast, setToast]             = useState('');
  const [toastColor, setToastColor]   = useState<'success' | 'danger' | 'warning'>('success');

  // Modal states
  const [showOpen, setShowOpen]       = useState(false);
  const [showClose, setShowClose]     = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId]       = useState<number | null>(null);

  // Form states
  const [startingCash, setStartingCash] = useState('');
  const [endingCash, setEndingCash]   = useState('');
  const [entryForm, setEntryForm]     = useState({
    type: 'out' as 'in' | 'out',
    amount: '',
    description: '',
  });

  const isAdmin = user.role === 'admin';

  const showMsg = (msg: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastColor(color); setToast(msg);
  };

  // ── Cash balance ────────────────────────────────────────────────────────────
  const cashBalance = useMemo(() => DataService.calcCashBalance(session), [session, entries]);

  // ── Petty cash entries for current session ──────────────────────────────────
  const sessionEntries = useMemo(() => {
    if (!session) return entries.slice(0, 20);
    return entries.filter(e => e.id >= session.id);
  }, [entries, session]);

  const pcIn  = sessionEntries.filter(e => e.type === 'in').reduce((a, e) => a + e.amount, 0);
  const pcOut = sessionEntries.filter(e => e.type === 'out').reduce((a, e) => a + e.amount, 0);

  // ── Cash sales this session ─────────────────────────────────────────────────
  const cashSales = useMemo(() => {
    if (!session) return 0;
    return DataService.getHistory()
      .filter(tx => tx.id >= session.id && tx.paymentMethod === 'tunai')
      .reduce((a, tx) => a + tx.total, 0);
  }, [session]);

  // ── Open session ────────────────────────────────────────────────────────────
  const handleOpenSession = () => {
    const amount = parseInt(startingCash.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 0) { showMsg('Masukkan jumlah modal awal', 'danger'); return; }
    const newSession = DataService.openCashSession(user, amount);
    setSession(newSession);
    setSessions(DataService.getCashSessions());
    setShowOpen(false);
    setStartingCash('');
    showMsg(`✅ Sesi kas dibuka dengan modal ${fmt(amount)}`);
  };

  // ── Close session ───────────────────────────────────────────────────────────
  const handleCloseSession = () => {
    const amount = parseInt(endingCash.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 0) { showMsg('Masukkan jumlah kas akhir', 'danger'); return; }
    DataService.closeCashSession(user, amount);
    setSession(null);
    setSessions(DataService.getCashSessions());
    setShowClose(false);
    setEndingCash('');
    showMsg('✅ Sesi kas ditutup');
  };

  // ── Add petty cash entry ────────────────────────────────────────────────────
  const handleAddEntry = () => {
    if (!session) { showMsg('Buka sesi kas terlebih dahulu', 'warning'); return; }
    const amount = parseInt(entryForm.amount.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount <= 0) { showMsg('Masukkan jumlah yang valid', 'danger'); return; }
    if (!entryForm.description.trim()) { showMsg('Masukkan keterangan', 'danger'); return; }
    const entry = DataService.addPettyCash({
      type: entryForm.type,
      amount,
      description: entryForm.description.trim(),
      kasir: user.name,
      kasirId: user.id,
    });
    setEntries(DataService.getPettyCash());
    setShowAddEntry(false);
    setEntryForm({ type: 'out', amount: '', description: '' });
    showMsg(`✅ ${entryForm.type === 'in' ? 'Kas masuk' : 'Kas keluar'} dicatat`);
  };

  // ── Delete entry ────────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      DataService.deletePettyCash(deleteId);
      setEntries(DataService.getPettyCash());
      showMsg('🗑️ Entri dihapus');
    }
    setDeleteId(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e8e6df', borderRadius: 12,
    padding: '13px 14px', fontSize: 14, background: '#fff',
    fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2c2c2a',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>💵 Kas & Petty Cash</IonTitle>
          {session && (
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddEntry(true)}>
                <IonIcon icon={addOutline} style={{ fontSize: 22 }} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>

        <div style={{ background: '#fff', borderBottom: '1px solid #e8e6df' }}>
          <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as string)}
            style={{ '--background': 'transparent', padding: '6px 12px' }}>
            {[
              { value: 'kas', label: 'Sesi Kas' },
              { value: 'petty', label: 'Petty Cash' },
              { value: 'riwayat', label: 'Riwayat' },
            ].map(t => (
              <IonSegmentButton key={t.value} value={t.value}
                style={{ '--color-checked': '#1D9E75', '--indicator-color': '#1D9E75' }}>
                <IonLabel style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </div>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 12 }}>

          {/* ── SESI KAS ──────────────────────────────────────────────────── */}
          {tab === 'kas' && (
            <>
              {/* Session status card */}
              {session ? (
                <div style={{
                  background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                  borderRadius: 18, padding: 20, marginBottom: 14, color: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>SESI KAS AKTIF</div>
                      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{fmt(cashBalance)}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Estimasi saldo kas</div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)', borderRadius: 10,
                      padding: '6px 12px', fontSize: 12, fontWeight: 700,
                    }}>
                      ● Aktif
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 18 }}>
                    {[
                      { label: 'Modal Awal', value: session.startingCash, icon: '🏦' },
                      { label: 'Penjualan Tunai', value: cashSales, icon: '💵' },
                      { label: 'Petty Cash Net', value: pcIn - pcOut, icon: pcIn - pcOut >= 0 ? '📈' : '📉' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{fmt(s.value)}</div>
                        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 11, opacity: 0.7 }}>
                    Dibuka: {session.openedAt} oleh {session.openedBy}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => { setEndingCash(String(cashBalance)); setShowClose(true); }}
                      style={{
                        marginTop: 14, width: '100%', background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)', color: '#fff',
                        borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      🔒 Tutup Sesi Kas
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#fff', borderRadius: 18, padding: 24,
                  marginBottom: 14, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🏦</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#2c2c2a', marginBottom: 6 }}>
                    Belum ada sesi kas aktif
                  </div>
                  <div style={{ fontSize: 13, color: '#888780', marginBottom: 20 }}>
                    Buka sesi kas untuk mulai mencatat transaksi petty cash dan memantau saldo
                  </div>
                  <button
                    onClick={() => setShowOpen(true)}
                    style={{
                      background: '#1D9E75', color: '#fff', border: 'none',
                      borderRadius: 14, padding: '14px 28px', fontSize: 15,
                      fontWeight: 800, cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    💵 Buka Sesi Kas
                  </button>
                </div>
              )}

              {/* Quick actions */}
              {session && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Kas Masuk', icon: '📥', color: '#1D9E75', bg: '#E1F5EE', type: 'in' },
                    { label: 'Kas Keluar', icon: '📤', color: '#E24B4A', bg: '#FCEBEB', type: 'out' },
                  ].map(a => (
                    <button
                      key={a.type}
                      onClick={() => {
                        setEntryForm({ type: a.type as 'in' | 'out', amount: '', description: '' });
                        setShowAddEntry(true);
                      }}
                      style={{
                        background: a.bg, border: `2px solid ${a.color}20`,
                        borderRadius: 14, padding: '16px 12px', cursor: 'pointer',
                        textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: a.color }}>{a.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent entries */}
              {sessionEntries.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>
                    TRANSAKSI KAS HARI INI
                  </div>
                  {sessionEntries.slice(0, 5).map(e => (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0', borderBottom: '1px solid #f0f4f0',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: e.type === 'in' ? '#E1F5EE' : '#FCEBEB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        {e.type === 'in' ? '📥' : '📤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2c2c2a' }}>{e.description}</div>
                        <div style={{ fontSize: 11, color: '#888780' }}>{e.kasir}</div>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 800,
                        color: e.type === 'in' ? '#1D9E75' : '#E24B4A',
                      }}>
                        {e.type === 'in' ? '+' : '-'}{fmt(e.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PETTY CASH ────────────────────────────────────────────────── */}
          {tab === 'petty' && (
            <>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: '#E1F5EE', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75', marginBottom: 4 }}>📥 KAS MASUK</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>{fmt(pcIn)}</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                    {sessionEntries.filter(e => e.type === 'in').length} entri
                  </div>
                </div>
                <div style={{ background: '#FCEBEB', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E24B4A', marginBottom: 4 }}>📤 KAS KELUAR</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#E24B4A' }}>{fmt(pcOut)}</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                    {sessionEntries.filter(e => e.type === 'out').length} entri
                  </div>
                </div>
              </div>

              {/* Net */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>Net Petty Cash</div>
                <div style={{
                  fontSize: 18, fontWeight: 800,
                  color: pcIn - pcOut >= 0 ? '#1D9E75' : '#E24B4A',
                }}>
                  {pcIn - pcOut >= 0 ? '+' : ''}{fmt(pcIn - pcOut)}
                </div>
              </div>

              {/* Add button */}
              {session && (
                <button
                  onClick={() => setShowAddEntry(true)}
                  style={{
                    width: '100%', background: '#1D9E75', color: '#fff',
                    border: 'none', borderRadius: 14, padding: 14,
                    fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    marginBottom: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                  Tambah Entri Petty Cash
                </button>
              )}

              {!session && (
                <div style={{
                  background: '#FAEEDA', borderRadius: 12, padding: '12px 16px',
                  marginBottom: 14, fontSize: 13, color: '#BA7517',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <IonIcon icon={alertCircleOutline} style={{ fontSize: 18 }} />
                  Buka sesi kas terlebih dahulu untuk mencatat petty cash
                </div>
              )}

              {/* Entries list */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>
                  DAFTAR TRANSAKSI
                </div>
                {sessionEntries.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#888780', fontSize: 13 }}>
                    Belum ada entri petty cash
                  </div>
                )}
                {sessionEntries.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid #f0f4f0',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: e.type === 'in' ? '#E1F5EE' : '#FCEBEB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {e.type === 'in' ? '📥' : '📤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{e.description}</div>
                      <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                        {e.kasir} · {e.date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 15, fontWeight: 800,
                        color: e.type === 'in' ? '#1D9E75' : '#E24B4A',
                      }}>
                        {e.type === 'in' ? '+' : '-'}{fmt(e.amount)}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ccc', fontSize: 12, marginTop: 2, padding: 0,
                          }}
                        >
                          🗑️ hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── RIWAYAT SESI ──────────────────────────────────────────────── */}
          {tab === 'riwayat' && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>
                RIWAYAT SESI KAS
              </div>
              {sessions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#888780', fontSize: 13 }}>
                  Belum ada riwayat sesi
                </div>
              )}
              {sessions.map(s => (
                <div key={s.id} style={{
                  padding: '14px 0', borderBottom: '1px solid #f0f4f0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{s.date}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: s.isOpen ? '#E1F5EE' : '#f0f4f0',
                      color: s.isOpen ? '#1D9E75' : '#888780',
                    }}>
                      {s.isOpen ? '● Aktif' : 'Tutup'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: '#f8f8f7', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#888780' }}>Modal Awal</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>{fmt(s.startingCash)}</div>
                    </div>
                    {s.endingCash !== undefined && (
                      <div style={{ background: '#f8f8f7', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: '#888780' }}>Kas Akhir</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5' }}>{fmt(s.endingCash)}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 8 }}>
                    Dibuka: {s.openedAt} oleh {s.openedBy}
                    {s.closedAt && <span> · Ditutup: {s.closedAt}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>

      {/* ── Open Session Modal ─────────────────────────────────────────────── */}
      <IonModal isOpen={showOpen} onDidDismiss={() => setShowOpen(false)} initialBreakpoint={0.6} breakpoints={[0, 0.6]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>💵 Buka Sesi Kas</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowOpen(false)}><IonIcon icon={closeOutline} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 52 }}>🏦</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2a', marginTop: 8 }}>Modal Awal Kas</div>
              <div style={{ fontSize: 13, color: '#888780', marginTop: 4 }}>
                Masukkan jumlah uang tunai yang ada di laci kasir saat ini
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Jumlah Modal Awal (Rp)</div>
              <input
                type="number"
                value={startingCash}
                onChange={e => setStartingCash(e.target.value)}
                placeholder="0"
                autoFocus
                style={{ ...inputStyle, fontSize: 24, fontWeight: 800, textAlign: 'center', color: '#1D9E75' }}
              />
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[100000, 200000, 300000, 500000].map(v => (
                <button key={v} onClick={() => setStartingCash(String(v))} style={{
                  flex: 1, minWidth: '40%', background: startingCash === String(v) ? '#E1F5EE' : '#f0f4f0',
                  border: `2px solid ${startingCash === String(v) ? '#1D9E75' : 'transparent'}`,
                  borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700,
                  color: startingCash === String(v) ? '#1D9E75' : '#444441',
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {fmt(v)}
                </button>
              ))}
            </div>

            <button onClick={handleOpenSession} style={{
              width: '100%', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ✅ Buka Sesi Kas
            </button>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Close Session Modal ────────────────────────────────────────────── */}
      <IonModal isOpen={showClose} onDidDismiss={() => setShowClose(false)} initialBreakpoint={0.65} breakpoints={[0, 0.65]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>🔒 Tutup Sesi Kas</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowClose(false)}><IonIcon icon={closeOutline} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 20 }}>
            {/* Summary */}
            <div style={{ background: '#E1F5EE', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75', marginBottom: 10 }}>RINGKASAN SESI</div>
              {[
                { label: 'Modal Awal', value: session?.startingCash ?? 0 },
                { label: 'Penjualan Tunai', value: cashSales },
                { label: 'Kas Masuk', value: pcIn },
                { label: 'Kas Keluar', value: -pcOut },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#444441' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.value < 0 ? '#E24B4A' : '#1D9E75' }}>
                    {r.value < 0 ? '-' : ''}{fmt(Math.abs(r.value))}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #1D9E75', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2c2c2a' }}>Estimasi Kas</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>{fmt(cashBalance)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Kas Aktual di Laci (Rp)</div>
              <input
                type="number"
                value={endingCash}
                onChange={e => setEndingCash(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, fontSize: 20, fontWeight: 800, textAlign: 'center', color: '#185FA5' }}
              />
              {endingCash && !isNaN(parseInt(endingCash)) && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 10,
                  background: parseInt(endingCash) >= cashBalance ? '#E1F5EE' : '#FCEBEB',
                  fontSize: 12, fontWeight: 700,
                  color: parseInt(endingCash) >= cashBalance ? '#1D9E75' : '#E24B4A',
                }}>
                  {parseInt(endingCash) >= cashBalance
                    ? `✅ Lebih ${fmt(parseInt(endingCash) - cashBalance)}`
                    : `⚠️ Kurang ${fmt(cashBalance - parseInt(endingCash))}`}
                </div>
              )}
            </div>

            <button onClick={handleCloseSession} style={{
              width: '100%', background: '#E24B4A', color: '#fff',
              border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              🔒 Tutup Sesi Kas
            </button>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Add Petty Cash Modal ───────────────────────────────────────────── */}
      <IonModal isOpen={showAddEntry} onDidDismiss={() => setShowAddEntry(false)} initialBreakpoint={0.75} breakpoints={[0, 0.75]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>
              {entryForm.type === 'in' ? '📥 Kas Masuk' : '📤 Kas Keluar'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddEntry(false)}><IonIcon icon={closeOutline} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 16 }}>
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {[
                { value: 'in', label: '📥 Kas Masuk', color: '#1D9E75', bg: '#E1F5EE' },
                { value: 'out', label: '📤 Kas Keluar', color: '#E24B4A', bg: '#FCEBEB' },
              ].map(t => (
                <button key={t.value} onClick={() => setEntryForm({ ...entryForm, type: t.value as 'in' | 'out' })} style={{
                  flex: 1, padding: '12px',
                  background: entryForm.type === t.value ? t.bg : '#f8f8f7',
                  border: `2px solid ${entryForm.type === t.value ? t.color : '#e8e6df'}`,
                  borderRadius: 12, cursor: 'pointer', fontSize: 13,
                  fontWeight: 700, color: entryForm.type === t.value ? t.color : '#444441',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Jumlah (Rp)</div>
              <input
                type="number"
                value={entryForm.amount}
                onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })}
                placeholder="0"
                style={{ ...inputStyle, fontSize: 20, fontWeight: 800, color: entryForm.type === 'in' ? '#1D9E75' : '#E24B4A' }}
              />
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {[10000, 20000, 50000, 100000].map(v => (
                <button key={v} onClick={() => setEntryForm({ ...entryForm, amount: String(v) })} style={{
                  flex: 1, minWidth: '40%', background: '#f0f4f0', border: 'none',
                  borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 700,
                  color: '#444441', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {fmt(v)}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Keterangan</div>
              <input
                type="text"
                value={entryForm.description}
                onChange={e => setEntryForm({ ...entryForm, description: e.target.value })}
                placeholder={entryForm.type === 'in' ? 'Contoh: Penjualan online, Titipan' : 'Contoh: Beli sabun, Biaya parkir'}
                style={inputStyle}
              />
            </div>

            <button onClick={handleAddEntry} style={{
              width: '100%',
              background: entryForm.type === 'in' ? '#1D9E75' : '#E24B4A',
              color: '#fff', border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ✅ Simpan
            </button>
          </div>
        </IonContent>
      </IonModal>

      {/* Delete confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Hapus Entri"
        message="Yakin ingin menghapus entri ini?"
        buttons={[
          { text: 'Batal', role: 'cancel' },
          { text: 'Hapus', role: 'destructive', handler: confirmDelete },
        ]}
      />

      <IonToast isOpen={!!toast} message={toast} duration={2500} color={toastColor} position="bottom" onDidDismiss={() => setToast('')} />
    </IonPage>
  );
};

export default PettyCashPage;