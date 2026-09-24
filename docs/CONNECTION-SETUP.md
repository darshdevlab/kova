# Kova connection setup

Verified on 2026-09-24. Account access is not the same as an implemented product integration.

## Hosting

- Repository: https://github.com/darshdevlab/kova
- Vercel team: `darsh-s-team`
- Vercel project: `kova`, linked to the repository.
- Production URL: https://kova-rho-opal.vercel.app
- Initial prototype deployment succeeded; public HTTP check returned 200.
- Supabase public URL, publishable key, and production app URL are configured in Vercel.
- OpenRouter remains local only. Do not enable a shared funded key in production until the chat endpoint verifies real authentication and enforces usage limits.

## Supabase

- Organization: Darsh Org (`asvmkiuvlgtkbpfjhpmv`).
- Dedicated project: `kova` (`rdcjmsiehmbsymsuzobq`).
- Region: Mumbai (`ap-south-1`).
- Creation quote: $0/month, explicitly approved by the user.
- Project reported `ACTIVE_HEALTHY` after creation.
- Public configuration added to ignored `.env.local`; no secret belongs in Git.
- Existing DarshOS and DarshLearningOS were not changed.
- Database schema has not been applied. Cloud persistence is not connected to the local workspace yet.
- Dashboard sign-in confirmed and Google provider enabled with approved credentials. Auth settings API returned HTTP 200 with `external.google: true`.
- Dashboard warns that Darsh Org exceeded its previous billing-cycle quota and may be restricted from 13 October 2026 if it remains over quota. No billing changes made.

## Google sign-in

- Google Cloud display name: Kova.
- Project ID: `fast-way-509617-k7`.
- Consent screen created with External/testing audience and approved support/contact email.
- Web client created with explicit approval; client secret entered directly into Supabase, not committed or displayed in chat.
- Client ID: `543027615871-gc4h4pnqe2pq80kde76a4kcu8m3qngtb.apps.googleusercontent.com`.
- JavaScript origin: https://kova-rho-opal.vercel.app
- Provider callback: https://rdcjmsiehmbsymsuzobq.supabase.co/auth/v1/callback
- Site URL is the production URL. Exact `/auth/callback` URLs are allowlisted for production, `http://localhost:3100`, and `http://127.0.0.1:3100`; no wildcards.
- Approved Google test user added. App remains External/testing, not publicly published.
- Implemented Google sign-in, server-side PKCE exchange, verified-user completion, callback failure recovery, and Supabase sign-out.
- Live production Google consent completed with explicit approval and returned successfully to `/projects` on 2026-09-24.
- All 18 desktop/mobile tests passed; the six auth cases cover missing/denied callbacks, missing sessions, and PKCE handoff. Auth cases were rerun after the final error-rendering adjustment and passed. Lint passed.
- Project data remains local: Google login does not imply cloud workspace persistence or authorization of future backend features.

## GitHub App

- Registered name: Kova by Darsh, explicitly approved because GitHub reserves Kova for @kova.
- App ID: `5063646`.
- Client ID: `Iv23liG9hgV4UqeIweG3`.
- Settings: https://github.com/settings/apps/kova-by-darsh
- Contents and Pull requests: read/write; Metadata: mandatory read.
- All other permissions remain unset. Installation restricted to the owner's account.
- Webhooks disabled until implemented; no placeholder endpoint registered.
- Private key generation was approved and GitHub shows a key was added, but Chrome blocked the download. No private key has been recovered or stored in Vercel. Do not generate duplicates without resolving this handoff.
- The app is not installed on a repository yet.
- GitHub integration backend remains to be implemented.

## Sandbox

- `vercel sandbox list` authenticated successfully and returned an empty list.
- No runtime was created and no sandbox compute test was run.
- Runtime execution and its application integration are not yet verified.
