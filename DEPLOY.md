# Deployment Runbook 🚀

Follow this guide to deploy Level Up Chad to production.

## 1. Prerequisites (Manual Step)

1.  **Supabase**: Create a new project at [database.new](https://database.new)
    *   Note down the `Project Ref` (e.g., `abcdefghijklm`)
    *   Note down the `Database Password`
    *   Go to Settings -> API and copy:
        *   `Project URL`
        *   `anon public` key
        *   `service_role` key (keep secret!)

## 2. Environment Setup

Copy the template and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with the keys from step 1
```

## 3. Database Migration (CLI)

Use the helper script to link and push schemas:

```powershell
./scripts/supabase-init.ps1 -ProjectRef <your-ref>
# Enter password when prompted
```

Or manually:
```bash
supabase link --project-ref <your-ref>
supabase db push
```

## 4. Seed Data (CLI)

Populate the initial actions catalog:

```bash
npm run db:seed
```

## 5. GitHub & Vercel

1.  Push code to GitHub.
2.  Import project in Vercel.
3.  **Environment Variables**: Add the following in Vercel Project Settings:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (if using server-side admin logic later)

## 6. Verification

1.  Visit your Vercel URL.
2.  Sign up/Login (Supabase Auth magic link).
3.  Verify the `/today` dashboard loads.
4.  Check `/shop` and `/quests` load data.

## Common Pitfalls

*   **RLS Errors**: If you can't see your data, check Supabase RLS policies. The migrations should have covered this, but verify `auth.uid() = user_id`.
*   **Redirects**: Ensure `Site URL` and `Redirect URLs` in Supabase Auth settings match your Vercel domain.
