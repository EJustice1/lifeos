# LifeOS

A unified personal operating system for tracking, analyzing, and optimizing life through objective metrics and effort-based growth.

## Why I Built This

I was tired of having my life scattered across different apps. My workout logs lived in one place, my study time in another, my daily reflections in yet another. **App data silos prevented me from seeing the bigger picture**—the patterns that connect how I train, how I work, and how I feel.

LifeOS isn't just another productivity app. It's my answer to a simple question: *What if I could build an "operating system" for my life that unifies all my personal data in one place?*

The name says it all—this isn't meant to be a single app, but a comprehensive suite that brings together everything I do. The goal is to collect enough unified data over time to discover patterns I'd never see otherwise. Does workout consistency correlate with study performance? How does my execution quality on one habit affect another? I can't answer these questions with siloed apps.

## Philosophy

I built LifeOS around a few core principles that guide how I think about personal growth:

### Effort Over Outcomes
Results are lagging indicators. I focus on the inputs I can control: time spent, daily consistency, execution quality. These are the leading indicators that compound into success over time.

### Objective Context
I wanted to ground my daily reviews in measurable data, not just feelings. By tracking objective metrics—workout volume, study hours, execution scores—I can look back at my day with real context.

### Friction Reduction
Consistency beats perfection. I designed the daily review system to be as frictionless as possible. Quick check-ins, minimal typing, maximum insight.

### Execution Tracking
Here's something most apps miss: it's not enough to log *that* you did something. **How well did you execute it?** Did you show up at 80% effort, or did you bring your A-game? LifeOS tracks subjective execution quality alongside objective metrics, because both matter.

## Current Features

### 🏋️ Gym Tracker
- Exercise logging with a library of predefined exercises
- Muscle group targeting and balance visualization (radar charts)
- Personal records and progressive overload tracking
- Execution quality ratings—track how well you felt each workout went
- Volume tracking and performance analytics

### 📚 Study Timer
- Session tracking with time investment monitoring
- Career goal alignment
- Focus quality and execution metrics
- Consistency streaks

### 📝 Daily Context Review
This is where everything comes together. Each day, I ground my reflection in objective data:

- **Context Snapshots**: What actually happened today?
- **Goals Tracking**: Today's goals and planning tomorrow's
- **Internal State**: How I felt, energy levels, mindset
- **Review Summaries**: Synthesizing the day with real metrics
- **Screen Time & Digital Habits**: Tracking time sinks and distractions

The daily review is designed for maximum consistency—quick, structured, and grounded in the data I've already logged.

## Tech Stack

This is a mobile-first progressive web app built with modern tools:

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: Supabase (PostgreSQL + Authentication + Real-time subscriptions)
- **Styling**: TailwindCSS 4
- **Charts**: Chart.js for progress visualization
- **Animations**: react-spring + use-gesture for native-feeling mobile interactions
- **Type Safety**: TypeScript throughout
- **Mobile Experience**: PWA-enabled with haptic feedback and gesture controls

### Architecture Highlights

- **Unified Session Management**: `useUnifiedSession`, `useGymSession`, and `useStudySession` hooks that handle real-time state, optimistic updates, and session recovery
- **Execution Validation System**: Custom validation for tracking subjective quality metrics alongside objective data
- **Smart Caching**: Performance optimizations with a dedicated cache layer
- **Session Recovery**: Uses session storage to recover in-progress sessions across page reloads
- **Mobile-First Components**: Custom inputs, sliders, and gesture handlers optimized for touch

## Future Roadmap

The vision extends far beyond what exists today:

- [ ] **Automated Screen Time Tracking**: Pull data directly from device usage
- [ ] **Finance Tracking**: Spending patterns, savings rate, financial health
- [ ] **Sleep Monitoring**: Sleep quality, consistency, recovery metrics
- [ ] **Cross-Domain Pattern Recognition**: The real magic—finding correlations across all life domains
- [ ] **Advanced Analytics Dashboard**: Visualizing long-term trends and insights

## Getting Started

**Note**: This is a personal project I actively use every day. It's optimized for my specific workflow and is not intended as a production SaaS product. That said, the code is public for reference and learning.

### Prerequisites

- Node.js 20+ and npm
- Git
- A Supabase account (free tier works great)

### Complete Setup Guide

#### 1. Clone the Repository

```bash
git clone https://github.com/EJustice1/lifeos.git
cd lifeos
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Supabase

**Create a new Supabase project:**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and wait for setup to complete

**Get your Supabase credentials:**
1. In your Supabase project dashboard, go to Settings → API
2. Copy your `Project URL` and `anon public` key

#### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Create the environment file
touch .env.local
```

Add the following variables (replace with your actual Supabase credentials):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 5. Run Database Migration

**Option A: Using Supabase Dashboard (Recommended for first-time setup)**

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase/migrations/100_comprehensive_schema.sql`
3. Paste into the SQL Editor and click "Run"
4. Verify all tables were created in the Table Editor

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (you'll need your project reference ID from dashboard)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

#### 6. Enable Authentication

In your Supabase project dashboard:
1. Go to Authentication → Providers
2. Enable "Email" provider
3. (Optional) Configure any additional providers you want

#### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your mobile device or browser.

#### 8. Create Your First User

1. Navigate to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Sign up with your email
3. Check your email for the confirmation link (Supabase sends this automatically)
4. Click the confirmation link to verify your account
5. Sign in and start using LifeOS!

### Deployment

This project is deployed on [Vercel](https://vercel.com), which provides seamless Next.js deployments with zero configuration.

**To deploy your own instance:**

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

Vercel will automatically deploy on every push to your main branch.

### Additional Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

### Troubleshooting

**Database connection issues:**
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active and not paused

**Migration errors:**
- Ensure you're running the migration on a fresh database
- If you have existing tables, you may need to drop them first

**Authentication not working:**
- Confirm the Email provider is enabled in Supabase
- Check that your site URL is configured correctly in Supabase → Authentication → URL Configuration

## Project Status

- ✅ **Active Development**: I use this every single day and continuously iterate
- ✅ **Mobile-First**: Optimized for iOS/Android web browsers (add to home screen for best experience)
- ⚠️ **Personal Tool**: Built for individual needs, not production use for others

## License

Copyright © 2026 Ethan Justice. All rights reserved.
