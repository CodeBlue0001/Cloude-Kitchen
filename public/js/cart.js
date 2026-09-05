// Client-side Cart State Manager for Cloud Kitchen
let cart = JSON.parse(localStorage.getItem('cloud_kitchen_cart')) || [];
let appliedCoupon = null;

// Initialize Cart on Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    setupEventListeners();
});

function saveCart() {
    localStorage.setItem('cloud_kitchen_cart', JSON.stringify(cart));
    updateCartUI();
}

// Add Item to Cart
function addToCart(foodId, name, price, image) {
    price = parseFloat(price);
    const existingIndex = cart.findIndex(item => item.name === name);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            foodId: foodId || null,
            name: name,
            price: price,
            image: image || '/images/biriyani.jpeg',
            quantity: 1
        });
    }

    saveCart();
    showToast(`Added "${name}" to cart! 🛒`);
    openCart();
}

// Update Item Quantity
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

// Remove Single Item
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

// Clear Entire Cart
function clearCart() {
    cart = [];
    appliedCoupon = null;
    saveCart();
}

// Update Cart Drawer UI & Counter Badges
function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const drawerList = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const deliveryEl = document.getElementById('cart-delivery');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.innerText = totalCount;

    if (!drawerList) return;

    if (cart.length === 0) {
        drawerList.innerHTML = `
            <div class="cart-empty">
                <span style="font-size: 3rem;">🍽️</span>
                <p style="margin-top: 1rem; font-weight: 600;">Your kitchen cart is hungry!</p>
                <p style="font-size: 0.85rem; color: #64748B;">Add delicious dishes from our menu to start ordering.</p>
            </div>
        `;
        if (subtotalEl) subtotalEl.innerText = '₹0';
        if (discountEl) discountEl.innerText = '₹0';
        if (deliveryEl) deliveryEl.innerText = '₹0';
        if (taxEl) taxEl.innerText = '₹0';
        if (totalEl) totalEl.innerText = '₹0';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    // Render Cart Items
    drawerList.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" alt="${item.name}" onerror="this.src='/images/biriyani.jpeg'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">₹${item.price} each</div>
                <div class="qty-control" style="width: fit-content; margin-top: 0.4rem;">
                    <button class="qty-btn" onclick="updateQuantity(${idx}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${idx}, 1)">+</button>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 800; font-size: 1rem;">₹${item.price * item.quantity}</div>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#EF4444; font-size:0.8rem; cursor:pointer; margin-top:0.4rem;">Remove</button>
            </div>
        </div>
    `).join('');

    // Calculate Bill
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (appliedCoupon === 'COLLEGE50' && subtotal >= 150) {
        discount = 50;
    } else if (appliedCoupon === 'WELCOME20') {
        discount = Math.round(subtotal * 0.20);
    } else if (appliedCoupon === 'FREEDEL') {
        discount = 30;
    }

    const deliveryFee = subtotal >= 300 ? 0 : 30;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.05); // 5% GST
    const grandTotal = Math.max(0, taxableAmount + deliveryFee + tax);

    if (subtotalEl) subtotalEl.innerText = `₹${subtotal}`;
    if (discountEl) discountEl.innerText = `-₹${discount}`;
    if (deliveryEl) deliveryEl.innerText = deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`;
    if (taxEl) taxEl.innerText = `₹${tax}`;
    if (totalEl) totalEl.innerText = `₹${grandTotal}`;
}

// Apply Promo Coupon
function applyCoupon() {
    const input = document.getElementById('coupon-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (code === 'COLLEGE50' || code === 'WELCOME20' || code === 'FREEDEL') {
        appliedCoupon = code;
        showToast(`Promo code "${code}" applied successfully! 🎉`);
        updateCartUI();
    } else {
        showToast(`Invalid coupon code. Try COLLEGE50 or WELCOME20`);
    }
}

// Open / Close Cart Drawer
function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
        overlay.classList.add('active');
        drawer.classList.add('active');
    }
}

function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
        overlay.classList.remove('active');
        drawer.classList.remove('active');
    }
}

// Open Checkout Modal
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }

    // Check if user is logged in
    fetch('/api/check-login')
        .then(res => res.json())
        .then(data => {
            if (!data.loggedIn) {
                showToast('Please login to place your order.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1200);
                return;
            }

            closeCart();
            const modal = document.getElementById('checkoutModal');
            if (modal) {
                // Populate default address if available
                if (data.user && data.user.address) {
                    const addressField = document.getElementById('checkout-address');
                    if (addressField && !addressField.value) {
                        addressField.value = data.user.address;
                    }
                }
                modal.style.display = 'flex';
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Authentication check failed. Please refresh.');
        });
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
}

// Place Order Request
async function submitOrder() {
    const address = document.getElementById('checkout-address')?.value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';
    const notes = document.getElementById('checkout-notes')?.value.trim() || '';

    if (!address) {
        showToast('Please enter your delivery address!');
        return;
    }

    const orderBtn = document.getElementById('submit-order-btn');
    if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.innerText = 'Placing Order... 🍳';
    }

    try {
        const response = await fetch('/api/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                deliveryAddress: address,
                paymentMethod: paymentMethod,
                couponCode: appliedCoupon,
                orderNotes: notes
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            clearCart();
            closeCheckoutModal();
            // Show Success Notification & Redirect to Order Tracking
            showToast('Order Placed Successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = `/track-order/${result.orderId}`;
            }, 1200);
        } else {
            showToast(result.message || 'Failed to place order.');
            if (orderBtn) {
                orderBtn.disabled = false;
                orderBtn.innerText = 'Confirm & Place Order';
            }
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showToast('Connection error. Please try again.');
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.innerText = 'Confirm & Place Order';
        }
    }
}

// Toast notification helper
function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.position = 'fixed';
        toast.style.bottom = '25px';
        toast.style.right = '25px';
        toast.style.background = '#1E293B';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
        toast.style.zIndex = '9999';
        toast.style.fontWeight = '600';
        toast.style.fontSize = '0.95rem';
        toast.style.transition = 'all 0.3s ease';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2500);
}

function setupEventListeners() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeCart);
    }
}
