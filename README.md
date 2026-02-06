# Level Up Chad 🚀

Gamified habit tracker. Become the best version of yourself.
Built with Next.js 15, Supabase, Tailwind, and shadcn/ui.

## 🛠 Setup

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # For seeding/admin scripts only
```

### 2. Database Migration
Apply the migrations to your Supabase project. copy the contents of `supabase/migrations/0000_init.sql` and run it in the Supabase SQL Editor.

### 3. Seed Data
Populate the initial actions catalog:

```bash
npx tsx scripts/seed-actions.ts
```

### 4. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

## 🎮 Game Engine (Phase 2)
The core loop is now active.
- **XP Formula**: Base * Intensity * DiminishingReturn * StreakMultiplier
- **Streak**: Calculated from last 30 days of activity. +5% multiplier per day (Max 2.0x).
- **Diminishing Returns**: 1st action (100%), 2nd (60%), 3rd (30%), 4th+ (10%).

## 📦 Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Environment Variables in Vercel.
3. Deploy!

## 🧪 Testing

```bash
npm test
```
