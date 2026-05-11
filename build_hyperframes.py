"""
Build a 1-minute hyperframes marketing video for Cudd Realty Inc.
Produces: cudd_realty_hyperframes.gif
"""

import math
from PIL import Image, ImageDraw, ImageFont

# ── canvas ────────────────────────────────────────────────────────────────────
W, H       = 1280, 720
FPS        = 24          # smooth animation
DURATION   = 60          # seconds
TOTAL_FR   = FPS * DURATION   # 1440 frames

FONT_BOLD   = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG    = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_SERIF  = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"

# ── brand colours ─────────────────────────────────────────────────────────────
NAVY   = (10,  36,  99)
GOLD   = (197, 153,  65)
WHITE  = (255, 255, 255)
LGRAY  = (240, 240, 245)
DGRAY  = ( 50,  50,  60)
TRANS  = (  0,   0,   0,   0)

def font(path, size):
    return ImageFont.truetype(path, size)

# ── helper drawing ─────────────────────────────────────────────────────────────
def centered_text(draw, text, y, fnt, color=WHITE, shadow=True):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    x  = (W - tw) // 2
    if shadow:
        draw.text((x+2, y+2), text, font=fnt, fill=(0,0,0,120))
    draw.text((x, y), text, font=fnt, fill=color)

def gold_bar(draw, y=H-8, thickness=8):
    draw.rectangle([0, y, W, y+thickness], fill=GOLD)

def gold_line(draw, y, width=120):
    x0 = (W - width) // 2
    draw.rectangle([x0, y, x0+width, y+4], fill=GOLD)

def draw_house_icon(draw, cx, cy, size=60, color=GOLD):
    """Simple house silhouette."""
    half = size // 2
    # roof
    draw.polygon([
        (cx, cy - size),
        (cx - size, cy),
        (cx + size, cy),
    ], fill=color)
    # body
    draw.rectangle([cx - half, cy, cx + half, cy + size], fill=color)
    # door
    draw.rectangle([cx - 12, cy + size//2, cx + 12, cy + size], fill=NAVY)

def draw_star(draw, cx, cy, r=18, color=GOLD):
    import math
    pts = []
    for i in range(10):
        angle = math.radians(i * 36 - 90)
        radius = r if i % 2 == 0 else r * 0.45
        pts.append((cx + radius * math.cos(angle),
                    cy + radius * math.sin(angle)))
    draw.polygon(pts, fill=color)

# ── slide builders ────────────────────────────────────────────────────────────

def slide_title(progress):
    """Slide 0: Title card."""
    img  = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # diagonal accent stripe
    draw.polygon([(0,H),(W*0.6,0),(W,0),(W,H*0.4)], fill=(20,55,140))

    # house icons row
    for i, x in enumerate(range(120, W-100, 220)):
        draw_house_icon(draw, x, H-110, size=40,
                        color=(197,153,65,180) if i%2==0 else (255,255,255,60))

    gold_bar(draw)

    f1 = font(FONT_SERIF, 100)
    f2 = font(FONT_BOLD,  38)
    f3 = font(FONT_REG,   26)

    alpha = min(1.0, progress * 3)
    centered_text(draw, "CUDD REALTY", int(H*0.28), f1)
    gold_line(draw, int(H*0.28)+108)
    centered_text(draw, "INC.", int(H*0.28)+120, f2, GOLD)
    centered_text(draw, "Denton's Trusted Real Estate Experts Since 1999",
                  int(H*0.65), f3, LGRAY)
    return img


def slide_experience(progress):
    """Slide 1: 26 years of experience."""
    img  = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0,0,W,H//2], fill=(15,48,120))
    gold_bar(draw)

    # large number
    fn = font(FONT_SERIF, 220)
    centered_text(draw, "26", 60, fn, GOLD)

    f2 = font(FONT_BOLD, 52)
    f3 = font(FONT_REG,  30)
    centered_text(draw, "YEARS OF EXPERIENCE", H//2+20, f2)
    gold_line(draw, H//2+82)
    centered_text(draw, "Serving North Texas buyers & sellers since 1999",
                  H//2+100, f3, LGRAY)
    return img


def slide_services(progress):
    """Slide 2: Buy / Sell / Rent triptych."""
    img  = Image.new("RGB", (W, H), LGRAY)
    draw = ImageDraw.Draw(img)

    panels = [
        (NAVY,  "BUY",  "Find your perfect\nhome in Denton"),
        (DGRAY, "SELL", "Creative marketing\nto sell faster"),
        (GOLD,  "RENT", "Rental properties\nacross North Texas"),
    ]
    pw = W // 3
    fb = font(FONT_BOLD, 60)
    fs = font(FONT_REG,  24)
    for i, (col, title, sub) in enumerate(panels):
        x0, x1 = i*pw, (i+1)*pw
        draw.rectangle([x0, 0, x1, H], fill=col)
        draw_house_icon(draw, x0+pw//2, H//2-80, size=45,
                        color=WHITE if col != GOLD else NAVY)
        bbox = draw.textbbox((0,0), title, font=fb)
        tw = bbox[2]-bbox[0]
        tx = x0 + (pw-tw)//2
        draw.text((tx+2, H//2+12), title, font=fb, fill=(0,0,0,80))
        draw.text((tx,   H//2+10), title, font=fb,
                  fill=WHITE if col != GOLD else NAVY)
        for j, line in enumerate(sub.split("\n")):
            bbox2 = draw.textbbox((0,0), line, font=fs)
            lw = bbox2[2]-bbox2[0]
            lx = x0 + (pw-lw)//2
            draw.text((lx, H//2+80+j*34), line, font=fs,
                      fill=LGRAY if col != GOLD else DGRAY)

    # header banner
    draw.rectangle([0,0,W,80], fill=NAVY)
    fh = font(FONT_BOLD, 36)
    centered_text(draw, "COMPREHENSIVE REAL ESTATE SERVICES", 20, fh)
    gold_bar(draw)
    return img


def slide_luxury(progress):
    """Slide 3: Luxury homes."""
    img  = Image.new("RGB", (W, H), DGRAY)
    draw = ImageDraw.Draw(img)
    # gold gradient band
    draw.rectangle([0, H//3, W, H*2//3+20], fill=(30,30,40))
    gold_bar(draw)

    fb  = font(FONT_SERIF, 80)
    fb2 = font(FONT_BOLD,  44)
    fs  = font(FONT_REG,   28)

    centered_text(draw, "LUXURY HOME", 110, fb, GOLD)
    centered_text(draw, "SPECIALISTS", 200, fb, WHITE)
    gold_line(draw, 295, 200)
    centered_text(draw, "Exclusive listings across Denton & North Texas", 330, fs, LGRAY)
    centered_text(draw, "Private tours tailored to your lifestyle", 375, fs, LGRAY)
    centered_text(draw, "Full-service representation from offer to closing", 420, fs, LGRAY)

    # star row
    for i, x in enumerate(range(W//2-90, W//2+100, 45)):
        draw_star(draw, x, 510)

    centered_text(draw, "Top-Rated Luxury Real Estate in Denton County", 560, fs, GOLD)
    return img


def slide_agents(progress):
    """Slide 4: Meet the team."""
    img  = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0,0,W,120], fill=NAVY)
    draw.rectangle([0,H-100,W,H], fill=NAVY)
    gold_bar(draw)

    fh = font(FONT_BOLD, 38)
    fn = font(FONT_SERIF, 70)
    fs = font(FONT_REG,   28)
    fm = font(FONT_BOLD,  32)

    centered_text(draw, "MEET YOUR REALTORS", 38, fh)

    # left: Mariella
    draw.rectangle([60, 150, W//2-30, H-130], fill=NAVY)
    draw_house_icon(draw, W//4, 290, size=55, color=GOLD)
    centered_text_in(draw, "MARIELLA CUDD", W//4, 380, fm, WHITE)
    centered_text_in(draw, "Lead Realtor & Owner", W//4, 422, fs, LGRAY)
    centered_text_in(draw, "17 Active Listings", W//4, 465, fs, GOLD)
    centered_text_in(draw, "56 Homes Sold", W//4, 500, fs, GOLD)

    # right: Frank
    draw.rectangle([W//2+30, 150, W-60, H-130], fill=DGRAY)
    draw_house_icon(draw, W*3//4, 290, size=55, color=GOLD)
    centered_text_in(draw, "FRANK CUDD", W*3//4, 380, fm, WHITE)
    centered_text_in(draw, "Realtor & Co-Owner", W*3//4, 422, fs, LGRAY)
    centered_text_in(draw, "Expert Negotiator", W*3//4, 465, fs, GOLD)
    centered_text_in(draw, "North Texas Specialist", W*3//4, 500, fs, GOLD)

    centered_text(draw, "Family-Owned  •  Community-Focused  •  Results-Driven",
                  H-80, font(FONT_REG, 24), LGRAY)
    return img


def centered_text_in(draw, text, cx, y, fnt, color):
    bbox = draw.textbbox((0,0), text, font=fnt)
    tw = bbox[2]-bbox[0]
    draw.text((cx-tw//2, y), text, font=fnt, fill=color)


def slide_stats(progress):
    """Slide 5: Numbers that matter."""
    img  = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, H//2-2, W, H//2+2], fill=GOLD)
    gold_bar(draw)

    fh  = font(FONT_BOLD,  36)
    fn  = font(FONT_SERIF, 110)
    fs  = font(FONT_REG,   26)

    centered_text(draw, "THE NUMBERS SPEAK FOR THEMSELVES", 30, fh, GOLD)

    stats = [
        ("26",  "Years in Business", W//4),
        ("56+", "Homes Sold",        W//2),
        ("17",  "Active Listings",   W*3//4),
    ]
    for val, label, cx in stats:
        bbox = draw.textbbox((0,0), val, font=fn)
        tw = bbox[2]-bbox[0]
        draw.text((cx-tw//2, H//2-160), val, font=fn, fill=GOLD)
        bbox2 = draw.textbbox((0,0), label, font=fs)
        lw = bbox2[2]-bbox2[0]
        draw.text((cx-lw//2, H//2+20), label, font=fs, fill=WHITE)

    centered_text(draw, "Member: Denton Chamber of Commerce  •  NTREIS MLS",
                  H-70, fs, LGRAY)
    return img


def slide_why(progress):
    """Slide 6: Why choose us."""
    img  = Image.new("RGB", (W, H), LGRAY)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0,0,W,100], fill=NAVY)
    draw.rectangle([0,H-80,W,H], fill=NAVY)
    gold_bar(draw)

    fh = font(FONT_BOLD, 40)
    fs = font(FONT_REG,  28)
    fb = font(FONT_BOLD, 30)

    centered_text(draw, "WHY CHOOSE CUDD REALTY?", 28, fh)

    reasons = [
        ("★ Local Expertise",   "26 years mastering the Denton & North Texas market"),
        ("★ Personal Service",  "Family-owned — you work with the owners directly"),
        ("★ Full Spectrum",     "Buyers, sellers & renters all welcome"),
        ("★ Luxury Ready",      "Certified to handle high-end & investment properties"),
        ("★ Community Member",  "Active Denton Chamber of Commerce member"),
        ("★ Proven Results",    "56+ closed transactions & counting"),
    ]
    for i, (title, desc) in enumerate(reasons):
        y = 130 + i*82
        draw.rectangle([60, y, W-60, y+70], fill=NAVY if i%2==0 else DGRAY)
        draw.rectangle([60, y, 10+60, y+70], fill=GOLD)  # accent bar left
        draw.rectangle([60, y, 70, y+70], fill=GOLD)
        btxt_bbox = draw.textbbox((0,0), title, font=fb)
        draw.text((90, y+10), title, font=fb, fill=GOLD)
        draw.text((90, y+42), desc, font=font(FONT_REG,22), fill=LGRAY)

    centered_text(draw, "cuddrealtyinc.com  •  @cuddrealtytx", H-55,
                  font(FONT_REG, 22), LGRAY)
    return img


def slide_contact(progress):
    """Slide 7: Contact / CTA."""
    img  = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    # background accent
    draw.polygon([(W,0),(W,H),(W*0.35,H)], fill=(20,55,140))
    gold_bar(draw)

    fb  = font(FONT_SERIF, 72)
    fb2 = font(FONT_BOLD,  40)
    fs  = font(FONT_REG,   30)
    fxl = font(FONT_BOLD,  50)

    centered_text(draw, "READY TO MAKE YOUR MOVE?", 90, fb2, GOLD)
    gold_line(draw, 148, 300)

    details = [
        ("📞  940-595-5550",                 230),
        ("🌐  cuddrealtyinc.com",            295),
        ("📸  @cuddrealtytx on Instagram",   360),
        ("📍  2412 Old North Rd #104",       425),
        ("     Denton, TX 76209",            468),
    ]
    for text, y in details:
        bbox = draw.textbbox((0,0), text, font=fs)
        tw = bbox[2]-bbox[0]
        draw.text(((W-tw)//2, y), text, font=fs, fill=WHITE)

    # CTA button
    bx0, bx1 = W//2-200, W//2+200
    draw.rectangle([bx0, 540, bx1, 610], fill=GOLD)
    btn_f = font(FONT_BOLD, 34)
    btn_txt = "CALL US TODAY"
    bbox = draw.textbbox((0,0), btn_txt, font=btn_f)
    tw = bbox[2]-bbox[0]
    draw.text(((W-tw)//2, 550), btn_txt, font=btn_f, fill=NAVY)

    centered_text(draw, "CUDD REALTY INC  —  Your Home. Our Mission.",
                  H-50, font(FONT_REG, 24), LGRAY)
    return img


# ── slide schedule ─────────────────────────────────────────────────────────────
# (builder_fn, duration_seconds)
SLIDES = [
    (slide_title,      8),
    (slide_experience, 8),
    (slide_services,   8),
    (slide_luxury,     8),
    (slide_agents,     9),
    (slide_stats,      7),
    (slide_why,        7),
    (slide_contact,    5),
]

def build_frames():
    frames = []
    for builder, dur in SLIDES:
        n = FPS * dur
        for i in range(n):
            progress = i / max(1, n - 1)
            frames.append(builder(progress))
    # pad/trim to exact TOTAL_FR
    while len(frames) < TOTAL_FR:
        frames.append(frames[-1])
    return frames[:TOTAL_FR]


def main():
    print(f"Building {TOTAL_FR} frames @ {FPS} fps ({DURATION}s) …")
    frames = build_frames()
    print(f"Built {len(frames)} frames. Saving GIF …")

    out = "cudd_realty_hyperframes.gif"
    # For GIF: reduce to manageable fps (4 fps → 250 ms delay)
    step = FPS // 4
    gif_frames = frames[::step]
    gif_delay  = int(1000 / 4)

    # Convert to P mode for smaller file
    pal_frames = []
    for f in gif_frames:
        pal_frames.append(f.convert("P", palette=Image.ADAPTIVE, colors=128))

    pal_frames[0].save(
        out,
        save_all=True,
        append_images=pal_frames[1:],
        duration=gif_delay,
        loop=0,
        optimize=True,
    )
    import os
    mb = os.path.getsize(out) / 1_048_576
    print(f"Saved {out} ({mb:.1f} MB,  {len(gif_frames)} gif-frames)")


if __name__ == "__main__":
    main()
