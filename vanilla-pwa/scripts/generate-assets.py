"""Optional maintainer tool; not needed to run or deploy the app.

Requires Pillow and reportlab. Regenerates committed icons/QRs and a local-only
Y4M video fixture read by Chromium's fake camera in browser tests.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel

ROOT = Path(__file__).resolve().parent.parent

def icon(size):
    scale = 4
    im = Image.new('RGB', (size * scale, size * scale), '#184e3b')
    d = ImageDraw.Draw(im)
    points = [(0.29, 0.50), (0.43, 0.64), (0.71, 0.35)]
    coords = [(int(x * size * scale), int(y * size * scale)) for x, y in points]
    width = int(size * scale * 0.075)
    d.line(coords, fill='white', width=width, joint='curve')
    for x, y in coords:
        r = width // 2
        d.ellipse((x-r, y-r, x+r, y+r), fill='white')
    return im.resize((size, size), Image.Resampling.LANCZOS)

for name, size in [('icon-192.png', 192), ('icon-512.png', 512), ('maskable-512.png', 512), ('apple-touch-icon.png', 180)]:
    icon(size).save(ROOT / 'icons' / name)

def qr_image(payload):
    qr = QRCode(None, QRErrorCorrectLevel.M)
    qr.addData(payload)
    qr.make()
    n = len(qr.modules)
    unit, margin = 10, 4
    image = Image.new('RGB', ((n + 2 * margin) * unit,) * 2, 'white')
    draw = ImageDraw.Draw(image)
    for y, row in enumerate(qr.modules):
        for x, dark in enumerate(row):
            if dark:
                a, b = (x + margin) * unit, (y + margin) * unit
                draw.rectangle((a, b, a + unit - 1, b + unit - 1), fill='black')
    return image

for code in [f'EVT-{n:03}' for n in range(1, 7)] + ['EVT-999', 'invalid']:
    qr_image(code).save(ROOT / 'docs' / 'qr' / f'{code}.png')

fixture_dir = ROOT / '.test-build'
fixture_dir.mkdir(exist_ok=True)
image = Image.new('RGB', (640, 480), 'white')
qr = qr_image('EVT-002')
image.paste(qr, ((640-qr.width)//2, (480-qr.height)//2))
y, cb, cr = image.convert('YCbCr').split()
frame = y.tobytes() + cb.resize((320, 240)).tobytes() + cr.resize((320, 240)).tobytes()
with (fixture_dir / 'EVT-002.y4m').open('wb') as video:
    video.write(b'YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\n')
    for _ in range(10):
        video.write(b'FRAME\n' + frame)
print('Icons, eight QR images and fake-camera video generated.')
