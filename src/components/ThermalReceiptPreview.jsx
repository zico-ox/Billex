import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, AlertCircle, Copy, Trash2, Banknote, QrCode, Check } from 'lucide-react';
import { formatReceiptText } from '../services/escpos';
import { printerService } from '../services/printerService';

export default function ThermalReceiptPreview({ 
  sale, 
  settings, 
  onClose, 
  onPrintConfirmed, 
  onDelete,
  onUpdatePayment 
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  const [currentPayment, setCurrentPayment] = useState(sale?.paymentMethod || 'Cash');
  const [isUnmarked, setIsUnmarked] = useState(sale?.paymentConfirmed === false || sale?.isUnmarked === true);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    if (sale) {
      setCurrentPayment(sale.paymentMethod || 'Cash');
      setIsUnmarked(sale.paymentConfirmed === false || sale.isUnmarked === true);
    }
  }, [sale?.id, sale?.paymentMethod, sale?.paymentConfirmed, sale?.isUnmarked]);

  if (!sale) return null;

  const activeSale = {
    ...sale,
    paymentMethod: currentPayment,
    paymentConfirmed: !isUnmarked,
    isUnmarked
  };

  const lines = formatReceiptText(activeSale, settings || {});

  const handleUpdateMethod = async (method) => {
    setCurrentPayment(method);
    setIsUnmarked(false);
    setIsUpdatingPayment(true);
    try {
      if (onUpdatePayment) {
        await onUpdatePayment(sale.id, method);
      }
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      const result = await printerService.printReceipt(activeSale, settings || {});
      setPrintStatus({ success: true, message: result.message || 'Printed on EXEO EX58P' });
      if (onPrintConfirmed) onPrintConfirmed(result);
    } catch (err) {
      setPrintStatus({
        success: false,
        message: err.message || 'Thermal printer transmission failed. Please connect EXEO EX58P.',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" style={{ maxWidth: '440px' }}>
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={18} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Customer Bill Preview</h3>
              <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>58mm Thermal Receipt</span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Payment Selector Bar inside View Bill modal */}
        <div className="receipt-modal-payment-section">
          <div className="receipt-payment-row-left">
            <span className="receipt-payment-section-title">Payment:</span>
            <span className={`payment-pill-tag ${String(currentPayment || 'cash').toLowerCase()} ${isUnmarked ? 'unmarked' : ''}`}>
              {currentPayment}
            </span>
            {isUnmarked && (
              <span className="receipt-unmarked-notice-tag">Unmarked</span>
            )}
          </div>

          <div className="receipt-payment-action-buttons">
            <button
              type="button"
              className={`receipt-payment-btn cash ${currentPayment === 'Cash' && !isUnmarked ? 'active' : ''}`}
              onClick={() => handleUpdateMethod('Cash')}
              disabled={isUpdatingPayment}
              title="Confirm as Cash (turns green)"
            >
              <Banknote size={14} />
              <span>Cash</span>
              {currentPayment === 'Cash' && !isUnmarked && <Check size={13} />}
            </button>

            <button
              type="button"
              className={`receipt-payment-btn gpay ${(currentPayment === 'GPay' || currentPayment === 'UPI') ? 'active' : ''}`}
              onClick={() => handleUpdateMethod('GPay')}
              disabled={isUpdatingPayment}
              title="Change to GPay"
            >
              <QrCode size={14} />
              <span>GPay</span>
              {(currentPayment === 'GPay' || currentPayment === 'UPI') && <Check size={13} />}
            </button>
          </div>
        </div>

        <div className="modal-body-area" style={{ background: '#f4f5f7', padding: '1.25rem 0.75rem' }}>
          {printStatus && (
            <div style={{
              margin: '0 0.85rem 1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: printStatus.success ? '#dcfce7' : '#fee2e2',
              color: printStatus.success ? '#15803d' : '#b91c1c',
              border: `1px solid ${printStatus.success ? '#86efac' : '#fca5a5'}`
            }}>
              {printStatus.success ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
              <span>{printStatus.message}</span>
            </div>
          )}

          {/* 58mm Paper Roll Preview */}
          <div className="paper-receipt-container">
            {lines.map((line, idx) => {
              const trimmed = (line || '').trim();
              const isHeaderBig = trimmed === 'Weknd.' || trimmed === 'WEKND.';
              const isHeaderSub = trimmed === 'Juice & Rolls' || trimmed === 'JUICE & ROLLS';
              const isTotal = trimmed.startsWith('TOTAL');
              const isFooter = trimmed === 'THANK YOU!' || trimmed === '@weknd.official' || trimmed === 'VISIT WEKND. AGAIN';

              let lineClass = 'receipt-text-line';
              if (isHeaderBig) lineClass += ' receipt-line-header-big';
              else if (isHeaderSub) lineClass += ' receipt-line-header-sub';
              else if (isTotal) lineClass += ' receipt-line-total';
              else if (isFooter) lineClass += ' receipt-line-footer';

              const displayLine = line || ' ';

              return (
                <div key={idx} className={lineClass}>
                  {displayLine}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer-bar" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              type="button" 
              className="btn-secondary-action" 
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem' }}
            >
              <Copy size={14} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {onDelete && (
              <button 
                type="button" 
                className="btn-clear-bill-outline" 
                onClick={() => {
                  if (window.confirm(`Delete invoice ${sale.billNo} permanently?`)) {
                    onDelete(sale.id);
                    onClose();
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem' }}
                title="Delete this invoice"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-secondary-action" 
              onClick={onClose}
              style={{ padding: '0.65rem 1rem', fontWeight: 700 }}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn-primary-checkout"
              onClick={handlePrint}
              disabled={isPrinting}
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem' }}
            >
              <Printer size={16} />
              <span>{isPrinting ? 'Sending ESC/POS...' : 'Print (EXEO EX58P)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
