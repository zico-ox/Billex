import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Receipt, 
  Eye, 
  Trash2, 
  X,
  ArrowUpDown
} from 'lucide-react';

export default function SalesView({
  sales = [],
  onViewSale,
  onDeleteSale
}) {
  // 1. Time Filter: 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [timeFilter, setTimeFilter] = useState('today');

  // Custom date range state (in YYYY-MM-DD format)
  const todayYmd = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [customStartDate, setCustomStartDate] = useState(todayYmd);
  const [customEndDate, setCustomEndDate] = useState(todayYmd);

  // 2. Search & Payment Method Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card' | 'credit'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) | 'asc'

  // Calculate filtered sales based on time range
  const { periodFilteredSales, periodLabel, dateRangeString } = useMemo(() => {
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

    // Custom date range boundaries
    let customStart = null;
    let customEnd = null;
    if (customStartDate) {
      const [sy, sm, sd] = customStartDate.split('-').map(Number);
      customStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    }
    if (customEndDate) {
      const [ey, em, ed] = customEndDate.split('-').map(Number);
      customEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    } else if (customStart) {
      customEnd = new Date(customStart.getTime());
      customEnd.setHours(23, 59, 59, 999);
    }

    const isTimeMatch = (item) => {
      // 1. Numeric timestamp
      if (item.timestamp && !isNaN(Number(item.timestamp))) {
        const t = Number(item.timestamp);
        if (timeFilter === 'today') return t >= startOfToday.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'yesterday') return t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime();
        if (timeFilter === 'week') return t >= startOfWeek.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'month') return t >= startOfMonth.getTime() && t <= endOfToday.getTime();
        if (timeFilter === 'custom') {
          if (customStart && customEnd) return t >= customStart.getTime() && t <= customEnd.getTime();
          if (customStart) return t >= customStart.getTime();
          if (customEnd) return t <= customEnd.getTime();
          return true;
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
          if (timeFilter === 'custom') {
            if (customStart && customEnd) return itemDate >= customStart && itemDate <= customEnd;
            if (customStart) return itemDate >= customStart;
            if (customEnd) return itemDate <= customEnd;
            return true;
          }
        }
      }

      // 3. Fallback formatted string
      if (item.date) {
        if (timeFilter === 'today') return item.date === todayStr;
        if (timeFilter === 'yesterday') return item.date === yesterdayStr;

        const parsed = new Date(item.date);
        if (!isNaN(parsed.getTime())) {
          if (timeFilter === 'week') return parsed >= startOfWeek && parsed <= endOfToday;
          if (timeFilter === 'month') return parsed >= startOfMonth && parsed <= endOfToday;
          if (timeFilter === 'custom') {
            if (customStart && customEnd) return parsed >= customStart && parsed <= customEnd;
            if (customStart) return parsed >= customStart;
            if (customEnd) return parsed <= customEnd;
            return true;
          }
        }
      }

      return false;
    };

    const filtered = sales.filter(isTimeMatch);

    let label = 'Today';
    let rangeStr = todayStr;
    if (timeFilter === 'yesterday') {
      label = 'Yesterday';
      rangeStr = yesterdayStr;
    } else if (timeFilter === 'week') {
      label = 'This Week';
      rangeStr = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${todayStr}`;
    } else if (timeFilter === 'month') {
      label = 'This Month';
      rangeStr = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (timeFilter === 'custom') {
      label = 'Custom Range';
      const sFormatted = customStart ? customStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      const eFormatted = customEnd ? customEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      rangeStr = sFormatted === eFormatted ? sFormatted : `${sFormatted} to ${eFormatted}`;
    }

    return {
      periodFilteredSales: filtered,
      periodLabel: label,
      dateRangeString: rangeStr
    };
  }, [sales, timeFilter, customStartDate, customEndDate]);

  // Compute Period Metrics
  const metrics = useMemo(() => {
    let totalSales = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let credit = 0;

    periodFilteredSales.forEach(s => {
      const tot = Number(s.total) || 0;
      totalSales += tot;

      const m = String(s.paymentMethod || 'Cash').toLowerCase();
      if (m.includes('cash')) cash += tot;
      else if (m.includes('upi')) upi += tot;
      else if (m.includes('card')) card += tot;
      else if (m.includes('credit')) credit += tot;
      else cash += tot;
    });

    const count = periodFilteredSales.length;
    const avgBill = count > 0 ? Math.round(totalSales / count) : 0;

    return {
      totalSales,
      count,
      avgBill,
      cash,
      upi,
      card,
      credit
    };
  }, [periodFilteredSales]);

  // Apply Search, Payment Filter & Sorting
  const displayedSales = useMemo(() => {
    return periodFilteredSales
      .filter(s => {
        // Payment method filter
        if (paymentFilter !== 'all') {
          const m = String(s.paymentMethod || 'Cash').toLowerCase();
          if (!m.includes(paymentFilter)) return false;
        }

        // Search Query (Bill No, Customer Name, Items)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const billNoMatch = String(s.billNo || '').toLowerCase().includes(q);
          const customerMatch = String(s.customerName || '').toLowerCase().includes(q);
          const methodMatch = String(s.paymentMethod || '').toLowerCase().includes(q);
          const itemMatch = Array.isArray(s.items) && s.items.some(it => 
            String(it.name || it.title || '').toLowerCase().includes(q)
          );

          if (!billNoMatch && !customerMatch && !methodMatch && !itemMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [periodFilteredSales, paymentFilter, searchQuery, sortOrder]);

  return (
    <div className="view-container-standard">
      {/* 1. Header with Time Range Segmentation */}
      <div className="dashboard-top-header">
        <div className="dashboard-title-box">
          <div className="dashboard-title-row">
            <h2>Sales Invoices</h2>
            <span className="live-status-pill font-mono">
              {metrics.count} {metrics.count === 1 ? 'Invoice' : 'Invoices'} • ₹{metrics.totalSales.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="dashboard-subtitle">
            Showing records for <strong>{periodLabel}</strong> ({dateRangeString})
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="dashboard-header-actions">
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
            <button 
              type="button"
              className={`time-filter-btn ${timeFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setTimeFilter('custom')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Calendar size={13} />
              <span>Custom Date</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Custom Date Range Inputs Box (Visible when 'custom' is active) */}
      {timeFilter === 'custom' && (
        <div className="custom-date-filter-bar">
          <div className="custom-date-inputs">
            <div className="date-input-group">
              <label>From Date:</label>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="pos-filter-input"
              />
            </div>
            <span className="date-separator">to</span>
            <div className="date-input-group">
              <label>To Date:</label>
              <input 
                type="date"
                value={customEndDate}
                min={customStartDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="pos-filter-input"
              />
            </div>
          </div>
          <div className="custom-date-actions">
            <button 
              type="button" 
              className="time-filter-btn"
              onClick={() => {
                setCustomStartDate(todayYmd);
                setCustomEndDate(todayYmd);
              }}
            >
              Reset to Today
            </button>
          </div>
        </div>
      )}

      {/* 3. Controls Bar: Search & Payment Method Tabs */}
      <div className="sales-toolbar-card">
        {/* Search Input */}
        <div className="sales-search-box">
          <Search size={16} color="var(--text-tertiary)" />
          <input 
            type="text"
            placeholder="Search by Bill #, items, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sales-search-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="sales-clear-search-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Payment Method Pills */}
        <div className="sales-payment-filters">
          <button 
            type="button"
            className={`sales-filter-pill ${paymentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPaymentFilter('all')}
          >
            All Methods
          </button>
          <button 
            type="button"
            className={`sales-filter-pill cash ${paymentFilter === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentFilter('cash')}
          >
            Cash
          </button>
          <button 
            type="button"
            className={`sales-filter-pill upi ${paymentFilter === 'upi' ? 'active' : ''}`}
            onClick={() => setPaymentFilter('upi')}
          >
            UPI
          </button>
          <button 
            type="button"
            className={`sales-filter-pill card ${paymentFilter === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentFilter('card')}
          >
            Card
          </button>
          <button 
            type="button"
            className={`sales-filter-pill credit ${paymentFilter === 'credit' ? 'active' : ''}`}
            onClick={() => setPaymentFilter('credit')}
          >
            Credit (Udhar)
          </button>
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          className="sales-sort-toggle-btn"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          <ArrowUpDown size={14} />
          <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* 5. Invoices Table Card */}
      <div className="pos-table-card">
        <table className="pos-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Bill No</th>
              <th style={{ width: '170px' }}>Date & Time</th>
              <th>Items Summary</th>
              <th style={{ width: '120px' }}>Payment</th>
              <th style={{ width: '130px' }}>Total</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSales.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                  <Receipt size={32} style={{ opacity: 0.35, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    No sales invoices found
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    {searchQuery || paymentFilter !== 'all'
                      ? 'Try clearing your search or payment filter.'
                      : `No transactions recorded for ${periodLabel.toLowerCase()}.`}
                  </span>
                </td>
              </tr>
            ) : (
              displayedSales.map(s => {
                const itemCount = Array.isArray(s.items) 
                  ? s.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
                  : 0;
                
                const itemSummary = Array.isArray(s.items) && s.items.length > 0
                  ? s.items.map(it => `${it.name || it.title || 'Item'}${Number(it.qty) > 1 ? ` (${it.qty})` : ''}`).join(', ')
                  : '—';

                return (
                  <tr key={s.id} className="dashboard-table-row">
                    <td>
                      <span className="bill-tag-mono font-mono">{s.billNo}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {s.time || '10:24 AM'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                          {s.date || '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="sale-item-summary-cell" title={itemSummary}>
                        <span className="sale-item-count-badge">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                        <span className="sale-item-names-text">
                          {itemSummary}
                        </span>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const isUnmarked = s.paymentConfirmed === false || s.isUnmarked === true;
                        const pMethod = s.paymentMethod || 'Cash';
                        return (
                          <span 
                            className={`payment-pill-tag ${pMethod.toLowerCase()} ${isUnmarked ? 'unmarked' : ''}`}
                            title={isUnmarked ? "Unmarked bill (defaulted to Cash). Click 'View' to confirm or change." : `${pMethod} (Confirmed)`}
                          >
                            {pMethod}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        ₹{Number(s.total || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button 
                          type="button"
                          className="btn-hold-bill-outline action-preview-btn"
                          onClick={() => onViewSale && onViewSale(s)}
                          title="View & Print Invoice Receipt"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button 
                          type="button"
                          className="entry-del-btn"
                          onClick={async () => {
                            if (window.confirm(`Delete invoice ${s.billNo} (₹${s.total})? This cannot be undone.`)) {
                              if (onDeleteSale) await onDeleteSale(s.id);
                            }
                          }}
                          style={{ padding: '0.3rem', color: 'var(--red-accent)' }}
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
