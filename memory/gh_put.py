import base64, json, os, sys, urllib.request, urllib.error
# usage: GT=... python3 gh_put.py <branch> <repo_path> <local_file> <message>
branch, path, local, msg = sys.argv[1:5]
API = f'https://api.github.com/repos/TreeshWoodz/Treesh/contents/{path}'
H = {'Authorization': f"Bearer {os.environ['GT']}", 'Accept': 'application/vnd.github+json', 'User-Agent': 'treesh-mad'}

def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, headers=H, data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.load(r)
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')

st, cur = call('GET', f'{API}?ref={branch}')
sha = cur.get('sha') if st == 200 else None
body = {'message': msg, 'branch': branch, 'content': base64.b64encode(open(local, 'rb').read()).decode()}
if sha: body['sha'] = sha
st, res = call('PUT', API, body)
print(st, path, branch, (res.get('commit') or {}).get('sha', res.get('message')))
