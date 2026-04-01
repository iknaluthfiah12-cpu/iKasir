/* ─── iKasir Data Service ─────────────────────────────────────────────────── */

// ── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  price: number;
  cat: string;
  icon: string;
  stock: number;
  barcode?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'kasir';
}

export interface CartItem extends Product {
  qty: number;
  originalPrice?: number; // harga asli sebelum diubah
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'edc_bca';

export interface Transaction {
  id: number;
  no: string;
  date: string;
  kasir: string;
  kasirId: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cash?: number;
  kembalian?: number;
  referenceNo?: string;
  edcApprovalCode?: string;
  bankRef?: string;
  printed: boolean;
}

export interface PrinterDevice {
  deviceId: string;
  name: string;
  address: string;
}

// ── Petty Cash Types ──────────────────────────────────────────────────────────
export type PettyCashType = 'in' | 'out';

export interface PettyCashEntry {
  id: number;
  date: string;
  type: PettyCashType;   // 'in' = masuk, 'out' = keluar
  amount: number;
  description: string;
  kasir: string;
  kasirId: number;
}

export interface CashSession {
  id: number;
  date: string;           // tanggal sesi
  openedBy: string;
  openedById: number;
  openedAt: string;       // waktu buka
  startingCash: number;   // modal awal
  closedAt?: string;      // waktu tutup
  closedBy?: string;
  endingCash?: number;    // uang akhir (dihitung)
  isOpen: boolean;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────
export const SEED_PRODUCTS: Product[] = [
  { id: 1,  name: 'Nasi Goreng',      price: 18000, cat: 'Makanan',  icon: '🍳', stock: 50  },
  { id: 2,  name: 'Mie Ayam',         price: 15000, cat: 'Makanan',  icon: '🍜', stock: 40  },
  { id: 3,  name: 'Ayam Bakar',       price: 25000, cat: 'Makanan',  icon: '🍗', stock: 30  },
  { id: 4,  name: 'Gado-gado',        price: 14000, cat: 'Makanan',  icon: '🥗', stock: 25  },
  { id: 5,  name: 'Es Teh Manis',     price:  5000, cat: 'Minuman',  icon: '🧋', stock: 100 },
  { id: 6,  name: 'Jus Jeruk',        price: 12000, cat: 'Minuman',  icon: '🍊', stock: 60  },
  { id: 7,  name: 'Es Kopi',          price: 15000, cat: 'Minuman',  icon: '☕', stock: 80  },
  { id: 8,  name: 'Air Mineral',      price:  4000, cat: 'Minuman',  icon: '💧', stock: 200 },
  { id: 9,  name: 'Keripik Singkong', price:  8000, cat: 'Snack',    icon: '🥔', stock: 70  },
  { id: 10, name: 'Pisang Goreng',    price:  7000, cat: 'Snack',    icon: '🍌', stock: 45  },
  { id: 11, name: 'Roti Bakar',       price: 10000, cat: 'Snack',    icon: '🍞', stock: 35  },
  { id: 12, name: 'Pulsa & Token',    price: 50000, cat: 'Lainnya',  icon: '📱', stock: 999 },
  { id: 13, name: 'Soto Ayam',        price: 16000, cat: 'Makanan',  icon: '🍲', stock: 20  },
  { id: 14, name: 'Es Campur',        price: 13000, cat: 'Minuman',  icon: '🍧', stock: 30  },
  { id: 15, name: 'Martabak Mini',    price: 12000, cat: 'Snack',    icon: '🥞', stock: 15  },
];

export const SEED_USERS: User[] = [
  { id: 1, name: 'Admin',   username: 'admin',  password: 'admin123', role: 'admin' },
  { id: 2, name: 'Kasir 1', username: 'kasir1', password: 'kasir123', role: 'kasir' },
  { id: 3, name: 'Kasir 2', username: 'kasir2', password: 'kasir123', role: 'kasir' },
];

// ── Storage Helpers ───────────────────────────────────────────────────────────
export function storageGet<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : def;
  } catch { return def; }
}

export function storageSave<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Data Access ───────────────────────────────────────────────────────────────
export const DataService = {
  // Session
  getSession: ()             => storageGet<User | null>('ik_session', null),
  saveSession: (u: User | null) => storageSave('ik_session', u),

  // Users
  getUsers: ()               => storageGet<User[]>('ik_users', SEED_USERS),
  saveUsers: (u: User[])     => storageSave('ik_users', u),
  login: (username: string, password: string): User | null => {
    const users = DataService.getUsers();
    return users.find(u => u.username === username && u.password === password) ?? null;
  },

  // Products
  getProducts: ()            => storageGet<Product[]>('ik_products', SEED_PRODUCTS),
  saveProducts: (p: Product[]) => storageSave('ik_products', p),

  // Transactions
  getHistory: ()             => storageGet<Transaction[]>('ik_history', []),
  addTransaction: (tx: Transaction) => {
    const history = DataService.getHistory();
    storageSave('ik_history', [tx, ...history]);
  },
  clearHistory: ()           => storageSave('ik_history', []),

  // Printer
  getSavedPrinter: ()        => storageGet<PrinterDevice | null>('ik_printer', null),
  savePrinter: (p: PrinterDevice | null) => storageSave('ik_printer', p),

  // ── Cash Session ───────────────────────────────────────────────────────────
  getCashSessions: ()        => storageGet<CashSession[]>('ik_cash_sessions', []),
  saveCashSessions: (s: CashSession[]) => storageSave('ik_cash_sessions', s),

  getActiveCashSession: (): CashSession | null => {
    const sessions = DataService.getCashSessions();
    return sessions.find(s => s.isOpen) ?? null;
  },

  openCashSession: (user: User, startingCash: number): CashSession => {
    const session: CashSession = {
      id: Date.now(),
      date: new Date().toLocaleDateString('id-ID'),
      openedBy: user.name,
      openedById: user.id,
      openedAt: DataService.nowStr(),
      startingCash,
      isOpen: true,
    };
    const sessions = DataService.getCashSessions();
    DataService.saveCashSessions([session, ...sessions]);
    return session;
  },

  closeCashSession: (user: User, endingCash: number): void => {
    const sessions = DataService.getCashSessions();
    const updated = sessions.map(s =>
      s.isOpen ? {
        ...s,
        isOpen: false,
        closedAt: DataService.nowStr(),
        closedBy: user.name,
        endingCash,
      } : s
    );
    DataService.saveCashSessions(updated);
  },

  // ── Petty Cash ─────────────────────────────────────────────────────────────
  getPettyCash: ()           => storageGet<PettyCashEntry[]>('ik_petty_cash', []),
  savePettyCash: (p: PettyCashEntry[]) => storageSave('ik_petty_cash', p),

  addPettyCash: (entry: Omit<PettyCashEntry, 'id' | 'date'>): PettyCashEntry => {
    const newEntry: PettyCashEntry = {
      ...entry,
      id: Date.now(),
      date: DataService.nowStr(),
    };
    const list = DataService.getPettyCash();
    DataService.savePettyCash([newEntry, ...list]);
    return newEntry;
  },

  deletePettyCash: (id: number): void => {
    const list = DataService.getPettyCash().filter(e => e.id !== id);
    DataService.savePettyCash(list);
  },

  // Hitung saldo kas (starting cash + penjualan tunai + kas masuk - kas keluar)
  calcCashBalance: (session: CashSession | null): number => {
    if (!session) return 0;
    const sessionStart = session.id;

    // Penjualan tunai sejak sesi dibuka
    const txCash = DataService.getHistory()
      .filter(tx => tx.id >= sessionStart && tx.paymentMethod === 'tunai')
      .reduce((a, tx) => a + tx.total, 0);

    // Petty cash sejak sesi dibuka
    const pc = DataService.getPettyCash().filter(e => e.id >= sessionStart);
    const pcIn  = pc.filter(e => e.type === 'in').reduce((a, e) => a + e.amount, 0);
    const pcOut = pc.filter(e => e.type === 'out').reduce((a, e) => a + e.amount, 0);

    return session.startingCash + txCash + pcIn - pcOut;
  },

  // Helpers
  generateInvNo: () => 'INV-' + Math.floor(Math.random() * 90000 + 10000),
  formatCurrency: (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID'),
  nowStr: () => new Date().toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  }),
};

export const TAX_RATE = 0.1;