/**
 * Storage Service for Billex / Weknd POS
 * Optimized Local-First Architecture:
 * - Products, Categories, Settings & Customer balances are cached in localStorage
 * - Products sync uses a lightweight version stamp (0 KB downloaded when unchanged)
 * - Sales and Expenses use local-first storage merged with cloud recent queries
 * - Atomic bill counter eliminates scanning sales database
 */

import { firebaseService } from './firebaseService';

const DEFAULT_SETTINGS = {
  shopName: 'Weknd.',
  subTitle: 'Juice & Rolls',
  address: 'Shop 4, Main Street',
  phone: '98765-43210',
  receiptFooter: 'THANK YOU!\n@weknd.official',
  printerType: 'web-bluetooth',
  printerName: 'EXEO EX58P',
  feedLines: 4,
  showPaymentModal: true,
};

const STORAGE_KEYS = {
  PRODUCTS: 'billex_cached_products',
  CATEGORIES: 'billex_cached_categories',
  PRODUCTS_VERSION: 'billex_products_version',
  SALES: 'billex_cached_sales',
  EXPENSES: 'billex_cached_expenses',
  SETTINGS: 'billex_cached_settings',
  CUSTOMERS: 'billex_cached_customers',
  LAST_BILL_NO: 'billex_last_bill_no',
};

const getLocal = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`[LocalCache] Failed to save ${key}:`, err);
  }
};

class StorageService {
  // =========================================================================
  // PRODUCTS (Local-First with Remote Version Stamp)
  // =========================================================================

  getCachedProducts() {
    return getLocal(STORAGE_KEYS.PRODUCTS, []);
  }

  async getProducts(forceRefresh = false) {
    const cached = this.getCachedProducts();
    if (cached && cached.length > 0 && !forceRefresh) {
      return cached;
    }
    try {
      const prods = await firebaseService.getProducts();
      if (prods && prods.length > 0) {
        setLocal(STORAGE_KEYS.PRODUCTS, prods);
      }
      return prods || cached || [];
    } catch {
      return cached || [];
    }
  }

  async syncProductsIfVersionChanged(remoteVersion) {
    const localVersion = Number(localStorage.getItem(STORAGE_KEYS.PRODUCTS_VERSION)) || 0;
    const cached = this.getCachedProducts();

    if (remoteVersion && remoteVersion === localVersion && cached && cached.length > 0) {
      return { updated: false, products: cached };
    }

    try {
      const [prods, cats] = await Promise.all([
        firebaseService.getProducts(),
        firebaseService.getCategories(),
      ]);

      if (prods && prods.length > 0) {
        setLocal(STORAGE_KEYS.PRODUCTS, prods);
      }
      if (cats && cats.length > 0) {
        setLocal(STORAGE_KEYS.CATEGORIES, cats);
      }
      if (remoteVersion) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS_VERSION, String(remoteVersion));
      }

      return { updated: true, products: prods || cached || [], categories: cats || [] };
    } catch {
      return { updated: false, products: cached || [] };
    }
  }

  async saveProduct(prod) {
    const id = prod.id || `p_${Date.now()}`;
    const clean = {
      ...prod,
      id,
      sellingPrice: Number(prod.sellingPrice) || 0,
      purchasePrice: Number(prod.purchasePrice) || Math.round((Number(prod.sellingPrice) || 0) * 0.65),
      stock: Number(prod.stock) || 50,
      status: prod.status || 'Active',
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately update local cache
    const current = this.getCachedProducts();
    const index = current.findIndex(p => p.id === id);
    const updated = index >= 0 
      ? current.map(p => p.id === id ? clean : p)
      : [clean, ...current];
    setLocal(STORAGE_KEYS.PRODUCTS, updated);

    // 2. Save to cloud asynchronously
    try {
      await firebaseService.saveProduct(clean);
      const newVersion = Date.now();
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_VERSION, String(newVersion));
    } catch (err) {
      console.warn('[Storage] Cloud save product failed, cached locally:', err);
    }

    return clean;
  }

  async deleteProduct(id) {
    // 1. Immediately remove from local cache
    const current = this.getCachedProducts();
    const filtered = current.filter(p => p.id !== id);
    setLocal(STORAGE_KEYS.PRODUCTS, filtered);

    // 2. Cloud delete
    try {
      await firebaseService.deleteProduct(id);
      const newVersion = Date.now();
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_VERSION, String(newVersion));
    } catch (err) {
      console.warn('[Storage] Cloud delete product failed:', err);
    }

    return filtered;
  }

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  getCachedCategories() {
    return getLocal(STORAGE_KEYS.CATEGORIES, ['All Items']);
  }

  async getCategories(forceRefresh = false) {
    const cached = this.getCachedCategories();
    if (cached && cached.length > 1 && !forceRefresh) {
      return cached;
    }

    try {
      const cats = await firebaseService.getCategories();
      if (cats && cats.length > 0) {
        const fullCats = cats.includes('All Items') ? cats : ['All Items', ...cats];
        setLocal(STORAGE_KEYS.CATEGORIES, fullCats);
        return fullCats;
      }
    } catch {
      // ignore
    }

    // Derive dynamically from cached products
    const prods = this.getCachedProducts();
    const unique = new Set(['All Items']);
    prods.forEach(p => {
      if (p.category) unique.add(p.category);
    });
    const derived = Array.from(unique);
    setLocal(STORAGE_KEYS.CATEGORIES, derived);
    return derived;
  }

  async saveCategories(categories) {
    setLocal(STORAGE_KEYS.CATEGORIES, categories);
    try {
      await firebaseService.saveCategories(categories);
    } catch (err) {
      console.warn('[Storage] Cloud save categories failed:', err);
    }
    return categories;
  }

  // =========================================================================
  // SALES (Local-First Master Store with Merging)
  // =========================================================================

  getCachedSales() {
    return getLocal(STORAGE_KEYS.SALES, []);
  }

  async getSales(forceAllFromCloud = false) {
    const cached = this.getCachedSales();
    if (!forceAllFromCloud && cached && cached.length > 0) {
      return cached;
    }

    try {
      const cloudSales = await firebaseService.getAllSales();
      if (cloudSales && cloudSales.length > 0) {
        return this.mergeSales(cloudSales);
      }
    } catch {
      // ignore
    }
    return cached;
  }

  mergeSales(incomingSales = []) {
    const current = this.getCachedSales();
    const map = new Map();

    // Existing local sales first
    current.forEach(s => {
      if (s && s.id) map.set(s.id, s);
    });

    // Incoming recent or cloud sales overwrite/add
    incomingSales.forEach(s => {
      if (s && s.id) map.set(s.id, s);
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

    // Cap local sales archive to 2,500 records to prevent localStorage overflow
    const trimmed = merged.slice(0, 2500);
    setLocal(STORAGE_KEYS.SALES, trimmed);
    return trimmed;
  }

  // =========================================================================
  // BILL NUMBER GENERATION (Atomic Counter - Zero Sales Download)
  // =========================================================================

  async getLastBillNumber(customSales = null) {
    // 1. Check local counter first
    const cached = Number(localStorage.getItem(STORAGE_KEYS.LAST_BILL_NO));
    if (cached && !isNaN(cached) && cached > 0) {
      return cached;
    }

    // 2. Derive from available sales in memory
    const sales = customSales || this.getCachedSales();
    if (sales && sales.length > 0) {
      let maxNum = 0;
      sales.forEach(s => {
        const match = String(s.billNo || '').match(/(\d+)/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      });
      if (maxNum > 0) {
        localStorage.setItem(STORAGE_KEYS.LAST_BILL_NO, String(maxNum));
        firebaseService.setLastBillNumber(maxNum);
        return maxNum;
      }
    }

    // 3. Fallback: check atomic cloud counter node
    try {
      const cloudCounter = await firebaseService.getLastBillNumber();
      if (cloudCounter && cloudCounter > 0) {
        localStorage.setItem(STORAGE_KEYS.LAST_BILL_NO, String(cloudCounter));
        return cloudCounter;
      }
    } catch {
      // ignore
    }

    return 0;
  }

  async getNextBillNumber(customSales = null) {
    const lastNum = await this.getLastBillNumber(customSales);
    const nextNum = lastNum + 1;
    return `WK${String(nextNum).padStart(4, '0')}`;
  }

  async completeSale(saleData) {
    const billNo = saleData.billNo || await this.getNextBillNumber();
    const match = String(billNo).match(/(\d+)/);
    const numericBillNo = match ? parseInt(match[1], 10) : 0;

    // Update atomic bill counter locally and on cloud immediately
    if (numericBillNo > 0) {
      localStorage.setItem(STORAGE_KEYS.LAST_BILL_NO, String(numericBillNo));
      firebaseService.setLastBillNumber(numericBillNo);
    }

    const saleId = `sale_${Date.now()}`;
    const timestamp = Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let profit = 0;
    (saleData.items || []).forEach(it => {
      const itemSell = Number(it.sellingPrice) || 0;
      const itemBuy = Number(it.purchasePrice) || Math.round(itemSell * 0.65);
      profit += (itemSell - itemBuy) * (Number(it.qty) || 1);
    });

    const fullSale = {
      ...saleData,
      id: saleId,
      billNo,
      date: dateStr,
      time: timeStr,
      timestamp,
      profit: Math.round(profit),
      createdAt: now.toISOString(),
      status: saleData.status || 'Completed',
    };

    // 1. Immediately store into local sales cache
    const currentSales = this.getCachedSales();
    const updatedSales = [fullSale, ...currentSales.filter(s => s.id !== saleId)];
    setLocal(STORAGE_KEYS.SALES, updatedSales);

    // 2. Upload to Firebase (write only - counts as 0 bytes download egress!)
    try {
      await firebaseService.saveSale(fullSale);
    } catch (err) {
      console.warn('[Storage] Cloud saveSale warning, bill safe in local cache:', err);
    }

    // 3. Update customer due if Credit payment
    if (saleData.paymentMethod === 'Credit' && saleData.customerId) {
      const custs = this.getCachedCustomers();
      const target = custs.find(c => c.id === saleData.customerId);
      if (target) {
        const updatedDue = (Number(target.dueAmount) || 0) + (Number(saleData.total) || 0);
        await this.saveCustomer({ ...target, dueAmount: updatedDue });
      }
    }

    return fullSale;
  }

  async updateSalePayment(saleId, paymentMethod, isConfirmed = true) {
    const currentSales = this.getCachedSales();
    const target = currentSales.find(s => s.id === saleId);
    if (!target) return null;

    const previousMethod = target.paymentMethod;
    const updated = { 
      ...target, 
      paymentMethod,
      paymentConfirmed: isConfirmed,
      isUnmarked: !isConfirmed
    };

    // 1. Update local cache
    const updatedList = currentSales.map(s => s.id === saleId ? updated : s);
    setLocal(STORAGE_KEYS.SALES, updatedList);

    // 2. Cloud write
    try {
      await firebaseService.saveSale(updated);
    } catch (err) {
      console.warn('[Storage] Cloud updateSalePayment failed:', err);
    }

    // 3. Adjust customer balance if credit mode changed
    if (paymentMethod === 'Credit' && target.customerId && previousMethod !== 'Credit') {
      const custs = this.getCachedCustomers();
      const cTarget = custs.find(c => c.id === target.customerId);
      if (cTarget) {
        const updatedDue = (Number(cTarget.dueAmount) || 0) + (Number(target.total) || 0);
        await this.saveCustomer({ ...cTarget, dueAmount: updatedDue });
      }
    } else if (previousMethod === 'Credit' && paymentMethod !== 'Credit' && target.customerId) {
      const custs = this.getCachedCustomers();
      const cTarget = custs.find(c => c.id === target.customerId);
      if (cTarget) {
        const updatedDue = Math.max(0, (Number(cTarget.dueAmount) || 0) - (Number(target.total) || 0));
        await this.saveCustomer({ ...cTarget, dueAmount: updatedDue });
      }
    }

    return updated;
  }

  async deleteSale(saleId) {
    const currentSales = this.getCachedSales();
    const filtered = currentSales.filter(s => s.id !== saleId);
    setLocal(STORAGE_KEYS.SALES, filtered);

    try {
      await firebaseService.deleteSale(saleId);
    } catch (err) {
      console.warn('[Storage] Cloud deleteSale failed:', err);
    }

    return filtered;
  }

  // =========================================================================
  // EXPENSES (Local-First Master Store with Merging)
  // =========================================================================

  getCachedExpenses() {
    return getLocal(STORAGE_KEYS.EXPENSES, []);
  }

  async getExpenses(forceAllFromCloud = false) {
    const cached = this.getCachedExpenses();
    if (!forceAllFromCloud && cached && cached.length > 0) {
      return cached;
    }

    try {
      const cloudExp = await firebaseService.getExpenses();
      if (cloudExp && cloudExp.length > 0) {
        return this.mergeExpenses(cloudExp);
      }
    } catch {
      // ignore
    }
    return cached;
  }

  mergeExpenses(incomingExpenses = []) {
    const current = this.getCachedExpenses();
    const map = new Map();

    current.forEach(e => {
      if (e && e.id) map.set(e.id, e);
    });

    incomingExpenses.forEach(e => {
      if (e && e.id) map.set(e.id, e);
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    setLocal(STORAGE_KEYS.EXPENSES, merged);
    return merged;
  }

  async saveExpense(expense) {
    const now = new Date();
    const dateStr = expense.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = expense.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const clean = {
      ...expense,
      id: expense.id || `exp_${Date.now()}`,
      title: (expense.title || 'General Expense').trim(),
      category: (expense.category || 'Utilities').trim(),
      amount: Number(expense.amount) || 0,
      date: dateStr,
      time: timeStr,
      createdAt: now.toISOString(),
    };

    // Local update
    const current = this.getCachedExpenses();
    const updated = [clean, ...current.filter(e => e.id !== clean.id)];
    setLocal(STORAGE_KEYS.EXPENSES, updated);

    // Cloud write
    try {
      await firebaseService.saveExpense(clean);
    } catch (err) {
      console.warn('[Storage] Cloud saveExpense failed:', err);
    }

    return clean;
  }

  async deleteExpense(id) {
    const current = this.getCachedExpenses();
    const filtered = current.filter(e => e.id !== id);
    setLocal(STORAGE_KEYS.EXPENSES, filtered);

    try {
      await firebaseService.deleteExpense(id);
    } catch (err) {
      console.warn('[Storage] Cloud deleteExpense failed:', err);
    }

    return filtered;
  }

  // =========================================================================
  // SETTINGS & CUSTOMERS
  // =========================================================================

  getCachedSettings() {
    return getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async getSettings(forceRefresh = false) {
    const cached = this.getCachedSettings();
    if (!forceRefresh && cached && cached.shopName) {
      return cached;
    }

    try {
      const cloudSettings = await firebaseService.getSettings();
      if (cloudSettings) {
        const merged = { ...DEFAULT_SETTINGS, ...cloudSettings };
        setLocal(STORAGE_KEYS.SETTINGS, merged);
        return merged;
      }
    } catch {
      // ignore
    }
    return cached || DEFAULT_SETTINGS;
  }

  async saveSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    setLocal(STORAGE_KEYS.SETTINGS, merged);
    try {
      await firebaseService.saveSettings(merged);
    } catch (err) {
      console.warn('[Storage] Cloud saveSettings failed:', err);
    }
    return merged;
  }

  getCachedCustomers() {
    return getLocal(STORAGE_KEYS.CUSTOMERS, []);
  }

  async getCustomers(forceRefresh = false) {
    const cached = this.getCachedCustomers();
    if (!forceRefresh && cached && cached.length > 0) {
      return cached;
    }

    try {
      const cloudCusts = await firebaseService.getCustomers();
      if (cloudCusts && cloudCusts.length > 0) {
        setLocal(STORAGE_KEYS.CUSTOMERS, cloudCusts);
        return cloudCusts;
      }
    } catch {
      // ignore
    }
    return cached;
  }

  async saveCustomer(cust) {
    const id = cust.id || `c_${Date.now()}`;
    const clean = {
      ...cust,
      id,
      name: (cust.name || 'Walk-in Customer').trim(),
      phone: (cust.phone || '').trim(),
      dueAmount: Number(cust.dueAmount) || 0,
    };

    const current = this.getCachedCustomers();
    const updated = [clean, ...current.filter(c => c.id !== id)];
    setLocal(STORAGE_KEYS.CUSTOMERS, updated);

    try {
      await firebaseService.saveCustomer(clean);
    } catch (err) {
      console.warn('[Storage] Cloud saveCustomer failed:', err);
    }

    return clean;
  }

  // =========================================================================
  // DASHBOARD METRICS (Computed Synchronously in Memory - 0 Network)
  // =========================================================================

  getDashboardMetrics(customSales = null, customExpenses = null) {
    const sales = customSales || this.getCachedSales();
    const expenses = customExpenses || this.getCachedExpenses();

    const totalSales = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const billsCount = sales.length;

    let cash = 0;
    let upi = 0;
    let card = 0;
    let credit = 0;
    let totalProfit = 0;

    sales.forEach(s => {
      const tot = Number(s.total) || 0;
      const m = (s.paymentMethod || 'Cash').toLowerCase();
      if (m.includes('cash')) cash += tot;
      else if (m.includes('upi')) upi += tot;
      else if (m.includes('card')) card += tot;
      else if (m.includes('credit')) credit += tot;

      totalProfit += Number(s.profit || (tot * 0.35));
    });

    const expensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      todaySales: totalSales,
      billsCount: billsCount,
      cashTotal: cash,
      upiTotal: upi,
      cardTotal: card,
      creditTotal: credit,
      expensesTotal,
      profitTotal: totalProfit,
      recentBills: sales.slice(0, 10),
    };
  }
}

export const storageService = new StorageService();
