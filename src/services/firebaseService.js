/**
 * Firebase Realtime Database Service for Billex / Weknd POS
 * Database URL: https://wallet-830a8-default-rtdb.firebaseio.com/
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  remove, 
  onValue 
} from 'firebase/database';

export const DEFAULT_FIREBASE_CONFIG = {
  databaseURL: 'https://wallet-830a8-default-rtdb.firebaseio.com',
  projectId: 'wallet-830a8',
  authDomain: 'wallet-830a8.firebaseapp.com',
  apiKey: '',
  autoSync: true,
};

const STORAGE_KEY_FIREBASE = 'weknd_firebase_config';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.config = this.loadConfig();
    this.status = 'idle'; // 'idle' | 'connecting' | 'connected' | 'permission_denied' | 'error'
    this.lastSyncTime = null;
    this.lastError = null;
    this.subscribers = new Set();
    this.liveUnsubscribers = [];

    // Initialize automatically
    this.init();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIREBASE);
      if (saved) return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(saved) };
    } catch (_) {}
    return { ...DEFAULT_FIREBASE_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(this.config));
    this.init();
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => {
      try { cb(state); } catch (_) {}
    });
  }

  getState() {
    return {
      status: this.status,
      databaseURL: this.config.databaseURL,
      projectId: this.config.projectId,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      isConfigured: Boolean(this.config.databaseURL),
      autoSync: this.config.autoSync,
    };
  }

  init() {
    if (!this.config.databaseURL) {
      this.status = 'idle';
      this.notify();
      return;
    }

    try {
      this.status = 'connecting';
      this.lastError = null;
      this.notify();

      // Check if already initialized
      const appName = 'billex-app';
      const existingApps = getApps();
      const existing = existingApps.find(a => a.name === appName);

      if (existing) {
        this.app = existing;
      } else {
        this.app = initializeApp({
          databaseURL: this.config.databaseURL,
          projectId: this.config.projectId,
          authDomain: this.config.authDomain,
          apiKey: this.config.apiKey || 'AIzaSyFakeKeyForRTDBDirect',
        }, appName);
      }

      this.db = getDatabase(this.app, this.config.databaseURL);
      
      // Test connection & listen to status
      this.testConnection();
    } catch (err) {
      console.error('[Firebase] Init Error:', err);
      this.status = 'error';
      this.lastError = err.message || 'Initialization failed';
      this.notify();
    }
  }

  async testConnection() {
    if (!this.db) return false;
    try {
      // Test reading metadata node
      const metaRef = ref(this.db, 'billex/_ping');
      await set(metaRef, { timestamp: Date.now(), client: 'Billex Web POS' });
      
      this.status = 'connected';
      this.lastError = null;
      this.lastSyncTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.notify();
      return true;
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Permission denied')) {
        this.status = 'permission_denied';
        this.lastError = 'Permission Denied: Firebase Realtime Database rules require public read/write or auth.';
      } else {
        this.status = 'error';
        this.lastError = msg;
      }
      this.notify();
      return false;
    }
  }

  // --- Realtime Cloud Operations ---

  async saveProduct(product) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const prodRef = ref(this.db, `billex/products/${product.id}`);
      await set(prodRef, product);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  async deleteProduct(productId) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const prodRef = ref(this.db, `billex/products/${productId}`);
      await remove(prodRef);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  async saveSale(sale) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const saleRef = ref(this.db, `billex/sales/${sale.id}`);
      await set(saleRef, sale);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  async deleteSale(saleId) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const saleRef = ref(this.db, `billex/sales/${saleId}`);
      await remove(saleRef);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  async saveCustomer(customer) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const custRef = ref(this.db, `billex/customers/${customer.id}`);
      await set(custRef, customer);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  async saveSettings(settings) {
    if (!this.db || this.status === 'permission_denied') return;
    try {
      const settRef = ref(this.db, 'billex/settings');
      await set(settRef, settings);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
    }
  }

  /**
   * Push entire local catalog and data up to Firebase Realtime Database
   */
  async pushAllLocalData({ products, categories, sales, customers, settings }) {
    if (!this.db) throw new Error('Firebase database is not initialized');
    try {
      this.status = 'connecting';
      this.notify();

      const rootRef = ref(this.db, 'billex');
      
      // Convert arrays to indexed objects for clean RTDB structure
      const prodsMap = {};
      (products || []).forEach(p => { if (p.id) prodsMap[p.id] = p; });

      const salesMap = {};
      (sales || []).forEach(s => { if (s.id) salesMap[s.id] = s; });

      const custMap = {};
      (customers || []).forEach(c => { if (c.id) custMap[c.id] = c; });

      const payload = {
        products: prodsMap,
        categories: categories || [],
        sales: salesMap,
        customers: custMap,
        settings: settings || {},
        updatedAt: new Date().toISOString(),
        syncedBy: 'Billex Web POS',
      };

      await set(rootRef, payload);

      this.status = 'connected';
      this.lastError = null;
      this.lastSyncTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.notify();

      return { success: true, count: products.length };
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Pull entire database down from Firebase
   */
  async fetchAllData() {
    if (!this.db) throw new Error('Firebase database is not initialized');
    try {
      const rootRef = ref(this.db, 'billex');
      const snapshot = await get(rootRef);
      if (!snapshot.exists()) return null;

      const data = snapshot.val();
      
      // Normalize objects back to arrays
      const products = data.products ? Object.values(data.products) : null;
      const sales = data.sales ? Object.values(data.sales) : null;
      const customers = data.customers ? Object.values(data.customers) : null;
      const categories = data.categories || null;
      const settings = data.settings || null;

      this.status = 'connected';
      this.lastError = null;
      this.lastSyncTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.notify();

      return { products, categories, sales, customers, settings };
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start live synchronization for multi-device sync
   */
  startLiveSync(onDataUpdate) {
    if (!this.db || !this.config.autoSync) return;
    this.stopLiveSync();

    try {
      // Products live listener
      const prodsRef = ref(this.db, 'billex/products');
      const unsubProds = onValue(prodsRef, (snapshot) => {
        if (snapshot.exists()) {
          const prods = Object.values(snapshot.val());
          if (onDataUpdate) onDataUpdate({ type: 'products', data: prods });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubProds);

      // Sales live listener
      const salesRef = ref(this.db, 'billex/sales');
      const unsubSales = onValue(salesRef, (snapshot) => {
        if (snapshot.exists()) {
          const sales = Object.values(snapshot.val());
          if (onDataUpdate) onDataUpdate({ type: 'sales', data: sales });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubSales);
    } catch (err) {
      this.handleError(err);
    }
  }

  stopLiveSync() {
    this.liveUnsubscribers.forEach(unsub => {
      try { unsub(); } catch (_) {}
    });
    this.liveUnsubscribers = [];
  }

  handleError(err) {
    console.warn('[Firebase RTDB]:', err);
    const msg = err.message || String(err);
    if (msg.includes('PERMISSION_DENIED') || msg.includes('Permission denied')) {
      this.status = 'permission_denied';
      this.lastError = 'Firebase Rules: Set .read and .write to true in your Firebase Console.';
    } else {
      this.status = 'error';
      this.lastError = msg;
    }
    this.notify();
  }
}

export const firebaseService = new FirebaseService();
