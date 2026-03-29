package com.ikasir.app

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.OutputStream
import java.util.UUID

@CapacitorPlugin(name = "BluetoothPrinter")
class BluetoothPrinterPlugin : Plugin() {

    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private val adapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()

    @PluginMethod
    fun isEnabled(call: PluginCall) {
        val result = JSObject()
        result.put("value", adapter?.isEnabled == true)
        call.resolve(result)
    }

    @PluginMethod
    fun requestEnable(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun getPairedDevices(call: PluginCall) {
        val devices = JSArray()
        adapter?.bondedDevices?.forEach { device ->
            val obj = JSObject()
            obj.put("name", device.name ?: "Unknown")
            obj.put("address", device.address)
            obj.put("deviceId", device.address)
            obj.put("bonded", true)
            obj.put("type", "classic")
            devices.put(obj)
        }
        val result = JSObject()
        result.put("devices", devices)
        call.resolve(result)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val address = call.getString("address") ?: return call.reject("No address")
        Thread {
            try {
                socket?.close()
                val device: BluetoothDevice = adapter!!.getRemoteDevice(address)
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                adapter.cancelDiscovery()
                socket!!.connect()
                outputStream = socket!!.outputStream
                call.resolve()
            } catch (e: Exception) {
                call.reject("Connect failed: ${e.message}")
            }
        }.start()
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        try {
            outputStream?.close()
            socket?.close()
            outputStream = null
            socket = null
        } catch (_: Exception) {}
        call.resolve()
    }

    @PluginMethod
    fun isConnected(call: PluginCall) {
        val result = JSObject()
        result.put("value", socket?.isConnected == true)
        call.resolve(result)
    }

    @PluginMethod
    fun print(call: PluginCall) {
        val data = call.getString("data") ?: return call.reject("No data")
        Thread {
            try {
                val bytes = Base64.decode(data, Base64.DEFAULT)
                outputStream?.write(bytes)
                outputStream?.flush()
                call.resolve()
            } catch (e: Exception) {
                call.reject("Print failed: ${e.message}")
            }
        }.start()
    }
}
