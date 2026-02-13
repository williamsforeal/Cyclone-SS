# Replit Agent Prompt — Bomb Ecom OS UI Expansion

## Context

I'm building "THE BOMB ECOM OS" — an AI-powered ecommerce ad creative platform. The app is a React + TypeScript + Vite project using Tailwind CSS, shadcn/ui components, React Router, and TanStack Query. It uses a dark theme (class-based dark mode). The sidebar currently has "Generator" and "Library" nav items.

I want to expand the UI to add the features described below. **This is UI-only — no backend integration yet.** Use mock data, placeholder states, and dummy handlers everywhere. Every button, dropdown, and interaction should be wired to local React state so the UI is fully interactive and demonstrable, but no API calls should be made. Where an API call would eventually go, leave a clear `// TODO: API call` comment.

## Current Tech Stack (do not change these)
- React 18 + TypeScript
- Vite
- Tailwind CSS (dark mode via `class`)
- shadcn/ui components (already installed: Button, Select, Input, Label, Tabs, Card, Dialog, Tooltip, Toast, Badge)
- React Router v6 (BrowserRouter in App.tsx)
- TanStack React Query
- Lucide React icons
- Inter font (sans), JetBrains Mono (mono)

## Design System (already established)
- Background: `bg-background` (dark navy ~#0a0e1a)
- Cards: `bg-card` with `border-border` borders
- Primary accent: indigo/purple (`bg-primary`)
- Status colors exist: draft, copy-ready, rendering, asset-ready
- Section headers use: `text-sm font-semibold uppercase tracking-wider text-muted-foreground`
- Compact, dense UI — not bubbly or oversized. Professional SaaS aesthetic.

---

## TASK 1: Expand Sidebar Navigation

Update `src/components/layout/AppLayout.tsx` to add these nav sections with proper grouping:

```
Research Pipeline (collapsible group)
  ├── Products
  ├── Avatars
  ├── Angles
  └── Hooks / Tags

Ad Generator (current "/" route — rename from "Generator")

Creative Lab (new section)
  ├── Ad Concept (new)
  └── Ad Clone (new)

Campaigns (placeholder)
Winning Ads (placeholder)
Library (existing "/library" route)

Operations (collapsible group)
  ├── Automations
  └── Analytics

Settings (placeholder)
```

Use lucide-react icons for each item. Collapsible groups should use a chevron that rotates on toggle. The sidebar should expand from icon-only (w-16) to full labels (w-56) on large screens (already implemented, keep this behavior). Placeholder routes should navigate to a simple "Coming Soon" page component.

---

## TASK 2: Research Pipeline Pages (UI shells with mock data)

### 2a. Products Page (`/products`)

A table/grid view of products. Each product card shows:
- Product image thumbnail (use a placeholder gray box with a Package icon)
- Product name
- Status badge (Draft / Active / Archived)
- Number of ads generated from this product
- "Analyze" button and "Edit" button

Include an "Add Product" button in the top-right that opens a Dialog/modal with fields:
- Product Name (text input)
- Product URL (text input)
- Product Image (file upload zone — just the UI, drag & drop area with Upload icon)
- Product Description (textarea)
- Product Highlights (textarea, placeholder: "Auto-generated after analysis")
- Ideal Customer (textarea, placeholder: "Auto-generated after analysis")
- Pain Points (textarea, placeholder: "Auto-generated after analysis")
- An "Analyze with AI" button (disabled state with sparkle icon, tooltip: "Connects to Claude Vision API")

Mock 2-3 products in local state. One of them should be "PalmAura Hand Massager" with status "Active."

### 2b. Avatars Page (`/avatars`)

A grid of avatar cards (2-3 columns). Each card shows:
- Avatar name (e.g., "The Desk Warrior")
- Subtitle/archetype (e.g., "The Modern Industrial Athlete")
- Short description (2 lines max)
- Tags showing key traits (e.g., "Tech Worker", "RSI Fear", "Ages 28-42")
- Number of ad copies using this avatar
- Edit and Delete icon buttons

Mock 4 avatars:
1. "The Desk Warrior" — Remote professionals, RSI fear, 28-42
2. "The Stubborn Provider" — Manual laborers, pride-driven, 40-60
3. "The Aging Independent" — Seniors, independence loss, 55+
4. "The Creator/Gamer" — Gamers & artists, performance anxiety, 18-35

Include an "Add Avatar" button that opens a creation dialog.

### 2c. Angles Page (`/angles`)

Similar grid layout. Each angle card shows:
- Angle name (e.g., "Visceral Symptom")
- Category badge (Pain-Based / Solution-Based / Identity-Based / Anti-Alternative / Social Proof)
- Example hook preview (truncated to 1 line)
- Performance indicator (placeholder: "Not tested" badge or mock CTR percentage)

Mock 5 angles:
1. "Visceral Symptom" (Pain-Based) — "Does your wrist feel like it's rusting shut by 3 PM?"
2. "Identity Mirror" (Identity-Based) — "Your hands are your livelihood."
3. "Mechanism Reveal" (Solution-Based) — "Why warm compression does what ice never could."
4. "Anti-Competitor Wedge" (Anti-Alternative) — "Stop settling for painful rollers."
5. "Social Proof Stack" (Social Proof) — "Join 2,400+ customers who reclaimed their grip."

### 2d. Hooks / Tags Page (`/hooks`)

A searchable, filterable list of hooks and tags. Simple table layout:
- Hook text
- Type tag (Question / Statement / Pattern-Interrupt / Testimonial / Demonstration)
- Associated Angle
- Associated Avatar
- "Copy" button (copies text to clipboard)

Mock 8-10 hooks from the PalmAura research. Include a search input at the top and filter dropdowns for Type and Avatar.

---

## TASK 3: Creative Lab — Ad Concept Page (`/creative-lab/concept`)

This is the main new feature. Model it after the Shopify "Ad Concept" tool (reference screenshots provided). The page has two main sections side by side on desktop (stacked on mobile):

### Left Panel: "Set up your ad concept"

**Step 1: Select Product Image**
- A clickable card/zone that says "Select product image" with a refresh icon
- When clicked, opens a modal showing available product images (mock 2-3 thumbnails from Products)
- Selected image shows as a thumbnail with an X to deselect
- Below the image: a "+" button to "Add reference ad" (for Ad Clone feature — just the UI zone for now)

**Step 2: Select Concept Direction**
- A clickable card/zone that says "Select concept direction" with a gear/settings icon
- When clicked, shows a modal or inline selector with concept direction cards:
  - "Bold Claim" — Icon: Megaphone, Description: "Make a strong product claim that demands attention"
  - "Storytelling" — Icon: BookOpen, Description: "Connect through narrative and emotion"
  - "Social Proof" — Icon: Users, Description: "Lead with customer results and testimonials"
  - "Problem/Solution" — Icon: Crosshair, Description: "Agitate the pain, then present the fix"
  - "Comparison" — Icon: GitCompare, Description: "Position against alternatives and competitors"
- Selected direction shows as a highlighted card

**Step 3: Creative Preferences (bottom of left panel)**
- Aspect Ratio dropdown: 1:1, 9:16, 4:5, 16:9
- Number of concepts dropdown: 1 creative, 3 creatives, 5 creatives
- Style toggle (optional): with a brand name dropdown (mock: "Abundria", "Minimal", "Bold")

**Generate Button**
- Full-width teal/primary button at the bottom: "Generate ⚡ 5" (number matches concept count)
- Disabled state until product + direction are both selected
- On click, simulate a loading state (spinner for 2 seconds), then show mock results in the right panel

### Right Panel: "How Ad Concept works" / Results

**Before generation:** Show an empty state with sparkle icon and text: "Select a product and concept direction, then hit Generate."

**Analysis Section (appears after "generation"):**
- "Analyzed in 3s" badge in the top-right
- **Product Highlights** — bullet list (auto-filled from product data), with an "AI suggestions" link
- **Ideal Customer** — text block describing target demo
- **Pain Point** — text with "More options >" link
- **Need** — text with "More options >" link

**After generation (below analysis):**
- Show generated concept cards in a grid. Each card:
  - A placeholder image area (gray gradient with a Sparkles icon, text: "AI Image Preview")
  - Headline text overlay preview
  - Body text preview (truncated)
  - CTA button text
  - "Edit" and "Save to Library" buttons
  - Small badge showing the concept direction used

---

## TASK 4: Creative Lab — Ad Clone Page (`/creative-lab/clone`)

This page lets users upload a reference ad and clone its style for their product.

### Layout: Two-column

**Left Column: Setup**

**Step 1: Product Image**
- Same product image selector as Ad Concept page (reuse the component)

**Step 2: Reference Ad Upload**
- Drag & drop zone: "Drop a reference ad here or click to upload"
- After upload, show the image preview with an X to remove
- Below the preview: "Analyzed in 9s" badge (mock)

**Step 3: Customize Your Ad Text**
- Show the "original" text on the left, "adapted" text on the right with arrow (→) between them
- Fields (each showing original → adapted):
  - **Headline:** e.g., "Tangy Love AFFAIR" → "Soothing Self AFFAIR"
  - **Body Text Line 1:** e.g., "A ZESTY TWIST FOR YOUR ROMANTIC SIPS." → "A SMART TWIST FOR YOUR WELLNESS RITUAL."
  - **Body Text Line 2:** e.g., "20% OFF" → "20% OFF"
  - **Body Text Line 3:** e.g., "ON ALL LEMON DRINKS FOR COUPLES!" → "ON ALL HAND MASSAGERS FOR SELF-CARE!"
  - **Call to Action:** e.g., "VISIT US TODAY" → "SHOP NOW TODAY"
- Each "adapted" field should be an editable text input so users can tweak the AI suggestions

**Creative Preferences:** Same as Ad Concept (aspect ratio, brand style, count)

**Generate Button:** "Generate 🔥 5"

**Right Column: Preview**
- Before generation: empty state
- After generation: show mock ad creative cards with the cloned style

---

## TASK 5: Update Ad Generator Page

The existing Ad Generator at `/` (now at `/ad-generator`) should be updated:

### Expand the sidebar selections to match the new data model:

**Section 1: Select Product + Avatar**
- **Product (Required):** Dropdown populated from mock Products data
- **Avatar (Required):** Dropdown populated from mock Avatars data

**Section 2: Overrides + Options**
- **Angle Override:** Dropdown — "Auto (top-ranked)" + list of mock Angles
- **Format / Ad Type:** Dropdown — "None", "Static Image", "Carousel", "Short Video Script"
- **Visual Direction** checkbox
- **StoryBrand Mode** checkbox

Keep the existing "Generate Ad Copy" button and output section (copy display + A/B variant cards). The right panel should still show the placeholder: "Select a product and avatar, then hit Generate."

Update the route from `/` to `/ad-generator` and make the default route redirect to `/ad-generator`.

---

## TASK 6: Shared Components to Create

### ProductImageSelector
Reusable component for selecting a product image. Used in Ad Concept, Ad Clone, and potentially Ad Generator.
- Props: `onSelect(productId: string)`, `selectedProductId?: string`
- Shows a grid of product thumbnails in a dialog

### ConceptDirectionSelector
Reusable selector for creative direction.
- Props: `onSelect(direction: string)`, `selected?: string`
- Shows cards with icons and descriptions

### CreativePreferences
Reusable bar for aspect ratio, count, and style.
- Props: aspect ratio, concept count, brand style — all controlled

### AdCreativeCard
Reusable card for displaying a generated ad creative result.
- Props: image URL (or placeholder), headline, body, CTA, direction badge, status
- Actions: Edit, Save to Library, Download (all mock)

### StatusBadge
Already exists — extend with new statuses if needed: "analyzing", "cloning", "generating"

---

## TASK 7: Mock Data Store

Create a `src/data/mockData.ts` file that exports all mock data used across pages:

```typescript
export const mockProducts = [...]; // 3 products including PalmAura
export const mockAvatars = [...]; // 4 avatars as described
export const mockAngles = [...]; // 5 angles as described  
export const mockHooks = [...]; // 10 hooks
export const mockConceptDirections = [...]; // 5 directions
export const mockGeneratedConcepts = [...]; // 5 mock generated ad concepts
export const mockBrandStyles = [...]; // 3 brand styles
```

This keeps all placeholder data in one place for easy replacement with real API data later.

---

## Important Implementation Notes

1. **No API calls.** Every interaction should work with local state and mock data. Leave `// TODO: Connect to [service]` comments where API calls will go.

2. **Maintain existing functionality.** The current Ad Generator page and Library page should continue to work. Just move the Ad Generator route from `/` to `/ad-generator`.

3. **Mobile responsive.** All new pages should stack to single column on mobile. The sidebar behavior (icon-only on small screens) should be preserved.

4. **Loading states.** When "Generate" buttons are clicked, show a realistic loading sequence: spinner → "Analyzing product..." → "Generating concepts..." → show results. Use `setTimeout` to simulate the delay (2-3 seconds).

5. **Toast notifications.** Use the existing toast system for actions like "Saved to Library", "Copied to clipboard", etc.

6. **Keep it production-quality.** This UI will be shown to potential partners/investors. It should look polished, not prototypey. Use proper spacing, consistent card styles, smooth transitions.

7. **Component organization:**
   - New pages go in `src/pages/`
   - Shared components go in `src/components/shared/`
   - Layout components stay in `src/components/layout/`
   - Mock data in `src/data/`

8. **Do not install new dependencies** unless absolutely necessary. shadcn/ui + Tailwind + Lucide should cover everything needed.
