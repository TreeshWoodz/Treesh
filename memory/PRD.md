# Treesh M.A.D. (Manage & Direct) — PRD (formerly Song Coder)

## Original problem
Make the Treesh song coder tool (live at https://treesh.app/tools/songcoder) way better and polished. Keep it ONE file (saved to GitHub). Ability to update Treesh's music catalog (https://treesh.app/content/songs → repo file content/songs.html) automatically after pressing an upload button. Follow-up: make it fit on mobile screens.

## User choices
- Repo TreeshWoodz/Treesh, branch main, catalog content/songs.html, tool lives in Tools folder
- Publish: GitHub token in-browser (localStorage), BOTH modes: Pull Request (review) and direct commit (go live)
- Media: Cloudinary unsigned preset upload AND paste URLs; read ID3 tags/artwork from MP3
- Catalog: add + browse/edit/delete
- Design: keep Treesh look (dark #0a0a0b, purple #9328ff, Manrope + Special Gothic Expanded + Doto) from main app index.html

## Architecture
- Deliverable: /app/Tools/songcoder.html (copy of /app/frontend/public/songcoder.html) — vanilla JS, CDN: lucide, jsmediatags, Google Fonts
- GitHub REST from browser: contents GET/PUT (sha), git refs, pulls; conflict retry on 409
- Catalog edit is surgical: raw <ul class="song"> blocks located in file text (comments skipped); unknown attrs/class preserved
- Preview-only test harness: /app/backend/server.py mocks GitHub at /api/mockgh (NOT part of deliverable); /app/frontend/public/content/* snapshot for read-only mode

## Implemented (2026-06)
- Compose: media dropzones (Cloudinary auto-upload w/ progress or link paste), ID3 autofill, roster-linked artist IDs, featured chips, genre/mood chips, date picker, credits, YouTube ID extraction, bio, badges; live preview + audio play; code viewer/copy; draft autosave; duplicate warning; validation; Ctrl/Cmd+Enter
- Publish: Review (PR) / Go live toggle; success/error modals; pending PR strip
- Catalog: search/filter/sort, play, edit, delete
- Settings drawer: token, owner/repo/branch/paths, Cloudinary, API base, test connection
- Fully responsive (mobile/tablet/desktop) — tested iteration_1 & iteration_2 (100%)

## Iteration 2 (2026-06)
- Release countdown: 'Drops on' datetime -> data-release="ISO+offset" on the song; preview + catalog show Dropping soon badge & live countdown (main app must read data-release and lock playback; user handles main app)
- Artists tab: roster grid (photo, role, id, location, cashapp, song counts) + New artist drawer (photo/background drop or URL, bg position, location, bio, Cash App, role) -> inserts <article class="artist"> at top of content/icons.html with next id
- Catalog reorder mode: drag (SortableJS) + top/up/down buttons; saves via Review/Go live; preserves comments/gaps
- Mode toggle synced across publish dock, reorder bar, artist drawer
- Tested iteration_3 (100%)

## Iteration 3 (2026-06)
- Artists: edit (prefilled drawer, in-place replace, unknown attrs preserved) & delete (warns about linked songs)
- Pin to top: one-tap pin on catalog cards (Review/Go live)
- Lyrics Studio tab (content/lyrics.html, served at /content/lyrics): song list w/ Synced/Plain/None status, Write mode (textarea, [Section] headers), Sync mode (tap/Space to stamp, undo, manual mm:ss.xx edit, per-line explanations, live karaoke highlight), save via Review/Go live, collapsible Lyrics code + Copy code
- Settings: Lyrics file path
- Tested iteration_4 (100%); lyrics copy-code self-tested

## Iteration 4 (2026-06)
- Artist form: collapsible Artist code panel + Copy code (new & edit)
- Bulk import: multi-file drop on Compose audio zone or Bulk import drawer; per-file ID3 read (title, artist+feat, album, genre, year, artwork), Cloudinary auto-upload when configured, Apply-to-all shared fields, per-item edit/preview/remove/send-to-Compose, duplicate warning, one commit/PR for all ready songs
- Tested iteration_5 (100%); live dup-chip nit fixed

## Iteration 5 (2026-06)
- Bulk credits: shared Written/Produced/Mixed by in Apply-to-all + per-item credit inputs; carried to upload & Compose
- Projects tab: groups catalog by data-album; editor (title, artist, cover=first track default, date=earliest default, slug, description, tracklist reorder/remove), live iframe preview, publishes standalone playable page to projects/<slug>.html (treesh.app/projects/<slug>) via Review/Go live; Copy code; Published status check
- commitFile supports creating new files; Settings: Project pages folder
- Tested iteration_6 (pass); mobile project editor overflow fixed

## Iteration 6 (2026-06)
- Renamed to "Treesh M.A.D." (Manage & Direct) — title, brand, all UI/PR text (file still Tools/songcoder.html; branch prefix songcoder/ kept)
- Models tab ("The Board") -> content/models.html (served /content/models), icons-style <article class="model"> blocks
  - Attributes: identity (division, board, age, pronouns, location, agency, availability, travel), measurements in cm+in (height/bust/waist/hips/inseam + height-ft), sizes (shoe, dress, suit, shirt, pants, bra), look (hair color/length/texture, eyes, skin tone, ethnicity, tattoos, piercings), work (experience, categories, skills, languages, credits), links (instagram, tiktok, portfolio, video, email), bio, headshot, photos (pipe list), digitals (pipe list)
  - Form: ft/in <-> cm toggle, category chips, validation, photo uploader (Cloudinary), link add, batch link import (URLs/HTML), tile kind toggle/headshot/reorder/remove, code panel + copy; add/edit/delete via Review/Go live; file auto-created
- Tested iteration_7 (100%)

## Iteration 7 (2026-06)
- Models saved as <div class="model" data-model-id data-name data-model-sort="[data-model-id]" data-bg data-bg-pos ...> (balanced-div parser; legacy article still readable)
- Scout filters: height min/max, board, city, availability, category + count + clear
- Comp cards: 5.5x8.5in front/back printable page (Print/Save PDF), Copy code/link, publish share page to models/<slug>.html (treesh.app/models/<slug>); Settings: Comp card folder
- Nav fix: 6 tabs equal width at all sizes (mobile icon+label, 761-1280 full-width 2nd row, >=1281 equal grid)
- Tested iteration_8 (100%), iteration_10 (nav)

## Iteration 8 (2026-06)
- Mobile nav (<=760px): inactive tabs icon-only, active tab expands with label; title/aria-label on tabs; 320px brand row compacted
- Draft autosave (localStorage): new song (treesh_songcoder_draft_v2, "Draft saved" pill, restore toast), per-song edit drafts (treesh_mad_edit_draft:<title|artist>, catalog "Draft" badge, Cancel edit confirms discard, cleared on save), model drafts (treesh_mad_model_draft:new|<id>, autosave status + Discard in drawer foot, "Resume draft" button, card "Draft" badge, cleared on save)
- Tested iteration_12 (nav/song drafts) + self-test (model drafts)

## Iteration 9 (2026-06)
- Draft Shelf: top-bar Drafts button + count badge -> side panel listing all song/model drafts (thumb, title, type, time, Resume, 2-step Clear, Clear all); missing song/model -> "not found" + Load as new
- SECURITY: no GitHub token in the browser. New Netlify Function /app/netlify/functions/github.mjs (path /api/github/*): passcode login (MAD_PASSCODE, timing-safe, 5 tries -> 15 min lock per instance), HMAC-signed HttpOnly Secure SameSite=Strict 30-day cookie, sign out, origin check, repo locked (MAD_REPO default TreeshWoodz/Treesh), allowlisted GitHub calls only
- Frontend: Settings = Secure sign-in (passcode/sign out) + Repository (branch/paths); legacy saved token auto-removed with toast; all GitHub calls via /api/github/repo
- Mock backend mirrors the function (/api/github/session + /api/github/repo/*), seeds content/models.html; passcode in backend/.env MAD_PASSCODE
- Tested iteration_13 (shelf), iteration_14 (secure sign-in, 17 backend + all frontend flows)

## Backlog
- P1: Lyrics editor for content/lyrics
- P2: Main-app patch to honor data-release (badge + playback lock)

## 2026 — Storage-loss investigation (main app, treesh.app)
- M.A.D. never clears storage. Icon updates only rewrite content/icons.html, and nothing in the main app wipes storage when the catalog changes (checked on live treesh.app: data survives a reload with the new icons file).
- Most likely cause: iOS evicted storage for the home-screen web app. The app never asked iOS to keep its storage.
- Patched main app saved as /app/deliverables/index.html (based on live treesh.app index):
  - Asks the browser for persistent storage at startup (navigator.storage.persist)
  - "Erase everything" now removes only Treesh-owned keys (treesh*, frea_, chainz_, vocotap_, voco_, nects_) instead of the whole localStorage/sessionStorage
  - Closing or cancelling a confirm dialog clears the pending confirm action, so it can't fire later
- Noted: artist #17 Jay Saulx is missing from live content/icons.html
- Pending (user deferred): end-to-end testing of Blog Coder, banner previews, PR Status, Sign-in Activity

## 2026-10 — Banner position fix + publishing (LIVE)
- Root cause: treesh.app ignored data-bg-pos-mobile and applied the old desktop px values (e.g. "center -200px") on every screen, pushing photos out of the frame.
- index.html on main: bnPosPct/bnPosFit/bnAttrs. Phones (<640px) use the Mobile value, larger screens use Desktop. px values are converted to a clamped % using the image's real size. Model heroes now use data-bg plus their bg positions.
- M.A.D.: pctPos is the same math as the site, the preview fits px values like the site does, drag starts from the fitted value, and the quick buttons are % (upper/lower).
- Published with the GitHub contents API (memory/gh_put.py, token from env only, never saved):
  - main: index.html, tools/mad.html (treesh.app/tools/mad), package.json (@netlify/blobs), netlify/functions/github.mjs (activity + Blobs lockout)
  - songcoder: Tools/songcoder.html, netlify/functions/github.mjs
- Patch script for the main index: memory/patch_main_index.py. The file uses CRLF line endings; always fetch the latest main index before patching.
- Verified live: /api/github/session returns activity:true (Blobs working); banners use mobile/desktop values.

## 2026-10 — Sign in with GitHub (LIVE, waiting on user's OAuth app env vars)
- github.mjs: GET /api/github/oauth/start?return=<path> → github.com authorize (state cookie mad_oauth, SameSite=Lax, Path=/api/github/oauth, 10 min). GET /api/github/oauth/callback swaps the code, calls /user, checks MAD_GITHUB_USERS (default TreeshWoodz, case-insensitive), issues the same mad_session (with login), logs activity (via github, signin/denied), then returns a same-site HTML hop to <return>?signin=github|denied|cancelled|expired|setup|error. The OAuth token is never stored.
- Session GET now also returns login + oauth (whether it's configured). Passcode compare trims whitespace on both sides.
- M.A.D.: "Continue with GitHub" button (settings-github-signin-btn), setup hint when OAuth isn't configured, ?signin= toasts, activity rows show "Signed in with GitHub · @login" / "GitHub account not allowed".
- Mock (server.py): /api/github/oauth/start skips github.com (?as=<login> to test denied, ?deny=1 for cancel); POST /api/mockgh/oauth/on|off toggles whether it's configured.
- User must create a GitHub OAuth App (callback https://treesh.app/api/github/oauth/callback) and set GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET (and optionally MAD_GITHUB_USERS) in Netlify (Functions scope), then redeploy.

## 2026-10 — Banner regression + What's New manager (BUILT, user uploads the files)
- Banner regression cause: the user re-uploaded index.html without the earlier fix. M.A.D. now saves % positions (pctString with HERO_BOX), has a "Fix all banners" bulk action (fixBannerPositions), and warns when the live index lacks bnPosFit. Tested: iteration_15 (7/7).
- What's New manager (iteration_16, 9/9): M.A.D. tab "What's New" writes content/whatsnew.json (cfg.wnPath).
  - Popups: managed/locked/hidden/code access, items editor, icon picker, bump version, schedule.
  - Carousel slides: code/managed/locked, full editor, art key or https link.
  - Lint, staged drafts (treesh_mad_wn_draft), publish bar, Site check.
  - Built-in snapshot WN_BUILTIN embedded (taken from the live site: 7 popups, 8 slides).
- Main-site loader: memory/wn_loader.js (sets window.__treeshWN, applies the file over WHATS_NEW/WNU, caches it in treesh_wn_content, supports ?wn-preview=<id>, page:/url: CTA actions, autoPopups master switch).
- memory/patch_main_index.py applies all main-site patches (storage, banner, model banner, loader) to any fresh index.html (CRLF safe).
- Files for the user to upload: deliverables/index.html → main /index.html; deliverables/tools/mad.html → main /tools/mad.html; deliverables/songcoder.html → songcoder branch Tools/songcoder.html. github.mjs and package.json are already live on main.

## 2026-10 — Icon accounts + admin Icon Review (BUILT, tested iteration_18 100%)
- Icons sign in with their Treesh account: M.A.D. reads the Supabase session already in this browser (localStorage `sb-*-auth-token`, same origin on treesh.app) and posts it to /api/github/icon-session. The server checks profiles.verified + profiles.verified_icon (default column fixed from artist_id to verified_icon), or the M.A.D. approved list.
- Icon mode: only Compose, Catalog and Artists. Only their own songs, profile and lyrics are shown. Go live, bulk, reorder, pin, new artist, Repository settings and activity are hidden. Every save opens a PR on icon/<id>/… titled "<Name>: …".
- Server scope (github.mjs iconGuard + mock): files limited to songs/icons/lyrics. Blocks are found with balanced nesting. Other people's blocks must stay identical and in order. Lyric blocks without ids are owned through the icon's song titles. Branch, ref and PR must use icon/<id>/ with base main. GET /pulls is filtered to the icon's own PRs. Merge, close, activity and icon-admin are admin only. Revoke kills existing icon sessions (icon-revoked blob).
- Unverified accounts get an "Ask for Icon access" form (/icon-request).
- Admin "Icon review" drawer (inbox button + count):
  - Changes tab: field-level diff (old → new, image thumbs, lyric line diff), Approve (squash merge), Reject with a note (stored in the PR body as "**Not approved:** note" plus a comment). Icons see the note under My changes.
  - Access tab: approve and link an Icon, decline, or revoke.
- Netlify env needed: SUPABASE_URL, SUPABASE_ANON_KEY (optional: MAD_ICON_TABLE, MAD_ICON_VERIFIED_COL, MAD_ICON_ARTIST_COL).
- Files to upload: deliverables/github.mjs → main netlify/functions/github.mjs; deliverables/tools/mad.html → main /tools/mad.html; deliverables/songcoder.html → songcoder branch Tools/songcoder.html.

## Backlog
- P2: Main-app patch to honor data-release (badge + playback lock)
- P2: Let icons upload audio without a Cloudinary preset on their device (server-signed audio uploads)
