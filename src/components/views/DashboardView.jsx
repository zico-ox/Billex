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
  ShoppingBag
} from 'lucide-react';

export default function DashboardView({
  sales = [],
  expenses = [],
  settings = {},
  onViewSale,
  onDeleteSale,
  onNavigate
}) {
  // Time filter state: 'today' | 'yesterday' | 'week' | 'month'
  const [timeFilter, setTimeFilter] = useState('today');

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

    const isMatch = (item) => {
      // 1. Check numeric timestamp
      if (item.timestamp && !isNaN(Number(item.timestamp))) {
        const t = Number(item.timestamp);
        if (timeFilter === 'today') return t >= startOfToday.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'yesterday') return t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime();
        if (timeFilter === 'week') return t >= startOfWeek.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'month') return t >= startOfMonth.getTime() && t <= endOfToday.getTime();
      }

      // 2. Check ISO createdAt string
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (!isNaN(itemDate.getTime())) {
          if (timeFilter === 'today') return itemDate >= startOfToday && itemDate <= endOfToday;
          if (timeFilter === 'yesterday') return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
          if (timeFilter === 'week') return itemDate >= startOfWeek && itemDate <= endOfToday;
          if (timeFilter === 'month') return itemDate >= startOfMonth && itemDate <= endOfToday;
        }
      }

      // 3. Fallback to formatted date string
      if (item.date) {
        if (timeFilter === 'today') return item.date === todayStr;
        if (timeFilter === 'yesterday') return item.date === yesterdayStr;
        
        const parsed = new Date(item.date);
        if (!isNaN(parsed.getTime())) {
          if (timeFilter === 'week') return parsed >= startOfWeek && parsed <= endOfToday;
          if (timeFilter === 'month') return parsed >= startOfMonth && parsed <= endOfToday;
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
    }

    return {
      filteredSales: sList,
      filteredExpenses: eList,
      periodLabel: label,
      dateRangeString: dateStr
    };
  }, [sales, expenses, timeFilter]);

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

  // Compute Top 5 Most Ordered Dishes / Products
  const topSellingItems = useMemo(() => {
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
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 5);

    const maxQty = sorted[0]?.qty || 1;
    return sorted.map(item => ({
      ...item,
      percentage: Math.min(100, Math.round((item.qty / maxQty) * 100))
    }));
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
              onClick={() => setTimeFilter('today')}
            >
              Today
            </button>
            <button 
              type="button"
              className={`time-filter-btn ${timeFilter === 'yesterday' ? 'active' : ''}`}
              onClick={() => setTimeFilter('yesterday')}
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

        {/* Card */}
        <div className="kpi-stat-card accent-violet">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Card Swipes</span>
            <div className="kpi-icon-pill violet">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-figure-value font-mono">
            ₹{metrics.card.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            {paymentBreakdown.cardPct}% of total
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
            <span className="widget-header-badge">
              {topSellingItems.length} Items ({periodLabel})
            </span>
          </div>

          <div className="top-items-container">
            {topSellingItems.length === 0 ? (
              <div className="dashboard-empty-state">
                <ShoppingBag size={26} color="var(--text-tertiary)" style={{ opacity: 0.45, marginBottom: '0.4rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No items sold in {periodLabel.toLowerCase()}</p>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                  Orders placed through POS will appear here.
                </span>
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
              </div>
            )}
          </div>
        </div>

        {/* Payment Breakdown & Financial Summary */}
        <div className="dashboard-card-widget">
          <div className="dashboard-widget-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="header-icon-box emerald">
                <Wallet size={15} />
              </div>
              <strong style={{ fontSize: '0.92rem' }}>Payment Methods</strong>
            </div>
            <span className="widget-header-badge green font-mono">
              ₹{metrics.salesTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ padding: '0.95rem 1.15rem' }}>
            {/* Split Progress Bar */}
            <div className="payment-distribution-bar">
              {paymentBreakdown.cashPct > 0 && (
                <div 
                  className="bar-seg cash" 
                  style={{ width: `${paymentBreakdown.cashPct}%` }}
                  title={`Cash: ${paymentBreakdown.cashPct}%`}
                />
              )}
              {paymentBreakdown.upiPct > 0 && (
                <div 
                  className="bar-seg upi" 
                  style={{ width: `${paymentBreakdown.upiPct}%` }}
                  title={`UPI: ${paymentBreakdown.upiPct}%`}
                />
              )}
              {paymentBreakdown.cardPct > 0 && (
                <div 
                  className="bar-seg card" 
                  style={{ width: `${paymentBreakdown.cardPct}%` }}
                  title={`Card: ${paymentBreakdown.cardPct}%`}
                />
              )}
              {paymentBreakdown.creditPct > 0 && (
                <div 
                  className="bar-seg credit" 
                  style={{ width: `${paymentBreakdown.creditPct}%` }}
                  title={`Credit: ${paymentBreakdown.creditPct}%`}
                />
              )}
              {metrics.salesTotal === 0 && (
                <div className="bar-seg empty" style={{ width: '100%' }} />
              )}
            </div>

            {/* 4 Legend Items */}
            <div className="payment-legend-grid">
              <div className="legend-item">
                <div className="legend-dot cash" />
                <div className="legend-text">
                  <div className="legend-name">Cash</div>
                  <div className="legend-val font-mono">₹{metrics.cash.toLocaleString('en-IN')}</div>
                  <div className="legend-pct">{paymentBreakdown.cashPct}% share</div>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-dot upi" />
                <div className="legend-text">
                  <div className="legend-name">UPI / QR</div>
                  <div className="legend-val font-mono">₹{metrics.upi.toLocaleString('en-IN')}</div>
                  <div className="legend-pct">{paymentBreakdown.upiPct}% share</div>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-dot card" />
                <div className="legend-text">
                  <div className="legend-name">Card</div>
                  <div className="legend-val font-mono">₹{metrics.card.toLocaleString('en-IN')}</div>
                  <div className="legend-pct">{paymentBreakdown.cardPct}% share</div>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-dot credit" />
                <div className="legend-text">
                  <div className="legend-name">Credit (Udhar)</div>
                  <div className="legend-val font-mono">₹{metrics.credit.toLocaleString('en-IN')}</div>
                  <div className="legend-pct">{paymentBreakdown.creditPct}% share</div>
                </div>
              </div>
            </div>

            {/* 3 Summary Mini Boxes */}
            <div className="dashboard-highlight-boxes">
              <div className="highlight-mini-box">
                <div className="hl-label">Avg Order Value</div>
                <div className="hl-value font-mono">₹{metrics.avgBillValue.toLocaleString('en-IN')}</div>
              </div>

              <div className="highlight-mini-box">
                <div className="hl-label">Net Profit</div>
                <div className={`hl-value font-mono ${metrics.netProfit >= 0 ? 'green' : 'red'}`}>
                  ₹{metrics.netProfit.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="highlight-mini-box">
                <div className="hl-label">Collected</div>
                <div className="hl-value font-mono green">
                  {metrics.collectionRate}%
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
