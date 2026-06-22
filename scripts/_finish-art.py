#!/usr/bin/env python3
"""
_finish-art.py — the deterministic local FINISHING pass for PARBAUGHS brand art.

Imagen 4 is a CONTENT generator, not a finishing tool. The "generic / not
professionally edited" look is the MISSING finishing pass, not (only) a prompt
problem (Founder 2026-06-14). This module turns a raw generation (blank product
on a flat keyable background) into a catalog-grade, brand-consistent asset.

See .claude/skills/parbaughs-image-gen/SKILL.md §6 for the doctrine. The fixed
pipeline order (NEVER reorder):

    KEY -> DECONTAMINATE -> GRADE -> UPSCALE -> COMPOSITE LOGO -> CROP/PAD -> SHADOW

Pure Pillow (PIL) — this workstation has no ImageMagick / sharp / numpy.
Everything below is C-accelerated PIL primitives (floodfill, MinFilter/MaxFilter
for erode/dilate, GaussianBlur for feather, point LUTs for grade, LANCZOS resize).

USAGE
  python scripts/_finish-art.py merch        # finish the whole merch apparel set
  python scripts/_finish-art.py one IN OUT KEYHEX [logo|nologo] [LOGOFILE]
  python scripts/_finish-art.py probe IN     # report bg corner colors + bbox (no write)

CREDIT DISCIPLINE: this script costs NOTHING (no API). Generate once with
_gen-vertex-art.mjs (~$0.02), then finish here as many times as needed.
"""
import sys, os
from PIL import Image, ImageDraw, ImageChops, ImageFilter, ImageOps

GEN = "public/img/gen"
LOGO_FULL = "public/img/logo/parbaughs-logo.png"      # full-colour P+rose (cream rose, green P)
LOGO_GOLD = "public/img/logo/parbaughs-knockout.png"  # gold monochrome knockout

# Brand palette (the only colours allowed in a finished asset) — used by the grade.
CREAM = (245, 239, 224)   # #F5EFE0
FELT  = (30, 77, 59)      # #1E4D3B
BRASS = (201, 162, 39)    # #C9A227
CLARET= (123, 45, 58)     # #7B2D3A
INK   = (26, 26, 26)      # #1A1A1A


# ---------------------------------------------------------------------------
# 1. KEY — CHROMA-channel key (robust to the brightness gradient Imagen bakes
#    into a "studio" background, which defeats corner-seed flood fill). Auto-
#    detects green- vs blue-screen from the corner-average dominant channel,
#    then keys pixels where that channel clearly dominates the other two by a
#    margin. Brand products (cream = low saturation, black = low all-channel,
#    forest-green on a BLUE screen = G-dominant vs B-dominant) all survive.
#    A connectivity pass then removes any product-interior speckle that happens
#    to match the key. Returns an L-mode alpha mask: 255 = keep, 0 = transparent.
# ---------------------------------------------------------------------------
def _corner_avg(img, k=24):
    w, h = img.size
    px = img.load()
    pts = []
    for cx, cy in [(k, k), (w - k, k), (k, h - k), (w - k, h - k)]:
        pts.append(px[cx, cy])
    n = len(pts)
    return tuple(sum(p[c] for p in pts) // n for c in range(3))

def key_flat_bg(img_rgb, margin=10):
    r, g, b = img_rgb.split()
    ca = _corner_avg(img_rgb)
    # which channel is the screen? 1=green, 2=blue (red screens unused)
    dom = 1 if ca[1] >= ca[2] else 2
    if dom == 1:           # green screen: bg where G-R and G-B both exceed margin
        d1 = ImageChops.subtract(g, r)
        d2 = ImageChops.subtract(g, b)
    else:                  # blue screen: bg where B-R and B-G both exceed margin
        d1 = ImageChops.subtract(b, r)
        d2 = ImageChops.subtract(b, g)
    m1 = d1.point(lambda p: 255 if p >= margin else 0)
    m2 = d2.point(lambda p: 255 if p >= margin else 0)
    bg = ImageChops.darker(m1, m2)          # AND -> 255 only where both exceed
    # No connectivity guard: the brand products (cream/black/forest/brass) have
    # no large key-coloured interiors, so any green/blue-dominant pixel IS
    # background — including the see-through pockets a ghost mannequin leaves
    # (collar gap, neck opening). Keying those too is what removes the floating
    # blue blob beside a collar. (Re-add a border-connected guard only if a
    # future asset legitimately contains a saturated green/blue interior.)
    alpha = ImageChops.invert(bg)           # product = NOT background
    return alpha


def keep_main_component(alpha):
    """Keep only the centre-connected opaque region (the product). Drops any
    detached background island the chroma key left behind — e.g. a lighter-blue
    patch beside a collar that wasn't quite key-coloured enough to remove but is
    clearly separate from the garment."""
    w, h = alpha.size
    binary = alpha.point(lambda p: 255 if p > 8 else 0)
    marker = binary.copy()
    filled = False
    for y in range(int(h * 0.18), int(h * 0.88), max(1, h // 24)):
        if marker.getpixel((w // 2, y)) >= 250:
            ImageDraw.floodfill(marker, (w // 2, y), 128, thresh=10)
            filled = True
    if not filled:
        return alpha
    main = marker.point(lambda p: 255 if p == 128 else 0)
    return ImageChops.darker(alpha, main)   # keep original alpha only inside main


# ---------------------------------------------------------------------------
# 2. DECONTAMINATE — erode the matte edge ~1px past the contaminated anti-alias
#    ring, then a TIGHT feather. Kills the white/colour halo that screams
#    "AI cutout". MinFilter(3) = 1px erosion; GaussianBlur(0.6) = sub-pixel feather.
# ---------------------------------------------------------------------------
def decontaminate(alpha):
    eroded = alpha.filter(ImageFilter.MinFilter(3))
    feathered = eroded.filter(ImageFilter.GaussianBlur(0.6))
    return feathered


# ---------------------------------------------------------------------------
# 3. GRADE — one identically-authored tone map applied to EVERY asset (the #1
#    "shot in one session" lever). A gentle warm filmic curve: lift shadows
#    toward ink-warm, pull highlights toward cream, very subtle so it unifies
#    without recolouring. Applied to RGB only (alpha untouched).
# ---------------------------------------------------------------------------
def _curve(lut_lo, lut_hi):
    # build a 256-entry LUT that maps 0->lut_lo and 255->lut_hi linearly,
    # i.e. a mild contrast/level adjust per channel.
    return [round(lut_lo + (lut_hi - lut_lo) * (i / 255.0)) for i in range(256)]

# warm catalog grade: tiny shadow lift, tiny highlight roll-off, gentle warmth.
_R = _curve(8, 252)
_G = _curve(6, 248)
_B = _curve(4, 240)   # pull blue down a hair -> warm, cream-leaning whites

def grade(img_rgb):
    r, g, b = img_rgb.split()
    r = r.point(_R); g = g.point(_G); b = b.point(_B)
    return Image.merge("RGB", (r, g, b))


# ---------------------------------------------------------------------------
# 4. UPSCALE — Imagen tops ~1024px; retina wants 2x. LANCZOS + a light unsharp
#    mask, alpha preserved (resize the RGBA together).
# ---------------------------------------------------------------------------
def upscale(rgba, factor=2):
    w, h = rgba.size
    up = rgba.resize((w * factor, h * factor), Image.LANCZOS)
    # unsharp only the RGB, keep alpha crisp from the resize
    r, g, b, a = up.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(
        ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    rr, gg, bb = rgb.split()
    return Image.merge("RGBA", (rr, gg, bb, a))


# ---------------------------------------------------------------------------
# 5. COMPOSITE LOGO — the real P+rose vector onto the BLANK garment chest.
#    Imagen must NEVER render the mark (it garbles small marks). frac_w =
#    logo width as a fraction of the garment bbox width; cx,cy = logo centre as
#    a fraction of the bbox. Light fabric -> full-colour logo; dark -> gold.
# ---------------------------------------------------------------------------
def composite_logo(rgba, bbox, logo_path, frac_w=0.16, cx=0.40, cy=0.38, opacity=235):
    logo = Image.open(logo_path).convert("RGBA")
    bx0, by0, bx1, by1 = bbox
    bw, bh = bx1 - bx0, by1 - by0
    target_w = max(1, int(bw * frac_w))
    lw, lh = logo.size
    target_h = max(1, int(lh * (target_w / lw)))
    logo = logo.resize((target_w, target_h), Image.LANCZOS)
    if opacity < 255:
        la = logo.split()[3].point(lambda p: int(p * opacity / 255))
        logo.putalpha(la)
    px = bx0 + int(bw * cx) - target_w // 2
    py = by0 + int(bh * cy) - target_h // 2
    out = rgba.copy()
    out.alpha_composite(logo, (px, py))
    return out


# ---------------------------------------------------------------------------
# 6. CROP/PAD — trim to the alpha bbox, add a proportional border, extent to a
#    fixed centred canvas. Run identically across the set -> uniform framing.
# ---------------------------------------------------------------------------
def crop_pad(rgba, canvas=(1536, 1536), border_frac=0.10):
    bbox = rgba.split()[3].getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    cw, ch = canvas
    inner_w = int(cw * (1 - 2 * border_frac))
    inner_h = int(ch * (1 - 2 * border_frac))
    w, h = rgba.size
    scale = min(inner_w / w, inner_h / h)
    rgba = rgba.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    w, h = rgba.size
    out.alpha_composite(rgba, ((cw - w) // 2, (ch - h) // 2))
    return out


# ---------------------------------------------------------------------------
# 7. SHADOW — synthesize a soft grounded contact shadow BEHIND the product, so
#    it doesn't float. Dilate the alpha, blur heavily, drop to ~38% black,
#    offset slightly down, composite under the product. Then flatten onto a
#    warm-cream studio gradient sweep so the final is a finished catalog frame.
# ---------------------------------------------------------------------------
def _cream_sweep(size):
    # vertical gradient from light warm cream (top) to a touch darker (bottom),
    # no horizon line — a seamless studio sweep.
    w, h = size
    top = (247, 242, 230)
    bot = (231, 223, 205)
    base = Image.new("RGB", size, top)
    grad = Image.new("L", (1, h))
    for y in range(h):
        grad.putpixel((0, y), int(255 * (y / max(1, h - 1))))
    grad = grad.resize(size)
    darker = Image.new("RGB", size, bot)
    return Image.composite(darker, base, grad)

def ground_and_flatten(rgba, shadow_blur=34, shadow_alpha=98, dy=26):
    w, h = rgba.size
    alpha = rgba.split()[3]
    sh = alpha.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(shadow_blur))
    sh = sh.point(lambda p: int(p * shadow_alpha / 255))
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    black = Image.new("RGBA", (w, h), (20, 18, 14, 255))
    shadow_layer.paste(black, (0, dy), sh)
    bg = _cream_sweep((w, h)).convert("RGBA")
    bg.alpha_composite(shadow_layer)
    bg.alpha_composite(rgba)
    return bg.convert("RGB")


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
def finish_one(in_path, out_path, key_margin=16, logo=None, factor=2,
               canvas=(1536, 1536), grounded=True):
    img = Image.open(in_path).convert("RGB")
    alpha = key_flat_bg(img, margin=key_margin)
    alpha = keep_main_component(alpha)
    alpha = decontaminate(alpha)
    graded = grade(img)
    rgba = graded.copy(); rgba.putalpha(alpha)
    rgba = upscale(rgba, factor=factor)
    if logo:
        bbox = rgba.split()[3].getbbox() or (0, 0, rgba.width, rgba.height)
        rgba = composite_logo(rgba, bbox, **logo)
    rgba = crop_pad(rgba, canvas=canvas)
    final = ground_and_flatten(rgba) if grounded else rgba
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    if out_path.lower().endswith((".jpg", ".jpeg")):
        final.convert("RGB").save(out_path, "JPEG", quality=90, optimize=True)
    else:
        final.save(out_path, "PNG", optimize=True)
    print(f"  [FINISH] {os.path.basename(in_path)} -> {out_path}  ({final.size[0]}x{final.size[1]})")


# Per-item finishing recipes for the merch apparel set. logo dict: chest crest.
# cx/cy/frac_w tuned per garment shape; refine after V1 inspection.
# logo: a left-chest crest. cx<0.5 leans it to the wearer's left chest on the
# 3/4-rotated ghost mannequin; the P+rose is a tall narrow mark so frac_w (width
# fraction of the garment bbox) ~0.10 reads as a realistic ~8cm embroidered crest.
MERCH = {
    "hoodie":     dict(raw="merch-hoodie",     out="public/img/merch/hoodie.jpg",
                       logo=dict(logo_path=LOGO_GOLD, frac_w=0.105, cx=0.40, cy=0.34, opacity=255)),
    "polo":       dict(raw="merch-polo",       out="public/img/merch/polo.jpg",
                       logo=dict(logo_path=LOGO_FULL, frac_w=0.10, cx=0.39, cy=0.36, opacity=255)),
    "quarterzip": dict(raw="merch-quarterzip", out="public/img/merch/quarterzip.jpg",
                       logo=dict(logo_path=LOGO_GOLD, frac_w=0.10, cx=0.40, cy=0.36, opacity=255)),
    # Founder 2026-06-22 tour lineup: vest + hat replace the tee.
    "vest":       dict(raw="merch-vest",       out="public/img/merch/vest.jpg",
                       logo=dict(logo_path=LOGO_GOLD, frac_w=0.10, cx=0.40, cy=0.36, opacity=255)),
    "hat":        dict(raw="merch-hat",        out="public/img/merch/hat.jpg",
                       logo=dict(logo_path=LOGO_GOLD, frac_w=0.13, cx=0.50, cy=0.44, opacity=255)),
}


# SCENE finishing — lifestyle / filler photos. No keying (full-frame photo):
# a very gentle warm grade + a light unsharp + cap the long side + save JPG
# (photographic, so JPG q88 is far smaller than PNG — good for the mobile PWA).
def finish_scene(in_path, out_path, max_side=1600, warm=True):
    img = Image.open(in_path).convert("RGB")
    if warm:
        # lighter touch than the product grade — these are already golden-hour.
        r, g, b = img.split()
        b = b.point(lambda p: max(0, int(p * 0.98)))   # a hair warmer
        img = Image.merge("RGB", (r, g, b))
    w, h = img.size
    if max(w, h) < max_side:
        f = max_side / max(w, h)
        img = img.resize((int(w * f), int(h * f)), Image.LANCZOS)
    elif max(w, h) > max_side:
        f = max_side / max(w, h)
        img = img.resize((int(w * f), int(h * f)), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=45, threshold=2))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, "JPEG", quality=88, optimize=True)
    print(f"  [SCENE]  {os.path.basename(in_path)} -> {out_path}  ({img.size[0]}x{img.size[1]})")

LIFESTYLE = {
    "fairway":   ("life-fairway",   "public/img/merch/lifestyle-fairway.jpg"),
    "teebox":    ("life-teebox",    "public/img/merch/lifestyle-teebox.jpg"),
    "clubhouse": ("life-clubhouse", "public/img/merch/lifestyle-clubhouse.jpg"),
}


# COSMETIC RING finishing — chroma-keying the green removes BOTH the outer bg AND
# the hollow center (both green) -> a transparent ring. The gray relief is then
# tinted through a metal/enamel gradient (shadows->dark, highlights->light) so the
# whole set shares one exact palette. NO grounding (it's a transparent overlay that
# frames the user photo). Output to public/img/cosmetics/ (committed).
RING_RAMPS = {
    "brass":  ((58, 44, 12), (246, 214, 120)),
    "silver": ((70, 72, 78), (238, 240, 245)),
    "gold":   ((92, 66, 8),  (255, 226, 138)),
    "claret": ((46, 14, 20), (188, 92, 110)),
    "felt":   ((10, 32, 24), (86, 150, 120)),
    "bronze": ((50, 32, 14), (198, 138, 78)),
}

def finish_ring(in_path, out_path, tint="brass", canvas=(512, 512)):
    img = Image.open(in_path).convert("RGB")
    alpha = key_flat_bg(img, margin=10)          # removes outer green AND center hole
    alpha = decontaminate(alpha)
    gray = ImageOps.autocontrast(img.convert("L"), cutoff=1)
    lo, hi = RING_RAMPS[tint]
    colored = ImageOps.colorize(gray, lo, hi).convert("RGBA")
    colored.putalpha(alpha)
    out = crop_pad(colored, canvas=canvas, border_frac=0.015)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    out.save(out_path, "PNG", optimize=True)
    print(f"  [RING]   {os.path.basename(in_path)} ({tint}) -> {out_path}")

# raw -> (committed out, tint). Brass for bought/common; gold+claret for apex tiers.
COSMETIC_RINGS = {
    "laurel": ("ring-laurel", "public/img/cosmetics/ring-laurel.png", "gold"),
    "rope":   ("ring-rope",   "public/img/cosmetics/ring-rope.png",   "brass"),
    "clubs":  ("ring-clubs",  "public/img/cosmetics/ring-clubs.png",  "brass"),
    "wreath": ("ring-wreath", "public/img/cosmetics/ring-wreath.png", "claret"),
}


# DECO finishing — award-winning avatar decorations. Key the flat bg (auto green/
# blue), keep the hollow center (it is the keyable bg), decontaminate, uniform
# square canvas, NO tint (preserve the full-colour illustration). Also writes a
# composite over a stand-in avatar for V1. Output -> public/img/cosmetics/.
DECO_ITEMS = ["deco-caddy-companion", "deco-hole-in-one", "deco-champion",
              "deco-masters-azalea", "deco-frost-delay"]

def finish_deco(name, avatar_src="public/img/merch/lifestyle-teebox.jpg"):
    raw = f"{GEN}/{name}.png"
    if not os.path.exists(raw):
        print(f"  [SKIP] {name}: no raw"); return
    img = Image.open(raw).convert("RGB")
    alpha = key_flat_bg(img, margin=14)
    alpha = decontaminate(alpha)
    ring = img.convert("RGBA"); ring.putalpha(alpha)
    ring = crop_pad(ring, canvas=(512, 512), border_frac=0.01)
    out = f"public/img/cosmetics/{name}.png"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ring.save(out, "PNG", optimize=True)
    # V1 composite over a circular avatar
    photo = Image.open(avatar_src).convert("RGB").resize((512, 512))
    canvas = Image.new("RGBA", (512, 512), (245, 239, 224, 255))
    d = int(512 * 0.70); av = photo.resize((d, d))
    m = Image.new("L", (d, d), 0); ImageDraw.Draw(m).ellipse((0, 0, d, d), fill=255)
    off = (512 - d) // 2; canvas.paste(av, (off, off), m); canvas.alpha_composite(ring)
    os.makedirs(".claude/state/decofin", exist_ok=True)
    canvas.convert("RGB").save(f".claude/state/decofin/{name}-on-avatar.png")
    print(f"  [DECO]   {name} -> {out}  (bbox {ring.split()[3].getbbox()})")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "merch"
    if mode == "deco":
        print("FINISH avatar decorations:")
        for n in DECO_ITEMS:
            finish_deco(n)
        return
    if mode == "cosmetic":
        print("FINISH cosmetic ring decorations:")
        for name, (raw, out, tint) in COSMETIC_RINGS.items():
            rp = f"{GEN}/{raw}.png"
            if os.path.exists(rp):
                finish_ring(rp, out, tint=tint)
            else:
                print(f"  [SKIP] {name}: no raw at {rp}")
        return
    if mode == "lifestyle":
        print("FINISH lifestyle scenes:")
        for name, (raw, out) in LIFESTYLE.items():
            rp = f"{GEN}/{raw}.png"
            if os.path.exists(rp):
                finish_scene(rp, out)
            else:
                print(f"  [SKIP] {name}: no raw at {rp}")
        return
    if mode == "probe":
        img = Image.open(sys.argv[2]).convert("RGB")
        w, h = img.size
        print("size", img.size, "corners:",
              img.getpixel((0, 0)), img.getpixel((w - 1, 0)),
              img.getpixel((0, h - 1)), img.getpixel((w - 1, h - 1)))
        a = decontaminate(key_flat_bg(img))
        print("alpha bbox after key:", a.getbbox())
        return
    if mode == "one":
        _, _, in_p, out_p, keyhex = sys.argv[:5]
        logo = None
        if len(sys.argv) > 5 and sys.argv[5] != "nologo":
            lf = sys.argv[6] if len(sys.argv) > 6 else LOGO_FULL
            logo = dict(logo_path=lf)
        finish_one(in_p, out_p, logo=logo)
        return
    if mode == "merch":
        print("FINISH merch apparel set (pure-PIL pipeline):")
        for name, cfg in MERCH.items():
            raw = f"{GEN}/{cfg['raw']}.png"
            if not os.path.exists(raw):
                print(f"  [SKIP] {name}: no raw at {raw}")
                continue
            finish_one(raw, cfg["out"], logo=cfg["logo"])
        return
    print("unknown mode:", mode)


if __name__ == "__main__":
    main()
