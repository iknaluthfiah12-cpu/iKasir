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
  referenceNo?: string;  // for QRIS / transfer / EDC
  edcApprovalCode?: string;
  bankRef?: string;
  printed: boolean;
}

export interface PrinterDevice {
  deviceId: string;
  name: string;
  address: string;
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
  getSession: ()       => storageGet<User | null>('ik_session', null),
  saveSession: (u: User | null) => storageSave('ik_session', u),

  // Users
  getUsers: ()         => storageGet<User[]>('ik_users', SEED_USERS),
  saveUsers: (u: User[]) => storageSave('ik_users', u),
  login: (username: string, password: string): User | null => {
    const users = DataService.getUsers();
    return users.find(u => u.username === username && u.password === password) ?? null;
  },

  // Products
  getProducts: ()       => storageGet<Product[]>('ik_products', SEED_PRODUCTS),
  saveProducts: (p: Product[]) => storageSave('ik_products', p),

  // Transactions
  getHistory: ()        => storageGet<Transaction[]>('ik_history', []),
  addTransaction: (tx: Transaction) => {
    const history = DataService.getHistory();
    storageSave('ik_history', [tx, ...history]);
  },
  clearHistory: ()      => storageSave('ik_history', []),

  // Printer
  getSavedPrinter: ()   => storageGet<PrinterDevice | null>('ik_printer', null),
  savePrinter: (p: PrinterDevice | null) => storageSave('ik_printer', p),

  // Helpers
  generateInvNo: () => 'INV-' + Math.floor(Math.random() * 90000 + 10000),
  formatCurrency: (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID'),
  nowStr: () => new Date().toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  }),
};

export const TAX_RATE = 0.1;
