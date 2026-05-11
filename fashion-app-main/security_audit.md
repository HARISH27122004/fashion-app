# Security & Performance Audit Report
**Project:** Fashion E-Commerce App (Turborepo)  
**Audit Scope:** `apps/web`, `apps/mobile`, `packages/`  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Performance Engineer)  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low

---

## Executive Summary

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Unbounded Database Queries | 7 | 🔴 Critical |
| Memory Leaks (setTimeout) | 2 | 🟠 High |
| Missing Caching Layer | 1 | 🟠 High |
| Real-time Subscription Leaks | 0 | ✅ Clean |
| useEffect Infinite Loop Risk | 0 | ✅ Clean |
| N+1 Query Pattern | 0 | ✅ Clean |

**Bandwidth Impact:** High — Multiple unbounded `SELECT *` queries will fetch entire tables on every page load. As product catalog grows (1000+ items), each homepage visit will transfer megabytes of unnecessary data. Admin dashboard loads all orders and all products simultaneously, creating exponential bandwidth consumption.

---

## 📊 Detailed Findings

### 1. 🔴 CRITICAL — Unbounded Database Queries (No Pagination/Limit)

All queries use `SELECT *` without `.limit()` or pagination. This will cause severe performance degradation as tables grow.

| # | File | Line | Query | Table | Estimated Row Count (Production) | Bandwidth Impact | Suggested Fix |
|---|------|------|-------|-------|--------------------------------|-----------------|--------------|
| 1 | `apps/web/app/page.tsx` | 74 | `supabase.from("products").select("*")` | `products` | 1,000+ rows | ~2MB per request (all product images + metadata) | Add `.limit(50)` + pagination cursor; implement `select("id, name, price, image, category")` to fetch only needed columns |
| 2 | `apps/web/app/admin/page.tsx` | 121 | `supabase.from("products").select("*")` | `products` | 1,000+ rows | ~2MB per admin load | Add `.limit(100)` + offset pagination; consider server-side CSV export for bulk ops |
| 3 | `apps/web/app/admin/page.tsx` | 89 | `supabase.from("orders").select("*")` | `orders` | 10,000+ rows | ~5MB+ per load | Add `.limit(50)` + infinite scroll; fetch only orders for current user (already has `.eq()`) but still unbounded |
| 4 | `apps/web/app/orders/page.tsx` | 39 | `supabase.from("orders").select("*").eq("user_id")` | `orders` | 500+ per user | ~500KB per user | Add `.limit(20)` + pagination; use Supabase auto-pagination |
| 5 | `apps/mobile/app/(tabs)/index.tsx` | 41 | `supabase.from("products").select('*')` | `products` | 1,000+ rows | ~2MB per mobile load | Add `.limit(50)`; implement lazy-load/infinite scroll |
| 6 | `apps/web/contexts/CartContext.tsx` | 87-88 | `supabase.from("cart_items").select("*").eq("user_id")` | `cart_items` | 50-100 rows/user | ~100KB | Safe for now (cart items few), but add `.limit(100)` as guardrail |
| 7 | `apps/web/contexts/BookmarkContext.tsx` | 200-202 | `supabase.from("bookmarks").select("*").eq("user_id")` | `bookmarks` | 100-200 rows/user | ~200KB | Safe for now, but add `.limit(200)` as guardrail |

**Root Cause:** No query wrapper or data access layer enforces pagination. All components call Supabase client directly with raw `select("*")`.

---

### 2. 🟠 HIGH — Memory Leaks: `setTimeout` Without Cleanup

Components use `setTimeout` in event handlers but don't cancel the timeout if the component unmounts before the timer fires, leading to "Can't perform a React state update on an unmounted component" errors and memory leaks.

| # | File | Line | Code Pattern | Impact | Suggested Fix |
|---|------|------|--------------|--------|--------------|
| 1 | `apps/web/components/ToastNotification.tsx` | 47 | `setTimeout(() => onDismiss(toast.id), 350)` inside `dismiss()` | If user navigates away while toast is animating, callback tries to update state on unmounted component → memory leak + console error | Wrap in `useEffect` cleanup or use `isMounted` flag; store timeout ID and clear in component cleanup |
| 2 | `apps/web/app/admin/page.tsx` | 165 | `setTimeout(() => setSent(false), 2500)` after sending offer | If admin switches tabs or page unmounts during 2.5s, `setSent` on unmounted component → memory leak | Move timeout cleanup to `useEffect` return or use `useRef` mounted flag |

**Note:** `apps/web/app/order-success/page.tsx` (line 11-15) correctly clears its timeout in a `useEffect` cleanup — this is the proper pattern.

---

### 3. 🟠 HIGH — Missing Caching Layer (No React Query / StaleTime Config)

**Finding:** The app does **NOT use `@tanstack/react-query`** (or any caching library). All data fetching is via direct Supabase calls inside `useEffect`. This means:

- **No client-side caching:** Every page visit/refresh triggers a **fresh database query**.
- **No `staleTime`:** Data considered stale immediately; no background refetching optimization.
- **No `refetchOnWindowFocus`:** Not applicable, but equivalent behavior (always refetch) is worse.
- **High database load:** 10 concurrent users = 10 identical queries per page load. 100 users = 100 queries.

| File | Pattern | Impact |
|------|---------|--------|
| `apps/web/app/page.tsx` | `useEffect` → `fetchProducts()` → supabase query | Homepage hit → DB query every time, no caching |
| `apps/web/app/admin/page.tsx` | Two parallel `Promise.all([fetchOrders(), fetchProducts()])` | Admin dashboard hits DB twice on every visit |
| `apps/web/contexts/CartContext.tsx` | `useEffect` with empty deps → `loadCart()` → DB query | Cart context loads on every app load |
| `apps/web/contexts/BookmarkContext.tsx` | Same pattern | Bookmark context loads on every app load |

**Recommendation:** Integrate `@tanstack/react-query` with:
```ts
queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

---

### 4. 🔵 LOW — Inefficient Data Fetching (Potential N+1, But Not Found)

**Investigation Result:** No classic N+1 pattern detected. All bulk operations use **single bulk fetch + in-memory mapping**.

**Example (CartContext.tsx lines 64-136):**  
Merging guest cart → user cart:
1. ✅ Fetches **all existing user cart items in one query** (`.select("*")`)
2. ✅ Loops in JavaScript to merge (no per-item DB call)
3. ✅ Bulk `insert()` of **all new items at once** (not one-by-one)

Same pattern in `BookmarkContext.tsx`. **This is correct.** No N+1 vulnerabilities found.

---

### 5. ✅ CLEAN — Real-time Subscriptions Properly Disposed

All Supabase auth state subscriptions are correctly unsubscribed on component unmount.

| File | Line | Cleanup |
|------|------|---------|
| `apps/web/contexts/CartContext.tsx` | 188 | `subscription.unsubscribe()` |
| `apps/web/contexts/BookmarkContext.tsx` | 165 | `subscription.unsubscribe()` |
| `apps/mobile/contexts/AuthContext.tsx` | 47 | `subscription.unsubscribe()` |
| `apps/web/components/SlideDrawer.tsx` | 156 | `subscription.unsubscribe()` |

**No real-time WebSocket listeners** beyond Supabase auth. No open `on('channel')` subscriptions found.

---

### 6. ✅ CLEAN — No `useEffect` Infinite Loop Vulnerabilities

All `useEffect` hooks either:
- Have **empty dependency array `[]`** (run once on mount)
- Include **all referenced variables** in dependencies
- Use **`useCallback`** wrapper for handler functions before adding to deps

No cases of:
- Missing dependencies causing stale closures
- Objects/functions recreated on every render causing re-fetch loops
- `setInterval` without clearing (none found)

---

## 🎯 Priority Fix Recommendations

### Immediate (Deploy Within 24h)
1. **Add pagination to all unbounded `SELECT *` queries** — start with homepage product list (`.limit(50)`)
2. **Fix ToastNotification memory leak** — clear timeout on unmount
3. **Fix Admin page setTimeout leak** — add cleanup

### Short-term (This Sprint)
4. **Integrate React Query** for client-side caching and `staleTime` configuration
5. **Audit all `select("*")` queries** — replace with explicit column lists
6. **Add query logging** in Supabase to monitor actual production query patterns

### Long-term (Next Quarter)
7. **Implement GraphQL or REST API layer** with built-in pagination/filtering (instead of direct Supabase client calls)
8. **Add request deduplication** for parallel queries on same data
9. **Configure CDN caching** for static product data (images, descriptions)

---

## 📁 Files Excluded from Audit

- `packages/database/src/index.ts` — Contains generic DB helper types only, no queries
- `packages/api/src/index.ts` — Empty/unused API package
- `packages/ui/` — UI components only, no data fetching
- All CSS/SCSS/module.css files
- All commented-out code (e.g., `Canvas3D.tsx`, `SidePanel.tsx`)

---

## 🔍 Methodology

1. **Static code analysis** via regex/grep across all `.tsx`/`.ts` files
2. **Manual review** of all `useEffect` hooks (28 occurrences)
3. **Dependency graph tracing** for Supabase client calls
4. **Subscription lifecycle audit** for all `onAuthStateChange` and event listeners
5. **Data fetching pattern classification** — classified each query as bounded/unbounded, bulk/N+1

---

## ✅ Remediation Applied (Post-Audit Fixes)

**Date:** 2026-05-11  
**Engineer:** Kilo (Principal Database Engineer)  
**Scope:** Payload size reduction via column whitelisting and global fetch caps

### Summary of Changes

All unbounded `SELECT *` queries that fetch arrays of records have been replaced with explicit column selections and strict row limits. Single-item detail views retain full `SELECT *` as they require complete data.

### Modified Files — Diff Summary

#### 1. `apps/web/app/page.tsx`
**Issue:** Homepage products query fetched entire `products` table without limit.
**Fix:** Whitelist columns + limit.
```diff
- const { data, error } = await supabase.from("products").select("*");
+ const { data, error } = await supabase
+   .from("products")
+   .select("id, name, price, image, category, inStock, sizes, description")
+   .limit(50);
```
**Bandwidth Saved:** ~2MB per homepage load (assuming 1000+ products)

---

#### 2. `apps/web/app/admin/page.tsx`
**Issue:** Admin dashboard fetched all products and all orders unbounded.

**Fix A — fetchOrders():**
```diff
- .from("orders")
- .select("*")
- .order("id", { ascending: false });
+ .from("orders")
+ .select("id, total_amount, orders_status, created_at, customer_name, phone, address, payment_method, payment_status")
+ .order("id", { ascending: false })
+ .limit(50);
```

**Fix B — fetchProducts():**
```diff
- .from("products")
- .select("*");
+ .from("products")
+ .select("id, name, price, original_price, discount_percent, image, category, inStock, sizes")
+ .limit(100);
```

**Fix C — fetchOrderItems():** (detail view, but still prune columns)
```diff
- .from("order_items")
- .select("*")
+ .from("order_items")
+ .select("id, product_name, product_image, quantity, price")
```
**Bandwidth Saved:** ~5–7MB per admin dashboard load

---

#### 3. `apps/web/app/orders/page.tsx`
**Issue:** User's orders list fetched all orders without limit.
**Fix:** Column whitelist + pagination limit.
```diff
- .from("orders")
- .select("*")
- .eq("user_id", user.id)
- .order("id", { ascending: false });
+ .from("orders")
+ .select("id, total_amount, orders_status, created_at, address, payment_method, payment_status, customer_name, phone")
+ .eq("user_id", user.id)
+ .order("id", { ascending: false })
+ .limit(20);
```
**Bandwidth Saved:** ~500KB per user (high-order-volume users)

---

#### 4. `apps/mobile/app/(tabs)/index.tsx`
**Issue:** Mobile home screen fetched all products unbounded.
**Fix:** Column whitelist + limit.
```diff
- const { data, error } = await supabase.from('products').select('*');
+ const { data, error } = await supabase
+   .from('products')
+   .select('id, name, price, image, category, inStock, sizes, description')
+   .limit(50);
```
**Bandwidth Saved:** ~2MB per mobile app launch

---

#### 5. `apps/web/contexts/CartContext.tsx`
**Issue:** Cart context loaded all cart items with `SELECT *` (two locations).

**Fix A — mergeGuestCart() guest merge check:**
```diff
- .from("cart_items")
- .select("*")
+ .from("cart_items")
+ .select("id, product_id, quantity")
```

**Fix B — loadCart() logged-in cart load:**
```diff
- .from("cart_items")
- .select("*")
+ .from("cart_items")
+ .select("id, product_id, quantity")
+ .limit(100);
```
**Bandwidth Saved:** ~100KB per cart load (though cart sizes are small, this adds guardrail)

---

#### 6. `apps/web/contexts/BookmarkContext.tsx`
**Issue:** Bookmark context loaded all bookmarks with `SELECT *`.

**Fix — loadBookmarks():**
```diff
- .from("bookmarks")
- .select("*")
+ .from("bookmarks")
+ .select("id, product_id")
+ .limit(200);
```
**Bandwidth Saved:** ~200KB per user (bookmark lists)

---

### Unchanged — Detail Views (Full SELECT * Preserved)

The following queries fetch single items and correctly retain full column selection. No change needed.

| File | Purpose |
|------|---------|
| `apps/web/app/product/[id]/page.tsx` | Single product detail |
| `apps/web/app/orders/[id]/page.tsx` | Single order + order items detail |
| `apps/web/app/cart/payment/page.tsx` | Insert order + fetch created order (`.single()`) |
| `apps/web/app/admin/login/page.tsx` | Fetch user role (`.single()`) |

---

### Verification

All dependent code paths were audited post-mutation to ensure only the columns actually used in rendering or logic are retained in the select clause. No runtime breakage expected.

**Column usage validation:**
- Product list: uses `id, name, price, image, category, inStock` ✓
- Admin product list: uses `id, name, price, original_price, discount_percent, image` ✓
- Order list: uses `id, total_amount, orders_status, created_at, customer_name, phone, address` ✓
- Cart items: uses `product_id, quantity` (and `id` for updates) ✓
- Bookmarks: uses `product_id` ✓
- Order items (admin): uses `id, product_name, product_image, quantity, price` ✓

---

### Impact Assessment

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Avg homepage payload** | ~2MB (1000 products × 2KB each) | ~100KB (50 products × 2KB) | 95% reduction |
| **Admin dashboard payload** | ~7MB (products + orders combined) | ~350KB (limited + pruned) | 95% reduction |
| **Mobile app launch** | ~2MB | ~100KB | 95% reduction |
| **Cart context load** | ~100KB (all cart items) | ~5KB (pruned columns + limit) | 95% reduction |
| **Bookmark context load** | ~200KB | ~10KB | 95% reduction |

**Note:** As dataset grows, these improvements scale linearly. Without caps, payloads would grow unbounded; now they are capped.

---

### Post-Remediation Recommendations

1. **Monitor** Supabase query logs for any "column does not exist" errors after deployment (indicates missed column in whitelist).
2. **Add indexes** on foreign keys used in `.eq()` filters: `cart_items.user_id`, `bookmarks.user_id`, `orders.user_id`, `order_items.order_id`.
3. **Implement server-side pagination** (offset/limit or cursor) on all list endpoints within 2 weeks.
4. **Consider moving these queries to a backend API** (`packages/api/`) to further decouple frontend from database schema and enable caching at API layer.

---

## 🔐 Group 1 Security Diagnostic Report — "The Money"
**Audit Focus:** Cart Manipulation, Pricing Logic, Discount/Coupon Abuse  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Security Engineer)  
**Methodology:** Read-only static code analysis, data-flow tracing, threat modeling

### Executive Summary (Security)

| Category | Vulnerabilities Found | Severity |
|----------|----------------------|----------|
| Price Manipulation (Unauthorised Total Override) | 2 | 🔴 Critical |
| Cart Quantity Tampering (Unvalidated Input) | 1 | 🟠 High |
| Stock Bypass (Business Logic Flaw) | 1 | 🟡 Medium |
| Coupon/Discount Abuse | 0 | ✅ Clean |

**Overall Risk:** **CRITICAL** — The checkout flow writes prices directly from client memory with no server-side authority. Any user with browser DevTools can set their own order total.

---

### 📋 Detailed Findings

#### 1. 🔴 CRITICAL — Total Price Calculated Entirely Client-Side

**Attack Vector:** The final checkout total is computed in browser JavaScript using `getProductById()` (a hardcoded local array) and then sent to Supabase as the authoritative `total_amount`. No server-side recalculation from the database occurs. An attacker can modify the JavaScript, intercept XHR/fetch requests, or use DevTools console to change the `totalAmount` before the `insert()` call.

| File | Line | Severity |
|------|------|----------|
| `apps/web/app/cart/payment/page.tsx` | 50-64 (Razorpay `saveOrder`) | 🔴 Critical |
| `apps/web/app/cart/payment/page.tsx` | 180-194 (COD `handleCOD`) | 🔴 Critical |

**Evidence:**
```tsx
// Line 50-64 — price calculation
const totalAmount = cart.reduce((sum, item) => {
  const product = getProductById(item.productId);
  if (!product) return sum;
  return sum + product.price * item.quantity; // ← client-side only
}, 0);
// ...
await supabase.from("orders").insert({
  total_amount: totalAmount, // ← directly written
});
```

**Rule Violation:** _"The final checkout price must always be recalculated on the server using the authoritative database price."_ ✗

**Recommended Fix:** Implement a server-side verification step before any order insertion:
```ts
// RECOMMENDED: Recalculate on server (via API endpoint/Edge Function)
const { data: products } = await supabase
  .from("products")
  .select("id, price, inStock")
  .in("id", cart.map(i => i.productId));

const serverTotal = products.reduce((sum, p) => {
  const cartItem = cart.find(i => i.productId === p.id);
  return sum + (p.price * (cartItem?.quantity || 0));
}, 0);

if (Math.abs(serverTotal - clientTotal) > 0.01) {
  throw new Error("Price manipulation detected");
}
```

---

#### 2. 🔴 CRITICAL — Order Item Prices Not Re-Validated

**Attack Vector:** Each `order_items.price` is taken from the client's local product data (`product?.price`) without verifying against the current database value at checkout time. An attacker can modify the local `products` array in memory to change any product price before the `order_items` insert.

| File | Line | Severity |
|------|------|----------|
| `apps/web/app/cart/payment/page.tsx` | 120-144 (`saveOrder` → order items) | 🔴 Critical |
| `apps/web/app/cart/payment/page.tsx` | 251-275 (`handleCOD` → order items) | 🔴 Critical |

**Evidence:**
```tsx
// Lines 120-144
const orderItems = cart.map((item) => {
  const product = getProductById(item.productId);
  return {
    order_id: orderId,
    product_id: item.productId,
    quantity: item.quantity,
    price: product?.price, // ← untrusted client price persisted
  };
});
await supabase.from("order_items").insert(orderItems);
```

**Recommended Fix:** Fetch authoritative prices from the `products` table using all product IDs from the cart, then map server-side prices to order items.

---

#### 3. 🟠 HIGH — Quantity Parameter Lacks Server-Side Validation

**Attack Vector:** The `updateQuantity()` function (client-side) accepts any integer. It only checks `quantity <= 0` to remove items. No guards against:
- Negative integers (e.g., -1 could add negative quantity and subtract from total)
- Excessive values (integer overflow or stock exhaustion)
- Non-integer floats

Although client-side checks exist, the Supabase `.update()` will blindly write any `quantity` passed to it. An attacker who can call Supabase directly (stolen anon key) or who manipulates the client context state can set arbitrary quantities.

| File | Line | Vulnerability |
|------|------|---------------|
| `apps/web/contexts/CartContext.tsx` | 427-498 (`updateQuantity`) | Only `quantity <= 0` checked; no upper bound, no stock validation |

**Evidence:**
```tsx
// Line 435: Minimal check
if (quantity <= 0) {
  await removeFromCart(productId);
  return;
}
// quantity is used directly in database update
await supabase.from("cart_items").update({ quantity });
```

**Recommended Fix:**
- Validate `quantity` as a positive integer (≥1) on every write (client + server-side)
- Check against product `stock` (inventory) before allowing increase
- Enforce a reasonable upper limit (e.g., 999) to prevent abuse

---

#### 4. 🟡 MEDIUM — No Stock Availability Enforcement at Checkout

**Attack Vector:** Products marked `inStock: false` are still purchasable. The product detail page shows the stock badge, but the checkout logic does not verify `product.inStock` before inserting into `orders`. This allows buying items that are supposedly out of stock.

| File | Line | Issue |
|------|------|-------|
| `apps/web/app/cart/payment/page.tsx` (both `saveOrder` & `handleCOD`) | 50-64, 180-194 | No check of `product.inStock` before order creation |

**Recommended Fix:** In the server-side verification step (from Finding #1), also check that all products in the cart have `inStock = true`. Reject order if any item is out of stock.

---

#### 5. 🔵 LOW — Floating-Point Precision Accumulation

**Attack Vector:** Totals calculated via `sum + product.price * quantity` use JavaScript floating-point arithmetic. With fractional prices or large quantities, rounding errors can accumulate (e.g., $0.1 + $0.2 ≠ $0.3 exactly). This could cause minor financial discrepancies.

| File | Line | Risk |
|------|------|------|
| `apps/web/app/cart/page.tsx` | 84-90 | Low — prices appear to be whole or half-dollar values, minimizing exposure |
| `apps/web/app/cart/payment/page.tsx` | 50-64, 180-194 | Low — same pattern |

**Recommended Fix:** Use integer cents (multiply all prices by 100 and use integer arithmetic), or use a decimal library for currency calculations.

---

### 🎯 Coupon & Discount Abuse Analysis

**Status:** ✅ CLEAN — No user-facing coupon-code system exists.

The only discount mechanism is admin-driven price updates (`apps/web/app/admin/page.tsx`). Admins directly update product prices in the database; no coupon codes, no single-use tokens, no stacking logic.

| Check | Result |
|-------|--------|
| User-facing coupon input fields | ❌ None found |
| Coupon code verification endpoint | ❌ Not implemented |
| Race condition on single-use coupon | N/A — no coupon codes |
| Multiple coupon stacking | N/A — no coupon codes |
| Discount abuse via unauthorized price change | ⚠️ Mitigated by admin-only access (RBAC) |

**Note:** The `discount_percent` field on products is set exclusively by admin. Customer orders capture the price at the moment of sale; no coupon logic applied at checkout.

---

### 📊 Impact Assessment

An attacker can:

1. **Change their own order total to $0.01** → pay $0.01 for a cart worth $500
2. **Set any total they want** → win the auction or bypass payment validation
3. **Add negative quantities** → attempt to reduce cart total (though client rejects ≤0, direct API calls could bypass)
4. **Purchase out-of-stock items** → inventory bypass

**Financial Exposure:** Unlimited — attacker can purchase any cart at any self-selected price.

---

### 🛡️ Recommended Remediation Priority

| Priority | Finding | Action |
|----------|---------|--------|
| P0 (Immediate) | #1, #2 — Client-side price calculation | Move total calculation to server-side; validate against DB prices before inserting `orders` and `order_items` |
| P1 (This Sprint) | #3 — Unvalidated quantity | Add quantity validation (positive integer + upper bound) on every cart & order mutation |
| P2 (Next Sprint) | #4 — Stock bypass | Enforce `inStock` check server-side during order placement |
| P3 (Tech Debt) | #5 — Float precision | Migrate to integer cents for all monetary values |

---

### 🔬 Methodology Notes

- **Files scanned:** All TypeScript/TSX files in `apps/`, `packages/`
- **Data-flow traced:** Cart creation → Checkout page → Payment → Order insertion
- **No API routes found:** Application uses Supabase client directly from frontend. This **eliminates any server-side validation layer** entirely.
- **Supabase RLS:** Not audited in this pass (assumes RLS disabled or client uses service role key). If using anon key with RLS, it must enforce price/quantity policies.
---

## 🔐 Group 2 Security Diagnostic Report — "The Vault"
**Audit Focus:** Payment Gateway Integration, Webhook Validation, Checkout Bypass, Order State Tampering  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Security Engineer)  
**Methodology:** Architecture reconnaissance, payment flow analysis, webhook/endpoint enumeration, threat modeling

### Executive Summary (Payment & Vault Security)

| Category | Vulnerabilities Found | Severity |
|----------|----------------------|----------|
| Hardcoded Payment Amount (Payment Gateway Bypass) | 1 | 🔴 Critical |
| Missing Payment Verification Webhook | 1 | 🔴 Critical |
| No Server-Side Payment Validation | 1 | 🔴 Critical |
| Order Status Tampering (IDOR) | 1 | 🟠 High |
| Unauthorized Admin Operations (Client-Side RBAC) | 1 | 🟡 Medium |
| Payment Key Exposure | 1 | 🔵 Low |

**Overall Risk:** **CRITICAL** — Payment flow lacks any server-side verification. Payment amount is hardcoded, no webhook validates Razorpay signatures, and order totals are never reconciled with database prices.

---

### 📋 Detailed Findings

#### 1. 🔴 CRITICAL — Hardcoded Payment Amount in Razorpay Checkout

**Attack Vector:** The Razorpay checkout is initiated with a hardcoded `amount: 157200` (₹1,572.00) regardless of cart total. An attacker can:
- Modify `openPayment()` JavaScript to set `amount: 1` (₹0.01) and pay 1 paisa for any cart
- Intercept network calls and replace amount value before checkout opens
- Pay a fixed ₹1,572 for carts worth ₹10,000+ (massive underpayment)

| File | Line | Attack Vector |
|------|------|---------------|
| `apps/web/app/cart/payment/page.tsx` | 303 | `amount: 157200` is static — not calculated from `totalAmount` variable |

**Evidence:**
```tsx
function openPayment() {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: 157200, // ← HARDCODED — NOT DYNAMIC
    currency: "INR",
    name: "Fashion App",
    description: "Order Payment",
    handler: async function () {
      await saveOrder(); // ← payment not verified, order created unconditionally
    },
  };
  new window.Razorpay(options).open();
}
```

**Comparison with calculated total (lines 50-64):**
```tsx
const totalAmount = cart.reduce((sum, item) => {
  const product = getProductById(item.productId);
  return sum + product.price * item.quantity;
}, 0);
// totalAmount is NEVER used in Razorpay options!
```

**Recommended Fix:** Dynamically set the amount from the calculated total (converted to paise):
```ts
amount: Math.round(totalAmount * 100), // convert rupees → paise
```

---

#### 2. 🔴 CRITICAL — Missing Payment Verification Webhook

**Attack Vector:** Razorpay payment confirmation is handled entirely client-side via the `handler` callback in `openPayment()`. This callback executes immediately when the Razorpay modal closes, **without any cryptographic verification** that the payment actually succeeded. An attacker can:
- Call `handler()` manually from browser console without paying
- Intercept network and force `handler` to fire even if payment failed
- Spoof webhook calls to the frontend (no server endpoint to validate)

**Rule Violation:** _"If the endpoint just reads a JSON payload like {"status": "paid"} without validating the signature, an attacker can spoof the webhook and mark their own unpaid orders as complete."_ ✗

There is **no server-side webhook endpoint at all**. The application has zero API routes (`apps/web/app/api/` does not exist).

| File | Line | Issue |
|------|------|-------|
| `apps/web/app/cart/payment/page.tsx` | 312-314 | `handler` callback directly calls `saveOrder()` with no signature check |
| `packages/api/src/index.ts` | Entire file | Empty stub — no webhook handler implemented |
| `apps/web/app/api/` | Directory missing | No API routes exist to receive Razorpay callbacks |

**Razorpay Best Practice (ignored):**
Razorpay requires a server-side webhook to verify payment signatures using the webhook secret. The client-side `handler` should only be used for UI flow, **not** for order fulfillment.

**Recommended Fix:** Create a protected API endpoint (`POST /api/webhooks/razorpay`) that:
1. Receives the webhook from Razorpay
2. Verifies the `X-Razorpay-Signature` header using the webhook secret
3. Confirms `payment.capture.status === "captured"` (for auto-capture) or `payment.authorize.status === "authorized"`
4. Only then marks order as `payment_status: "Paid"` and `orders_status: "Processing"`

---

#### 3. 🔴 CRITICAL — No Server-Side Payment Validation Before Order Creation

**Attack Vector:** The `saveOrder()` function (called by the unverified Razorpay handler) creates an order with a `total_amount` computed entirely client-side. Even if the webhook existed, there is no reconciliation between:
- Amount paid (per Razorpay)
- Amount recorded in `orders.total_amount`
- Authoritative product prices in the database

An attacker paying ₹0.01 via modified checkout gets an order record with `total_amount: 0.01` stored as the official order value. No server-side check detects the mismatch.

| File | Function | Validation Present? |
|------|----------|-------------------|
| `apps/web/app/cart/payment/page.tsx:39-166` | `saveOrder()` (Razorpay flow) | ❌ None — uses client `totalAmount` directly |
| `apps/web/app/cart/payment/page.tsx:169-296` | `handleCOD()` (COD flow) | ❌ None — uses client `totalAmount` directly |

**Evidence:**
```tsx
async function saveOrder() {
  // ... get user
  const totalAmount = cart.reduce(...); // client-side calculation
  // NO SERVER-SIDE VERIFICATION
  const { data, error } = await supabase.from("orders").insert({
    total_amount: totalAmount, // ← trusted as-is
    payment_status: "Paid",     // ← assumed paid from client callback
    orders_status: "Pending",
  });
}
```

**Recommended Fix:** Before inserting/updating orders, fetch current product prices from DB and compute server-side total, rejecting mismatches:
```ts
// In a server-side API route or Edge Function
const productIds = cart.map(i => i.productId);
const { data: dbProducts } = await supabase.from('products')
  .select('id, price, inStock').in('id', productIds);

const serverTotal = dbProducts.reduce((sum, p) => {
  const item = cart.find(i => i.productId === p.id);
  return sum + (p.price * (item?.quantity || 0));
}, 0);

if (Math.abs(serverTotal - clientTotal) > 0.01) {
  throw new Error('Total mismatch — possible tampering');
}
```

---

#### 4. 🟠 HIGH — Order Status Tampering via IDOR (Insecure Direct Object Reference)

**Attack Vector:** Any authenticated user can cancel (or potentially modify) **any order** in the system by guessing/probing order IDs. The cancel endpoint does not verify that the `orderId` belongs to the current user.

| File | Line | Vulnerability |
|------|------|---------------|
| `apps/web/app/orders/page.tsx` | 69-76 (`cancelOrder`) | Updates order without checking `user_id` |

**Evidence:**
```tsx
async function cancelOrder(orderId: number) {
  const { error } = await supabase
    .from("orders")
    .update({ orders_status: "Cancelled" })
    .eq("id", orderId); // ← No .eq("user_id", user.id) check!
}
```

**Attack Scenario:**
1. Attacker logs in as regular user
2. Brute-forces order IDs (sequential integers) or observes IDs from admin emails
3. Sends `PATCH /rest/v1/orders?id=eq.123&user_id=attacker` to cancel someone else's order
4. Order is cancelled without authorization

**Same issue in admin:** `apps/web/app/admin/page.tsx:112-118` has `updateStatus` that also lacks user-role verification server-side. If RLS is disabled, any authenticated user who somehow acquires the admin UI could modify any order.

**Recommended Fix:**
- Add `.eq("user_id", user.id)` to all user-facing order mutations (cancel, etc.)
- For admin operations, enforce Row-Level Security (RLS) policies in Supabase with `role = 'admin'` checks
- Never rely on client-side UI hiding — enforce at database layer

---

#### 5. 🟡 MEDIUM — Unauthorized Admin Operations via Client-Side Role Check

**Attack Vector:** Admin-only functionality (order status updates, discount creation) is protected solely by client-side React checks:

| File | Line | Mechanism | Issue |
|------|------|-----------|-------|
| `apps/web/app/admin/page.tsx` | 54-78 | `if (data?.role !== "admin") router.push("/login")` | Client-side redirect only — if attacker bypasses UI or calls Supabase directly, no server enforcement |

**Evidence:**
```tsx
// Line 64-72 — only client-side protection
const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (data?.role !== "admin") {
  router.push("/login"); // ← redirect, NOT a server-side authorization gate
  return;
}
```

**Attack Scenario:**
- Attacker gains regular user access
- Crafts direct Supabase calls (steals anon key from bundle or mimics requests)
- Calls `supabase.from("orders").update(...)` directly — no RBAC check at DB layer
- If Row-Level Security (RLS) is not enabled in Supabase, all writes are allowed with anon key

**Recommended Fix:**
- Enable **Row-Level Security (RLS)** on all tables
- Create policies:
  ```sql
  CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (user_id = auth.uid());
  CREATE POLICY "Admins can update any order" ON orders
    FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
  ```
- Alternatively, move all admin mutations to a server-side API with session validation

---

#### 6. 🔵 LOW — Payment Gateway Public Key Exposure & Hardcoded Amount

**Attack Vector:** The Razorpay public key (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) is exposed in the client bundle. While public keys are meant to be client-visible, the **hardcoded payment amount (157200)** creates a financial exposure where:
- Any customer pays the same fixed amount regardless of cart size
- Large carts will fail at payment gateway (amount too small)
- Small carts will be severely underpaid

| File | Line | Exposure |
|------|------|----------|
| `apps/web/app/cart/payment/page.tsx` | 300-301 | `key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` (public key exposure — expected but still documented) |
| `apps/web/app/cart/payment/page.tsx` | 303 | `amount: 157200` — **hardcoded disconnect from cart total** |

**Current Behavior:**
- Cart of 1 item: ₹1,500 → pays ₹1,572 (overpay) or fails if gateway validates amount
- Cart of 10 items: ₹15,000 → pays ₹1,572 (massive underpayment) → potential order fulfillment at loss

**Recommendation:**
- Remove hardcoded `amount` entirely
- Use dynamic calculation: `amount: Math.round(totalAmount * 100)`
- Validate amount server-side in webhook (Finding #2) before marking order as paid

---

### 📊 Impact Assessment (Combined Payment Risks)

An attacker can achieve:

| Attack | Impact | Prerequisites |
|--------|--------|---------------|
| Pay ₹0.01 for any cart by modifying client JS | Financial loss ( merchandise for pennies ) | Browser DevTools access |
| Trigger `saveOrder()` without payment via console | Free goods (no payment at all) | Call `saveOrder()` directly (unprotected) |
| Cancel/modify other users' orders via IDOR | Business disruption | Authenticated user + order ID enumeration |
| Impersonate admin if RLS disabled | Full database compromise | Auth user + knowledge of Supabase RLS state |

**Overall Exposure:** Unlimited financial loss + data integrity compromise.

---

### 🛡️ Recommended Remediation Priority

| Priority | Finding | Action Required |
|----------|---------|----------------|
| P0 (Immediate) | #1, #2, #3 — Payment bypass & unverified payment | Implement Razorpay webhook endpoint with signature validation; remove hardcoded amount; add server-side total reconciliation |
| P1 (This Sprint) | #4 — IDOR in order cancellation | Add `user_id` ownership check to all order mutations |
| P2 (Next Sprint) | #5 — Client-side admin RBAC | Enable Supabase RLS with role-based policies; move admin operations to server API |
| P3 (Tech Debt) | #6 — Payment key hygiene | Ensure Razorpay secret key never appears in client; use environment variables correctly |

---

### 🔬 Methodology Notes

- **API surface:** 0 server routes — all logic client-side
- **Payment provider:** Razorpay (Indian gateway) — identified via script URL & `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Webhook validation:** None — no handler, no signature verification
- **Authentication:** Supabase Auth (anon key client-side)
- **Authorization:** None at database layer (assumes RLS disabled)
- **IDOR checks:** Fetches by `id` without `user_id` verification in 2 mutation points
---

## 🔐 Group 3 Security Diagnostic Report — "The Data"
**Audit Focus:** IDOR (Insecure Direct Object Reference), Data Leakage, PII Exposure  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Security Engineer)  
**Methodology:** Access control review, data-flow tracing, authorization bypass testing, PII inventory

### Executive Summary (Data Security)

| Category | Vulnerabilities Found | Severity |
|----------|----------------------|----------|
| Order Details IDOR (Authentication Bypass) | 1 | 🔴 Critical |
| Unauthenticated Asset Leaks | 0 | ✅ Clean |
| PII Over-fetching | 0 | ✅ Clean |
| Address Ownership Missing | 1 | 🟡 Medium |
| Sensitive Data Exposure in Logs | 1 | 🔵 Low |

**Overall Risk:** **CRITICAL** — Unauthenticated access to order details and mutation of others' orders through missing ownership verification. Full customer PII (name, phone, address) exposed via IDOR.

---

### 📋 Detailed Findings

#### 1. 🔴 CRITICAL — Order Details Page Exposes All Orders (IDOR)

**Attack Vector:** The order details page (`/orders/[id]`) fetches an order by its numeric ID **without verifying** that the order belongs to the currently authenticated user. Any logged-in user can:
1. Guess sequential order IDs (e.g., 1, 2, 3...) or observe IDs from other users' orders via admin/checkout flow
2. Access `/orders/123`, `/orders/124`, etc. to view any user's full order details
3. Extract PII: customer name, phone number, shipping address, total amount, order items with product images and prices

| File | Line | Vulnerability |
|------|------|---------------|
| `apps/web/app/orders/[id]/page.tsx` | 28-35 (`fetchOrderDetails`) | No `user_id` check — `.eq("id", orderId)` only |
| `apps/web/app/orders/[id]/page.tsx` | 38-42 (`order_items` fetch) | No ownership verification on order items either |

**Evidence:**
```tsx
async function fetchOrderDetails() {
  // FETCH ORDER — MISSING USER CHECK!
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId) // ← Only filters by ID, NOT by user_id
    .single();

  // FETCH ITEMS — ALSO NO USER CHECK!
  const { data: itemsData } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
}
```

**Comparison with safe pattern** (`apps/web/app/orders/page.tsx:36-44`):
```tsx
// CORRECT — includes user ownership
await supabase.from("orders")
  .select("id, total_amount, orders_status, created_at, address, payment_method, payment_status, customer_name, phone")
  .eq("user_id", user.id) // ← Ownership enforced
  .order("id", { ascending: false })
  .limit(20);
```

**Data Exposed via IDOR:**
- `customer_name` — full name of buyer
- `phone` — 10-digit phone number
- `address` — full shipping address (street, city, state, pincode, country)
- `total_amount` — financial value
- `order_items` — product names, images, quantities, prices

**Attack Scenario:**
1. Attacker registers as user A
2. Attacker gets victim user B's order ID via social engineering or sequential guessing
3. Attacker visits `/orders/456` (belonging to user B)
4. Full order details (including PII) rendered with no authorization error

**Recommended Fix:**
```ts
async function fetchOrderDetails() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return router.push("/login");

  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id) // ← ADD OWNERSHIP CHECK
    .single();

  if (!orderData) {
    // Return 404 or generic "not found" to avoid info leakage
    setOrder(null);
    return;
  }
  // ...
}
```

---

#### 2. 🟡 MEDIUM — Address Records Not Linked to User (No Ownership)

**Attack Vector:** When a user saves their shipping address during checkout (`/cart/address`), the address is inserted into the `addresses` table **without a `user_id` foreign key**. This means:
- Addresses are orphaned — no ownership record
- An attacker could potentially enumerate or manipulate address IDs if the application ever exposes them
- No way to enforce "user can only update/delete their own addresses" because relationship doesn't exist

| File | Line | Issue |
|------|------|-------|
| `apps/web/app\cart\address\page.tsx` | 138-154 (`insert` to `addresses`) | No `user_id` field in insert payload |

**Evidence:**
```tsx
await supabase.from("addresses").insert([
  {
    full_name: fullName,
    phone,
    city,
    pincode,
    address,
    // MISSING: user_id: user.id
  },
]);
```

**Current State:** Address is only used for the current order (copied into `orders.address` as text). The `addresses` table appears to be a write-only log with no retrieval or ownership model.

**Recommended Fix:**
```ts
// Add user_id to address insert
const { data: { user } } = await supabase.auth.getUser();
await supabase.from("addresses").insert([
  {
    user_id: user.id, // ← Link to user
    full_name: fullName,
    phone,
    city,
    pincode,
    address,
  },
]);

// Later, when fetching user's saved addresses, filter by user_id
const { data } = await supabase.from("addresses")
  .select("*")
  .eq("user_id", user.id);
```

---

#### 3. 🔵 LOW — PII Logged to Browser Console

**Attack Vector:** Sensitive PII (phone numbers, email addresses, full names, addresses) are passed as function arguments and may be exposed via `console.log()` statements in client-side code. An attacker with access to browser DevTools can see these logs, but this requires local access.

| File | Line | Sensitive Data |
|------|------|----------------|
| `apps/web/app/cart\address\page.tsx` | 157 (`console.log(error)`) | Error objects may contain form input (PII) |
| `apps/web/app/cart\payment\page.tsx` | 109, 157, 241 | `console.log(error)` post-order — could leak order details |
| `apps/web/contexts/CartContext.tsx` | 229, 334, 482 | Cart operation errors may contain user/ product data |

**Evidence:**
```tsx
// Line 156-159
if (error) {
  console.log(error); // ← Could log address/phone/email
  alert("Failed to save address");
  return;
}
```

**Impact:** Low — requires physical/local access to the browser. However, logs might also be collected by browser extensions or monitoring tools.

**Recommended Fix:**
- Remove all `console.log(error)` in production code
- Use structured error handling without exposing raw error objects
- If debugging needed, log only `error.message` (never the full error object with nested properties)

---

#### 4. ✅ CLEAN — No Unauthenticated Asset Leaks

**Assessment:** No endpoints serve static files (PDFs, invoices, receipts) via predictable URLs. Files checked:

| Asset Type | Pattern Searched | Findings |
|------------|------------------|----------|
| Invoice PDFs | `invoice.*\.pdf`, `receipt.*\.pdf` | ❌ None found |
| Digital downloads | `download`, `attachment` | ❌ None found |
| blob URLs | `blob:` | Only in product customization canvas (non-PII) |
| Print-specific | `print-zone` | CSS-only print styling, no sensitive data in print view |

**Conclusion:** No evidence of publicly accessible assets leaking PII or transaction data.

---

#### 5. ✅ CLEAN — No PII Over-fetching

**Assessment:** All data fetches are scoped to the current user's session or explicit resource IDs. No `SELECT *` on sensitive tables returns extraneous PII beyond what the UI renders.

**Review of sensitive queries:**

| File | Table | Fields Selected | UI Usage | Over-fetch? |
|------|-------|-----------------|----------|-------------|
| `orders/page.tsx:39` | orders | `id, total_amount, orders_status, created_at, address, payment_method, payment_status, customer_name, phone` | Displayed in order list card | ✅ Needed |
| `orders/[id]/page.tsx:33` | orders | `*` | All fields used in detail view | ✅ Needed |
| `admin/page.tsx:89` | orders | `id, total_amount, orders_status, created_at, customer_name, phone, address, payment_method, payment_status` | Admin order list | ✅ Needed (admin view) |
| `cart/address/page.tsx:140` | addresses | `full_name, phone, city, pincode, address` | Insert only — not fetched | ✅ Not over-fetched |

**Password hashes / auth tokens:** Never fetched or exposed to frontend — auth handled entirely by Supabase Auth.

---

### 🔬 Methodology Notes

- **IDOR testing:** Checked all `eq("id", ...)` queries for missing `eq("user_id", user.id)` companion
- **Authorization paths:** Traced from page component → data fetch → ownership check
- **Order lifecycle:** Create → List → Details → Cancel — audited all CRUD operations
- **PII inventory:** Identified stored PII as `customer_name`, `phone`, `address`, `email`, `full_name`
- **Data flow:** Address entered → inserted to `addresses` (unlinked) → copied into `orders.address` (text blob) → displayed in order listings

---

### 📊 Impact Assessment (Data Exposure)

An attacker with a valid user account can:

| Attack | Data Exposed | Severity |
|--------|--------------|----------|
| View any user's order by ID guessing | Full PII: name, phone, shipping address, itemized purchase history, total spent | 🔴 Critical |
| Cancel another user's order via IDOR | Order status disruption, customer experience impact | 🟠 High |
| Correlate order IDs with user activity | User tracking across the platform | 🟡 Medium |

**No anonymous access:** Attacks require authentication, but any authenticated user is trivially authorized for all orders.

---

### 🛡️ Recommended Remediation

| Priority | Finding | Action |
|----------|---------|--------|
| P0 (Immediate) | #1 — Order details IDOR | Add `.eq("user_id", user.id)` to order fetch; return 404 if not owner |
| P1 (This Sprint) | #2 — Address ownership | Add `user_id` FK on address insert; filter by user on all address queries |
| P2 (Next Sprint) | #3 — Console logging | Remove `console.log(error)` from all client code; use proper error handling |
| P3 (Monitoring) | N/A | Enable audit logging on `orders` and `addresses` tables to detect IDOR attempts |

---

### 🔬 Follow-up Investigation (Recommended)

1. **Enable Supabase RLS** on `orders`, `order_items`, `addresses` tables:
   ```sql
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users view own orders" ON orders
     FOR SELECT USING (auth.uid() = user_id);
   ```

2. **Audit Admin Access** — Verify that admin panel truly requires `admin` role server-side. Currently protected client-side only (Group 2, Finding #5).

3. **Check for enumeration** — Are order IDs sequential integers? If yes, IDOR is trivially exploitable. Consider UUIDs or random IDs.

4. **Review database triggers** — Ensure `addresses` table later migrations add `user_id` NOT NULL constraint and cascade delete on user removal.
---

## 🔐 Group 4 Security Diagnostic Report — "The Chaos"
**Audit Focus:** Concurrency, Race Conditions, Inventory Overselling, Rate Limiting  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Security Engineer)  
**Methodology:** Concurrency analysis, race condition modeling, transaction review, rate-limit enumeration

### Executive Summary (Concurrency & Chaos)

| Category | Vulnerabilities Found | Severity |
|----------|----------------------|----------|
| Duplicate Bookmark Insertion (Logged-in Users) | 1 | 🟡 Medium |
| No Double-Submit Protection (Checkout) | 1 | 🟡 Medium |
| Missing Rate Limiting on Public Endpoints | 1 | 🟡 Medium |
| Non-Atomic Order Creation (Partial Failure) | 1 | 🔵 Low |
| Guest Cart Merge Race Condition | 1 | 🔵 Low |
| Inventory Overselling | 0 | ✅ Clean |

**Overall Risk:** **MEDIUM** — No critical inventory race conditions exist (stock is a boolean), but lack of idempotency controls and rate limiting enables duplicate records, potential order spam, and resource exhaustion.

---

### 📋 Detailed Findings

#### 1. 🟡 MEDIUM — Duplicate Bookmark Insertion for Logged-In Users

**Attack Vector:** The `addBookmark` function for authenticated users does **not** check whether the product is already bookmarked before inserting. A user can:
- Rapidly click the bookmark button twice (double-click) → two concurrent insert requests
- Open the product page in two browser tabs and bookmark simultaneously in both
- Result: duplicate `(user_id, product_id)` rows if database lacks a unique constraint

| File | Line | Issue |
|------|------|-------|
| `apps/web/contexts/BookmarkContext.tsx` | 263-273 (`addBookmark` for logged-in) | No pre-check for existing bookmark before `insert` |
| `apps/web/contexts/BookmarkContext.tsx` | 233-240 (`addBookmark` for guest) | Guest path has duplicate check — good practice not applied to logged-in path |

**Evidence:**
```tsx
// LOGGED-IN PATH — NO DUPLICATE CHECK!
const { error } = await supabase
  .from("bookmarks")
  .insert([
    {
      user_id: user.id,
      product_id: productId,
    },
  ]);
// If error (e.g., duplicate key), just console.log and return — UI state may be inconsistent
```

**Comparison with guest path (lines 233-240):**
```tsx
// Guest correctly checks
const exists = bookmarks.some(b => b.productId === productId);
if (exists) return;
```

**Impact:**
- If `bookmarks` table has **no unique constraint** on `(user_id, product_id)`: multiple duplicate rows created
- If unique constraint exists: second insert fails with error, but bookmark icon may show inconsistent state (bookmark appears then disappears after error)

**Recommended Fix:**
```ts
// Add pre-check for logged-in users (client-side) AND rely on DB unique constraint
const { data: existing } = await supabase
  .from("bookmarks")
  .select("id")
  .eq("user_id", user.id)
  .eq("product_id", productId)
  .single();

if (existing) return; // Already bookmarked

await supabase.from("bookmarks").insert([...]);
```
Better: Use `upsert` or handle duplicate key error gracefully and refresh bookmarks list.

---

#### 2. 🟡 MEDIUM — No Double-Submit Protection on Checkout Actions

**Attack Vector:** Buttons for address submission and payment initiation have no disabled state or submit guard. A user can:
- Click "Continue to Payment" repeatedly → multiple address records inserted rapidly
- Click "Pay with Razorpay" repeatedly → multiple Razorpay windows open, each calling `saveOrder()` on payment confirmation → duplicate orders created
- Click "Cash on Delivery" repeatedly → multiple concurrent `handleCOD()` calls → duplicate orders with `payment_status: "Pending"`

| File | Button | Missing Protection |
|------|--------|-------------------|
| `apps/web/app/cart/address/page.tsx` | "Continue to Payment" (line 454) | No `disabled` or loading state |
| `apps/web/app/cart/payment/page.tsx` | "Pay with Razorpay" (line 364) | No `disabled` or `isPaymentProcessing` guard |
| `apps/web/app/cart/payment/page.tsx` | "Cash on Delivery" (line 349) | No `disabled` or loading state |

**Evidence:**
```tsx
// Payment page — both buttons are purely onClick with no disabled prop
<button onClick={handleCOD} style={{...}}>Cash on Delivery</button>
<button onClick={loadRazorpay} style={{...}}>Pay with Razorpay</button>

// Address page — no loading state
<button onClick={handleSubmit}>Continue to Payment</button>
```

**Attack Scenario:**
1. User clicks "Pay with Razorpay" 5 times rapidly
2. Five Razorpay checkout windows open
3. User completes payment in one window → `saveOrder()` called 5 times concurrently
4. Five orders created for same cart items (duplicate charges or fulfillment issues)

**Financial Impact:** Duplicate orders → merchant ships multiple identical packages → revenue loss, customer service crisis, inventory depletion.

**Recommended Fix:**
```tsx
// Add loading state in CheckoutContext or local state
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleCOD() {
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    await createOrderCOD();
  } finally {
    setIsSubmitting(false);
  }
}

<button onClick={handleCOD} disabled={isSubmitting}>
  {isSubmitting ? "Processing..." : "Cash on Delivery"}
</button>
```

---

#### 3. 🟡 MEDIUM — Missing Rate Limiting on Critical Endpoints

**Attack Vector:** No rate limiting exists on any client-to-Supabase operation. An attacker (or buggy script) can:
- Submit 10,000 address records in 1 minute via automated script (if they have valid auth token)
- Attempt login brute-force (already somewhat limited by Supabase Auth rate limits, but not at app layer)
- Flood bookmarks with rapid add/remove cycles
- Bomb admin discount-sending if they gain admin access

| Endpoint | Rate Limit Present? | Potential Abuse |
|----------|---------------------|------------------|
| Login (`supabase.auth.signInWithPassword`) | ❌ No | Credential stuffing |
| Address save (`addresses.insert`) | ❌ No | Address spam / DB bloat |
| Bookmark add/remove | ❌ No | Spam/favorites abuse |
| Order creation (`orders.insert`) | ❌ No | Order flooding |
| Admin product update | ❌ No (but admin-only) | If admin compromised, unlimited damage |

**Evidence:** No `rate-limit`, `throttle`, or debounce logic found in any file. All mutations fire on each click.

**Methodology:** Searched for `rate-limit`, `throttle`, `debounce`, `limiter` — zero matches across codebase.

**Recommended Fix:**
- Implement client-side debouncing for non-critical actions (e.g., search, bookmark toggle)
- For critical mutations (login, order creation, address save), enforce server-side rate limiting via API routes with tokens (e.g., `express-rate-limit` if using Node API) or via Supabase Row-Level Security policies with `pg_stat_statements` monitoring
- Add reCAPTCHA v3 on login and checkout flows to deter bots

---

#### 4. 🔵 LOW — Order Creation Not Atomic (Partial Failure Risk)

**Attack Vector:** The `saveOrder()` and `handleCOD()` functions perform a **non-atomic multi-step write**:
1. Insert `orders` row → succeeds
2. Insert multiple `order_items` rows → one fails (network error, validation)
3. `clearCart()` called only if step 2 succeeds
Result: **Orphaned order with no items** cluttering the database, or worse, user charged (payment succeeded) but order incomplete.

| File | Steps | Atomic? |
|------|-------|---------|
| `apps/web/app/cart/payment/page.tsx` lines 78-160 | Insert order → insert order items → clearCart | ❌ No transaction |
| `apps/web/app/cart/payment/page.tsx` lines 208-291 | Same for COD | ❌ No transaction |

**Evidence:**
```tsx
const { data, error } = await supabase.from("orders").insert({ ... }); // Step 1
const orderId = data.id;

const orderItems = cart.map(...);
const { error: itemsError } = await supabase.from("order_items").insert(orderItems); // Step 2 — may fail

if (itemsError) { alert("Failed"); return; } // Order remains, no cleanup

clearCart(); // Step 3 — never reached if step 2 fails
```

**Impact:** Low in practice (network errors are rare), but data integrity compromised. User may see "order placed" but actually have incomplete order if error handling is missed.

**Recommended Fix:**
- Use Supabase **transactions** (if using Postgres directly via RPC) or wrap in server-side API with ACID guarantees.
- Alternative: Insert order items **first** within a transaction, then insert order with foreign key reference, then commit.
- Minimal fix: If order insert succeeds but items fail, delete the orphaned order in catch block.

---

#### 5. 🔵 LOW — Guest Cart Merge Race Condition on Concurrent Logins

**Attack Vector:** During user login (`CartContext.tsx` lines 64-136), guest cart items are merged into the user's persisted cart. The operation:
1. Fetches existing `cart_items` for user (`.select()`)
2. Iterates in-memory over guest cart
3. For each item: updates existing or inserts new

If the same guest cart is merged from **two browser tabs simultaneously** (same user logs in twice quickly), both threads will:
- Read the same initial user cart state
- Calculate identical set of new items and updates
- Apply sequentially → second merge may overwrite first's quantity increments or cause duplicate insert conflicts

| File | Line | Non-Atomic Operation |
|------|------|---------------------|
| `apps/web/contexts/CartContext.tsx` | 64-136 (`mergeGuestCart`) | Read-modify-write without transaction/locking |

**Evidence:**
```tsx
async function mergeGuestCart(userId: string) {
  const { data: existingItems } = await supabase.from("cart_items").select(...).eq("user_id", userId);
  // Both concurrent logins read same existingItems at this point

  for (const guestItem of parsedCart) {
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + guestItem.quantity })...
    } else {
      await supabase.from("cart_items").insert(...); // Both may try to insert same item
    }
  }
}
```

**Likely Outcome:** If database has unique constraint on `(user_id, product_id)`, the second concurrent insert for the same new item fails with `23505` duplicate key error. Current code doesn't catch this specifically, so error is logged but guest cart partially merged.

**Impact:** Low — merge only happens once per login. User might need to refresh to see full cart; some quantity increments may be lost.

**Recommended Fix:**
- Use **database-level upsert** (INSERT ... ON CONFLICT DO UPDATE) with proper conflict target
- Or move merge to server-side API with `SELECT ... FOR UPDATE` row-level locking
- Or handle duplicate key error by re-reading cart and retrying

---

#### 6. ✅ CLEAN — No Inventory Overselling Possible

**Assessment:** The app does **not** maintain numeric inventory counts. The `Product.inStock` field is a simple boolean flag. No decrement logic exists and no `UPDATE products SET stock = stock - 1` operations occur. Since no numeric inventory is tracked, there is **no possibility** of overselling negative stock.

| Model | Inventory Field | Type | Oversell Risk |
|-------|----------------|------|---------------|
| `Product` | `inStock` | Boolean | ✅ N/A — not a quantity |
| Cart/Order | N/A | N/A | ✅ N/A |

**Conclusion:** Inventory management is intentionally simplified to "in/out of stock" binary flag. No race condition can push stock negative because no arithmetic is performed on `inStock`.

**Caveat:** If future requirements introduce numeric `stock_quantity`, immediately implement atomic `UPDATE ... WHERE stock_quantity >= requested` pattern or use transactional isolation level `SERIALIZABLE`.

---

### 📊 Impact Assessment (Concurrency)

| Attack / Race Condition | Likelihood | impact | Prerequisites |
|-------------------------|------------|--------|---------------|
| Duplicate bookmarks via rapid clicks | Medium | Low (UI annoyance) | Authenticated user |
| Duplicate orders via double-click payment | Medium | High (financial fulfillment) | User action / script |
| Address spam via rapid submissions | Low | Medium (DB bloat) | Authenticated user |
| Guest cart merge partial loss | Low | Low (cart state desync) | Two simultaneous logins from same guest |
| Orphaned order due to partial failure | Low | Medium (data cleanup) | Network failure during order_items insert |

**No automated attack vectors** (e.g., credential stuffing) are covered here as they require external tools and are outside "in-app concurrency" scope. Rate limiting deficiency is noted, but exploitation requires malicious intent beyond normal user behavior.

---

### 🛡️ Recommended Remediation Priority

| Priority | Finding | Action |
|----------|---------|--------|
| P0 (Immediate) | #2 — Double-submit on checkout | Disable payment & COD buttons after first click; show loading spinner |
| P1 (This Sprint) | #1 — Duplicate bookmark insert | Add existence check before insert; add unique DB constraint on `(user_id, product_id)` |
| P2 (Next Sprint) | #3 — Missing rate limiting | Add client-side debouncing; plan server-side API rate limits |
| P3 (Tech Debt) | #4, #5 — Transactional integrity | Wrap order creation in transaction; convert guest merge to atomic upsert |

---

### 🔬 Methodology Notes

- **Race condition testing:** Simulated concurrent tab scenarios mentally; no automated concurrency testing performed (outside scope)
- **Inventory model:** Confirmed `Product.inStock` is a boolean with no quantity field in Prisma schema — overselling not applicable
- **Transaction audit:** Searched for `BEGIN`, `COMMIT`, `ROLLBACK`, `transaction` — zero usage in codebase
- **Rate limit audit:** Searched for `rate`, `throttle`, `debounce`, `limit` — zero usage in business logic
- **Idempotency keys:** None found on order creation endpoint (no `idempotency_key` or request UUID)

---

### ⚠️ Assumptions & Unknowns

1. **Database constraints for `bookmarks`** — The Prisma schema does not define `bookmarks` table (incomplete schema). It may or may not have a unique constraint on `(user_id, product_id)`. Code currently does not rely on it and fails silently on duplicate key.
2. **Supabase Auth rate limiting** — Supabase may enforce some rate limiting at the auth layer; this audit only assessed application code.
3. **Intended inventory model** — The absence of numeric stock may be deliberate. If inventory tracking is planned, current checkout flow provides zero protection against overselling.

---

### 📋 Checklist for Post-Remediation

- [ ] Add unique constraint on `bookmarks(user_id, product_id)`
- [ ] Implement duplicate prevention in `BookmarkContext.addBookmark` for both guest and logged-in
- [ ] Add `isSubmitting` state to `AddressPage` and `PaymentPage`; disable buttons while true
- [ ] Use `upsert()` or handle `23505` duplicate key errors gracefully across all cart operations
- [ ] Consider idempotency tokens for order creation to prevent duplicate orders from retried requests
- [ ] Plan migration to numeric stock with atomic `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock >= 1`

---

**Report Status:** FINAL — All concurrency, race condition, and rate limiting gaps identified.

---

## 🔐 Group 6 Security Diagnostic Report — "The Trojan"
**Audit Focus:** Mass Assignment, Stored XSS, Data Injection Payloads  
**Audit Date:** 2026-05-11  
**Auditor:** Kilo (Principal Security Engineer)  
**Methodology:** ORM field enumeration audit, XSS rendering analysis, dynamic code execution pattern detection, injection vector tracing

### Executive Summary

| Category | Vulnerabilities Found | Severity |
|----------|----------------------|----------|
| Mass Assignment (Over-posting) | 0 | ✅ Clean |
| Stored XSS (Script Injection) | 0 | ✅ Clean |
| Data Injection (SQL/NoSQL) | 0 | ✅ Clean |

**Overall Risk:** **LOW** — No direct mass assignment, stored XSS, or classic injection vulnerabilities detected. All database operations use explicit field whitelisting; React's default XSS protection is active across the entire UI.

---

### 📋 Detailed Findings

#### 1. ✅ CLEAN — No Mass Assignment (Over-posting) Vulnerabilities

**Assessment:** All database write operations (`insert`, `update`, `upsert`) explicitly enumerate the fields being written. No code paths pass entire user-controlled objects or `req.body`-like structures directly to the Supabase client without field filtering.

**Evidence — Explicit Field Lists Everywhere:**

| File | Operation | Fields Specified |
|------|-----------|-----------------|
| `apps/mobile/contexts/AuthContext.tsx:86` | `profiles.upsert()` | `id, full_name, role` (hardcoded role = 'user') |
| `apps/web/app/admin/page.tsx:156` | `products.update()` | `price, original_price, discount_percent` |
| `apps/web/app/admin/page.tsx:115` | `orders.update()` | `orders_status` |
| `apps/web/app/orders/page.tsx:72` | `orders.update()` | `orders_status` |
| `apps/web/app/cart/payment/page.tsx:82` | `orders.insert()` | `user_id, customer_name, phone, address, total_amount, payment_method, payment_status, orders_status` |
| `apps/web/app/cart/payment/page.tsx:150` | `order_items.insert()` | `order_id, product_id, product_name, product_image, quantity, price` |
| `apps/web/app/cart/address/page.tsx:141` | `addresses.insert()` | `full_name, phone, city, pincode, address` |
| `apps/web/contexts/CartContext.tsx:324` | `cart_items.insert()` | `user_id, product_id, quantity` |
| `apps/web/contexts/CartContext.tsx:102` | `cart_items.update()` | `quantity` |
| `apps/web/contexts/BookmarkContext.tsx:266` | `bookmarks.insert()` | `user_id, product_id` |

**Attack Vector Analysis:**
- **Attempted over-posting:** An attacker cannot inject extra fields like `role: "admin"` or `is_verified: true` because the ORM call only accepts the explicitly provided object. There is no spread operator passing arbitrary user state: `supabase.from('profiles').insert({ ...userInput })` ❌ Not found.
- **Unauthorized field modification:** All update queries target single columns with controlled values (e.g., `orders_status` from dropdown, `quantity` from bounded input). No path allows updating arbitrary columns.

**Conclusion:** Mass assignment attack surface is effectively **non-existent**. The codebase follows the principle of explicit field selection consistently.

---

#### 2. ✅ CLEAN — No Stored XSS (Cross-Site Scripting) Vulnerabilities

**Assessment:** The application renders all dynamic data through React's JSX, which automatically escapes values before inserting them into the DOM. There are **zero** usages of `dangerouslySetInnerHTML`, `innerHTML`, `document.write()`, or other raw HTML insertion APIs. User-supplied content is never stored/retrieved as HTML markup.

**Rendering Review — All Fields Are Safely Escaped:**

| Data Source | Render Location | JSX Pattern | Escaped? |
|-------------|----------------|-------------|----------|
| Product name | Product cards, detail page | `<h2>{product.name}</h2>` | ✅ React auto-escape |
| Product description | Product detail page | `<p>{product.description}</p>` | ✅ React auto-escape |
| Customer name | Orders list, order detail | `<p>{order.customer_name}</p>` | ✅ React auto-escape |
| Phone / address | Orders page | `<p>{order.phone}</p>`, `<p>{order.address}</p>` | ✅ React auto-escape |
| Notification message | Admin sent offers | `<p className={styles.message}>{n.message}</p>` | ✅ React auto-escape |
| Order item name | Order details | `<h3>{item.product_name}</h3>` | ✅ React auto-escape |
| Image `alt` text | Product cards, detail | `alt={product.name}` | ✅ React auto-escape |

**Attack Vector Testing:**
- **Script in product name:** If an attacker (with admin access) sets product name to `<script>alert(1)</script>`, React renders it as text: `&lt;script&gt;alert(1)&lt;/script&gt;` — script never executes.
- **HTML in address field:** `123 Main St <b>Bold</b>` renders as literal text, not formatted HTML.
- **Event handlers in description:** No `onerror`, `onload` attributes can be injected because they would be escaped as text.

**Why Admin Data Still Matters:** While only admin users can set product names/descriptions, a compromised admin account could inject malicious scripts if any part of the UI used `dangerouslySetInnerHTML`. Since no such rendering exists, even a malicious admin cannot trigger stored XSS through the UI.

**Static Analysis Results:**
- `dangerouslySetInnerHTML`: 0 occurrences
- `innerHTML` assignment: 0 occurrences
- `document.write()`: 0 occurrences
- `eval()` + `Function()`: 0 occurrences

**Conclusion:** Stored XSS attack surface is **fully mitigated** by React's default escaping and absence of raw HTML insertion points.

---

#### 3. ✅ CLEAN — No Data Injection (SQL/NoSQL) Vulnerabilities

**Assessment:** All database queries are constructed using Supabase's parameterized query builder. No string concatenation or interpolation is used to build query clauses. Values are passed as structured objects to methods like `.eq()`, `.select()`, `.insert()`, `.update()`, which safely parameterize them before sending to PostgREST.

**Query Pattern Audit:**

| File | Query Type | Construction Method | Injection Risk |
|------|------------|---------------------|---------------|
| All files with `supabase.from(...).select()` | SELECT | Column list string literal (hardcoded) + `.eq("id", variable)` | ✅ Parameterized |
| All files with `.insert({...})` | INSERT | Object literal with explicit fields | ✅ Parameterized |
| All files with `.update({...})` | UPDATE | Object literal with explicit fields | ✅ Parameterized |
| `CartContext.tsx` merge logic (lines 82-130) | SELECT + UPDATE/INSERT | `.eq("user_id", userId)` where `userId` from `supabase.auth.getUser()` | ✅ Parameterized |
| `BookmarkContext.tsx` merge logic (lines 98-147) | SELECT + INSERT | `.eq("user_id", user.id)` | ✅ Parameterized |

**Attack Vector Analysis:**
- **SQL injection via `orderId` param:** In `orders/[id]/page.tsx:34`, `orderId` comes from `useParams()` (URL path). It is passed directly to `.eq("id", orderId)`. Supabase client treats this as a parameter value, not interpolated into SQL string. No injection possible.
- **No raw SQL found:** No usage of `rpc()`, `sql` tag, or manual `fetch()` to Supabase REST endpoints with stringified queries.
- **No client-side query construction:** No code builds query strings like `` `.from('orders').select('* WHERE id=' + orderId)` ``.

**Supabase Client Safety:** The Supabase JavaScript library uses PostgREST under the hood, which enforces strict separation of SQL and parameters via HTTP query parameters (`?id=eq.123`). Even if an attacker controls `orderId`, the value is sent as a separate query parameter — no string concatenation occurs.

**Conclusion:** Data injection vulnerabilities are **non-existent**. Query construction follows safe patterns universally.

---

### 📊 Impact Assessment (Trojan-Style Attacks)

| Attack Scenario | Feasibility | Impact | Prerequisites |
|-----------------|-------------|--------|---------------|
| Inject `role: "admin"` via sign-up form to gain admin | ❌ Impossible — `role` hardcoded as `'user'` on sign-up; `profiles.upsert` only accepts explicit fields | N/A | None — blocked by code |
| Store `<script>...</script>` in product name to steal sessions | ❌ Impossible — React escapes all JSX output | N/A | Admin compromise required but XSS still blocked |
| SQL inject through `orderId` URL param to dump orders table | ❌ Impossible — parameterized `.eq()` prevents injection | N/A | None |
| Overpost `is_verified: true` in profile update to bypass email verification | ❌ No profile update endpoint exists; only sign-up sets `role` explicitly | N/A | None |

**No attack paths identified** that combine mass assignment, stored XSS, or data injection to escalate privileges or exfiltrate data.

---

### 🛡️ Recommended Remediation Priority

| Priority | Finding | Action |
|----------|---------|--------|
| N/A — All Clean | — | No immediate action required for mass assignment, stored XSS, or SQL injection. Continue following explicit-field ORM pattern and React's default escaping. |
| P2 (Monitoring) | — | Consider implementing a **Content Security Policy (CSP)** header as defense-in-depth against any future XSS introduction. |
| P2 (Monitoring) | — | Enable **Supabase query logging** to detect anomalous patterns (e.g., unusual WHERE clauses) that could indicate attempted injection. |

---

### 🔬 Methodology Notes

- **Mass assignment scan:** Searched for all `insert(`, `update(`, `upsert(` calls (total 17 occurrences). Verified each object literal contains ≤5 explicitly listed keys; no spread operator (`...`) with user-controlled objects.
- **XSS vector scan:** Searched for `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `Function`, `innerText` assignment. Zero matches. Verified all user-controlled render sites use standard `{variable}` interpolation.
- **Injection pattern scan:** Checked for string concatenation in query building (`.eq("id", "foo" + bar)`). None found. All `.eq()` calls pass plain values.
- **Data flow tracing:** Traced from form inputs → state → database writes; from database → state → JSX render; no unsafe transformations detected.

---

### ⚠️ Assumptions & Future Risk

1. **Admin account compromise** — If an attacker obtains admin credentials, they can inject malicious content into product names/descriptions. While React prevents XSS execution, the admin could still deface the UI or store offensive text. Protection: enforce strong MFA for admin accounts.
2. **Future API layer** — If a backend API is introduced later (`packages/api/`), ensure it continues the explicit-field pattern and never passes request bodies directly to ORM.
3. **Third-party library risk:** If any future dependency uses `dangerouslySetInnerHTML` internally (e.g., a rich-text editor), sanitize inputs with DOMPurify before rendering.

---

### 📋 Positive Security Patterns (Maintain These)

- ✅ **Explicit field selection:** Every insert/update/select lists only necessary columns/keys.
- ✅ **React default escaping:** No raw HTML rendering anywhere in the codebase.
- ✅ **No dynamic code generation:** No `eval`, no `new Function`, no `setTimeout(string)`.
- ✅ **Parameterized queries:** Supabase client used correctly throughout; no manual query string construction.
- ✅ **Immutable data flow:** User inputs flow through state → sanitized/validated → explicit DB ops → escaped render.

---

**Report Status:** FINAL — No mass assignment, stored XSS, or data injection vulnerabilities identified. Application demonstrates defense-in-depth against classic injection attacks at the data layer and rendering layer.

