# Hoop by Treesh: live at https://treesh.app/hoop

## How it works
```
branch `hoop`  (this app, "Save to GitHub" target)
   │  push
   ▼
GitHub Action  .github/workflows/deploy-hoop.yml
   │  builds static Hoop (base path /hoop), copies it into main:/hoop/
   ▼
branch `main`  (treesh.app website)  ──► Netlify auto-deploys ──► treesh.app/hoop
```
- The Action only ever writes inside the `hoop/` folder on `main`. The rest of the website is never touched.
- Hoop is 100% static: OpenStreetMap, YouTube and the MediaPipe pose model all run from the browser. You don't need a server, an API key or any Netlify changes.
- Every route has its own `index.html` (`/hoop/drills/`, `/hoop/games/horse/`, …), so refreshing a page and opening shared links both work on Netlify without redirect rules.

## One-time setup (≈2 minutes)
1. **Save to GitHub** → repo **Treesh**, branch **`hoop`**.
2. On GitHub: **Treesh → Settings → Actions → General → Workflow permissions** → select **Read and write permissions** → Save.
3. Go to **Actions → "Deploy Hoop to treesh.app/hoop"** and check that the first run is green. (You can also start it by hand with **Run workflow**.)
4. Netlify sees the new commit on `main` and deploys it. Then open https://treesh.app/hoop.

After this, every "Save to GitHub" on `hoop` updates treesh.app/hoop automatically in about 2–3 minutes.

### Only if needed
| Situation | Fix |
|---|---|
| Netlify's **publish directory** is a sub-folder (e.g. `public`, `dist`) | GitHub → Settings → Secrets and variables → Actions → **Variables** → add `HOOP_TARGET_DIR` = `public/hoop` (use your folder) |
| `main` is **branch-protected** (push rejected) | Create a fine-grained token with *Contents: read & write* on Treesh, add it as secret **`HOOP_DEPLOY_TOKEN`** |
| Netlify builds **branch deploys** for `hoop` | Netlify → Site config → Build & deploy → Branches → deploy **production branch only** (optional; harmless either way) |
| `main` has a catch-all `/*  /index.html  200` rewrite | Nothing to do. Netlify serves real files first, so `/hoop/*` still loads Hoop |

## Local build (optional)
```bash
bash scripts/build-hoop-static.sh      # → hoop-dist/hoop/
```

## Profile link with the Treesh parent app
Hoop is served from the same origin (`treesh.app`), so it reads `localStorage["treesh_profile"]` (`{nickname, birthday, zodiac, avatar}`) directly and updates live when Treesh changes it. Edits in Hoop are written back in the same format. All Hoop data uses `treesh_hoop_*` keys, so the Treesh storage manager and its "Erase everything" option include it.
