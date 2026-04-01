import React, { useState, useEffect } from 'react';
import {
  IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonModal, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonButton, IonToast, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  cartOutline, receiptOutline, cubeOutline,
  barChartOutline, peopleOutline, logOutOutline,
  settingsOutline, closeOutline, chevronForwardOutline,
  walletOutline,
} from 'ionicons/icons';

import { DataService, User } from './app/services/DataService';
import LoginPage     from './app/pages/login/LoginPage';
import PosPage       from './app/pages/pos/PosPage';
import HistoryPage   from './app/pages/history/HistoryPage';
import StockPage     from './app/pages/stock/StockPage';
import ReportPage    from './app/pages/report/ReportPage';
import UsersPage     from './app/pages/users/UsersPage';
import PrinterPage   from './app/pages/printer/PrinterPage';
import PettyCashPage from './app/pages/pettycash/PettyCashPage';

setupIonicReact({ mode: 'md', animated: true, rippleEffect: true });

export function getTaxRate(): number {
  const v = localStorage.getItem('ik_tax_rate');
  return v !== null ? parseFloat(v) : 0.1;
}
export function saveTaxRate(v: number) {
  localStorage.setItem('ik_tax_rate', String(v));
}

const TAX_PRESETS = [
  { label: '0%',  value: 0 },
  { label: '5%',  value: 0.05 },
  { label: '10%', value: 0.1 },
  { label: '11%', value: 0.11 },
  { label: '12%', value: 0.12 },
];

const App: React.FC = () => {
  const [user, setUser]             = useState<User | null>(() => DataService.getSession());
  const [showSettings, setShowSettings] = useState(false);
  const [taxRate, setTaxRateState]  = useState(() => getTaxRate());
  const [customTax, setCustomTax]   = useState('');
  const [toast, setToast]           = useState('');

  useEffect(() => { DataService.saveSession(user); }, [user]);

  const handleLogout = () => {
    if (!window.confirm('Yakin ingin logout?')) return;
    DataService.saveSession(null);
    setUser(null);
  };

  const handleTaxChange = (v: number) => {
    setTaxRateState(v); saveTaxRate(v);
    setToast(`✅ Pajak diubah ke ${(v * 100).toFixed(0)}%`);
  };

  const handleCustomTax = () => {
    const val = parseFloat(customTax);
    if (isNaN(val) || val < 0 || val > 100) { setToast('❌ Masukkan angka 0–100'); return; }
    const rate = val / 100;
    setTaxRateState(rate); saveTaxRate(rate);
    setCustomTax('');
    setToast(`✅ Pajak diubah ke ${val}%`);
  };

  if (!user) {
    return <IonApp><LoginPage onLogin={setUser} /></IonApp>;
  }

  const isAdmin = user.role === 'admin';
  const currentTaxPct = (taxRate * 100).toFixed(1).replace('.0', '');

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          {/* @ts-ignore */}
          <IonRouterOutlet>
            <Switch>
              <Route exact path="/pos">
                <PosPage user={user} taxRate={taxRate} />
              </Route>
              <Route exact path="/history">
                <HistoryPage />
              </Route>
              {/* ✅ Pettycash route HARUS sebelum <Redirect> */}
              <Route exact path="/pettycash">
                <PettyCashPage user={user} />
              </Route>
              {isAdmin && (
                <Route exact path="/stock"><StockPage /></Route>
              )}
              {isAdmin && (
                <Route exact path="/report"><ReportPage /></Route>
              )}
              {isAdmin && (
                <Route exact path="/users"><UsersPage /></Route>
              )}
              <Route exact path="/printer"><PrinterPage /></Route>
              <Route exact path="/"><Redirect to="/pos" /></Route>
              <Redirect to="/pos" />
            </Switch>
          </IonRouterOutlet>

          {/* @ts-ignore */}
          <IonTabBar slot="bottom">
            {/* @ts-ignore */}
            <IonTabButton tab="pos" href="/pos">
              {/* @ts-ignore */}
              <IonIcon icon={cartOutline} />
              {/* @ts-ignore */}
              <IonLabel>Kasir</IonLabel>
            </IonTabButton>

            {/* @ts-ignore */}
            <IonTabButton tab="history" href="/history">
              {/* @ts-ignore */}
              <IonIcon icon={receiptOutline} />
              {/* @ts-ignore */}
              <IonLabel>Riwayat</IonLabel>
            </IonTabButton>

            {/* @ts-ignore */}
            <IonTabButton tab="pettycash" href="/pettycash">
              {/* @ts-ignore */}
              <IonIcon icon={walletOutline} />
              {/* @ts-ignore */}
              <IonLabel>Kas</IonLabel>
            </IonTabButton>

            {isAdmin && (
              // @ts-ignore
              <IonTabButton tab="stock" href="/stock">
                {/* @ts-ignore */}
                <IonIcon icon={cubeOutline} />
                {/* @ts-ignore */}
                <IonLabel>Stok</IonLabel>
              </IonTabButton>
            )}

            {isAdmin && (
              // @ts-ignore
              <IonTabButton tab="report" href="/report">
                {/* @ts-ignore */}
                <IonIcon icon={barChartOutline} />
                {/* @ts-ignore */}
                <IonLabel>Laporan</IonLabel>
              </IonTabButton>
            )}

            {isAdmin && (
              // @ts-ignore
              <IonTabButton tab="users" href="/users">
                {/* @ts-ignore */}
                <IonIcon icon={peopleOutline} />
                {/* @ts-ignore */}
                <IonLabel>Pengguna</IonLabel>
              </IonTabButton>
            )}

            {/* @ts-ignore */}
            <IonTabButton tab="settings" onClick={(e: any) => { e.preventDefault(); setShowSettings(true); }}>
              {/* @ts-ignore */}
              <IonIcon icon={settingsOutline} />
              {/* @ts-ignore */}
              <IonLabel>Lainnya</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>

      {/* ── Settings Modal ──────────────────────────────────────────────────── */}
      <IonModal isOpen={showSettings} onDidDismiss={() => setShowSettings(false)} initialBreakpoint={0.85} breakpoints={[0, 0.85]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff' }}>
            <IonTitle style={{ fontWeight: 800, fontSize: 16 }}>⚙️ Pengaturan</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowSettings(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f0f4f0' }}>
          <div style={{ padding: 16 }}>

            {/* User info */}
            <div style={{
              background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
              borderRadius: 16, padding: 18, marginBottom: 16, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 44 }}>{user.role === 'admin' ? '👑' : '🧑‍💼'}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>@{user.username}</div>
                <div style={{
                  display: 'inline-block', marginTop: 6,
                  background: 'rgba(255,255,255,0.2)', borderRadius: 99,
                  padding: '2px 12px', fontSize: 11, fontWeight: 700,
                }}>
                  {user.role.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Tax setting - admin only */}
            {isAdmin && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888780', marginBottom: 12 }}>
                  💰 PENGATURAN PAJAK
                </div>
                <div style={{ fontSize: 13, color: '#2c2c2a', marginBottom: 10 }}>
                  Pajak saat ini: <strong style={{ color: '#1D9E75' }}>{currentTaxPct}%</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {TAX_PRESETS.map(p => (
                    <button key={p.label} onClick={() => handleTaxChange(p.value)} style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none',
                      background: taxRate === p.value ? '#1D9E75' : '#f0f4f0',
                      color: taxRate === p.value ? '#fff' : '#444441',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Custom (%)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={customTax}
                    onChange={e => setCustomTax(e.target.value)}
                    placeholder="Contoh: 7.5"
                    min="0" max="100" step="0.5"
                    style={{
                      flex: 1, border: '1.5px solid #e8e6df', borderRadius: 12,
                      padding: '10px 14px', fontSize: 14, background: '#f8f8f7',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none',
                    }}
                  />
                  <button onClick={handleCustomTax} style={{
                    background: '#185FA5', color: '#fff', border: 'none',
                    borderRadius: 12, padding: '10px 18px', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    Set
                  </button>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              {[
                { icon: '🖨️', label: 'Pengaturan Printer', href: '/printer' },
                { icon: '💵', label: 'Kas & Petty Cash',   href: '/pettycash' },
              ].map(item => (
                <a key={item.label} href={item.href} onClick={() => setShowSettings(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', textDecoration: 'none', color: '#2c2c2a',
                  borderBottom: '1px solid #f0f4f0',
                }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  <IonIcon icon={chevronForwardOutline} style={{ color: '#ccc', fontSize: 16 }} />
                </a>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={() => { setShowSettings(false); setTimeout(handleLogout, 200); }}
              style={{
                width: '100%', background: '#FCEBEB', color: '#E24B4A',
                border: '2px solid #F5C6C6', borderRadius: 14, padding: 16,
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <IonIcon icon={logOutOutline} style={{ fontSize: 20 }} />
              Logout dari {user.name}
            </button>

            <div style={{ height: 20 }} />
          </div>
        </IonContent>
      </IonModal>

      <IonToast isOpen={!!toast} message={toast} duration={2000} color="success" position="bottom" onDidDismiss={() => setToast('')} />
    </IonApp>
  );
};

export default App;