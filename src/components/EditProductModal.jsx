import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, Tag } from 'lucide-react';

export default function EditProductModal({
  isOpen,
  product,
  categories = [],
  onClose,
  onSave
}) {
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSellingPrice(product.sellingPrice !== undefined && product.sellingPrice !== null ? String(product.sellingPrice) : '');
      setCategory(product.category || 'General');
      setErrorMsg(null);
    }
  }, [product]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Product name cannot be empty.');
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid selling price greater than 0.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const updatedProduct = {
        ...product,
        name: trimmedName,
        sellingPrice: priceNum,
        category: category.trim() || 'General',
        updatedAt: new Date().toISOString()
      };

      await onSave(updatedProduct);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('[EditProductModal] Save failed:', err);
      setErrorMsg(err.message || 'Failed to update product. Please try again.');
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c && c !== 'All Items');

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal-window edit-product-modal-window" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Header Bar */}
        <div className="modal-header-bar">
          <div className="modal-title-left">
            <div className="modal-header-icon-box">
              <Pencil size={19} />
            </div>
            <div className="modal-header-text">
              <h3>Edit Product</h3>
              <p>Update product name and price</p>
            </div>
          </div>
          <button 
            type="button"
            className="modal-close-icon-btn" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body-area">
            {errorMsg && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}

            <div className="modal-edit-form">
              {/* Product Name Input */}
              <div className="form-input-group">
                <label className="form-input-label" htmlFor="edit-product-name">
                  Product Name <span className="required-dot">*</span>
                </label>
                <input 
                  id="edit-product-name"
                  type="text" 
                  className="form-input-field"
                  required 
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Mango Shake, Chicken Roll"
                />
              </div>

              {/* Selling Price & Category Grid */}
              <div className="form-grid-two-cols">
                <div className="form-input-group">
                  <label className="form-input-label" htmlFor="edit-product-price">
                    Selling Price (₹) <span className="required-dot">*</span>
                  </label>
                  <div className="currency-input-wrapper">
                    <span className="currency-input-symbol">₹</span>
                    <input 
                      id="edit-product-price"
                      type="number" 
                      className="form-input-field font-mono currency-input-field"
                      required 
                      min="1"
                      step="any"
                      value={sellingPrice}
                      onChange={(e) => {
                        setSellingPrice(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="form-input-group">
                  <label className="form-input-label" htmlFor="edit-product-category">
                    Category
                  </label>
                  <input 
                    id="edit-product-category"
                    type="text" 
                    list="modal-categories-datalist"
                    className="form-input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Shakes"
                  />
                  <datalist id="modal-categories-datalist">
                    {filteredCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Category Quick Tags */}
              {filteredCategories.length > 0 && (
                <div style={{ marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Quick Pick Category:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          border: category === cat ? '1.5px solid var(--brown-primary)' : '1px solid var(--border-medium)',
                          background: category === cat ? 'var(--brown-subtle)' : '#f8fafc',
                          color: category === cat ? 'var(--brown-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.12s'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="modal-footer-bar" style={{ justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-secondary-action"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-checkout"
              disabled={isSaving}
              style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
            >
              <Check size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
