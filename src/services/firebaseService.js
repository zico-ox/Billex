/**
 * Firebase Realtime Database Service for Billex / Weknd POS
 * Database URL: https://wallet-830a8-default-rtdb.firebaseio.com/
 * All store data (Products, Sales, Categories, Expenses, Settings) is driven purely by Firebase.
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
    } catch {
      // ignore
    }
    return { ...DEFAULT_FIREBASE_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(this.config));
    } catch {
      // ignore
    }
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
      try { cb(state); } catch {
        // ignore subscriber errors
      }
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
      
      // Test connection
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

  // --- Realtime Cloud Operations (CRUD) ---

  // PRODUCTS
  async getProducts() {
    if (!this.db) return [];
    try {
      const prodsRef = ref(this.db, 'billex/products');
      const snapshot = await get(prodsRef);
      if (!snapshot.exists()) return [];
      const val = snapshot.val();
      return Object.values(val);
    } catch (err) {
      this.handleError(err);
      return [];
    }
  }

  async saveProduct(product) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const prodRef = ref(this.db, `billex/products/${product.id}`);
      await set(prodRef, product);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return product;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  async deleteProduct(productId) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const prodRef = ref(this.db, `billex/products/${productId}`);
      await remove(prodRef);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  // CATEGORIES
  async getCategories() {
    if (!this.db) return [];
    try {
      const catsRef = ref(this.db, 'billex/categories');
      const snapshot = await get(catsRef);
      if (!snapshot.exists()) return [];
      const val = snapshot.val();
      return Array.isArray(val) ? val : Object.values(val);
    } catch (err) {
      this.handleError(err);
      return [];
    }
  }

  async saveCategories(categories) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const catsRef = ref(this.db, 'billex/categories');
      await set(catsRef, categories);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  // SALES
  async getSales() {
    if (!this.db) return [];
    try {
      const salesRef = ref(this.db, 'billex/sales');
      const snapshot = await get(salesRef);
      if (!snapshot.exists()) return [];
      const val = snapshot.val();
      const list = Object.values(val);
      list.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
      return list;
    } catch (err) {
      this.handleError(err);
      return [];
    }
  }

  async saveSale(sale) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const saleRef = ref(this.db, `billex/sales/${sale.id}`);
      await set(saleRef, sale);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return sale;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  async deleteSale(saleId) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const saleRef = ref(this.db, `billex/sales/${saleId}`);
      await remove(saleRef);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  // EXPENSES
  async getExpenses() {
    if (!this.db) return [];
    try {
      const expRef = ref(this.db, 'billex/expenses');
      const snapshot = await get(expRef);
      if (!snapshot.exists()) return [];
      const val = snapshot.val();
      const list = Object.values(val);
      list.sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      return list;
    } catch (err) {
      this.handleError(err);
      return [];
    }
  }

  async saveExpense(expense) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const expRef = ref(this.db, `billex/expenses/${expense.id}`);
      await set(expRef, expense);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return expense;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  async deleteExpense(expenseId) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const expRef = ref(this.db, `billex/expenses/${expenseId}`);
      await remove(expRef);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  // SETTINGS
  async getSettings() {
    if (!this.db) return null;
    try {
      const settRef = ref(this.db, 'billex/settings');
      const snapshot = await get(settRef);
      if (!snapshot.exists()) return null;
      return snapshot.val();
    } catch (err) {
      this.handleError(err);
      return null;
    }
  }

  async saveSettings(settings) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const settRef = ref(this.db, 'billex/settings');
      await set(settRef, settings);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return settings;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  // CUSTOMERS
  async getCustomers() {
    if (!this.db) return [];
    try {
      const custRef = ref(this.db, 'billex/customers');
      const snapshot = await get(custRef);
      if (!snapshot.exists()) return [];
      return Object.values(snapshot.val());
    } catch (err) {
      this.handleError(err);
      return [];
    }
  }

  async saveCustomer(customer) {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const custRef = ref(this.db, `billex/customers/${customer.id}`);
      await set(custRef, customer);
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return customer;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start live synchronization for multi-device sync across all entities
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
        } else {
          if (onDataUpdate) onDataUpdate({ type: 'products', data: [] });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubProds);

      // Categories live listener
      const catsRef = ref(this.db, 'billex/categories');
      const unsubCats = onValue(catsRef, (snapshot) => {
        if (snapshot.exists()) {
          const cats = snapshot.val();
          const list = Array.isArray(cats) ? cats : Object.values(cats);
          if (onDataUpdate) onDataUpdate({ type: 'categories', data: list });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubCats);

      // Sales live listener
      const salesRef = ref(this.db, 'billex/sales');
      const unsubSales = onValue(salesRef, (snapshot) => {
        if (snapshot.exists()) {
          const sales = Object.values(snapshot.val());
          sales.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
          if (onDataUpdate) onDataUpdate({ type: 'sales', data: sales });
        } else {
          if (onDataUpdate) onDataUpdate({ type: 'sales', data: [] });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubSales);

      // Expenses live listener
      const expRef = ref(this.db, 'billex/expenses');
      const unsubExp = onValue(expRef, (snapshot) => {
        if (snapshot.exists()) {
          const exp = Object.values(snapshot.val());
          exp.sort((a, b) => {
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          if (onDataUpdate) onDataUpdate({ type: 'expenses', data: exp });
        } else {
          if (onDataUpdate) onDataUpdate({ type: 'expenses', data: [] });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubExp);

      // Settings live listener
      const settRef = ref(this.db, 'billex/settings');
      const unsubSett = onValue(settRef, (snapshot) => {
        if (snapshot.exists()) {
          const sett = snapshot.val();
          if (onDataUpdate) onDataUpdate({ type: 'settings', data: sett });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubSett);

      // Customers live listener
      const custRef = ref(this.db, 'billex/customers');
      const unsubCust = onValue(custRef, (snapshot) => {
        if (snapshot.exists()) {
          const custs = Object.values(snapshot.val());
          if (onDataUpdate) onDataUpdate({ type: 'customers', data: custs });
        } else {
          if (onDataUpdate) onDataUpdate({ type: 'customers', data: [] });
        }
      }, (err) => this.handleError(err));
      this.liveUnsubscribers.push(unsubCust);

    } catch (err) {
      this.handleError(err);
    }
  }

  stopLiveSync() {
    this.liveUnsubscribers.forEach(unsub => {
      try { unsub(); } catch {
        // ignore
      }
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
