"""Compose a labeled side-by-side of stale production vs current staging entry."""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.abspath(__file__))
LEFT_SRC = os.path.join(BASE, "..", "..", "..", "prod-entry-v8.23.1-STALE.png")
RIGHT_SRC = os.path.join(BASE, "entry-mobile-after.png")
OUT = os.path.join(BASE, "staleness-comparison-v8.23.1-vs-v8.23.94.png")

FELT = (18, 33, 26)
CHALK = (242, 236, 217)
BRASS = (192, 150, 70)
TERRA = (199, 96, 70)
MUTE = (150, 160, 150)

def font(sz, bold=False):
    path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    try:
        return ImageFont.truetype(path, sz)
    except Exception:
        return ImageFont.load_default()

def fit(im, h):
    w = int(im.width * (h / im.height))
    return im.resize((w, h), Image.LANCZOS)

PH = 720  # phone image height
left = fit(Image.open(LEFT_SRC).convert("RGB"), PH)
right = fit(Image.open(RIGHT_SRC).convert("RGB"), PH)

MARGIN = 46
GUTTER = 54
TITLE_H = 132
LABEL_H = 96
phone_w = max(left.width, right.width)
canvas_w = MARGIN * 2 + phone_w * 2 + GUTTER
canvas_h = TITLE_H + LABEL_H + PH + MARGIN

cv = Image.new("RGB", (canvas_w, canvas_h), FELT)
d = ImageDraw.Draw(cv)

def ctext(cx, y, s, fnt, fill, anchor="mm"):
    d.text((cx, y), s, font=fnt, fill=fill, anchor=anchor)

# Title
ctext(canvas_w // 2, 44, "The UI upgrade is done. You haven't seen it.", font(38, True), CHALK)
ctext(canvas_w // 2, 92, "Production is 93 ships behind staging. Same login screen, two versions:",
      font(23), MUTE)

lx = MARGIN + phone_w // 2
rx = MARGIN + phone_w + GUTTER + phone_w // 2
ly = TITLE_H + 30

# Left label (stale)
ctext(lx, ly, "PRODUCTION  ·  v8.23.1", font(27, True), CHALK)
ctext(lx, ly + 36, "what you see now  ·  STALE", font(21, True), TERRA)
# Right label (current)
ctext(rx, ly, "STAGING  ·  v8.23.94", font(27, True), CHALK)
ctext(rx, ly + 36, "ready now  ·  one push away  (#269)", font(21, True), BRASS)

py = TITLE_H + LABEL_H
lpx = MARGIN + (phone_w - left.width) // 2
rpx = MARGIN + phone_w + GUTTER + (phone_w - right.width) // 2
# subtle frame
d.rectangle([lpx - 2, py - 2, lpx + left.width + 1, py + PH + 1], outline=(70, 60, 40), width=2)
d.rectangle([rpx - 2, py - 2, rpx + right.width + 1, py + PH + 1], outline=BRASS, width=2)
cv.paste(left, (lpx, py))
cv.paste(right, (rpx, py))

cv.save(OUT, "PNG")
print("WROTE", OUT, cv.size)
