import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikasir.app',
  appName: 'iKasir',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1D9E75'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'Mencari Printer...',
        cancel: 'Batal',
        availableDevices: 'Printer Tersedia',
        noDeviceFound: 'Printer tidak ditemukan'
      }
    }
  }
};

export default config;
