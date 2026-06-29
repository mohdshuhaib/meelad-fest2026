# Production deployment

## Supabase

1. Create a production Supabase project in the closest suitable region.
2. Apply every file in `supabase/migrations` in filename order. Never apply `seed.development.sql` to production.
3. Copy the project URL, publishable/anon key and service-role key. The service-role key must only exist in server environment variables.
4. Run `npm run setup:admin` once with a strong temporary admin password, then remove every `INITIAL_ADMIN_*` variable.
5. In Authentication settings, set the production site URL and allowed redirect URLs to the Vercel domain.
6. Confirm RLS is enabled on every public table and that `anon` cannot select participant or staff data.

## Vercel

1. Import the repository and select the Next.js preset.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a random 32-byte `PARTICIPANT_SESSION_SECRET` to Production and Preview environments as appropriate.
3. Do not add any `INITIAL_ADMIN_*` variable to the permanent Vercel environment.
4. Deploy and run smoke tests for registration, both login types, PDF/XLSX exports, programme selection and verification.
5. Configure a custom domain and verify HTTPS before accepting registrations.

## Google Forms

For each programme, create Registration ID and Full Name as the first two questions. Generate a prefilled URL and copy only the numeric `entry.*` keys into programme settings. Prefilled values are editable and require manual verification.

## Production checklist

- Registration and programme-selection dates are correct in Asia/Kolkata.
- Admin and coordinator temporary passwords were replaced.
- Every coordinator sees only their assigned group.
- Google Form links and WhatsApp links open correctly.
- Database backups and Supabase point-in-time recovery are configured.
- Export logs and audit logs are being written.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Optional CAPTCHA/Turnstile should be enabled before a high-traffic public launch.
