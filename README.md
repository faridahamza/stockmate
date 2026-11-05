# StockMate 📦

A lightweight, modern shop inventory management web application built purely with **HTML5, CSS3, and Vanilla JavaScript**.

Designed for small business owners and shopkeepers to manage inventory, track stock levels, calculate total store valuation, and record sales in real time—with all data persisted directly in the browser's `localStorage`.

---

## ✨ Features

- **Product Management**: Add, view, edit, and delete shop items with input validation (name, unit price, stock count).
- **Safe Deletion**: Integrated confirmation dialog prior to removing any product.
- **Stock Tracking & Alerts**:
  - Highlights low stock items ($\le 5$ units remaining) with amber warning badges and summary card alerts.
  - Distinguishes out-of-stock items ($0$ units remaining).
- **Real-Time Dashboard**:
  - Total unique products count.
  - Total inventory stock units.
  - Total store inventory value in **Nigerian Naira (₦)**.
  - Low stock warning counter.
- **Quick Stock Adjustments**:
  - `− 1 Sold` button to record sales instantly.
  - `+ 1 Stock` button to record incoming restocks.
  - Custom stock adjustment dialog for bulk sales or large deliveries with overdraft protection.
- **Live Search & Filter**:
  - Real-time instant search by product name.
  - Filter chips for *All Items*, *Low Stock (≤ 5)*, *In Stock (> 5)*, and *Out of Stock (0)*.
  - Sort by name, price, stock, and total value.
- **Client-Side Storage**:
  - Uses browser `localStorage` for offline persistence with zero server setup.
  - Built-in sample dataset loader for testing realistic retail inventory items.
- **Responsive & Modern Design**:
  - High-contrast, clean UI with custom CSS variables and smooth transitions.
  - Works across desktop monitors, tablets, and mobile devices.

---

## 🛠️ Tech Stack

- **HTML5**: Semantic markup, accessible forms, modal dialogs.
- **CSS3**: Custom design system, CSS grid/flexbox, responsive breakpoints.
- **Vanilla JavaScript (ES6+)**: Zero frameworks, zero libraries, zero dependencies.

---

## 🚀 Getting Started Locally

No installation or build steps are required.

### Option 1: Direct File Open
Simply double-click `index.html` in your file explorer to open it in your web browser.

### Option 2: Local HTTP Server (Python)
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## ☁️ Deployment

### Vercel
Because this is a static site with `index.html` at the root:
1. Import this repository in the [Vercel Dashboard](https://vercel.com).
2. Leave framework preset as **Other** and build command blank.
3. Click **Deploy**.

---

## 📄 License

MIT License. Free to use and customize for personal or commercial shop management.
