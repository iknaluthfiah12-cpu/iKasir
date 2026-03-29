import React, { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonChip, IonLabel, IonBadge, IonIcon,
  IonFab, IonFabButton, IonToast, IonButtons, IonButton,
} from '@ionic/react';
import { cartOutline, pricetagOutline, printOutline } from 'ionicons/icons';
import { DataService, Product, CartItem, TAX_RATE, User } from '../../services/DataService';
import PaymentModal from '../payment/PaymentModal';
import ReceiptModal from '../payment/ReceiptModal';
import CartDrawer   from '../../components/CartDrawer';

interface Props { user: User; }

const fmt = DataService.formatCurrency;

const PosPage: React.FC<Props> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>(() => DataService.getProducts());
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [cat, setCat]           = useState('Semua');
  const [search, setSearch]     = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showPay, setShowPay]   = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTx, setLastTx]     = useState<any>(null);
  const [toast, setToast]       = useState('');

  const cats = useMemo(() =>
    ['Semua', ...Array.from(new Set(products.map(p => p.cat)))],
    [products]
  );

  const filtered = useMemo(() =>
    products.filter(p =>
      (cat === 'Semua' || p.cat === cat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    ),
    [products, cat, search]
  );

  const subtotal   = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const tax        = subtotal * TAX_RATE;
  const total      = subtotal + tax;
  const cartCount  = cart.reduce((a, c) => a + c.qty, 0);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
    setToast(`${p.icon} ${p.name} ditambahkan`);
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const handlePaySuccess = (tx: any) => {
    // Deduct stock
    const updated = products.map(p => {
      const ci = cart.find(c => c.id === p.id);
      return ci ? { ...p, stock: p.stock - ci.qty } : p;
    });
    setProducts(updated);
    DataService.saveProducts(updated);
    setLastTx(tx);
    setCart([]);
    setShowPay(false);
    setShowReceipt(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>
            🏪 iKasir
          </IonTitle>
          <IonButtons slot="end" style={{ paddingRight: 8 }}>
            <div style={{ position: 'relative' }}>
              <IonButton onClick={() => setShowCart(true)} style={{ '--color': '#fff' }}>
                <IonIcon icon={cartOutline} style={{ fontSize: 22 }} />
              </IonButton>
              {cartCount > 0 && (
                <div className="cart-badge">{cartCount}</div>
              )}
            </div>
          </IonButtons>
        </IonToolbar>

        {/* Search */}
        <IonToolbar style={{ '--background': '#1D9E75', '--border-width': 0, padding: '0 12px 10px' }}>
          <IonSearchbar
            value={search}
            onIonInput={e => setSearch(e.detail.value ?? '')}
            placeholder="Cari produk..."
            style={{ '--background': '#fff', '--border-radius': '12px', '--box-shadow': 'none', padding: 0 }}
            showCancelButton="never"
          />
        </IonToolbar>

        {/* Category chips */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e8e6df',
          display: 'flex', overflowX: 'auto', padding: '10px 12px',
          gap: 8, scrollbarWidth: 'none',
        }}>
          <style>{`::-webkit-scrollbar{display:none}`}</style>
          {cats.map(c => (
            <IonChip
              key={c}
              onClick={() => setCat(c)}
              style={{
                '--background': cat === c ? '#1D9E75' : '#f0f4f0',
                '--color': cat === c ? '#fff' : '#444441',
                flexShrink: 0, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              <IonLabel>{c}</IonLabel>
            </IonChip>
          ))}
        </div>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f4f0' }}>
        {/* Product Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10, padding: 12,
        }}>
          {filtered.map(p => {
            const inCart = cart.find(c => c.id === p.id);
            const oos    = p.stock <= 0;
            return (
              <div
                key={p.id}
                className={`product-card${oos ? ' out-of-stock' : ''}`}
                onClick={() => addToCart(p)}
              >
                {/* Stock badge */}
                {!oos && p.stock <= 5 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: '#FAEEDA', color: '#BA7517',
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  }}>
                    Sisa {p.stock}
                  </div>
                )}
                {oos && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: '#FCEBEB', color: '#E24B4A',
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  }}>
                    Habis
                  </div>
                )}

                {/* In-cart indicator */}
                {inCart && (
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: '#1D9E75', color: '#fff',
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {inCart.qty}
                  </div>
                )}

                <div style={{ padding: 14 }}>
                  {/* Foto produk — tampil foto jika ada, fallback ke emoji */}
                  {(p as any).photo ? (
                    <img
                      src={(p as any).photo}
                      alt={p.name}
                      style={{
                        width: '100%', height: 90, objectFit: 'cover',
                        borderRadius: 10, marginBottom: 8, display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 36, marginBottom: 8, lineHeight: 1 }}>{p.icon}</div>
                  )}
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#2c2c2a',
                    marginBottom: 4, lineHeight: 1.3,
                  }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon icon={pricetagOutline} style={{ fontSize: 11, color: '#888780' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75' }}>
                      {fmt(p.price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>Produk tidak ditemukan</div>
          </div>
        )}

        {/* Spacer for FAB */}
        <div style={{ height: 80 }} />
      </IonContent>

      {/* FAB - Pay button when cart is not empty */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 100,
        }}>
          <button
            onClick={() => setShowPay(true)}
            style={{
              width: '100%', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 16, padding: '16px 20px',
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 6px 24px rgba(29,158,117,0.4)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 8,
                width: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 800,
              }}>
                {cartCount}
              </div>
              <span>Lihat Keranjang</span>
            </div>
            <span>{fmt(total)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onClose={() => setShowCart(false)}
        onChangeQty={changeQty}
        onClear={clearCart}
        onCheckout={() => { setShowCart(false); setShowPay(true); }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPay}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        user={user}
        onClose={() => setShowPay(false)}
        onSuccess={handlePaySuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        transaction={lastTx}
        onClose={() => setShowReceipt(false)}
      />

      {/* Toast */}
      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={1200}
        color="success"
        position="bottom"
        style={{ '--start': '12px', '--end': '12px', bottom: '130px' }}
        onDidDismiss={() => setToast('')}
      />
    </IonPage>
  );
};

export default PosPage;