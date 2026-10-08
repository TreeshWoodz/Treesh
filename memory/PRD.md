# Treesh — PRD

## Original problem statement
Treesh web app: massive single-file architecture (`/app/single_html/index.html`), zero build steps for users, offline-first via LocalStorage/IndexedDB. Do not use npm/yarn, do not touch /app/frontend or /app/backend. Served at preview root by `python3 -m http.server 3000 --directory /app/single_html`. Respond in English.

## Build workflow (user-approved)
- Never edit `index.html` directly. Author in `/app/memory/p9*.js|css`, then run `python3 /app/memory/patch_p9.py && python3 /app/memory/build_sbtest.py` (rebuilds index.html from `index.before_p9.html` + the `_sbtest.html` mock harness).
- Icons: `node /app/memory/build_icons.js` refreshes the embedded icon set when new lucide names are used.

## Architecture
- Vanilla JS SPA + Tailwind CDN, Web Audio, Web Speech, lrclib.net, datamuse, Open-Meteo.
- localStorage = settings/state; IndexedDB `treesh_media` (tracks = custom music, assets = fonts/backdrops).
- Supabase (optional accounts): `profiles` table, `user_data` table (settings backup), `avatars` bucket (public), `treesh-data` bucket (private, fonts/backdrops), `delete_user()` RPC. SQL in `/app/memory/supabase_setup.sql`.
- `/confirm-signup/index.html` shim → `/?route=confirm-signup` (+query/hash) → in-app confirmation screen.

## Implemented
- Earlier phases: Instrum DAW, Backdrops, Music Manager, Games, Image Studio, crossfade, karaoke stage, onboarding revamp, Supabase accounts (P9g).
- 2026-10 Phase 9 (this session):
  - Sync engine: max 1 push / 30s, quiet writes, fonts/backdrops only when changed, custom music never uploaded, no push before a profile exists.
  - Onboarding: Welcome → Create account / Sign in / Continue as guest; guest button turns into "Sign in / Create account" row; account row now swaps on step change. Avatar uploads to `avatars/<uid>/avatar.*` on sync.
  - /confirm-signup page (ok / already / expired / error, resend link, Return to Treesh, URL cleaned, no reload loops).
  - Delete account (type DELETE; removes storage files, rpc delete_user, local sign-out).
  - Flick-to-close: Now Playing + all sheets use recent velocity.
  - Voice: Siri-style full-screen glass + glowing orb, tap outside closes, "change theme to <color>" = accent, "dark/light mode".
  - Music Manager: glass studio 100dvh mobile / 92% desktop, drag-drop + card-per-file queue, editor inside the studio (old modals retired).
  - Lyric Studio desktop: rail player above Find lyrics; preview matches Now Playing.
  - Magic Markup "Select": per-element move/resize/hide/restyle + breadcrumbs, saved per page (not on Settings).
  - Bigger Weather/Date widgets on desktop; What's New entries.
  - Privacy Policy + Terms updated for Treesh accounts.
  - Tested: iteration_16.json (~92% pass, 1 LOW bug fixed after) + self-tests (Music Manager upload/edit, Lyric Studio rail, legal pages).

- Phase 9 (Oct 8, 2026): What's Next chat crew = main + featured (section labels) + credited (featuring/artistIds); featured artists use their own catalog pic (initials if not in catalog), show in header avatars/names, side panel "In the chat", all greet; round-1 audio unlocked via silent WAV in the tap. Arcade games all live, Updated "October 8, 2026". Support top nav shorter (56/50px, no safe-area pad in iframe). This or That turntables, studio header merge, playlist shuffle/picker, mini player look, perf mode, pull-to-refresh, settings merges built & verified (iteration_24.json, 100%).
- Note: index.html had been stale; always run `python3 /app/memory/patch_p9.py && python3 /app/memory/build_sbtest.py` after edits.

## Pending / Backlog
- User action: run `/app/memory/supabase_update_p9p.sql` in Supabase SQL editor (if supabase_social.sql already ran; else run supabase_social.sql). Earlier: supabase_setup.sql; add `https://treesh.app/confirm-signup**` to Supabase Auth Redirect URLs.
- On hold (user): Music Studio upload flow & sort UI; Image Studio text page merge with emojis.
- P1: Manual device check of flick-to-close (CDP touch is flaky in automation).
- P2: Configurable default homepage.
- P2: Vocotap & Nects stats (need game files), Instrum polish, Find Lyrics improvements.

## Testing notes
Seed: `localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}))`. Account flows: use `/_sbtest.html` (fake Supabase, see test_credentials.md).

## Request queue (Oct 8, 2026, in order)
1. New games: Bronze Blitz / Sonoko (/games/sonoku) / Ebonics: bios, ages (All / 6+ / 13+), logos + banners (+ Hoop logo/banner), arcade stats on profile, What's New updates on every page.
2. P0 bugs: double-tap, scrubber, lyric tap-to-seek, resume last song, profile sheet animates from the bottom nav on mobile.
3. P1: Urias polish, Zodiac flick-to-close.
4. LAST: update the Support page with detailed explanations + screenshots of everything.
