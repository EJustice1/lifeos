# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeOS is a personal data analytics platform that consolidates financial, physical, professional, and digital health tracking into a unified system. Built on **Next.js (Vercel)** with **Supabase** as the backend.

## Technology Stack

- **Frontend:** Next.js with TypeScript
- **Backend/Database:** Supabase (PostgreSQL with auth and real-time)
- **Deployment:** Vercel
- **External Integrations:** RescueTime API, banking APIs

## Architecture

**Split-Personality Interface:**
- **Mobile routes** (`/mobile/*`): Data entry focused - large buttons, auto-calculations, sliders. Optimized for speed.
- **Desktop routes** (`/desktop/*`): Analytics focused - dashboards, charts, historical review. "Mission Control" experience.

**Feature Modules:**
1. Financial Health - Net worth tracking, bank sync, cash flow
2. Gym & Physical Health - Workout logging, volume/PR tracking, streaks
3. Career & Student Life - Dynamic buckets for classes/projects, heatmaps
4. Digital Wellbeing - RescueTime integration, productive vs distracted time
5. Daily Review - EOD wizard, subjective metrics, journaling
6. Analytics - Correlation engine, spike charts, radar charts

## Supabase Configuration

Production URL: `https://tixxuowsywximpcsngbw.supabase.co`

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm test             # Run tests
```

## Key Design Principles

1. **Mobile-first for data entry** - Minimize friction for real-time logging
2. **Growth mindset** - Focus on upward trends and streaks, not punitive metrics
3. **Correlation insights** - Cross-domain analysis (e.g., phone usage vs gym consistency)
4. **Context-aware routing** - Environment-specific URLs (e.g., gym module at gym)
