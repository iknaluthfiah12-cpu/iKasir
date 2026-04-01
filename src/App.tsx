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
  const [user, setUser] = useState<User | null>(() => DataService.getSession());
  const [showSettings, setShowSettings] = useState(false);
  const [taxRate, setTaxRateState] = useState(() => getTaxRate());
  const [customTax, setCustomTax] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { DataService.saveSession(user); }, [user]);

  const handleLogout = () => {
    if (!window.confirm('Yakin ingin logout?')) return;
    DataService.saveSession(null);
    setUser(null);
  };

  const handleTaxChange = (v: number) => {
    setTaxRateState(v);
    saveTaxRate(v);
    setToast(`✅ Pajak diubah ke ${(v * 100).toFixed(0)}%`);
  };

  const handleCustomTax = () => {
    const val = parseFloat(customTax);
    if (isNaN(val) || val < 0 || val > 100) {
      setToast('❌ Masukkan angka 0–100');
      return;
    }
    const rate = val / 100;
    setTaxRateState(rate);
    saveTaxRate(rate);
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

          <IonRouterOutlet>
            <Switch>
              <Route exact path="/pos">
                <PosPage user={user} taxRate={taxRate} />
              </Route>

              <Route exact path="/history">
                <HistoryPage />
              </Route>

              <Route exact path="/pettycash">
                <PettyCashPage user={user} />
              </Route>

              {/* ✅ FIXED ROUTES */}
              <Route exact path="/stock">
                {isAdmin ? <StockPage /> : <Redirect to="/pos" />}
              </Route>

              <Route exact path="/report">
                {isAdmin ? <ReportPage /> : <Redirect to="/pos" />}
              </Route>

              <Route exact path="/users">
                {isAdmin ? <UsersPage /> : <Redirect to="/pos" />}
              </Route>

              <Route exact path="/printer">
                <PrinterPage />
              </Route>

              <Route exact path="/">
                <Redirect to="/pos" />
              </Route>

              <Redirect to="/pos" />
            </Switch>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="pos" href="/pos">
              <IonIcon icon={cartOutline} />
              <IonLabel>Kasir</IonLabel>
            </IonTabButton>

            <IonTabButton tab="history" href="/history">
              <IonIcon icon={receiptOutline} />
              <IonLabel>Riwayat</IonLabel>
            </IonTabButton>

            <IonTabButton tab="pettycash" href="/pettycash">
              <IonIcon icon={walletOutline} />
              <IonLabel>Kas</IonLabel>
            </IonTabButton>

            {isAdmin && (
              <IonTabButton tab="stock" href="/stock">
                <IonIcon icon={cubeOutline} />
                <IonLabel>Stok</IonLabel>
              </IonTabButton>
            )}

            {isAdmin && (
              <IonTabButton tab="report" href="/report">
                <IonIcon icon={barChartOutline} />
                <IonLabel>Laporan</IonLabel>
              </IonTabButton>
            )}

            {isAdmin && (
              <IonTabButton tab="users" href="/users">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Pengguna</IonLabel>
              </IonTabButton>
            )}

            <IonTabButton tab="settings" onClick={(e) => { e.preventDefault(); setShowSettings(true); }}>
              <IonIcon icon={settingsOutline} />
              <IonLabel>Lainnya</IonLabel>
            </IonTabButton>
          </IonTabBar>

        </IonTabs>
      </IonReactRouter>

      <IonModal isOpen={showSettings} onDidDismiss={() => setShowSettings(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>⚙️ Pengaturan</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowSettings(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: 16 }}>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={2000}
        onDidDismiss={() => setToast('')}
      />
    </IonApp>
  );
};

export default App;