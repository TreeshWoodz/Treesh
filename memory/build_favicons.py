import urllib.request, io, os, json
from PIL import Image, ImageDraw, ImageFilter
SRC = 'https://ik.imagekit.io/treesh/IMG_7255.png'
OUT = '/app/single_html/'
os.makedirs(OUT + 'icons', exist_ok=True)
im = Image.open(io.BytesIO(urllib.request.urlopen(SRC).read())).convert('RGB')
W = im.size[0]

def save(img, size, path):
    img.resize((size, size), Image.LANCZOS).save(OUT + path, optimize=True)

for sz, p in [(32, 'icons/favicon-32.png'), (192, 'icons/icon-192.png'), (512, 'icons/icon-512.png'), (180, 'icons/apple-touch-icon.png'), (180, 'apple-touch-icon.png')]:
    save(im, sz, p)
im.resize((48, 48), Image.LANCZOS).save(OUT + 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

# maskable: only the chrome mark (no frame/gloss) on a navy glow, inside the 80% safe circle
from PIL import ImageChops
k = W / 1254
P = lambda pts: [(x * k, y * k) for x, y in pts]
hull = Image.new('L', im.size, 0)
ImageDraw.Draw(hull).polygon(P([(626, 128), (772, 520), (1145, 350), (1203, 850), (905, 990), (626, 868), (350, 985), (46, 850), (103, 350), (480, 520)]), fill=255)
hull = hull.filter(ImageFilter.MaxFilter(15))
m = ImageChops.multiply(im.convert('L').point(lambda v: 255 if v > 70 else 0), hull)
m = m.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(5))
m = ImageChops.multiply(m, hull.filter(ImageFilter.GaussianBlur(3)))
cx, cy, half = 626 * k, 560 * k, 712 * k
S = int(half / 0.38)
bg = Image.new('RGB', (S, S), (7, 13, 23))
g = Image.new('L', (S, S), 0)
ImageDraw.Draw(g).ellipse([S * .2, S * .2, S * .8, S * .8], fill=255)
bg = Image.composite(Image.new('RGB', (S, S), (28, 44, 74)), bg, g.filter(ImageFilter.GaussianBlur(S * .1)))
fg, fm, off = Image.new('RGB', (S, S)), Image.new('L', (S, S), 0), (int(S / 2 - cx), int(S / 2 - cy))
fg.paste(im, off); fm.paste(m, off)
can = Image.composite(fg, bg, fm)
for sz in (192, 512):
    save(can, sz, f'icons/icon-maskable-{sz}.png')

V = '7255'
mani = {
    "name": "Treesh", "short_name": "Treesh",
    "description": "Welcome to the Woodz. Sing, write, make beats, design and play.",
    "start_url": "./", "scope": "./", "display": "standalone",
    "background_color": "#08080a", "theme_color": "#0a0a0b",
    "icons": [
        {"src": f"icons/icon-192.png?v={V}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": f"icons/icon-512.png?v={V}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": f"icons/icon-maskable-192.png?v={V}", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
        {"src": f"icons/icon-maskable-512.png?v={V}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
}
open(OUT + 'manifest.webmanifest', 'w').write(json.dumps(mani, indent=2) + '\n')
print('icons ok', sorted(os.listdir(OUT + 'icons')))
