package com.ikasir.app

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.io.IOException
import java.io.OutputStream
import java.util.UUID
import android.util.Base64
import kotlinx.coroutines.*

private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = [
        Permission(strings = [Manifest.permission.BLUETOOTH], alias = "bluetooth"),
        Permission(strings = [Manifest.permission.BLUETOOTH_ADMIN], alias = "bluetoothAdmin"),
        Permission(strings = [Manifest.permission.BLUETOOTH_CONNECT], alias = "bluetoothConnect"),
        Permission(strings = [Manifest.permission.BLUETOOTH_SCAN], alias = "bluetoothScan"),
    ]
)
class BluetoothPrinterPlugin : Plugin() {

    private var bluetoothAdapter: BluetoothAdapter? = null
    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun load() {
        val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = manager.adapter
    }

    // ── isEnabled ─────────────────────────────────────────────────────────────
    @PluginMethod
    fun isEnabled(call: PluginCall) {
        val result = JSObject()
        result.put("value", bluetoothAdapter?.isEnabled == true)
        call.resolve(result)
    }

    // ── requestEnable ─────────────────────────────────────────────────────────
    @PluginMethod
    fun requestEnable(call: PluginCall) {
        if (!checkBtPermission()) {
            requestBtPermission(call)
            return
        }
        if (bluetoothAdapter?.isEnabled == false) {
            val intent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            activity.startActivityForResult(intent, REQUEST_ENABLE_BT)
        }
        call.resolve()
    }

    // ── getPairedDevices ──────────────────────────────────────────────────────
    @PluginMethod
    fun getPairedDevices(call: PluginCall) {
        if (!checkBtPermission()) {
            call.reject("Bluetooth permission denied")
            return
        }
        val devices = JSArray()
        try {
            bluetoothAdapter?.bondedDevices?.forEach { device ->
                val obj = JSObject()
                obj.put("name", device.name ?: "Unknown")
                obj.put("address", device.address)
                obj.put("deviceId", device.address)
                obj.put("bonded", true)
                obj.put("type", device.type.toString())
                devices.put(obj)
            }
        } catch (e: SecurityException) {
            call.reject("Security exception: ${e.message}")
            return
        }
        val result = JSObject()
        result.put("devices", devices)
        call.resolve(result)
    }

    // ── connect ───────────────────────────────────────────────────────────────
    @PluginMethod
    fun connect(call: PluginCall) {
        if (!checkBtPermission()) {
            call.reject("Bluetooth permission denied")
            return
        }
        val address = call.getString("address") ?: run {
            call.reject("Missing address parameter")
            return
        }

        scope.launch {
            try {
                // Disconnect existing
                disconnectInternal()

                val device: BluetoothDevice = bluetoothAdapter!!.getRemoteDevice(address)
                bluetoothAdapter?.cancelDiscovery()

                val s = device.createRfcommSocketToServiceRecord(SPP_UUID)
                s.connect()
                socket = s
                outputStream = s.outputStream

                withContext(Dispatchers.Main) { call.resolve() }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject("Connection failed: ${e.message}")
                }
            }
        }
    }

    // ── disconnect ────────────────────────────────────────────────────────────
    @PluginMethod
    fun disconnect(call: PluginCall) {
        scope.launch {
            disconnectInternal()
            withContext(Dispatchers.Main) { call.resolve() }
        }
    }

    // ── isConnected ───────────────────────────────────────────────────────────
    @PluginMethod
    fun isConnected(call: PluginCall) {
        val result = JSObject()
        result.put("value", socket?.isConnected == true)
        call.resolve(result)
    }

    // ── getConnectedDevice ────────────────────────────────────────────────────
    @PluginMethod
    fun getConnectedDevice(call: PluginCall) {
        val s = socket
        if (s == null || !s.isConnected) {
            call.resolve(null)
            return
        }
        val result = JSObject()
        try {
            result.put("name", s.remoteDevice.name ?: "Unknown")
            result.put("address", s.remoteDevice.address)
            result.put("deviceId", s.remoteDevice.address)
        } catch (e: SecurityException) {
            result.put("name", "Unknown")
            result.put("address", "")
            result.put("deviceId", "")
        }
        call.resolve(result)
    }

    // ── print ─────────────────────────────────────────────────────────────────
    /**
     * Receives base64-encoded ESC/POS byte stream.
     * Decodes and writes to the Bluetooth output stream.
     */
    @PluginMethod
    fun print(call: PluginCall) {
        val os = outputStream
        if (os == null || socket?.isConnected != true) {
            call.reject("Printer not connected")
            return
        }

        val base64Data = call.getString("data") ?: run {
            call.reject("Missing data parameter")
            return
        }

        scope.launch {
            try {
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                os.write(bytes)
                os.flush()
                withContext(Dispatchers.Main) { call.resolve() }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    call.reject("Print failed: ${e.message}")
                }
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private fun disconnectInternal() {
        try { outputStream?.close() } catch (_: Exception) {}
        try { socket?.close()       } catch (_: Exception) {}
        outputStream = null
        socket = null
    }

    private fun checkBtPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) ==
                PackageManager.PERMISSION_GRANTED
        } else {
            ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH) ==
                PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestBtPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAlias("bluetoothConnect", call, "bluetoothPermissionCallback")
        } else {
            requestPermissionForAlias("bluetooth", call, "bluetoothPermissionCallback")
        }
    }

    @PermissionCallback
    private fun bluetoothPermissionCallback(call: PluginCall) {
        if (checkBtPermission()) {
            call.resolve()
        } else {
            call.reject("Bluetooth permission denied by user")
        }
    }

    override fun handleOnDestroy() {
        disconnectInternal()
        scope.cancel()
        super.handleOnDestroy()
    }

    companion object {
        private const val REQUEST_ENABLE_BT = 1001
    }
}
