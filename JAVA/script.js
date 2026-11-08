// ===== EMAIL HELPERS (used by the account code below) =====
// Gmail ignores dots and anything after a "+", so those count as the same address
function normalizeEmail(email) {
    const e = String(email || '').trim().toLowerCase();
    const parts = e.split('@');
    if (parts.length !== 2) return e;
    const local = parts[0];
    const domain = parts[1];
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        return local.split('+')[0].replace(/\./g, '') + '@gmail.com';
    }
    return e;
}

// Is this email already used by a saved account?
function emailTaken(email) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem('accounts')) || []; } catch (e) {}
    const n = normalizeEmail(email);
    return list.some(a => normalizeEmail(a.email) === n);
}

// ===== CART BADGE: counts every item in the cart (a line with quantity 3 counts as 3) =====
function updateCartBadge() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('cart')) || []; } catch (e) {}
    const count = cart.reduce((sum, p) => sum + Math.max(1, parseInt(p.quantity) || 1), 0);

    // Find the badge. Some pages have no id on it, or just plain text next to the cart icon.
    let el = document.getElementById('cart-count') || document.querySelector('.cart-count');
    if (!el) {
        const link = document.querySelector('.main-navigation a[href$="cart.html"]');
        if (link) {
            Array.from(link.childNodes).forEach(n => {
                if (n.nodeType === 3 && /^\s*\d+\s*$/.test(n.textContent)) n.remove();
            });
            el = link.querySelector('span');
            if (!el) {
                el = document.createElement('span');
                link.appendChild(el);
            }
            el.id = 'cart-count';
        }
    }
    if (el) el.textContent = count;
}

// The cart page has its own updateCartCount(); make it use this one too
window.updateCartCount = updateCartBadge;
if (typeof window.loadCart === 'function') {
    const originalLoadCart = window.loadCart;
    window.loadCart = function () {
        originalLoadCart.apply(this, arguments);
        updateCartBadge();
    };
}

document.addEventListener("DOMContentLoaded", () => {
    // Function to update cart count
    function updateCartCount() {
        updateCartBadge();
    }

    updateCartCount();

    // Make the whole product card open its detail page
    const grid = document.querySelector('.product-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            if (e.target.closest('.delete-product')) return;
            const card = e.target.closest('.product');
            const link = card && card.querySelector('a');
            if (link && link.getAttribute('href') !== '#') {
                window.location.href = link.href;
            }
        });
    }

    // Replace the Additionals dropdown with checkboxes (runs on every page that has it)
    const addonList = [
        ['Egg Drop', 20], ['Egg Mix', 20], ['Boiled Egg', 25], ['Fried Egg', 25],
        ['Rice', 25], ['Kimchi', 20], ['Radish', 20], ['Cheese', 35]
    ];

    document.querySelectorAll('select').forEach(sel => {
        const isAdditionals = Array.from(sel.options).some(o => o.text.includes('Egg Drop'));
        if (!isAdditionals) return;

        const group = document.createElement('div');
        group.id = 'additionals';
        group.className = 'additionals-group';
        group.innerHTML = addonList.map(([name, price]) => `
            <label>
                <input type="checkbox" name="additional" value="${name}" data-price="${price}">
                ${name} +₱${price}
            </label>`).join('');

        sel.replaceWith(group);
    });

    // Previous / Next arrows between product detail pages
    const menuOrder = [
        'shin-ramyun.html',
        'Jin-Ramen-Mild.html',
        'Jin-Ramen-spicy.html',
        'Cheese-Ramen.html',
        'Kimchi-Ramen.html',
        'TteokBokki.html',
        'Cheese-TteokBokki.html',
        'Regular-Kimbap.html',
        'Egg-kimbap.html',
        'kimchi-kimbap.html',
        'Tuna-kimbap.html',
        'rice.html',
        'kimchi-fried-rice.html'
    ];

    const currentPageName = window.location.pathname.split('/').pop().toLowerCase();
    const pageIndex = menuOrder.findIndex(page => page.toLowerCase() === currentPageName);

    if (pageIndex !== -1) {
        let prevLink = document.getElementById('prevProduct');
        let nextLink = document.getElementById('nextProduct');

        if (!prevLink) {
            prevLink = document.createElement('a');
            prevLink.id = 'prevProduct';
            prevLink.className = 'side-arrow left';
            prevLink.title = 'Previous product';
            prevLink.innerHTML = '&#10094;';
            document.body.appendChild(prevLink);
        }
        if (!nextLink) {
            nextLink = document.createElement('a');
            nextLink.id = 'nextProduct';
            nextLink.className = 'side-arrow right';
            nextLink.title = 'Next product';
            nextLink.innerHTML = '&#10095;';
            document.body.appendChild(nextLink);
        }

        prevLink.href = menuOrder[(pageIndex - 1 + menuOrder.length) % menuOrder.length];
        nextLink.href = menuOrder[(pageIndex + 1) % menuOrder.length];
    }

    // Navigation functionality
    const navLinks = document.querySelectorAll(".main-navigation ul li a");
    const currentPage = window.location.pathname.split("/").pop();

    navLinks.forEach(link => {
        const linkPage = link.getAttribute("href").split("/").pop();
        link.classList.toggle("active", linkPage === currentPage);

        link.addEventListener("click", () => {
            navLinks.forEach(nav => nav.classList.remove("active"));
            link.classList.add("active");
        });
    });

    // Category and price range toggle functionality
    document.querySelectorAll(".toggle-button").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            toggleVisibility(targetId, button);
        });
    });

    // Price Range Handling
    const priceRange = document.getElementById('price-range');
    const priceLabels = document.querySelectorAll('.price-values span');
    const products = document.querySelectorAll('.product');

    if (priceRange && priceLabels.length && products.length) {
        products.forEach(product => product.style.display = "");

        function updatePriceLabels() {
            const maxPrice = parseFloat(priceRange.value);
            priceLabels[0].textContent = `₱${maxPrice.toFixed(2)}`;
            filterProducts(maxPrice);
        }

        function filterProducts(maxPrice) {
            products.forEach(product => {
                const productPrice = parseFloat(product.getAttribute('data-price'));
                product.style.display = productPrice <= maxPrice ? "" : "none";
            });
        }

        const initialMaxPrice = parseFloat(priceRange.value);
        priceLabels[0].textContent = `₱${initialMaxPrice.toFixed(2)}`;

        priceRange.addEventListener('input', updatePriceLabels);
    }

    // Add to cart (shop-page cards only; detail pages are handled below)
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const product = button.closest('.product');
            if (!product) return;
            const { name, description, price, image } = product.dataset;
            addToCart(name, description, parseFloat(price), image);
        });
    });

    function addToCart(name, description, price, image) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart.push({ name, description, price, image });
            localStorage.setItem('cart', JSON.stringify(cart));
            alert(`${name} has been added to your cart!`);
            updateCartCount();
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortProducts(sortSelect.value);
        });
    }

    function sortProducts(option) {
        const productGrid = document.querySelector('.product-grid');
        const productArray = Array.from(productGrid.children);

        productArray.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price'));
            const priceB = parseFloat(b.getAttribute('data-price'));

            if (option === 'low-to-high') return priceA - priceB;
            if (option === 'high-to-low') return priceB - priceA;
            return 0;
        });

        productArray.forEach(product => productGrid.appendChild(product));
    }

    // Load cart and display items
    function loadCart() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cart.length ?
                cart.map((product, index) => `
                    <div class="product">
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <button class="remove-from-cart" data-index="${index}">Remove from Cart</button>
                    </div>
                `).join('') :
                '<p>Your cart is empty.</p>';

            document.querySelectorAll('.remove-from-cart').forEach(button => {
                button.addEventListener('click', () => {
                    const index = button.getAttribute('data-index');
                    removeFromCart(index);
                });
            });
        }
    }

    function removeFromCart(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        updateCartCount();
        alert('Item removed from your cart.');
    }

    function clearCart() {
        localStorage.removeItem('cart');
        loadCart();
        updateCartCount();
        alert('Your cart has been cleared.');
    }

    // Login form validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            alert(username && password ? 'Login successful!' : 'Please enter both username and password.');
        });
    }

    // Create account form validation
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            const firstName = document.getElementById("firstName").value;
            const lastName = document.getElementById("lastName").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;

            if (!firstName || !lastName || !email || !phone) {
                alert("Please fill out all required fields.");
                event.preventDefault();
            }
        });
    }

    // ===== PRODUCT DETAIL PAGE: no delivery option; Add to Cart opens a customize pop-up =====
    (function setupDetailPage() {
        const titleEl = document.querySelector('.product-title');
        const priceEl = document.querySelector('.price');
        const oldAddBtn = document.querySelector('.action-buttons .add-to-cart');
        if (!titleEl || !priceEl || !oldAddBtn) return;

        document.querySelectorAll('.buy-now').forEach(b => b.remove());

        const COOK_FEE = 20;
        const COOKED_TEXT = 'Cooked - ₱20';
        const UNCOOKED_TEXT = 'Uncooked - ₱0';

        // Remember the add-on list, then take the section off the page
        const addons = Array.from(document.querySelectorAll('input[name="additional"]'))
            .map(b => ({ name: b.value, price: parseFloat(b.dataset.price) }));
        const group = document.querySelector('.additionals-group');
        if (group) {
            const holder = group.closest('.summary-item') || group.parentElement;
            holder.remove();
        }

        // Delivery option: remember if this product can be cooked, then remove it from the page
        let cookOpt = false;
        const deliverySelect = document.querySelector('.product-page select');
        if (deliverySelect) {
            cookOpt = Array.from(deliverySelect.options).some(o => /cooked/i.test(o.text));

            let holder = deliverySelect.closest('.summary-item, .delivery-option, .form-group');
            if (holder && (holder.contains(oldAddBtn) || holder.querySelector('input'))) holder = null;
            if (holder) {
                holder.remove();
            } else {
                const prev = deliverySelect.previousElementSibling;
                if (prev && prev.tagName !== 'SELECT' && /delivery/i.test(prev.textContent)) prev.remove();
                deliverySelect.remove();
            }
        }

        function fresh(el) {
            const c = el.cloneNode(true);
            c.removeAttribute('onclick');
            el.replaceWith(c);
            return c;
        }

        const addBtn = fresh(oldAddBtn);

        const oldQty = Array.from(document.querySelectorAll('input'))
            .find(i => i.type !== 'checkbox' && i.type !== 'hidden');
        if (!oldQty) return;
        const qtyBox = oldQty.closest('.summary-item, .quantity-section') || oldQty.parentElement;
        const btns = Array.from(qtyBox.querySelectorAll('button')).map(fresh);
        const qtyInput = fresh(oldQty);
        const minusBtn = btns[0];
        const plusBtn = btns[btns.length - 1];
        minusBtn.type = plusBtn.type = 'button';

        // Quantity row: [-] [number] [+] in ONE line, same height.
        // Only these three go into the new row, so the "Quantity:" label above stays where it was.
        const SIZE = '36px';
        const qtyRow = document.createElement('div');
        qtyRow.style.cssText = 'display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:6px;width:100%;margin:6px 0 0;';
        minusBtn.parentNode.insertBefore(qtyRow, minusBtn);
        qtyRow.append(minusBtn, qtyInput, plusBtn);

        qtyInput.style.setProperty('width', '64px', 'important');
        qtyInput.style.setProperty('min-width', '64px', 'important');
        qtyInput.style.setProperty('height', SIZE, 'important');
        qtyInput.style.setProperty('padding', '0', 'important');
        qtyInput.style.setProperty('margin', '0', 'important');
        qtyInput.style.setProperty('box-sizing', 'border-box', 'important');
        qtyInput.style.setProperty('text-align', 'center', 'important');
        qtyInput.style.setProperty('font-size', '18px', 'important');
        qtyInput.style.setProperty('font-weight', 'bold', 'important');
        qtyInput.style.setProperty('line-height', SIZE, 'important');
        qtyInput.style.setProperty('border', '1px solid #ccc', 'important');
        qtyInput.style.setProperty('border-radius', '6px', 'important');
        qtyInput.style.setProperty('-moz-appearance', 'textfield', 'important');
        qtyInput.style.setProperty('appearance', 'textfield', 'important');

        [minusBtn, plusBtn].forEach(b => {
            b.style.setProperty('display', 'flex', 'important');
            b.style.setProperty('align-items', 'center', 'important');
            b.style.setProperty('justify-content', 'center', 'important');
            b.style.setProperty('width', SIZE, 'important');
            b.style.setProperty('min-width', SIZE, 'important');
            b.style.setProperty('height', SIZE, 'important');
            b.style.setProperty('padding', '0', 'important');
            b.style.setProperty('margin', '0', 'important');
            b.style.setProperty('box-sizing', 'border-box', 'important');
            b.style.setProperty('font-size', '18px', 'important');
            b.style.setProperty('font-weight', 'bold', 'important');
            b.style.setProperty('line-height', '1', 'important');
            b.style.setProperty('cursor', 'pointer', 'important');
        });

        const basePrice = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
        const fmt = n => '₱' + n.toFixed(2);
        const getQty = () => Math.max(1, Math.min(20, parseInt(qtyInput.value) || 1));

        function updatePrice() { priceEl.textContent = fmt(basePrice * getQty()); }

        minusBtn.addEventListener('click', () => { qtyInput.value = Math.max(1, getQty() - 1); updatePrice(); });
        plusBtn.addEventListener('click', () => { qtyInput.value = Math.min(20, getQty() + 1); updatePrice(); });
        qtyInput.addEventListener('input', updatePrice);
        qtyInput.addEventListener('change', () => { qtyInput.value = getQty(); updatePrice(); });
        updatePrice();

        // Price of one item
        const unitCost = u =>
            basePrice
            + (cookOpt && u.cooked ? COOK_FEE : 0)
            + ((!cookOpt || u.cooked) ? u.extras.reduce((s, e) => s + e.price, 0) : 0);

        // Put ONE line in the cart, with the choices for every item
        function pushToCart(units) {
            const name = titleEl.textContent.trim();
            const descEl = document.querySelector('.product-description');
            const desc = descEl ? descEl.textContent.trim() : '';
            const imgEl = document.querySelector('.thumbnails img') || document.querySelector('.image-container img');
            const image = imgEl ? imgEl.getAttribute('src') : '';

            const counted = u => (!cookOpt || u.cooked) ? u.extras : [];
            const all = units.flatMap(counted);
            const total = units.reduce((s, u) => s + unitCost(u), 0);

            let deliveryOption = '';
            if (cookOpt) {
                const c = units.filter(u => u.cooked).length;
                const n = units.length - c;
                deliveryOption = !n ? COOKED_TEXT : (!c ? UNCOOKED_TEXT : `${c} Cooked, ${n} Uncooked`);
            }

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart.push({
                name,
                description: desc,
                price: total / units.length,
                basePrice,
                image,
                quantity: units.length,
                units,
                extras: all,
                additionals: all.map(e => e.name).join(', '),
                deliveryOption
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            alert(`${units.length} × ${name} added to your cart!`);

            qtyInput.value = 1;
            updatePrice();
        }

        // Style for the pop-up (same look as the Change order pop-up in the cart)
        if (!document.getElementById('cz-style')) {
            const st = document.createElement('style');
            st.id = 'cz-style';
            st.textContent = `
                .cz-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55);
                    display: flex; align-items: center; justify-content: center; z-index: 9999; }
                .cz-modal { background: #fff; border-radius: 10px; padding: 20px 24px; width: 92%;
                    max-width: 580px; box-shadow: 0 8px 24px rgba(0,0,0,.3); font-family: Arial, sans-serif; }
                .cz-modal h3 { margin: 0 0 4px; color: #a31b00; }
                .cz-hint { margin: 0 0 12px; color: #666; font-size: 13px; }
                .cz-body { max-height: 60vh; overflow-y: auto; padding-right: 4px; }
                .cz-block { padding: 10px 0 14px; border-bottom: 1px solid #e5e5e5; }
                .cz-block:last-child { border-bottom: none; }
                .cz-head { margin-bottom: 8px; }
                .cz-head strong { font-size: 16px; }
                .cz-cook { display: flex; gap: 8px; margin: 0 0 10px; }
                .cz-cook label { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 8px 12px; background: #fafafa; border: 1px solid #ddd; border-radius: 10px;
                    font-weight: bold; cursor: pointer; }
                .cz-extras { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .cz-extras label { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
                    background: #fafafa; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; cursor: pointer; }
                .cz-extras label:hover, .cz-cook label:hover { background: #f1f1f1; }
                .cz-extras label:has(input:checked), .cz-cook label:has(input:checked) {
                    border-color: #a31b00; background: #fff3f0; }
                .cz-extras input, .cz-cook input { width: 16px; height: 16px; margin: 0; flex-shrink: 0; accent-color: #a31b00; }
                .cz-footer { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 14px; }
                .cz-total { margin-right: auto; }
                .cz-footer button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
                .cz-cancel { background: #ddd; color: #000; }
                .cz-confirm { background: #a31b00; color: #fff; }
                @media (max-width: 480px) { .cz-extras { grid-template-columns: 1fr; } }
            `;
            document.head.appendChild(st);
        }

        // Pop-up: one section per item (quantity 2 or more gets separate sections)
        function openCustomizeModal(qty) {
            const multi = qty > 1;
            const overlay = document.createElement('div');
            overlay.className = 'cz-overlay';
            overlay.innerHTML = `
                <div class="cz-modal">
                    <h3>${titleEl.textContent.trim()}</h3>
                    <p class="cz-hint">${multi
                        ? 'Set each item on its own.'
                        : (cookOpt ? 'Choose cooked or uncooked, then tick the additionals.'
                                   : 'Tick the additionals you want.')}</p>
                    <div class="cz-body">
                        ${Array.from({ length: qty }, (_, i) => `
                            <div class="cz-block">
                                ${multi ? `
                                    <div class="cz-head">
                                        <strong>Item ${i + 1} of ${qty}</strong>
                                    </div>` : ''}
                                ${cookOpt ? `
                                    <div class="cz-cook">
                                        <label><input type="radio" name="cz-cook-${i}" value="cooked" checked> Cooked +${fmt(COOK_FEE).replace('.00', '')}</label>
                                        <label><input type="radio" name="cz-cook-${i}" value="uncooked"> Uncooked</label>
                                    </div>` : ''}
                                <div class="cz-extras">
                                    ${addons.map(a => `
                                        <label>
                                            <input type="checkbox" value="${a.name}" data-price="${a.price}">
                                            ${a.name} +${fmt(a.price)}
                                        </label>`).join('')}
                                </div>
                            </div>`).join('')}
                    </div>
                    <div class="cz-footer">
                        <span class="cz-total"></span>
                        <button type="button" class="cz-cancel">Cancel</button>
                        <button type="button" class="cz-confirm">Add to Cart</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            const blocks = Array.from(overlay.querySelectorAll('.cz-block'));
            const totalEl = overlay.querySelector('.cz-total');

            const readUnit = block => {
                const cookedRadio = block.querySelector('input[type="radio"][value="cooked"]');
                const cooked = cookedRadio ? cookedRadio.checked : true;
                const extras = Array.from(block.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(b => ({ name: b.value, price: parseFloat(b.dataset.price) }));
                return { cooked, extras };
            };

            const refresh = () => {
                let total = 0;
                blocks.forEach(block => {
                    const u = readUnit(block);
                    block.querySelector('.cz-extras').style.display = (!cookOpt || u.cooked) ? '' : 'none';
                    total += unitCost(u);
                });
                totalEl.textContent = 'Total: ' + fmt(total);
            };

            overlay.addEventListener('change', refresh);
            refresh();

            overlay.querySelector('.cz-cancel').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            overlay.querySelector('.cz-confirm').addEventListener('click', () => {
                const units = blocks.map(readUnit);
                overlay.remove();
                pushToCart(units);
            });
        }

        addBtn.addEventListener('click', () => {
            const qty = getQty();
            if (cookOpt || addons.length) {
                openCustomizeModal(qty);
            } else {
                pushToCart(Array.from({ length: qty }, () => ({ cooked: true, extras: [] })));
            }
        });
    })();
});

// Function to toggle visibility
function toggleVisibility(targetId, button) {
    const target = document.getElementById(targetId);
    if (target) {
        const isVisible = target.style.display === "block";
        target.style.display = isVisible ? "none" : "block";
        if (button) button.textContent = isVisible ? "+" : "-";
    }
}

// ===== PRODUCT PAGE: two-image gallery for every product (one go) =====
document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".product-page .image-container");
    if (!container) return; // only runs on product detail pages

    const IMG = "../IMAGES/drive img/";

    // [main image, second image] for each product page
    const galleries = {
        "shin-ramyun.html":        ["Shin-Ramyun.png", "Ramyun.jpg"],
        "jin-ramen-mild.html":     ["Jin-Ramen-Mild.png", "Jinramen.jpg"],
        "jin-ramen-spicy.html":    ["Jin-Ramen-spicy (1).png", "jinramenspicy.jpg"],
        "cheese-ramen.html":       ["Cheese-Ramen.png", "cheeseramen.jpg"],
        "kimchi-ramen.html":       ["Kimchi-Ramen.png", "kimchiramen.jpg"],
        "tteokbokki.html":         ["TteokBokki.png", "Tteokbokki.jpg"],
        "cheese-tteokbokki.html":  ["Cheese-Tteokbokki.png", "Cheese-Tteokbokki.jpg"],
        "regular-kimbap.html":     ["Regular-Kimbap.png", "Regluar-Kimbap.jpg"],
        "egg-kimbap.html":         ["Egg kimbap.png", "Egg-Kimbap.jpg"],
        "kimchi-kimbap.html":      ["kimchi-kimbap.png", "Kimchi-Kimbap.jpg"],
        "tuna-kimbap.html":        ["Tuna-Kimbap.png", "Tuna-Kimbap.jpg"],
        "rice.html":               ["rice.png", "Rice.jpg"],
        "kimchi-fried-rice.html":  ["kimchi-fried-rice.png", "Kimchi-Fried-Rice.jpg"]
    };

    const page = decodeURIComponent(window.location.pathname.split("/").pop()).toLowerCase();
    const files = galleries[page];
    if (!files) return;

    // Make sure there is a main image
    let main = document.getElementById("main-image");
    if (!main) {
        main = container.querySelector("img") || document.createElement("img");
        main.id = "main-image";
        if (!main.parentElement) container.prepend(main);
    }
    main.src = IMG + files[0];

    // Rebuild the thumbnail strip
    const old = container.querySelector(".thumbnails");
    if (old) old.remove();
    const strip = document.createElement("div");
    strip.className = "thumbnails";

    files.forEach((file, i) => {
        const t = document.createElement("img");
        t.src = IMG + file;
        t.alt = "Thumbnail " + (i + 1);
        if (i === 0) t.classList.add("active");
        t.addEventListener("click", () => {
            main.style.opacity = "0";
            setTimeout(() => {
                main.src = IMG + file;
                main.style.opacity = "1";
            }, 150);
            strip.querySelectorAll("img").forEach(el => el.classList.remove("active"));
            t.classList.add("active");
        });
        strip.appendChild(t);
    });
    container.appendChild(strip);

    // Small style for the fade and the selected thumbnail
    const style = document.createElement("style");
    style.textContent = `
        #main-image { transition: opacity 0.15s ease; }
        .thumbnails img.active { border: 2px solid #a31b00; }
    `;
    document.head.appendChild(style);
});

// Product pages have no cart list, so skip the leftover inline loadCart()
if (document.querySelector(".product-page")) {
    window.loadCart = function () {};
}

// ===== AUTO-SLIDE between the two product images =====
document.addEventListener("DOMContentLoaded", () => {
    const main = document.getElementById("main-image");
    const container = document.querySelector(".product-page .image-container");
    const thumbs = Array.from(document.querySelectorAll(".product-page .thumbnails img"));
    if (!main || !container || thumbs.length < 2) return;

    const DELAY = 3500; // 3.5 seconds (change to 3000 or 4000 if you like)
    let current = 0;
    let timer = null;

    main.style.transition = "opacity 0.3s ease";

    function show(i) {
        current = i;
        main.style.opacity = "0";
        setTimeout(() => {
            main.src = thumbs[i].getAttribute("src");
            main.style.opacity = "1";
        }, 300);
        thumbs.forEach((t, k) => t.classList.toggle("active", k === i));
    }

    function stop() { clearInterval(timer); }
    function start() {
        stop();
        timer = setInterval(() => show((current + 1) % thumbs.length), DELAY);
    }

    // Clicking a thumbnail still works; the slideshow carries on from there
    thumbs.forEach((t, i) => t.addEventListener("click", () => { current = i; start(); }));

    // Pause while the mouse is over the images
    container.addEventListener("mouseenter", stop);
    container.addEventListener("mouseleave", start);

    start();
});

// ===== ACCOUNT REQUIRED BEFORE ADD TO CART =====
(function () {
    const inSub = window.location.pathname.includes("/clickableItems/");
    const HTML_DIR = inSub ? "../HTML/" : "";
    const LOGIN_PAGE = HTML_DIR + "signup.html";
    const CREATE_PAGE = HTML_DIR + "createAccount.html";

    // Passwords must have at least this many characters
    const MIN_PASSWORD = 8;

    const getAccounts = () => {
        try { return JSON.parse(localStorage.getItem("accounts")) || []; }
        catch (e) { return []; }
    };
    const isLoggedIn = () => !!localStorage.getItem("currentUser");

    // ----- Each account has its own saved cart -----
    const userCartKey = name => "cart_" + String(name).toLowerCase();

    // Put the account's saved cart on screen (called when signing in)
    function loadUserCart(name) {
        localStorage.setItem("cart", localStorage.getItem(userCartKey(name)) || "[]");
        localStorage.removeItem("checkoutData");
    }

    // Save the cart under the account, then empty it (called when signing out)
    function saveAndClearCart(name) {
        const current = localStorage.getItem("cart");
        if (current) localStorage.setItem(userCartKey(name), current);
        localStorage.removeItem("cart");
        localStorage.removeItem("checkoutData");
    }

    // Nobody is signed in, so there should be no cart showing
    if (!isLoggedIn()) {
        localStorage.removeItem("cart");
        localStorage.removeItem("checkoutData");
    }

    function goBackAfterLogin() {
        const back = sessionStorage.getItem("returnTo");
        sessionStorage.removeItem("returnTo");
        window.location.href = back || "products.html";
    }

    // Pop-up that tells the visitor to make an account first
    function showLoginRequired() {
        if (document.querySelector(".login-required-overlay")) return;
        sessionStorage.setItem("returnTo", window.location.href);

        const overlay = document.createElement("div");
        overlay.className = "login-required-overlay";
        overlay.innerHTML = `
            <div class="login-required-box">
                <h3>Account needed</h3>
                <p>You need an account before you can add items to your cart.
                   Please sign in or create an account first.</p>
                <div class="login-required-buttons">
                    <a href="${LOGIN_PAGE}" class="lr-signin">Sign In</a>
                    <a href="${CREATE_PAGE}" class="lr-create">Create Account</a>
                    <button type="button" class="lr-close">Close</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector(".lr-close").addEventListener("click", () => overlay.remove());
        overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    }

    const style = document.createElement("style");
    style.textContent = `
        .login-required-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55);
            display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .login-required-box { background: #fff; border-radius: 10px; padding: 24px 28px;
            max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
        .login-required-box h3 { margin: 0 0 10px; color: #a31b00; }
        .login-required-box p { margin: 0 0 18px; color: #444; line-height: 1.4; }
        .login-required-buttons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .login-required-buttons a, .login-required-buttons button { padding: 9px 16px; border-radius: 6px;
            border: none; cursor: pointer; font-size: 14px; font-weight: bold; text-decoration: none; }
        .lr-signin { background: #ecca00; color: #000; }
        .lr-create { background: #a31b00; color: #fff; }
        .lr-close { background: #ddd; color: #000; }
    `;
    document.head.appendChild(style);

    // Block Add to Cart / Buy Now when nobody is signed in.
    // Capture phase = runs before every other click handler on the page.
    document.addEventListener("click", e => {
        const btn = e.target.closest(".add-to-cart, .buy-now");
        if (!btn || isLoggedIn()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        showLoginRequired();
    }, true);

    // Create account + sign in forms
    document.addEventListener("submit", e => {
        const form = e.target;

        if (form.id === "createAccountForm") {
            e.preventDefault();
            e.stopImmediatePropagation();
            const v = id => (form.elements[id] ? form.elements[id].value.trim() : "");
            const username = v("username");

            if (form.elements.password.value.length < MIN_PASSWORD) {
                alert("Password must be at least " + MIN_PASSWORD + " characters.");
                return;
            }
            if (v("password") !== v("confirmPassword")) {
                alert("Passwords do not match.");
                return;
            }
            const accounts = getAccounts();
            if (accounts.some(a => a.username.toLowerCase() === username.toLowerCase())) {
                alert("That username is already taken. Please choose another one.");
                return;
            }
            if (emailTaken(v("email"))) {
                alert("That email is already used by another account. Please use a different email.");
                return;
            }
            accounts.push({
                username, password: v("password"),
                firstName: v("firstName"), lastName: v("lastName"),
                phone: v("phone"), email: v("email"),
                barangay: v("barangay"), municipality: v("municipality"),
                province: v("province"), postalCode: v("postalCode")
            });
            localStorage.setItem("accounts", JSON.stringify(accounts));
            localStorage.setItem("currentUser", username);
            loadUserCart(username);
            alert("Account created! You are now signed in.");
            goBackAfterLogin();
        }

        if (form.id === "loginForm") {
            e.preventDefault();
            e.stopImmediatePropagation();
            const username = form.elements.username.value.trim();
            const password = form.elements.password.value;

            if (password.length < MIN_PASSWORD) {
                alert("Password must be at least " + MIN_PASSWORD + " characters.");
                return;
            }

            const found = getAccounts().find(a =>
                a.username.toLowerCase() === username.toLowerCase() && a.password === password);
            if (!found) {
                alert("Incorrect username or password. If you don't have an account yet, please create one first.");
                return;
            }
            localStorage.setItem("currentUser", found.username);
            loadUserCart(found.username);
            alert("Welcome back, " + found.username + "!");
            goBackAfterLogin();
        }
    }, true);

    // User icon: when signed in, it opens an account menu with Log out
    document.addEventListener("DOMContentLoaded", () => {
        const user = localStorage.getItem("currentUser");
        const icon = document.querySelector('.main-navigation a[href$="signup.html"]');
        if (!user || !icon) return;

        const acc = getAccounts().find(a =>
            a.username.toLowerCase() === user.toLowerCase()) || {};
        const esc = s => String(s || "").replace(/[&<>"']/g, c =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

        const fullName = [acc.firstName, acc.lastName].filter(Boolean).join(" ");
        const address = [acc.barangay, acc.municipality, acc.province, acc.postalCode]
            .filter(Boolean).join(", ");

        // Style
        const st = document.createElement("style");
        st.textContent = `
            .user-menu { position: fixed; z-index: 9999; width: 250px; max-width: calc(100vw - 20px);
                background: #fff; color: #222; border-radius: 10px; padding: 14px 16px;
                box-shadow: 0 8px 24px rgba(0,0,0,.3); font-family: Arial, sans-serif; text-align: left; }
            .user-menu h4 { margin: 0 0 2px; font-size: 15px; color: #a31b00; }
            .user-menu .um-user { margin: 0 0 8px; font-size: 12px; color: #777; }
            .user-menu p { margin: 0 0 6px; font-size: 13px; line-height: 1.35; word-break: break-word; }
            .user-menu .um-label { display: block; font-size: 11px; color: #888; }
            .user-menu button { width: 100%; margin-top: 8px; padding: 9px; border: none; border-radius: 6px;
                background: #a31b00; color: #fff; font-weight: bold; font-size: 14px; cursor: pointer; }
            .user-menu button:hover { background: #8a1700; }
        `;
        document.head.appendChild(st);

        // Menu
        const menu = document.createElement("div");
        menu.className = "user-menu";
        menu.style.display = "none";
        menu.innerHTML = `
            <h4>${esc(fullName || user)}</h4>
            <div class="um-user">@${esc(user)}</div>
            ${acc.email ? `<p><span class="um-label">Email</span>${esc(acc.email)}</p>` : ""}
            ${acc.phone ? `<p><span class="um-label">Phone</span>${esc(acc.phone)}</p>` : ""}
            ${address ? `<p><span class="um-label">Address</span>${esc(address)}</p>` : ""}
            <button type="button" class="um-logout">Log out</button>`;
        document.body.appendChild(menu);

        function place() {
            const r = icon.getBoundingClientRect();
            const w = menu.offsetWidth;
            let left = r.right - w;
            left = Math.max(10, Math.min(left, window.innerWidth - w - 10));
            menu.style.left = left + "px";
            menu.style.top = (r.bottom + 8) + "px";
        }
        const open = () => { menu.style.display = "block"; place(); };
        const close = () => { menu.style.display = "none"; };

        icon.addEventListener("click", e => {
            e.preventDefault();
            menu.style.display === "none" ? open() : close();
        });
        document.addEventListener("click", e => {
            if (!menu.contains(e.target) && !icon.contains(e.target)) close();
        });
        document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
        window.addEventListener("resize", () => { if (menu.style.display !== "none") place(); });

        menu.querySelector(".um-logout").addEventListener("click", () => {
            saveAndClearCart(user);
            localStorage.removeItem("currentUser");
            window.location.href = icon.getAttribute("href");
        });
    });
})();

// ===== CREATE ACCOUNT PAGE: field rules + Province > Municipality > Barangay =====
(function () {
    // Set to true if you only want @gmail.com emails
    const GMAIL_ONLY = false;

    // Passwords must have at least this many characters
    const MIN_PASSWORD = 8;

    // Free Philippine address list (needs internet)
    const API = 'https://psgc.gitlab.io/api';
    const NCR = 'NCR'; // Metro Manila has no provinces, so it gets its own entry

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('createAccountForm');
        if (!form) return;

        const f = id => form.elements[id];

        // ----- Style for the red error messages -----
        const st = document.createElement('style');
        st.textContent = `
            .field-error { display: block; color: #c00; font-size: 11px; margin-top: 3px; }
            .field-invalid { border-color: #c00 !important; }
        `;
        document.head.appendChild(st);

        // ----- Error message helpers -----
        function setError(el, msg) {
            if (!el) return;
            let box = el.nextElementSibling;
            if (!box || !box.classList.contains('field-error')) {
                box = document.createElement('small');
                box.className = 'field-error';
                el.insertAdjacentElement('afterend', box);
            }
            box.textContent = msg;
            el.classList.toggle('field-invalid', !!msg);
        }

        // ----- Rules -----
        const NAME_RE = /^[A-Za-zÀ-ÿ]+(?:[ .'’-]+[A-Za-zÀ-ÿ]+)*\.?$/;
        const EMAIL_RE = GMAIL_ONLY
            ? /^[A-Za-z0-9._%+-]+@gmail\.com$/i
            : /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
        const USER_RE = /^[A-Za-z]+$/;

        const rules = {
            firstName: v => !v.trim() ? 'Please enter your first name.'
                : /\d/.test(v) ? 'Numbers are not allowed in a name.'
                : !NAME_RE.test(v.trim()) ? 'Letters only, please.' : '',
            lastName: v => !v.trim() ? 'Please enter your last name.'
                : /\d/.test(v) ? 'Numbers are not allowed in a name.'
                : !NAME_RE.test(v.trim()) ? 'Letters only, please.' : '',
            email: v => !v.trim() ? 'Please enter your email.'
                : !EMAIL_RE.test(v.trim())
                    ? (GMAIL_ONLY ? 'Use a proper Gmail address, like name@gmail.com.'
                                  : 'Enter a proper email, like name@gmail.com.')
                : emailTaken(v) ? 'This email is already used by another account.'
                : '',
            username: v => !v.trim() ? 'Please enter a username.'
                : /\d/.test(v) ? 'Numbers are not allowed in a username.'
                : !USER_RE.test(v.trim()) ? 'Letters only (capital or small), no spaces or symbols.' : '',
            password: v => !v ? 'Please enter a password.'
                : v.length < MIN_PASSWORD ? 'Password must be at least ' + MIN_PASSWORD + ' characters.' : '',
            confirmPassword: v => {
                const p = f('password');
                return !v ? 'Please confirm your password.'
                    : (p && v !== p.value) ? 'Passwords do not match.' : '';
            }
        };

        // Remove any pattern/length limits the HTML may have (the rules above handle the password length)
        const pw = f('password');
        if (pw) ['pattern', 'minlength', 'maxlength'].forEach(a => pw.removeAttribute(a));
        const cpw = f('confirmPassword');
        if (cpw) ['pattern', 'minlength', 'maxlength'].forEach(a => cpw.removeAttribute(a));

        // Check while typing
        Object.keys(rules).forEach(id => {
            const el = f(id);
            if (!el) return;
            const run = () => setError(el, rules[id](el.value));
            el.addEventListener('input', run);
            el.addEventListener('blur', run);
        });
        if (pw && cpw) pw.addEventListener('input', () => {
            if (cpw.value) setError(cpw, rules.confirmPassword(cpw.value));
        });

        // ----- Address: Province > Municipality > Barangay -----
        const provinceEl0 = f('province');
        const fieldset = provinceEl0 && provinceEl0.closest('fieldset');

        // Turn the municipality / barangay boxes into dropdowns
        function toSelect(old, placeholder) {
            if (!old) return null;
            if (old.tagName === 'SELECT') {
                old.innerHTML = '';
                return old;
            }
            const sel = document.createElement('select');
            sel.id = old.id;
            sel.name = old.name;
            sel.className = old.className;
            sel.required = old.required;
            old.replaceWith(sel);
            return sel;
        }

        // Fall back to typing if the address list can't be loaded
        function toText(sel, placeholder) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = sel.id;
            input.name = sel.name;
            input.className = sel.className;
            input.required = sel.required;
            input.placeholder = placeholder;
            sel.replaceWith(input);
            return input;
        }

        const provinceEl = toSelect(f('province'));
        const municipalityEl = toSelect(f('municipality'));
        const barangayEl = toSelect(f('barangay'));
        if (!provinceEl || !municipalityEl || !barangayEl) return;

        // Put them in this order: Province, Municipality, Barangay, then Postal Code
        function moveField(el) {
            if (!fieldset) return;
            let w = el;
            while (w.parentElement && w.parentElement !== fieldset) w = w.parentElement;
            const nodes = [];
            if (w === el) {
                const lab = (el.id && fieldset.querySelector('label[for="' + el.id + '"]'))
                    || (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL'
                        ? el.previousElementSibling : null);
                if (lab && lab.parentElement === fieldset) nodes.push(lab);
                nodes.push(el);
            } else {
                nodes.push(w);
            }
            nodes.forEach(n => fieldset.appendChild(n));
        }
        [provinceEl, municipalityEl, barangayEl, f('postalCode')].forEach(el => { if (el) moveField(el); });

        // Fill a dropdown with the list
        function fill(sel, items, placeholder) {
            sel.innerHTML = '';
            const first = document.createElement('option');
            first.value = '';
            first.textContent = placeholder;
            sel.appendChild(first);
            items.forEach(it => {
                const o = document.createElement('option');
                o.value = it.name;
                o.textContent = it.name;
                o.dataset.code = it.code;
                sel.appendChild(o);
            });
            sel.disabled = false;
        }

        function reset(sel, placeholder) {
            sel.innerHTML = '';
            const o = document.createElement('option');
            o.value = '';
            o.textContent = placeholder;
            sel.appendChild(o);
            sel.disabled = true;
            setError(sel, '');
        }

        const byName = (a, b) => a.name.localeCompare(b.name);
        async function getList(path) {
            const r = await fetch(API + path);
            if (!r.ok) throw new Error('Could not load ' + path);
            return (await r.json()).map(x => ({ name: x.name, code: x.code })).sort(byName);
        }

        let useText = false;
        function fallbackToTyping() {
            if (useText) return;
            useText = true;
            toText(provinceEl, 'Province');
            toText(municipalityEl, 'Municipality / City');
            toText(barangayEl, 'Barangay');
        }

        const code = sel => {
            const o = sel.selectedOptions && sel.selectedOptions[0];
            return o ? o.dataset.code : '';
        };

        reset(municipalityEl, 'Select province first');
        reset(barangayEl, 'Select municipality / city first');
        provinceEl.innerHTML = '<option value="">Loading provinces...</option>';
        provinceEl.disabled = true;

        getList('/provinces/').then(list => {
            list.unshift({ name: 'Metro Manila (NCR)', code: NCR });
            fill(provinceEl, list, 'Select province');
        }).catch(() => {
            fallbackToTyping();
        });

        provinceEl.addEventListener('change', async () => {
            setError(provinceEl, '');
            reset(barangayEl, 'Select municipality / city first');
            const c = code(provinceEl);
            if (!c) { reset(municipalityEl, 'Select province first'); return; }

            municipalityEl.innerHTML = '<option value="">Loading...</option>';
            municipalityEl.disabled = true;
            try {
                const path = c === NCR
                    ? '/regions/130000000/cities-municipalities/'
                    : '/provinces/' + c + '/cities-municipalities/';
                fill(municipalityEl, await getList(path), 'Select municipality / city');
            } catch (e) {
                fallbackToTyping();
            }
        });

        municipalityEl.addEventListener('change', async () => {
            setError(municipalityEl, '');
            const c = code(municipalityEl);
            if (!c) { reset(barangayEl, 'Select municipality / city first'); return; }

            barangayEl.innerHTML = '<option value="">Loading...</option>';
            barangayEl.disabled = true;
            try {
                fill(barangayEl, await getList('/cities-municipalities/' + c + '/barangays/'), 'Select barangay');
            } catch (e) {
                fallbackToTyping();
            }
        });

        barangayEl.addEventListener('change', () => setError(barangayEl, ''));

        // ----- Block the form until everything is correct -----
        // Window capture runs before the account code above, so nothing is saved if there is an error.
        window.addEventListener('submit', e => {
            if (e.target !== form) return;

            let firstBad = null;
            const bad = (el, msg) => {
                setError(el, msg);
                if (msg && !firstBad) firstBad = el;
            };

            Object.keys(rules).forEach(id => {
                const el = f(id);
                if (el) bad(el, rules[id](el.value));
            });

            [['province', 'Please choose your province.'],
             ['municipality', 'Please choose your municipality / city.'],
             ['barangay', 'Please choose your barangay.']].forEach(([id, msg]) => {
                const el = f(id);
                if (el) bad(el, el.value.trim() ? '' : msg);
            });

            if (firstBad) {
                e.preventDefault();
                e.stopImmediatePropagation();
                firstBad.focus();
            }
        }, true);
    });
})();

// ===== AUTO POSTAL CODE (by province + municipality/city) =====
(function () {
    // key = "province|municipality", both lowercase, letters only
    const ZIP = {
        // Cebu
        'cebu|cebu': '6000', 'cebu|mandaue': '6014', 'cebu|lapulapu': '6015',
        'cebu|talisay': '6045', 'cebu|consolacion': '6001', 'cebu|liloan': '6002',
        'cebu|compostela': '6003', 'cebu|danao': '6004', 'cebu|carmen': '6005',
        'cebu|cordova': '6017', 'cebu|minglanilla': '6046', 'cebu|naga': '6037',
        'cebu|sanfernando': '6018', 'cebu|carcar': '6019', 'cebu|toledo': '6038',
        'cebu|bogo': '6010',
        // Metro Manila
        'metromanila|manila': '1000', 'metromanila|makati': '1200',
        'metromanila|quezon': '1100', 'metromanila|pasig': '1600',
        'metromanila|taguig': '1630', 'metromanila|mandaluyong': '1550',
        'metromanila|pasay': '1300', 'metromanila|caloocan': '1400',
        'metromanila|marikina': '1800', 'metromanila|paranaque': '1700',
        'metromanila|laspinas': '1740', 'metromanila|muntinlupa': '1770',
        'metromanila|sanjuan': '1500', 'metromanila|valenzuela': '1440',
        'metromanila|malabon': '1470', 'metromanila|navotas': '1485',
        'metromanila|pateros': '1620',
        // Other provinces (add more as you need them)
        'bohol|tagbilaran': '6300',
        'negrosoriental|dumaguete': '6200',
        'negrosoccidental|bacolod': '6100',
        'davaodelsur|davao': '8000',
        'laguna|calamba': '4027', 'laguna|santarosa': '4026',
        'laguna|binan': '4024', 'laguna|sanpablo': '4000',
        'pampanga|angeles': '2009', 'pampanga|sanfernando': '2000',
        'bulacan|malolos': '3000'
    };

    // "City of Lapu-Lapu (Opon)" -> "lapulapu", "Parañaque City" -> "paranaque"
    const norm = s => String(s || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\bcity of\b/g, '')
        .replace(/\bcity\b/g, '')
        .replace(/[^a-z]/g, '');

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('createAccountForm');
        if (!form) return;

        const postal = form.elements['postalCode'];
        if (!postal) return;
        postal.setAttribute('autocomplete', 'off'); // stop the browser's own autofill

        function applyZip() {
            const prov = form.elements['province'];
            const muni = form.elements['municipality'];
            if (!prov || !muni) return;
            const zip = ZIP[norm(prov.value) + '|' + norm(muni.value)];
            postal.value = zip || '';   // not in the list: leave blank so they can type it
        }

        // Works even if the page falls back to typed boxes
        form.addEventListener('change', e => {
            if (e.target.name === 'province') postal.value = '';
            if (e.target.name === 'municipality') applyZip();
        });
        form.addEventListener('input', e => {
            if (e.target.name === 'municipality' && e.target.tagName === 'INPUT') applyZip();
        });
    });
})();