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
- Phase 9 (Oct 8, 2026, later): P0 fixes (double-tap, scrubber, resume, profile sheet anim; iteration_27). Lyric Themes (p9zp: Classic, Text Messages = wc-root chat w/ typing dots + read receipt, Neon, Typewriter, Notebook, Terminal, Comic, Polaroid; global + "Only for this song" pin; no box/background panel; Settings > Appearance) + Lyric Card styles (p9zq; Text Messages card has a permanent "Not real messages from <artist>" disclaimer). Singer (duet) colors now OFF by default, toggle in theme sheet. Starlites "New song discovered" repeat fixed (p9zm awardStars merge). Don't Get Caught LIVE (p9zr; mask 3D art, logo, banner in p9w_art/p9zm_art; 13+). Arcade filters + search + Notify me for future coming-soon games + open tracking (p9zr). Smart search redesign (p9zs: Top results, chips w/ counts, See all, recent/trending/jump-to, arrow+Enter nav, Ctrl+K and /, top panel desktop / bottom dock mobile). Support page + 8 new screenshots, What's New entries. Tested iteration_28 + iteration_29 (100%).
- Note: index.html had been stale; always run `python3 /app/memory/patch_p9.py && python3 /app/memory/build_sbtest.py` after edits.

## Repo workflow (from Oct 10, 2026, user's rule) — READ FIRST
- Source of truth = GitHub `treeshwoodz/treesh`, branch **main** (public; clone read-only). The user copies files to main by hand; the agent can't push (Save to GitHub pushes the whole workspace to EmergentTreesh).
- BEFORE every task: `python3 /app/memory/export_main.py --check` (pulls main into /tmp/treesh_main and flags files main changed since our last export). On a conflict, bring main's change into our sources first (index.html: port it into memory/p9* or index.before_p9.html; other files: take main's version into /app/single_html), never overwrite it.
- AFTER every task (built + tested): `python3 /app/memory/export_main.py` -> `/app/to_main/` (only the changed site files, in main's layout) + `/app/TO_MAIN_LIST.md` (new / replace / same / conflicts / not shipped). Tell the user to copy `to_main/` into main. Baseline hashes: memory/main_sync.json.
- Never ship memory, tests, _sbtest.html, template.html, yarn.lock, confirm-signup/ (main has confirm-signup.html), local content/songs|lyrics|icons|models (main has the real content/*.html).
- Main-owned, don't touch unless asked: tools/mad.html (M.A.D. v5.4, newer than memory/mad.src.html; patch_mad.py anchors don't match it any more), netlify/functions/github.mjs + link-check.mjs (M.A.D. proxy; its Icon accounts open PRs as icon/<artistId>/..., the same prefix icon.mjs reviews), netlify.toml, package.json (merge only: export_main.py keeps main's deps and adds ours), every other page on main.
- main's index.html uses CRLF line endings; we ship LF (export compares with CRLF stripped).
- Icon harness (tests/icon_dev.mjs) reads /tmp/live_{songs,lyrics,icons}.dot.html: copy them from /tmp/treesh_main/content/*.html.

## Pending / Backlog
- User action (push): copy /app/to_main/ into main (see /app/TO_MAIN_LIST.md); run `/app/memory/supabase_push.sql` in Supabase; Netlify env vars VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (NEW production pair given to the user in chat on Oct 10, stored nowhere in /app on purpose: the repo is public; the old pair in memory/tests/vapid_test_keys.json leaked and is test-only), SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY, PUSH_HOOK_SECRET (generated inside Supabase by supabase_push.sql; its last query shows it), optional VAPID_SUBJECT (mailto:); deploy index.html, version.json, sw-push.js, icons/badge-96.png, package.json, netlify/. Edit memory/release.json before a release to change the update push text.
- User action: run `/app/memory/supabase_update_p9p.sql` in Supabase SQL editor (if supabase_social.sql already ran; else run supabase_social.sql). Earlier: supabase_setup.sql; add `https://treesh.app/confirm-signup**` to Supabase Auth Redirect URLs.
- On hold (user): Music Studio upload flow & sort UI; Image Studio text page merge with emojis.
- P1: Manual device check of flick-to-close (CDP touch is flaky in automation).
- P2: Configurable default homepage.
- P2: Vocotap & Nects stats (need game files), Instrum polish, Find Lyrics improvements.

## Testing notes
Seed: `localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}))`. Account flows: use `/_sbtest.html` (fake Supabase, see test_credentials.md).

## Next up (queued from earlier requests)
- P1: Voice assistant mic deactivation bug; Zodiac modal flick-to-close (goes right instead of centering); Profile Space settings lost on sign-out/in.
- P2: Admin controls & moderation redesign; Music Studio modal header merge; Playlist & Library UI redesign; Magic Markup for the mini player; hide #app-shell behind full-screen modals on mobile (perf).

## Oct 9, 2026 session (in order)
1. DONE favicon/home-screen icons: `memory/build_favicons.py` -> single_html/favicon.ico, apple-touch-icon.png, icons/*.png (v=7255), static manifest.webmanifest; one-time iOS Home Screen note p9zzb.js.
2. DONE (verified already fixed) text-view Cherry/Billion/letter avatars. Perf: stars+mk loops stop under cv-hide (p9zi), #bg-layer hidden (p9zf.css).
3. DONE Icon edits via PRs. User decisions: Icon edits own songs (cover, audio, video, bio, genre/mood, credits, date, album/label, explicit, full lyrics; NOT title/artist names/ids/treeshchoice/exclusive); new songs allowed (main artist locked); featured = own verses only; profile: photo, banner+pos, bio, location, cashapp, role label (NOT name/id); Treesh Admin role approves (merge)/rejects (close) in dashboard "Icon edits"; server-side scope checks in netlify/functions/icon.mjs + env GITHUB_TOKEN, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. Moderation: my_status() rpc -> role, verified, verified_icon (= artist id).
   - M.A.D. Icon mode: user built/uploads their own mad.html. `patch_mad.py` fixed (CSS goes into the first `</style></head>` only); generated tools/mad.html NOT kept in single_html.
   - Admin queue (Oct 9): p9zzc.js/.css. Moderation rail "Treesh Icons > Icon edits" (admins only) + overview card; Waiting/Reviewed tabs; detail pane with scope-check banner, per-file changes (field old->new, image previews, lyric +/- diff), Approve (confirm) / Reject (optional note -> GitHub comment). Escape closes the pane first. API base `/api/icon` (override window.TREESH_ICON_API).
   - icon.mjs review() now diffs against the PR merge base (an earlier approval no longer looks like a revert / fails the check).
   - Tests: tests/icon_api_test.mjs 46/46 (needs `node tests/icon_dev.mjs` on :8790, fake GitHub with commit snapshots + merge-base), iteration_33.json (UI 100%).
4. DONE account users' customizations reverting: root cause = account backup was a whole-device snapshot; a device left open (or Home Screen app vs Safari) pushed its stale copy over newer changes from another device (also overwrote profiles row + public Space). Fix p9zzd.js: key-by-key 3-way merge vs last-synced base (treesh_sb_base), per-key change times (treesh_sb_kt; newer edit wins on true conflicts), merge before every push, 3-way pull, legacy devices use a synthetic base, in-memory state refresh (profile, likes, playlists, fav lyrics, lyric edits) or reload at next safe pull. Assets (banner, Space bg, fonts) merge per id (p9g.js assetBase/assetSigs). Tests: tests/twodev.py 11/11; spso/syncrl/pfedit_sync clean.
5. Text Messages view (Cherry alternation, bracket headers, letter avatars) verified fixed in our build on live content (tests/txtview.py); treesh.app still serves an older index.html, user must upload the new build.
6. DONE (Oct 10) Playlist sort & filters (p9zze.js/.css). Sorts: Custom (drag, default), Recently added (pl.added map, legacy = list order), Title A–Z, Artist, Most played, Newest release (creationDate), Duration (cached in treesh_durs local-only, measured in background via preload=metadata); reverse toggle; sort saved per playlist (pl.sort/pl.sortRev in treesh_playlists → synced). Filters (reset on leaving): search, Artist menu (main + featured), Genre & mood menu, Has lyrics, Hide explicit, Unplayed. Play/Shuffle/row taps use exactly the visible list (resolveCtxList + plShuffle override); Play turns shuffle off. Non-custom sort: no drag handles, "Back to custom order" + "Save this order". Drag reorder now keeps songs hidden from view. Menus: popover on desktop, bottom sheet on phones. Tests: tests/plsort.py 35/35, iteration_34.json 100%.

7. DONE (Oct 10) Push notifications + new-version banner (user choices: built-in Web Push/VAPID via Netlify functions + Supabase; pushes for friend activity, staff actions, new versions, admin announcements; Settings switch + ONE-time ask after sign-in or 2nd visit; banner on return to screen + every 10 min; admin Announcements composer).
   - Server: netlify/functions/push.mjs (/api/push key|subscribe|unsubscribe|test|notify|announce), netlify/push-lib.mjs, netlify/functions/deploy-succeeded.mjs (production deploy + changed version.json -> 'update' announcement + push), package.json (web-push). SQL: memory/supabase_push.sql (push_subscriptions, treesh_push_state, announcements, treesh_push_config, pg_net trigger on notifications -> /api/push/notify with x-treesh-push secret, treesh_news rpc).
   - Client: sw-push.js (shows notifications; skips + postMessages when a Chromium tab is focused; click focuses/opens ?nt=o<id> / ?nt=n<id> / ?v=), p9zzf.js/.css (Settings + notification prefs push card, 4 types, test, iOS Home Screen steps, blocked help, one-time ask, sign-in/out relink, old nt-sys toggle replaced), p9zzg.js/.css (TREESH_VER from build hash vs /version.json -> top banner Refresh/Later; Treesh news + updates in the bell (Online tab, kind news/update, Open link); Moderation > Announcements composer w/ lock-screen preview, confirm, result, recent list; What's New entry). icons/badge-96.png (build_favicons.py). release.json = version.json title/notes.
   - Tests: tests/push_api_test.mjs 64/64 (harness tests/push_dev.mjs), tests/push_ui.py 47/47 desktop+mobile, nt.py regression clean, iteration_35.json 100%.

8. DONE (Oct 10) Switched to main as source of truth: export_main.py + to_main/ (114 new + index.html + merged package.json). Fixed a head script in index.html that unregistered EVERY service worker on load (would have killed push every visit): now keeps /sw-push.js, still clears others, reload only if an old SW was in control. push-lib/icon.mjs also accept SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY. Verified main+to_main overlay: npm install ok, all 5 functions import, 57 songs from main's content, no errors/404s; push_api 64/64, icon_api 46/46 (main's content), push_ui 47/47.

9. DONE (Oct 10) Secrets: memory/vapid_keys.json + push_hook_secret.txt had been pushed to the PUBLIC EmergentTreesh branch -> moved to memory/tests/ as test-only (vapid_test_keys.json, push_hook_test_secret.txt), new production VAPID pair handed to the user in chat only, supabase_push.sql now makes the hook secret inside the DB (gen_random_uuid x2), shows it at the end, rotates the leaked value if present. SQL verified on a real Postgres 15 with stubs (idempotent, trigger body/header/timeout, cancelled skipped, news visibility, anon/authenticated denied, hook failure never blocks inserts). NEVER write secrets into /app (Save to GitHub pushes everything to a public repo).
10. DONE (Oct 10) Desktop sidebar order Home, Icons, Studios, Game (p9zzh.js mkNavDesk + base template call; phones keep Game, Studios, Home, Icons, Profile; a Magic Markup custom order still wins; its reorder list shows the desktop order on >=1024px).

11. DONE (Oct 12) iOS 26 Home Screen app viewport: sticky page tabs pin under the measured top bar (--hdr-h, p9zzp.js); standalone height fix (html.ios-pwa, --app-h from a fixed-layer probe, vp-lie re-dock, CSS dvh -> var(--app-h,100dvh) at build, Tailwind dvh overrides p9zzp.css); removed double safe-area-bottom on Instrum phone tabs / Magic Markup panels. Song Page Similar vibe = genre family + mood tags with reason chips. Needs on-device check. Queue: memory/current_tasks.md (Fork 4).

## Request queue (Oct 8, 2026, in order)
1. New games: Bronze Blitz / Sonoko (/games/sonoku) / Ebonics: bios, ages (All / 6+ / 13+), logos + banners (+ Hoop logo/banner), arcade stats on profile, What's New updates on every page.
2. P0 bugs: double-tap, scrubber, lyric tap-to-seek, resume last song, profile sheet animates from the bottom nav on mobile.
3. P1: Urias polish, Zodiac flick-to-close.
4. LAST: update the Support page with detailed explanations + screenshots of everything.
