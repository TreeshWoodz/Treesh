# Current task queue (session after fork, June 2026)
User choices: NP goes light in light mode; Urias text all centered; profile tabs swipeable; others' profiles get same 3 tabs (activity = public only);
voice confirms destructive actions; voice actions: friends (add/remove/accept/decline/block/unblock), profiles (open someone's, open/customize mine, set mood/profile song),
notifications (open, mark all read, push on/off), admin tools (ban, warn, announcement); full-screen other profile keeps top bar + bottom nav + desktop sidebar.

1. [doing] Light theme audit fixes (gen_light.py -> p9zzj.css generated, p9zzi.css hand-tuned). Tools: tests/light_audit.py (m|d [filter] [--sat]), tests/light_probe.py, tests/light_collect.py (groups)
2. [done-ish] Urias zoom-in orb + centered text + light white wash (p9zzi.css top)
3. [done-ish] Home-screen app safe-area (p9zzk.css): header/sidebar padding, status-bar scrim, toast, queue. Test page _sattest.html (--sat)
4. [code done, needs test] Version-update banner shows on every refresh -> fix; icon -> app logo (p9zzg.css/.js?)
5. Profile opening breaks viewport (esp. standalone); remove black overlay, dim whole app
6. Other user profiles: small preview sheet first + "View full profile" -> full screen with top bar/bottom nav/sidebar visible
7. Profile Favorites & Talents modal too tall -> fix
8. Profile tabs: Profile > Stats (starlites/stats) > Activity (fav tracks, lyrics, disliked...)
9. Voice online actions (see choices)
10. Notifications tap -> open target (profile, etc.)
10b. Magic Markup edits made on a profile must be saved to the server and shown to everyone who views that profile (currently local-only)
10c. Merge playlists: pick two playlists, choose songs, then Transfer (move), Copy (keep in both), or Merge (all into one playlist)
10d. Song page: rich page with info/metadata/fun features. Opens when tapping a song's cover or row; the play button only plays (no page). Use design_agent first.
10e. Playback: when playback is stopped, the player state isn't remembered -> fix. Songs always start at 0s by default; add a Setting 'Remember where I left off' (resume timestamp per song)
10f. Notification-in-nav-bar setting: when banners live in the TOP bar they must slide out INSIDE the top bar below its buttons (bar grows downward); in the BOTTOM bar, above the nav items (bar grows upward)
10g. Theme: add Auto (follow device light/dark) next to Light/Dark, live-updates on prefers-color-scheme change
11. Build (patch_p9.py), test, export_main.py to /app/to_main

Findings:
- Update-banner loop root cause: main's index.html is one of our mid-work builds (TREESH_VER b7edd5618e) but main's version.json is older (1da25c5373), so they never match.
  Fix: HEAD ETag baseline check + loop guard; export index.html and version.json together. main's index.html conflict is our own build, so use export_main.py --trust index.html.
- Profile Magic Markup is stored in localStorage only (mkS().pages.profile.deep, keyed by DOM path in #profile-scroll); other users' profiles render in #sx-scroll (different DOM).
- sx-root already uses class 'is-preview' for pvOpen (profile preview as others). Use 'is-card' / 'is-full' for the new modes.
- Done so far this fork: p9zzl.js/css (profile pages, card/full, dim, markup publish), p9zzm.js (notification tap targets), version banner fix (p9zzg), safe-area (p9zzk.css)

## Fork 3 queue (user order: Song Page first, then A -> B -> D, then new items)
- DONE: Urias Type/Tips blocked by orb glow; mic dead after first command (fresh recognizer per listen + watchdog, p9zzn.js); reply text auto-fits (p9zzn.js/css); shrink -> reveal-from-orb -> grow View Transition (p9zzn). Test: tests/vxmic.py m|d
- DONE: full-screen profile fills the whole screen, top bar/nav/sidebar float above (html.pfx-full in p9zzl.js/css; cv-hide exemption)
- NOW: Song Page (#/song/<id>, p9zzo.js/css): cover tap on cards/rows + NP cover + song menu "View song page"; row/title tap still plays; play button plays. Design: memory/design_song_page.json
- A: Image Studio editor light mode (fully light, soft grey canvas area) + custom colour circle in the SAME row as defaults (circles shrink to fit) everywhere + Instrum Studio buttons glow in dark mode
- B: profile: guest sign-in gate check, overlay dim check (hscroll already ok)
- D: Auto theme (Light/Dark/Auto), playback memory after mini-player swipe, nav-bar notification animations, voice online actions, playlist merge, Magic Markup public sync
- NEW: LyricFlow (Lyric Studio) Verse Panel: horizontal panel of [bracket] sections side by side; group by artist; merge duplicate brackets ([Hook: A] + [Hook: B] -> [Hook: A & B]); multi-edit (add a line to several sections at once); Preview + Save; desktop + mobile; wow
- NEW: Image Studio feature-rich like Photoshop

## Fork 4 (user order after ask: Song Page finish -> renames -> Photocap light/colour row + Instrum glow -> LyricFlow Verse Panel -> Photocap layers/adjustments/history -> Auto theme + playback memory -> test -> export)
User choices: "LyricFlow" everywhere (replace "Lyric Studio"); ONLY "Custom Music Studio" -> "My Music" (Music Studio/Music Manager stays); Instrum Studio -> Instrum; Image Studio -> Photocap;
Photocap first tools = layers (add/reorder/hide/opacity/blend) + adjustments (brightness/contrast/saturation/hue/blur/sharpen) + undo history panel; Verse Panel = "Verses" button in the LyricFlow editor -> full-width side-scrolling panel.
- DONE (urgent user bug, iOS 26 Home Screen app): bottom gap + sticky tabs under the top bar.
  * Sticky: top bar grows by the status bar in standalone, tabs were pinned at a fixed 88/94px -> --hdr-h (p9zzp.js measures the header, ResizeObserver) and .settings-tabs-bar top = --hdr-h + 10/16px, gx-land hero + scrollToStickyTabs follow. Instrum transport already had --ixtp (p9zc.js).
  * Height: WebKit standalone bug (dvh/innerHeight short by safe-area-top on cold start; fixed layer can be short; 100vh/screen.height correct). Head bootstrap in index.before_p9.html: navigator.standalone -> html.ios-pwa, --app-h = measured fixed-layer height, html.vp-lie + --app-full when short by ~sat (body min-height app-full+1 so iOS re-docks). Build rewrites every CSS Ndvh inside <style> to var(--app-h,100dvh) (patch_p9.py _dvh); Tailwind dvh classes overridden in p9zzp.css.
  * Double safe-area-bottom removed where --nav-h (already includes it) was added to env(): .ixp-tabs (Instrum phone tabs), .mkd-panel, .mkp-ui.
  * Test: tests/vpprobe.py [sat] [view] [--pwa] [--lie] (fakes navigator.standalone, screen 390x844, viewport 844-sat with --lie). _sattest.html now also maps env(safe-area-inset-bottom) -> var(--sab,0px).
  * NEEDS user check on a real iPhone (can't emulate WebKit's standalone viewport).
- DONE Song Page "Similar vibe": was exact genre/mood string + Treesh pick bonus (picks with other genres leaked in). Now same genre family only (rap/hip hop/trap/hip pop...), mood tags split + synonyms, mood-clash only as fill for exact genre, era bonus; tile shows why (e.g. "Rap · Party").

## Fork 5 (June 2026) queue, user-approved order
1. [DONE, tests/lsrevert.py 8/8] LyricFlow "Revert lyrics" (Write tab, confirm, text back to default, MY timings kept) + "Revert timestamps" (Sync tab, confirm, default times, MY text kept). Originals: s._ly0 set in attachLyrics (base). Module p9zzv.js/.css.
2. [DONE code, tests/lsrich.py] Markup fix: real rich editor (contenteditable #ls-write with value/selectionStart shim), B/I/U/S (execCommand), no ** symbols. Storage line.md2 (escaped md: ** * __ ~~, backslash escapes), line.text plain; legacy line.md still rendered. Player npLyricLineHtml uses lyFmt. Sync line fields + Verse panel textareas rich too. NP editor (p9z) shows plain text, keeps md2 when unchanged.
3. [doing] Duo parentheses (p9zzw): section tag with 2+ artists -> non-paren text = 1st artist, (paren) = 2nd artist (skip (x2)/(×2)). Pill highlights who sings (split time estimated by char position, or word timings). Classic + themes tint paren part in 2nd artist colour (Comic = own bubble); Text Messages = separate bubble from 2nd artist. Fuzzy name match (Marc Q ~ Marq C) to song main/featured artists.
4. Announcements: tap custom notification -> sheet (full title, message, sent time, Open link). Admin Recent list: End (removed from everyone's bell/banners, "Ended" tag) + Edit (title/message/link, "Edited" tag; push already sent can't change). Needs SQL (announcements ended_at/edited_at + rpc) + push.mjs?
4b. NEW: Admins can edit any user's Starlites balance (incl. their own) from Moderation (user sheet). Ask set/add details when starting.
5. Photocap Pro (p9zzu.js already has ~27KB: layers, blends, hue/blur, history, fill, remove bg, wheel + gestures) -> review/finish/test.
6. Icon MAD check; small fixes (Instrum glow, Auto theme, mini-player swipe memory); test; export_main.py.
