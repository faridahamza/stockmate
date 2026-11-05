/**
 * StockMate — Shop Inventory Management System
 * Vanilla JavaScript (ES6+)
 * 
 * Manages shop inventory data with browser localStorage persistence,
 * real-time dashboard calculations, stock updates, search, and validation.
 */

'use strict';

(function () {
  // =========================================================================
  // CONSTANTS & CONFIGURATION
  // =========================================================================
  const STORAGE_KEY = 'stockmate_inventory_v1';
  const LOW_STOCK_THRESHOLD = 5;

  // Realistic sample products for Nigerian retail shops
  const SAMPLE_ITEMS = [
    {
      id: 'demo-1',
      name: 'Dangote Refined Sugar (1kg)',
      price: 1450,
      quantity: 35,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'demo-2',
      name: 'Peak Evaporated Milk (160g)',
      price: 800,
      quantity: 4, // Low stock demo (<= 5)
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'demo-3',
      name: 'Golden Penny Semovita (2kg)',
      price: 2850,
      quantity: 18,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'demo-4',
      name: 'Indomie Super Pack Onion Chicken (120g)',
      price: 400,
      quantity: 3, // Low stock demo (<= 5)
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'demo-5',
      name: 'Milo Chocolate Malt Refill (500g)',
      price: 3400,
      quantity: 0, // Out of stock demo
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'demo-6',
      name: 'Devon King\'s Vegetable Oil (1 Litre)',
      price: 3600,
      quantity: 12,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'demo-7',
      name: 'Dano Full Cream Milk Powder (800g)',
      price: 4900,
      quantity: 5, // Low stock demo (<= 5)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // =========================================================================
  // APPLICATION STATE
  // =========================================================================
  let inventory = [];
  let currentFilter = 'all'; // 'all' | 'low' | 'instock' | 'outofstock'
  let searchQuery = '';
  let currentSort = 'name-asc';
  let itemPendingDelete = null;
  let activeAdjustItem = null;

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const dom = {
    // KPIs
    kpiTotalItems: document.getElementById('kpiTotalItems'),
    kpiTotalQuantity: document.getElementById('kpiTotalQuantity'),
    kpiTotalValue: document.getElementById('kpiTotalValue'),
    kpiLowStockCount: document.getElementById('kpiLowStockCount'),
    kpiLowStockCard: document.getElementById('kpiLowStockCard'),

    // Table & States
    inventoryTable: document.getElementById('inventoryTable'),
    inventoryTableBody: document.getElementById('inventoryTableBody'),
    emptyState: document.getElementById('emptyState'),
    noResultsState: document.getElementById('noResultsState'),
    noResultsMessage: document.getElementById('noResultsMessage'),
    tableFooter: document.getElementById('tableFooter'),
    displayCountText: document.getElementById('displayCountText'),

    // Filter Chips
    filterChips: document.querySelectorAll('.filter-chip'),
    countAll: document.getElementById('countAll'),
    countLow: document.getElementById('countLow'),
    countInStock: document.getElementById('countInStock'),
    countOutOfStock: document.getElementById('countOutOfStock'),

    // Search & Sort
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),

    // Header Actions
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    loadSampleDataBtn: document.getElementById('loadSampleDataBtn'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    emptySampleBtn: document.getElementById('emptySampleBtn'),

    // Item Modal (Add/Edit)
    itemModal: document.getElementById('itemModal'),
    itemForm: document.getElementById('itemForm'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    saveBtnText: document.getElementById('saveBtnText'),
    itemIdInput: document.getElementById('itemIdInput'),
    itemNameInput: document.getElementById('itemNameInput'),
    itemPriceInput: document.getElementById('itemPriceInput'),
    itemQtyInput: document.getElementById('itemQtyInput'),
    nameError: document.getElementById('nameError'),
    priceError: document.getElementById('priceError'),
    qtyError: document.getElementById('qtyError'),
    closeItemModalBtn: document.getElementById('closeItemModalBtn'),
    cancelItemModalBtn: document.getElementById('cancelItemModalBtn'),

    // Stock Adjust Modal
    adjustModal: document.getElementById('adjustModal'),
    adjustForm: document.getElementById('adjustForm'),
    adjustItemId: document.getElementById('adjustItemId'),
    adjustMode: document.getElementById('adjustMode'),
    adjustItemNameDisplay: document.getElementById('adjustItemNameDisplay'),
    adjustCurrentStockDisplay: document.getElementById('adjustCurrentStockDisplay'),
    modeSaleBtn: document.getElementById('modeSaleBtn'),
    modeRestockBtn: document.getElementById('modeRestockBtn'),
    adjustAmountLabel: document.getElementById('adjustAmountLabel'),
    adjustAmountInput: document.getElementById('adjustAmountInput'),
    adjustHint: document.getElementById('adjustHint'),
    adjustError: document.getElementById('adjustError'),
    newStockPreview: document.getElementById('newStockPreview'),
    closeAdjustModalBtn: document.getElementById('closeAdjustModalBtn'),
    cancelAdjustBtn: document.getElementById('cancelAdjustBtn'),

    // Delete Confirmation Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteItemName: document.getElementById('deleteItemName'),
    deleteItemDetails: document.getElementById('deleteItemDetails'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),

    // Toasts
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // STORAGE & DATA HANDLING
  // =========================================================================

  /**
   * Loads inventory data from browser localStorage with safe fallback
   */
  function loadInventoryFromStorage() {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        inventory = [];
        return;
      }

      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        // Validate each item to ensure data integrity
        inventory = parsed
          .filter(item => item && typeof item === 'object')
          .map(item => ({
            id: String(item.id || generateUniqueId()),
            name: String(item.name || 'Unnamed Product').trim(),
            price: Math.max(0, Number(item.price) || 0),
            quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
          }));
      } else {
        console.warn('StockMate: Stored data was not an array. Resetting storage.');
        inventory = [];
      }
    } catch (err) {
      console.error('StockMate: Error reading from localStorage. Starting with empty inventory.', err);
      showToast('Could not load saved inventory. Storage may be corrupted.', 'error');
      inventory = [];
    }
  }

  /**
   * Persists inventory data to browser localStorage
   */
  function saveInventoryToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
      return true;
    } catch (err) {
      console.error('StockMate: Error writing to localStorage.', err);
      showToast('Storage full or blocked. Changes could not be saved to browser.', 'error');
      return false;
    }
  }

  /**
   * Generates a unique identifier
   */
  function generateUniqueId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
  }

  // =========================================================================
  // CURRENCY & FORMATTING UTILITIES
  // =========================================================================

  /**
   * Formats numbers into Nigerian Naira (₦) currency representation
   * @param {number} amount
   * @returns {string} Formatted currency string, e.g. ₦1,250.00
   */
  function formatNaira(amount) {
    const validAmount = Number.isFinite(amount) ? amount : 0;
    try {
      const formatted = new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(validAmount);
      return '₦' + formatted;
    } catch (e) {
      // Fallback manual formatting
      return '₦' + validAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }

  /**
   * Formats a number with thousand separators
   */
  function formatNumber(num) {
    const validNum = Number.isFinite(num) ? num : 0;
    return new Intl.NumberFormat('en-US').format(validNum);
  }

  /**
   * Sanitize HTML text to prevent XSS injection
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================

  /**
   * Displays non-blocking, accessible toast alerts
   * @param {string} message
   * @param {'success'|'warning'|'error'|'info'} type
   * @param {number} duration
   */
  function showToast(message, type = 'success', duration = 3000) {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose appropriate icon
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, duration);
  }

  // =========================================================================
  // DASHBOARD CALCULATIONS & KPI UPDATES
  // =========================================================================

  /**
   * Recalculates and updates all dashboard metrics based on current inventory
   */
  function updateDashboardKPIs() {
    const totalItems = inventory.length;
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      totalQuantity += item.quantity;
      totalValue += (item.price * item.quantity);

      if (item.quantity === 0) {
        outOfStockCount++;
        lowStockCount++; // 0 units is also <= LOW_STOCK_THRESHOLD
      } else if (item.quantity <= LOW_STOCK_THRESHOLD) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    }

    // Update KPI card text
    dom.kpiTotalItems.textContent = formatNumber(totalItems);
    dom.kpiTotalQuantity.textContent = formatNumber(totalQuantity);
    dom.kpiTotalValue.textContent = formatNaira(totalValue);
    dom.kpiLowStockCount.textContent = formatNumber(lowStockCount);

    // Visual alert styling on KPI card if there are low stock items
    if (lowStockCount > 0) {
      dom.kpiLowStockCard.classList.add('has-alert');
    } else {
      dom.kpiLowStockCard.classList.remove('has-alert');
    }

    // Update filter counts
    dom.countAll.textContent = totalItems;
    dom.countLow.textContent = lowStockCount;
    dom.countInStock.textContent = inStockCount;
    dom.countOutOfStock.textContent = outOfStockCount;
  }

  // =========================================================================
  // FILTERING, SEARCHING & SORTING
  // =========================================================================

  /**
   * Returns filtered and sorted list of inventory items
   */
  function getFilteredItems() {
    let result = inventory.slice();

    // 1. Filter by Stock Level
    if (currentFilter === 'low') {
      result = result.filter(item => item.quantity <= LOW_STOCK_THRESHOLD);
    } else if (currentFilter === 'instock') {
      result = result.filter(item => item.quantity > LOW_STOCK_THRESHOLD);
    } else if (currentFilter === 'outofstock') {
      result = result.filter(item => item.quantity === 0);
    }

    // 2. Search by item name
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(item => item.name.toLowerCase().includes(query));
    }

    // 3. Sort items
    result.sort((a, b) => {
      switch (currentSort) {
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'qty-asc':
          return a.quantity - b.quantity;
        case 'qty-desc':
          return b.quantity - a.quantity;
        case 'value-desc':
          return (b.price * b.quantity) - (a.price * a.quantity);
        default:
          return 0;
      }
    });

    return result;
  }

  // =========================================================================
  // TABLE RENDERING
  // =========================================================================

  /**
   * Renders the inventory table based on current state, filters, and search
   */
  function renderInventoryTable() {
    const filteredItems = getFilteredItems();
    const hasItems = inventory.length > 0;
    const hasFilteredResults = filteredItems.length > 0;

    // Manage Empty States
    if (!hasItems) {
      dom.inventoryTable.style.display = 'none';
      dom.tableFooter.style.display = 'none';
      dom.noResultsState.hidden = true;
      dom.emptyState.hidden = false;
      return;
    }

    dom.emptyState.hidden = true;

    if (!hasFilteredResults) {
      dom.inventoryTable.style.display = 'none';
      dom.tableFooter.style.display = 'none';
      dom.noResultsState.hidden = false;

      if (searchQuery.trim()) {
        dom.noResultsMessage.textContent = `No items found matching "${searchQuery.trim()}".`;
      } else {
        dom.noResultsMessage.textContent = 'No items found in this filter category.';
      }
      return;
    }

    // Show Table
    dom.inventoryTable.style.display = 'table';
    dom.tableFooter.style.display = 'flex';
    dom.noResultsState.hidden = true;

    // Populate rows
    const rowsHtml = filteredItems.map(item => {
      const itemTotalValue = item.price * item.quantity;
      const isLowStock = item.quantity <= LOW_STOCK_THRESHOLD && item.quantity > 0;
      const isOutOfStock = item.quantity === 0;

      // Determine stock badge & row highlights
      let badgeHtml = '';
      let rowClass = '';

      if (isOutOfStock) {
        badgeHtml = `<span class="stock-badge badge-out-of-stock"><span class="stock-badge-dot"></span>0 units (Out of Stock)</span>`;
        rowClass = 'row-out-of-stock';
      } else if (isLowStock) {
        badgeHtml = `<span class="stock-badge badge-low-stock"><span class="stock-badge-dot"></span>${item.quantity} units (Low Stock)</span>`;
        rowClass = 'row-low-stock';
      } else {
        badgeHtml = `<span class="stock-badge badge-in-stock"><span class="stock-badge-dot"></span>${item.quantity} units</span>`;
      }

      const formattedDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      return `
        <tr class="${rowClass}" data-id="${item.id}">
          <td class="col-product">
            <div class="item-cell">
              <span class="item-name">${escapeHTML(item.name)}</span>
              <span class="item-date">Updated: ${formattedDate}</span>
            </div>
          </td>
          <td class="col-price">
            <span class="item-price">${formatNaira(item.price)}</span>
          </td>
          <td class="col-stock">
            ${badgeHtml}
          </td>
          <td class="col-value">
            <span class="item-value">${formatNaira(itemTotalValue)}</span>
          </td>
          <td class="col-quick-adjust text-center">
            <div class="quick-adjust-group" role="group" aria-label="Quick stock adjustment for ${escapeHTML(item.name)}">
              <button 
                type="button" 
                class="btn-adjust btn-sell" 
                data-action="quick-sell" 
                data-id="${item.id}"
                title="Record 1 unit sold (-1)"
                ${item.quantity === 0 ? 'disabled' : ''}
                aria-label="Sell one unit of ${escapeHTML(item.name)}"
              >
                &minus; 1 Sold
              </button>
              <button 
                type="button" 
                class="btn-adjust btn-restock" 
                data-action="quick-restock" 
                data-id="${item.id}"
                title="Add 1 restocked unit (+1)"
                aria-label="Add one unit of ${escapeHTML(item.name)}"
              >
                + 1 Stock
              </button>
              <button 
                type="button" 
                class="btn-adjust" 
                data-action="custom-adjust" 
                data-id="${item.id}"
                title="Record multiple sales or bulk restock"
                aria-label="Custom stock adjustment for ${escapeHTML(item.name)}"
              >
                Custom &hellip;
              </button>
            </div>
          </td>
          <td class="col-actions text-right">
            <div class="action-buttons">
              <button 
                type="button" 
                class="btn-action btn-edit" 
                data-action="edit" 
                data-id="${item.id}" 
                title="Edit item details"
                aria-label="Edit ${escapeHTML(item.name)}"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button 
                type="button" 
                class="btn-action btn-delete" 
                data-action="delete" 
                data-id="${item.id}" 
                title="Delete item"
                aria-label="Delete ${escapeHTML(item.name)}"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    dom.inventoryTableBody.innerHTML = rowsHtml;

    // Update table footer count text
    dom.displayCountText.textContent = `Showing ${filteredItems.length} of ${inventory.length} item${inventory.length === 1 ? '' : 's'}`;
  }

  /**
   * Main sync function: updates KPIs, table, and saves to storage
   */
  function refreshApp(shouldSave = true) {
    if (shouldSave) {
      saveInventoryToStorage();
    }
    updateDashboardKPIs();
    renderInventoryTable();
  }

  // =========================================================================
  // ITEM ADD / EDIT MODAL & FORM VALIDATION
  // =========================================================================

  /**
   * Opens the Add/Edit modal dialog
   * @param {string|null} itemId If provided, opens in edit mode
   */
  function openItemModal(itemId = null) {
    clearItemFormErrors();

    if (itemId) {
      // Edit Mode
      const item = inventory.find(i => i.id === itemId);
      if (!item) {
        showToast('Item not found', 'error');
        return;
      }
      dom.modalTitle.textContent = 'Edit Shop Item';
      dom.modalSubtitle.textContent = `Update details for "${item.name}".`;
      dom.saveBtnText.textContent = 'Update Item';
      dom.itemIdInput.value = item.id;
      dom.itemNameInput.value = item.name;
      dom.itemPriceInput.value = item.price;
      dom.itemQtyInput.value = item.quantity;
    } else {
      // Add Mode
      dom.modalTitle.textContent = 'Add New Shop Item';
      dom.modalSubtitle.textContent = 'Fill in the product details to add it to your shop inventory.';
      dom.saveBtnText.textContent = 'Save Item';
      dom.itemForm.reset();
      dom.itemIdInput.value = '';
    }

    dom.itemModal.classList.add('active');
    dom.itemModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => dom.itemNameInput.focus(), 50);
  }

  /**
   * Closes the Add/Edit modal dialog
   */
  function closeItemModal() {
    dom.itemModal.classList.remove('active');
    dom.itemModal.setAttribute('aria-hidden', 'true');
    dom.itemForm.reset();
    clearItemFormErrors();
  }

  /**
   * Clears inline validation errors
   */
  function clearItemFormErrors() {
    dom.nameError.textContent = '';
    dom.nameError.classList.remove('visible');
    dom.priceError.textContent = '';
    dom.priceError.classList.remove('visible');
    dom.qtyError.textContent = '';
    dom.qtyError.classList.remove('visible');

    dom.itemNameInput.classList.remove('input-error');
    dom.itemPriceInput.classList.remove('input-error');
    dom.itemQtyInput.classList.remove('input-error');
  }

  /**
   * Validates and submits the Item Form
   */
  function handleItemFormSubmit(e) {
    e.preventDefault();
    clearItemFormErrors();

    const name = dom.itemNameInput.value.trim();
    const rawPrice = dom.itemPriceInput.value.trim();
    const rawQty = dom.itemQtyInput.value.trim();
    const itemId = dom.itemIdInput.value;

    let isValid = true;

    // Validate Name
    if (!name) {
      dom.nameError.textContent = 'Please enter an item name.';
      dom.nameError.classList.add('visible');
      dom.itemNameInput.classList.add('input-error');
      isValid = false;
    } else if (name.length < 2) {
      dom.nameError.textContent = 'Item name must be at least 2 characters.';
      dom.nameError.classList.add('visible');
      dom.itemNameInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Price
    const price = parseFloat(rawPrice);
    if (rawPrice === '' || Number.isNaN(price)) {
      dom.priceError.textContent = 'Please enter a valid unit price.';
      dom.priceError.classList.add('visible');
      dom.itemPriceInput.classList.add('input-error');
      isValid = false;
    } else if (price < 0) {
      dom.priceError.textContent = 'Price cannot be negative.';
      dom.priceError.classList.add('visible');
      dom.itemPriceInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Quantity
    const qty = parseInt(rawQty, 10);
    if (rawQty === '' || Number.isNaN(qty) || !Number.isInteger(Number(rawQty))) {
      dom.qtyError.textContent = 'Please enter a valid whole number for stock quantity.';
      dom.qtyError.classList.add('visible');
      dom.itemQtyInput.classList.add('input-error');
      isValid = false;
    } else if (qty < 0) {
      dom.qtyError.textContent = 'Quantity cannot be negative.';
      dom.qtyError.classList.add('visible');
      dom.itemQtyInput.classList.add('input-error');
      isValid = false;
    }

    if (!isValid) return;

    const now = new Date().toISOString();

    if (itemId) {
      // Update existing item
      const index = inventory.findIndex(i => i.id === itemId);
      if (index !== -1) {
        inventory[index].name = name;
        inventory[index].price = price;
        inventory[index].quantity = qty;
        inventory[index].updatedAt = now;
        showToast(`Updated "${name}" successfully.`, 'success');
      }
    } else {
      // Add new item
      const newItem = {
        id: generateUniqueId(),
        name,
        price,
        quantity: qty,
        createdAt: now,
        updatedAt: now
      };
      inventory.unshift(newItem);
      showToast(`Added "${name}" to inventory.`, 'success');
    }

    closeItemModal();
    refreshApp(true);
  }

  // =========================================================================
  // STOCK ADJUSTMENTS (SALES & RESTOCKS)
  // =========================================================================

  /**
   * Fast 1-click unit sold (-1)
   */
  function handleQuickSell(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (item.quantity <= 0) {
      showToast(`"${item.name}" is already out of stock!`, 'warning');
      return;
    }

    item.quantity -= 1;
    item.updatedAt = new Date().toISOString();

    if (item.quantity <= LOW_STOCK_THRESHOLD && item.quantity > 0) {
      showToast(`Sold 1 unit of "${item.name}". Low stock remaining (${item.quantity}).`, 'warning');
    } else if (item.quantity === 0) {
      showToast(`Sold 1 unit of "${item.name}". Item is now OUT OF STOCK!`, 'warning');
    } else {
      showToast(`Sold 1 unit of "${item.name}". Stock remaining: ${item.quantity}.`, 'success');
    }

    refreshApp(true);
  }

  /**
   * Fast 1-click unit restocked (+1)
   */
  function handleQuickRestock(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += 1;
    item.updatedAt = new Date().toISOString();

    showToast(`Restocked 1 unit of "${item.name}". Total in stock: ${item.quantity}.`, 'success');
    refreshApp(true);
  }

  /**
   * Opens custom stock adjustment modal (for bulk sales or bulk arrivals)
   */
  function openAdjustModal(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    activeAdjustItem = item;
    dom.adjustItemId.value = item.id;
    dom.adjustItemNameDisplay.textContent = item.name;
    dom.adjustCurrentStockDisplay.textContent = `Current stock: ${item.quantity}`;
    dom.adjustAmountInput.value = '';
    dom.adjustError.textContent = '';
    dom.adjustError.classList.remove('visible');

    // Default to 'sale' if item has stock, otherwise 'restock'
    const initialMode = item.quantity > 0 ? 'sale' : 'restock';
    setAdjustMode(initialMode);

    updateAdjustPreview();

    dom.adjustModal.classList.add('active');
    dom.adjustModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => dom.adjustAmountInput.focus(), 50);
  }

  /**
   * Closes custom stock adjust modal
   */
  function closeAdjustModal() {
    dom.adjustModal.classList.remove('active');
    dom.adjustModal.setAttribute('aria-hidden', 'true');
    activeAdjustItem = null;
  }

  /**
   * Switches adjustment mode between 'sale' and 'restock'
   */
  function setAdjustMode(mode) {
    dom.adjustMode.value = mode;

    if (mode === 'sale') {
      dom.modeSaleBtn.classList.add('active');
      dom.modeRestockBtn.classList.remove('active');
      dom.adjustAmountLabel.innerHTML = 'Units Sold <span class="required">*</span>';
      dom.adjustHint.textContent = 'Enter the number of units sold to deduct from inventory.';
    } else {
      dom.modeRestockBtn.classList.add('active');
      dom.modeSaleBtn.classList.remove('active');
      dom.adjustAmountLabel.innerHTML = 'Units Received <span class="required">*</span>';
      dom.adjustHint.textContent = 'Enter the number of new units delivered to add to inventory.';
    }

    updateAdjustPreview();
  }

  /**
   * Updates real-time preview of projected new stock count
   */
  function updateAdjustPreview() {
    if (!activeAdjustItem) return;

    const mode = dom.adjustMode.value;
    const currentStock = activeAdjustItem.quantity;
    const amountVal = parseInt(dom.adjustAmountInput.value, 10);
    const amount = Number.isInteger(amountVal) && amountVal > 0 ? amountVal : 0;

    let projected = currentStock;
    if (mode === 'sale') {
      projected = currentStock - amount;
    } else {
      projected = currentStock + amount;
    }

    dom.newStockPreview.textContent = projected < 0 ? '0 (Insufficient stock)' : projected;
  }

  /**
   * Handles submission of stock adjustment form
   */
  function handleAdjustFormSubmit(e) {
    e.preventDefault();
    if (!activeAdjustItem) return;

    const mode = dom.adjustMode.value;
    const rawAmount = dom.adjustAmountInput.value.trim();
    const amount = parseInt(rawAmount, 10);

    // Validation
    if (!rawAmount || Number.isNaN(amount) || amount <= 0 || !Number.isInteger(Number(rawAmount))) {
      dom.adjustError.textContent = 'Please enter a valid positive whole number of units.';
      dom.adjustError.classList.add('visible');
      dom.adjustAmountInput.classList.add('input-error');
      return;
    }

    if (mode === 'sale' && amount > activeAdjustItem.quantity) {
      dom.adjustError.textContent = `Cannot record sale of ${amount} units. Only ${activeAdjustItem.quantity} currently available.`;
      dom.adjustError.classList.add('visible');
      dom.adjustAmountInput.classList.add('input-error');
      return;
    }

    dom.adjustError.textContent = '';
    dom.adjustError.classList.remove('visible');
    dom.adjustAmountInput.classList.remove('input-error');

    // Apply change
    if (mode === 'sale') {
      activeAdjustItem.quantity -= amount;
      showToast(`Recorded sale of ${amount} unit(s) of "${activeAdjustItem.name}".`, 'success');
    } else {
      activeAdjustItem.quantity += amount;
      showToast(`Added ${amount} unit(s) of new stock for "${activeAdjustItem.name}".`, 'success');
    }

    activeAdjustItem.updatedAt = new Date().toISOString();
    closeAdjustModal();
    refreshApp(true);
  }

  // =========================================================================
  // DELETE ITEM WITH CONFIRMATION MODAL
  // =========================================================================

  /**
   * Opens the confirmation modal prior to deleting an item
   */
  function openDeleteModal(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    itemPendingDelete = item;
    dom.deleteItemName.textContent = item.name;
    dom.deleteItemDetails.innerHTML = `
      <div><strong>Current Stock:</strong> ${item.quantity} unit(s)</div>
      <div><strong>Unit Price:</strong> ${formatNaira(item.price)}</div>
      <div><strong>Total Estimated Value:</strong> ${formatNaira(item.price * item.quantity)}</div>
    `;

    dom.deleteModal.classList.add('active');
    dom.deleteModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => dom.confirmDeleteBtn.focus(), 50);
  }

  /**
   * Closes delete modal
   */
  function closeDeleteModal() {
    dom.deleteModal.classList.remove('active');
    dom.deleteModal.setAttribute('aria-hidden', 'true');
    itemPendingDelete = null;
  }

  /**
   * Confirms and deletes item from inventory
   */
  function confirmDeleteItem() {
    if (!itemPendingDelete) return;

    const deletedName = itemPendingDelete.name;
    inventory = inventory.filter(i => i.id !== itemPendingDelete.id);
    closeDeleteModal();
    refreshApp(true);
    showToast(`Deleted "${deletedName}" from inventory.`, 'info');
  }

  // =========================================================================
  // SAMPLE DATA LOADER
  // =========================================================================

  /**
   * Populates sample retail products to test out the application
   */
  function loadSampleData() {
    if (inventory.length > 0) {
      const confirmReplace = window.confirm(
        'Loading sample data will add demo Nigerian shop products to your inventory. Proceed?'
      );
      if (!confirmReplace) return;
    }

    // Merge or set sample items with fresh unique IDs
    const newItems = SAMPLE_ITEMS.map(item => ({
      ...item,
      id: generateUniqueId()
    }));

    inventory = [...newItems, ...inventory];
    refreshApp(true);
    showToast('Loaded 7 sample shop products successfully!', 'success');
  }

  // =========================================================================
  // EVENT LISTENERS & DELEGATION
  // =========================================================================

  function setupEventListeners() {
    // Top Action Buttons
    dom.openAddModalBtn.addEventListener('click', () => openItemModal());
    dom.loadSampleDataBtn.addEventListener('click', loadSampleData);
    dom.emptyAddBtn.addEventListener('click', () => openItemModal());
    dom.emptySampleBtn.addEventListener('click', loadSampleData);

    // Modal Close Triggers (Add/Edit)
    dom.closeItemModalBtn.addEventListener('click', closeItemModal);
    dom.cancelItemModalBtn.addEventListener('click', closeItemModal);
    dom.itemForm.addEventListener('submit', handleItemFormSubmit);

    // Modal Close Triggers (Adjust)
    dom.closeAdjustModalBtn.addEventListener('click', closeAdjustModal);
    dom.cancelAdjustBtn.addEventListener('click', closeAdjustModal);
    dom.adjustForm.addEventListener('submit', handleAdjustFormSubmit);
    dom.modeSaleBtn.addEventListener('click', () => setAdjustMode('sale'));
    dom.modeRestockBtn.addEventListener('click', () => setAdjustMode('restock'));
    dom.adjustAmountInput.addEventListener('input', updateAdjustPreview);

    // Modal Close Triggers (Delete)
    dom.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    dom.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    dom.confirmDeleteBtn.addEventListener('click', confirmDeleteItem);

    // Close Modals on Overlay Click (outside modal dialog)
    [dom.itemModal, dom.adjustModal, dom.deleteModal].forEach(modalOverlay => {
      modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) {
          closeItemModal();
          closeAdjustModal();
          closeDeleteModal();
        }
      });
    });

    // Close Modals on Escape Key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeItemModal();
        closeAdjustModal();
        closeDeleteModal();
      }
    });

    // Search Input handling
    dom.searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      if (searchQuery.trim().length > 0) {
        dom.clearSearchBtn.style.display = 'block';
      } else {
        dom.clearSearchBtn.style.display = 'none';
      }
      renderInventoryTable();
    });

    // Clear Search Button
    dom.clearSearchBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      searchQuery = '';
      dom.clearSearchBtn.style.display = 'none';
      dom.searchInput.focus();
      renderInventoryTable();
    });

    // Filter Chips
    dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.filterChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
        currentFilter = chip.getAttribute('data-filter') || 'all';
        renderInventoryTable();
      });
    });

    // KPI Low Stock Card Click Shortcut (Quick switch to Low Stock filter)
    dom.kpiLowStockCard.addEventListener('click', () => {
      const lowFilterChip = document.querySelector('.filter-chip[data-filter="low"]');
      if (lowFilterChip) {
        lowFilterChip.click();
      }
    });

    // Sort Dropdown
    dom.sortSelect.addEventListener('change', e => {
      currentSort = e.target.value;
      renderInventoryTable();
    });

    // Reset Filters Button (when empty search/filters)
    dom.resetFiltersBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      searchQuery = '';
      dom.clearSearchBtn.style.display = 'none';
      const allFilterChip = document.querySelector('.filter-chip[data-filter="all"]');
      if (allFilterChip) {
        allFilterChip.click();
      } else {
        currentFilter = 'all';
        renderInventoryTable();
      }
    });

    // Table Event Delegation (Edit, Delete, Quick Sell, Quick Restock, Custom Adjust)
    dom.inventoryTableBody.addEventListener('click', e => {
      const targetBtn = e.target.closest('button[data-action]');
      if (!targetBtn) return;

      const action = targetBtn.getAttribute('data-action');
      const itemId = targetBtn.getAttribute('data-id');
      if (!itemId) return;

      switch (action) {
        case 'quick-sell':
          handleQuickSell(itemId);
          break;
        case 'quick-restock':
          handleQuickRestock(itemId);
          break;
        case 'custom-adjust':
          openAdjustModal(itemId);
          break;
        case 'edit':
          openItemModal(itemId);
          break;
        case 'delete':
          openDeleteModal(itemId);
          break;
      }
    });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    loadInventoryFromStorage();
    setupEventListeners();
    refreshApp(false);
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

