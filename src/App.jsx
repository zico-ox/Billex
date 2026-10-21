import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  TrendingUp, 
  Receipt, 
  BarChart3, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  MoreVertical, 
  LogOut, 
  Bookmark, 
  CreditCard, 
  User, 
  Store,
  Eye,
  X,
  Menu,
  ChevronUp,
  ChevronDown,
  Cloud,
  Database,
  RefreshCw,
  AlertCircle,
  Utensils,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Pencil,
  ShoppingBag
} from 'lucide-react';
import { storageService } from './services/storageService';
import { printerService } from './services/printerService';
import { firebaseService } from './services/firebaseService';
import { getCategoryClass } from './utils/categoryUtils';
import ThermalReceiptPreview from './components/ThermalReceiptPreview';
import PrinterModal from './components/PrinterModal';
import PaymentModal from './components/PaymentModal';
import PostPrintPaymentSelector from './components/PostPrintPaymentSelector';
import PwaInstallModal from './components/PwaInstallModal';
import EditProductModal from './components/EditProductModal';
import DashboardView from './components/views/DashboardView';
import SalesView from './components/views/SalesView';
import ReportsView from './components/views/ReportsView';
import ProductSalesView from './components/views/ProductSalesView';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('billing'); // 'dashboard' | 'billing' | 'products' | 'sales' | 'expenses' | 'reports' | 'settings'

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [sales, setSales] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    todaySales: 0,
    billsCount: 0,
    cashTotal: 0,
    upiTotal: 0,
    expensesTotal: 0,
    profitTotal: 0,
    creditTotal: 0,
    cardTotal: 0,
    recentBills: [],
  });

  // Billing View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [billNo, setBillNo] = useState('WK0001');
  const [billDate, setBillDate] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });
  const [billTime, setBillTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  // Direct cart state (Starts clean and empty)
  const [cartItems, setCartItems] = useState([]);
  const [parcelCount, setParcelCount] = useState(0);
  const [heldBill, setHeldBill] = useState(null);

  // Open Food State
  const [showOpenFood, setShowOpenFood] = useState(false);
  const [openFoodName, setOpenFoodName] = useState('');
  const [openFoodPrice, setOpenFoodPrice] = useState('');
  const openFoodNameRef = useRef(null);

  // Modals & Popups
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [postPrintSale, setPostPrintSale] = useState(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewSaleDetails, setViewSaleDetails] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Expenses State
  const [expenses, setExpenses] = useState([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
  });

  // New Item Quick Form
  const [quickItem, setQuickItem] = useState({
    name: '',
    category: 'Rumali Rolls',
    sellingPrice: '',
  });

  // Printer status
  const [printerConnected, setPrinterConnected] = useState(printerService.isConnected);
  const [firebaseState, setFirebaseState] = useState(firebaseService.getState());
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  // PWA (Progressive Web App) Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  const searchInputRef = useRef(null);

  const loadAllData = async () => {
    try {
      const [prods, cats, sett, allSales, allExpenses] = await Promise.all([
        storageService.getProducts(),
        storageService.getCategories(),
        storageService.getSettings(),
        storageService.getSales(),
        storageService.getExpenses()
      ]);

      setProducts(prods || []);
      setCategories(cats || []);
      setSettings(sett || {});
      setSales(allSales || []);
      setExpenses(allExpenses || []);

      const metrics = await storageService.getDashboardMetrics(allSales, allExpenses);
      setDashboardMetrics(metrics);

      const nextBill = await storageService.getNextBillNumber(allSales);
      setBillNo(nextBill);

      const now = new Date();
      setBillDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
      setBillTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    } catch (err) {
      console.error('[Billex] Error loading data from Firebase:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        if (isMounted) await loadAllData();
      } catch {
        // ignore
      }
    };
    init();

    // Check Standalone Mode (Launched as PWA on Phone / Tablet / PC)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               window.navigator.standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const unsub = printerService.subscribe((s) => {
      setPrinterConnected(s.isConnected);
    });

    const unsubFb = firebaseService.subscribe((s) => {
      setFirebaseState(s);
    });

    // Start live sync across all devices in real-time
    firebaseService.startLiveSync(({ type, data }) => {
      if (type === 'products') setProducts(data || []);
      if (type === 'categories') setCategories(data || []);
      if (type === 'sales') {
        const newSales = data || [];
        setSales(newSales);
        storageService.getDashboardMetrics(newSales, null).then(setDashboardMetrics);
        storageService.getNextBillNumber(newSales).then(setBillNo);
      }
      if (type === 'expenses') {
        const newExp = data || [];
        setExpenses(newExp);
        storageService.getDashboardMetrics(null, newExp).then(setDashboardMetrics);
      }
      if (type === 'settings') {
        if (data) setSettings(data);
      }
    });

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      unsub();
      unsubFb();
      firebaseService.stopLiveSync();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger PWA Installation prompt or show modal guide
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch {
        setShowInstallGuideModal(true);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  };

  // Filtered Products (with flexible search support for 'A Mojito', 'Mojito', etc.)
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All Items' || p.category === selectedCategory;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matchCat;

    const stripped = term.replace(/^(a|an)\s+/i, '');
    const pName = p.name.toLowerCase();
    const pCat = (p.category || '').toLowerCase();

    const matchSearch = pName.includes(term) || 
                        pName.includes(stripped) || 
                        term.includes(pName) ||
                        pCat.includes(term) || 
                        pCat.includes(stripped) ||
                        term.includes(pCat);

    return matchCat && matchSearch;
  });

  // Group products into ordered category sections (Must Try -> Rumali Rolls -> Fresh Lime -> Shakes -> Fresh Juices -> Special Avilmilk -> Mojitos)
  const categorySections = React.useMemo(() => {
    if (selectedCategory !== 'All Items') {
      return filteredProducts.length > 0 
        ? [{ category: selectedCategory, items: filteredProducts }] 
        : [];
    }

    const sections = [];
    const nonMojitoCategories = categories.filter(c => c !== 'All Items' && c !== 'Mojitos');
    const seenCategories = new Set(['Mojitos']);

    // 1. Follow defined sequence for all categories except Mojitos
    nonMojitoCategories.forEach(cat => {
      const items = filteredProducts.filter(p => p.category === cat);
      if (items.length > 0) {
        sections.push({ category: cat, items });
        seenCategories.add(cat);
      }
    });

    // 2. Extra/custom categories added dynamically (except Mojitos)
    filteredProducts.forEach(p => {
      if (p.category && !seenCategories.has(p.category) && p.category !== 'All Items' && p.category !== 'Mojitos') {
        const items = filteredProducts.filter(x => x.category === p.category);
        sections.push({ category: p.category, items });
        seenCategories.add(p.category);
      }
    });

    // 3. Fallback for uncategorized products
    const uncategorized = filteredProducts.filter(p => !p.category);
    if (uncategorized.length > 0) {
      sections.push({ category: 'Other', items: uncategorized });
    }

    // 4. Mojitos at the very end of All Items
    const mojitoItems = filteredProducts.filter(p => p.category === 'Mojitos');
    if (mojitoItems.length > 0) {
      sections.push({ category: 'Mojitos', items: mojitoItems });
    }

    return sections;
  }, [filteredProducts, selectedCategory, categories]);

  // Ensure Mojitos is strictly at the end of the category filter buttons
  const displayCategories = React.useMemo(() => {
    const list = categories.filter(c => c !== 'Mojitos');
    if (categories.includes('Mojitos')) {
      list.push('Mojitos');
    }
    return list;
  }, [categories]);

  // Last bill for quick header overview
  const lastSale = sales && sales.length > 0 ? sales[0] : null;

  // Cart Calculations
  const itemsSubtotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
  const parcelFee = parcelCount * 5;
  const grandTotal = itemsSubtotal + parcelFee;

  // Cart actions
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, qty: item.qty + 1, amount: (item.qty + 1) * item.sellingPrice } 
            : item
        );
      }
      const isOpen = Boolean(product.isOpenFood || (product.id && String(product.id).startsWith('open_')) || product.category === 'Open Food');
      return [...prev, {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        category: product.category || (isOpen ? 'Open Food' : 'General'),
        isOpenFood: isOpen,
        qty: 1,
        amount: product.sellingPrice,
      }];
    });
  };

  const handleAddOpenFood = (e) => {
    if (e) e.preventDefault();
    const price = parseFloat(openFoodPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price for the open food item.');
      return;
    }
    const name = openFoodName.trim() || 'Open Food';
    const newItem = {
      id: `open_${Date.now()}`,
      name,
      sellingPrice: price,
      purchasePrice: Math.round(price * 0.5),
      category: 'Open Food',
    };
    handleAddToCart(newItem);
    setOpenFoodName('');
    setOpenFoodPrice('');
    setShowOpenFood(false);
  };

  const handleUpdateQty = (productId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return { ...item, qty: newQty, amount: newQty * item.sellingPrice };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleClearBill = () => {
    if (cartItems.length === 0 && parcelCount === 0) return;
    setCartItems([]);
    setParcelCount(0);
  };

  const handleHoldBill = () => {
    if (cartItems.length > 0) {
      setHeldBill({ items: [...cartItems], parcelCount });
      setCartItems([]);
      setParcelCount(0);
    } else if (heldBill) {
      setCartItems(heldBill.items || []);
      setParcelCount(heldBill.parcelCount || 0);
      setHeldBill(null);
    }
  };

  // Edit Master Product (Name, Price, Category)
  const handleSaveEditProduct = async (updatedProduct) => {
    // 1. Optimistically update local products state
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    // 2. Also update matching item in active cart if present
    setCartItems(prev => prev.map(item => {
      if (item.productId === updatedProduct.id) {
        return {
          ...item,
          name: updatedProduct.name,
          sellingPrice: updatedProduct.sellingPrice,
          amount: item.qty * updatedProduct.sellingPrice
        };
      }
      return item;
    }));

    // 3. Save to Firebase via storageService
    try {
      await storageService.saveProduct(updatedProduct);
      const freshCats = await storageService.getCategories();
      if (freshCats) setCategories(freshCats);
    } catch (err) {
      console.warn('[Billex] Cloud save product warning:', err);
    }
  };

  // Print Bill immediately without waiting for payment, then show non-blocking post-print selector
  const handlePrintBill = async () => {
    if (cartItems.length === 0) {
      alert('Add products to bill before printing.');
      return;
    }

    const payload = {
      billNo,
      date: billDate,
      time: billTime,
      items: [...cartItems],
      parcelCount,
      parcelFee,
      subtotal: itemsSubtotal,
      discount: 0,
      tax: 0,
      total: grandTotal,
      paymentMethod: 'Cash', // Default initial payment mode
      paymentConfirmed: false, // Unmarked until explicitly confirmed or selected
      isUnmarked: true,
      amountReceived: grandTotal,
      change: 0,
      customerName: 'Walk-in Customer',
    };

    // 1. Instantly complete & save sale in storage/Firebase
    const saved = await storageService.completeSale(payload);

    // 2. Instantly print receipt without waiting!
    if (printerService.isConnected) {
      printerService.printReceipt(saved, settings).catch(() => {});
    }

    setMobileCartOpen(false);

    // 3. Immediately prepare next bill so screen is 100% active and unblocked for new orders!
    setCartItems([]);
    setParcelCount(0);
    const nextBillNo = await storageService.getNextBillNumber();
    setBillNo(nextBillNo);

    // 4. Trigger non-blocking post-print payment selector
    if (settings.showPaymentModal !== false) {
      setPostPrintSale(saved);
    }
  };

  // Update payment method for a bill (from post-print selector or View Bill modal)
  const handleUpdatePostPrintPayment = async (saleId, paymentMethod) => {
    await storageService.updateSalePayment(saleId, paymentMethod, true);
    setSales(prev => prev.map(s => s.id === saleId ? { 
      ...s, 
      paymentMethod, 
      paymentConfirmed: true, 
      isUnmarked: false 
    } : s));

    setViewSaleDetails(prev => (prev && prev.id === saleId ? {
      ...prev,
      paymentMethod,
      paymentConfirmed: true,
      isUnmarked: false
    } : prev));
  };

  // Expense Handlers (Add & Delete)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;

    await storageService.saveExpense({
      title: newExpense.title.trim(),
      category: newExpense.category || 'Utilities',
      amount: Number(newExpense.amount),
    });

    setShowAddExpenseModal(false);
    setNewExpense({ title: '', category: 'Utilities', amount: '' });
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await storageService.deleteExpense(id);
    }
  };

  const handleDeleteInvoice = async (saleId) => {
    await storageService.deleteSale(saleId);
    if (viewSaleDetails?.id === saleId) setViewSaleDetails(null);
  };

  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    if (!quickItem.name.trim() || !quickItem.sellingPrice) return;
    await storageService.saveProduct({
      name: quickItem.name.trim(),
      category: quickItem.category,
      sellingPrice: Number(quickItem.sellingPrice),
      stock: 50,
      status: 'Active'
    });
    setShowQuickAddModal(false);
    setQuickItem({ name: '', category: 'Rumali Rolls', sellingPrice: '' });
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="weknd-app">
      {/* Top Application Header Bar (Visible across all screens, opens sidebar drawer via Menu icon) */}
      <header className="app-top-bar">
        <div className="top-bar-left">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            <Menu size={20} />
            <span className="menu-btn-label">Menu</span>
          </button>

          <div className="app-brand-badge" onClick={() => selectTab('billing')} style={{ cursor: 'pointer' }}>
            <div className="store-badge">
              <Store size={18} />
            </div>
            <div className="brand-title-wrap">
              <h1>Weknd.</h1>
              <span>Juice & Rolls</span>
            </div>
          </div>
        </div>

        <div className="top-bar-right">
          {/* PWA Install Button (Shown on Tablet / Phone / PC when not running standalone) */}
          {!isStandalone && (
            <button 
              type="button"
              className="pwa-topbar-install-btn"
              onClick={handleTriggerInstall}
              title="Install Weknd POS as App on Tablet / Phone / PC"
            >
              <Download size={14} />
              <span className="pwa-btn-text">Install App</span>
            </button>
          )}

          {activeTab !== 'billing' && (
            <button 
              className={`cloud-status-pill ${firebaseState.status === 'connected' ? 'connected' : firebaseState.status === 'permission_denied' ? 'warning' : ''}`}
              onClick={() => selectTab('settings')}
              title={`Firebase Realtime Database: ${firebaseState.status}`}
            >
              <Cloud size={15} />
              <span className="printer-status-text">
                {firebaseState.status === 'connected' ? 'Cloud Synced' : firebaseState.status === 'permission_denied' ? 'Rules Needed' : firebaseState.status === 'connecting' ? 'Connecting...' : 'Cloud DB'}
              </span>
              <span className={`status-dot ${firebaseState.status === 'connected' ? 'online' : firebaseState.status === 'permission_denied' ? 'warning' : ''}`} />
            </button>
          )}

          <button 
            className={`printer-status-pill ${printerConnected ? 'connected' : ''}`}
            onClick={() => setShowPrinterModal(true)}
            title="Thermal Printer Settings"
          >
            <Printer size={15} />
            <span className="printer-status-text">{printerConnected ? 'EX58P Ready' : 'Printer'}</span>
            <span className={`status-dot ${printerConnected ? 'online' : ''}`} />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay Backdrop */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Slide-out Offcanvas Sidebar Drawer (Hidden by default, opens with menu icon) */}
      <aside className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header & Close Button */}
        <div className="sidebar-drawer-header">
          <div className="brand-section">
            <div className="store-badge">
              <Store size={22} />
            </div>
            <div className="brand-title-wrap">
              <h1>Weknd.</h1>
              <span>Juice & Rolls</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav-list">
          <button 
            className={`nav-link-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => selectTab('billing')}
          >
            <FileText size={18} />
            <span>New Bill</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => selectTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => selectTab('products')}
          >
            <Package size={18} />
            <span>Products</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => selectTab('sales')}
          >
            <TrendingUp size={18} />
            <span>Sales</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'product-sales' ? 'active' : ''}`}
            onClick={() => selectTab('product-sales')}
          >
            <ShoppingBag size={18} />
            <span>Sales by Product</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => selectTab('expenses')}
          >
            <Receipt size={18} />
            <span>Expenses</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => selectTab('reports')}
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => selectTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          {/* PWA Install Button in Sidebar */}
          <button 
            type="button"
            className="nav-link-btn pwa-sidebar-btn" 
            onClick={() => {
              handleTriggerInstall();
              setSidebarOpen(false);
            }}
            title="Install as App on PC / Tablet / Phone"
          >
            <Download size={18} />
            <span>{isStandalone ? 'App Installed ✓' : 'Install App'}</span>
          </button>
        </nav>

        {/* Sidebar Profile & Logout Footer */}
        <div className="sidebar-profile-box">
          <div className="user-profile-row">
            <div className="avatar-circle">
              <User size={18} />
            </div>
            <div>
              <div className="user-meta-name">weknd.official</div>
              <div className="user-meta-role">Admin</div>
            </div>
          </div>

          <button className="logout-action-btn" onClick={() => alert('Logged out')}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="main-workspace">
        {/* =========================================================================
            TAB: NEW BILL (Exact Match to Reference Mockup!)
           ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="pos-screen-layout">
            {/* Center Product Catalog */}
            <section className="catalog-area">
              <div className="catalog-top-header">
                <div className="page-title-group">
                  <h2>New Bill</h2>
                  <p>Quick and easy billing</p>
                </div>

                <div className="catalog-header-right-cluster">
                  {postPrintSale && (
                    <PostPrintPaymentSelector 
                      sale={postPrintSale}
                      onClose={() => setPostPrintSale(null)}
                      onSelectPayment={handleUpdatePostPrintPayment}
                    />
                  )}

                  {lastSale && (
                    <button 
                      type="button" 
                      className="last-bill-header-btn"
                      onClick={() => setViewSaleDetails(lastSale)}
                      title={`Click to view details for bill ${lastSale.billNo}`}
                    >
                      <div className="last-bill-header-left">
                        <div className="last-bill-icon-badge">
                          <Receipt size={16} />
                        </div>
                        <div className="last-bill-text">
                          <span className="last-bill-heading">Last Bill</span>
                          <span className="last-bill-meta font-mono">{lastSale.billNo}</span>
                        </div>
                      </div>
                      <div className="last-bill-header-right">
                        <span className="last-bill-amount font-mono">₹{lastSale.total}</span>
                        <span className="last-bill-view-hint">
                          <Eye size={12} />
                          <span>Details</span>
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Search with Ctrl + K */}
              <div className="search-capsule-box">
                <Search size={18} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search product or type product name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="shortcut-badge">Ctrl + K</span>
              </div>

              {/* Category Filter Pills */}
              <div className="category-pills-row">
                {displayCategories.map(cat => (
                  <button
                    key={cat}
                    className={`category-filter-pill ${getCategoryClass(cat)} ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Categorized Product Sections in Catalog Scroll Area */}
              <div className="catalog-scroll-area">
                {categorySections.length === 0 ? (
                  <div className="empty-catalog-state">
                    <p>No products found matching your search.</p>
                  </div>
                ) : (
                  categorySections.map(sec => (
                    <div 
                      key={sec.category} 
                      id={`sec-${getCategoryClass(sec.category)}`} 
                      className="category-products-section"
                    >
                      {/* Section Header with Light Gradient Badge & Item Count */}
                      <div className="category-section-header">
                        <div className="category-section-title-wrap">
                          <span className={`card-prod-cat-badge ${getCategoryClass(sec.category)} category-section-badge`}>
                            {sec.category}
                          </span>
                          <span className="category-section-count">
                            {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="category-section-line" />
                      </div>

                      {/* 3-Column Product Cards Grid for this category */}
                      <div className="products-cards-grid">
                        {sec.items.map(prod => {
                          const cartItem = cartItems.find(it => it.productId === prod.id);
                          return (
                            <div 
                              key={prod.id}
                              className={`product-item-card ${cartItem ? 'has-in-cart' : ''}`}
                              onClick={() => handleAddToCart(prod)}
                            >
                              <div className="card-title-price">
                                <div className="card-prod-name">{prod.name}</div>
                                <div className="card-prod-meta-row">
                                  <span className="card-prod-price font-mono">₹{prod.sellingPrice}</span>
                                  <span className={`card-prod-cat-badge ${getCategoryClass(prod.category)}`}>
                                    {prod.category}
                                  </span>
                                </div>
                              </div>
                              <div className={`card-plus-btn ${cartItem ? 'active-count' : ''}`}>
                                {cartItem ? (
                                  <span className="card-qty-badge font-mono">{cartItem.qty}</span>
                                ) : (
                                  <Plus size={16} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Mobile Cart Backdrop Overlay */}
            <div 
              className={`mobile-cart-backdrop ${mobileCartOpen ? 'show' : ''}`}
              onClick={() => setMobileCartOpen(false)}
            />

            {/* Right Current Bill Panel */}
            <aside className={`current-bill-panel ${mobileCartOpen ? 'mobile-open' : ''}`}>
              {/* Mobile Drawer Handle Bar */}
              <div className="mobile-drawer-handle-bar" onClick={() => setMobileCartOpen(false)}>
                <div className="drawer-handle-pill" />
              </div>

              <div className="bill-top-header">
                <div className="bill-title-actions-row">
                  <h3>Current Bill</h3>
                  <div className="header-icon-actions">
                    <button onClick={handleClearBill} title="Clear Bill">
                      <Trash2 size={18} />
                    </button>
                    <button onClick={() => setShowPrinterModal(true)} title="Printer Options">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="bill-meta-subline">
                  <span className="bill-inv-number font-mono">{billNo}</span>
                  <span className="bill-datetime-text">{billDate} &nbsp; {billTime}</span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="cart-items-scrollarea">
                {cartItems.length === 0 ? (
                  <div className="empty-bill-message">
                    <FileText size={36} color="var(--border-medium)" />
                    <span style={{ fontSize: '0.85rem' }}>No products in current bill</span>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.productId} className="cart-item-entry">
                      <div className="entry-details">
                        <div className="entry-name">{item.name}</div>
                        <div className="entry-multiplier font-mono">₹{item.sellingPrice} × {item.qty}</div>
                      </div>

                      <div className="entry-stepper-box">
                        <button className="entry-stepper-btn" onClick={() => handleUpdateQty(item.productId, -1)}>
                          <Minus size={12} />
                        </button>
                        <span className="entry-stepper-count font-mono">{item.qty}</span>
                        <button className="entry-stepper-btn" onClick={() => handleUpdateQty(item.productId, 1)}>
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="entry-price-total font-mono">
                        ₹{item.amount}
                      </div>

                      <button className="entry-del-btn" onClick={() => handleRemoveItem(item.productId)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Grand Total & Parcel Fee Section */}
              <div className="bill-grand-total-section">
                {/* Open Food Option (Top of Parcel Fee) */}
                {!showOpenFood ? (
                  <div className="open-food-row">
                    <button 
                      type="button" 
                      className="btn-add-open-food"
                      onClick={() => {
                        setShowOpenFood(true);
                        setTimeout(() => openFoodNameRef.current?.focus(), 60);
                      }}
                    >
                      <Utensils size={15} />
                      <span>+ Add Open Food</span>
                    </button>
                  </div>
                ) : (
                  <form className="open-food-form-card" onSubmit={handleAddOpenFood}>
                    <div className="open-food-form-header">
                      <div className="open-food-form-title">
                        <Utensils size={14} />
                        <span>Add Open Food</span>
                      </div>
                      <button 
                        type="button" 
                        className="open-food-close-btn"
                        onClick={() => {
                          setShowOpenFood(false);
                          setOpenFoodName('');
                          setOpenFoodPrice('');
                        }}
                        title="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="open-food-inputs-row">
                      <input 
                        ref={openFoodNameRef}
                        type="text" 
                        className="open-food-name-input"
                        placeholder="Item name (e.g. Extra Mayo)"
                        value={openFoodName}
                        onChange={e => setOpenFoodName(e.target.value)}
                      />
                      <input 
                        type="number" 
                        className="open-food-price-input font-mono"
                        placeholder="Price ₹"
                        min="1"
                        step="any"
                        required
                        value={openFoodPrice}
                        onChange={e => setOpenFoodPrice(e.target.value)}
                      />
                      <button type="submit" className="btn-open-food-submit">
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Parcel Fee Control (Click to show plus and minus buttons; adds ₹5 per parcel) */}
                {parcelCount === 0 ? (
                  <div className="parcel-fee-row">
                    <button 
                      type="button" 
                      className="btn-add-parcel"
                      onClick={() => setParcelCount(1)}
                    >
                      <Package size={16} />
                      <span>+ Add Parcel Fee (₹5)</span>
                    </button>
                  </div>
                ) : (
                  <div className="parcel-fee-row active">
                    <div className="parcel-label-wrap">
                      <Package size={17} className="parcel-icon" />
                      <div className="parcel-text">
                        <span className="parcel-name">Parcel Fee</span>
                        <span className="parcel-rate font-mono">₹5 × {parcelCount}</span>
                      </div>
                    </div>

                    <div className="parcel-stepper-wrap">
                      <div className="entry-stepper-box">
                        <button 
                          type="button" 
                          className="entry-stepper-btn" 
                          onClick={() => setParcelCount(prev => Math.max(0, prev - 1))}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="entry-stepper-count font-mono">{parcelCount}</span>
                        <button 
                          type="button" 
                          className="entry-stepper-btn" 
                          onClick={() => setParcelCount(prev => prev + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="parcel-amount font-mono">₹{parcelFee}</span>

                      <button 
                        type="button" 
                        className="parcel-remove-btn" 
                        onClick={() => setParcelCount(0)}
                        title="Remove Parcel Fee"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bill-grand-total-row">
                  <span>TOTAL</span>
                  <span className="font-mono total-number">₹{grandTotal}</span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="bill-actions-footer">
                <button 
                  type="button" 
                  className="btn-print-bill-primary"
                  onClick={handlePrintBill}
                  disabled={cartItems.length === 0}
                >
                  <Printer size={18} />
                  <span>PRINT BILL</span>
                </button>

                <div className="secondary-actions-double">
                  <button type="button" className="btn-clear-bill-outline" onClick={handleClearBill}>
                    <Trash2 size={15} />
                    <span>Clear Bill</span>
                  </button>

                  <button type="button" className="btn-hold-bill-outline" onClick={handleHoldBill}>
                    <Bookmark size={15} />
                    <span>{heldBill && cartItems.length === 0 ? 'Recall Bill' : 'Hold Bill'}</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile Bottom Bar (Drawer trigger for phones) */}
            <div className="mobile-cart-bar" onClick={() => setMobileCartOpen(prev => !prev)}>
              <span>{cartItems.reduce((acc, i) => acc + i.qty, 0)} Items</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="font-mono">₹{grandTotal}</span>
                {mobileCartOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: DASHBOARD (Active Time Filter + Top 5 Best Selling Items)
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <DashboardView
            sales={sales}
            expenses={expenses}
            settings={settings}
            onViewSale={(sale) => setViewSaleDetails(sale)}
            onDeleteSale={handleDeleteInvoice}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* =========================================================================
            TAB: PRODUCT SALES (Full Page View: All Sales by Product & Zero Sales)
           ========================================================================= */}
        {activeTab === 'product-sales' && (
          <ProductSalesView
            sales={sales}
            products={products}
            settings={settings}
            onBack={() => setActiveTab('dashboard')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* =========================================================================
            TAB: PRODUCTS (Complete Catalog & Menu Reset)
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="view-container-standard">
            <div className="view-header-row">
              <div>
                <h2>Products Catalog ({products.length} items)</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Complete shop menu from board
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  className="btn-clear-bill-outline"
                  onClick={async () => {
                    const prods = await storageService.getProducts();
                    setProducts(prods || []);
                    const cats = await storageService.getCategories();
                    setCategories(cats || []);
                  }}
                  title="Reload menu from Firebase Cloud"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} />
                  <span>Refresh Cloud Menu</span>
                </button>
                <button className="btn-print-bill-primary" style={{ width: 'auto', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }} onClick={() => setShowQuickAddModal(true)}>
                  <Plus size={15} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            <div className="search-capsule-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(p => (
                    <tr key={p.id} onDoubleClick={() => setEditingProduct(p)} style={{ cursor: 'pointer' }} title="Double-click to edit">
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td><span className={`card-prod-cat-badge ${getCategoryClass(p.category)}`}>{p.category}</span></td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>₹{p.sellingPrice}</td>
                      <td><span className="status-tag-active">Active</span></td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button 
                            type="button"
                            className="entry-edit-action-btn"
                            onClick={() => setEditingProduct(p)}
                            title={`Edit ${p.name} (Name & Price)`}
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>
                          <button 
                            type="button"
                            className="entry-del-btn" 
                            onClick={async () => {
                              if (window.confirm(`Delete ${p.name}?`)) {
                                await storageService.deleteProduct(p.id);
                                setProducts(prev => prev.filter(x => x.id !== p.id));
                              }
                            }}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: SALES (Matches bottom third preview!)
           ========================================================================= */}
        {activeTab === 'sales' && (
          <SalesView 
            sales={sales}
            onViewSale={setViewSaleDetails}
            onDeleteSale={handleDeleteInvoice}
          />
        )}

        {/* =========================================================================
            TAB: REPORTS (Export PDF, Excel, CSV, Period Filtering)
           ========================================================================= */}
        {activeTab === 'reports' && (
          <ReportsView 
            sales={sales}
            expenses={expenses}
            settings={settings}
          />
        )}

        {/* =========================================================================
            TAB: EXPENSES (Add & Delete Options)
           ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="view-container-standard">
            <div className="view-header-row">
              <div>
                <h2>Expenses ({expenses.length})</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                  Manage daily shop expenses and operational payouts
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: 'var(--red-accent)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span>Total Expenses:</span>
                  <span className="font-mono">
                    ₹{expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <button 
                  type="button"
                  className="btn-print-bill-primary" 
                  style={{ width: 'auto', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }} 
                  onClick={() => setShowAddExpenseModal(true)}
                >
                  <Plus size={15} />
                  <span>+ Add Expense</span>
                </button>
              </div>
            </div>

            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Expense Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                        No expenses recorded yet. Click <strong>+ Add Expense</strong> above to add one.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <div style={{ fontWeight: 600 }}>{exp.date}</div>
                          {exp.time && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{exp.time}</div>}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {exp.title}
                        </td>
                        <td>
                          <span className="card-prod-cat-badge cat-badge-default" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {exp.category || 'Utilities'}
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontWeight: 800, color: 'var(--red-accent)', fontSize: '0.95rem' }}>
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            type="button"
                            className="entry-del-btn" 
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: SETTINGS, CLOUD DATABASE & PRINTER SETUP
           ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="view-container-standard" style={{ maxWidth: '680px' }}>
            <h2>Settings & Cloud</h2>

            {/* PWA & App Installation Card */}
            <div className="pos-table-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                    <Download size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      App Installation (PWA)
                      <span className="card-prod-cat-badge" style={{ 
                        background: isStandalone ? '#dcfce7' : '#eff6ff',
                        color: isStandalone ? '#15803d' : '#2563eb'
                      }}>
                        {isStandalone ? 'INSTALLED APP' : 'BROWSER MODE'}
                      </span>
                    </strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
                      Install on iPad, Android Tablet, Phone, Windows PC, or Mac
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    className="btn-print-bill-primary"
                    style={{ width: 'auto', padding: '0.52rem 1.15rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    onClick={handleTriggerInstall}
                  >
                    <Download size={15} />
                    <span>{isStandalone ? 'Install Instructions' : 'Install Weknd POS'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.2rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <Tablet size={16} color="var(--brown-primary)" />
                    <span>Tablet / iPad</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                    Full-screen billing with no browser tabs. Fast touch response.
                  </p>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <Monitor size={16} color="var(--brown-primary)" />
                    <span>PC / Windows / Mac</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                    Standalone desktop window with keyboard shortcuts (Ctrl+K).
                  </p>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <Smartphone size={16} color="var(--brown-primary)" />
                    <span>Phone (Android / iOS)</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                    Compact bottom drawer cart, easy mobile billing on the go.
                  </p>
                </div>
              </div>
            </div>

            {/* Firebase Realtime Database Section */}
            <div className="pos-table-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Firebase Realtime Database
                      <span className={`card-prod-cat-badge`} style={{ 
                        background: firebaseState.status === 'connected' ? '#dcfce7' : firebaseState.status === 'permission_denied' ? '#fef9c3' : '#f1f5f9',
                        color: firebaseState.status === 'connected' ? '#15803d' : firebaseState.status === 'permission_denied' ? '#854d0e' : '#475569'
                      }}>
                        {firebaseState.status.toUpperCase()}
                      </span>
                    </strong>
                    <p className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0.1rem 0 0' }}>
                      {firebaseState.databaseURL}
                    </p>
                  </div>
                </div>

                <button 
                  className="btn-clear-bill-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  onClick={async () => {
                    const ok = await firebaseService.testConnection();
                    setSyncMessage(ok ? 'Connected successfully!' : firebaseService.lastError);
                    setTimeout(() => setSyncMessage(null), 5000);
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Status Message or Warning Banner */}
              {syncMessage && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: syncMessage.includes('success') ? '#dcfce7' : '#fee2e2',
                  color: syncMessage.includes('success') ? '#15803d' : '#b91c1c',
                }}>
                  {syncMessage}
                </div>
              )}

              {firebaseState.status === 'permission_denied' && (
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  color: '#713f12',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                    <AlertCircle size={16} color="#ca8a04" />
                    <span>Action Required in Firebase Console (Rules)</span>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.4 }}>
                    To enable database access, open your <strong>Firebase Console</strong> &rarr; <strong>Realtime Database</strong> &rarr; <strong>Rules</strong> tab, and set:
                  </p>
                  <pre style={{ margin: 0, padding: '0.5rem', background: '#ffffff', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #fef08a' }}>
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                  </pre>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#854d0e' }}>
                    Click <strong>Publish</strong> in the Firebase Console, then click <strong>"Test Connection"</strong> above.
                  </p>
                </div>
              )}

              {/* Cloud Sync Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem', borderTop: '1px solid var(--border-light)' }}>
                <button 
                  className="btn-print-bill-primary"
                  style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                  disabled={syncingCloud}
                  onClick={async () => {
                    setSyncingCloud(true);
                    setSyncMessage(null);
                    try {
                      await loadAllData();
                      setSyncMessage('Successfully refreshed all catalog & sales directly from Firebase!');
                    } catch (err) {
                      setSyncMessage(`Sync failed: ${err.message || 'Permission denied'}`);
                    } finally {
                      setSyncingCloud(false);
                      setTimeout(() => setSyncMessage(null), 5000);
                    }
                  }}
                >
                  <RefreshCw size={16} className={syncingCloud ? 'spin' : ''} />
                  <span>{syncingCloud ? 'Refreshing...' : 'Refresh from Firebase Cloud'}</span>
                </button>
              </div>

              {firebaseState.lastSyncTime && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Last Synced: {firebaseState.lastSyncTime}
                </div>
              )}
            </div>

            {/* Payment Selection Screen (Cash / GPay) Toggle */}
            <div className="pos-table-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--text-primary)' }}>
                      Post-Print Payment Prompt
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
                      After printing, shows a quick floating form to select payment method without blocking the screen or halting new bills.
                    </p>
                  </div>
                </div>

                <label className="toggle-switch-container">
                  <input 
                    type="checkbox" 
                    checked={settings.showPaymentModal !== false}
                    onChange={async (e) => {
                      const updated = { ...settings, showPaymentModal: e.target.checked };
                      setSettings(updated);
                      await storageService.saveSettings(updated);
                    }}
                  />
                  <span className={`toggle-switch-slider ${settings.showPaymentModal !== false ? 'checked' : ''}`} />
                </label>
              </div>

              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: settings.showPaymentModal !== false ? '#eff6ff' : '#fefce8',
                border: `1px solid ${settings.showPaymentModal !== false ? '#bfdbfe' : '#fef08a'}`,
                fontSize: '0.8rem',
                color: settings.showPaymentModal !== false ? '#1e40af' : '#854d0e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontWeight: 800 }}>
                  {settings.showPaymentModal !== false ? 'Status: ON' : 'Status: OFF'}
                </span>
                <span>
                  {settings.showPaymentModal !== false 
                    ? 'Bill prints immediately without waiting. Quick floating card asks for Cash/UPI/Card without blocking screen.' 
                    : '1-click direct print with default Cash without showing post-print payment selector.'}
                </span>
              </div>
            </div>

            {/* Thermal Printer Settings Section */}
            <div className="pos-table-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>EXEO EX58P Thermal Printer</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: '0.2rem 0 0' }}>58mm Paper • 384 dots • Bluetooth & USB Serial ESC/POS</p>
                </div>
                <button className="btn-print-bill-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setShowPrinterModal(true)}>
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quick Add Product Modal */}
      {showQuickAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '380px', padding: '1.25rem', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>+ Quick Add Product</strong>
              <button onClick={() => setShowQuickAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleQuickAddSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Product Name</label>
                <input 
                  type="text" 
                  required 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  value={quickItem.name}
                  onChange={e => setQuickItem({ ...quickItem, name: e.target.value })}
                  placeholder="e.g. Avocado Juice"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Category</label>
                <select 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  value={quickItem.category}
                  onChange={e => setQuickItem({ ...quickItem, category: e.target.value })}
                >
                  {categories.filter(c => c !== 'All Items').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Selling Price (₹)</label>
                <input 
                  type="number" 
                  required 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  value={quickItem.sellingPrice}
                  onChange={e => setQuickItem({ ...quickItem, sellingPrice: e.target.value })}
                  placeholder="80"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-clear-bill-outline" onClick={() => setShowQuickAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-print-bill-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '420px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={18} />
                </div>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>Add New Expense</strong>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>
                  Expense Description *
                </label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                  value={newExpense.title}
                  onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="e.g. Ice Delivery, Packaging Boxes, Milk"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>
                  Category
                </label>
                <select 
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.9rem', background: '#fff' }}
                  value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  <option value="Utilities">Utilities & Bills</option>
                  <option value="Raw Materials">Raw Materials & Food Ingredients</option>
                  <option value="Packaging">Packaging & Disposables</option>
                  <option value="Rent & Maintenance">Rent & Maintenance</option>
                  <option value="Staff Wages">Staff & Wages</option>
                  <option value="Shop Supplies">Shop Supplies & Paper</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>
                  Amount (₹) *
                </label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  step="any"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.95rem', fontWeight: 700 }}
                  value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="e.g. 500"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-clear-bill-outline" 
                  onClick={() => setShowAddExpenseModal(false)}
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-print-bill-primary" 
                  style={{ width: 'auto', padding: '0.55rem 1.4rem' }}
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Sale Details Modal */}
      {viewSaleDetails && (
        <ThermalReceiptPreview 
          sale={viewSaleDetails}
          settings={settings}
          onClose={() => setViewSaleDetails(null)}
          onDelete={handleDeleteInvoice}
          onUpdatePayment={handleUpdatePostPrintPayment}
        />
      )}

      {/* EXEO EX58P Hardware Dialog */}
      {showPrinterModal && (
        <PrinterModal onClose={() => setShowPrinterModal(false)} />
      )}

      {/* PWA App Install Modal */}
      <PwaInstallModal 
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        onInstallDirect={handleTriggerInstall}
        isInstallable={isInstallable}
        isStandalone={isStandalone}
      />

      {/* Edit Master Product Modal (Name, Price & Category) */}
      <EditProductModal 
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveEditProduct}
      />
    </div>
  );
}
