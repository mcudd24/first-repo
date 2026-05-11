"""
Cudd Realty — High-Quality Animated Hyperframes Video (v2)
Smooth transitions, motion blur, animated counters, gradient backgrounds,
slide-in text, zoom effects, particle-style accents.
Output: cudd_realty_hyperframes_v2.gif  (+ MP4 if ffmpeg available)
"""

import math, os, shutil, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── constants ─────────────────────────────────────────────────────────────────
W, H     = 1280, 720
FPS      = 30
DURATION = 60          # seconds
TOTAL_FR = FPS * DURATION

FONT_BOLD  = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG   = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"

# brand palette
NAVY   = np.array([10,  36,  99],  dtype=float)
GOLD   = np.array([197, 153,  65], dtype=float)
WHITE  = np.array([255, 255, 255], dtype=float)
LGRAY  = np.array([220, 225, 235], dtype=float)
DGRAY  = np.array([ 28,  30,  40], dtype=float)
ACCENT = np.array([255, 200,  80], dtype=float)

def col(arr): return tuple(int(c) for c in arr)

# ── easing ────────────────────────────────────────────────────────────────────
def ease_out_cubic(t): return 1 - (1-t)**3
def ease_in_out(t):    return t*t*(3-2*t)
def ease_out_back(t):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3*(t-1)**3 + c1*(t-1)**2
def ease_out_elastic(t):
    if t == 0: return 0
    if t == 1: return 1
    return 2**(-10*t) * math.sin((t*10 - 0.75)*2*math.pi/3) + 1

# ── font cache ────────────────────────────────────────────────────────────────
_fc = {}
def fnt(path, size):
    if (path, size) not in _fc:
        _fc[(path, size)] = ImageFont.truetype(path, size)
    return _fc[(path, size)]

# ── drawing helpers ───────────────────────────────────────────────────────────
def text_w(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[2]-bb[0], bb[3]-bb[1]

def cx_text(draw, text, y, font, color, alpha=255, shadow_offset=3):
    tw, _ = text_w(draw, text, font)
    x = (W - tw) // 2
    r,g,b = (color if len(color)==3 else color[:3])
    if shadow_offset:
        draw.text((x+shadow_offset, y+shadow_offset), text, font=font,
                  fill=(0,0,0, int(alpha*0.45)))
    draw.text((x, y), text, font=font, fill=(r,g,b,alpha))

def slide_text(draw, text, y, font, color, progress, direction="left", alpha=255):
    """Text slides in from a direction."""
    tw, _ = text_w(draw, text, font)
    tx_final = (W - tw) // 2
    t = ease_out_cubic(min(1.0, progress))
    if direction == "left":
        tx = int(-tw + (tx_final + tw) * t)
    elif direction == "right":
        tx = int(W + (tx_final - W) * t)
    elif direction == "up":
        ty_offset = int((1-t) * 60)
        r,g,b = color[:3]
        draw.text((tx_final+2, y+ty_offset+2), text, font=font, fill=(0,0,0,int(alpha*0.4)))
        draw.text((tx_final, y+ty_offset), text, font=font, fill=(r,g,b,alpha))
        return
    else:
        tx = tx_final
    r,g,b = color[:3]
    draw.text((tx+2, y+2), text, font=font, fill=(0,0,0,int(alpha*0.4)))
    draw.text((tx, y), text, font=font, fill=(r,g,b,alpha))

def gradient_rect(img, x0,y0,x1,y1, c1, c2, vertical=True):
    arr = np.array(img)
    if vertical:
        steps = y1-y0
        for i in range(steps):
            t = i/max(1,steps-1)
            c = (1-t)*c1 + t*c2
            arr[y0+i, x0:x1] = c.astype(np.uint8)
    else:
        steps = x1-x0
        for i in range(steps):
            t = i/max(1,steps-1)
            c = (1-t)*c1 + t*c2
            arr[y0:y1, x0+i] = c.astype(np.uint8)
    return Image.fromarray(arr.astype(np.uint8))

def gold_divider(draw, y, width=200, alpha=255):
    x = (W - width)//2
    draw.rectangle([x, y, x+width, y+4], fill=col(GOLD)+(alpha,))

def draw_star(draw, cx, cy, r=16, color=(197,153,65,255)):
    pts = []
    for i in range(10):
        a = math.radians(i*36 - 90)
        ri = r if i%2==0 else r*0.42
        pts.append((cx+ri*math.cos(a), cy+ri*math.sin(a)))
    draw.polygon(pts, fill=color)

def draw_house(draw, cx, cy, size=50, body_col=(197,153,65), roof_col=None):
    roof_col = roof_col or body_col
    half = size//2
    draw.polygon([(cx,cy-size),(cx-size,cy),(cx+size,cy)], fill=roof_col)
    draw.rectangle([cx-half, cy, cx+half, cy+size], fill=body_col)
    dw = size//6
    draw.rectangle([cx-dw, cy+size//2, cx+dw, cy+size], fill=col(NAVY))

def animated_counter(draw, cx, y, target, progress, font, color):
    val = int(target * ease_out_cubic(min(1,progress)))
    text = f"{val}+"
    tw, _ = text_w(draw, text, font)
    r,g,b = color[:3]
    draw.text((cx-tw//2+2, y+2), text, font=font, fill=(0,0,0,120))
    draw.text((cx-tw//2,   y),   text, font=font, fill=(r,g,b,255))

def progress_bar(draw, x, y, w, h, pct, bg=(30,35,55), fg=None):
    fg = fg or col(GOLD)
    draw.rectangle([x,y,x+w,y+h], fill=bg, outline=(60,70,100), width=1)
    draw.rectangle([x,y,x+int(w*pct),y+h], fill=fg)

def glowing_circle(draw, cx, cy, r, color, alpha=180):
    for i in range(4,0,-1):
        a = int(alpha * (i/4)**2)
        rr = r + (4-i)*6
        draw.ellipse([cx-rr, cy-rr, cx+rr, cy+rr],
                     fill=(*color[:3], a))
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=(*color[:3],255))

# ── background generators ─────────────────────────────────────────────────────
def bg_navy_gradient(t=0.0):
    c1 = NAVY * 0.7 + DGRAY * 0.3
    c2 = NAVY * 1.1
    c2 = np.clip(c2, 0, 255)
    img = gradient_rect(Image.new("RGB",(W,H)), 0,0,W,H, c1, c2)
    return img

def bg_dark_diagonal(pulse=0.0):
    img = Image.new("RGB",(W,H), col(DGRAY))
    arr = np.array(img, dtype=float)
    # diagonal gradient
    for y in range(H):
        for x in range(0, W, 4):
            t = (x + y) / (W + H)
            blend = 0.05 + 0.08 * math.sin(t * math.pi * 2 + pulse)
            arr[y, x:x+4] = np.clip(DGRAY*(1+blend), 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def add_particles(img, n=30, seed=0, alpha_max=120, t=0.0):
    draw = ImageDraw.Draw(img, "RGBA")
    rng = np.random.default_rng(seed)
    xs = rng.integers(0, W, n)
    ys = rng.integers(0, H, n)
    rs = rng.uniform(1, 5, n)
    for i in range(n):
        phase = rng.random() * math.pi * 2
        a = int(alpha_max * (0.5 + 0.5*math.sin(t*2*math.pi + phase)))
        r = int(rs[i])
        x, y = int(xs[i]), int(ys[i])
        draw.ellipse([x-r,y-r,x+r,y+r], fill=(*col(GOLD), a))
    return img

def fade_between(img_a, img_b, t):
    return Image.blend(img_a.convert("RGB"), img_b.convert("RGB"), t)

# ── SLIDE RENDERERS ───────────────────────────────────────────────────────────

def slide_00_title(p, t):
    """Cinematic title with animated gold lines."""
    img = bg_navy_gradient()
    img = add_particles(img, 40, seed=1, alpha_max=90, t=t)

    # animated diagonal accent
    draw = ImageDraw.Draw(img, "RGBA")
    sweep = ease_out_cubic(min(1, p*2))
    w_acc = int(W * sweep)
    draw.polygon([(0,H),(w_acc,0),(w_acc+60,0),(60,H)],
                 fill=(30,60,140,60))

    # gold horizontal lines animate in
    for i, y_frac in enumerate([0.08, 0.92]):
        line_p = ease_out_cubic(min(1, max(0, p*3 - i*0.3)))
        lw = int(W * line_p)
        draw.rectangle([(W-lw)//2, int(H*y_frac),
                         (W+lw)//2, int(H*y_frac)+5],
                        fill=(*col(GOLD), 255))

    # main title
    title_p = ease_out_back(min(1, max(0, p*2 - 0.2)))
    scale   = 0.6 + 0.4 * title_p
    f_title = fnt(FONT_SERIF, int(110 * scale))
    slide_text(draw, "CUDD REALTY", int(H*0.27), f_title,
               col(WHITE), min(1, p*2), "up", 255)

    sub_p = ease_out_cubic(min(1, max(0, p*2 - 0.5)))
    f_sub = fnt(FONT_BOLD, 42)
    slide_text(draw, "INC.", int(H*0.27)+120, f_sub,
               col(GOLD), sub_p, "up", int(255*sub_p))

    gold_divider(draw, int(H*0.27)+170, int(250*ease_out_cubic(min(1,max(0,p*2-0.6)))))

    tag_p = ease_out_cubic(min(1, max(0, p*2 - 0.8)))
    f_tag = fnt(FONT_REG, 28)
    slide_text(draw, "Denton's Trusted Real Estate Experts Since 1999",
               int(H*0.68), f_tag, col(LGRAY), tag_p, "up", int(255*tag_p))

    # house icons slide in from sides
    for i, (x, side) in enumerate([(120,"left"),(W-120,"right"),(W//2,"up")]):
        icon_p = ease_out_elastic(min(1, max(0, p*3 - i*0.15)))
        draw_house(draw, x, int(H*0.82)-40, size=35,
                   body_col=(*col(GOLD), int(160*icon_p)),
                   roof_col=(*col(GOLD), int(160*icon_p)))

    return img


def slide_01_experience(p, t):
    """26 years — animated number counter."""
    img = bg_navy_gradient()
    draw = ImageDraw.Draw(img, "RGBA")

    # rotating ring accent
    cx_r, cy_r = W//2, H//2 - 30
    for i in range(12):
        angle = math.radians(i*30 + t*180)
        rx = cx_r + int(260 * math.cos(angle))
        ry = cy_r + int(260 * math.sin(angle))
        a  = int(60 + 40 * math.sin(angle + t*3))
        draw.ellipse([rx-5,ry-5,rx+5,ry+5], fill=(*col(GOLD),a))

    # glowing circle behind number
    glow_p = ease_out_cubic(min(1, p*2))
    glowing_circle(draw, cx_r, cy_r, int(180*glow_p),
                   col(NAVY), alpha=120)

    # animated counter
    f_big = fnt(FONT_SERIF, 220)
    animated_counter(draw, cx_r, cy_r-130, 26, min(1,p*1.5), f_big, col(GOLD))

    f2 = fnt(FONT_BOLD, 52)
    f3 = fnt(FONT_REG, 30)
    slide_text(draw, "YEARS OF EXPERIENCE", H//2+110, f2,
               col(WHITE), min(1, max(0, p*2-0.4)), "up")
    gold_divider(draw, H//2+174, int(220*ease_out_cubic(min(1,max(0,p*2-0.6)))))
    slide_text(draw, "Serving North Texas buyers & sellers since 1999",
               H//2+192, f3, col(LGRAY), min(1,max(0,p*2-0.8)), "up",
               int(255*ease_out_cubic(min(1,max(0,p*2-0.8)))))

    # gold bar top & bottom
    bar_p = ease_out_cubic(min(1,p*3))
    bw = int(W*bar_p)
    draw.rectangle([(W-bw)//2, 0, (W+bw)//2, 6], fill=(*col(GOLD),255))
    draw.rectangle([(W-bw)//2, H-6, (W+bw)//2, H], fill=(*col(GOLD),255))
    return img


def slide_02_services(p, t):
    """Buy/Sell/Rent three-panel with staggered slide-in."""
    img = Image.new("RGB",(W,H), col(DGRAY))
    draw = ImageDraw.Draw(img, "RGBA")

    panels = [
        (NAVY*0.8+DGRAY*0.2, "BUY",  "Find your perfect home\nin Denton & North Texas", 0.0),
        (DGRAY,              "SELL", "Creative marketing\nto sell faster",             0.2),
        (GOLD*0.7+DGRAY*0.3, "RENT", "Rental properties\nacross North Texas",         0.4),
    ]
    pw = W//3
    for i, (base_col, title, sub, delay) in enumerate(panels):
        panel_p = ease_out_cubic(min(1, max(0, p*2 - delay)))
        x0 = i*pw
        # panel slides up
        y_off = int((1-panel_p)*H)
        draw.rectangle([x0, y_off, x0+pw, H+y_off], fill=col(base_col)+(220,))
        # gold accent left edge
        draw.rectangle([x0, y_off, x0+6, H+y_off], fill=(*col(GOLD),255))

        icon_p = ease_out_elastic(min(1, max(0, p*2.5-delay-0.2)))
        draw_house(draw, x0+pw//2, H//2-50+y_off, size=45,
                   body_col=(*col(WHITE), int(200*icon_p)),
                   roof_col=(*col(WHITE), int(200*icon_p)))

        fb = fnt(FONT_BOLD, 60)
        fs = fnt(FONT_REG, 24)
        tw, _ = text_w(draw, title, fb)
        draw.text((x0+(pw-tw)//2+2, H//2+22+y_off+2), title, font=fb, fill=(0,0,0,80))
        draw.text((x0+(pw-tw)//2,   H//2+20+y_off),   title, font=fb, fill=(*col(WHITE),255))

        for j, line in enumerate(sub.split("\n")):
            lw, _ = text_w(draw, line, fs)
            lx = x0 + (pw-lw)//2
            draw.text((lx, H//2+90+j*34+y_off), line, font=fs, fill=(*col(LGRAY),200))

    # header
    header_p = ease_out_cubic(min(1, max(0, p*3-0.6)))
    draw.rectangle([0, 0, W, 80], fill=(*col(NAVY), int(240*header_p)))
    slide_text(draw, "COMPREHENSIVE REAL ESTATE SERVICES", 22,
               fnt(FONT_BOLD, 34), col(WHITE), header_p, "up", int(255*header_p))
    draw.rectangle([0, H-6, W, H], fill=(*col(GOLD),255))
    return img


def slide_03_luxury(p, t):
    """Luxury — dark cinematic with shimmer."""
    img = Image.new("RGB",(W,H), col(DGRAY))
    arr = np.array(img, dtype=float)
    # vignette
    cx2, cy2 = W/2, H/2
    for y in range(0,H,2):
        for x in range(0,W,4):
            dist = math.sqrt(((x-cx2)/W)**2 + ((y-cy2)/H)**2)
            darken = max(0, dist-0.3)*1.5
            arr[y,x:x+4] = np.clip(arr[y,x:x+4] * (1-darken*0.7), 0, 255)
    img = Image.fromarray(arr.astype(np.uint8))
    draw = ImageDraw.Draw(img, "RGBA")

    # shimmer lines
    for i in range(8):
        phase = t * 2 + i * 0.4
        x_sh  = int(W * ((phase % 2)/2))
        a_sh  = int(80 * math.sin(phase * math.pi))
        draw.line([(x_sh, 0),(x_sh-100, H)], fill=(*col(GOLD), max(0,a_sh)), width=2)

    f1 = fnt(FONT_SERIF, 90)
    f2 = fnt(FONT_BOLD,  46)
    f3 = fnt(FONT_REG,   30)

    slide_text(draw, "LUXURY HOME", 90, f1, col(GOLD),
               min(1,p*2), "left", int(255*ease_out_cubic(min(1,p*2))))
    slide_text(draw, "SPECIALISTS", 188, f1, col(WHITE),
               min(1,max(0,p*2-0.1)), "right",
               int(255*ease_out_cubic(min(1,max(0,p*2-0.1)))))

    gold_divider(draw, 295, int(280*ease_out_cubic(min(1,max(0,p*2-0.3)))))

    bullets = [
        "Exclusive listings across Denton & North Texas",
        "Private tours tailored to your lifestyle",
        "Full-service representation from offer to closing",
        "Certified high-end & investment property specialists",
    ]
    for i, b in enumerate(bullets):
        bp = ease_out_cubic(min(1, max(0, p*2.5 - 0.4 - i*0.15)))
        draw.text((W//2-480, 340+i*54), "▸", font=fnt(FONT_BOLD,28),
                  fill=(*col(GOLD), int(255*bp)))
        draw.text((W//2-450, 340+i*54), b, font=f3,
                  fill=(*col(LGRAY), int(255*bp)))

    # 5 stars
    star_p = ease_out_back(min(1, max(0, p*2.5-0.8)))
    for i, sx in enumerate(range(W//2-92, W//2+100, 46)):
        sp2 = ease_out_back(min(1, max(0, p*3-0.8-i*0.08)))
        draw_star(draw, sx, 565, r=int(18*sp2), color=(*col(GOLD), int(255*sp2)))

    slide_text(draw, "North Texas Premier Luxury Real Estate",
               610, fnt(FONT_BOLD,28), col(GOLD),
               min(1,max(0,p*2.5-1.0)), "up",
               int(255*ease_out_cubic(min(1,max(0,p*2.5-1.0)))))

    draw.rectangle([0,H-6,W,H], fill=(*col(GOLD),255))
    return img


def slide_04_agents(p, t):
    """Agent cards with photo placeholders and animated badges."""
    img = bg_navy_gradient()
    draw = ImageDraw.Draw(img, "RGBA")

    # header
    draw.rectangle([0,0,W,90], fill=(*col(NAVY),240))
    draw.rectangle([0,86,W,90], fill=(*col(GOLD),255))
    slide_text(draw, "MEET YOUR REALTORS", 22, fnt(FONT_BOLD,40),
               col(WHITE), min(1,p*3), "up")

    agents = [
        ("MARIELLA CUDD", "Lead Realtor & Owner",
         ["17 Active Listings","56 Homes Sold","Expert Negotiator"], W//4, 0.0),
        ("FRANK CUDD",    "Realtor & Co-Owner",
         ["North Texas Specialist","Investment Expert","Luxury Certified"], W*3//4, 0.2),
    ]
    for name, role, tags, acx, delay in agents:
        cp = ease_out_cubic(min(1, max(0, p*2-delay)))
        y_off = int((1-cp)*H)

        # card background
        cw, ch = 480, 470
        cx2 = acx-cw//2
        draw.rectangle([cx2, 110+y_off, cx2+cw, 110+ch+y_off],
                       fill=(*col(DGRAY), 220), outline=(*col(GOLD),200), width=2)

        # avatar circle
        av_p = ease_out_elastic(min(1, max(0, p*2.5-delay-0.1)))
        av_r = int(70*av_p)
        glowing_circle(draw, acx, 220+y_off, av_r, col(NAVY), 180)
        draw_house(draw, acx, 220+y_off, size=int(40*av_p),
                   body_col=(*col(GOLD),int(230*av_p)),
                   roof_col=(*col(GOLD),int(230*av_p)))

        # name / role
        np_ = ease_out_cubic(min(1, max(0, p*2.5-delay-0.2)))
        f_name = fnt(FONT_BOLD, 30)
        f_role = fnt(FONT_REG,  22)
        nw, _ = text_w(draw, name, f_name)
        draw.text((acx-nw//2, 305+y_off), name, font=f_name,
                  fill=(*col(WHITE), int(255*np_)))
        rw, _ = text_w(draw, role, f_role)
        draw.text((acx-rw//2, 340+y_off), role, font=f_role,
                  fill=(*col(LGRAY), int(200*np_)))

        # tag badges
        for i, tag in enumerate(tags):
            tp = ease_out_back(min(1, max(0, p*3-delay-0.4-i*0.1)))
            tw2, _ = text_w(draw, tag, fnt(FONT_REG,18))
            bx = acx-tw2//2-12
            draw.rectangle([bx, 380+i*44+y_off, bx+tw2+24, 380+i*44+34+y_off],
                           fill=(*col(NAVY),int(220*tp)), outline=(*col(GOLD),int(180*tp)), width=1)
            draw.text((bx+12, 383+i*44+y_off), tag, font=fnt(FONT_REG,18),
                      fill=(*col(GOLD),int(255*tp)))

    # footer
    fp = ease_out_cubic(min(1,max(0,p*2-0.9)))
    draw.rectangle([0,H-50,W,H], fill=(*col(NAVY),int(230*fp)))
    slide_text(draw, "Family-Owned  ·  Community-Focused  ·  Results-Driven",
               H-38, fnt(FONT_REG,26), col(LGRAY), fp, "up", int(220*fp))
    draw.rectangle([0,H-54,W,H-50], fill=(*col(GOLD),255))
    return img


def slide_05_stats(p, t):
    """Animated stats counters with progress bars."""
    img = bg_dark_diagonal(t)
    draw = ImageDraw.Draw(img, "RGBA")

    # top gold bar wipe
    bar_p = ease_out_cubic(min(1,p*3))
    bw = int(W*bar_p)
    draw.rectangle([(W-bw)//2,0,(W+bw)//2,6], fill=(*col(GOLD),255))

    slide_text(draw, "THE NUMBERS SPEAK FOR THEMSELVES",
               30, fnt(FONT_BOLD,36), col(GOLD), min(1,p*2.5), "up")

    gold_divider(draw, 88, int(180*ease_out_cubic(min(1,max(0,p*2.5-0.2)))))

    stats = [
        (26,  "Years in Business",  W//4,   0.0),
        (56,  "Homes Sold",         W//2,   0.15),
        (17,  "Active Listings",    W*3//4, 0.3),
    ]
    f_big = fnt(FONT_SERIF, 140)
    f_lbl = fnt(FONT_REG, 28)

    for target, label, sx, delay in stats:
        sp = min(1, max(0, p*2-delay))
        # glowing circle bg
        gc_p = ease_out_cubic(sp)
        glowing_circle(draw, sx, H//2-40, int(100*gc_p), col(NAVY), 100)
        # counter
        animated_counter(draw, sx, H//2-125, target, sp, f_big, col(GOLD))
        # label
        lw, _ = text_w(draw, label, f_lbl)
        draw.text((sx-lw//2, H//2+50), label, font=f_lbl,
                  fill=(*col(WHITE),int(255*gc_p)))
        # progress bar
        bar_fill = ease_out_cubic(sp)
        progress_bar(draw, sx-120, H//2+100, 240, 12, bar_fill)

    # bottom items
    bp = ease_out_cubic(min(1,max(0,p*2-0.9)))
    bullets2 = ["Member: Denton Chamber of Commerce",
                "Listed on NTREIS MLS","Serving Denton County & surrounding areas"]
    for i, b in enumerate(bullets2):
        bip = ease_out_cubic(min(1,max(0,p*2.5-0.8-i*0.1)))
        bw2,_ = text_w(draw, b, fnt(FONT_REG,22))
        draw.text(((W-bw2)//2, H-130+i*38), b, font=fnt(FONT_REG,22),
                  fill=(*col(LGRAY),int(220*bip)))

    draw.rectangle([0,H-6,W,H], fill=(*col(GOLD),255))
    return img


def slide_06_why(p, t):
    """Animated reason list with staggered bar reveals."""
    img = bg_navy_gradient()
    draw = ImageDraw.Draw(img, "RGBA")

    draw.rectangle([0,0,W,80], fill=(*col(NAVY),230))
    draw.rectangle([0,76,W,80], fill=(*col(GOLD),255))
    slide_text(draw, "WHY CHOOSE CUDD REALTY?", 18,
               fnt(FONT_BOLD,40), col(WHITE), min(1,p*3), "up")

    reasons = [
        ("26 YRS LOCAL EXPERTISE",  "Mastered the Denton & North Texas market"),
        ("PERSONAL SERVICE",        "Family-owned — work directly with the owners"),
        ("FULL SPECTRUM",           "Buyers, sellers & renters all welcome"),
        ("LUXURY CERTIFIED",        "High-end & investment property specialists"),
        ("COMMUNITY MEMBER",        "Active Denton Chamber of Commerce member"),
        ("PROVEN RESULTS",          "56+ closed transactions & counting"),
    ]
    fh = fnt(FONT_BOLD, 24)
    fs = fnt(FONT_REG,  20)

    for i, (title, desc) in enumerate(reasons):
        rp = ease_out_cubic(min(1, max(0, p*2.5 - 0.2 - i*0.12)))
        y  = 100 + i*84
        # bar slides in from left
        bw3 = int((W-80)*rp)
        bg_c = col(DGRAY) if i%2==0 else (col(NAVY)[0]+10, col(NAVY)[1]+15, col(NAVY)[2]+30)
        draw.rectangle([40, y, 40+bw3, y+70], fill=bg_c+(int(220*rp),))
        draw.rectangle([40, y, 50, y+70], fill=(*col(GOLD),int(255*rp)))
        draw.text((66, y+8),  title, font=fh, fill=(*col(GOLD),  int(255*rp)))
        draw.text((66, y+38), desc,  font=fs, fill=(*col(LGRAY), int(220*rp)))

    fp = ease_out_cubic(min(1,max(0,p*2-1.0)))
    slide_text(draw, "cuddrealtyinc.com  ·  @cuddrealtytx  ·  940-595-5550",
               H-45, fnt(FONT_REG,22), col(LGRAY), fp, "up", int(200*fp))
    draw.rectangle([0,H-6,W,H], fill=(*col(GOLD),255))
    return img


def slide_07_contact(p, t):
    """CTA — pulsing button, flying contact details."""
    img = bg_navy_gradient()
    img = add_particles(img, 50, seed=7, alpha_max=100, t=t)
    draw = ImageDraw.Draw(img, "RGBA")

    # animated concentric rings behind CTA
    pulse = 0.5 + 0.5*math.sin(t*math.pi*3)
    for r in [200, 240, 280]:
        rp2 = ease_out_cubic(min(1,p*2))
        draw.ellipse([W//2-int(r*rp2), H//2-int(r*rp2*0.6),
                      W//2+int(r*rp2), H//2+int(r*rp2*0.6)],
                     outline=(*col(GOLD), int(30*rp2)), width=2)

    slide_text(draw, "READY TO MAKE YOUR MOVE?", 80,
               fnt(FONT_BOLD,52), col(GOLD),
               min(1,p*2), "up", int(255*ease_out_cubic(min(1,p*2))))

    gold_divider(draw, 148, int(300*ease_out_cubic(min(1,max(0,p*2-0.2)))))

    details = [
        ("📞   940-595-5550",               220),
        ("🌐   cuddrealtyinc.com",           275),
        ("📸   @cuddrealtytx  on Instagram", 330),
        ("📍   2412 Old North Rd #104, Denton TX", 385),
    ]
    for i, (text, y) in enumerate(details):
        dp = ease_out_cubic(min(1, max(0, p*2.5-0.3-i*0.1)))
        tw2, _ = text_w(draw, text, fnt(FONT_REG,30))
        draw.text(((W-tw2)//2, y), text, font=fnt(FONT_REG,30),
                  fill=(*col(WHITE), int(255*dp)))

    # pulsing CTA button
    btn_p = ease_out_back(min(1, max(0, p*2.5-0.8)))
    btn_scale = (0.95 + 0.05*math.sin(t*math.pi*4)) * btn_p
    bw4 = int(340*btn_scale)
    bh2 = int(72*btn_scale)
    bx  = (W-bw4)//2
    by  = 455
    draw.rectangle([bx,by,bx+bw4,by+bh2], fill=(*col(GOLD),int(255*btn_p)))
    if bw4 > 8 and bh2 > 8:
        draw.rectangle([bx+3,by+3,bx+bw4-3,by+bh2-3], outline=(*col(WHITE),int(80*btn_p)), width=2)
    bt = "CALL US TODAY"
    btw, _ = text_w(draw, bt, fnt(FONT_BOLD,34))
    draw.text(((W-btw)//2, by+16), bt, font=fnt(FONT_BOLD,34),
              fill=(*col(NAVY), int(255*btn_p)))

    slide_text(draw, "CUDD REALTY INC  —  Your Home. Our Mission.",
               H-52, fnt(FONT_REG,24), col(LGRAY),
               min(1,max(0,p*2-1.0)), "up",
               int(200*ease_out_cubic(min(1,max(0,p*2-1.0)))))

    barp = ease_out_cubic(min(1,p*3))
    draw.rectangle([(W-int(W*barp))//2,H-6,(W+int(W*barp))//2,H], fill=(*col(GOLD),255))
    return img


# ── TRANSITION ────────────────────────────────────────────────────────────────
def cross_fade(img_a, img_b, t):
    return Image.blend(img_a, img_b, ease_in_out(t))


# ── SCENE SCHEDULE ────────────────────────────────────────────────────────────
# (renderer_fn, duration_sec)
SCENES = [
    (slide_00_title,      8),
    (slide_01_experience, 8),
    (slide_02_services,   8),
    (slide_03_luxury,     8),
    (slide_04_agents,     9),
    (slide_05_stats,      7),
    (slide_06_why,        7),
    (slide_07_contact,    5),
]
FADE_SEC = 0.6   # cross-fade between scenes


def build_all_frames():
    frames = []
    n_scenes = len(SCENES)
    total_sec = sum(d for _,d in SCENES)

    for si, (fn, dur) in enumerate(SCENES):
        n_fr = int(dur * FPS)
        prev_frames = []
        next_fn = SCENES[si+1][0] if si+1 < n_scenes else None
        fade_fr  = int(FADE_SEC * FPS)

        for fi in range(n_fr):
            p = fi / max(1, n_fr-1)   # progress within scene 0→1
            t = fi / FPS              # wall-clock seconds

            img = fn(p, t)

            # cross-fade OUT to next scene at end
            if next_fn and fi >= n_fr - fade_fr:
                fade_t = (fi-(n_fr-fade_fr)) / fade_fr
                # render next scene at p≈0
                next_img = next_fn(0.01, 0.0)
                img = cross_fade(img, next_img, fade_t)

            frames.append(img)
        print(f"  Scene {si+1}/{n_scenes} done ({n_fr} frames)")

    # pad/trim
    while len(frames) < TOTAL_FR:
        frames.append(frames[-1])
    return frames[:TOTAL_FR]


def save_gif(frames, path, gif_fps=12):
    step  = max(1, FPS // gif_fps)
    gfrs  = frames[::step]
    delay = int(1000 / gif_fps)
    print(f"Saving GIF ({len(gfrs)} frames @ {gif_fps}fps) → {path}")
    pal = [f.convert("P", palette=Image.ADAPTIVE, colors=192) for f in gfrs]
    pal[0].save(path, save_all=True, append_images=pal[1:],
                duration=delay, loop=0, optimize=True)
    print(f"  {os.path.getsize(path)/1e6:.1f} MB")


def save_mp4(frames, path):
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found — skipping MP4"); return
    print(f"Encoding MP4 → {path}")
    with tempfile.TemporaryDirectory() as tmp:
        for i, f in enumerate(frames):
            f.save(os.path.join(tmp, f"{i:05d}.png"))
        subprocess.run(["ffmpeg","-y","-framerate",str(FPS),
                        "-i",os.path.join(tmp,"%05d.png"),
                        "-c:v","libx264","-pix_fmt","yuv420p","-crf","20",path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  {os.path.getsize(path)/1e6:.1f} MB")


def main():
    print(f"Rendering {TOTAL_FR} frames @ {FPS}fps ({DURATION}s) …")
    frames = build_all_frames()
    print(f"Render complete. Saving …")
    save_gif(frames, "cudd_realty_hyperframes_v2.gif")
    save_mp4(frames, "cudd_realty_hyperframes_v2.mp4")
    print("Done.")


if __name__ == "__main__":
    main()
