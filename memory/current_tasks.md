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
