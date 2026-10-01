/**
 * Storage Service for Weknd. Juice & Rolls
 * Exact data schema matching the reference POS design
 */

import { firebaseService } from './firebaseService';

export const SEED_CATEGORIES = [
  'All Items',
  'Must Try',
  'Rumali Rolls',
  'Fresh Lime',
  'Shakes',
  'Fresh Juices',
  'Special Avilmilk',
  'Mojitos'
];

export const SEED_PRODUCTS = [
  // ==========================================
  // 1. MUST TRY (12 items - Image 1)
  // ==========================================
  { id: 'p_roasted_cashew', name: 'Roasted Cashew', category: 'Must Try', sellingPrice: 99, purchasePrice: 50, stock: 50, status: 'Active' },
  { id: 'p_mango_strawberry_avocado', name: 'Mango Strawberry Avocado', category: 'Must Try', sellingPrice: 99, purchasePrice: 50, stock: 50, status: 'Active' },
  { id: 'p_blueberry_mango', name: 'Blueberry Mango', category: 'Must Try', sellingPrice: 99, purchasePrice: 50, stock: 50, status: 'Active' },
  { id: 'p_tender_cashew', name: 'Tender Cashew', category: 'Must Try', sellingPrice: 99, purchasePrice: 50, stock: 50, status: 'Active' },
  { id: 'p_sitaphal', name: 'Sitaphal', category: 'Must Try', sellingPrice: 89, purchasePrice: 45, stock: 50, status: 'Active' },
  { id: 'p_mango_passion_fruit', name: 'Mango Passion Fruit', category: 'Must Try', sellingPrice: 89, purchasePrice: 45, stock: 50, status: 'Active' },
  { id: 'p_avocado_dates', name: 'Avocado Dates', category: 'Must Try', sellingPrice: 89, purchasePrice: 45, stock: 50, status: 'Active' },
  { id: 'p_tender_avocado', name: 'Tender Avocado', category: 'Must Try', sellingPrice: 89, purchasePrice: 45, stock: 50, status: 'Active' },
  { id: 'p_mango_grape', name: 'Mango Grape', category: 'Must Try', sellingPrice: 79, purchasePrice: 40, stock: 50, status: 'Active' },
  { id: 'p_dragon_tender', name: 'Dragon Tender', category: 'Must Try', sellingPrice: 79, purchasePrice: 40, stock: 50, status: 'Active' },
  { id: 'p_cold_coffee', name: 'Cold Coffee', category: 'Must Try', sellingPrice: 79, purchasePrice: 38, stock: 50, status: 'Active' },
  { id: 'p_special_cocktail', name: 'Special Cocktail', category: 'Must Try', sellingPrice: 69, purchasePrice: 32, stock: 50, status: 'Active' },

  // ==========================================
  // 2. RUMALI ROLLS (5 items - Image 2)
  // ==========================================
  { id: 'p_kibdah_roll', name: 'Kibdah Roll', category: 'Rumali Rolls', sellingPrice: 69, purchasePrice: 35, stock: 50, status: 'Active' },
  { id: 'p_classic_chicken_roll', name: 'Classic Chicken Roll', category: 'Rumali Rolls', sellingPrice: 79, purchasePrice: 40, stock: 50, status: 'Active' },
  { id: 'p_beef_roll', name: 'Beef Roll', category: 'Rumali Rolls', sellingPrice: 89, purchasePrice: 48, stock: 50, status: 'Active' },
  { id: 'p_fried_chicken_roll', name: 'Fried Chicken Roll', category: 'Rumali Rolls', sellingPrice: 89, purchasePrice: 45, stock: 50, status: 'Active' },
  { id: 'p_jumbo_chicken_roll', name: 'Jumbo Chicken Roll', category: 'Rumali Rolls', sellingPrice: 99, purchasePrice: 52, stock: 50, status: 'Active' },

  // ==========================================
  // 3. FRESH LIME (5 items - Image 3 Left)
  // ==========================================
  { id: 'p_fresh_lime', name: 'Fresh Lime', category: 'Fresh Lime', sellingPrice: 20, purchasePrice: 8, stock: 60, status: 'Active' },
  { id: 'p_lime_soda', name: 'Lime Soda', category: 'Fresh Lime', sellingPrice: 20, purchasePrice: 8, stock: 60, status: 'Active' },
  { id: 'p_mint_lime', name: 'Mint Lime', category: 'Fresh Lime', sellingPrice: 30, purchasePrice: 12, stock: 60, status: 'Active' },
  { id: 'p_pineapple_lime', name: 'Pineapple Lime', category: 'Fresh Lime', sellingPrice: 30, purchasePrice: 12, stock: 60, status: 'Active' },
  { id: 'p_grape_lime', name: 'Grape Lime', category: 'Fresh Lime', sellingPrice: 30, purchasePrice: 12, stock: 60, status: 'Active' },

  // ==========================================
  // 7. WEKND. SPECIAL AVILMILK (1 item - Image 4 Right Bottom)
  // ==========================================
  { id: 'p_special_avilmilk', name: 'Special Avilmilk', category: 'Special Avilmilk', sellingPrice: 49, purchasePrice: 22, stock: 50, status: 'Active' },

  // ==========================================
  // 8. MOJITOS (1 item - All flavors same price ₹89)
  // ==========================================
  { id: 'p_mojito', name: 'Mojito', category: 'Mojitos', sellingPrice: 89, purchasePrice: 40, stock: 50, status: 'Active' },
];

const SEED_CUSTOMERS = [
  { id: 'c1', name: 'Walk-in Customer', phone: '', dueAmount: 0 },
  { id: 'c2', name: 'Rahul Sharma', phone: '9876543210', dueAmount: 0 },
  { id: 'c3', name: 'Ananya Verma', phone: '9812345678', dueAmount: 250 },
  { id: 'c4', name: 'Vikram Singh', phone: '9944332211', dueAmount: 150 },
];

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

const STORAGE_KEY_PRODUCTS = 'weknd_products_v6';
const STORAGE_KEY_CATEGORIES = 'weknd_categories_v5';

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    // Ensure Mojito product is in products
    let storedProductsRaw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    let prods = storedProductsRaw ? JSON.parse(storedProductsRaw) : [...SEED_PRODUCTS];
    const oldMojitoIds = [
      'p_passion_fruit_mojito',
      'p_green_apple_mojito',
      'p_watermelon_mojito',
      'p_blue_curacao_mojito',
      'p_mint_mojito'
    ];
    prods = prods.filter(p => !oldMojitoIds.includes(p.id));

    const mojitoItem = {
      id: 'p_mojito',
      name: 'Mojito',
      category: 'Mojitos',
      sellingPrice: 89,
      purchasePrice: 40,
      stock: 50,
      status: 'Active'
    };

    // Ensure Mojito is placed at the end of products
    prods = prods.filter(p => p.id !== 'p_mojito' && p.name?.toLowerCase() !== 'mojito');
    prods.push(mojitoItem);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(prods));

    // Ensure Mojitos category exists at the very end
    let catsRaw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    let cats = catsRaw ? JSON.parse(catsRaw) : [...SEED_CATEGORIES];
    cats = cats.filter(c => c !== 'Mojitos');
    cats.push('Mojitos');
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
    if (!localStorage.getItem('weknd_settings')) {
      localStorage.setItem('weknd_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('weknd_customers')) {
      localStorage.setItem('weknd_customers', JSON.stringify(SEED_CUSTOMERS));
    }
    const storedSettings = localStorage.getItem('weknd_settings');
    if (storedSettings) {
      try {
        const s = JSON.parse(storedSettings);
        if (s.receiptFooter && (s.receiptFooter.includes('VISIT') || !s.receiptFooter.includes('@weknd.official'))) {
          s.receiptFooter = 'THANK YOU!\n@weknd.official';
          localStorage.setItem('weknd_settings', JSON.stringify(s));
        }
      } catch (_) {}
    }

    const storedSalesRaw = localStorage.getItem('weknd_sales');
    if (storedSalesRaw) {
      try {
        const sales = JSON.parse(storedSalesRaw);
        let changed = false;
        sales.forEach(s => {
          if (s.billNo && (s.billNo.startsWith('INV-') || s.billNo.includes('000125'))) {
            const num = parseInt(s.billNo.replace(/\D/g, ''), 10);
            if (num === 125) s.billNo = 'WK0144';
            else if (num === 124) s.billNo = 'WK0143';
            else if (num === 123) s.billNo = 'WK0142';
            else s.billNo = `WK${String(num).padStart(4, '0')}`;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('weknd_sales', JSON.stringify(sales));
        }
      } catch (_) {}
    } else {
      const sampleSale = {
        id: 's144',
        billNo: 'WK0144',
        date: '23 Sep 2026',
        time: '10:24 AM',
        timestamp: Date.now() - 3600000,
        customerName: 'Walk-in Customer',
        customerPhone: '',
        items: [
          { productId: 'p_classic_chicken_roll', name: 'Classic Chicken Roll', qty: 2, sellingPrice: 79, amount: 158 },
          { productId: 'p_fresh_lime', name: 'Fresh Lime', qty: 1, sellingPrice: 20, amount: 20 },
          { productId: 'p_beef_roll', name: 'Beef Roll', qty: 1, sellingPrice: 89, amount: 89 }
        ],
        subtotal: 267,
        discount: 0,
        tax: 0,
        total: 267,
        profit: 135,
        paymentMethod: 'Cash',
        amountReceived: 300,
        change: 33
      };
      const sampleSale2 = {
        id: 's143',
        billNo: 'WK0143',
        date: '23 Sep 2026',
        time: '09:52 AM',
        timestamp: Date.now() - 7200000,
        customerName: 'Walk-in Customer',
        customerPhone: '',
        items: [
          { productId: 'p_sharja_shake', name: 'Sharja Shake', qty: 1, sellingPrice: 69, amount: 69 },
          { productId: 'p_jumbo_chicken_roll', name: 'Jumbo Chicken Roll', qty: 1, sellingPrice: 99, amount: 99 }
        ],
        subtotal: 168,
        discount: 0,
        tax: 0,
        total: 168,
        profit: 85,
        paymentMethod: 'UPI',
        amountReceived: 168,
        change: 0
      };
      const sampleSale3 = {
        id: 's142',
        billNo: 'WK0142',
        date: '23 Sep 2026',
        time: '09:15 AM',
        timestamp: Date.now() - 9000000,
        customerName: 'Walk-in Customer',
        customerPhone: '',
        items: [
          { productId: 'p_roasted_cashew', name: 'Roasted Cashew', qty: 1, sellingPrice: 99, amount: 99 },
          { productId: 'p_mojito', name: 'Mojito', qty: 1, sellingPrice: 89, amount: 89 }
        ],
        subtotal: 188,
        discount: 0,
        tax: 0,
        total: 188,
        profit: 98,
        paymentMethod: 'Cash',
        amountReceived: 200,
        change: 12
      };
      localStorage.setItem('weknd_sales', JSON.stringify([sampleSale, sampleSale2, sampleSale3]));
    }
    if (!localStorage.getItem('weknd_expenses_v1')) {
      const sampleExpenses = [
        { id: 'exp_1', title: 'Shop Utilities & Paper', category: 'Utilities', amount: 1200, date: '23 Sep 2026', time: '11:00 AM' }
      ];
      localStorage.setItem('weknd_expenses_v1', JSON.stringify(sampleExpenses));
    }
  }

  async getExpenses() {
    const raw = localStorage.getItem('weknd_expenses_v1');
    return raw ? JSON.parse(raw) : [
      { id: 'exp_1', title: 'Shop Utilities & Paper', category: 'Utilities', amount: 1200, date: '23 Sep 2026', time: '11:00 AM' }
    ];
  }

  async saveExpense(expense) {
    const list = await this.getExpenses();
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
    list.unshift(clean);
    localStorage.setItem('weknd_expenses_v1', JSON.stringify(list));
    return clean;
  }

  async deleteExpense(id) {
    const list = await this.getExpenses();
    const filtered = list.filter(e => e.id !== id);
    localStorage.setItem('weknd_expenses_v1', JSON.stringify(filtered));
    return filtered;
  }

  async getProducts() {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    let list = raw ? JSON.parse(raw) : SEED_PRODUCTS;
    const mojitoItem = {
      id: 'p_mojito',
      name: 'Mojito',
      category: 'Mojitos',
      sellingPrice: 89,
      purchasePrice: 40,
      stock: 50,
      status: 'Active'
    };
    list = list.filter(p => p.id !== 'p_mojito' && p.name?.toLowerCase() !== 'mojito');
    list.push(mojitoItem);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
    return list;
  }

  async saveProduct(prod) {
    const list = await this.getProducts();
    const id = prod.id || `p_${Date.now()}`;
    const clean = {
      ...prod,
      id,
      sellingPrice: Number(prod.sellingPrice) || 0,
      purchasePrice: Number(prod.purchasePrice) || Math.round(Number(prod.sellingPrice) * 0.55),
      stock: Number(prod.stock) || 50,
      status: prod.status || 'Active'
    };
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) list[idx] = clean;
    else list.unshift(clean);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));

    // Cloud sync in background
    firebaseService.saveProduct(clean).catch(() => {});

    return clean;
  }

  async deleteProduct(id) {
    const list = await this.getProducts();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(filtered));

    // Cloud sync in background
    firebaseService.deleteProduct(id).catch(() => {});
  }

  async getCategories() {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    let cats = raw ? JSON.parse(raw) : SEED_CATEGORIES;
    cats = cats.filter(c => c !== 'Mojitos');
    cats.push('Mojitos');
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
    return cats;
  }

  async resetToOfficialMenu() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    return SEED_PRODUCTS;
  }

  async getCustomers() {
    return JSON.parse(localStorage.getItem('weknd_customers') || JSON.stringify(SEED_CUSTOMERS));
  }

  async saveCustomer(cust) {
    const list = await this.getCustomers();
    const id = cust.id || `c_${Date.now()}`;
    const clean = { ...cust, id, dueAmount: Number(cust.dueAmount) || 0 };
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) list[idx] = clean;
    else list.push(clean);
    localStorage.setItem('weknd_customers', JSON.stringify(list));

    // Cloud sync in background
    firebaseService.saveCustomer(clean).catch(() => {});

    return clean;
  }

  async getLastBillNumber() {
    const sales = await this.getSales();
    if (!sales || sales.length === 0) {
      return 0;
    }
    let maxNum = 0;
    sales.forEach(s => {
      const match = String(s.billNo || '').match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    return maxNum;
  }

  async getNextBillNumber() {
    const lastNum = await this.getLastBillNumber();
    const nextNum = lastNum + 1;
    return `WK${String(nextNum).padStart(4, '0')}`;
  }

  async completeSale(saleData) {
    const billNo = saleData.billNo || await this.getNextBillNumber();
    const saleId = `sale_${Date.now()}`;
    const timestamp = Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let profit = 0;
    (saleData.items || []).forEach(it => {
      profit += (Number(it.sellingPrice) - Number(it.purchasePrice || (it.sellingPrice * 0.55))) * Number(it.qty || 1);
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
    };

    const sales = await this.getSales();
    sales.unshift(fullSale);
    localStorage.setItem('weknd_sales', JSON.stringify(sales));

    // Update customer due if Credit
    if (saleData.paymentMethod === 'Credit' && saleData.customerId) {
      const custs = await this.getCustomers();
      const idx = custs.findIndex(c => c.id === saleData.customerId);
      if (idx >= 0) {
        custs[idx].dueAmount = (Number(custs[idx].dueAmount) || 0) + Number(saleData.total);
        localStorage.setItem('weknd_customers', JSON.stringify(custs));
        firebaseService.saveCustomer(custs[idx]).catch(() => {});
      }
    }

    // Cloud sync in background
    firebaseService.saveSale(fullSale).catch(() => {});

    return fullSale;
  }

  async getSales() {
    const sales = JSON.parse(localStorage.getItem('weknd_sales') || '[]');
    sales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return sales;
  }

  async deleteSale(saleId) {
    const sales = await this.getSales();
    const filtered = sales.filter(s => s.id !== saleId);
    localStorage.setItem('weknd_sales', JSON.stringify(filtered));
    firebaseService.deleteSale(saleId).catch(() => {});
    return filtered;
  }

  async getSettings() {
    const raw = localStorage.getItem('weknd_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem('weknd_settings', JSON.stringify(merged));
    firebaseService.saveSettings(merged).catch(() => {});
    return merged;
  }

  async uploadAllToFirebase() {
    const products = await this.getProducts();
    const categories = await this.getCategories();
    const sales = await this.getSales();
    const customers = await this.getCustomers();
    const settings = await this.getSettings();

    return await firebaseService.pushAllLocalData({
      products,
      categories,
      sales,
      customers,
      settings
    });
  }

  async pullAllFromFirebase() {
    const data = await firebaseService.fetchAllData();
    if (!data) return null;

    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data.products));
    }
    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(data.categories));
    }
    if (data.sales && Array.isArray(data.sales) && data.sales.length > 0) {
      localStorage.setItem('weknd_sales', JSON.stringify(data.sales));
    }
    if (data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
      localStorage.setItem('weknd_customers', JSON.stringify(data.customers));
    }
    if (data.settings && typeof data.settings === 'object') {
      localStorage.setItem('weknd_settings', JSON.stringify(data.settings));
    }
    return data;
  }

  async getDashboardMetrics() {
    const sales = await this.getSales();
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

      totalProfit += Number(s.profit || (tot * 0.45));
    });

    const expenses = await this.getExpenses();
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
