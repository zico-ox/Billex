import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Flame, 
  ShoppingBag, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Download, 
  ArrowUpDown, 
  TrendingUp, 
  Package, 
  BarChart3,
  RotateCcw,
  Sparkles,
  Receipt,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';

export default function ProductSalesView({
  sales = [],
  products = [],
  settings = {},
  onBack,
  onNavigate
}) {
  // Helper for formatting YYYY-MM-DD
  const getTodayYmd = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getYesterdayYmd = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Time Filter: 'today' | 'yesterday' | 'week' | 'month' | 'specific'
  const [timeFilter, setTimeFilter] = useState('today');

  // Selected date for 'specific' mode (YYYY-MM-DD)
  const [specificDate, setSpecificDate] = useState(getTodayYmd);

  // Search & Category & Sort filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('qty_desc'); // 'qty_desc' | 'revenue_desc' | 'orders_desc' | 'name_asc' | 'qty_asc'

  // Item type filter: 'all' | 'catalog' | 'open_food' (Option A)
  const [itemTypeFilter, setItemTypeFilter] = useState('all');

  // Tick box state: hide/unhide zero sales items
  const [hideZeroSales, setHideZeroSales] = useState(false);

  // Date stepper handlers for 'specific' date mode
  const handleStepDay = (delta) => {
    try {
      const [y, m, d] = specificDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + delta);
      const ny = curr.getFullYear();
      const nm = String(curr.getMonth() + 1).padStart(2, '0');
      const nd = String(curr.getDate()).padStart(2, '0');
      setSpecificDate(`${ny}-${nm}-${nd}`);
      setTimeFilter('specific');
    } catch {
      setSpecificDate(getTodayYmd());
    }
  };

  const isSpecificToday = specificDate === getTodayYmd();

  // Filter Sales for the active timeframe
  const { filteredSales, periodLabel, activeDateFormatted, billsCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const todayStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const yDate = new Date(now);
    yDate.setDate(yDate.getDate() - 1);
    const yesterdayStr = yDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Specific date bounds
    let specStart = null;
    let specEnd = null;
    let specStr = '';
    let specDisplay = '';

    if (specificDate) {
      const [sy, sm, sd] = specificDate.split('-').map(Number);
      const specObj = new Date(sy, sm - 1, sd);
      specStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      specEnd = new Date(sy, sm - 1, sd, 23, 59, 59, 999);
      specStr = specObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      specDisplay = specObj.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    }

    const isMatch = (item) => {
      // 1. Numeric timestamp
      if (item.timestamp && !isNaN(Number(item.timestamp))) {
        const t = Number(item.timestamp);
        if (timeFilter === 'today') return t >= startOfToday.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'yesterday') return t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime();
        if (timeFilter === 'week') return t >= startOfWeek.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'month') return t >= startOfMonth.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'specific') {
          return specStart && specEnd ? t >= specStart.getTime() && t <= specEnd.getTime() : false;
        }
      }

      // 2. ISO createdAt
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (!isNaN(itemDate.getTime())) {
          if (timeFilter === 'today') return itemDate >= startOfToday && itemDate <= endOfToday;
          if (timeFilter === 'yesterday') return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
          if (timeFilter === 'week') return itemDate >= startOfWeek && itemDate <= endOfToday;
          if (timeFilter === 'month') return itemDate >= startOfMonth && itemDate <= endOfToday;
          if (timeFilter === 'specific') {
            return specStart && specEnd ? itemDate >= specStart && itemDate <= specEnd : false;
          }
        }
      }

      // 3. Fallback date string
      if (item.date) {
        if (timeFilter === 'today') return item.date === todayStr;
        if (timeFilter === 'yesterday') return item.date === yesterdayStr;
        if (timeFilter === 'specific') return item.date === specStr;

        const parsed = new Date(item.date);
        if (!isNaN(parsed.getTime())) {
          if (timeFilter === 'week') return parsed >= startOfWeek && parsed <= endOfToday;
          if (timeFilter === 'month') return parsed >= startOfMonth && parsed <= endOfToday;
          if (timeFilter === 'specific' && specStart && specEnd) return parsed >= specStart && parsed <= specEnd;
        }
      }

      return false;
    };

    const matchedSales = sales.filter(isMatch);

    let label = 'Today';
    let displayStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    if (timeFilter === 'yesterday') {
      label = 'Yesterday';
      displayStr = yDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    } else if (timeFilter === 'week') {
      label = 'This Week';
      displayStr = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${todayStr}`;
    } else if (timeFilter === 'month') {
      label = 'This Month';
      displayStr = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (timeFilter === 'specific') {
      label = specDisplay || specificDate;
      displayStr = specDisplay;
    }

    return {
      filteredSales: matchedSales,
      periodLabel: label,
      activeDateFormatted: displayStr,
      billsCount: matchedSales.length
    };
  }, [sales, timeFilter, specificDate]);

  // Aggregate Product Sales and merge with full catalog (to support zero sales)
  const { allProductsCombined, summaryStats, categoriesList, zeroSalesCount, soldProductsCount } = useMemo(() => {
    const salesMap = {};
    let totalUnitsSold = 0;
    let totalProductRevenue = 0;
    const catsSet = new Set();

    filteredSales.forEach(sale => {
      if (Array.isArray(sale.items)) {
        const itemsInThisBill = new Set();

        sale.items.forEach(it => {
          const name = (it.name || it.title || 'Custom Item').trim();
          const category = (it.category || 'General').trim();
          catsSet.add(category);

          const qty = Number(it.qty) || 1;
          const unitPrice = Number(it.sellingPrice || it.price) || 
            (Number(it.total || it.amount) ? Number(it.total || it.amount) / qty : 0);
          const revenue = Number(it.amount || it.total) || (unitPrice * qty);

          const isOpen = Boolean(
            it.isOpenFood === true ||
            it.category === 'Open Food' ||
            (it.productId && String(it.productId).startsWith('open_')) ||
            (it.id && String(it.id).startsWith('open_')) ||
            (it.name && String(it.name).toLowerCase().trim() === 'open food')
          );

          const norm = name.toLowerCase();
          if (!salesMap[norm]) {
            salesMap[norm] = {
              name,
              category: isOpen ? 'Open Food' : category,
              qty: 0,
              revenue: 0,
              unitPrice,
              ordersCount: 0,
              isOpenFood: isOpen
            };
          }

          salesMap[norm].qty += qty;
          salesMap[norm].revenue += revenue;
          if (isOpen) salesMap[norm].isOpenFood = true;
          totalUnitsSold += qty;
          totalProductRevenue += revenue;
          itemsInThisBill.add(norm);
        });

        itemsInThisBill.forEach(n => {
          if (salesMap[n]) {
            salesMap[n].ordersCount += 1;
          }
        });
      }
    });

    // Merge with full catalog products so zero sales can be viewed
    const combined = [];
    const processed = new Set();

    if (Array.isArray(products) && products.length > 0) {
      products.forEach(p => {
        const name = (p.name || '').trim();
        if (!name) return;
        const norm = name.toLowerCase();
        processed.add(norm);

        const category = (p.category || 'General').trim();
        catsSet.add(category);
        const catPrice = Number(p.sellingPrice) || 0;

        const saleRecord = salesMap[norm];
        if (saleRecord) {
          combined.push({
            id: p.id || norm,
            name: name,
            category: saleRecord.category || category,
            qty: saleRecord.qty,
            revenue: saleRecord.revenue,
            unitPrice: saleRecord.qty > 0 ? Math.round(saleRecord.revenue / saleRecord.qty) : (saleRecord.unitPrice || catPrice),
            ordersCount: saleRecord.ordersCount,
            isZeroSale: false
          });
        } else {
          combined.push({
            id: p.id || norm,
            name: name,
            category: category,
            qty: 0,
            revenue: 0,
            unitPrice: catPrice,
            ordersCount: 0,
            isZeroSale: true
          });
        }
      });
    }

    // Include any sold items not in products catalog (e.g. custom items & open food)
    Object.keys(salesMap).forEach(norm => {
      if (!processed.has(norm)) {
        const s = salesMap[norm];
        combined.push({
          id: `custom_${norm}`,
          name: s.name,
          category: s.category || (s.isOpenFood ? 'Open Food' : 'General'),
          qty: s.qty,
          revenue: s.revenue,
          unitPrice: s.qty > 0 ? Math.round(s.revenue / s.qty) : s.unitPrice,
          ordersCount: s.ordersCount,
          isZeroSale: false,
          isOpenFood: Boolean(s.isOpenFood || s.category === 'Open Food')
        });
      }
    });

    const zeroCount = combined.filter(p => p.qty === 0).length;
    const soldCount = combined.filter(p => p.qty > 0).length;

    // Calculate separated Open Food metrics
    const openFoodItems = combined.filter(p => p.isOpenFood && p.qty > 0);
    const openFoodUnits = openFoodItems.reduce((sum, p) => sum + p.qty, 0);
    const openFoodRevenue = openFoodItems.reduce((sum, p) => sum + p.revenue, 0);
    const openFoodBills = openFoodItems.reduce((sum, p) => Math.max(sum, p.ordersCount), 0);
    const openFoodCount = openFoodItems.length;

    // Catalog items count
    const catalogCount = combined.filter(p => !p.isOpenFood).length;

    // Enrich with revenue and units shares
    const enriched = combined.map(item => ({
      ...item,
      isOpenFood: Boolean(item.isOpenFood),
      revenueShare: totalProductRevenue > 0 && item.revenue > 0 ? ((item.revenue / totalProductRevenue) * 100).toFixed(1) : '0',
      unitsShare: totalUnitsSold > 0 && item.qty > 0 ? ((item.qty / totalUnitsSold) * 100).toFixed(1) : '0'
    }));

    // Find top selling item
    const sortedSold = enriched.filter(p => p.qty > 0).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
    const topItem = sortedSold[0] || null;

    return {
      allProductsCombined: enriched,
      summaryStats: {
        totalUnits: totalUnitsSold,
        totalRevenue: totalProductRevenue,
        uniqueProducts: soldCount,
        totalCatalogCount: enriched.length,
        catalogCount,
        topItem,
        openFoodUnits,
        openFoodRevenue,
        openFoodBills,
        openFoodCount
      },
      categoriesList: Array.from(catsSet).sort(),
      zeroSalesCount: zeroCount,
      soldProductsCount: soldCount,
      openFoodTotalUnits: openFoodUnits,
      openFoodTotalRevenue: openFoodRevenue,
      openFoodUniqueCount: openFoodCount
    };
  }, [filteredSales, products]);

  // Filter & sort for table display
  const displayedProducts = useMemo(() => {
    let result = [...allProductsCombined];

    // Item Type Filter: 'catalog' vs 'open_food' vs 'all'
    if (itemTypeFilter === 'catalog') {
      result = result.filter(p => !p.isOpenFood);
    } else if (itemTypeFilter === 'open_food') {
      result = result.filter(p => p.isOpenFood);
    }

    // Tick box: Hide zero sales
    if (hideZeroSales) {
      result = result.filter(p => p.qty > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'qty_desc') {
        if (b.qty !== a.qty) return b.qty - a.qty;
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'qty_asc') {
        if (a.qty !== b.qty) return a.qty - b.qty;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'revenue_desc') {
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        return b.qty - a.qty;
      }
      if (sortBy === 'orders_desc') {
        if (b.ordersCount !== a.ordersCount) return b.ordersCount - a.ordersCount;
        return b.qty - a.qty;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    // Compute relative percentage for progress bar
    const maxQty = result.find(p => p.qty > 0)?.qty || 1;
    let currentRank = 1;

    return result.map((item) => {
      const hasSales = item.qty > 0;
      const rank = hasSales ? currentRank++ : null;
      return {
        ...item,
        displayRank: rank,
        percentage: hasSales ? Math.min(100, Math.round((item.qty / maxQty) * 100)) : 0
      };
    });
  }, [allProductsCombined, itemTypeFilter, hideZeroSales, searchQuery, selectedCategory, sortBy]);

  // CSV Export
  const handleExportCsv = () => {
    if (displayedProducts.length === 0) return;

    const headers = ['Rank', 'Product Name', 'Category', 'Units Sold', 'Avg Price (INR)', 'Orders Count', 'Total Revenue (INR)', 'Revenue Share (%)', 'Status'];
    const rows = displayedProducts.map(p => [
      p.displayRank ? `#${p.displayRank}` : 'Unsold',
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.qty,
      p.unitPrice,
      p.ordersCount,
      p.revenue,
      `${p.revenueShare}%`,
      p.qty > 0 ? 'Active' : 'Zero Sales'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanDate = (periodLabel || 'Report').replace(/[^a-zA-Z0-9-_]/g, '_');
    link.setAttribute('download', `Product_Sales_${cleanDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-container-standard product-sales-page-view">
      {/* 1. Page Header with Back Navigation and Title */}
      <div className="dashboard-top-header product-sales-page-header">
        <div className="product-sales-page-title-cluster">
          <button
            type="button"
            className="product-sales-back-btn"
            onClick={onBack}
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>

          <div className="dashboard-title-box">
            <div className="dashboard-title-row">
              <h2>Sales by Product</h2>
              <span className="live-status-pill font-mono">
                {periodLabel}
              </span>
              <span className="product-sales-bills-badge">
                <Receipt size={12} />
                <span>{billsCount} {billsCount === 1 ? 'bill' : 'bills'}</span>
              </span>
            </div>
            <p className="dashboard-subtitle">
              {settings?.storeName || 'Weknd.'} • {activeDateFormatted} • Complete breakdown of items ordered, revenue generated, and unsold products
            </p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          {displayedProducts.length > 0 && (
            <button
              type="button"
              className="btn-hold-bill-outline export-csv-btn"
              onClick={handleExportCsv}
              title="Download CSV report of product sales"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Time Filter Bar: Today | Yesterday | This Week | This Month | Specific Date */}
      <div className="product-sales-filter-card">
        <div className="product-sales-time-row">
          {/* Preset Segmented Tabs */}
          <div className="time-filter-segmented">
            <button
              type="button"
              className={`time-filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => {
                setTimeFilter('today');
                setSpecificDate(getTodayYmd());
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={`time-filter-btn ${timeFilter === 'yesterday' ? 'active' : ''}`}
              onClick={() => {
                setTimeFilter('yesterday');
                setSpecificDate(getYesterdayYmd());
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              className={`time-filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
              onClick={() => setTimeFilter('week')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`time-filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => setTimeFilter('month')}
            >
              This Month
            </button>
            <button
              type="button"
              className={`time-filter-btn ${timeFilter === 'specific' ? 'active' : ''}`}
              onClick={() => setTimeFilter('specific')}
            >
              <Calendar size={13} style={{ marginRight: '0.3rem' }} />
              Specific Date
            </button>
          </div>

          {/* Day-by-Day Stepper Toolbar */}
          <div className="product-sales-stepper-box">
            <span className="stepper-label">Select Day:</span>
            <button
              type="button"
              className="stepper-arrow-btn"
              onClick={() => handleStepDay(-1)}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              className="product-sales-date-input font-mono"
              value={specificDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSpecificDate(e.target.value);
                  setTimeFilter('specific');
                }
              }}
              title="Choose exact calendar date"
            />
            <button
              type="button"
              className="stepper-arrow-btn"
              onClick={() => handleStepDay(1)}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
            {!isSpecificToday && (
              <button
                type="button"
                className="stepper-today-jump-btn"
                onClick={() => {
                  setSpecificDate(getTodayYmd());
                  setTimeFilter('today');
                }}
                title="Jump to Today"
              >
                <RotateCcw size={12} />
                <span>Today</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. KPI Summary Ribbon */}
      <div className="product-sales-kpis-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="ps-kpi-card accent-blue">
          <div className="ps-kpi-icon-pill blue">
            <Package size={16} />
          </div>
          <div className="ps-kpi-content">
            <div className="ps-kpi-label">Total Units Sold</div>
            <div className="ps-kpi-value font-mono">
              {summaryStats.totalUnits.toLocaleString('en-IN')}
              <span className="ps-kpi-unit">items</span>
            </div>
          </div>
        </div>

        <div className="ps-kpi-card accent-green">
          <div className="ps-kpi-icon-pill green">
            <TrendingUp size={16} />
          </div>
          <div className="ps-kpi-content">
            <div className="ps-kpi-label">Product Revenue</div>
            <div className="ps-kpi-value font-mono green">
              ₹{summaryStats.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="ps-kpi-card accent-purple">
          <div className="ps-kpi-icon-pill purple">
            <Sparkles size={16} />
          </div>
          <div className="ps-kpi-content">
            <div className="ps-kpi-label">Open Food Sales</div>
            <div className="ps-kpi-value font-mono" style={{ color: '#9333ea' }}>
              {summaryStats.openFoodUnits} <span className="ps-kpi-unit">items</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
              ₹{summaryStats.openFoodRevenue.toLocaleString('en-IN')} ({summaryStats.openFoodCount} {summaryStats.openFoodCount === 1 ? 'dish' : 'dishes'})
            </div>
          </div>
        </div>

        <div className="ps-kpi-card accent-slate">
          <div className="ps-kpi-icon-pill slate">
            <BarChart3 size={16} />
          </div>
          <div className="ps-kpi-content">
            <div className="ps-kpi-label">Menu Items Sold</div>
            <div className="ps-kpi-value font-mono">
              {summaryStats.uniqueProducts}
              <span className="ps-kpi-unit">/ {summaryStats.catalogCount}</span>
            </div>
          </div>
        </div>

        <div className="ps-kpi-card accent-amber">
          <div className="ps-kpi-icon-pill amber">
            <Flame size={16} />
          </div>
          <div className="ps-kpi-content">
            <div className="ps-kpi-label">Top Selling Item</div>
            <div className="ps-kpi-value-top-item" title={summaryStats.topItem?.name || 'None'}>
              {summaryStats.topItem ? (
                <>
                  <span className="top-name">{summaryStats.topItem.name}</span>
                  <span className="top-badge">{summaryStats.topItem.qty} sold</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Search, Category, Sort, Item Type Filter, and ZERO SALES TICK BOX */}
      <div className="product-sales-controls-bar">
        {/* Item Type Segmented Tabs (Option A: All | Catalog Menu | Open Food Only) */}
        <div className="ps-type-filter-segmented">
          <button
            type="button"
            className={`ps-type-btn ${itemTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setItemTypeFilter('all')}
          >
            <span>All</span>
            <span className="ps-type-badge">{allProductsCombined.length}</span>
          </button>
          <button
            type="button"
            className={`ps-type-btn ${itemTypeFilter === 'catalog' ? 'active' : ''}`}
            onClick={() => setItemTypeFilter('catalog')}
          >
            <span>Catalog Menu</span>
            <span className="ps-type-badge">{summaryStats.catalogCount}</span>
          </button>
          <button
            type="button"
            className={`ps-type-btn open-food ${itemTypeFilter === 'open_food' ? 'active' : ''}`}
            onClick={() => setItemTypeFilter('open_food')}
          >
            <Sparkles size={13} color="#9333ea" />
            <span>Open Food Only</span>
            <span className="ps-type-badge">{summaryStats.openFoodCount}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="ps-search-input-box">
          <Search size={15} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search product name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="ps-clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category & Sort Filters */}
        <div className="ps-filter-dropdown-group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="ps-select-input"
          >
            <option value="all">All Categories ({categoriesList.length})</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ps-select-input"
          >
            <option value="qty_desc">Sort: Highest Quantity Sold</option>
            <option value="revenue_desc">Sort: Highest Revenue (₹)</option>
            <option value="orders_desc">Sort: Most Bills / Orders</option>
            <option value="name_asc">Sort: Product Name (A to Z)</option>
            <option value="qty_asc">Sort: Lowest Quantity Sold</option>
          </select>

          {/* ZERO SALES TICK BOX */}
          <label 
            className={`ps-zero-sales-toggle ${hideZeroSales ? 'active-hide' : 'active-show'}`}
            title="Tick to hide or unhide products with zero sales in this period"
          >
            <input
              type="checkbox"
              id="toggle-hide-zero-sales"
              checked={hideZeroSales}
              onChange={(e) => setHideZeroSales(e.target.checked)}
              className="ps-checkbox-native"
            />
            <span className="ps-checkbox-indicator">
              {hideZeroSales ? <EyeOff size={14} /> : <Eye size={14} />}
            </span>
            <span className="ps-checkbox-text">
              {hideZeroSales ? (
                <>Hide zero sales <span className="ps-count-badge">{zeroSalesCount}</span></>
              ) : (
                <>Showing all <span className="ps-count-badge green">{zeroSalesCount} zero</span></>
              )}
            </span>
          </label>
        </div>
      </div>

      {/* 5. Products Table */}
      <div className="pos-table-card product-sales-table-card">
        {displayedProducts.length === 0 ? (
          <div className="dashboard-empty-state" style={{ padding: '4rem 1.5rem' }}>
            <ShoppingBag size={38} color="var(--text-tertiary)" style={{ opacity: 0.45, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              No product sales found
            </p>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '0.35rem', maxWidth: '420px', textAlign: 'center' }}>
              {searchQuery || selectedCategory !== 'all'
                ? 'No products matched your search or category filter. Try clearing the filters.'
                : hideZeroSales
                  ? `No items were sold in ${periodLabel.toLowerCase()} (${activeDateFormatted}). Uncheck "Hide zero sales" to see all catalog products.`
                  : `No items were sold in ${periodLabel.toLowerCase()} (${activeDateFormatted}). Try selecting another date.`}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  className="btn-hold-bill-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filters
                </button>
              )}
              {hideZeroSales && zeroSalesCount > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setHideZeroSales(false)}
                >
                  Show Zero Sales Products ({zeroSalesCount})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="product-sales-table-responsive" style={{ maxHeight: 'calc(100vh - 360px)' }}>
            <table className="pos-table product-sales-table">
              <thead>
                <tr>
                  <th style={{ width: '55px' }}>Rank</th>
                  <th>Product & Category</th>
                  <th style={{ minWidth: '190px' }}>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'center' }}>In Bills</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Rev Share</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const rank = p.displayRank;
                  const isZero = p.qty === 0;

                  let rankClass = 'rank-other';
                  if (rank === 1) rankClass = 'rank-1';
                  else if (rank === 2) rankClass = 'rank-2';
                  else if (rank === 3) rankClass = 'rank-3';

                  return (
                    <tr key={p.id || p.name} className={`product-sales-row ${isZero ? 'zero-sales-row' : ''}`}>
                      {/* Rank */}
                      <td>
                        {rank ? (
                          <span className={`rank-pill-badge ${rankClass}`}>
                            #{rank}
                          </span>
                        ) : (
                          <span className="rank-pill-badge rank-zero" title="Zero sales in this period">
                            —
                          </span>
                        )}
                      </td>

                      {/* Product Name & Category */}
                      <td>
                        <div className="ps-item-title-box">
                          <span className={`ps-item-name ${isZero ? 'muted' : ''}`} title={p.name}>
                            {p.name}
                          </span>
                          {p.isOpenFood ? (
                            <span className="ps-open-food-pill" title="Custom manual entry item">
                              <Sparkles size={10} />
                              <span>Open Food</span>
                            </span>
                          ) : p.category ? (
                            <span className="ps-item-category-pill">
                              {p.category}
                            </span>
                          ) : null}
                          {isZero && (
                            <span className="ps-zero-tag">
                              Unsold
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Units Sold with Relative Progress Bar */}
                      <td>
                        <div className="ps-qty-column">
                          <div className={`ps-qty-num font-mono ${isZero ? 'zero' : ''}`}>
                            <strong>{p.qty}</strong>
                            <span className="ps-qty-sublabel">{p.qty === 1 ? 'sold' : 'sold'}</span>
                          </div>
                          <div className="top-item-bar-bg" style={{ height: '6px' }}>
                            <div
                              className="top-item-bar-fill"
                              style={{
                                width: isZero ? '0%' : `${p.percentage}%`,
                                background: rank === 1 ? '#d97706' : isZero ? '#e2e8f0' : 'var(--brown-primary)'
                              }}
                              title={`${p.qty} sold (${p.percentage}% relative to #1)`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-mono ps-price-text">
                          ₹{p.unitPrice.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* In Bills Count */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`ps-orders-pill font-mono ${isZero ? 'zero' : ''}`}>
                          {p.ordersCount} {p.ordersCount === 1 ? 'bill' : 'bills'}
                        </span>
                      </td>

                      {/* Total Revenue */}
                      <td style={{ textAlign: 'right' }}>
                        <span className={`font-mono ps-revenue-text ${isZero ? 'zero' : ''}`}>
                          ₹{p.revenue.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Revenue Share % */}
                      <td style={{ textAlign: 'right' }}>
                        <span className={`ps-share-badge font-mono ${isZero ? 'zero' : ''}`}>
                          {p.revenueShare}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Summary Footer Bar */}
        <div className="product-sales-table-footer">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{displayedProducts.length}</strong> of <strong>{allProductsCombined.length}</strong> items
            {zeroSalesCount > 0 && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-tertiary)' }}>
                ({soldProductsCount} sold • {zeroSalesCount} unsold)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.2rem' }}>
            <span>Total Units: <strong className="font-mono">{summaryStats.totalUnits}</strong></span>
            <span>Total Revenue: <strong className="font-mono green">₹{summaryStats.totalRevenue.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
