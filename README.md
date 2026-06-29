# Ahlu Saada Meelad Fest

Production-oriented registration and festival management system built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Local setup

1. Copy `.env.example` to `.env.local` and add your Supabase project values.
2. Apply the SQL files in `supabase/migrations` using the Supabase CLI or SQL editor.
3. Run `npm install`, then `npm run dev`.

Implemented product slices now include:

- Public landing page and validated participant registration with duplicate protection
- Secure server-generated IDs and hashed six-digit access codes
- Rate-limited participant login with opaque, revocable HTTP-only sessions
- Mobile participant dashboard and fixed Home / Programs / Submit navigation
- Eligibility-filtered, date-controlled programme selection with transactional server enforcement
- Google Form prefilling, form-open tracking, and participant submission claims
- Group and coordinator WhatsApp actions without exposing access codes
- Server-generated registration and hall-ticket PDFs
- Supabase Auth staff login, forced temporary-password replacement and protected admin routes
- Admin dashboard, paginated programme and participant directories, manual verification queue
- Filter-aware participant/programme CSV exports with export audit logging
- RLS-enabled relational schema and participant workflow database functions

Apply every migration in `supabase/migrations` in filename order.

## Initial admin

After applying migrations, temporarily export the four `INITIAL_ADMIN_*` values shown in `.env.example` along with your Supabase URL and service-role key, then run `npm run setup:admin`. The password is never committed, the created profile has the `admin` role, and password replacement is required at first login. Remove the temporary environment variables immediately afterward. Staff login is available at `/staff/login`.

## Completed staff and operations features

- Transactional individual and balanced group allocation with preview
- One-time coordinator credentials, forced password replacement, and group-scoped coordinator portal
- Coordinator verification and restricted participant contact editing
- Registration rules/settings controls and audit logging
- Participant access-code reset with immediate session invalidation and one-time display
- CSV, styled Excel and paginated PDF participant/programme reports with active filters
- Core rule tests covering age/category boundaries, registration IDs, phone validation, eligibility, limits, selection dates and Google Form prefill
- Public registration rate limiting, security headers and deployment guidance

Production deployment instructions are in `docs/DEPLOYMENT.md`. Apply all migrations through `202606230005_public_rate_limits.sql` before exercising these features.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
