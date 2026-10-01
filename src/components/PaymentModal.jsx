import React, { useEffect } from 'react';
import { X, Banknote, QrCode, Printer, CheckCircle2 } from 'lucide-react';

export default function PaymentModal({
  isOpen,
  onClose,
  onSelectPayment,
  total = 0,
  billNo = '',
  itemsCount = 0,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '1' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onSelectPayment('Cash');
      } else if (e.key === '2' || e.key.toLowerCase() === 'u') {
        e.preventDefault();
        onSelectPayment('UPI');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectPayment('Cash');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectPayment]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal-window" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px' }}
      >
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Printer size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                Select Payment Mode
              </h3>
              <span className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                {billNo} • {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} 
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-area" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Bill Total Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1.1rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Grand Total To Pay
            </div>
            <div className="font-mono" style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
              ₹{Number(total).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} />
              <span>Bill ready for thermal printing</span>
            </div>
          </div>

          {/* Payment Options Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Choose payment method:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              {/* CASH OPTION */}
              <button
                type="button"
                className="payment-selection-card cash"
                onClick={() => onSelectPayment('Cash')}
                autoFocus
              >
                <div className="payment-card-icon-wrap cash">
                  <Banknote size={26} />
                </div>
                <div className="payment-card-info">
                  <span className="payment-card-name">Cash</span>
                  <span className="payment-card-sub">Cash in hand</span>
                </div>
                <span className="payment-hotkey-badge">Press 1 or C</span>
              </button>

              {/* UPI OPTION */}
              <button
                type="button"
                className="payment-selection-card upi"
                onClick={() => onSelectPayment('UPI')}
              >
                <div className="payment-card-icon-wrap upi">
                  <QrCode size={26} />
                </div>
                <div className="payment-card-info">
                  <span className="payment-card-name">UPI</span>
                  <span className="payment-card-sub">GPay / PhonePe / QR</span>
                </div>
                <span className="payment-hotkey-badge">Press 2 or U</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer-bar" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
            Selecting prints receipt directly
          </span>
          <button 
            type="button" 
            className="btn-clear-bill-outline"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
