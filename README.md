# 🏪 ViperView Frontend - React Inventory Management Dashboard

> **UGAHacks 11 Frontend** | React + TypeScript with AI-Powered Visualization

## 📋 Overview

This is the frontend client for ViperView, a retail inventory management system. Built with React and TypeScript, it provides an intuitive dashboard for managing inventory, visualizing stock levels, and viewing AI-powered analytics. The application features barcode scanning, real-time charts, and an interactive store floor map with urgency heatmaps.

**Development Approach**: This frontend was developed with a "vibe coding" methodology - rapidly iterating on design and UX while maintaining type safety and professional quality through TypeScript and Tailwind CSS.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI component library |
| TypeScript | 5.9 | Type-safe JavaScript |
| Vite | 7.2 | Fast dev server, HMR, bundling |
| Tailwind CSS | 4.1 | Utility-first CSS framework |
| Axios | 1.13 | HTTP client for API requests |
| react-router-dom | 7.13 | Client-side SPA routing |
| Recharts | 3.7 | Bar/pie chart visualizations |
| html5-qrcode | 2.3 | Camera-based barcode scanning |
| lucide-react | 0.563 | Corporate-style icon library |
| Inter (Google Fonts) | - | Clean professional typography |

## 🏗️ Architecture

```
Frontend (localhost:5173)          Backend (localhost:8080)          Database
┌─────────────────────┐           ┌───────────────────────┐        ┌──────────┐
│  React + Vite       │──proxy──▶ │  Spring Boot          │──JPA─▶│ Supabase │
│  Tailwind CSS       │           │  REST Controllers     │        │ Postgres │
│  Axios → /products  │           │  InventoryService     │        └──────────┘
│         /inventory  │           │  GeminiService        │──API─▶ Google Gemini
│         /analytics  │           │  SecurityConfig(CSRF) │
└─────────────────────┘           └───────────────────────┘
```

**Vite Proxy**: The dev server proxies `/products`, `/inventory`, `/analytics` to the backend at `localhost:8080`, avoiding CORS issues entirely.

## 📊 Data Models

### Product (src/types/Product.ts)
```typescript
export interface Product {
  id?: string;
  barcode: string;
  name: string;
  frontQuantity: number;
  backQuantity: number;
  wasteQuantity: number;
  reorderThreshold: number;
}
```

### Transaction (src/types/Transaction.ts)
```typescript
export interface Transaction {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  transactionType: "CHECKOUT" | "RESTOCK" | "WASTE" | "RECEIVE";
  quantity: number;
  location: string;
  createdAt: string;
}
```

### AIInsights (src/types/AIInsights.ts)
```typescript
export interface AIInsights {
  analysis: string;
  timestamp: string;
  transactionCount: number;
  productCount: number;
}
```

## 🔌 API Integration

### Centralized API Service (src/services/api.ts)

All 13 backend endpoints in one Axios client:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/products` | GET | List all products |
| `/products/barcode/{barcode}` | GET | Lookup by barcode |
| `/products` | POST | Add new product |
| `/inventory/checkout` | POST | Customer sale (decrements front) |
| `/inventory/restock` | POST | Move back → front shelves |
| `/inventory/receive` | POST | New stock into back storage |
| `/inventory/waste` | POST | Log damaged/expired (with FRONT/BACK location) |
| `/inventory/waste` | GET | All waste history |
| `/inventory/waste/{barcode}` | GET | Waste history per product |
| `/inventory/transactions/recent` | GET | Last 50 transactions |
| `/inventory/transactions/barcode/{barcode}` | GET | Transactions per barcode |
| `/inventory/transactions/product/{id}` | GET | Transactions per product ID |
| `/analytics/ai-insights` | GET | Gemini-powered AI analysis |

## 🧭 Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Main inventory dashboard |
| `/floorview` | FloorView | Interactive store map visualization |

`BrowserRouter` wraps the app in `main.tsx`. The `App` component renders `<Routes>` with two routes.

## 📁 File Structure (21 Source Files)

```
src/
├── main.tsx                          # Entry point, BrowserRouter wrapper
├── App.tsx                           # Routes + Dashboard page
├── index.css                         # Tailwind import + Inter font
├── App.css                           # Empty (cleaned)
├── services/
│   └── api.ts                        # Centralized Axios client (13 endpoints)
├── types/
│   ├── Product.ts                    # Product interface
│   ├── Transaction.ts                # Transaction interface
│   └── AIInsights.ts                 # AI insights interface
├── components/
│   ├── InventoryManager.tsx          # Scanner & action interface (427 lines)
│   ├── AnalyticsDashboard.tsx        # Charts, stats, activity feed (326 lines)
│   ├── AIInsightsCard.tsx            # Global Gemini AI insights (143 lines)
│   ├── AIPredictionCard.tsx          # Per-product AI forecast (377 lines)
│   ├── DonateModal.tsx               # Surplus donation flow (263 lines)
│   └── floorview/
│       ├── StoreCanvas.tsx           # SVG container + heatmap overlay (93 lines)
│       ├── StoreLayout.tsx           # SVG store floor plan (410 lines)
│       ├── ProductDot.tsx            # Interactive product dots (387 lines)
│       ├── ProductDetailModal.tsx    # Click-to-view product detail (265 lines)
│       ├── HeatmapOverlay.tsx        # Canvas urgency heatmap (75 lines)
│       ├── Legend.tsx                # Color legend + action counts (100 lines)
│       └── FloorFilters.tsx          # Filter controls (114 lines)
└── pages/
    └── FloorView.tsx                 # Floor map page controller (357 lines)
```

## 💡 Core Features

### 1. Navigation Bar
- **ViperView** branding with indigo logo
- "Donate Surplus" button (opens donation modal)
- "Overview Map" button (navigates to `/floorview`)
- Sticky header, responsive layout

### 2. Scanner & Actions (InventoryManager.tsx)
- **Text Input**: Barcode entry supporting USB scanners in keyboard mode
- **Camera Scanner**: `html5-qrcode` integration for mobile/laptop camera
- **Product Lookup**: Fetches product by barcode from backend
- **4 Action Buttons**:
  - **Checkout**: Customer sale, decrements front quantity
  - **Receive**: New stock in, adds to back storage
  - **Restock**: Moves units from back to front shelves
  - **Discard**: Logs waste with FRONT/BACK location picker
- **Quantity Picker**: Confirm/cancel flow
- **Real-Time Display**: Front / Back / Discard quantities
- **Feedback**: Success/error messages after each transaction
- **Auto-Refresh**: Dashboard updates after every action

### 3. AI Insights (AIInsightsCard.tsx)
- "Generate Insights" button triggers `/analytics/ai-insights`
- Backend sends all product + transaction data to Google Gemini API
- Gemini returns structured analysis:
  - **Key Insights**: Pattern detection
  - **Urgent Actions**: Critical items
  - **Optimization Tips**: Best practices
  - **Predictions**: Trend forecasting
- **Rendered as Markdown**: Bold headers, bullet lists
- **Metadata Display**: Timestamp, product count, transaction count
- **Loading State**: Animated brain icon

### 4. Analytics Dashboard (AnalyticsDashboard.tsx)
- **4 Stat Cards**: Units Sold, Restocked, Discarded, Total Transactions
- **Bar Chart** (Recharts): Inventory levels per product (Front / Back / Discard)
- **Pie Chart** (Recharts): Transaction type breakdown with percentages
- **Low Stock Alerts**: Red panel listing products below reorder threshold
- **Activity Feed**: Last 20 transactions with relative timestamps, color-coded icons

### 5. Per-Product AI Forecast (AIPredictionCard.tsx)
Embedded in every product card on the dashboard.

**Calculates**:
- **Checkout Velocity**: Sales per day
- **Days Until Front Empty**: Based on sales rate
- **Days Until Back Empty**: Based on restock rate
- **Waste Rate**: Waste / total throughput (%)

**Separated Front/Back Analysis**:
- Front low → "Restock from back storage (X available)"
- Back low → "Reorder from supplier"
- Critical = ≤50% of threshold

**Recommended Actions** with specific unit quantities:
- "Move X units from back to front for 7-day cover"
- "Order ~X units from supplier for 2-week cover"

**Color-Coded**:
- 🟢 Green (healthy)
- 🟡 Amber (low)
- 🔴 Red (critical)

### 6. Donate Surplus Modal (DonateModal.tsx)
- **Step 1**: Select from 5 local shelters (Athens, GA area) with address, phone, accepted items, distance
- **Step 2**: Select products with waste quantities, adjust donation amounts
- **Submit**: Confirmation screen with scheduled donation summary
- **Backdrop Blur**: Modal overlay

### 7. Product Inventory Grid (in App.tsx)
- **Responsive 3-Column Grid** of product cards
- **Each Card Shows**:
  - Name, barcode
  - Front/back/discard quantities
  - Reorder threshold
  - Status badge: "In Stock" (green) or "Low Stock" (red)
  - AI Forecast card embedded

### 8. Floor View Visualization (`/floorview`)

#### Page Controller (FloorView.tsx)
- Fetches all products, generates map positions
- **Auto-Refresh**: Every 15 seconds
- **Sidebar**: Legend, Filters, Summary stats
- **Edit Layout Mode**: Drag-and-drop product positioning
- **Positions Saved**: localStorage persistence
- **Reset Button**: Clear all positions

#### Store Layout (StoreLayout.tsx)
Full SVG floor plan (1000×700 viewBox) with:
- **Retail Floor**: Main area, 60% of space
- **Display Tables**: Circular fixtures
- **Dressing Rooms**
- **Accessories Display**
- **Back Storage**: Shelving racks
- **Break Room**
- **Supply Closet**
- **Checkout Counter**: Register
- **Restroom**
- **Entrance**: Emergency exit
- **Grid Lines**: Subtle

#### Product Dots (ProductDot.tsx)
**Separated Front/Back Stock Logic** (`getStockAdvice()`):
- Checks front quantity and back quantity independently against reorder threshold
- `needsRestock` = front low + back has units (move back → front)
- `needsReorder` = back low (order from supplier)
- Overall status = worst of the two

**Color-Coded**:
- 🟢 Green (`#22c55e`): Healthy
- 🟡 Yellow (`#eab308`): Low
- 🔴 Red (`#ef4444`): Critical

**Visual Features**:
- Inner dot size scales with stock ratio
- Pulse/glow animation on low (2s) and critical (1s) dots
- Indicator icons: ↻ for needs restock, ⬆ for needs reorder

**Hover Tooltip**:
- Product name + barcode
- Front status (color dot + "needs restock" if low)
- Back status (color dot + "needs reorder" if low)
- Total stock + overall status
- Action advice lines (indigo for restock, amber for reorder)

**Drag-and-Drop** (Edit Mode):
- Pointer capture for smooth dragging
- Screen-to-SVG coordinate transform
- Clamped to viewBox bounds
- Dashed ring indicator, name label above dot
- Ghost ring while dragging

#### Product Detail Modal (ProductDetailModal.tsx)
Click any dot to open detailed modal:
- **Stock Level Cards**: Color-coded per status (front/back independently)
- **Front Shelves Status**: With restock advice
- **Back Storage Status**: With reorder advice
- **Metrics**: Total stock, reorder threshold, capacity bar
- **Quick Action Buttons**: Sale, Receive, Restock, Discard

#### Heatmap Overlay (HeatmapOverlay.tsx)
- **Canvas-Based**: Radial gradient overlay
- **Urgency Visualization**: Areas near critical/low products glow warm colors
- **Critical**: Larger radius (80px), higher opacity (0.25)
- **Low**: Smaller radius (50px), lower opacity (0.12)
- **Purpose**: "Where should workers go first?" visualization

#### Legend (Legend.tsx)
- **Color Legend**: Healthy, Low Stock, Critical with counts
- **Actions Needed**:
  - "Needs Restock (Back → Front)" with count
  - "Needs Reorder (From supplier)" with count

#### Filters (FloorFilters.tsx)
- **Critical Only**: Show only critical products
- **Needs Restock**: Show only products needing back→front restock
- **Needs Reorder**: Show only products needing supplier reorder
- **Urgency Heatmap**: Toggle overlay
- **Zone Dropdown**: All zones, Retail Floor, Accessories, Back Storage

## 🧠 Smart Inventory Logic

**Core Insight**: Front stock and back stock are separate concerns.

| Situation | Status | Action |
|-----------|--------|--------|
| Front > threshold, Back > threshold | Healthy | No action |
| Front ≤ threshold, Back > 0 | Needs Restock | Move units back → front |
| Front ≤ threshold, Back = 0 | Critical | Reorder from supplier |
| Back ≤ threshold | Needs Reorder | Order from supplier |
| Front ≤ 50% threshold | Front Critical | Immediate restock |
| Back ≤ 50% threshold | Back Critical | Immediate reorder |

**Consistently Applied In**:
- `AIPredictionCard.tsx` (per-product dashboard cards)
- `ProductDot.tsx` (floor map dots, tooltips, indicators)
- `ProductDetailModal.tsx` (floor map click detail)
- `Legend.tsx` (floor map action counts)
- `FloorFilters.tsx` (floor map filter options)

## 🎨 Design System

### Color Palette
- **Slate**: Neutral backgrounds
- **Indigo**: Primary/checkout actions
- **Emerald**: Receive/healthy status
- **Amber**: Restock/warning status
- **Red**: Waste/critical status

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: 10-18px range
- **Labels**: Uppercase tracking

### Components
- **Rounded Corners**: xl
- **Borders**: Subtle
- **Hover**: Shadows
- **Modals**: Backdrop blur

### Icons
- **Library**: lucide-react (no emojis)
- **Corporate Style**: Professional

### Responsive
- **Grid**: Cols collapse on mobile
- **Labels**: Hidden on small screens

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend running at `localhost:8080`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ViperView-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Vite proxy**
   
   Ensure `vite.config.ts` proxies to your backend:
   ```typescript
   export default defineConfig({
     server: {
       proxy: {
         '/products': 'http://localhost:8080',
         '/inventory': 'http://localhost:8080',
         '/analytics': 'http://localhost:8080',
       }
     }
   })
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 📦 Available Scripts

- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🧪 Testing Strategy

- **Type Safety**: TypeScript interfaces catch errors at compile time
- **Component Modularity**: Each component independently testable
- **API Mocking**: Can mock `api.ts` for unit tests
- **Manual Testing**: Live reload for rapid iteration

## 🎯 Key Design Decisions

### 1. Centralized API Layer
- Single `api.ts` service for all endpoints
- Consistent error handling
- Easy to mock for testing

### 2. Type Safety Throughout
- TypeScript interfaces for all data models
- Props typed in all components
- Reduces runtime errors

### 3. Component Modularity
- 21 source files, each with single responsibility
- Easy to maintain and extend
- Reusable components

### 4. Vite Proxy Over CORS
- Proxies API calls during development
- Avoids CORS configuration headaches
- Simpler deployment setup

### 5. Smart Logic on Frontend
- Stock status calculations client-side
- Reduces backend load for UI rendering
- Enables real-time filtering without API calls

### 6. localStorage for Layout
- Persists floor map positions
- No backend storage needed for UI state
- Instant load on page refresh

## 📈 Performance Optimizations

- **Vite HMR**: Instant updates during development
- **Code Splitting**: React Router lazy loading
- **Memoization**: React hooks for expensive calculations
- **Debounced Search**: On barcode input
- **Auto-Refresh**: Strategic polling (15s on floor map)

## 🔮 Future Enhancements

- **WebSocket Integration**: Real-time updates without polling
- **Service Workers**: Offline support
- **PWA**: Installable mobile app
- **Advanced Filtering**: Multi-criteria product search
- **Export Features**: CSV/PDF reports
- **Dark Mode**: Theme toggle

## 📚 Learning Outcomes

This frontend represents rapid iteration with:
- React 19 modern patterns (hooks, functional components)
- TypeScript for type safety
- Tailwind CSS utility-first approach
- Recharts data visualization
- SVG-based interactive graphics
- localStorage state persistence
- Responsive design principles

---

**Built for UGAHacks 11** | **Vibe Coding Approach** | **TypeScript + Tailwind**
