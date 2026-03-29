import React, { useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonModal, IonButtons, IonButton, IonIcon,
  IonToast, IonActionSheet,
} from '@ionic/react';
import {
  addOutline, closeOutline, createOutline, trashOutline,
  cameraOutline, imageOutline, closeCircleOutline,
} from 'ionicons/icons';
import { DataService, Product } from '../../services/DataService';

const fmt = DataService.formatCurrency;
const CATS = ['Makanan', 'Minuman', 'Snack', 'Lainnya'];

// ── Tipe form diperluas dengan field photo (base64 string | undefined) ────────
type ProductForm = Omit<Product, 'id'> & { photo?: string };

// ── Helper: resize gambar ke max 600px dan kompres jadi JPEG base64 ───────────
function resizeImage(file: File, maxPx = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Komponen thumbnail produk — foto jika ada, fallback ke emoji ──────────────
const ProductThumb: React.FC<{
  photo?: string;
  icon: string;
  size?: number;
  radius?: number;
}> = ({ photo, icon, size = 56, radius = 14 }) => {
  if (photo) {
    return (
      <img
        src={photo}
        alt="produk"
        style={{
          width: size, height: size, borderRadius: radius,
          objectFit: 'cover', flexShrink: 0,
          border: '1.5px solid #e8e6df',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: '#E1F5EE', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.52, flexShrink: 0,
    }}>
      {icon || '🛒'}
    </div>
  );
};

// ── Komponen picker foto — tombol + input file tersembunyi ────────────────────
const PhotoPicker: React.FC<{
  value?: string;
  onChange: (base64: string | undefined) => void;
}> = ({ value, onChange }) => {
  const fileRef  = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showSheet, setShowSheet] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file);
      onChange(resized);
    } catch {
      alert('Gagal memuat gambar, coba file lain.');
    }
    // reset input supaya file yang sama bisa dipilih ulang
    e.target.value = '';
  };

  return (
    <>
      {/* Input tersembunyi: galeri */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {/* Input tersembunyi: kamera (capture) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {/* Preview / tombol pilih */}
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
          <img
            src={value}
            alt="preview"
            style={{
              width: 120, height: 120, borderRadius: 16,
              objectFit: 'cover', border: '2px solid #1D9E75', display: 'block',
            }}
          />
          {/* tombol hapus foto */}
          <button
            onClick={() => onChange(undefined)}
            style={{
              position: 'absolute', top: -8, right: -8,
              background: '#E24B4A', border: 'none', borderRadius: '50%',
              width: 26, height: 26, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', padding: 0,
            }}
          >
            <IonIcon icon={closeCircleOutline} style={{ fontSize: 18, color: '#fff' }} />
          </button>
          {/* tombol ganti */}
          <button
            onClick={() => setShowSheet(true)}
            style={{
              marginTop: 8, width: 120, background: '#f0f4f0',
              border: '1.5px solid #d3d1c7', borderRadius: 10,
              padding: '7px 0', fontSize: 12, fontWeight: 600,
              color: '#444441', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <IonIcon icon={imageOutline} style={{ fontSize: 14 }} />
            Ganti Foto
          </button>
        </div>
      ) : (
        /* Tombol pilih foto (belum ada foto) */
        <button
          onClick={() => setShowSheet(true)}
          style={{
            width: 120, height: 120, borderRadius: 16,
            border: '2px dashed #9FE1CB', background: '#f0faf6',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 6, cursor: 'pointer',
            color: '#1D9E75', fontSize: 12, fontWeight: 600,
          }}
        >
          <IonIcon icon={cameraOutline} style={{ fontSize: 28, color: '#1D9E75' }} />
          Tambah Foto
        </button>
      )}

      {/* Action sheet: pilih sumber foto */}
      <IonActionSheet
        isOpen={showSheet}
        onDidDismiss={() => setShowSheet(false)}
        header="Pilih Sumber Foto"
        buttons={[
          {
            text: '📷  Ambil Foto (Kamera)',
            handler: () => { setShowSheet(false); setTimeout(() => cameraRef.current?.click(), 200); },
          },
          {
            text: '🖼️  Pilih dari Galeri',
            handler: () => { setShowSheet(false); setTimeout(() => fileRef.current?.click(), 200); },
          },
          {
            text: 'Batal',
            role: 'cancel',
          },
        ]}
      />
    </>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const StockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => DataService.getProducts());
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [toast, setToast]       = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const emptyForm: ProductForm = { name: '', price: 0, cat: 'Makanan', icon: '🛒', stock: 0, photo: undefined };
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveAll = (updated: Product[]) => {
    setProducts(updated);
    DataService.saveProducts(updated);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, price: p.price, cat: p.cat,
      icon: p.icon, stock: p.stock,
      photo: (p as any).photo ?? undefined,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setToastColor('danger'); setToast('Nama produk wajib diisi'); return; }
    if (form.price <= 0)   { setToastColor('danger'); setToast('Harga harus lebih dari 0'); return; }

    if (editing) {
      saveAll(products.map(p =>
        p.id === editing.id ? { ...editing, ...form } as any : p
      ));
      setToastColor('success'); setToast('✅ Produk diperbarui');
    } else {
      saveAll([...products, { id: Date.now(), ...form } as any]);
      setToastColor('success'); setToast('✅ Produk ditambahkan');
    }
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Hapus produk ini?')) return;
    saveAll(products.filter(p => p.id !== id));
    setToastColor('success'); setToast('🗑️ Produk dihapus');
  };

  const stockColor = (s: number) => s <= 0 ? '#E24B4A' : s <= 5 ? '#BA7517' : '#1D9E75';
  const stockBg    = (s: number) => s <= 0 ? '#FCEBEB' : s <= 5 ? '#FAEEDA' : '#E1F5EE';

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e8e6df', borderRadius: 12,
    padding: '13px 14px', fontSize: 14, background: '#fff',
    color: '#2c2c2a', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>📦 Manajemen Stok</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={openAdd} style={{ '--color': '#fff' }}>
              <IonIcon icon={addOutline} style={{ fontSize: 22 }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar style={{ '--background': '#1D9E75', '--border-width': 0, padding: '0 12px 10px' }}>
          <IonSearchbar
            value={search}
            onIonInput={e => setSearch(e.detail.value ?? '')}
            placeholder="Cari produk..."
            style={{ '--background': '#fff', '--border-radius': '12px', '--box-shadow': 'none' }}
            showCancelButton="never"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        <div style={{ padding: 12 }}>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Total Produk', value: products.length, icon: '📦', color: '#1D9E75', bg: '#E1F5EE' },
              { label: 'Stok Menipis', value: products.filter(p => p.stock > 0 && p.stock <= 5).length, icon: '⚠️', color: '#BA7517', bg: '#FAEEDA' },
              { label: 'Habis',        value: products.filter(p => p.stock <= 0).length, icon: '🚫', color: '#E24B4A', bg: '#FCEBEB' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>
              <div style={{ fontSize: 40 }}>📦</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>Produk tidak ditemukan</div>
              <button onClick={openAdd} style={{
                marginTop: 16, background: '#1D9E75', color: '#fff',
                border: 'none', borderRadius: 12, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>+ Tambah Produk</button>
            </div>
          )}

          {/* Product List */}
          {filtered.map(p => {
            const photo = (p as any).photo as string | undefined;
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 14, padding: '12px 14px',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}>
                {/* Thumbnail: foto atau emoji */}
                <ProductThumb photo={photo} icon={p.icon} size={56} radius={12} />

                {/* Info produk */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, marginTop: 2 }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 1 }}>{p.cat}</div>
                </div>

                {/* Stok + aksi */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: 99,
                    background: stockBg(p.stock), color: stockColor(p.stock),
                    fontSize: 13, fontWeight: 800, marginBottom: 8,
                  }}>
                    {p.stock <= 0 ? 'Habis' : `${p.stock} pcs`}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => openEdit(p)} style={{
                      background: '#E6F1FB', border: 'none', borderRadius: 8,
                      width: 32, height: 32, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <IonIcon icon={createOutline} style={{ fontSize: 16, color: '#185FA5' }} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{
                      background: '#FCEBEB', border: 'none', borderRadius: 8,
                      width: 32, height: 32, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <IonIcon icon={trashOutline} style={{ fontSize: 16, color: '#E24B4A' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </IonContent>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#1D9E75', '--color': '#fff' }}>
            <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>
              {editing ? '✏️ Edit Produk' : '➕ Tambah Produk'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowForm(false)} style={{ '--color': '#fff' }}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8f8f7' }}>
          <div style={{ padding: 16 }}>

            {/* ── FOTO PRODUK ───────────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 10 }}>
                FOTO PRODUK
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Picker foto */}
                <PhotoPicker
                  value={form.photo}
                  onChange={photo => setForm({ ...form, photo })}
                />

                {/* Panduan singkat */}
                <div style={{ flex: 1, fontSize: 12, color: '#888780', lineHeight: 1.6, paddingTop: 6 }}>
                  <div style={{ fontWeight: 600, color: '#444441', marginBottom: 4 }}>Tips foto:</div>
                  <div>• Ambil dari kamera langsung</div>
                  <div>• Atau pilih dari galeri HP</div>
                  <div>• Foto otomatis dikompres</div>
                  <div>• Jika tidak ada foto,</div>
                  <div>  emoji akan ditampilkan</div>
                </div>
              </div>
            </div>

            {/* Garis pemisah */}
            <div style={{ borderTop: '1px solid #e8e6df', marginBottom: 18 }} />

            {/* ── EMOJI ICON (backup jika tidak ada foto) ───────────────────── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                ICON EMOJI <span style={{ fontWeight: 400 }}>(backup jika tidak ada foto)</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#E1F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                }}>
                  {form.icon || '🛒'}
                </div>
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  placeholder="🛒"
                  style={{ ...inputStyle, fontSize: 20, textAlign: 'center', flex: 1 }}
                />
              </div>
            </div>

            {/* ── NAMA ──────────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>NAMA PRODUK *</div>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Nasi Goreng"
                style={inputStyle}
              />
            </div>

            {/* ── HARGA & STOK ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>HARGA (Rp) *</div>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 6 }}>STOK</div>
                <input
                  type="number"
                  value={form.stock || ''}
                  onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── KATEGORI ──────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888780', marginBottom: 8 }}>KATEGORI</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, cat: c })} style={{
                    padding: '8px 18px', borderRadius: 99,
                    background: form.cat === c ? '#1D9E75' : '#f0f4f0',
                    color: form.cat === c ? '#fff' : '#444441',
                    border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TOMBOL SIMPAN ─────────────────────────────────────────────── */}
            <button onClick={handleSave} style={{
              width: '100%', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}>
              {editing ? '💾 Simpan Perubahan' : '➕ Tambah Produk'}
            </button>

            {/* Hapus (mode edit) */}
            {editing && (
              <button onClick={() => { handleDelete(editing.id); setShowForm(false); }} style={{
                width: '100%', background: '#FCEBEB', color: '#E24B4A',
                border: '1.5px solid #E24B4A', borderRadius: 14, padding: 14,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 10,
              }}>
                🗑️ Hapus Produk Ini
              </button>
            )}

          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!toast} message={toast} duration={2500}
        color={toastColor} position="bottom" onDidDismiss={() => setToast('')}
      />
    </IonPage>
  );
};

export default StockPage;