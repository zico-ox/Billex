/**
 * Dedicated Printer Service & Adapter for EXEO EX58P (M58.E-Z10-AD)
 * Supports Web Bluetooth, Web Serial (USB), Local Bridge, and Android Bridge
 */

import { generateReceiptEscPosBytes } from './escpos';

const BT_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

const BT_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

class PrinterService {
  constructor() {
    this.connectionType = localStorage.getItem('billex_printer_type') || 'web-bluetooth';
    this.printerName = localStorage.getItem('billex_printer_name') || 'EXEO EX58P';
    this.bridgeUrl = localStorage.getItem('billex_printer_bridge_url') || 'http://localhost:3030';
    this.baudRate = Number(localStorage.getItem('billex_printer_baud')) || 9600;
    
    this.btDevice = null;
    this.btCharacteristic = null;
    this.serialPort = null;
    this.isConnected = false;
    this.lastError = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn({
      connectionType: this.connectionType,
      printerName: this.printerName,
      isConnected: this.isConnected,
      lastError: this.lastError,
    }));
  }

  setConnectionType(type) {
    this.connectionType = type;
    localStorage.setItem('billex_printer_type', type);
    this.notify();
  }

  async connectBluetooth() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported in this browser. Please use Chrome/Edge on PC or Android.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_SERVICE_UUIDS,
      });

      const server = await device.gatt.connect();
      let targetChar = null;

      for (const sUuid of BT_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(sUuid);
          for (const cUuid of BT_CHARACTERISTIC_UUIDS) {
            try {
              const char = await service.getCharacteristic(cUuid);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                targetChar = char;
                break;
              }
            } catch (_) {}
          }
          if (targetChar) break;
        } catch (_) {}
      }

      if (!targetChar) {
        throw new Error('Write characteristic not found on Bluetooth device.');
      }

      this.btDevice = device;
      this.btCharacteristic = targetChar;
      this.printerName = device.name || 'EXEO EX58P';
      localStorage.setItem('billex_printer_name', this.printerName);
      this.isConnected = true;
      this.lastError = null;
      this.notify();
      return { success: true, name: this.printerName };
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      this.notify();
      throw err;
    }
  }

  async connectSerial() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial USB is not supported in this browser. Please use Chrome or Edge on Windows.');
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: this.baudRate || 9600 });
      this.serialPort = port;
      this.isConnected = true;
      this.printerName = 'EXEO EX58P (USB)';
      this.lastError = null;
      this.notify();
      return { success: true, name: this.printerName };
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      this.notify();
      throw err;
    }
  }

  async sendRawBytes(bytes) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);

    if (this.connectionType === 'web-bluetooth') {
      if (!this.btCharacteristic || !this.isConnected) {
        await this.connectBluetooth();
      }
      const CHUNK_SIZE = 64;
      let offset = 0;
      while (offset < bytes.length) {
        const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
        if (this.btCharacteristic.writeValueWithResponse) {
          await this.btCharacteristic.writeValueWithResponse(chunk);
        } else {
          await this.btCharacteristic.writeValueWithoutResponse(chunk);
          await new Promise(r => setTimeout(r, 20));
        }
        offset += CHUNK_SIZE;
      }
      return { success: true, message: 'Confirmed: ESC/POS receipt printed on EXEO EX58P' };
    } 
    
    if (this.connectionType === 'web-serial') {
      if (!this.serialPort || !this.serialPort.writable) {
        await this.connectSerial();
      }
      const writer = this.serialPort.writable.getWriter();
      await writer.write(bytes);
      writer.releaseLock();
      return { success: true, message: 'Confirmed: ESC/POS receipt printed via USB' };
    }

    if (this.connectionType === 'local-bridge') {
      const base64Data = btoa(String.fromCharCode(...bytes));
      const res = await fetch(`${this.bridgeUrl}/api/printer/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64Data, printerName: this.printerName }),
      });
      if (!res.ok) throw new Error(`Bridge returned HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Print failed on bridge');
      this.isConnected = true;
      return { success: true, message: 'Confirmed: Printed via Local Bridge' };
    }

    if (this.connectionType === 'android-bridge') {
      const base64Data = btoa(String.fromCharCode(...bytes));
      if (window.AndroidPrinterBridge && typeof window.AndroidPrinterBridge.printEscPos === 'function') {
        const ok = window.AndroidPrinterBridge.printEscPos(base64Data);
        if (ok) return { success: true, message: 'Confirmed: Printed via Android Bridge' };
        throw new Error('Android bridge reported print failure');
      }
      // RawBT intent fallback
      window.location.href = `rawbt:data:application/octet-stream;base64,${base64Data}`;
      return { success: true, message: 'Sent to Android RawBT Print application' };
    }

    throw new Error(`Unsupported printer adapter: ${this.connectionType}`);
  }

  async printReceipt(sale, settings = {}) {
    const bytes = generateReceiptEscPosBytes(sale, settings);
    return await this.sendRawBytes(bytes);
  }
}

export const printerService = new PrinterService();
