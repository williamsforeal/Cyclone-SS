# THE BOMB ECOM OS - Marketing Operations Dashboard

## Overview

THE BOMB ECOM OS is a Marketing Operations Dashboard designed for DTC (Direct-to-Consumer) brands, featuring a modern fintech aesthetic. Its primary purpose is to streamline and optimize marketing workflows, from research and ad generation to creative management and campaign analytics. Key capabilities include a research pipeline for competitive analysis, a context-aware ad copy generator that leverages concept performance, and a creative lab with bulk approval functionalities. The system aims to provide a centralized platform for managing all aspects of digital advertising for DTC brands.

## User Preferences

Preferred communication style: Simple, everyday language.
No emojis in UI or data.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: `wouter`
- **UI Library**: shadcn/ui components (new-york style) built on Radix UI primitives
- **Styling**: TailwindCSS with CSS custom properties for theming (dark mode default)
- **State Management**: React Query for server state
- **Charts**: Recharts for data visualization
- **Forms**: react-hook-form with zod resolvers
- **Command Palette**: Ctrl+K quick navigation using `cmdk`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Design**: Dark purple/black futuristic aesthetic (default dark mode), teal/blue primary accent (hsl 199 72%), pale yellow (#E6DD85) for metrics/accent. Body font: Poppins, Heading font: Montserrat, Mono: JetBrains Mono (for data values).

### Backend

- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx`
- **Architecture**: Monolithic Express server serving API routes + Vite SPA
- **Airtable Client**: Centralized in `server/lib/airtable.ts` with CRUD helpers, rate limiting (exponential backoff), batch updates (10 records max), and health check
- **API prefix**: All backend routes use `/api/` prefix

### Data Storage

- **Primary Database**: Airtable for ad concepts, images, products, avatars, angles, and hooks.
- **Secondary Database**: PostgreSQL for Product Research module (product_candidates, competitor_intel tables), trend_items, product_criteria_checks, and uploaded_media metadata.

### Core Features

- **Research Pipeline**: Product candidate sourcing, avatar definitions, persuasion angle library, hook patterns library.
- **Ad Generator**: Research-backed 3-step flow: select product + avatar, auto-recommendations, generate via n8n.
- **Creative Lab**: Dynamic filters, bulk actions, image gallery, ad concept generation, and ad cloning functionalities.
- **Operations**: Order queue, fulfillment tracking, support tickets, inventory management, supplier performance.
- **Analytics**: Financial, creative performance, and product performance dashboards.
- **Automations**: n8n workflow management, job tracking, and execution logs.
- **AI Agency**: Client project management, service catalog, templates, and case studies.

### Build System

- **Dev**: `npm run dev` (tsx server/index.ts with Vite middleware)
- **Build**: `npm run build` (Vite client build + esbuild server bundle)
- **Start**: `npm start` (`dist/index.cjs`)

## External Dependencies

- **Airtable**: Primary database for marketing content and concepts.
- **n8n**: Automation engine for workflows, including ad concept generation, asset generation, research ingestion, metrics pull, and campaign launches.
- **CloudFront (S3)**: For storing and serving images (d3u0tzju9qaucj.cloudfront.net).
- **AWS S3**: Used for templates/ and renders/ prefixes for creative assets.
- **Open-Meteo API**: For fetching weather data displayed on the Overview page.