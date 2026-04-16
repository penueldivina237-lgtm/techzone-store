(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Mobile nav
  const nav = qs('[data-nav]');
  const navToggle = qs('[data-nav-toggle]');
  if (nav && navToggle) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('is-open')) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (nav.contains(t) || navToggle.contains(t)) return;
      setOpen(false);
    });
    qsa('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // Footer year
  const year = qs('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // Product data
  const products = [
    { id: 'p1', name: 'Nebula Headphones', category: 'Audio', price: 89, desc: 'Comfort fit, deep bass, 30h battery.', deal: true },
    { id: 'p2', name: 'Aero Mechanical Keyboard', category: 'Accessories', price: 119, desc: 'Hot-swap switches, RGB, aluminum body.', deal: false },
    { id: 'p3', name: 'Pulse Smartwatch', category: 'Wearables', price: 149, desc: 'Health tracking + notifications.', deal: true },
    { id: 'p4', name: 'Bolt USB‑C Hub', category: 'Accessories', price: 39, desc: 'HDMI + USB + SD. Travel-ready.', deal: false },
    { id: 'p5', name: 'Orbit Speaker Mini', category: 'Audio', price: 55, desc: 'Punchy sound, compact build.', deal: false },
    { id: 'p6', name: 'ZenPad Tablet 10"', category: 'Devices', price: 229, desc: 'Bright display, smooth streaming.', deal: true }
  ];

  // Cart helpers (localStorage)
  const cartKey = 'techzone.cart.v1';
  const readCart = () => {
    try {
      const raw = localStorage.getItem(cartKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeCart = (cart) => {
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch { /* ignore */ }
  };

  const cartCount = () => {
    const cart = readCart();
    return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
  };

  const updateCartBadge = () => {
    const badge = qs('[data-cart-count]');
    if (badge) badge.textContent = String(cartCount());
  };

  const addToCart = (id, qty = 1) => {
    const cart = readCart();
    cart[id] = Number(cart[id] || 0) + qty;
    if (cart[id] <= 0) delete cart[id];
    writeCart(cart);
    updateCartBadge();
  };

  const setCartQty = (id, qty) => {
    const cart = readCart();
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      delete cart[id];
    } else {
      cart[id] = Math.min(99, Math.floor(n));
    }
    writeCart(cart);
    updateCartBadge();
  };

  updateCartBadge();

  // Filters + products render
  const productsRoot = qs('[data-products]');
  const filterBtns = qsa('[data-filter]');
  const priceSelect = qs('[data-price]');
  const featuredRoot = qs('[data-featured]');

  const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

  const applyFilters = (items, category, priceBand) => {
    let out = items;
    if (category && category !== 'All') out = out.filter((p) => p.category === category);
    if (priceBand) {
      const band = String(priceBand);
      if (band === 'lt50') out = out.filter((p) => p.price < 50);
      if (band === '50to150') out = out.filter((p) => p.price >= 50 && p.price <= 150);
      if (band === 'gt150') out = out.filter((p) => p.price > 150);
    }
    return out;
  };

  const productCard = (p) => `
    <article class="product">
      <div class="product-media" aria-hidden="true">${p.category}</div>
      <div class="row">
        <h3>${p.name}</h3>
        <div class="price">${formatMoney(p.price)}</div>
      </div>
      <p>${p.desc}</p>
      <div class="row">
        <button class="btn btn-primary" type="button" data-add="${p.id}">Add to cart</button>
        <button class="btn btn-ghost" type="button" data-open-product="${p.id}">Quick view</button>
      </div>
    </article>
  `;

  const renderProducts = (category = 'All') => {
    if (!productsRoot) return;
    const priceBand = priceSelect ? priceSelect.value : '';
    const list = applyFilters(products, category, priceBand);
    productsRoot.innerHTML = list.map(productCard).join('') || `<div class="card"><p class="lead" style="margin:0">No products match your filters.</p></div>`;
    bindProductButtons();
  };

  const renderFeatured = () => {
    if (!featuredRoot) return;
    const featured = products.filter((p) => p.deal).slice(0, 3);
    featuredRoot.innerHTML = featured.map(productCard).join('');
    bindProductButtons();
  };

  const modalBackdrop = qs('[data-modal-backdrop]');
  const closeModalBtn = qs('[data-close-modal]');
  const modalTitle = qs('[data-modal-title]');
  const modalBody = qs('[data-modal-body]');

  const setModalOpen = (open) => {
    if (!modalBackdrop) return;
    modalBackdrop.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const openProduct = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p || !modalTitle || !modalBody) return;
    modalTitle.textContent = p.name;
    modalBody.innerHTML = `
      <div class="grid grid-2">
        <div class="product-media" style="border-radius:18px">${p.category}</div>
        <div>
          <p class="lead" style="margin:0">${p.desc}</p>
          <div style="height:12px"></div>
          <div class="row" style="justify-content:flex-start;gap:10px;flex-wrap:wrap">
            <span class="pill" style="cursor:default" aria-pressed="false">${p.category}</span>
            ${p.deal ? `<span class="pill" style="cursor:default" aria-pressed="true">Featured deal</span>` : ''}
          </div>
          <div style="height:12px"></div>
          <div class="row">
            <div class="price" style="font-size:20px">${formatMoney(p.price)}</div>
            <button class="btn btn-primary" type="button" data-add="${p.id}">Add to cart</button>
          </div>
          <p class="small">Demo store — cart is saved in localStorage.</p>
        </div>
      </div>
    `;
    bindProductButtons(modalBody);
    setModalOpen(true);
  };

  if (modalBackdrop && closeModalBtn) {
    closeModalBtn.addEventListener('click', () => setModalOpen(false));
    modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) setModalOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setModalOpen(false); });
  }

  const bindProductButtons = (root = document) => {
    qsa('[data-add]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-add');
        if (!id) return;
        addToCart(id, 1);
        const toast = qs('[data-toast]');
        if (toast) {
          toast.textContent = 'Added to cart.';
          toast.setAttribute('aria-hidden', 'false');
          window.setTimeout(() => toast.setAttribute('aria-hidden', 'true'), 1400);
        }
      });
    });

    qsa('[data-open-product]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-product');
        if (id) openProduct(id);
      });
    });
  };

  if (filterBtns.length && productsRoot) {
    const setActive = (cat) => {
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat)));
    };
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter') || 'All';
        setActive(cat);
        renderProducts(cat);
      });
    });
    setActive('All');
  }

  if (priceSelect && productsRoot) {
    priceSelect.addEventListener('change', () => {
      const active = qsa('[data-filter]', document).find((b) => b.getAttribute('aria-pressed') === 'true');
      const cat = active?.getAttribute('data-filter') || 'All';
      renderProducts(cat);
    });
  }

  if (productsRoot) renderProducts('All');
  if (featuredRoot) renderFeatured();

  // Cart page render
  const cartRoot = qs('[data-cart]');
  if (cartRoot) {
    const cart = readCart();
    const lines = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return null;
        return { ...p, qty: Number(qty) };
      })
      .filter(Boolean);

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const shipping = lines.length ? 9.99 : 0;
    const total = subtotal + shipping;

    cartRoot.innerHTML = lines.length ? `
      <div class="card">
        <table class="table" aria-label="Cart items">
          <thead>
            <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            ${lines.map((l) => `
              <tr>
                <td>${l.name}<div class="small">${l.category}</div></td>
                <td>${formatMoney(l.price)}</td>
                <td><input class="qty" type="number" min="1" max="99" value="${l.qty}" data-qty="${l.id}" aria-label="Quantity for ${l.name}" /></td>
                <td>${formatMoney(l.price * l.qty)}</td>
                <td><button class="icon-btn" type="button" data-remove="${l.id}">Remove</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="grid grid-2" style="margin-top:12px">
        <div class="card">
          <h2 style="margin:0 0 6px">Summary</h2>
          <p class="small" style="margin:0">Shipping is a demo flat rate.</p>
          <div style="height:10px"></div>
          <div class="row"><span class="small">Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
          <div class="row"><span class="small">Shipping</span><strong>${formatMoney(shipping)}</strong></div>
          <div class="row"><span class="small">Total</span><strong>${formatMoney(total)}</strong></div>
          <div style="height:12px"></div>
          <a class="btn btn-primary" href="../checkout/">Go to checkout</a>
          <a class="btn btn-ghost" href="../products/">Continue shopping</a>
        </div>
        <div class="card">
          <h2 style="margin:0 0 6px">Need help?</h2>
          <p class="lead" style="margin:0">This store is a front-end demo.</p>
          <div style="height:10px"></div>
          <p class="small">Cart persists in localStorage. Clear browser storage to reset.</p>
        </div>
      </div>
    ` : `
      <div class="card">
        <h2 style="margin:0 0 6px">Your cart is empty</h2>
        <p class="lead" style="margin:0">Add products to see them here.</p>
        <div style="height:12px"></div>
        <a class="btn btn-primary" href="../products/">Browse products</a>
      </div>
    `;

    qsa('[data-qty]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-qty');
        if (!id) return;
        setCartQty(id, Number(input.value));
        location.reload();
      });
    });

    qsa('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        if (!id) return;
        setCartQty(id, 0);
        location.reload();
      });
    });
  }

  // Checkout page (UI only)
  const checkoutForm = qs('[data-checkout-form]');
  if (checkoutForm) {
    const notice = qs('[data-form-notice]');
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (notice) {
        notice.setAttribute('aria-hidden', 'false');
        notice.textContent = 'Checkout submitted (test mode). No payment was processed.';
      }
      // Optional: clear cart on submit
      writeCart({});
      updateCartBadge();
    });
  }

  // Scroll reveal (IntersectionObserver)
  try {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      const revealTargets = qsa('.card, .product, .project')
        .filter((el) => el instanceof HTMLElement)
        .filter((el) => !el.closest('.modal') && !el.closest('[data-modal-backdrop]'));

      revealTargets.forEach((el) => el.classList.add('reveal'));

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        revealTargets.forEach((el) => io.observe(el));
      } else {
        revealTargets.forEach((el) => el.classList.add('is-in'));
      }
    }
  } catch { /* ignore */ }
})();
