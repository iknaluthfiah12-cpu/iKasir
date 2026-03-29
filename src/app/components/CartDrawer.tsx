import React from 'react';
import {
  IonModal, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { closeOutline, trashOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { CartItem, DataService } from '../services/DataService';

interface Props {
  isOpen: boolean;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onClose: () => void;
  onChangeQty: (id: number, delta: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const fmt = DataService.formatCurrency;

const CartDrawer: React.FC<Props> = ({
  isOpen, cart, subtotal, tax, total,
  onClose, onChangeQty, onClear, onCheckout,
}) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="auto-height"
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 0.95]}
    >
      <IonHeader>
        <IonToolbar style={{ '--background': '#fff', '--color': '#2c2c2a' }}>
          <IonTitle style={{ fontSize: 16, fontWeight: 700 }}>
            🛒 Keranjang ({cart.reduce((a, c) => a + c.qty, 0)} item)
          </IonTitle>
          <IonButtons slot="start">
            {cart.length > 0 && (
              <IonButton
                color="danger"
                onClick={onClear}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
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
        <div style={{ padding: '12px 14px 120px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888780' }}>
              <div style={{ fontSize: 48 }}>🛒</div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>Keranjang kosong</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Tambahkan produk dari menu Kasir</div>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: 14, padding: '14px',
                  marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 32 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2c2a' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, marginTop: 2 }}>
                      {fmt(item.price)} × {item.qty} = <span style={{ color: '#0F6E56' }}>{fmt(item.price * item.qty)}</span>
                    </div>
                  </div>
                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => onChangeQty(item.id, -1)}
                      style={{
                        background: 'none', border: '1.5px solid #e8e6df',
                        borderRadius: '50%', width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#E24B4A', fontSize: 18,
                      }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: 15, color: '#2c2c2a' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onChangeQty(item.id, 1)}
                      style={{
                        background: '#1D9E75', border: 'none',
                        borderRadius: '50%', width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', fontSize: 18,
                      }}
                    >
                      +
                    </button>
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
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff', padding: '14px 16px 28px',
          borderTop: '1px solid #e8e6df',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780', marginBottom: 4 }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780', marginBottom: 10 }}>
            <span>Pajak 10%</span><span>{fmt(tax)}</span>
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
