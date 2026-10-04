/**
 * Storage Service for Billex / Weknd POS
 * All data operations (products, sales, categories, expenses, settings)
 * communicate directly with Firebase Realtime Database.
 * No hardcoded seed data, no local storage fallback for store business data.
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

class StorageService {
  async getProducts() {
    return await firebaseService.getProducts();
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
    return await firebaseService.saveProduct(clean);
  }

  async deleteProduct(id) {
    await firebaseService.deleteProduct(id);
    return await this.getProducts();
  }

  async getCategories() {
    const cats = await firebaseService.getCategories();
    if (cats && cats.length > 0) {
      if (!cats.includes('All Items')) {
        return ['All Items', ...cats];
      }
      return cats;
    }
    // If not configured in Firebase yet, derive dynamically from products
    const prods = await this.getProducts();
    const unique = new Set(['All Items']);
    prods.forEach(p => {
      if (p.category) unique.add(p.category);
    });
    return Array.from(unique);
  }

  async saveCategories(categories) {
    return await firebaseService.saveCategories(categories);
  }

  async getSales() {
    return await firebaseService.getSales();
  }

  async getLastBillNumber(customSales = null) {
    const sales = customSales || await this.getSales();
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

  async getNextBillNumber(customSales = null) {
    const lastNum = await this.getLastBillNumber(customSales);
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
    };

    await firebaseService.saveSale(fullSale);

    // Update customer due if Credit payment
    if (saleData.paymentMethod === 'Credit' && saleData.customerId) {
      const custs = await this.getCustomers();
      const target = custs.find(c => c.id === saleData.customerId);
      if (target) {
        const updatedDue = (Number(target.dueAmount) || 0) + (Number(saleData.total) || 0);
        await firebaseService.saveCustomer({ ...target, dueAmount: updatedDue });
      }
    }

    return fullSale;
  }

  async updateSalePayment(saleId, paymentMethod, isConfirmed = true) {
    const sales = await this.getSales();
    const target = sales.find(s => s.id === saleId);
    if (!target) return null;

    const previousMethod = target.paymentMethod;
    const updated = { 
      ...target, 
      paymentMethod,
      paymentConfirmed: isConfirmed,
      isUnmarked: !isConfirmed
    };
    await firebaseService.saveSale(updated);

    // If changing to Credit, update customer due
    if (paymentMethod === 'Credit' && target.customerId && previousMethod !== 'Credit') {
      const custs = await this.getCustomers();
      const cTarget = custs.find(c => c.id === target.customerId);
      if (cTarget) {
        const updatedDue = (Number(cTarget.dueAmount) || 0) + (Number(target.total) || 0);
        await firebaseService.saveCustomer({ ...cTarget, dueAmount: updatedDue });
      }
    } else if (previousMethod === 'Credit' && paymentMethod !== 'Credit' && target.customerId) {
      const custs = await this.getCustomers();
      const cTarget = custs.find(c => c.id === target.customerId);
      if (cTarget) {
        const updatedDue = Math.max(0, (Number(cTarget.dueAmount) || 0) - (Number(target.total) || 0));
        await firebaseService.saveCustomer({ ...cTarget, dueAmount: updatedDue });
      }
    }

    return updated;
  }

  async deleteSale(saleId) {
    await firebaseService.deleteSale(saleId);
    return await this.getSales();
  }

  async getExpenses() {
    return await firebaseService.getExpenses();
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
    return await firebaseService.saveExpense(clean);
  }

  async deleteExpense(id) {
    await firebaseService.deleteExpense(id);
    return await this.getExpenses();
  }

  async getSettings() {
    const cloudSettings = await firebaseService.getSettings();
    if (cloudSettings) return { ...DEFAULT_SETTINGS, ...cloudSettings };
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    await firebaseService.saveSettings(merged);
    return merged;
  }

  async getCustomers() {
    return await firebaseService.getCustomers();
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
    return await firebaseService.saveCustomer(clean);
  }

  async getDashboardMetrics(customSales = null, customExpenses = null) {
    const sales = customSales || await this.getSales();
    const expenses = customExpenses || await this.getExpenses();

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
