# 🚀 MAGPIE Dashboard - Replit Setup Guide

## Quick Start (5 minutes)

### Option 1: Static HTML Version (Instant)
1. Go to [Replit.com](https://replit.com)
2. Create new Repl → **HTML, CSS, JS**
3. Copy the `magpie-dashboard.html` content
4. Paste into `index.html`
5. Click **Run** → Your dashboard is live!

### Option 2: React Version (Dynamic with Real Data)

#### Step 1: Create React Repl
```bash
# On Replit:
1. New Repl → "React" template
2. Name: "magpie-tracker"
```

#### Step 2: Install Dependencies
In Shell:
```bash
npm install axios recharts
```

#### Step 3: Add Your Files
1. Copy `MagpieDashboard.jsx` → `src/components/MagpieDashboard.jsx`
2. Copy the CSS from the HTML file → `src/components/MagpieDashboard.css`
3. Update `src/App.js`:

```javascript
import MagpieDashboard from './components/MagpieDashboard';
import './App.css';

function App() {
  return <MagpieDashboard />;
}

export default App;
```

#### Step 4: Connect to Your Live Data
Edit `MagpieDashboard.jsx`:

```javascript
// Replace line 75-77 with your Vercel endpoints:
const response = await fetch(
  'https://magpie-trend-tracker-98m1u07jn-jacobs-projects-ea0f37f6.vercel.app/api/magpie-data'
);
```

---

## 📊 Connect to Your Real Data

### Create API Endpoint in Vercel
Create `/api/magpie-data.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get latest product scores
  const { data: products } = await supabase
    .from('magpie_scores')
    .select('*')
    .order('opportunity_score', { ascending: false })
    .limit(10);

  // Get agent status (you can store this in Supabase too)
  const agents = [
    { name: 'Trend Miner', status: 'Active', metric: `${products.length} found` },
    // ... other agents
  ];

  // Get stats
  const stats = {
    productsAnalyzed: products.length,
    highScoreOpportunities: products.filter(p => p.opportunity_score > 80).length,
    activeTests: 3, // Get from your campaigns table
    avgScore: products.reduce((acc, p) => acc + p.opportunity_score, 0) / products.length
  };

  res.json({ stats, products, agents });
}
```

### Database Schema for Supabase
Run this SQL in Supabase:

```sql
-- Products discovered by MAGPIE
CREATE TABLE magpie_scores (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  opportunity_score INTEGER,
  margin DECIMAL(10,2),
  trending_platforms TEXT[],
  supplier_url TEXT,
  test_status TEXT DEFAULT 'pending',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity logs
CREATE TABLE agent_activity (
  id SERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  action TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test campaigns
CREATE TABLE test_campaigns (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES magpie_scores(id),
  platform TEXT, -- 'meta' or 'tiktok'
  budget DECIMAL(10,2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);
```

---

## 🔄 Auto-Update Dashboard with Real Data

### Add WebSocket for Live Updates
In your React component:

```javascript
useEffect(() => {
  // Connect to Supabase realtime
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const subscription = supabase
    .from('magpie_scores')
    .on('INSERT', payload => {
      console.log('New product found!', payload);
      setProducts(prev => [payload.new, ...prev]);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

## 🎨 Figma Design System

### Convert HTML to Figma:
1. Install "HTML to Figma" plugin in Figma
2. Copy your HTML file URL from Replit
3. Run plugin → Paste URL → Import
4. Auto-generates Figma components!

### Design Tokens for Figma:
```css
/* Color System */
--primary: #6366f1;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--bg-dark: #0a0e1a;
--bg-card: #1a1f2e;

/* Typography */
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;

/* Spacing */
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;
```

---

## 🚢 Deploy to Production

### Option 1: Keep on Replit
- Your Repl URL: `https://magpie-tracker.YOUR-USERNAME.repl.co`
- Always on: $7/month for 24/7 hosting

### Option 2: Export to Vercel
```bash
# Download from Replit
zip -r magpie-dashboard.zip .

# Upload to GitHub
git init
git add .
git commit -m "MAGPIE Dashboard"
git push

# Deploy with Vercel
vercel --prod
```

---

## 📱 Mobile Responsive
The dashboard is already mobile-optimized:
- Responsive grid layouts
- Touch-friendly buttons
- Collapsible navigation
- Swipeable tables

---

## Next Steps:
1. **Today**: Get the HTML version running on Replit
2. **Tomorrow**: Connect to your Supabase data
3. **This Week**: Add real-time updates from MAGPIE agents
4. **Next Week**: Launch your first automated product test!

---

## Need Help?
- Dashboard not loading? Check console for errors
- Data not showing? Verify API endpoints
- Styling broken? Make sure CSS is imported

Your dashboard URL will be:
`https://magpie-tracker.[your-replit-username].repl.co`

Share this URL to monitor MAGPIE from anywhere!
