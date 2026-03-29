/**
 * iKasir ESC/POS Bluetooth Printer Service
 *
 * Bridges JavaScript ↔ Capacitor native plugin (Kotlin)
 * Supports: 58mm & 80mm thermal printers via BLE
 *
 * ESC/POS Commands reference:
 * https://reference.epson-biz.com/modules/ref_escpos/
 */

import { Capacitor } from '@capacitor/core';
import { DataService, Transaction, CartItem } from './DataService';

// ── ESC/POS Constants ─────────────────────────────────────────────────────────
const ESC  = 0x1B;
const GS   = 0x1D;
const FS   = 0x1C;
const LF   = 0x0A;
const CR   = 0x0D;

// Init
const INIT            = [ESC, 0x40];
// Alignment
const ALIGN_LEFT      = [ESC, 0x61, 0x00];
const ALIGN_CENTER    = [ESC, 0x61, 0x01];
const ALIGN_RIGHT     = [ESC, 0x61, 0x02];
// Bold
const BOLD_ON         = [ESC, 0x45, 0x01];
const BOLD_OFF        = [ESC, 0x45, 0x00];
// Font size
const FONT_NORMAL     = [GS, 0x21, 0x00];
const FONT_DOUBLE_W   = [GS, 0x21, 0x10];
const FONT_DOUBLE_H   = [GS, 0x21, 0x01];
const FONT_DOUBLE_WH  = [GS, 0x21, 0x11];
const FONT_2X_WH      = [GS, 0x21, 0x22]; // 3x size
// Line spacing
const LINE_SPACING_DEFAULT = [ESC, 0x32];
const LINE_SPACING_SET     = (n: number) => [ESC, 0x33, n];
// Cut paper
const CUT_FULL        = [GS, 0x56, 0x00];
const CUT_PARTIAL     = [GS, 0x56, 0x01];
// Feed
const FEED_N          = (n: number) => [ESC, 0x64, n];

// ── ESC/POS Builder ───────────────────────────────────────────────────────────
class EscPosBuilder {
  private bytes: number[] = [];

  init()        { this.push(INIT); return this; }
  center()      { this.push(ALIGN_CENTER); return this; }
  left()        { this.push(ALIGN_LEFT); return this; }
  right()       { this.push(ALIGN_RIGHT); return this; }
  boldOn()      { this.push(BOLD_ON); return this; }
  boldOff()     { this.push(BOLD_OFF); return this; }
  sizeNormal()  { this.push(FONT_NORMAL); return this; }
  sizeDoubleW() { this.push(FONT_DOUBLE_W); return this; }
  sizeDoubleH() { this.push(FONT_DOUBLE_H); return this; }
  sizeDoubleWH(){ this.push(FONT_DOUBLE_WH); return this; }
  sizeLarge()   { this.push(FONT_2X_WH); return this; }
  lineSpacing(n: number) { this.push(LINE_SPACING_SET(n)); return this; }
  feed(n = 1)   { this.push(FEED_N(n)); return this; }
  cutFull()     { this.push(CUT_FULL); return this; }
  cutPartial()  { this.push(CUT_PARTIAL); return this; }

  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.bytes.push(str.charCodeAt(i) & 0xFF);
    }
    return this;
  }

  textLine(str: string) {
    return this.text(str).text('\n');
  }

  divider(char = '-', width = 32) {
    return this.textLine(char.repeat(width));
  }

  private push(cmd: number[]) {
    this.bytes.push(...cmd);
  }

  build(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  toBase64(): string {
    const bytes = this.build();
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }
}

// ── Format helpers ────────────────────────────────────────────────────────────
const fmt = DataService.formatCurrency;

function padRow(left: string, right: string, width = 32): string {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(space, 1)) + right;
}

function wrapText(text: string, width = 32): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + word).length > width) {
      if (current) lines.push(current.trimEnd());
      current = word + ' ';
    } else {
      current += word + ' ';
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return lines;
}

// ── Build Receipt Bytes ───────────────────────────────────────────────────────
export function buildReceiptBytes(tx: Transaction, width = 32): Uint8Array {
  const b = new EscPosBuilder();

  const payLabel: Record<string, string> = {
    tunai:    'Tunai',
    qris:     'QRIS',
    transfer: 'Transfer Bank',
    edc_bca:  'EDC BCA',
  };

  b.init()
   .center()
   .boldOn()
   .sizeDoubleW()
   .textLine('iKASIR')
   .sizeNormal()
   .boldOff()
   .textLine('Toko Serba Ada')
   .textLine('Jl. Contoh No. 1, Jakarta')
   .textLine('Telp: 021-12345678')
   .divider('=', width)
   .left()
   .textLine(`Tgl  : ${tx.date}`)
   .textLine(`No   : ${tx.no}`)
   .textLine(`Kasir: ${tx.kasir}`)
   .textLine(`Bayar: ${payLabel[tx.paymentMethod] ?? tx.paymentMethod}`)
   .divider('-', width);

  // Items
  tx.items.forEach((item: CartItem) => {
    const itemLine = `${item.qty}x ${item.name}`;
    const price = fmt(item.price * item.qty).replace('Rp ', '');
    // Wrap long item names
    const wrapped = wrapText(itemLine, width - 12);
    wrapped.forEach((line, i) => {
      if (i === 0) {
        b.textLine(padRow(`  ${line}`, price, width));
      } else {
        b.textLine(`    ${line}`);
      }
    });
    b.textLine(`     @ ${fmt(item.price).replace('Rp ', '')}`);
  });

  b.divider('-', width)
   .textLine(padRow('Subtotal', fmt(tx.subtotal).replace('Rp ', ''), width))
   .textLine(padRow('Pajak 10%', fmt(tx.tax).replace('Rp ', ''), width))
   .divider('=', width)
   .boldOn()
   .textLine(padRow('TOTAL', fmt(tx.total).replace('Rp ', ''), width))
   .boldOff()
   .divider('-', width);

  // Payment details
  if (tx.paymentMethod === 'tunai' && tx.cash !== undefined) {
    b.textLine(padRow('Tunai', fmt(tx.cash).replace('Rp ', ''), width))
     .boldOn()
     .textLine(padRow('Kembalian', fmt(tx.kembalian ?? 0).replace('Rp ', ''), width))
     .boldOff();
  } else if (tx.paymentMethod === 'qris') {
    b.textLine('Pembayaran via QRIS')
     .textLine(`Ref: ${tx.referenceNo ?? '-'}`);
  } else if (tx.paymentMethod === 'transfer') {
    b.textLine('Transfer ke: BCA 1234567890')
     .textLine(`Ref: ${tx.referenceNo ?? '-'}`);
  } else if (tx.paymentMethod === 'edc_bca') {
    b.textLine('Kartu Debit/Kredit BCA')
     .textLine(`Approval: ${tx.edcApprovalCode ?? '-'}`)
     .textLine(`Ref: ${tx.referenceNo ?? '-'}`);
  }

  b.divider('=', width)
   .center()
   .textLine('Terima kasih atas kunjungan Anda!')
   .textLine('Barang yang sudah dibeli')
   .textLine('tidak dapat dikembalikan.')
   .feed(3)
   .cutPartial();

  return b.build();
}

// ── Capacitor Bluetooth Printer Plugin ───────────────────────────────────────
/**
 * This interfaces with the native Kotlin plugin.
 * The Kotlin plugin is in: android/app/src/main/java/com/ikasir/app/
 * Plugin registration: MainActivity.kt
 */
declare global {
  interface Window {
    Capacitor: {
      Plugins: {
        BluetoothPrinter?: {
          isEnabled(): Promise<{ value: boolean }>;
          requestEnable(): Promise<void>;
          startScan(): Promise<void>;
          stopScan(): Promise<void>;
          getPairedDevices(): Promise<{ devices: BluetoothDevice[] }>;
          connect(opts: { address: string }): Promise<void>;
          disconnect(): Promise<void>;
          isConnected(): Promise<{ value: boolean }>;
          print(opts: { data: string }): Promise<void>;  // base64 encoded ESC/POS bytes
          getConnectedDevice(): Promise<BluetoothDevice | null>;
        };
      };
    };
  }
}

interface BluetoothDevice {
  name: string;
  address: string;
  deviceId: string;
  bonded: boolean;
  type: string;
}

// ── PrinterService ────────────────────────────────────────────────────────────
export const PrinterService = {
  isNative: () => Capacitor.isNativePlatform(),

  getPlugin() {
    return window.Capacitor?.Plugins?.BluetoothPrinter ?? null;
  },

  async isBluetoothEnabled(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    try {
      const r = await plugin.isEnabled();
      return r.value;
    } catch { return false; }
  },

  async requestBluetoothEnable(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) return;
    await plugin.requestEnable();
  },

  async getPairedDevices(): Promise<BluetoothDevice[]> {
    const plugin = this.getPlugin();
    if (!plugin) return [];
    try {
      const r = await plugin.getPairedDevices();
      return r.devices;
    } catch { return []; }
  },

  async connect(address: string): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    try {
      await plugin.connect({ address });
      return true;
    } catch (e) {
      console.error('Printer connect error:', e);
      return false;
    }
  },

  async disconnect(): Promise<void> {
    const plugin = this.getPlugin();
    if (!plugin) return;
    try { await plugin.disconnect(); } catch {}
  },

  async isConnected(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    try {
      const r = await plugin.isConnected();
      return r.value;
    } catch { return false; }
  },

  async printReceipt(tx: Transaction, paperWidth: 58 | 80 = 58): Promise<boolean> {
    const charWidth = paperWidth === 80 ? 48 : 32;
    const bytes = buildReceiptBytes(tx, charWidth);

    if (!this.isNative()) {
      // Web/dev mode: open print window
      this.webPrintFallback(tx);
      return true;
    }

    const plugin = this.getPlugin();
    if (!plugin) {
      console.warn('BluetoothPrinter plugin not available');
      return false;
    }

    // Convert Uint8Array to base64
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    const base64Data = btoa(binary);

    try {
      await plugin.print({ data: base64Data });
      return true;
    } catch (e) {
      console.error('Print error:', e);
      return false;
    }
  },

  // Web fallback for development
  webPrintFallback(tx: Transaction) {
    const fmt = DataService.formatCurrency;
    const payLabel: Record<string, string> = {
      tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank', edc_bca: 'EDC BCA'
    };
    const items = tx.items.map(c =>
      `<div class="row"><span>${c.name} ×${c.qty}</span><span>${fmt(c.price * c.qty)}</span></div>`
    ).join('');

    const payDetail = tx.paymentMethod === 'tunai'
      ? `<div class="row"><span>Tunai</span><span>${fmt(tx.cash ?? 0)}</span></div>
         <div class="row bold green"><span>Kembalian</span><span>${fmt(tx.kembalian ?? 0)}</span></div>`
      : tx.paymentMethod === 'qris'
      ? `<div class="row"><span>QRIS Ref</span><span>${tx.referenceNo ?? '-'}</span></div>`
      : tx.paymentMethod === 'edc_bca'
      ? `<div class="row"><span>Approval</span><span>${tx.edcApprovalCode ?? '-'}</span></div>
         <div class="row"><span>Ref</span><span>${tx.referenceNo ?? '-'}</span></div>`
      : `<div class="row"><span>Bank Ref</span><span>${tx.referenceNo ?? '-'}</span></div>`;

    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>Struk ${tx.no}</title>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@700&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'JetBrains Mono',monospace;font-size:12px;color:#2c2c2a;padding:20px;max-width:320px;margin:0 auto;background:#fff}
        .center{text-align:center}.bold{font-weight:700}.green{color:#1D9E75}.gray{color:#888780}
        .row{display:flex;justify-content:space-between;margin-bottom:5px}
        hr{border:none;border-top:1px dashed #d3d1c7;margin:10px 0}
        .title{font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;color:#1D9E75;letter-spacing:-0.5px}
        @media print{@page{margin:3mm;size:80mm auto}}
      </style></head><body>
      <div class="center" style="margin-bottom:14px">
        <div class="title">iKASIR</div>
        <div class="gray" style="font-size:11px">Toko Serba Ada · Jakarta</div>
        <div class="gray" style="font-size:10px;margin-top:2px">${tx.date}</div>
        <div class="gray" style="font-size:10px">No: ${tx.no} · Kasir: ${tx.kasir}</div>
        <div class="gray" style="font-size:10px">Pembayaran: ${payLabel[tx.paymentMethod]}</div>
      </div>
      <hr>${items}<hr>
      <div class="row gray"><span>Subtotal</span><span>${fmt(tx.subtotal)}</span></div>
      <div class="row gray"><span>Pajak 10%</span><span>${fmt(tx.tax)}</span></div>
      <div class="row bold" style="font-size:15px;margin:8px 0 4px"><span>Total</span><span class="green">${fmt(tx.total)}</span></div>
      <hr>${payDetail}
      <div class="center gray" style="margin-top:16px;font-size:11px">Terima kasih atas kunjungan Anda!<br>Barang yang sudah dibeli tidak dapat dikembalikan.</div>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
      </body></html>`);
    win.document.close();
  }
};
