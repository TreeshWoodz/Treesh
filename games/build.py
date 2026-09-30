#!/usr/bin/env python3
"""Build FREA! into ONE self-contained file: games/frea.html
base.html (original game) + src/*.css injected before </head> + src/*.js modules before </body>.
Run:  python3 /app/games/build.py"""
import os, re
D = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(D, 'src')
html = open(os.path.join(S, 'base.html'), encoding='utf-8').read()
CSS = ['polish.css', 'studio.css', 'zenplus.css', 'hud.css', 'party.css', 'zenplay.css']
JS = ['treesh.js', 'style.js', 'parts.js', 'furni.js', 'seasonal.js', 'trophies.js', 'house.js', 'polish.js', 'arenas.js', 'zenplus.js', 'actions.js', 'zenart.js', 'zenplay.js', 'studio.js', 'modes.js', 'hud.js', 'party.js']
css = '\n'.join(open(os.path.join(S, f), encoding='utf-8').read() for f in CSS if os.path.exists(os.path.join(S, f)))
js = '\n'.join('/* ---- %s ---- */\n' % f + open(os.path.join(S, f), encoding='utf-8').read() for f in JS if os.path.exists(os.path.join(S, f)))
i = html.rfind('</head>'); html = html[:i] + '<style id="frea-polish">\n' + css + '\n</style>\n' + html[i:]
# modules are injected INSIDE the game's main IIFE (full closure access to game internals)
end = html.rfind('</script>'); i = html.rfind('})();', 0, end)
html = html[:i] + '\n/* ===== FREA! PLUS MODULES ===== */\n' + js + '\n' + html[i:]
open(os.path.join(D, 'frea.html'), 'w', encoding='utf-8').write(html)
print('built frea.html', len(html), 'bytes')
