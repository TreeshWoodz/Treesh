# Files to copy into treeshwoodz/treesh, branch main

Made 2026-10-10 19:26 UTC, against main at `a757177 2026-10-10 15:00:39 -0400 Create sw-push.js`.
Copy everything inside `to_main/` into the root of main, keeping the folders. Paths below are the same on main.

## New on main (114)
- `apple-touch-icon.png`
- `favicon.ico`
- `manifest.webmanifest`
- `netlify/functions/deploy-succeeded.mjs`
- `netlify/functions/icon.mjs`
- `netlify/functions/push.mjs`
- `netlify/push-lib.mjs`
- `treesh_logo.png`
- `version.json`
- `content/help/d/` (49 files)
- `content/help/m/` (49 files)
- `icons/` (7 files)

## Replace the version on main (2)
- `index.html`
- `package.json` (merged: keeps everything main has, adds `web-push`)

## Already the same on main, nothing to do (4)
- `privacy.html`
- `support.html`
- `sw-push.js`
- `terms.html`

## Changed on main since the last export: NOT included, needs a hand merge (0)
- (none)

## Not shipped on purpose
- `_sbtest.html`: test page for the mock database
- `template.html`: old template, nothing links to it
- `yarn.lock`: Netlify installs from package.json
- `confirm-signup/`: main already has confirm-signup.html (same redirect)
- `content/songs, lyrics, icons, models`: local test copies; main has the real content/*.html
- `tools/mad.html`: main has a newer M.A.D. (v5.4); not touched
