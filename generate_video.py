"""
Real Estate Video Generator
Produces a polished MP4 property marketing video with an AI avatar presenter.
"""

import os
import sys
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Color palette & constants
# ---------------------------------------------------------------------------
W, H = 1280, 720
FPS = 30

NAVY      = (15, 30, 60)
DARK_NAVY = (8, 16, 35)
GOLD      = (201, 162, 39)
GOLD_LIGHT= (230, 195, 90)
WHITE     = (255, 255, 255)
OFF_WHITE = (240, 240, 235)
LIGHT_GRAY= (180, 180, 175)
ACCENT    = (52, 152, 219)   # blue highlight

AVATAR_SIZE   = 180   # diameter of avatar circle
AVATAR_BORDER = 6     # gold border thickness
AVATAR_MARGIN = 28    # margin from edges

# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT_TITLE   = _load_font(72, bold=True)
FONT_HEADING = _load_font(52, bold=True)
FONT_SUB     = _load_font(36, bold=False)
FONT_BODY    = _load_font(28, bold=False)
FONT_SMALL   = _load_font(22, bold=False)
FONT_PRICE   = _load_font(88, bold=True)
FONT_TAG     = _load_font(24, bold=True)

# ---------------------------------------------------------------------------
# Drawing primitives
# ---------------------------------------------------------------------------

def new_frame(bg: tuple = NAVY) -> Image.Image:
    return Image.new("RGB", (W, H), bg)


def gradient_bg(top: tuple, bottom: tuple) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img


def draw_text_centered(draw: ImageDraw.Draw, y: int, text: str,
                        font: ImageFont.FreeTypeFont, color: tuple,
                        shadow: bool = False) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    if shadow:
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill=color)
    return bbox[3] - bbox[1]  # height


def draw_text_left(draw: ImageDraw.Draw, x: int, y: int, text: str,
                   font: ImageFont.FreeTypeFont, color: tuple) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    draw.text((x, y), text, font=font, fill=color)
    return bbox[3] - bbox[1]


def gold_line(draw: ImageDraw.Draw, y: int, width: int = 120, thick: int = 4):
    x = (W - width) // 2
    draw.rectangle([x, y, x + width, y + thick], fill=GOLD)


def gold_line_left(draw: ImageDraw.Draw, x: int, y: int,
                   width: int = 80, thick: int = 4):
    draw.rectangle([x, y, x + width, y + thick], fill=GOLD)


def pill_tag(draw: ImageDraw.Draw, x: int, y: int, text: str,
             bg: tuple = GOLD, fg: tuple = DARK_NAVY, padding: int = 14):
    bbox = draw.textbbox((0, 0), text, font=FONT_TAG)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    rx, ry = x, y
    rw, rh = tw + padding * 2, th + padding
    r = rh // 2
    draw.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=r, fill=bg)
    draw.text((rx + padding, ry + padding // 2), text, font=FONT_TAG, fill=fg)
    return rw, rh


def feature_card(draw: ImageDraw.Draw, x: int, y: int,
                 icon: str, label: str, value: str):
    cw, ch = 240, 130
    draw.rounded_rectangle([x, y, x + cw, y + ch], radius=16,
                            fill=(255, 255, 255, 20))
    draw.rounded_rectangle([x, y, x + cw, y + ch], radius=16,
                            outline=GOLD, width=2)
    draw.text((x + 18, y + 14), icon, font=FONT_HEADING, fill=GOLD)
    draw.text((x + 18, y + 66), value, font=_load_font(30, bold=True),
              fill=WHITE)
    draw.text((x + 18, y + 100), label, font=FONT_SMALL, fill=LIGHT_GRAY)

# ---------------------------------------------------------------------------
# Avatar loading & circular crop
# ---------------------------------------------------------------------------

def load_avatar(path: str) -> Image.Image | None:
    if not os.path.exists(path):
        return None
    img = Image.open(path).convert("RGBA")
    # Crop to square from center
    side = min(img.width, img.height)
    left = (img.width - side) // 2
    top  = (img.height - side) // 2
    img  = img.crop((left, top, left + side, top + side))
    img  = img.resize((AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)

    # Circular mask with anti-aliasing
    mask_size = AVATAR_SIZE * 4
    mask = Image.new("L", (mask_size, mask_size), 0)
    md   = ImageDraw.Draw(mask)
    md.ellipse([0, 0, mask_size, mask_size], fill=255)
    mask = mask.resize((AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)

    result = Image.new("RGBA", (AVATAR_SIZE, AVATAR_SIZE), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result


def overlay_avatar(frame: Image.Image, avatar: Image.Image,
                   alpha: float = 1.0) -> Image.Image:
    """Paste circular avatar with gold border in bottom-right corner."""
    total = AVATAR_SIZE + AVATAR_BORDER * 2
    # Gold border circle
    border_img = Image.new("RGBA", (total, total), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border_img)
    bd.ellipse([0, 0, total - 1, total - 1], fill=(*GOLD, int(255 * alpha)))
    x = W - total - AVATAR_MARGIN
    y = H - total - AVATAR_MARGIN
    frame = frame.convert("RGBA")
    frame.paste(border_img, (x, y), border_img)

    # Avatar with alpha
    av = avatar.copy()
    if alpha < 1.0:
        r, g, b, a = av.split()
        a = a.point(lambda p: int(p * alpha))
        av = Image.merge("RGBA", (r, g, b, a))
    frame.paste(av, (x + AVATAR_BORDER, y + AVATAR_BORDER), av)
    return frame.convert("RGB")


# ---------------------------------------------------------------------------
# Scene builders (return list of PIL frames)
# ---------------------------------------------------------------------------

def make_intro_scene(avatar: Image.Image | None,
                     agent_name: str, duration: float = 4.0) -> list:
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t = i / total
        img  = gradient_bg(DARK_NAVY, NAVY)
        draw = ImageDraw.Draw(img)

        # Decorative lines
        for lx in range(0, W + 60, 60):
            oy = int(math.sin(lx / 120 + t * 4) * 8)
            draw.line([(lx, H // 2 + oy - 300), (lx + 40, H // 2 + oy + 300)],
                      fill=(30, 45, 70), width=1)

        # Fade-in text
        fade = min(1.0, t * 3)
        alpha_c = tuple(int(c * fade) for c in WHITE)

        draw_text_centered(draw, 180, "LUXURY REAL ESTATE", FONT_SMALL,
                           tuple(int(c * fade) for c in GOLD))
        draw_text_centered(draw, 230, "YOUR DREAM HOME AWAITS", FONT_TITLE,
                           alpha_c, shadow=True)
        gold_line(draw, 330, width=160)

        sub_fade = min(1.0, max(0.0, (t - 0.35) * 3))
        sub_c    = tuple(int(c * sub_fade) for c in OFF_WHITE)
        draw_text_centered(draw, 360, "Presented by", FONT_BODY, sub_c)
        draw_text_centered(draw, 400, agent_name, FONT_HEADING,
                           tuple(int(c * sub_fade) for c in GOLD_LIGHT))

        if avatar:
            av_alpha = min(1.0, max(0.0, (t - 0.4) * 2.5))
            img = overlay_avatar(img, avatar, av_alpha)

        frames.append(np.array(img))
    return frames


def make_property_hero_scene(avatar: Image.Image | None,
                              address: str, price: str,
                              duration: float = 6.0) -> list:
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t    = i / total
        img  = gradient_bg((20, 38, 75), DARK_NAVY)
        draw = ImageDraw.Draw(img)

        # Animated gold accent bar on left
        bar_h = int(H * min(1.0, t * 2.5))
        draw.rectangle([0, (H - bar_h) // 2, 8, (H + bar_h) // 2], fill=GOLD)

        fade = min(1.0, t * 2)

        draw_text_centered(draw, 120,
                           "FEATURED PROPERTY", FONT_SMALL,
                           tuple(int(c * fade) for c in GOLD))

        slide_x = int((1 - min(1.0, t * 2.5)) * 80)
        bbox = draw.textbbox((0, 0), price, font=FONT_PRICE)
        pw   = bbox[2] - bbox[0]
        px   = (W - pw) // 2 + slide_x
        # shadow
        draw.text((px + 4, 174), price, font=FONT_PRICE, fill=(5, 10, 20))
        draw.text((px, 170), price, font=FONT_PRICE,
                  fill=tuple(int(c * fade) for c in WHITE))

        gold_line(draw, 290, width=200)

        addr_fade = min(1.0, max(0.0, (t - 0.25) * 2.5))
        draw_text_centered(draw, 310, address, FONT_HEADING,
                           tuple(int(c * addr_fade) for c in OFF_WHITE))
        draw_text_centered(draw, 370, "Scottsdale, Arizona 85251", FONT_SUB,
                           tuple(int(c * addr_fade) for c in LIGHT_GRAY))

        # FOR SALE tag
        if t > 0.5:
            tag_fade = min(1.0, (t - 0.5) * 3)
            tag_img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            td       = ImageDraw.Draw(tag_img)
            tw, _ = pill_tag(td, W // 2 - 70, 450,
                             "FOR SALE", GOLD, DARK_NAVY)
            tag_arr = np.array(tag_img)
            tag_arr[:, :, 3] = (tag_arr[:, :, 3] * tag_fade).astype(np.uint8)
            tag_pil = Image.fromarray(tag_arr)
            img = img.convert("RGBA")
            img.paste(tag_pil, (0, 0), tag_pil)
            img = img.convert("RGB")

        if avatar:
            img = overlay_avatar(img, avatar, min(1.0, t * 2))

        frames.append(np.array(img))
    return frames


def make_features_scene(avatar: Image.Image | None,
                         duration: float = 7.0) -> list:
    features = [
        ("🛏", "Bedrooms",   "5 BD"),
        ("🛁", "Bathrooms",  "4 BA"),
        ("📐", "Square Feet","4,250 SF"),
        ("🚗", "Garage",     "3-Car"),
    ]
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t    = i / total
        img  = gradient_bg(NAVY, (12, 24, 50))
        draw = ImageDraw.Draw(img)

        fade = min(1.0, t * 2)
        draw_text_centered(draw, 60, "PROPERTY DETAILS", FONT_SMALL,
                           tuple(int(c * fade) for c in GOLD))
        draw_text_centered(draw, 105, "A Home Built for Living", FONT_HEADING,
                           tuple(int(c * fade) for c in WHITE), shadow=True)
        gold_line(draw, 178, width=120)

        cards_x_start = (W - (4 * 240 + 3 * 30)) // 2
        for idx, (icon, label, value) in enumerate(features):
            card_t = max(0.0, (t - idx * 0.12) * 3)
            card_fade = min(1.0, card_t)
            if card_fade <= 0:
                continue
            cx = cards_x_start + idx * (240 + 30)
            slide_y = int((1 - min(1.0, card_t * 1.5)) * 60)
            cy = 220 + slide_y

            card_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            cd       = ImageDraw.Draw(card_img)
            feature_card(cd, cx, cy, icon, label, value)
            card_arr = np.array(card_img)
            card_arr[:, :, 3] = (card_arr[:, :, 3] * card_fade).astype(np.uint8)
            img = img.convert("RGBA")
            img.paste(Image.fromarray(card_arr), (0, 0),
                      Image.fromarray(card_arr))
            img = img.convert("RGB")

        # Description bullets
        bullets = [
            "✦  Gourmet chef's kitchen with marble countertops",
            "✦  Resort-style pool and outdoor entertainment area",
            "✦  Master suite with spa-inspired en-suite bath",
        ]
        for bi, bullet in enumerate(bullets):
            b_t = max(0.0, (t - 0.55 - bi * 0.1) * 3)
            b_fade = min(1.0, b_t)
            if b_fade <= 0:
                continue
            draw.text((180, 390 + bi * 44), bullet, font=FONT_BODY,
                      fill=tuple(int(c * b_fade) for c in OFF_WHITE))

        if avatar:
            img = overlay_avatar(img, avatar)

        frames.append(np.array(img))
    return frames


def make_neighborhood_scene(avatar: Image.Image | None,
                             duration: float = 6.0) -> list:
    stats = [
        ("🏫", "Top-Rated Schools",  "A+ District"),
        ("🛍", "Shopping & Dining",  "5 min away"),
        ("⛳", "Golf Courses",        "3 Nearby"),
        ("✈", "Airport Access",      "15 min PHX"),
    ]
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t    = i / total
        img  = gradient_bg((10, 22, 48), (18, 35, 70))
        draw = ImageDraw.Draw(img)

        fade = min(1.0, t * 2)
        draw_text_centered(draw, 55, "LOCATION & LIFESTYLE", FONT_SMALL,
                           tuple(int(c * fade) for c in GOLD))
        draw_text_centered(draw, 100, "Scottsdale's Premier Address", FONT_HEADING,
                           tuple(int(c * fade) for c in WHITE), shadow=True)
        gold_line(draw, 172, width=140)

        row1 = stats[:2]
        row2 = stats[2:]
        for row_i, row in enumerate([row1, row2]):
            for col_i, (icon, label, value) in enumerate(row):
                item_t = max(0.0, (t - (row_i * 2 + col_i) * 0.1 - 0.15) * 2.5)
                item_fade = min(1.0, item_t)
                if item_fade <= 0:
                    continue
                bx = 180 + col_i * 500
                by = 210 + row_i * 180
                slide_x = int((1 - min(1.0, item_t * 1.5)) * 50)

                draw.text((bx + slide_x, by), icon, font=FONT_HEADING,
                          fill=tuple(int(c * item_fade) for c in GOLD))
                draw.text((bx + 70 + slide_x, by + 4), label,
                          font=_load_font(30, bold=True),
                          fill=tuple(int(c * item_fade) for c in WHITE))
                draw.text((bx + 70 + slide_x, by + 44), value,
                          font=FONT_BODY,
                          fill=tuple(int(c * item_fade) for c in LIGHT_GRAY))
                if item_fade > 0:
                    gold_line_left(draw, bx + slide_x, by + 86,
                                   width=int(400 * item_fade))

        if avatar:
            img = overlay_avatar(img, avatar)

        frames.append(np.array(img))
    return frames


def make_agent_scene(avatar: Image.Image | None,
                     agent_name: str, phone: str, email: str,
                     duration: float = 6.0) -> list:
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t    = i / total
        img  = gradient_bg(DARK_NAVY, (5, 12, 30))
        draw = ImageDraw.Draw(img)

        fade = min(1.0, t * 2.5)

        # Big avatar on left if available
        if avatar:
            big_size = 280

            # Scale up the already-loaded avatar (which is 180px square RGBA)
            av_sq = avatar.resize((big_size, big_size), Image.LANCZOS).copy()

            # Re-apply circular mask at new size with anti-aliasing
            big_mask = Image.new("L", (big_size * 4, big_size * 4), 0)
            bmd = ImageDraw.Draw(big_mask)
            bmd.ellipse([0, 0, big_size * 4, big_size * 4], fill=255)
            big_mask = big_mask.resize((big_size, big_size), Image.LANCZOS)

            border_total = big_size + 12
            border_img2  = Image.new("RGBA", (border_total, border_total),
                                     (0, 0, 0, 0))
            bd2 = ImageDraw.Draw(border_img2)
            bd2.ellipse([0, 0, border_total - 1, border_total - 1],
                        fill=(*GOLD, int(255 * fade)))
            img = img.convert("RGBA")
            img.paste(border_img2, (90, (H - border_total) // 2), border_img2)

            r2, g2, b2, _ = av_sq.split()
            a2 = big_mask.point(lambda p: int(p * fade))
            av_sq = Image.merge("RGBA", (r2, g2, b2, a2))
            img.paste(av_sq, (96, (H - big_size) // 2), av_sq)
            img = img.convert("RGB")
            draw = ImageDraw.Draw(img)

        # Text on right
        tx = 480
        ty = 160
        draw.text((tx, ty), "MEET YOUR AGENT", font=FONT_SMALL,
                  fill=tuple(int(c * fade) for c in GOLD))
        ty += 50

        name_fade = min(1.0, max(0.0, (t - 0.2) * 2.5))
        draw.text((tx, ty), agent_name, font=FONT_HEADING,
                  fill=tuple(int(c * name_fade) for c in WHITE))
        ty += 66

        gold_line_left(draw, tx, ty, width=int(160 * name_fade))
        ty += 22

        details = [
            ("Licensed Realtor® | 15+ Years Experience",),
            ("Certified Luxury Home Specialist",),
            ("Top 1% Sales Volume – Scottsdale MLS",),
        ]
        for di, (line,) in enumerate(details):
            d_fade = min(1.0, max(0.0, (t - 0.35 - di * 0.1) * 2.5))
            draw.text((tx, ty + di * 40), "• " + line, font=FONT_BODY,
                      fill=tuple(int(c * d_fade) for c in LIGHT_GRAY))
        ty += len(details) * 40 + 30

        contact_fade = min(1.0, max(0.0, (t - 0.6) * 2.5))
        draw.text((tx, ty),      f"📞  {phone}", font=FONT_SUB,
                  fill=tuple(int(c * contact_fade) for c in OFF_WHITE))
        draw.text((tx, ty + 50), f"✉   {email}", font=FONT_BODY,
                  fill=tuple(int(c * contact_fade) for c in LIGHT_GRAY))

        frames.append(np.array(img))
    return frames


def make_cta_scene(avatar: Image.Image | None,
                   phone: str, duration: float = 5.5) -> list:
    frames = []
    total  = int(duration * FPS)

    for i in range(total):
        t    = i / total
        img  = gradient_bg(DARK_NAVY, (8, 16, 35))
        draw = ImageDraw.Draw(img)

        # Pulsing gold ring in background
        pulse = 0.5 + 0.5 * math.sin(t * math.pi * 4)
        ring_r = int(180 + pulse * 20)
        cx, cy = W // 2, H // 2
        draw.ellipse(
            [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
            outline=(*GOLD, int(40 * pulse)), width=2
        )
        draw.ellipse(
            [cx - ring_r - 40, cy - ring_r - 40,
             cx + ring_r + 40, cy + ring_r + 40],
            outline=(*GOLD, int(20 * pulse)), width=1
        )

        fade = min(1.0, t * 2.5)

        draw_text_centered(draw, 170, "SCHEDULE YOUR PRIVATE TOUR", FONT_SMALL,
                           tuple(int(c * fade) for c in GOLD))
        draw_text_centered(draw, 215, "Don't Miss This Opportunity", FONT_TITLE,
                           tuple(int(c * fade) for c in WHITE), shadow=True)

        gold_line(draw, 315, width=200)

        phone_fade = min(1.0, max(0.0, (t - 0.3) * 2.5))
        draw_text_centered(draw, 340, phone, FONT_HEADING,
                           tuple(int(c * phone_fade) for c in GOLD_LIGHT))

        # CTA button
        if t > 0.5:
            btn_fade = min(1.0, (t - 0.5) * 3)
            btn_img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            bd       = ImageDraw.Draw(btn_img)
            bw, bh   = 380, 72
            bx, by   = (W - bw) // 2, 430
            bd.rounded_rectangle([bx, by, bx + bw, by + bh], radius=36,
                                  fill=(*GOLD, int(255 * btn_fade)))
            bbbox = bd.textbbox((0, 0), "CALL NOW · FREE CONSULTATION",
                                font=FONT_TAG)
            btw   = bbbox[2] - bbbox[0]
            bth   = bbbox[3] - bbbox[1]
            bd.text(((W - btw) // 2, by + (bh - bth) // 2),
                    "CALL NOW · FREE CONSULTATION",
                    font=FONT_TAG, fill=(*DARK_NAVY, int(255 * btn_fade)))
            img = img.convert("RGBA")
            img.paste(btn_img, (0, 0), btn_img)
            img = img.convert("RGB")
            draw = ImageDraw.Draw(img)

        website_fade = min(1.0, max(0.0, (t - 0.7) * 3))
        draw_text_centered(draw, 530, "www.luxuryscottsdaleproperties.com",
                           FONT_SMALL,
                           tuple(int(c * website_fade) for c in LIGHT_GRAY))

        if avatar:
            img = overlay_avatar(img, avatar, min(1.0, t * 2.5))

        frames.append(np.array(img))
    return frames


# ---------------------------------------------------------------------------
# Crossfade transition
# ---------------------------------------------------------------------------

def crossfade(frames_a: list, frames_b: list, n_frames: int = 15) -> list:
    """Replace the tail of a and head of b with blended frames."""
    n = min(n_frames, len(frames_a), len(frames_b))
    blended = []
    for k in range(n):
        alpha = k / n
        fa = frames_a[-(n - k)]
        fb = frames_b[k]
        blended.append(
            (fa.astype(np.float32) * (1 - alpha) +
             fb.astype(np.float32) * alpha).astype(np.uint8)
        )
    return frames_a[:-n] + blended + frames_b[n:]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

avatar_path = os.path.join(os.path.dirname(__file__), "avatar.jpg")

AGENT_NAME = "Michael Cudd"
PHONE      = "(480) 555-0192"
EMAIL      = "michael@luxuryscottsdale.com"
ADDRESS    = "8421 E Desert View Place"
PRICE      = "$2,875,000"


def main():
    print("Loading avatar…")
    avatar = load_avatar(avatar_path)
    if avatar is None:
        print(f"  ⚠  avatar.jpg not found at {avatar_path} — rendering without avatar.")

    print("Rendering scenes…")
    s1 = make_intro_scene(avatar, AGENT_NAME,        duration=4.5)
    s2 = make_property_hero_scene(avatar, ADDRESS, PRICE, duration=6.5)
    s3 = make_features_scene(avatar,                 duration=7.0)
    s4 = make_neighborhood_scene(avatar,             duration=6.5)
    s5 = make_agent_scene(avatar, AGENT_NAME, PHONE, EMAIL, duration=6.5)
    s6 = make_cta_scene(avatar, PHONE,               duration=5.5)

    print("Compositing with crossfades…")
    all_frames = crossfade(s1, s2, 12)
    all_frames = crossfade(all_frames, s3, 12)
    all_frames = crossfade(all_frames, s4, 12)
    all_frames = crossfade(all_frames, s5, 12)
    all_frames = crossfade(all_frames, s6, 12)

    total_sec = len(all_frames) / FPS
    print(f"  Total frames: {len(all_frames)}  ({total_sec:.1f}s @ {FPS}fps)")

    from moviepy import ImageSequenceClip
    output = os.path.join(os.path.dirname(__file__), "real_estate_video.mp4")
    print(f"Encoding → {output}")
    clip = ImageSequenceClip(all_frames, fps=FPS)
    clip.write_videofile(output, codec="libx264", audio=False,
                         ffmpeg_params=["-crf", "22", "-preset", "fast"],
                         logger="bar")
    print(f"\n✅  Done! Video saved to: {output}")
    return output


if __name__ == "__main__":
    main()
