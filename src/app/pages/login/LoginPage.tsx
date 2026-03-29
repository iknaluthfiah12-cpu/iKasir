import React, { useState } from 'react';
import {
  IonContent, IonPage, IonInput, IonButton, IonText,
  IonItem, IonLabel, IonIcon, IonSpinner,
} from '@ionic/react';
import { personOutline, lockClosedOutline } from 'ionicons/icons';
import { DataService, User } from '../../services/DataService';

interface Props {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400)); // UX delay
    const user = DataService.login(username, password);
    setLoading(false);
    if (!user) {
      setError('Username atau password salah');
    } else {
      onLogin(user);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f0f4f0' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 8, lineHeight: 1 }}>🏪</div>
            <div style={{
              fontSize: 38, fontWeight: 800, color: '#1D9E75',
              letterSpacing: -1.5, fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>iKasir</div>
            <div style={{ fontSize: 13, color: '#888780', marginTop: 4, fontWeight: 500 }}>
              Point of Sale · v3.0 Pro
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '28px 24px',
            width: '100%',
            maxWidth: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2c2c2a', marginBottom: 20 }}>
              Masuk ke Akun
            </div>

            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                USERNAME
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f8f8f7', borderRadius: 12,
                padding: '0 14px', border: '1.5px solid #e8e6df',
              }}>
                <IonIcon icon={personOutline} style={{ color: '#888780', fontSize: 18, flexShrink: 0 }} />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    padding: '13px 0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: '#2c2c2a', outline: 'none',
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                PASSWORD
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f8f8f7', borderRadius: 12,
                padding: '0 14px', border: '1.5px solid #e8e6df',
              }}>
                <IonIcon icon={lockClosedOutline} style={{ color: '#888780', fontSize: 18, flexShrink: 0 }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    padding: '13px 0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: '#2c2c2a', outline: 'none',
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FCEBEB', border: '1px solid #E24B4A', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, color: '#E24B4A',
                marginBottom: 16, fontWeight: 500,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', background: '#1D9E75', color: '#fff',
                border: 'none', borderRadius: 12, padding: '15px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Memproses...
                </>
              ) : (
                '🔐 Masuk'
              )}
            </button>
          </div>

          {/* Demo hint */}
          <div style={{
            marginTop: 24, textAlign: 'center', fontSize: 12,
            color: '#888780', lineHeight: 1.7,
          }}>
            Demo: <strong>admin</strong> / admin123 &nbsp;·&nbsp; <strong>kasir1</strong> / kasir123
          </div>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
