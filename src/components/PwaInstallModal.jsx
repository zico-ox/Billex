import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

export default function PwaInstallModal({ 
  isOpen, 
  onClose, 
  onInstallDirect, 
  isInstallable, 
  isStandalone 
}) {
  const [activeDeviceTab, setActiveDeviceTab] = useState('tablet'); // 'tablet' | 'phone' | 'pc'

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 120 }}>
      <div className="modal-window" style={{ maxWidth: '520px', borderRadius: '20px', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div className="modal-header-bar" style={{ background: 'linear-gradient(135deg, #2b1b12 0%, #4a2e1b 100%)', color: '#fff', padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#8d5e3c',
              border: '1.5px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Download size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Install Weknd POS
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#fef3c7', fontWeight: 600 }}>
                High Speed App for Tablet, Phone & PC
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-area" style={{ padding: '1.4rem', background: '#fcfbf9' }}>
          {/* Status Banner */}
          {isStandalone ? (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#15803d', display: 'block' }}>
                  Weknd POS is already installed!
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#166534' }}>
                  You are currently running in standalone app mode with instant launch.
                </span>
              </div>
            </div>
          ) : isInstallable ? (
            <div style={{
              padding: '1rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fde68a',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                <Sparkles size={14} />
                <span>1-Click Quick Install Available</span>
              </div>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: '#78350f', lineHeight: 1.4 }}>
                Your browser is ready to install Weknd POS directly to your device desktop / home screen.
              </p>
              <button
                type="button"
                className="btn-print-bill-primary"
                onClick={() => {
                  onInstallDirect();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(141, 94, 60, 0.35)'
                }}
              >
                <Download size={18} />
                <span>Install Weknd POS Now</span>
              </button>
            </div>
          ) : null}

          {/* Device Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            background: '#e2e8f0',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveDeviceTab('tablet')}
              style={{
                flex: 1,
                padding: '0.55rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: activeDeviceTab === 'tablet' ? '#ffffff' : 'transparent',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: activeDeviceTab === 'tablet' ? 'var(--brown-primary)' : 'var(--text-secondary)',
                boxShadow: activeDeviceTab === 'tablet' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Tablet size={16} />
              <span>Tablet / iPad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDeviceTab('phone')}
              style={{
                flex: 1,
                padding: '0.55rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: activeDeviceTab === 'phone' ? '#ffffff' : 'transparent',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: activeDeviceTab === 'phone' ? 'var(--brown-primary)' : 'var(--text-secondary)',
                boxShadow: activeDeviceTab === 'phone' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Smartphone size={16} />
              <span>Phone</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDeviceTab('pc')}
              style={{
                flex: 1,
                padding: '0.55rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: activeDeviceTab === 'pc' ? '#ffffff' : 'transparent',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: activeDeviceTab === 'pc' ? 'var(--brown-primary)' : 'var(--text-secondary)',
                boxShadow: activeDeviceTab === 'pc' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Monitor size={16} />
              <span>PC / Laptop</span>
            </button>
          </div>

          {/* Guide Steps per Device */}
          {activeDeviceTab === 'tablet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  1
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Open in Safari or Chrome</strong>
                  On your iPad / Android Tablet, open this link in your main browser.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  2
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Tap the Share Icon</strong>
                  Tap the <Share2 size={14} style={{ display: 'inline', verticalAlign: '-2px', color: '#0284c7' }} /> <strong>Share</strong> button at the top-right of iPad Safari (or 3-dots in Chrome).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  3
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Select "Add to Home Screen"</strong>
                  Scroll down and tap <PlusSquare size={14} style={{ display: 'inline', verticalAlign: '-2px', color: '#16a34a' }} /> <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                </div>
              </div>
            </div>
          )}

          {activeDeviceTab === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  1
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Android (Chrome)</strong>
                  Tap the top menu <strong>(⋮)</strong> and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  2
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>iPhone (Safari)</strong>
                  Tap the bottom <Share2 size={14} style={{ display: 'inline', verticalAlign: '-2px', color: '#0284c7' }} /> <strong>Share</strong> button, then tap <strong>"Add to Home Screen"</strong>.
                </div>
              </div>
            </div>
          )}

          {activeDeviceTab === 'pc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  1
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Look for the Install Icon in the URL bar</strong>
                  In Chrome or Microsoft Edge, look at the right side of the address bar for the <strong>Install App</strong> icon (or computer icon).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown-subtle)', color: 'var(--brown-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  2
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Click "Install"</strong>
                  Weknd POS will open in its own clean window without any browser tabs or URL bars, and create a desktop shortcut!
                </div>
              </div>
            </div>
          )}

          {/* Advantages */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 0.95rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--text-tertiary)'
          }}>
            <span>⚡ Instant Launch</span>
            <span>📶 Works Offline</span>
            <span>🖨️ Direct Bluetooth Print</span>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-clear-bill-outline"
              onClick={onClose}
              style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
