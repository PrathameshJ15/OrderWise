# OrderWise — Frontend Specification

Tech: React 18, Vite 5, Tailwind CSS 3, Lucide React, Recharts  
Router: react-router-dom v6  
HTTP: axios  

---

## 1. Color Palette (Tailwind)

Use these consistently for allocation statuses:

| Status | Tailwind Classes |
|---|---|
| `fulfilled` | `bg-green-100 text-green-800 border-green-200` |
| `partially_fulfilled` | `bg-yellow-100 text-yellow-800 border-yellow-200` |
| `deferred` | `bg-red-100 text-red-800 border-red-200` |
| `pending` | `bg-gray-100 text-gray-600 border-gray-200` |
| `critical` priority | `bg-red-500 text-white` |
| `high` priority | `bg-orange-400 text-white` |
| `medium` priority | `bg-blue-400 text-white` |
| `low` priority | `bg-gray-400 text-white` |

Alert severity:
| Severity | Color |
|---|---|
| `critical` | red |
| `warning` | yellow/amber |
| `info` | blue |

---

## 2. API Client Setup

File: `frontend/src/api/client.js`

```js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT automatically
client.interceptors.request.use(config => {
  const token = localStorage.getItem('orderwise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('orderwise_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
```

---

## 3. Auth Context

File: `frontend/src/contexts/AuthContext.jsx`

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('orderwise_token');
    if (token) {
      client.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('orderwise_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('orderwise_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('orderwise_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 4. Route Guards

```jsx
// ProtectedRoute.jsx — redirect to /login if not authenticated
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
}
```

---

## 5. App.jsx — Route Definitions

```jsx
<Routes>
  {/* Public */}
  <Route path="/login"    element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* Customer */}
  <Route element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
    <Route path="/dashboard"    element={<CustomerDashboard />} />
    <Route path="/products"     element={<ProductCatalog />} />
    <Route path="/orders/new"   element={<CreateOrder />} />
    <Route path="/orders"       element={<MyOrders />} />
    <Route path="/orders/:id"   element={<OrderDetail />} />
  </Route>

  {/* Admin */}
  <Route element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
    <Route path="/admin"                element={<AdminDashboard />} />
    <Route path="/admin/products"       element={<ProductManagement />} />
    <Route path="/admin/inventory"      element={<InventoryManagement />} />
    <Route path="/admin/orders"         element={<OrderManagement />} />
    <Route path="/admin/allocation"     element={<AllocationCenter />} />
    <Route path="/admin/ai"             element={<AIRecommendations />} />
    <Route path="/admin/impact"         element={<ImpactAnalyzer />} />
    <Route path="/admin/simulations"    element={<SimulationLab />} />
    <Route path="/admin/alerts"         element={<Alerts />} />
    <Route path="/admin/replenishment"  element={<Replenishment />} />
    <Route path="/admin/reports"        element={<Reports />} />
  </Route>

  <Route path="/" element={<Navigate to="/login" />} />
  <Route path="*" element={<Navigate to="/login" />} />
</Routes>
```

---

## 6. Page Specifications

### Login.jsx
- Email and password form
- On submit: call `login()` from AuthContext
- On success: redirect to `/dashboard` (customer) or `/admin` (admin)
- Show error message on 401

### Register.jsx
- Name, email, password, confirm password
- On success: auto-login and redirect to `/dashboard`

---

### CustomerDashboard.jsx
Display:
- Welcome message with customer name
- Summary cards: total orders, fulfilled count, deferred count
- Recent orders table (last 5) with status badges
- Link to create new order

---

### ProductCatalog.jsx
Display:
- Grid of product cards
- Each card: product name, SKU, unit, available stock indicator
- Stock indicator: green (>20%), yellow (5–20%), red (<5%) of on_hand
- "Order Now" button → navigates to `/orders/new?product_id=X`

---

### CreateOrder.jsx
Flow:
1. Product selector (dropdown or search)
2. For each selected product:
   - Quantity input (requested_quantity)
   - Minimum acceptable quantity input
   - Partial delivery toggle
3. Promised delivery date picker
4. Business notes textarea
5. Submit → POST /orders
6. On success → redirect to `/orders/:id`

Validation:
- `minimum_acceptable_quantity` <= `requested_quantity`
- At least one item required

---

### MyOrders.jsx
Display:
- Table: order ID, date, status, promised delivery, item count
- Click row → `/orders/:id`
- Filter by status

---

### OrderDetail.jsx (Customer view)
Display for each order item:
- Product name
- Requested quantity
- Allocated quantity
- Status badge
- **Allocation explanation** (the plain-English reason from the engine)
- "Why was my order deferred?" section using the explanation text

This is a key customer-facing feature — make it clear and readable.

---

### AdminDashboard.jsx
Display:
- Stats row: Total Products, Active Orders, Last Allocation Run, Unresolved Alerts
- Recent allocation run summary (pie or bar chart with Recharts)
- Low stock warnings
- Pending AI recommendations count
- Quick action buttons: Run Allocation, View Alerts, View Replenishment

---

### InventoryManagement.jsx
Display:
- Table: Product, SKU, On Hand, Reserved, Available, Reorder Point, Status
- "Adjust Stock" button → modal with new quantity + reason
- Color-code rows: red if available < safety_stock, yellow if near reorder point
- Inventory movement history per product (expandable row)

---

### OrderManagement.jsx
Display:
- Table: Order ID, Customer, Status, Items, Promised Date, Priority, Created
- Filters: status, customer, product, date range
- Action column: View, Cancel, Assign Priority
- Click "Assign Priority" → opens AI recommendation modal

---

### AllocationCenter.jsx (Admin's most important page)
Sections:
1. **Run Allocation** panel:
   - Checkbox list of products (or "Run for all products")
   - Optional notes input
   - "Run Allocation Engine" button
   - Shows spinner during run
   
2. **Latest Results** table:
   - Order ID, Customer, Product, Requested, Allocated, Status, Priority, Explanation
   - Status filter
   - Export to CSV button

3. **Run History** section:
   - List of past runs with timestamp, initiated by, summary counts
   - Click run → shows its results

---

### AIRecommendations.jsx
Layout:
1. **Order selector** — search/dropdown for orders without an approved priority
2. **Order context panel** — shows order details and business notes
3. **"Get AI Recommendation"** button
4. **Recommendation card** (shown after Groq responds):
   - Suggested priority badge
   - Confidence level
   - Explanation paragraph
   - Evidence quote
   - Warning (if present)
   - Provider label (groq / **fallback** — clearly styled differently)
5. **Approval actions**:
   - Approve button (uses suggested priority)
   - Modify + Approve (select different priority from dropdown)
   - Reject button (with reason input)

States:
- `idle` — show order selector
- `loading` — spinner with "Consulting AI..."
- `recommendation_received` — show recommendation card + approval actions
- `fallback_active` — show recommendation card with orange "Rule-Based Fallback" banner
- `approved` — show success, offer to run allocation

---

### ImpactAnalyzer.jsx
Display:
- Run selector (latest two runs pre-selected)
- Summary: N orders changed, N improved, N degraded
- Changes table:
  - Customer | Product | Previous Allocated | Current Allocated | Δ | Previous Status | Current Status | Change Type
  - Color rows: green (improved), red (degraded), gray (unchanged)
- Filter: show only changed orders

---

### SimulationLab.jsx
Layout:
1. Scenario type selector (tabs or radio):
   - Inventory Increase / Decrease
   - Demand Surge
   - Supplier Delay
   - Priority Change

2. Scenario inputs form (changes based on type):
   - Inventory: product selector + quantity
   - Demand Surge: surge percentage
   - Supplier Delay: supplier + days delayed
   - Priority Change: order selector + hypothetical priority

3. "Run Simulation" button

4. Results panel (shown after run):
   - "⚠️ Simulation Only — No live data was modified" banner (always visible)
   - Side-by-side: Current Allocation vs Simulated Allocation
   - Affected orders highlighted
   - Explanation of changes

---

### Alerts.jsx
Display:
- Filter bar: severity, type, resolved status
- Alert cards:
  - Icon (by severity), Title, Description, Related product/order, Timestamp
  - "Mark Resolved" button
  - "View Related Order" / "View Product" link

---

### Replenishment.jsx
Display:
- Table: Product | Current Stock | Available | Reorder Point | Avg Daily Demand | Lead Time | Inventory Position | Risk | Suggested Reorder Qty
- Color-code risk: red (high), yellow (medium), green (low)
- "Estimates only — not financial advice" disclaimer banner
- Detail modal: shows the formula calculation for each product

---

## 7. Shared Components

### StatusPill.jsx
```jsx
function StatusPill({ status }) {
  const map = {
    fulfilled:           'bg-green-100 text-green-800',
    partially_fulfilled: 'bg-yellow-100 text-yellow-800',
    deferred:            'bg-red-100 text-red-800',
    pending:             'bg-gray-100 text-gray-600',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
      {label}
    </span>
  );
}
```

### PriorityBadge.jsx
```jsx
function PriorityBadge({ priority }) {
  const map = {
    critical: 'bg-red-500 text-white',
    high:     'bg-orange-400 text-white',
    medium:   'bg-blue-400 text-white',
    low:      'bg-gray-400 text-white',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${map[priority]}`}>
      {priority}
    </span>
  );
}
```

### AllocationExplanation.jsx
```jsx
function AllocationExplanation({ result }) {
  const icons = {
    fulfilled:           '✅',
    partially_fulfilled: '⚠️',
    deferred:            '❌',
  };
  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[result.status]}</span>
        <div>
          <p className="font-medium text-gray-900 mb-1">Allocation Decision</p>
          <p>{result.explanation}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Requested: {result.requested_quantity} units</span>
            <span>Allocated: {result.allocated_quantity} units</span>
            <span>Priority: <PriorityBadge priority={result.approved_priority} /></span>
            <span>Stock at run time: {result.stock_at_allocation} units</span>
            {result.minimum_acceptable_quantity > 0 && (
              <span>Min acceptable: {result.minimum_acceptable_quantity} units</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### ImpactBadge.jsx
```jsx
function ImpactBadge({ changeType, delta }) {
  const map = {
    improved:        { cls: 'text-green-600', icon: '↑' },
    degraded:        { cls: 'text-red-600',   icon: '↓' },
    unchanged:       { cls: 'text-gray-400',  icon: '—' },
    newly_fulfilled: { cls: 'text-green-700', icon: '★' },
    newly_deferred:  { cls: 'text-red-700',   icon: '✕' },
  };
  const { cls, icon } = map[changeType] || map.unchanged;
  return (
    <span className={`font-semibold ${cls}`}>
      {icon} {delta > 0 ? '+' : ''}{delta !== 0 ? `${delta} units` : 'No change'}
    </span>
  );
}
```

---

## 8. Admin Sidebar Navigation

```
📊 Dashboard
📦 Products
🏭 Inventory
📋 Orders
⚡ Allocation Center      ← primary feature
🤖 AI Recommendations
📈 Impact Analyzer
🔬 Simulation Lab
🔔 Alerts
🔄 Replenishment
📉 Reports
```

---

## 9. Key UX Principles

1. **Every allocation result must show its explanation** — never just a status pill
2. **Simulations always show a yellow warning banner** — "No live data was modified"
3. **AI fallback must be visually distinct from real AI** — use orange banner, different icon
4. **Deferred orders must tell the customer why** — show the reason in plain English
5. **Priority badges must be color-coded consistently** throughout all views
6. **Stock levels use traffic-light colors** — red/yellow/green based on thresholds
7. **Loading states** — use spinners or skeletons for all async operations
8. **Error states** — show user-friendly error messages, never raw API errors
