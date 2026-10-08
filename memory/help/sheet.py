import sys
from PIL import Image, ImageDraw
dev = sys.argv[1]; names = sys.argv[2:]
W, H = (480, 300) if dev == 'd' else (180, 390)
cols = 3 if dev == 'd' else 6
rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, (H + 18) * rows), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    try:
        im = Image.open(f'/app/single_html/content/help/{dev}/{n}.webp').convert('RGB').resize((W, H))
    except Exception:
        continue
    x, y = (i % cols) * W, (i // cols) * (H + 18)
    sheet.paste(im, (x, y + 18)); d.text((x + 4, y + 3), n, fill=(255, 220, 90))
sheet.save('/tmp/sheet.jpg', quality=72)
print(sheet.size)
