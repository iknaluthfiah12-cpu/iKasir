import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonModal, IonButtons, IonButton, IonIcon, IonToast,
} from '@ionic/react';
import { addOutline, closeOutline, trashOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { DataService, User } from '../../services/DataService';

const UsersPage: React.FC = () => {
  const [users, setUsers]       = useState<User[]>(() => DataService.getUsers());
  const [session]               = useState(() => DataService.getSession());
  const [showAdd, setShowAdd]   = useState(false);
  const [editPwUser, setEditPwUser] = useState<User | null>(null);
  const [toast, setToast]       = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [form, setForm]         = useState({ name: '', username: '', password: '', role: 'kasir' as 'kasir' | 'admin' });
  const [pwForm, setPwForm]     = useState({ newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const isAdmin = session?.role === 'admin';

  const save = (updated: User[]) => {
    setUsers(updated);
    DataService.saveUsers(updated);
  };

  const showToast = (msg: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastColor(color); setToast(msg);
  };

  const handleAdd = () => {
    if (!form.name || !form.username || !form.password) {
      showToast('Semua field wajib diisi', 'danger'); return;
    }
    if (form.password.length < 6) {
      showToast('Password minimal 6 karakter', 'danger'); return;
    }
    if (users.find(u => u.username === form.username)) {
      showToast('Username sudah digunakan', 'danger'); return;
    }
    save([...users, { id: Date.now(), ...form }]);
    setShowAdd(false);
    setForm({ name: '', username: '', password: '', role: 'kasir' });
    showToast('✅ Pengguna ditambahkan');
  };

  const handleDelete = (u: User) => {
    if (u.id === session?.id) { showToast('Tidak bisa hapus akun sendiri', 'danger'); return; }
    if (users.length <= 1) { showToast('Minimal harus ada 1 pengguna', 'danger'); return; }
    if (!window.confirm(`Hapus pengguna "${u.name}"?`)) return;
    save(users.filter(x => x.id !== u.id));
    showToast('🗑️ Pengguna dihapus');
  };

  const handleEditPassword = (u: User) => {
    // Admin bisa edit semua, kasir hanya bisa edit diri sendiri
    if (!isAdmin && u.id !== session?.id) {
      showToast('Tidak punya akses', 'danger'); return;
    }
    setEditPwUser(u);
    setPwForm({ newPassword: '', confirmPassword: '' });
    setShowPw(false);
    setShowConfirmPw(false);
  };

  const handleSavePassword = () => {
    if (!pwForm.newPassword || !pwForm.confirmPassword) {
      showToast('Semua field wajib diisi', 'danger'); return;
    }
    if (pwForm.newPassword.length < 6) {
      showToast('Password minimal 6 karakter', 'danger'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('Password tidak cocok', 'danger'); return;
    }
    const updated = users.map(u =>
      u.id === editPwUser?.id ? { ...u, password: pwForm.newPassword } : u
    );
    save(updated);
    // Update session jika edit diri sendiri
    if (editPwUser?.id === session?.id) {
      DataService.saveSession({ ...session!, password: pwForm.newPassword });
    }
    setEditPwUser(null);
    showToast('🔒 Password berhasil diubah');
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
          <IonTitle style={{ fontWeight: 800 }}>👥 Pengguna</IonTitle>
          {isAdmin && (
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAdd(true)}>
                <IonIcon icon={addOutline} style={{ fontSize: 22 }} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 12 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#E6F1FB', borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>👑</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#185FA5', marginTop: 4 }}>
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div style={{ fontSize: 11, color: '#185FA5', fontWeight: 600 }}>Admin</div>
            </div>
            <div style={{ background: '#E1F5EE', borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>🧑‍💼</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1D9E75', marginTop: 4 }}>
                {users.filter(u => u.role === 'kasir').length}
              </div>
              <div style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>Kasir</div>
            </div>
          </div>

          {users.map(u => {
            const isSelf = u.id === session?.id;
            const canEditPw = isAdmin || isSelf;
            return (
              <div key={u.id} style={{
                background: '#fff', borderRadius: 14, padding: '16px',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                border: isSelf ? '2px solid #1D9E75' : '2px solid transparent',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: u.role === 'admin' ? '#E6F1FB' : '#E1F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {u.role === 'admin' ? '👑' : '🧑‍💼'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2a' }}>{u.name}</div>
                    {isSelf && <span style={{ fontSize: 10, background: '#E1F5EE', color: '#1D9E75', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Saya</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>@{u.username}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                    background: u.role === 'admin' ? '#E6F1FB' : '#E1F5EE',
                    color: u.role === 'admin' ? '#185FA5' : '#1D9E75',
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {canEditPw && (
                    <button
                      onClick={() => handleEditPassword(u)}
                      style={{
                        background: '#E6F1FB', border: 'none', borderRadius: 10,
                        width: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      <IonIcon icon={lockClosedOutline} style={{ fontSize: 18, color: '#185FA5' }} />
                    </button>
                  )}
                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => handleDelete(u)}
                      style={{
                        background: '#FCEBEB', border: 'none', borderRadius: 10,
                        width: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      <IonIcon icon={trashOutline} style={{ fontSize: 18, color: '#E24B4A' }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </IonContent>

      {/* ── Add User Modal ──────────────────────────────────────────────────── */}
      <IonModal isOpen={showAdd} onDidDismiss={() => setShowAdd(false)} initialBreakpoint={0.85} breakpoints={[0, 0.85]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff', '--color': '#2c2c2a' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>➕ Tambah Pengguna</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAdd(false)}><IonIcon icon={closeOutline} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 16 }}>
            {[
              { label: 'Nama Lengkap', key: 'name', placeholder: 'Nama Kasir' },
              { label: 'Username', key: 'username', placeholder: 'kasir3' },
              { label: 'Password', key: 'password', placeholder: 'Min. 6 karakter' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>{f.label}</div>
                <input
                  type={f.key === 'password' ? 'password' : 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 8 }}>Role</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: 'kasir', label: '🧑‍💼 Kasir', color: '#1D9E75', bg: '#E1F5EE' },
                  { value: 'admin', label: '👑 Admin', color: '#185FA5', bg: '#E6F1FB' },
                ].map(r => (
                  <button key={r.value} onClick={() => setForm({ ...form, role: r.value as any })} style={{
                    flex: 1, padding: '12px',
                    background: form.role === r.value ? r.bg : '#f8f8f7',
                    border: `2px solid ${form.role === r.value ? r.color : '#e8e6df'}`,
                    borderRadius: 12, cursor: 'pointer', fontSize: 14,
                    fontWeight: 700, color: form.role === r.value ? r.color : '#444441',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} style={{
              width: '100%', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ✅ Tambah Pengguna
            </button>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Edit Password Modal ─────────────────────────────────────────────── */}
      <IonModal isOpen={!!editPwUser} onDidDismiss={() => setEditPwUser(null)} initialBreakpoint={0.65} breakpoints={[0, 0.65]}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#fff', '--color': '#2c2c2a' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>🔒 Ubah Password</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setEditPwUser(null)}><IonIcon icon={closeOutline} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 16 }}>
            {/* Info user */}
            <div style={{
              background: '#E6F1FB', borderRadius: 12, padding: '12px 14px',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>{editPwUser?.role === 'admin' ? '👑' : '🧑‍💼'}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2a' }}>{editPwUser?.name}</div>
                <div style={{ fontSize: 12, color: '#185FA5' }}>@{editPwUser?.username}</div>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Password Baru</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Min. 6 karakter"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  }}
                >
                  <IonIcon icon={showPw ? eyeOffOutline : eyeOutline} style={{ fontSize: 20, color: '#888780' }} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>Konfirmasi Password</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? '#E24B4A' : '#e8e6df',
                  }}
                />
                <button
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  }}
                >
                  <IonIcon icon={showConfirmPw ? eyeOffOutline : eyeOutline} style={{ fontSize: 20, color: '#888780' }} />
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 4 }}>❌ Password tidak cocok</div>
              )}
              {pwForm.confirmPassword && pwForm.confirmPassword === pwForm.newPassword && (
                <div style={{ fontSize: 11, color: '#1D9E75', marginTop: 4 }}>✅ Password cocok</div>
              )}
            </div>

            <button onClick={handleSavePassword} style={{
              width: '100%', background: '#185FA5', color: '#fff',
              border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              🔒 Simpan Password
            </button>
          </div>
        </IonContent>
      </IonModal>

      <IonToast isOpen={!!toast} message={toast} duration={2500} color={toastColor} position="bottom" onDidDismiss={() => setToast('')} />
    </IonPage>
  );
};

export default UsersPage;