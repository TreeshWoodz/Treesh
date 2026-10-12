"""Generates /app/memory/p9zzj.css: light-theme versions of the CSS rules used inside the panels that were dark-only
(Music Studio / Edit track, user profile pages, Moderation, Zodiac hub, player style sheets).
Classes per panel come from light_classes.json (tests/light_collect.py). Hand-written html.theme-light rules always win:
any selector that already has one is skipped, and p9zzi.css (hand-tuned) loads after this file."""
import json, re, colorsys, sys
import tinycss2
M = '/app/memory/'
PATCH = open(M + 'patch_p9.py').read()
CSS_FILES = re.findall(r"'(p9[a-z]*\.css)'", PATCH.split("css='\\n'.join(")[1].split('])')[0])
CSS_FILES = [f for f in CSS_FILES if f not in ('p9zzi.css', 'p9zzj.css')]
base = open(M + 'index.before_p9.html', encoding='utf-8').read()
base_css = base[base.index('<style'):base.index('</style>\n</head>')]
base_css = base_css[base_css.index('>') + 1:]
SOURCES = [('base', base_css)] + [(f, open(M + f, encoding='utf-8').read()) for f in CSS_FILES]
GROUPS = json.load(open(M + 'light_classes.json'))
ONLY = ['um', 'sx', 'adm', 'zh', 'nps', 'np', 'modal', 'bd', 'pf']
SKIP_SEL = re.compile(r'\.a-[a-z]|\.np9-art(?![\w-])|\.vx-blob|\.nps-prev|\.st-frame|\.st-stage|\.lsnp|\.np-art(?![\w-])|\.pm-bd|\.pm-panel|\.gl-modal|\.glass-strong')
ROOT_IDS = {g: GROUPS[g]['root'] for g in ONLY}
# profiles with a custom photo/colour background stay dark (their panel keeps .dark-surface), so only theme-background profiles go light
SCOPE = {**ROOT_IDS, 'sx': '#sx-root:not(:has(> .dark-surface))', 'pf': '#profile-panel:not(.dark-surface)'}
UTIL = re.compile(r'[:/\[\]\\]|^\.(press|lucide.*|is-.*|on|no-scrollbar|clamp-\d|min-w-0|flex.*|grid|hidden|block|relative|absolute|fixed|sticky|truncate|dark-surface|reveal.*|io-.*|b\d|glass.*|soft-scroll)$|^\.-?(text|bg|border|p[xytblr]?|m[xytblr]?|w|h|gap|rounded|shadow|font|leading|tracking|grid|col|row|items|justify|inline|space|overflow|opacity|z|top|left|right|bottom|inset|ring|backdrop|blur|transition|duration|ease|delay|cursor|select|pointer|uppercase|lowercase|capitalize|italic|not|aspect|object|shrink|grow|order|place|self|content|max|min|translate|scale|rotate|origin|sr|whitespace|break|line|list|underline|decoration|outline|from|via|to|animate|group|peer|tabular|divide|size|basis|contents|isolate|visible|invisible|antialiased|snap|touch|will|mix|filter|drop|backface|resize|appearance|table|float|clear|align|indent|truncate|font|leading|static|start|end)(-|$)')
CLS = {}
for g in ONLY:
    for c in GROUPS[g]['cls']:
        if not UTIL.search(c): CLS.setdefault(c, set()).add(g)

COLOR = re.compile(r'rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\bwhite\b|\bblack\b')
def parse(c):
    c = c.strip()
    if c == 'white': return (255, 255, 255, 1.0)
    if c == 'black': return (0, 0, 0, 1.0)
    if c.startswith('#'):
        h = c[1:]
        if len(h) in (3, 4): h = ''.join(x * 2 for x in h)
        if len(h) not in (6, 8): return None
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) / 255 if len(h) == 8 else 1.0)
    m = re.match(r'rgba?\(([^)]*)\)', c)
    if not m or 'var(' in c: return None
    p = [x for x in re.split(r'[\s,/]+', m.group(1)) if x]
    try: v = [float(x.rstrip('%')) for x in p]
    except ValueError: return None
    return (v[0], v[1], v[2], v[3] if len(v) > 3 else 1.0)
def lum(r, g, b):
    f = lambda v: (v / 255) / 12.92 if v / 255 <= .03928 else (((v / 255) + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def sat(r, g, b): return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[2]
def rgba(r, g, b, a): a = max(0, min(1, a)); return f'rgba({int(r)},{int(g)},{int(b)},{round(a, 3)})' if a < 1 else f'rgb({int(r)},{int(g)},{int(b)})'
def fg(c):  # text: light neutral -> ink, light pastel accent -> deeper shade of the same hue
    r, g, b, a = c; L, S = lum(r, g, b), sat(r, g, b)
    if L > .55 and S < .25: return rgba(23, 23, 27, min(1, a + .06))
    if L > .45 and S >= .25:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255); r2, g2, b2 = colorsys.hls_to_rgb(h, .36, min(1, s))
        return rgba(r2 * 255, g2 * 255, b2 * 255, a)
    return None
def bgc(c):  # surfaces: dark -> light glass, faint white tint -> faint ink tint
    r, g, b, a = c; L, S = lum(r, g, b), sat(r, g, b)
    if L < .06 and (S < .55 or L < .02): return rgba(255, 255, 255, a if a < .5 else min(1, a + .04))
    if L > .7 and S < .2 and a < .5: return rgba(17, 17, 20, a * .7)
    return None
def bdc(c):
    r, g, b, a = c; L, S = lum(r, g, b), sat(r, g, b)
    if L > .7 and S < .2: return rgba(17, 17, 20, min(.22, a * 1.1))
    return None
TEXT = {'color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color'}
BG = {'background', 'background-color', 'background-image'}
BD = {'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-top-color', 'border-bottom-color', 'outline', 'outline-color'}
def conv(prop, val, kind):
    f = {'t': fg, 'b': bgc, 'd': bdc}[kind]; changed = [False]
    def rep(m):
        c = parse(m.group(0))
        if not c: return m.group(0)
        n = f(c)
        if n: changed[0] = True; return n
        return m.group(0)
    out = COLOR.sub(rep, val)
    return out if changed[0] else None
def accent_bg(decls):
    for p, v, _ in decls:
        if p in BG:
            if 'var(--treesh' in v or 'color-mix' in v: return True
            for m in COLOR.finditer(v):
                c = parse(m.group(0))
                if c and c[3] > .5 and sat(*c[:3]) > .35 and .03 < lum(*c[:3]) < .8: return True
    return False

def selectors(prelude):
    t, out, cur, d = tinycss2.serialize(prelude), [], '', 0
    for ch in t:
        if ch == '(': d += 1
        elif ch == ')': d -= 1
        if ch == ',' and d == 0: out.append(cur.strip()); cur = ''
        else: cur += ch
    if cur.strip(): out.append(cur.strip())
    return out
def subject_classes(sel):
    last = re.split(r'\s*[>+~]\s*|\s+', re.sub(r'::?[a-z-]+(\([^)]*\))?', '', sel).strip())[-1]
    return set(re.findall(r'[.#][A-Za-z0-9_-]+', last)), set(re.findall(r'[.#][A-Za-z0-9_-]+', sel))
def scope(sel, groups):
    if re.match(r'^(html|:root)\b', sel):
        return re.sub(r'^html', 'html.theme-light', sel, 1) if sel.startswith('html') else None
    if sel.startswith('body'): return 'html.theme-light ' + sel
    roots = sorted({SCOPE[g] for g in groups})
    for g in groups:
        m = re.search(re.escape(ROOT_IDS[g]) + r'(?![\w-])', sel)
        if m: return 'html.theme-light ' + sel[:m.start()] + SCOPE[g] + sel[m.end():]
    if any(re.search(re.escape(ROOT_IDS[g]) + r'[\w-]', sel) for g in groups): return 'html.theme-light ' + sel
    return f"html.theme-light :is({','.join(roots)}) {sel}"

handwritten = set()
for _, css in SOURCES:
    for m in re.finditer(r'html\.theme-light\s+([^{},]+)[,{]', css): handwritten.add(m.group(1).strip())

out, n_rules = [], 0
def walk(rules, depth=0):
    global n_rules
    res = []
    for r in rules:
        if r.type == 'at-rule' and r.lower_at_keyword in ('media', 'supports') and r.content:
            inner = walk(tinycss2.parse_rule_list(r.content, skip_whitespace=True, skip_comments=True), depth + 1)
            if inner: res.append('@' + r.at_keyword + tinycss2.serialize(r.prelude) + '{\n' + '\n'.join(inner) + '\n}')
            continue
        if r.type != 'qualified-rule': continue
        sels = selectors(r.prelude)
        keep = []
        for s in sels:
            if 'theme-light' in s or 'theme-dark' in s or s in handwritten or SKIP_SEL.search(s): continue
            subj, alls = subject_classes(s)
            groups = set().union(*[CLS.get(c, set()) for c in subj]) if subj else set()
            if not groups: groups = set().union(*[CLS.get(c, set()) for c in alls]) if alls else set()
            ids = {c for c in alls if c.startswith('#')}
            if groups and all(any(i in GROUPS[g]['cls'] or i == ROOT_IDS[g] for g in groups) for i in ids): keep.append((s, groups))
        if not keep: continue
        decls = [(d.lower_name, tinycss2.serialize(d.value).strip(), d.important) for d in tinycss2.parse_blocks_contents(r.content, skip_whitespace=True, skip_comments=True) if d.type == 'declaration']
        acc = accent_bg(decls); new = []
        for p, v, imp in decls:
            kind = 't' if p in TEXT else 'b' if p in BG else 'd' if p in BD else None
            if not kind or (kind == 't' and acc): continue
            nv = conv(p, v, kind)
            if nv: new.append(f'{p}:{nv}{" !important" if imp else ""}')
        if not new: continue
        sc = [x for x in (scope(s, g) for s, g in keep) if x]
        if not sc: continue
        n_rules += 1; res.append(','.join(sc) + '{ ' + '; '.join(new) + '; }')
    return res
for name, css in SOURCES:
    rules = walk(tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True))
    if rules: out.append(f'/* from {name} */\n' + '\n'.join(rules))
# tailwind helpers inside those panels behave like the rest of the light theme (they were pinned white by .dark-surface)
R = ','.join(sorted({SCOPE[g] for g in ONLY if g not in ('modal', 'bd', 'pf')}))  # roots whose whole panel is a .dark-surface
tw = [f"html.theme-light:not(.x) :is({R}) .text-white{{ color:#17171b !important; }}"]
for a, v in [(90, .92), (85, .88), (80, .84), (75, .78), (70, .72), (65, .68), (60, .64), (55, .6), (50, .58), (45, .55), (40, .52), (35, .48), (30, .44), (25, .4)]:
    tw.append(f"html.theme-light:not(.x) :is({R}) .text-white\\/{a}{{ color:rgba(23,23,27,{v}) !important; }}")
for a, v in [(5, .04), (10, .06), (12, .07), (15, .09), (20, .12)]:
    tw.append(f"html.theme-light:not(.x) :is({R}) .bg-white\\/{a}{{ background-color:rgba(17,17,20,{v}) !important; }}")
for a, v in [(10, .1), (12, .12), (15, .14)]:
    tw.append(f"html.theme-light:not(.x) :is({R}) .border-white\\/{a}{{ border-color:rgba(17,17,20,{v}) !important; }}")
txt = '/* ---------- P9zzj (generated by gen_light.py, do not edit): light theme for the panels that were dark-only ---------- */\n' + '\n'.join(out) + '\n/* tailwind helpers */\n' + '\n'.join(tw) + '\n'
open(M + 'p9zzj.css', 'w', encoding='utf-8').write(txt)
print('rules', n_rules, 'bytes', len(txt))
