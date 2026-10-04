import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  QrCode, 
  X,
  CheckCircle2,
  CreditCard
} from 'lucide-react';

export default function PostPrintPaymentSelector({
  sale,
  onClose,
  onSelectPayment
}) {
  const [selectedMethod, setSelectedMethod] = useState(sale?.paymentMethod || 'Cash');
  const [justUpdated, setJustUpdated] = useState(false);
  const [updatedMethodName, setUpdatedMethodName] = useState('');

  // Whenever a new bill is printed (even if previous wasn't selected), update to the new bill's data
  useEffect(() => {
    if (sale) {
      setSelectedMethod(sale.paymentMethod || 'Cash');
      setJustUpdated(false);
      setUpdatedMethodName('');
    }
  }, [sale?.id, sale?.billNo]);

  // Keyboard Shortcuts: 1/C for Cash, 2/G/U for GPay, Escape to dismiss
  useEffect(() => {
    if (!sale) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a search or text input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'escape') {
        e.preventDefault();
        onClose();
      } else if (key === '1' || key === 'c') {
        e.preventDefault();
        handleChoose('Cash');
      } else if (key === '2' || key === 'g' || key === 'u') {
        e.preventDefault();
        handleChoose('GPay');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sale, onClose]);

  if (!sale) return null;

  const handleChoose = (method) => {
    setSelectedMethod(method);
    setJustUpdated(true);
    setUpdatedMethodName(method);

    if (onSelectPayment) {
      onSelectPayment(sale.id, method);
    }

    // Hide only after selecting method
    setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div className={`post-print-header-pill ${justUpdated ? 'confirmed' : ''}`} role="region" aria-label="Select Payment Method">
      {justUpdated ? (
        <div className="post-print-pill-success">
          <div className="post-print-success-badge">
            <CheckCircle2 size={16} />
          </div>
          <div className="post-print-success-text">
            <span className="post-print-heading">UPDATED</span>
            <span className="post-print-success-msg">Saved as <strong>{updatedMethodName}</strong></span>
          </div>
        </div>
      ) : (
        <>
          <div className="post-print-pill-left">
            <div className="post-print-icon-badge">
              <CreditCard size={15} />
            </div>
            <div className="post-print-text">
              <span className="post-print-heading">PAY METHOD</span>
              <span className="post-print-bill font-mono">#{sale.billNo}</span>
            </div>
          </div>

          <div className="post-print-pill-divider" />

          <div className="post-print-pill-buttons">
            <button
              type="button"
              className={`post-print-pill-btn cash ${selectedMethod === 'Cash' ? 'active' : ''}`}
              onClick={() => handleChoose('Cash')}
              title="Press 1 or C for Cash"
            >
              <Banknote size={14} />
              <span>Cash</span>
              <span className="hotkey-hint">1</span>
            </button>

            <button
              type="button"
              className={`post-print-pill-btn gpay ${selectedMethod === 'GPay' || selectedMethod === 'UPI' ? 'active' : ''}`}
              onClick={() => handleChoose('GPay')}
              title="Press 2 or G for GPay"
            >
              <QrCode size={14} />
              <span>GPay</span>
              <span className="hotkey-hint">2</span>
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              className="post-print-pill-close"
              title="Dismiss (keeps Cash default) - Esc"
              aria-label="Dismiss payment selection"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
