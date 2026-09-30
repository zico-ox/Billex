import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  TrendingUp, 
  Receipt, 
  BarChart3, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  MoreVertical, 
  LogOut, 
  Bookmark, 
  Check, 
  Banknote, 
  QrCode, 
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
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { storageService } from './services/storageService';
import { printerService } from './services/printerService';
import { firebaseService } from './services/firebaseService';
import ThermalReceiptPreview from './components/ThermalReceiptPreview';
import PrinterModal from './components/PrinterModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('billing'); // 'dashboard' | 'billing' | 'products' | 'customers' | 'sales' | 'expenses' | 'reports' | 'settings'

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [sales, setSales] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    todaySales: 12450,
    billsCount: 42,
    cashTotal: 6200,
    upiTotal: 5850,
    expensesTotal: 1200,
    profitTotal: 3250,
    creditTotal: 1000,
    cardTotal: 400,
    recentBills: [],
  });

  // Billing View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [billNo, setBillNo] = useState('INV-000125');
  const [billDate, setBillDate] = useState('23 Sep 2026');
  const [billTime, setBillTime] = useState('10:24 AM');

  // Direct cart state (Starts clean and empty)
  const [cartItems, setCartItems] = useState([]);
  const [parcelCount, setParcelCount] = useState(0);
  const [heldBill, setHeldBill] = useState(null);

  // Modals & Popups
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [viewSaleDetails, setViewSaleDetails] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // New Item Quick Form
  const [quickItem, setQuickItem] = useState({
    name: '',
    category: 'Rumali Rolls',
    sellingPrice: '',
  });
  const [customers, setCustomers] = useState([]);

  // Printer status
  const [printerConnected, setPrinterConnected] = useState(printerService.isConnected);
  const [firebaseState, setFirebaseState] = useState(firebaseService.getState());
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const searchInputRef = useRef(null);

  const loadAllData = async () => {
    const prods = await storageService.getProducts();
    const cats = await storageService.getCategories();
    const sett = await storageService.getSettings();
    const allSales = await storageService.getSales();
    const metrics = await storageService.getDashboardMetrics();
    const custs = await storageService.getCustomers();

    setProducts(prods);
    setCategories(cats);
    setSettings(sett);
    setSales(allSales);
    setDashboardMetrics(metrics);
    setCustomers(custs);

    const now = new Date();
    setBillDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setBillTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  useEffect(() => {
    loadAllData();

    const unsub = printerService.subscribe((s) => {
      setPrinterConnected(s.isConnected);
    });

    const unsubFb = firebaseService.subscribe((s) => {
      setFirebaseState(s);
    });

    // Start live sync across devices if connected
    firebaseService.startLiveSync(({ type, data }) => {
      if (type === 'products') setProducts(data);
      if (type === 'sales') setSales(data);
    });

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsub();
      unsubFb();
      firebaseService.stopLiveSync();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All Items' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

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
      return [...prev, {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        qty: 1,
        amount: product.sellingPrice,
      }];
    });
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

  // Complete & Print Bill (Fast & Direct)
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
      paymentMethod: 'Cash',
      amountReceived: grandTotal,
      change: 0,
      customerName: 'Walk-in Customer',
    };

    const saved = await storageService.completeSale(payload);

    // Direct background print to EXEO EX58P if ready
    if (printerService.isConnected) {
      printerService.printReceipt(saved, settings).catch(() => {});
    }

    // Open receipt preview modal
    setCompletedSale(saved);
    setMobileCartOpen(false);

    // Prepare next bill immediately
    setCartItems([]);
    setParcelCount(0);
    const nextBillNo = await storageService.getNextBillNumber();
    setBillNo(nextBillNo);
    loadAllData();
  };

  const handleDeleteInvoice = async (saleId) => {
    const updated = await storageService.deleteSale(saleId);
    setSales(updated);
    const metrics = await storageService.getDashboardMetrics();
    setDashboardMetrics(metrics);
    if (viewSaleDetails?.id === saleId) setViewSaleDetails(null);
  };

  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    if (!quickItem.name.trim() || !quickItem.sellingPrice) return;
    const created = await storageService.saveProduct({
      name: quickItem.name.trim(),
      category: quickItem.category,
      sellingPrice: Number(quickItem.sellingPrice),
      stock: 50,
      status: 'Active'
    });
    setProducts(prev => [created, ...prev]);
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
          {activeTab === 'billing' && (
            <button 
              className="btn-quick-add-item top-quick-add"
              onClick={() => setShowQuickAddModal(true)}
            >
              <Plus size={15} />
              <span>Quick Add</span>
            </button>
          )}

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
            className={`nav-link-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => selectTab('customers')}
          >
            <Users size={18} />
            <span>Customers</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => selectTab('sales')}
          >
            <TrendingUp size={18} />
            <span>Sales</span>
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
        </nav>

        {/* Sidebar Profile & Logout Footer */}
        <div className="sidebar-profile-box">
          <div className="user-profile-row">
            <div className="avatar-circle">
              <User size={18} />
            </div>
            <div>
              <div className="user-meta-name">Muhammad Fayiz</div>
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

                <button 
                  className="btn-quick-add-item"
                  onClick={() => setShowQuickAddModal(true)}
                >
                  <Plus size={16} />
                  <span>Quick Add</span>
                </button>
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
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 3-Column Product Cards Grid */}
              <div className="products-cards-grid">
                {filteredProducts.map(prod => {
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
                          {selectedCategory === 'All Items' && (
                            <span className="card-prod-cat-badge">{prod.category}</span>
                          )}
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
            TAB: DASHBOARD (Matches bottom left preview!)
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="view-container-standard">
            <div className="view-header-row">
              <div>
                <h2>Dashboard</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-tertiary)' }}>Good morning, Muhammad!</p>
              </div>
              <span className="category-filter-pill" style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                Today ▾
              </span>
            </div>

            {/* 8 KPI Cards */}
            <div className="dashboard-kpi-grid">
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Today's Sales</div>
                <div className="kpi-figure-value green font-mono">₹{dashboardMetrics.todaySales.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Bills</div>
                <div className="kpi-figure-value font-mono">{dashboardMetrics.billsCount}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Cash</div>
                <div className="kpi-figure-value green font-mono">₹{dashboardMetrics.cashTotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">UPI</div>
                <div className="kpi-figure-value green font-mono">₹{dashboardMetrics.upiTotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Expenses</div>
                <div className="kpi-figure-value red font-mono">₹{dashboardMetrics.expensesTotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Profit</div>
                <div className="kpi-figure-value green font-mono">₹{dashboardMetrics.profitTotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Credit</div>
                <div className="kpi-figure-value red font-mono">₹{dashboardMetrics.creditTotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Card</div>
                <div className="kpi-figure-value font-mono">₹{dashboardMetrics.cardTotal.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Recent Bills Table */}
            <div className="pos-table-card">
              <div style={{ padding: '0.85rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                <strong style={{ fontSize: '0.95rem' }}>Recent Bills</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--brown-primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('sales')}>
                  View All
                </span>
              </div>
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Time</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardMetrics.recentBills.slice(0, 5).map(b => (
                    <tr key={b.id}>
                      <td className="font-mono" style={{ fontWeight: 800 }}>{b.billNo}</td>
                      <td>{b.time || '10:24 AM'}</td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>₹{b.total}</td>
                      <td><span className="category-filter-pill" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{b.paymentMethod || 'Cash'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button 
                            className="btn-hold-bill-outline"
                            onClick={() => setViewSaleDetails(b)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            title="View Invoice"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button 
                            className="entry-del-btn"
                            onClick={async () => {
                              if (window.confirm(`Delete invoice ${b.billNo} (₹${b.total})? This cannot be undone.`)) {
                                await handleDeleteInvoice(b.id);
                              }
                            }}
                            style={{ padding: '0.25rem', color: 'var(--red-accent)' }}
                            title="Delete Invoice"
                          >
                            <Trash2 size={15} />
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
                    if (window.confirm('Reset catalog to official Weknd menu (45 items)?')) {
                      const res = await storageService.resetToOfficialMenu();
                      setProducts(res);
                      const cats = await storageService.getCategories();
                      setCategories(cats);
                    }
                  }}
                  title="Restore full official menu"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={15} />
                  <span>Reset to Official Menu</span>
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
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td><span className="card-prod-cat-badge">{p.category}</span></td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>₹{p.sellingPrice}</td>
                      <td className="font-mono">{p.stock || 50}</td>
                      <td><span className="status-tag-active">Active</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
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
          <div className="view-container-standard">
            <div className="view-header-row">
              <h2>Sales</h2>
              <span className="category-filter-pill" style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                Today ▾
              </span>
            </div>

            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Date & Time</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono" style={{ fontWeight: 800 }}>{s.billNo}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.date}, {s.time || ''}</td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>₹{s.total}</td>
                      <td><span className="category-filter-pill" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{s.paymentMethod || 'Cash'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            className="btn-hold-bill-outline"
                            onClick={() => setViewSaleDetails(s)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            title="View Invoice"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button 
                            className="entry-del-btn"
                            onClick={async () => {
                              if (window.confirm(`Delete invoice ${s.billNo} (₹${s.total})? This cannot be undone.`)) {
                                await handleDeleteInvoice(s.id);
                              }
                            }}
                            style={{ padding: '0.25rem', color: 'var(--red-accent)' }}
                            title="Delete Invoice"
                          >
                            <Trash2 size={15} />
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
            TAB: REPORTS (Matches bottom right preview!)
           ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="view-container-standard">
            <div className="view-header-row">
              <h2>Reports</h2>
              <span className="category-filter-pill" style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                This Month ▾
              </span>
            </div>

            <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Total Sales</div>
                <div className="kpi-figure-value green font-mono">₹1,24,500</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Total Bills</div>
                <div className="kpi-figure-value font-mono">420</div>
              </div>
              <div className="kpi-stat-card">
                <div className="kpi-title-label">Profit</div>
                <div className="kpi-figure-value green font-mono">₹32,450</div>
              </div>
            </div>

            <div className="pos-table-card" style={{ padding: '1.25rem' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Daily Sales</strong>
              <div className="bar-chart-mock">
                {[30, 45, 60, 25, 80, 50, 65, 40, 75, 90, 55, 60, 70, 85, 40, 50, 65, 80, 75, 90, 85, 60, 70, 80, 65, 95].map((h, i) => (
                  <div key={i} className="mock-bar" style={{ height: `${h}%` }} title={`Day ${i+1}: ${h * 50}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: CUSTOMERS
           ========================================================================= */}
        {activeTab === 'customers' && (
          <div className="view-container-standard">
            <h2>Customers</h2>
            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Credit / Due</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>{c.phone || '-'}</td>
                      <td className="font-mono" style={{ fontWeight: 800, color: c.dueAmount > 0 ? 'var(--red-accent)' : 'inherit' }}>₹{c.dueAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: EXPENSES
           ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="view-container-standard">
            <h2>Expenses</h2>
            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>23 Sep 2026</td>
                    <td>Shop Utilities & Paper</td>
                    <td className="font-mono" style={{ fontWeight: 800, color: 'var(--red-accent)' }}>₹1,200</td>
                  </tr>
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
                      const res = await storageService.uploadAllToFirebase();
                      setSyncMessage(`Successfully uploaded ${res.count} products & shop data to Firebase!`);
                    } catch (err) {
                      setSyncMessage(`Upload failed: ${err.message || 'Permission denied'}`);
                    } finally {
                      setSyncingCloud(false);
                      setTimeout(() => setSyncMessage(null), 6000);
                    }
                  }}
                >
                  <UploadCloud size={16} />
                  <span>{syncingCloud ? 'Uploading...' : 'Upload All Menu & Data to Cloud'}</span>
                </button>

                <button 
                  className="btn-clear-bill-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                  disabled={syncingCloud}
                  onClick={async () => {
                    setSyncingCloud(true);
                    setSyncMessage(null);
                    try {
                      const res = await storageService.pullAllFromFirebase();
                      if (res) {
                        await loadAllData();
                        setSyncMessage('Successfully pulled latest cloud database!');
                      } else {
                        setSyncMessage('No data found in Firebase node yet.');
                      }
                    } catch (err) {
                      setSyncMessage(`Pull failed: ${err.message || 'Permission denied'}`);
                    } finally {
                      setSyncingCloud(false);
                      setTimeout(() => setSyncMessage(null), 6000);
                    }
                  }}
                >
                  <DownloadCloud size={16} />
                  <span>Pull from Cloud</span>
                </button>
              </div>

              {firebaseState.lastSyncTime && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Last Synced: {firebaseState.lastSyncTime}
                </div>
              )}
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

      {/* 58mm Thermal Receipt Preview Modal */}
      {completedSale && (
        <ThermalReceiptPreview 
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Sale Details Modal */}
      {viewSaleDetails && (
        <ThermalReceiptPreview 
          sale={viewSaleDetails}
          settings={settings}
          onClose={() => setViewSaleDetails(null)}
          onDelete={handleDeleteInvoice}
        />
      )}

      {/* EXEO EX58P Hardware Dialog */}
      {showPrinterModal && (
        <PrinterModal onClose={() => setShowPrinterModal(false)} />
      )}
    </div>
  );
}
