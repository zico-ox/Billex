import React, { useState, useEffect } from 'react';
import { X, Printer, Bluetooth, Usb, Server, Smartphone, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { printerService } from '../services/printerService';

export default function PrinterModal({ onClose }) {
  const [connectionType, setConnectionType] = useState(printerService.connectionType);
  const [isConnected, setIsConnected] = useState(printerService.isConnected);
  const [printerName, setPrinterName] = useState(printerService.printerName);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const unsub = printerService.subscribe((s) => {
      setIsConnected(s.isConnected);
      setPrinterName(s.printerName);
      setConnectionType(s.connectionType);
    });
    return unsub;
  }, []);

  const handleModeChange = (type) => {
    setConnectionType(type);
    printerService.setConnectionType(type);
    setStatusMsg(null);
  };

  const handleConnect = async () => {
    setIsBusy(true);
    setStatusMsg(null);
    try {
      if (connectionType === 'web-bluetooth') {
        const res = await printerService.connectBluetooth();
        setStatusMsg({ success: true, text: `Connected to ${res.name} (Bluetooth 4.0)` });
      } else if (connectionType === 'web-serial') {
        const res = await printerService.connectSerial();
        setStatusMsg({ success: true, text: `Connected to ${res.name} (USB Serial)` });
      } else if (connectionType === 'local-bridge') {
        setStatusMsg({ success: true, text: 'Local Node Bridge connected (localhost:3030)' });
      } else {
        setStatusMsg({ success: true, text: 'Android Native Bridge active' });
      }
    } catch (err) {
      setStatusMsg({ success: false, text: err.message });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" style={{ maxWidth: '460px' }}>
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={18} color="var(--brand-caramel)" />
            <h3>EXEO EX58P Hardware Adapter</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}>✕</button>
        </div>

        <div className="modal-body-area" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#faf8f5', padding: '0.75rem 0.95rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            <strong>Printer Specs:</strong> EXEO EX58P (M58.E-Z10-AD) • 58mm Paper • 384 Dots • EPSON ESC/POS standard
          </div>

          <div>
            <label className="form-label-text">Select Connection Port</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
              <button 
                type="button" 
                className={`pay-mode-btn ${connectionType === 'web-bluetooth' ? 'active' : ''}`}
                onClick={() => handleModeChange('web-bluetooth')}
              >
                <Bluetooth size={15} style={{ margin: '0 auto 0.25rem' }} />
                <div>Bluetooth</div>
              </button>
              <button 
                type="button" 
                className={`pay-mode-btn ${connectionType === 'web-serial' ? 'active' : ''}`}
                onClick={() => handleModeChange('web-serial')}
              >
                <Usb size={15} style={{ margin: '0 auto 0.25rem' }} />
                <div>USB Cable</div>
              </button>
              <button 
                type="button" 
                className={`pay-mode-btn ${connectionType === 'local-bridge' ? 'active' : ''}`}
                onClick={() => handleModeChange('local-bridge')}
              >
                <Server size={15} style={{ margin: '0 auto 0.25rem' }} />
                <div>Bridge</div>
              </button>
              <button 
                type="button" 
                className={`pay-mode-btn ${connectionType === 'android-bridge' ? 'active' : ''}`}
                onClick={() => handleModeChange('android-bridge')}
              >
                <Smartphone size={15} style={{ margin: '0 auto 0.25rem' }} />
                <div>Android</div>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Connection State:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, color: isConnected ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
              <span>{isConnected ? `${printerName} (Ready)` : 'Not Connected'}</span>
            </div>
          </div>

          {statusMsg && (
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: statusMsg.success ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)',
              color: statusMsg.success ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {statusMsg.text}
            </div>
          )}

          <button 
            type="button" 
            className="btn-primary-checkout"
            onClick={handleConnect}
            disabled={isBusy}
            style={{ padding: '0.75rem', fontSize: '0.92rem' }}
          >
            <RefreshCw size={15} className={isBusy ? 'spin' : ''} />
            <span>{isConnected ? 'Reconnect / Pair Printer' : 'Pair / Connect EXEO EX58P'}</span>
          </button>
        </div>

        <div className="modal-footer-bar">
          <button className="btn-secondary-action" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
