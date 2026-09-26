/* ==========================================================================
   THE CC COFFEE HOUSE — MASTER JAVASCRIPT CONTROLLER v5.0 (RELEASE GRADE)
   ========================================================================== */

// 1. LOCAL STORAGE PERSISTENT CART MANAGER
const CartManager = {
    freeDeliveryThreshold: 299,
    deliveryFee: 40,

    getCart() {
        return JSON.parse(localStorage.getItem('cc_coffee_cart') || '[]');
    },

    saveCart(cart) {
        localStorage.setItem('cc_coffee_cart', JSON.stringify(cart));
        this.updateBadge();
        this.renderDrawerItems();
    },

    addItem(name, price, img, category = 'coffee') {
        const cart = this.getCart();
        const existing = cart.find(item => item.name === name);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name, price: Number(price), img, category, qty: 1 });
        }

        this.saveCart(cart);
        showToast(`Added ${name} to your cart! ☕`, 'success');
    },

    updateQty(name, delta) {
        let cart = this.getCart();
        const item = cart.find(i => i.name === name);

        if (item) {
            item.qty += delta;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.name !== name);
                showToast(`Removed ${name} from cart`, 'info');
            }
        }

        this.saveCart(cart);
    },

    removeItem(name) {
        let cart = this.getCart();
        cart = cart.filter(i => i.name !== name);
        this.saveCart(cart);
        showToast(`Removed ${name} from cart`, 'info');
    },

    clearCart(notify = false) {
        localStorage.removeItem('cc_coffee_cart');
        this.updateBadge();
        this.renderDrawerItems();
        if (notify) showToast('Cart cleared', 'info');
    },

    getSubtotal() {
        return this.getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
    },

    getDeliveryFee() {
        const subtotal = this.getSubtotal();
        if (subtotal === 0 || subtotal >= this.freeDeliveryThreshold) return 0;
        return this.deliveryFee;
    },

    getTotal() {
        const subtotal = this.getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal + this.getDeliveryFee();
    },

    updateBadge() {
        const totalItems = this.getCart().reduce((sum, item) => sum + item.qty, 0);
        const badges = document.querySelectorAll('.cart-badge');

        badges.forEach(badge => {
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.style.display = 'flex';
                badge.classList.remove('badge-bump');
                void badge.offsetWidth;
                badge.classList.add('badge-bump');
            } else {
                badge.style.display = 'none';
            }
        });
    },

    renderDrawerItems() {
        const container = document.getElementById('cart-drawer-items');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (!container) return;

        const cart = this.getCart();
        const subtotal = this.getSubtotal();
        const deliveryFee = this.getDeliveryFee();
        const total = this.getTotal();

        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
        if (totalEl) totalEl.textContent = `₹${total}`;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-mug-hot"></i>
                    <p style="font-weight:700; margin-top:8px; font-size:1.05rem; color:var(--text-heading);">Your cart is currently empty</p>
                    <span style="font-size:0.86rem; color:var(--text-muted); display:block; margin:6px 0 16px;">Add freshly brewed artisan coffee or gourmet snacks!</span>
                    <a href="menu.html" class="btn-primary" style="padding:9px 24px; font-size:0.85rem;" onclick="toggleCartDrawer(false)">
                        <i class="fa-solid fa-utensils"></i> Browse Full Menu
                    </a>
                </div>
            `;
            return;
        }

        // Free Delivery Progress calculation
        const percent = Math.min(100, Math.round((subtotal / this.freeDeliveryThreshold) * 100));
        const needed = this.freeDeliveryThreshold - subtotal;
        const freeDeliveryHtml = `
            <div class="free-delivery-tracker">
                <div class="bar-label">
                    <span>${percent >= 100 ? '🎉 You unlocked FREE Delivery!' : `Add <strong style="color:var(--gold);">₹${needed}</strong> more for FREE Delivery`}</span>
                    <span style="color:var(--terracotta); font-size:0.78rem;">${percent}%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percent}%;"></div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:0.80rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Selected Items (${cart.reduce((s,i)=>s+i.qty,0)})</span>
                <button class="clear-cart-link" onclick="CartManager.clearCart(true)">
                    <i class="fa-solid fa-trash-can"></i> Clear All
                </button>
            </div>
        `;

        const itemsHtml = cart.map(item => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" onerror="this.onerror=null;this.src='images/cafe logo.jpg';" style="width:48px; height:48px; object-fit:cover; border-radius:10px; background:rgba(0,0,0,0.3);">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price * item.qty} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(₹${item.price} each)</span></div>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="CartManager.updateQty('${item.name.replace(/'/g, "\\'")}', -1)" title="Decrease">-</button>
                    <span style="font-weight:700; font-size:0.9rem; min-width:18px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="CartManager.updateQty('${item.name.replace(/'/g, "\\'")}', 1)" title="Increase">+</button>
                </div>
                <button class="cart-remove-btn" onclick="CartManager.removeItem('${item.name.replace(/'/g, "\\'")}')" title="Remove item">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = freeDeliveryHtml + itemsHtml;
    }
};

// 2. TOAST NOTIFICATION SYSTEM
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <span style="flex:1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;line-height:1;margin-left:8px;">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

// 3. CART DRAWER TOGGLE
function toggleCartDrawer(open) {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
        if (open) {
            CartManager.renderDrawerItems();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

// 4. CHECKOUT MODAL LOGIC
function openCheckoutModal() {
    const cart = CartManager.getCart();
    if (cart.length === 0) {
        showToast('Please add items to your cart before checkout!', 'error');
        return;
    }

    toggleCartDrawer(false);

    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modalTotal = document.getElementById('modal-order-total');

    if (modalOverlay) {
        if (modalTotal) modalTotal.textContent = `₹${CartManager.getTotal()}`;

        // Auto-fill logged in user
        const loggedInUser = localStorage.getItem('loggedInUser');
        const nameInput = document.getElementById('cust-name');
        if (loggedInUser && nameInput && !nameInput.value) {
            nameInput.value = loggedInUser.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCheckoutModal() {
    const modalOverlay = document.getElementById('checkout-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function processCheckoutOrder(event) {
    event.preventDefault();
    const name = document.getElementById('cust-name')?.value || 'Guest';
    const total = CartManager.getTotal();
    const orderId = 'CC-' + Math.floor(100000 + Math.random() * 900000);
    const cartItems = CartManager.getCart();

    // Save order history
    const pastOrders = JSON.parse(localStorage.getItem('cc_order_history') || '[]');
    pastOrders.unshift({
        id: orderId,
        name: name,
        items: cartItems,
        total: total,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('cc_order_history', JSON.stringify(pastOrders.slice(0, 10)));

    CartManager.clearCart();
    closeCheckoutModal();

    // Show rich Order Confirmation Receipt Modal
    showOrderReceiptModal(orderId, name, total, cartItems.length);
}

// 5. RICH ORDER RECEIPT MODAL
function showOrderReceiptModal(orderId, name, total, itemCount) {
    let receiptModal = document.getElementById('order-receipt-modal-overlay');
    if (!receiptModal) {
        receiptModal = document.createElement('div');
        receiptModal.id = 'order-receipt-modal-overlay';
        receiptModal.className = 'modal-overlay';
        document.body.appendChild(receiptModal);
    }

    receiptModal.innerHTML = `
        <div class="order-receipt-card">
            <div class="order-success-check">
                <i class="fa-solid fa-check"></i>
            </div>
            <h2 style="font-size:1.7rem; color:var(--text-heading); margin-bottom:6px;">Order Confirmed!</h2>
            <p style="font-size:0.90rem; color:var(--text-muted); margin-bottom:20px;">
                Thank you, <strong style="color:var(--terracotta);">${name}</strong>. Your artisanal brew is being freshly prepared!
            </p>

            <div class="receipt-meta-box">
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Order ID</span>
                    <strong style="color:var(--amber); letter-spacing:1px;">#${orderId}</strong>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Items Ordered</span>
                    <span>${itemCount} item(s)</span>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Estimated Time</span>
                    <span style="color:var(--matcha); font-weight:700;"><i class="fa-solid fa-clock"></i> 20–25 Minutes</span>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Status</span>
                    <span style="color:var(--gold); font-weight:700;"><i class="fa-solid fa-mug-hot"></i> Brewing with Care</span>
                </div>
                <div class="receipt-row total-row">
                    <span>Total Paid</span>
                    <span>₹${total}</span>
                </div>
            </div>

            <div style="display:flex; gap:12px; justify-content:center; margin-top:24px;">
                <button class="btn-primary" onclick="closeOrderReceiptModal()" style="width:100%; padding:13px;">
                    <i class="fa-solid fa-check"></i> Got It, Thanks!
                </button>
            </div>
        </div>
    `;

    receiptModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOrderReceiptModal() {
    const receiptModal = document.getElementById('order-receipt-modal-overlay');
    if (receiptModal) {
        receiptModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// 6. IMAGE LIGHTBOX MODAL
function openLightbox(src) {
    let lb = document.getElementById('image-lightbox-modal');
    if (!lb) {
        injectFloatingElements();
        lb = document.getElementById('image-lightbox-modal');
    }
    const img = document.getElementById('lightbox-img');
    if (img && lb) {
        img.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lb = document.getElementById('image-lightbox-modal');
    if (lb) {
        lb.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// 7. INJECT FLOATING ELEMENTS (Back-to-top, WhatsApp, Lightbox, Favicon)
function injectFloatingElements() {
    // Favicon injection
    if (!document.querySelector("link[rel*='icon']")) {
        const link = document.createElement('link');
        link.type = 'image/jpeg';
        link.rel = 'shortcut icon';
        link.href = 'images/cafe logo.jpg';
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    // Floating Cluster (WhatsApp + Back to top)
    if (!document.getElementById('floating-actions-container')) {
        const container = document.createElement('div');
        container.id = 'floating-actions-container';
        container.className = 'floating-action-cluster-right';
        container.innerHTML = `
            <button class="back-to-top-btn" id="back-to-top-btn" title="Back to Top" onclick="window.scrollTo({top:0,behavior:'smooth'})">
                <i class="fa-solid fa-arrow-up"></i>
            </button>
            <a href="https://wa.me/?text=Hello%20CC%20Coffee%20House,%20I%20would%20like%20to%20inquire%20about%20ordering!" target="_blank" class="floating-whatsapp-btn" title="Order on WhatsApp">
                <i class="fa-brands fa-whatsapp" style="font-size:1.15rem;"></i>
                <span>Order via WhatsApp</span>
            </a>
        `;
        document.body.appendChild(container);
    }

    // Lightbox modal container
    if (!document.getElementById('image-lightbox-modal')) {
        const lb = document.createElement('div');
        lb.id = 'image-lightbox-modal';
        lb.className = 'lightbox-overlay';
        lb.onclick = (e) => {
            if (e.target === lb || e.target.classList.contains('lightbox-close')) closeLightbox();
        };
        lb.innerHTML = `
            <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
            <img src="" alt="Gallery Preview" class="lightbox-img" id="lightbox-img">
        `;
        document.body.appendChild(lb);
    }
}

// 8. LIFECYCLE HOOKS & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    // Inject floating elements
    injectFloatingElements();

    // Preloader auto-hide
    const preloader = document.getElementById('page-preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hidden'), 900);
    }

    // Badge bob pulse
    const badge = document.querySelector('.badge-tag');
    if (badge) {
        setTimeout(() => badge.classList.add('entrance-done'), 2000);
    }

    // Initialize cart badge
    CartManager.updateBadge();

    // Scroll listener for Navbar & Back-to-Top
    const navbar = document.querySelector('.navbar-header');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 40) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }

        if (scrollY > 320) {
            backToTopBtn?.classList.add('visible');
        } else {
            backToTopBtn?.classList.remove('visible');
        }
    });

    // Mobile Navbar Toggle & Outside Click
    const menuBtn = document.getElementById('menu-toggle-btn');
    const navLinks = document.getElementById('nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (navLinks && navLinks.classList.contains('show')) {
            if (!navLinks.contains(e.target) && e.target !== menuBtn && !menuBtn?.contains(e.target)) {
                navLinks.classList.remove('show');
            }
        }
        if (e.target.closest('.nav-link-item') && navLinks) {
            navLinks.classList.remove('show');
        }
    });

    // 3D Tilt Effect on Cards
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -7;
            const rotateY = ((x - centerX) / centerX) * 7;

            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
        });
    });

    // Header Auth User Check
    const loggedInUser = localStorage.getItem('loggedInUser');
    const authBtnContainer = document.getElementById('header-auth-btn');

    if (loggedInUser && authBtnContainer) {
        const displayName = loggedInUser.split('@')[0].replace(/[._-]/g, ' ');
        authBtnContainer.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.85rem; color:var(--terracotta); font-weight:700; text-transform:capitalize;">Hi, ${displayName}</span>
                <button onclick="handleLogout()" class="btn-secondary" style="padding: 6px 14px; font-size:0.8rem;" title="Logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    }

    // Global Add-to-Cart tactile click listener
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-cart-btn');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.classList.add('btn-added');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
            setTimeout(() => {
                btn.classList.remove('btn-added');
                btn.innerHTML = originalHTML;
            }, 1200);
        }

        // Gallery Card Lightbox Trigger
        const galleryCard = e.target.closest('.gallery-card');
        if (galleryCard) {
            const img = galleryCard.querySelector('img');
            if (img && img.src) {
                openLightbox(img.src);
            }
        }
    });

    // Broken image safety fallback
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            if (!this.getAttribute('data-fallback-tried')) {
                this.setAttribute('data-fallback-tried', 'true');
                this.src = 'images/cafe logo.jpg';
            }
        });
    });
});

function handleLogout() {
    localStorage.removeItem('loggedInUser');
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 600);
}
