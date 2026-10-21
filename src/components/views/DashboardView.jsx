import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  Eye, 
  Trash2, 
  Flame, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  Sparkles,
  ArrowDownRight,
  Clock,
  Banknote,
  QrCode,
  ShoppingBag,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export default function DashboardView({
  sales = [],
  expenses = [],
  settings = {},
  onViewSale,
  onDeleteSale,
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

  // Time filter state: 'today' | 'yesterday' | 'week' | 'month' | 'specific'
  const [timeFilter, setTimeFilter] = useState('today');

  // Selected date for 'specific' mode (YYYY-MM-DD)
  const [specificDate, setSpecificDate] = useState(getTodayYmd);

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

  // Filter Sales and Expenses based on selected period
  const { filteredSales, filteredExpenses, periodLabel, dateRangeString } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    // Monday as start of current week
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);

    // 1st of current month
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
      // 1. Check numeric timestamp
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

      // 2. Check ISO createdAt string
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

      // 3. Fallback to formatted date string
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

    const sList = sales.filter(isMatch);
    const eList = expenses.filter(isMatch);

    let label = "Today";
    let dateStr = todayStr;
    if (timeFilter === 'yesterday') {
      label = "Yesterday";
      dateStr = yesterdayStr;
    } else if (timeFilter === 'week') {
      label = "This Week";
      dateStr = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${todayStr}`;
    } else if (timeFilter === 'month') {
      label = "This Month";
      dateStr = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (timeFilter === 'specific') {
      label = specDisplay || specificDate;
      dateStr = specDisplay || specStr;
    }

    return {
      filteredSales: sList,
      filteredExpenses: eList,
      periodLabel: label,
      dateRangeString: dateStr
    };
  }, [sales, expenses, timeFilter, specificDate]);

  // Compute 8 KPI Metrics
  const metrics = useMemo(() => {
    let salesTotal = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let credit = 0;
    let profit = 0;

    filteredSales.forEach(s => {
      const tot = Number(s.total) || 0;
      salesTotal += tot;

      const m = String(s.paymentMethod || 'Cash').toLowerCase();
      if (m.includes('cash')) cash += tot;
      else if (m.includes('upi')) upi += tot;
      else if (m.includes('card')) card += tot;
      else if (m.includes('credit')) credit += tot;
      else cash += tot;

      // Gross profit (35% default margin or custom item margins)
      let saleProfit = 0;
      if (Array.isArray(s.items) && s.items.length > 0) {
        let hasCustomCost = false;
        s.items.forEach(it => {
          const itemSell = Number(it.sellingPrice || it.price) || 0;
          if (it.purchasePrice) hasCustomCost = true;
          const itemBuy = Number(it.purchasePrice) || Math.round(itemSell * 0.65);
          saleProfit += (itemSell - itemBuy) * (Number(it.qty) || 1);
        });
        if (!hasCustomCost) {
          saleProfit = Math.round(tot * 0.35);
        }
      } else {
        saleProfit = Math.round(tot * 0.35);
      }
      profit += saleProfit;
    });

    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const billsCount = filteredSales.length;
    const avgBillValue = billsCount > 0 ? Math.round(salesTotal / billsCount) : 0;
    const netProfit = profit - expensesTotal;
    const collectionRate = salesTotal > 0 ? Math.round(((salesTotal - credit) / salesTotal) * 100) : 100;

    return {
      salesTotal,
      billsCount,
      cash,
      upi,
      card,
      credit,
      expensesTotal,
      profit: Math.round(profit),
      netProfit: Math.round(netProfit),
      avgBillValue,
      collectionRate
    };
  }, [filteredSales, filteredExpenses]);

  // Compute Top 5 Most Ordered Dishes / Products and total count
  const { topSellingItems, allProductsCount } = useMemo(() => {
    const itemMap = {};

    filteredSales.forEach(sale => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach(it => {
          const name = (it.name || it.title || 'Custom Item').trim();
          const qty = Number(it.qty) || 1;
          const unitPrice = Number(it.sellingPrice || it.price) || (Number(it.total) ? Number(it.total) / qty : 0);
          const revenue = unitPrice * qty;
          const category = it.category || 'General';

          if (!itemMap[name]) {
            itemMap[name] = {
              name,
              category,
              qty: 0,
              revenue: 0
            };
          }

          itemMap[name].qty += qty;
          itemMap[name].revenue += revenue;
        });
      }
    });

    const sorted = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);

    const top5 = sorted.slice(0, 5);
    const maxQty = top5[0]?.qty || 1;
    return {
      topSellingItems: top5.map(item => ({
        ...item,
        percentage: Math.min(100, Math.round((item.qty / maxQty) * 100))
      })),
      allProductsCount: sorted.length
    };
  }, [filteredSales]);

  // Compute Total Parcel Statistics based on active period filter
  const parcelStats = useMemo(() => {
    let totalParcels = 0;
    let totalParcelFees = 0;
    let billsWithParcels = 0;
    const totalBills = filteredSales.length;

    filteredSales.forEach(sale => {
      const pCount = Number(sale.parcelCount) || (Number(sale.parcelFee) > 0 ? Math.round(Number(sale.parcelFee) / 5) : 0);
      const pFee = Number(sale.parcelFee) || (pCount * 5);

      if (pCount > 0) {
        totalParcels += pCount;
        totalParcelFees += pFee;
        billsWithParcels += 1;
      }
    });

    const dineInBills = Math.max(0, totalBills - billsWithParcels);
    const parcelBillPct = totalBills > 0 ? Math.round((billsWithParcels / totalBills) * 100) : 0;
    const dineInPct = totalBills > 0 ? Math.max(0, 100 - parcelBillPct) : 0;
    const avgParcelsPerBill = billsWithParcels > 0 ? (totalParcels / billsWithParcels).toFixed(1) : '0';
    const packagingFeePct = metrics.salesTotal > 0 ? ((totalParcelFees / metrics.salesTotal) * 100).toFixed(1) : '0';

    return {
      totalParcels,
      totalParcelFees,
      billsWithParcels,
      dineInBills,
      totalBills,
      parcelBillPct,
      dineInPct,
      avgParcelsPerBill,
      packagingFeePct
    };
  }, [filteredSales, metrics.salesTotal]);

  // Compute Open Food Statistics for active period (Option B)
  const openFoodStats = useMemo(() => {
    let totalItems = 0;
    let totalRevenue = 0;
    let billsCount = 0;
    const itemsMap = {};

    filteredSales.forEach(sale => {
      if (Array.isArray(sale.items)) {
        let hasOpen = false;
        sale.items.forEach(it => {
          const isOpen = Boolean(
            it.isOpenFood === true ||
            it.category === 'Open Food' ||
            (it.productId && String(it.productId).startsWith('open_')) ||
            (it.id && String(it.id).startsWith('open_')) ||
            (it.name && String(it.name).toLowerCase().trim() === 'open food')
          );

          if (isOpen) {
            const qty = Number(it.qty) || 1;
            const unitPrice = Number(it.sellingPrice || it.price) || 0;
            const rev = Number(it.amount || it.total) || (unitPrice * qty);
            const name = (it.name || 'Open Food').trim();

            totalItems += qty;
            totalRevenue += rev;
            hasOpen = true;

            if (!itemsMap[name]) {
              itemsMap[name] = { name, qty: 0, revenue: 0 };
            }
            itemsMap[name].qty += qty;
            itemsMap[name].revenue += rev;
          }
        });
        if (hasOpen) billsCount += 1;
      }
    });

    return {
      totalItems,
      totalRevenue,
      billsCount,
      uniqueCount: Object.keys(itemsMap).length
    };
  }, [filteredSales]);

  // Payment Breakdown Percentages
  const paymentBreakdown = useMemo(() => {
    const total = metrics.salesTotal || 1;
    return {
      cashPct: Math.round((metrics.cash / total) * 100) || 0,
      upiPct: Math.round((metrics.upi / total) * 100) || 0,
      cardPct: Math.round((metrics.card / total) * 100) || 0,
      creditPct: Math.round((metrics.credit / total) * 100) || 0,
    };
  }, [metrics]);

  return (
    <div className="view-container-standard">
      {/* 1. Dashboard Top Header */}
      <div className="dashboard-top-header">
        <div className="dashboard-title-box">
          <div className="dashboard-title-row">
            <h2>Dashboard</h2>
            <span className="live-status-pill">
              <span className="live-dot" />
              Live
            </span>
          </div>
          <p className="dashboard-subtitle">
            {settings?.storeName || 'Weknd.'} • Overview for <strong>{periodLabel}</strong> ({dateRangeString})
          </p>
        </div>

        <div className="dashboard-header-actions">
          {/* Active Time Filter Pills */}
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

          {/* Day-by-Day Stepper Toolbar (Select Day: [<] [Date] [>]) */}
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

      {/* 2. 8 KPI Cards (Easily identifiable with color & icon) */}
      <div className="dashboard-kpi-grid">
        {/* Sales */}
        <div className="kpi-stat-card accent-emerald">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Total Sales</span>
            <div className="kpi-icon-pill emerald">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-figure-value green font-mono">
            ₹{metrics.salesTotal.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            Avg: ₹{metrics.avgBillValue.toLocaleString('en-IN')} / bill
          </div>
        </div>

        {/* Bills Count */}
        <div className="kpi-stat-card accent-slate">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Bills Count</span>
            <div className="kpi-icon-pill slate">
              <Receipt size={16} />
            </div>
          </div>
          <div className="kpi-figure-value font-mono">
            {metrics.billsCount}
          </div>
          <div className="kpi-context-note">
            {metrics.billsCount === 1 ? '1 bill generated' : `${metrics.billsCount} bills generated`}
          </div>
        </div>

        {/* Cash */}
        <div className="kpi-stat-card accent-teal">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Cash Collected</span>
            <div className="kpi-icon-pill teal">
              <Banknote size={16} />
            </div>
          </div>
          <div className="kpi-figure-value green font-mono">
            ₹{metrics.cash.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            {paymentBreakdown.cashPct}% of total
          </div>
        </div>

        {/* UPI */}
        <div className="kpi-stat-card accent-indigo">
          <div className="kpi-card-header">
            <span className="kpi-title-label">UPI / QR Code</span>
            <div className="kpi-icon-pill indigo">
              <QrCode size={16} />
            </div>
          </div>
          <div className="kpi-figure-value green font-mono">
            ₹{metrics.upi.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            {paymentBreakdown.upiPct}% of total
          </div>
        </div>

        {/* Expenses */}
        <div className="kpi-stat-card accent-rose">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Expenses</span>
            <div className="kpi-icon-pill rose">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="kpi-figure-value red font-mono">
            ₹{metrics.expensesTotal.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            {filteredExpenses.length} entries recorded
          </div>
        </div>

        {/* Gross Profit */}
        <div className="kpi-stat-card accent-amber">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Gross Profit</span>
            <div className="kpi-icon-pill amber">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-figure-value green font-mono">
            ₹{metrics.profit.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            Est. 35% margin
          </div>
        </div>

        {/* Credit (Udhar) */}
        <div className="kpi-stat-card accent-red">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Credit (Udhar)</span>
            <div className="kpi-icon-pill red">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-figure-value red font-mono">
            ₹{metrics.credit.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            Pending dues
          </div>
        </div>

        {/* Total Parcels */}
        <div className="kpi-stat-card accent-orange">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Total Parcels</span>
            <div className="kpi-icon-pill orange">
              <Package size={16} />
            </div>
          </div>
          <div className="kpi-figure-value font-mono" style={{ color: '#ea580c' }}>
            {parcelStats.totalParcels}
          </div>
          <div className="kpi-context-note">
            ₹{parcelStats.totalParcelFees.toLocaleString('en-IN')} fees ({parcelStats.billsWithParcels} bills)
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Top 5 Items & Payment Breakdown */}
      <div className="dashboard-insights-grid">
        {/* Top 5 Selling Items */}
        <div className="dashboard-card-widget">
          <div className="dashboard-widget-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="header-icon-box amber">
                <Flame size={15} />
              </div>
              <strong style={{ fontSize: '0.92rem' }}>Top Selling Items</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="widget-header-badge">
                {allProductsCount > 5 ? `Top 5 of ${allProductsCount}` : `${topSellingItems.length} Items`} ({periodLabel})
              </span>
              <button
                type="button"
                className="dashboard-view-all-btn"
                onClick={() => onNavigate && onNavigate('product-sales')}
                title="View all sales by product"
                id="btn-view-all-top-selling"
              >
                <span>View All</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div className="top-items-container">
            {topSellingItems.length === 0 ? (
              <div className="dashboard-empty-state">
                <ShoppingBag size={26} color="var(--text-tertiary)" style={{ opacity: 0.45, marginBottom: '0.4rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No items sold in {periodLabel.toLowerCase()}</p>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                  Orders placed through POS will appear here.
                </span>
                <button
                  type="button"
                  className="dashboard-view-all-btn"
                  onClick={() => onNavigate && onNavigate('product-sales')}
                  style={{ marginTop: '0.75rem' }}
                >
                  <span>Browse Product Sales by Date</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            ) : (
              <div className="top-items-list">
                {topSellingItems.map((item, idx) => (
                  <div key={item.name} className="top-item-row">
                    <span className={`rank-pill-badge rank-${idx + 1}`}>#{idx + 1}</span>
                    <div className="top-item-info">
                      <div className="top-item-title-row">
                        <span className="top-item-name" title={item.name}>{item.name}</span>
                        {item.category && (
                          <span className="top-item-category-tag">{item.category}</span>
                        )}
                      </div>
                      <div className="top-item-bar-bg">
                        <div 
                          className="top-item-bar-fill" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="top-item-numbers">
                      <div className="top-item-qty">{item.qty} sold</div>
                      <div className="top-item-revenue font-mono">
                        ₹{item.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}

                {allProductsCount > 5 && (
                  <div className="top-items-footer-action">
                    <button
                      type="button"
                      className="top-items-footer-btn"
                      onClick={() => onNavigate && onNavigate('product-sales')}
                    >
                      <span>View All Sales by Product ({allProductsCount} items sold)</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Total Parcels Overview Card (Replaces Payment Methods) */}
        <div className="dashboard-card-widget">
          <div className="dashboard-widget-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="header-icon-box orange">
                <Package size={15} />
              </div>
              <strong style={{ fontSize: '0.92rem' }}>Total Parcels ({periodLabel})</strong>
            </div>
            <span className="widget-header-badge orange font-mono">
              {parcelStats.totalParcels} {parcelStats.totalParcels === 1 ? 'Parcel' : 'Parcels'}
            </span>
          </div>

          <div style={{ padding: '0.95rem 1.15rem' }}>
            {/* Hero Parcel Stats Row */}
            <div className="parcel-dashboard-hero">
              <div className="parcel-hero-main">
                <div className="parcel-hero-num font-mono">
                  {parcelStats.totalParcels}
                </div>
                <div className="parcel-hero-meta">
                  <span className="parcel-hero-label">Total Parcels Packed</span>
                  <span className="parcel-hero-sub font-mono">
                    ₹{parcelStats.totalParcelFees.toLocaleString('en-IN')} collected (@ ₹5/parcel)
                  </span>
                </div>
              </div>

              <div className="parcel-hero-badges">
                <div className="parcel-stat-pill takeaway">
                  <Package size={13} />
                  <span>{parcelStats.billsWithParcels} Takeaway {parcelStats.billsWithParcels === 1 ? 'Bill' : 'Bills'}</span>
                </div>
                <div className="parcel-stat-pill dine-in">
                  <ShoppingBag size={13} />
                  <span>{parcelStats.dineInBills} Dine-in Only</span>
                </div>
              </div>
            </div>

            {/* Split Ratio Bar: Takeaway vs Dine-in */}
            <div className="parcel-ratio-bar-wrap">
              <div className="parcel-ratio-bar">
                {parcelStats.totalBills > 0 && parcelStats.parcelBillPct > 0 && (
                  <div 
                    className="parcel-ratio-seg parcel" 
                    style={{ width: `${parcelStats.parcelBillPct}%` }}
                    title={`Takeaway/Parcels: ${parcelStats.parcelBillPct}%`}
                  />
                )}
                {parcelStats.totalBills > 0 && parcelStats.dineInPct > 0 && (
                  <div 
                    className="parcel-ratio-seg dinein" 
                    style={{ width: `${parcelStats.dineInPct}%` }}
                    title={`Dine-in Only: ${parcelStats.dineInPct}%`}
                  />
                )}
                {parcelStats.totalBills === 0 && (
                  <div className="parcel-ratio-seg empty" style={{ width: '100%' }} />
                )}
              </div>
              <div className="parcel-ratio-labels">
                <span className="ratio-label-text">
                  <span className="dot parcel" /> Takeaway Orders ({parcelStats.parcelBillPct}%)
                </span>
                <span className="ratio-label-text">
                  <span className="dot dinein" /> Dine-in Orders ({parcelStats.dineInPct}%)
                </span>
              </div>
            </div>

            {/* Open Food (Custom Items) Overview Section (Option B) */}
            <div className="dashboard-open-food-box">
              <div className="dashboard-open-food-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div className="header-icon-box purple" style={{ width: '22px', height: '22px' }}>
                    <Sparkles size={12} />
                  </div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    Open Food Custom Orders ({periodLabel})
                  </strong>
                </div>
                <button
                  type="button"
                  className="dashboard-view-all-link"
                  onClick={() => onNavigate && onNavigate('product-sales')}
                  style={{ fontSize: '0.74rem', padding: '0.15rem 0.4rem' }}
                  title="View full open food sales breakdown"
                >
                  <span>Details</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="dashboard-open-food-grid">
                <div className="of-stat-card">
                  <div className="of-stat-label">Items Sold</div>
                  <div className="of-stat-value font-mono">
                    {openFoodStats.totalItems} <span className="of-stat-unit">pcs</span>
                  </div>
                  <div className="of-stat-note">
                    {openFoodStats.billsCount} {openFoodStats.billsCount === 1 ? 'bill' : 'bills'} with open food
                  </div>
                </div>

                <div className="of-stat-card">
                  <div className="of-stat-label">Open Food Revenue</div>
                  <div className="of-stat-value font-mono purple">
                    ₹{openFoodStats.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="of-stat-note">
                    {openFoodStats.uniqueCount} custom {openFoodStats.uniqueCount === 1 ? 'dish' : 'dishes'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Bills Table */}
      <div className="pos-table-card dashboard-orders-table-card">
        <div className="dashboard-table-header">
          <div>
            <strong style={{ fontSize: '0.92rem' }}>Recent Bills ({periodLabel})</strong>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginLeft: '0.45rem' }}>
              Showing {filteredSales.slice(0, 6).length} of {filteredSales.length}
            </span>
          </div>
          <button
            type="button"
            className="dashboard-view-all-link"
            onClick={() => onNavigate && onNavigate('sales')}
          >
            <span>View All History</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <table className="pos-table">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Time</th>
              <th>Total</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.84rem' }}>
                  No bills found for {periodLabel.toLowerCase()}.
                </td>
              </tr>
            ) : (
              filteredSales.slice(0, 6).map(b => (
                <tr key={b.id} className="dashboard-table-row">
                  <td>
                    <span className="bill-tag-mono font-mono">{b.billNo}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {b.time || '10:24 AM'} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.76rem' }}>{b.date ? `• ${b.date}` : ''}</span>
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                      ₹{Number(b.total || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const isUnmarked = b.paymentConfirmed === false || b.isUnmarked === true;
                      const pMethod = b.paymentMethod || 'Cash';
                      return (
                        <span 
                          className={`payment-pill-tag ${pMethod.toLowerCase()} ${isUnmarked ? 'unmarked' : ''}`}
                          title={isUnmarked ? "Unmarked bill (defaulted to Cash)" : `${pMethod} (Confirmed)`}
                        >
                          {pMethod}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        type="button"
                        className="btn-hold-bill-outline action-preview-btn"
                        onClick={() => onViewSale && onViewSale(b)}
                        title="View & Print Receipt"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                      <button 
                        type="button"
                        className="entry-del-btn"
                        onClick={async () => {
                          if (window.confirm(`Delete invoice ${b.billNo} (₹${b.total})? This cannot be undone.`)) {
                            if (onDeleteSale) await onDeleteSale(b.id);
                          }
                        }}
                        style={{ padding: '0.25rem', color: 'var(--red-accent)' }}
                        title="Delete Invoice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
