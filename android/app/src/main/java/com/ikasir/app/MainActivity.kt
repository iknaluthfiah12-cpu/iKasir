package com.ikasir.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

/**
 * iKasir Main Activity
 *
 * Registers all Capacitor plugins including:
 * - BluetoothPrinterPlugin  → ESC/POS thermal printer via BT Classic (SPP)
 */
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom plugins BEFORE calling super.onCreate()
        registerPlugin(BluetoothPrinterPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
