"""Export the site files that main (treeshwoodz/treesh) needs into /app/to_main/ (main's exact layout) + /app/TO_MAIN_LIST.md.
Run BEFORE work (python3 export_main.py --check) to see if main changed any file we own, and AFTER work to build the export.
Rules: only files we own go out; anything main changed since our last export is NOT overwritten (flagged as a conflict);
package.json is merged (main's fields + both dependency lists). Baseline hashes live in /app/memory/main_sync.json ({file: {sent: what we exported, main: what main had then}}).
Seed a file main already has from us with: python3 export_main.py --trust index.html"""
import hashlib, json, os, shutil, subprocess, sys, time
MAIN = '/tmp/treesh_main'; SRC = '/app/single_html'; OUT = '/app/to_main'; LIST = '/app/TO_MAIN_LIST.md'; BASE = '/app/memory/main_sync.json'
REPO = 'https://github.com/treeshwoodz/treesh.git'
OWNED = ['index.html', 'version.json', 'sw-push.js', 'manifest.webmanifest', 'favicon.ico', 'apple-touch-icon.png', 'treesh_logo.png',
         'support.html', 'privacy.html', 'terms.html', 'netlify/push-lib.mjs', 'netlify/functions/push.mjs', 'netlify/functions/deploy-succeeded.mjs', 'netlify/functions/icon.mjs']
OWNED_DIRS = ['icons', 'content/help']
NOT_SHIPPED = {'_sbtest.html': 'test page for the mock database', '_sattest.html': 'test page that simulates the iPhone status bar', 'template.html': 'old template, nothing links to it', 'yarn.lock': 'Netlify installs from package.json',
               'confirm-signup/': 'main already has confirm-signup.html (same redirect)', 'content/songs, lyrics, icons, models': 'local test copies; main has the real content/*.html',
               'tools/mad.html': 'main has a newer M.A.D. (v5.4); not touched'}
CHECK = '--check' in sys.argv

def sh(*a): return subprocess.run(a, capture_output=True, text=True, timeout=180)
def norm(p):
    b = open(p, 'rb').read()
    return b.replace(b'\r\n', b'\n') if p.endswith(('.html', '.js', '.mjs', '.json', '.webmanifest', '.css', '.md', '.toml')) else b
def h(p): return hashlib.sha1(norm(p)).hexdigest() if os.path.isfile(p) else None

if os.path.isdir(MAIN + '/.git'): r = sh('git', '-C', MAIN, 'pull', '-q', '--ff-only')
else: r = sh('git', 'clone', '-q', '--depth', '1', '-b', 'main', REPO, MAIN)
if r.returncode: print('could not get main:', r.stderr.strip()); sys.exit(1)
head = sh('git', '-C', MAIN, 'log', '-1', '--format=%h %ad %s', '--date=iso').stdout.strip()
base = json.load(open(BASE)) if os.path.exists(BASE) else {}

files = list(OWNED)
for d in OWNED_DIRS:
    for root, _, fs in os.walk(os.path.join(SRC, d)):
        files += [os.path.relpath(os.path.join(root, f), SRC) for f in fs]
files = sorted(set(files))

for f in sys.argv[sys.argv.index('--trust') + 1:] if '--trust' in sys.argv else []:
    base.setdefault(f, {})['main'] = h(os.path.join(MAIN, f)); print('trusting main\'s current', f)
new, upd, same, conflict = [], [], [], []
for f in files:
    mine, theirs, rec = h(os.path.join(SRC, f)), h(os.path.join(MAIN, f)), base.get(f) or {}
    if mine is None: continue
    if theirs is None: new.append(f)
    elif theirs == mine: same.append(f)
    elif theirs in (rec.get('main'), rec.get('sent')): upd.append(f)   # main still has what it had, or our older export
    else: conflict.append(f)                                           # someone changed it on main: merge by hand

# package.json: keep main's, add our dependencies
pj_main = json.load(open(MAIN + '/package.json')) if os.path.exists(MAIN + '/package.json') else {'name': 'treesh', 'private': True}
pj_mine = json.load(open(SRC + '/package.json'))
pj = dict(pj_main); deps = dict(pj_main.get('dependencies', {}))
for k, v in pj_mine.get('dependencies', {}).items(): deps.setdefault(k, v)
pj['dependencies'] = dict(sorted(deps.items()))
pj_txt = json.dumps(pj, indent=2) + '\n'
pj_changed = pj != pj_main

print('main @', head)
if conflict: print('CONFLICTS (main changed these after our last export, merge by hand first):\n  ' + '\n  '.join(conflict))
if CHECK:
    print(f'{len(new)} new, {len(upd)} updated, {len(same)} same, package.json {"needs merge" if pj_changed else "ok"}'); sys.exit(2 if conflict else 0)

shutil.rmtree(OUT, ignore_errors=True)
for f in new + upd:
    os.makedirs(os.path.dirname(os.path.join(OUT, f)) or OUT, exist_ok=True); shutil.copy2(os.path.join(SRC, f), os.path.join(OUT, f))
if pj_changed: os.makedirs(OUT, exist_ok=True); open(OUT + '/package.json', 'w').write(pj_txt)

def group(lst):
    out, dirs = [], {}
    for f in lst:
        d = next((x for x in OWNED_DIRS if f.startswith(x + '/')), None)
        if d: dirs.setdefault(os.path.dirname(f), []).append(f)
        else: out.append(f'- `{f}`')
    out += [f'- `{d}/` ({len(v)} files)' for d, v in sorted(dirs.items())]
    return '\n'.join(out) or '- (none)'
md = f"""# Files to copy into treeshwoodz/treesh, branch main

Made {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}, against main at `{head}`.
Copy everything inside `to_main/` into the root of main, keeping the folders. Paths below are the same on main.

## New on main ({len(new)})
{group(new)}

## Replace the version on main ({len(upd) + (1 if pj_changed else 0)})
{group(upd)}
{'- `package.json` (merged: keeps everything main has, adds ' + ', '.join(f'`{k}`' for k in pj_mine.get('dependencies', {}) if k not in pj_main.get('dependencies', {})) + ')' if pj_changed else ''}

## Already the same on main, nothing to do ({len(same)})
{group(same)}

## Changed on main since the last export: NOT included, needs a hand merge ({len(conflict)})
{group(conflict) if conflict else '- (none)'}

## Not shipped on purpose
""" + '\n'.join(f'- `{k}`: {v}' for k, v in NOT_SHIPPED.items()) + '\n'
open(LIST, 'w').write(md)
for f in new + upd + same:
    t = h(os.path.join(MAIN, f)); base[f] = {'sent': h(os.path.join(SRC, f)), 'main': t if t != base.get(f, {}).get('sent') else base.get(f, {}).get('main')}
json.dump(base, open(BASE, 'w'), indent=0, sort_keys=True)
print(f'exported {len(new)} new + {len(upd)} updated' + (' + package.json' if pj_changed else '') + f' -> {OUT}  ({len(same)} already same, {len(conflict)} conflicts)')
