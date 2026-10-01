# Billex

A high-performance, modern Web POS & Billing Application for **Weknd. (Juice & Rumali Rolls)**.

Built with React, Vite, Firebase Realtime Database, and Web ESC/POS Thermal Printing.

---

## ⚡ Features

- **Rapid POS Billing**: 1-click cart addition, fast quantity steppers, parcel fee calculation (₹5/parcel), hold & clear bill.
- **Full 41-Item Menu**: Pre-loaded catalog across 7 categories:
  - Must Try (12 items)
  - Rumali Rolls (5 items)
  - Mojitos (1 item - all flavors ₹89)
  - Fresh Lime (5 items)
  - Shakes (12 items)
  - Fresh Juices (5 items)
  - Special Avilmilk (1 item)
- **Firebase Realtime Database Cloud Sync**: Live bidirectional multi-device sync for orders, products, customers, and shop settings.
- **Hardware ESC/POS Thermal Printing**: Direct 58mm receipt printing support via Web Bluetooth, Web Serial (USB), and network adapters (tailored for EXEO EX58P).
- **Invoice & Order Management**: View, search, and delete invoices with real-time recalculations of sales & profits.
- **Offline First**: Runs completely without internet when required, syncing to cloud once connected.
- **Modern Minimalist UI**: Clean high-contrast white & grey aesthetic with keyboard shortcuts (`Ctrl + K` search).

---

## 🚀 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## ☁️ Deployment on Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.
