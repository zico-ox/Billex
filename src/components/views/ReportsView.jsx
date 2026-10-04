import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Calendar, 
  TrendingUp, 
  Receipt, 
  Sparkles, 
  ArrowDownRight, 
  Wallet, 
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
  Search
} from 'lucide-react';

export default function ReportsView({
  sales = [],
  expenses = [],
  settings = {}
}) {
  // Time Filter State
  const [timeFilter, setTimeFilter] = useState('month'); // 'today' | 'yesterday' | 'week' | 'month' | 'custom'

  // Custom date range state
  const todayYmd = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [customStartDate, setCustomStartDate] = useState(todayYmd);
  const [customEndDate, setCustomEndDate] = useState(todayYmd);

  // Export Menu Dropdown State
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const exportDropdownRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [exportMenuOpen]);

  // Filter Sales & Expenses based on time selection
  const { filteredSales, filteredExpenses, periodLabel, dateRangeString } = useMemo(() => {
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

    let customStart = null;
    let customEnd = null;
    if (customStartDate) {
      const [sy, sm, sd] = customStartDate.split('-').map(Number);
      customStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    }
    if (customEndDate) {
      const [ey, em, ed] = customEndDate.split('-').map(Number);
      customEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    }

    const isMatch = (item) => {
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

      // 3. Formatted date string
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

    const sList = sales.filter(isMatch);
    const eList = expenses.filter(isMatch);

    let label = 'This Month';
    let rangeStr = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (timeFilter === 'today') {
      label = 'Today';
      rangeStr = todayStr;
    } else if (timeFilter === 'yesterday') {
      label = 'Yesterday';
      rangeStr = yesterdayStr;
    } else if (timeFilter === 'week') {
      label = 'This Week';
      rangeStr = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${todayStr}`;
    } else if (timeFilter === 'custom') {
      label = 'Custom Period';
      const sFormatted = customStart ? customStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      const eFormatted = customEnd ? customEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      rangeStr = sFormatted === eFormatted ? sFormatted : `${sFormatted} to ${eFormatted}`;
    }

    return {
      filteredSales: sList,
      filteredExpenses: eList,
      periodLabel: label,
      dateRangeString: rangeStr
    };
  }, [sales, expenses, timeFilter, customStartDate, customEndDate]);

  // Compute Financial Metrics
  const metrics = useMemo(() => {
    let totalSales = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let credit = 0;
    let grossProfit = 0;

    filteredSales.forEach(s => {
      const tot = Number(s.total) || 0;
      totalSales += tot;

      const m = String(s.paymentMethod || 'Cash').toLowerCase();
      if (m.includes('cash')) cash += tot;
      else if (m.includes('upi')) upi += tot;
      else if (m.includes('card')) card += tot;
      else if (m.includes('credit')) credit += tot;
      else cash += tot;

      // Profit calculation (35% default margin)
      let sProfit = 0;
      if (Array.isArray(s.items) && s.items.length > 0) {
        let hasCustom = false;
        s.items.forEach(it => {
          const itemSell = Number(it.sellingPrice || it.price) || 0;
          if (it.purchasePrice) hasCustom = true;
          const itemBuy = Number(it.purchasePrice) || Math.round(itemSell * 0.65);
          sProfit += (itemSell - itemBuy) * (Number(it.qty) || 1);
        });
        if (!hasCustom) sProfit = Math.round(tot * 0.35);
      } else {
        sProfit = Math.round(tot * 0.35);
      }
      grossProfit += sProfit;
    });

    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = filteredSales.length;
    const avgBill = count > 0 ? Math.round(totalSales / count) : 0;
    const netProfit = grossProfit - expensesTotal;

    return {
      totalSales,
      count,
      avgBill,
      cash,
      upi,
      card,
      credit,
      grossProfit: Math.round(grossProfit),
      expensesTotal,
      netProfit: Math.round(netProfit)
    };
  }, [filteredSales, filteredExpenses]);

  // Payment Breakdown Percentages
  const paymentBreakdown = useMemo(() => {
    const total = metrics.totalSales || 1;
    return {
      cashPct: Math.round((metrics.cash / total) * 100) || 0,
      upiPct: Math.round((metrics.upi / total) * 100) || 0,
      cardPct: Math.round((metrics.card / total) * 100) || 0,
      creditPct: Math.round((metrics.credit / total) * 100) || 0,
    };
  }, [metrics]);

  // =========================================================================
  // EXPORT HANDLERS (CSV, EXCEL, PDF)
  // =========================================================================

  // 1. Export as CSV
  const handleExportCsv = () => {
    setExportMenuOpen(false);
    const headers = ['Bill No', 'Date', 'Time', 'Payment Method', 'Items Count', 'Items Detail', 'Total (INR)'];
    const rows = filteredSales.map(s => {
      const itemCount = Array.isArray(s.items) ? s.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0) : 1;
      const itemsDetail = Array.isArray(s.items) 
        ? s.items.map(it => `${it.name || 'Item'} (${it.qty || 1})`).join('; ') 
        : '';
      return [
        `"${s.billNo || ''}"`,
        `"${s.date || ''}"`,
        `"${s.time || ''}"`,
        `"${s.paymentMethod || 'Cash'}"`,
        itemCount,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        Number(s.total || 0).toFixed(2)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `billex-sales-${timeFilter}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerSuccess('CSV report downloaded successfully!');
  };

  // 2. Export as Excel (.xls)
  const handleExportExcel = () => {
    setExportMenuOpen(false);
    const storeName = settings?.storeName || 'Billex POS';

    const xml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sales Statement</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; font-size: 10pt; }
          th { background-color: #8b5a2b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; }
          td { border: 1px solid #e2e8f0; padding: 5px; }
          .num { text-align: right; }
          .title { font-size: 14pt; font-weight: bold; color: #8b5a2b; }
          .kpi-th { background-color: #334155; color: #ffffff; font-weight: bold; }
          .kpi-lbl { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="title">${storeName} - Sales Report</td></tr>
          <tr><td colspan="6" style="color: #64748b;">Period: ${periodLabel} (${dateRangeString}) • Generated: ${new Date().toLocaleString('en-GB')}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr><th colspan="6" class="kpi-th">EXECUTIVE SUMMARY</th></tr>
          <tr>
            <td class="kpi-lbl">Total Revenue</td><td class="num">₹${metrics.totalSales}</td>
            <td class="kpi-lbl">Total Invoices</td><td class="num">${metrics.count}</td>
            <td class="kpi-lbl">Avg Bill Value</td><td class="num">₹${metrics.avgBill}</td>
          </tr>
          <tr>
            <td class="kpi-lbl">Gross Profit (35%)</td><td class="num">₹${metrics.grossProfit}</td>
            <td class="kpi-lbl">Expenses</td><td class="num">₹${metrics.expensesTotal}</td>
            <td class="kpi-lbl">Net Profit</td><td class="num">₹${metrics.netProfit}</td>
          </tr>
          <tr>
            <td class="kpi-lbl">Cash Sales</td><td class="num">₹${metrics.cash}</td>
            <td class="kpi-lbl">UPI / Digital</td><td class="num">₹${metrics.upi}</td>
            <td class="kpi-lbl">Card Swipes</td><td class="num">₹${metrics.card}</td>
          </tr>
          <tr><td colspan="6"></td></tr>
          <tr><th colspan="6">INVOICE TRANSACTION REGISTER</th></tr>
          <tr>
            <th>Bill No</th>
            <th>Date</th>
            <th>Time</th>
            <th>Payment Method</th>
            <th>Items Count</th>
            <th>Total Amount (INR)</th>
          </tr>
          ${filteredSales.map(s => {
            const count = Array.isArray(s.items) ? s.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0) : 1;
            return `
              <tr>
                <td>${s.billNo || ''}</td>
                <td>${s.date || ''}</td>
                <td>${s.time || ''}</td>
                <td>${s.paymentMethod || 'Cash'}</td>
                <td class="num">${count}</td>
                <td class="num">${Number(s.total || 0).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `billex-sales-${timeFilter}-${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerSuccess('Excel report downloaded successfully!');
  };

  // 3. Export as PDF (Printable High-Res Statement)
  const handleExportPdf = () => {
    setExportMenuOpen(false);
    const storeName = settings?.storeName || 'Billex POS';

    const printWin = window.open('', '_blank', 'width=920,height=750');
    if (!printWin) {
      alert('Please allow popups to open and print the PDF report.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${storeName} - Sales Report (${periodLabel})</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            padding: 24px;
            background: #ffffff;
            margin: 0;
          }
          @media print {
            @page { margin: 12mm; size: A4 portrait; }
            body { padding: 0; }
          }
          .hdr {
            border-bottom: 2.5px solid #8b5a2b;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .store-title { font-size: 24px; font-weight: 800; color: #8b5a2b; margin: 0; }
          .store-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          .rep-title { font-size: 18px; font-weight: 800; text-align: right; margin: 0; color: #0f172a; }
          .rep-sub { font-size: 11px; color: #64748b; text-align: right; margin-top: 3px; }
          .sec-title { font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin: 14px 0 6px; letter-spacing: 0.5px; }
          .kpi-tbl { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
          .kpi-tbl td { border: 1px solid #e2e8f0; padding: 7px 10px; }
          .kpi-lbl { background: #f8fafc; font-weight: 700; color: #475569; width: 18%; }
          .kpi-val { font-family: monospace; font-weight: 800; font-size: 12px; width: 32%; }
          .green { color: #059669; }
          .red { color: #dc2626; }
          .data-tbl { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          .data-tbl th { background: #8b5a2b; color: #ffffff; padding: 7px 8px; text-align: left; font-weight: 700; }
          .data-tbl td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
          .data-tbl tr:nth-child(even) { background: #fafafb; }
          .mono { font-family: monospace; font-weight: 700; }
          .right { text-align: right; }
          .ftr { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div>
            <h1 class="store-title">${storeName}</h1>
            <div class="store-sub">${settings?.address || 'Retail & Restaurant POS'} ${settings?.phone ? '• Phone: ' + settings.phone : ''}</div>
          </div>
          <div>
            <h2 class="rep-title">Sales & Financial Statement</h2>
            <div class="rep-sub">Period: <strong>${periodLabel}</strong> (${dateRangeString})</div>
          </div>
        </div>

        <div class="sec-title">Financial Summary</div>
        <table class="kpi-tbl">
          <tr>
            <td class="kpi-lbl">TOTAL SALES</td>
            <td class="kpi-val green">₹${metrics.totalSales.toLocaleString('en-IN')}</td>
            <td class="kpi-lbl">INVOICES COUNT</td>
            <td class="kpi-val">${metrics.count} bills</td>
          </tr>
          <tr>
            <td class="kpi-lbl">GROSS PROFIT (35%)</td>
            <td class="kpi-val green">₹${metrics.grossProfit.toLocaleString('en-IN')}</td>
            <td class="kpi-lbl">EXPENSES</td>
            <td class="kpi-val red">₹${metrics.expensesTotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td class="kpi-lbl">NET PROFIT</td>
            <td class="kpi-val ${metrics.netProfit >= 0 ? 'green' : 'red'}">₹${metrics.netProfit.toLocaleString('en-IN')}</td>
            <td class="kpi-lbl">AVERAGE BILL</td>
            <td class="kpi-val">₹${metrics.avgBill.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td class="kpi-lbl">CASH COLLECTED</td>
            <td class="kpi-val green">₹${metrics.cash.toLocaleString('en-IN')}</td>
            <td class="kpi-lbl">UPI & DIGITAL</td>
            <td class="kpi-val green">₹${metrics.upi.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <div class="sec-title">Invoices Register (${filteredSales.length} Transactions)</div>
        <table class="data-tbl">
          <thead>
            <tr>
              <th style="width: 14%;">Bill No</th>
              <th style="width: 18%;">Date & Time</th>
              <th style="width: 40%;">Items</th>
              <th style="width: 14%;">Payment</th>
              <th style="width: 14%;" class="right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales.map(s => {
              const itStr = Array.isArray(s.items) 
                ? s.items.map(i => `${i.name || 'Item'}${Number(i.qty) > 1 ? ` (${i.qty})` : ''}`).join(', ')
                : '—';
              return `
                <tr>
                  <td class="mono">${s.billNo || '—'}</td>
                  <td>${s.date || ''} ${s.time || ''}</td>
                  <td>${itStr}</td>
                  <td>${s.paymentMethod || 'Cash'}</td>
                  <td class="mono right">₹${Number(s.total || 0).toLocaleString('en-IN')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="ftr">
          <span>Billex Cloud POS System</span>
          <span>Printed on: ${new Date().toLocaleString('en-GB')}</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    triggerSuccess('Print preview opened. Select "Save as PDF" to save.');
  };

  const triggerSuccess = (msg) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(''), 4000);
  };

  return (
    <div className="view-container-standard">
      {/* 1. Header with Period Filter & Export Dropdown */}
      <div className="dashboard-top-header">
        <div className="dashboard-title-box">
          <div className="dashboard-title-row">
            <h2>Business Reports</h2>
            <span className="live-status-pill font-mono">
              {filteredSales.length} Invoices • ₹{metrics.totalSales.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="dashboard-subtitle">
            Overview for <strong>{periodLabel}</strong> ({dateRangeString})
          </p>
        </div>

        <div className="dashboard-header-actions">
          {/* Time Filter Segmented Control */}
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
              <span>Custom</span>
            </button>
          </div>

          {/* Export Button Dropdown */}
          <div className="report-export-dropdown-wrapper" ref={exportDropdownRef}>
            <button
              type="button"
              className="report-export-btn-primary"
              onClick={() => setExportMenuOpen(prev => !prev)}
            >
              <Download size={15} />
              <span>Export Report</span>
              <ChevronDown size={14} style={{ opacity: 0.8 }} />
            </button>

            {exportMenuOpen && (
              <div className="report-export-menu-dropdown">
                <div className="export-menu-header">Export Statement</div>
                
                {/* PDF */}
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportPdf}
                >
                  <div className="export-item-icon pdf">
                    <Printer size={16} />
                  </div>
                  <div className="export-item-text">
                    <span className="export-name">Export as PDF</span>
                    <span className="export-sub">Printable A4 statement</span>
                  </div>
                </button>

                {/* EXCEL */}
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportExcel}
                >
                  <div className="export-item-icon excel">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="export-item-text">
                    <span className="export-name">Export as Excel</span>
                    <span className="export-sub">Microsoft Excel spreadsheet (.xls)</span>
                  </div>
                </button>

                {/* CSV */}
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportCsv}
                >
                  <div className="export-item-icon csv">
                    <FileText size={16} />
                  </div>
                  <div className="export-item-text">
                    <span className="export-name">Export as CSV</span>
                    <span className="export-sub">Comma-separated data sheet</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {exportSuccessMsg && (
        <div className="report-export-success-banner">
          <CheckCircle2 size={16} />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* 2. Custom Date Filter Bar (When 'custom' is active) */}
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

      {/* 3. 6 Key Financial Metrics Grid */}
      <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {/* Total Sales */}
        <div className="kpi-stat-card accent-emerald">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Total Revenue</span>
            <div className="kpi-icon-pill emerald">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-figure-value green font-mono">
            ₹{metrics.totalSales.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            Across {metrics.count} invoices
          </div>
        </div>

        {/* Bills Count */}
        <div className="kpi-stat-card accent-slate">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Total Bills</span>
            <div className="kpi-icon-pill slate">
              <Receipt size={16} />
            </div>
          </div>
          <div className="kpi-figure-value font-mono">
            {metrics.count}
          </div>
          <div className="kpi-context-note">
            Avg: ₹{metrics.avgBill} / bill
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
            ₹{metrics.grossProfit.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            35% margin
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
            {filteredExpenses.length} entries
          </div>
        </div>

        {/* Net Profit */}
        <div className="kpi-stat-card accent-teal">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Net Profit</span>
            <div className="kpi-icon-pill teal">
              <Wallet size={16} />
            </div>
          </div>
          <div className={`kpi-figure-value font-mono ${metrics.netProfit >= 0 ? 'green' : 'red'}`}>
            ₹{metrics.netProfit.toLocaleString('en-IN')}
          </div>
          <div className="kpi-context-note">
            Profit - Expenses
          </div>
        </div>

        {/* Cash Collected */}
        <div className="kpi-stat-card accent-indigo">
          <div className="kpi-card-header">
            <span className="kpi-title-label">Cash Collected</span>
            <div className="kpi-icon-pill indigo">
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
      </div>

      {/* 4. Payment Distribution & Breakdown Card */}
      <div className="dashboard-card-widget">
        <div className="dashboard-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="header-icon-box emerald">
              <Wallet size={15} />
            </div>
            <strong style={{ fontSize: '0.92rem' }}>Payment Distribution ({periodLabel})</strong>
          </div>
          <span className="widget-header-badge green font-mono">
            ₹{metrics.totalSales.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ padding: '1rem 1.15rem' }}>
          <div className="payment-distribution-bar">
            {paymentBreakdown.cashPct > 0 && (
              <div className="bar-seg cash" style={{ width: `${paymentBreakdown.cashPct}%` }} />
            )}
            {paymentBreakdown.upiPct > 0 && (
              <div className="bar-seg upi" style={{ width: `${paymentBreakdown.upiPct}%` }} />
            )}
            {paymentBreakdown.cardPct > 0 && (
              <div className="bar-seg card" style={{ width: `${paymentBreakdown.cardPct}%` }} />
            )}
            {paymentBreakdown.creditPct > 0 && (
              <div className="bar-seg credit" style={{ width: `${paymentBreakdown.creditPct}%` }} />
            )}
            {metrics.totalSales === 0 && (
              <div className="bar-seg empty" style={{ width: '100%' }} />
            )}
          </div>

          <div className="payment-legend-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="legend-item">
              <div className="legend-dot cash" />
              <div className="legend-text">
                <div className="legend-name">Cash</div>
                <div className="legend-val font-mono">₹{metrics.cash.toLocaleString('en-IN')}</div>
                <div className="legend-pct">{paymentBreakdown.cashPct}%</div>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot upi" />
              <div className="legend-text">
                <div className="legend-name">UPI / QR</div>
                <div className="legend-val font-mono">₹{metrics.upi.toLocaleString('en-IN')}</div>
                <div className="legend-pct">{paymentBreakdown.upiPct}%</div>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot card" />
              <div className="legend-text">
                <div className="legend-name">Card Swipes</div>
                <div className="legend-val font-mono">₹{metrics.card.toLocaleString('en-IN')}</div>
                <div className="legend-pct">{paymentBreakdown.cardPct}%</div>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot credit" />
              <div className="legend-text">
                <div className="legend-name">Credit (Udhar)</div>
                <div className="legend-val font-mono">₹{metrics.credit.toLocaleString('en-IN')}</div>
                <div className="legend-pct">{paymentBreakdown.creditPct}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Invoices Statement Table */}
      <div className="pos-table-card">
        <div className="dashboard-table-header">
          <div>
            <strong style={{ fontSize: '0.92rem' }}>Detailed Transaction Register</strong>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginLeft: '0.45rem' }}>
              Showing {filteredSales.length} {filteredSales.length === 1 ? 'record' : 'records'} for {periodLabel}
            </span>
          </div>
        </div>

        <table className="pos-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Bill No</th>
              <th style={{ width: '170px' }}>Date & Time</th>
              <th>Items Detail</th>
              <th style={{ width: '130px' }}>Payment Mode</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-tertiary)' }}>
                  No transactions recorded for {periodLabel.toLowerCase()}.
                </td>
              </tr>
            ) : (
              filteredSales.map(s => {
                const itemCount = Array.isArray(s.items) 
                  ? s.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
                  : 1;

                const itemSummary = Array.isArray(s.items) && s.items.length > 0
                  ? s.items.map(it => `${it.name || 'Item'}${Number(it.qty) > 1 ? ` (${it.qty})` : ''}`).join(', ')
                  : '—';

                return (
                  <tr key={s.id} className="dashboard-table-row">
                    <td>
                      <span className="bill-tag-mono font-mono">{s.billNo}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.date || '—'}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginLeft: '0.35rem' }}>{s.time || ''}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} title={itemSummary}>
                        {itemSummary}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const isUnmarked = s.paymentConfirmed === false || s.isUnmarked === true;
                        const pMethod = s.paymentMethod || 'Cash';
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
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.94rem' }}>
                        ₹{Number(s.total || 0).toLocaleString('en-IN')}
                      </span>
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
