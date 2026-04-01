import React, { useState } from 'react';
import {
  IonModal, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { closeOutline, trashOutline, createOutline, checkmarkOutline } from 'ionicons/icons';
import { CartItem, DataService } from '../services/DataService';

interface Props {
  isOpen: boolean;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  onClose: () => void;
  onChangeQty: (id: number, delta: number) => void;
  onChangePrice: (id: number, newPrice: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const fmt = DataService.formatCurrency;

const CartDrawer: React.FC<Props> = ({
  isOpen, cart, subtotal, tax, total, taxRate,
  onClose, onChangeQty, onChangePrice, onClear, onCheckout,
}) => {
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editPrice, setEditPrice]     = useState('');

  const startEditPrice = (item: CartItem) => {
    setEditingId(item.id);
    setEditPrice(String(item.price));
  };

  const confirmEditPrice = (id: number) => {
    const val = parseInt(editPrice.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      onChangePrice(id, val);
    }
    setEditingId(null);
    setEditPrice('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={() => { cancelEdit(); onClose(); }}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.5, 0.85, 1]}
    >
      <IonHeader>
        <IonToolbar style={{ '--background': '#fff', '--color': '#2c2c2a' }}>
          <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>
            🛒 Keranjang ({cart.reduce((a, c) => a + c.qty, 0)} item)
          </IonTitle>
          <IonButtons slot="start">
            {cart.length > 0 && (
              <IonButton color="danger" onClick={onClear} style={{ fontSize: 12, fontWeight: 600 }}>
                <IonIcon icon={trashOutline} slot="start" />
                Hapus
              </IonButton>
            )}
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8f8f7' }}>
        <div style={{ padding: '12px 14px 160px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888780' }}>
              <div style={{ fontSize: 48 }}>🛒</div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>Keranjang kosong</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Tambahkan produk dari menu Kasir</div>
            </div>
          ) : (
            <>
              {/* Info harga custom */}
              <div style={{
                background: '#E6F1FB', borderRadius: 10, padding: '8px 12px',
                marginBottom: 12, fontSize: 12, color: '#185FA5', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <IonIcon icon={createOutline} style={{ fontSize: 14 }} />
                <span>Tap ✏️ untuk ubah harga item</span>
              </div>

              {cart.map(item => (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: 14, padding: '14px',
                  marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  {/* Top row: icon + name + edit button */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 30 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{item.name}</div>
                      {item.originalPrice !== undefined && item.originalPrice !== item.price && (
                        <div style={{ fontSize: 11, color: '#888780', textDecoration: 'line-through', marginTop: 1 }}>
                          Harga asal: {fmt(item.originalPrice)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => editingId === item.id ? cancelEdit() : startEditPrice(item)}
                      style={{
                        background: editingId === item.id ? '#FAEEDA' : '#E6F1FB',
                        border: 'none', borderRadius: 8, padding: '6px 10px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 700,
                        color: editingId === item.id ? '#BA7517' : '#185FA5',
                      }}
                    >
                      <IonIcon icon={editingId === item.id ? closeOutline : createOutline} style={{ fontSize: 14 }} />
                      {editingId === item.id ? 'Batal' : 'Harga'}
                    </button>
                  </div>

                  {/* Price edit row */}
                  {editingId === item.id ? (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', marginBottom: 6 }}>
                        Harga Custom (Rp)
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && confirmEditPrice(item.id)}
                          autoFocus
                          placeholder="0"
                          style={{
                            flex: 1, border: '2px solid #185FA5', borderRadius: 10,
                            padding: '10px 12px', fontSize: 15, fontWeight: 700,
                            background: '#fff', outline: 'none', color: '#2c2c2a',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        />
                        <button
                          onClick={() => confirmEditPrice(item.id)}
                          style={{
                            background: '#1D9E75', color: '#fff', border: 'none',
                            borderRadius: 10, padding: '10px 16px', fontWeight: 700,
                            fontSize: 13, cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <IonIcon icon={checkmarkOutline} style={{ fontSize: 16 }} />
                          OK
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Bottom row: price + qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 700 }}>
                        {fmt(item.price)} × {item.qty}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F6E56' }}>
                        = {fmt(item.price * item.qty)}
                      </div>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => onChangeQty(item.id, -1)}
                        style={{
                          background: item.qty === 1 ? '#FCEBEB' : '#f0f4f0',
                          border: 'none', borderRadius: '50%', width: 34, height: 34,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: item.qty === 1 ? '#E24B4A' : '#444441',
                          fontSize: 20, fontWeight: 800,
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#2c2c2a' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onChangeQty(item.id, 1)}
                        style={{
                          background: '#1D9E75', border: 'none',
                          borderRadius: '50%', width: 34, height: 34,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff', fontSize: 20, fontWeight: 800,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </IonContent>

      {/* Summary & Checkout sticky at bottom */}
      {cart.length > 0 && (
        <div style={{
          background: '#fff',
          padding: '14px 16px 32px',
          borderTop: '1px solid #e8e6df',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780', marginBottom: 4 }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780', marginBottom: 10 }}>
            <span>Pajak {(taxRate * 100).toFixed(0)}%</span><span>{fmt(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#2c2c2a', marginBottom: 14 }}>
            <span>Total</span><span style={{ color: '#1D9E75' }}>{fmt(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            style={{
              width: '100%', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 14, padding: '15px',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
            }}
          >
            💳 Lanjut ke Pembayaran
          </button>
        </div>
      )}
    </IonModal>
  );
};

export default CartDrawer;