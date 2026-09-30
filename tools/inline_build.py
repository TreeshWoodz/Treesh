"""Turn the CRA build into ONE self-contained chainz.html (JS + CSS + word bank inlined).
Drop-in replacement for treesh repo -> main -> games/chainz(.html), served at https://treesh.app/games/chainz"""
import re, os
B='/app/frontend/build'
html=open(f'{B}/index.html').read()
html=re.sub(r'<script src="https://assets\.emergent\.sh/scripts/emergent-main\.js"></script>','',html)
SCRIPTS=[]
def js(m):
    code=open(os.path.join(B, m.group(1).lstrip('./'))).read().replace('</script','<\\/script')
    SCRIPTS.append('<script>'+code+'</script>')
    return ''
def css(m):
    return '<style>'+open(os.path.join(B, m.group(1).lstrip('./'))).read()+'</style>'
html=re.sub(r'<script defer="defer" src="([^"]+\.js)"></script>', js, html)
html=re.sub(r'<link href="([^"]+\.css)" rel="stylesheet">', css, html)
assert 'static/js' not in html and 'static/css' not in html, 'unresolved asset'
bank=open(f'{B}/data/chainz-bank.json').read().replace('</','<\\/')
html=html.replace('<div id="root"></div>','<div id="root"></div><script type="application/json" id="chainz-bank-data">'+bank+'</script>',1)
# app script must run after #root exists (it was 'defer' in the head)
html=html.replace('</body>',''.join(SCRIPTS)+'</body>',1)
assert SCRIPTS, 'no scripts found' 
banner='<!--\nDesign: TREESH GAMES | CHAINZ\nVersion: 2.0.0\nCOPYRIGHT TREESH WOODZ 2026 All Rights Reserved.\nSingle-file build of the Chainz React app. Source: /frontend/src. Rebuild: bash deliverables/build.sh\n-->\n'
html=html.replace('<!doctype html>','<!doctype html>\n'+banner,1)
os.makedirs('/app/deliverables',exist_ok=True)
open('/app/deliverables/chainz.html','w').write(html)
print('chainz.html bytes', len(html))
