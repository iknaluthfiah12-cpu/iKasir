import React, { useState, useEffect } from 'react';
import {
  IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  cartOutline, receiptOutline, cubeOutline,
  barChartOutline, peopleOutline,
} from 'ionicons/icons';

import { DataService, User } from './app/services/DataService';
import LoginPage   from './app/pages/login/LoginPage';
import PosPage     from './app/pages/pos/PosPage';
import HistoryPage from './app/pages/history/HistoryPage';
import StockPage   from './app/pages/stock/StockPage';
import ReportPage  from './app/pages/report/ReportPage';
import UsersPage   from './app/pages/users/UsersPage';
import PrinterPage from './app/pages/printer/PrinterPage';

setupIonicReact({
  mode: 'md',
  animated: true,
  rippleEffect: true,
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => DataService.getSession());

  useEffect(() => {
    DataService.saveSession(user);
  }, [user]);

  if (!user) {
    return (
      <IonApp>
        <LoginPage onLogin={setUser} />
      </IonApp>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          {/* @ts-ignore */}
          <IonRouterOutlet>
            <Switch>
              <Route exact path="/pos">
                <PosPage user={user} />
              </Route>
              <Route exact path="/history">
                <HistoryPage />
              </Route>
              {isAdmin && (
                <Route exact path="/stock">
                  <StockPage />
                </Route>
              )}
              {isAdmin && (
                <Route exact path="/report">
                  <ReportPage />
                </Route>
              )}
              {isAdmin && (
                <Route exact path="/users">
                  <UsersPage />
                </Route>
              )}
              <Route exact path="/printer">
                <PrinterPage />
              </Route>
              <Route exact path="/">
                <Redirect to="/pos" />
              </Route>
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
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;