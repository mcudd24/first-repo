"""
Capture a 1-minute hyperframes animation of a website.

Requires:
    pip install playwright pillow
    playwright install chromium

Optional (for MP4 output):
    brew install ffmpeg   # macOS
    sudo apt install ffmpeg  # Linux

Usage:
    python hyperframes_video.py [URL]

Default URL: https://cuddrealtyinc.com
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile
import time

from PIL import Image

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Install playwright first:  pip install playwright && playwright install chromium")

URL         = sys.argv[1] if len(sys.argv) > 1 else "https://cuddrealtyinc.com"
OUTPUT_BASE = "cuddrealtyinc_hyperframes"
OUTPUT_GIF  = OUTPUT_BASE + ".gif"
OUTPUT_MP4  = OUTPUT_BASE + ".mp4"

VIEWPORT_W    = 1280
VIEWPORT_H    = 800
DURATION_SEC  = 60
FPS           = 2               # frames per second in the output
TOTAL_FRAMES  = DURATION_SEC * FPS   # 120 frames
FRAME_DELAY   = 1000 // FPS         # ms between frames (500 ms)
SCROLL_PAUSE  = 0.3             # seconds to wait after scrolling


def build_scroll_positions(max_scroll: int, n: int) -> list[int]:
    """Generate n y-positions that pan down then back up, cycling as needed."""
    if max_scroll <= 0:
        return [0] * n
    half = max(1, max_scroll // 2)
    positions = []
    for i in range(n):
        t = i % (2 * half)
        y = t if t <= half else 2 * half - t
        # scale to actual max_scroll
        positions.append(int(y / half * max_scroll))
    return positions


def capture_frames(page, n_frames: int) -> list[Image.Image]:
    page_h    = page.evaluate("document.body.scrollHeight")
    max_scroll = max(0, page_h - VIEWPORT_H)
    print(f"Page height: {page_h}px  |  scrollable: {max_scroll}px")

    positions = build_scroll_positions(max_scroll, n_frames)
    frames: list[Image.Image] = []

    for idx, y in enumerate(positions):
        page.evaluate(f"window.scrollTo(0, {y})")
        time.sleep(SCROLL_PAUSE)
        png  = page.screenshot()
        img  = Image.open(io.BytesIO(png)).convert("RGB")
        img  = img.resize((VIEWPORT_W // 2, VIEWPORT_H // 2), Image.LANCZOS)
        frames.append(img)
        if (idx + 1) % 20 == 0:
            print(f"  {idx + 1}/{n_frames} frames captured")

    return frames


def save_gif(frames: list[Image.Image], path: str):
    print(f"Saving GIF ({len(frames)} frames) → {path} …")
    frames[0].save(
        path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DELAY,
        loop=0,
        optimize=True,
    )
    print(f"  GIF: {os.path.getsize(path) / 1_048_576:.1f} MB")


def save_mp4(frames: list[Image.Image], path: str):
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found — skipping MP4 output")
        return
    print(f"Encoding MP4 → {path} …")
    with tempfile.TemporaryDirectory() as tmp:
        for i, img in enumerate(frames):
            img.save(os.path.join(tmp, f"frame_{i:04d}.png"))
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-framerate", str(FPS),
                "-i", os.path.join(tmp, "frame_%04d.png"),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-crf", "23",
                path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    print(f"  MP4: {os.path.getsize(path) / 1_048_576:.1f} MB")


def main():
    print(f"Loading {URL}  ({TOTAL_FRAMES} frames @ {FPS} fps = {DURATION_SEC}s) …")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": VIEWPORT_W, "height": VIEWPORT_H},
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        page.goto(URL, wait_until="networkidle", timeout=30_000)
        time.sleep(2)

        frames = capture_frames(page, TOTAL_FRAMES)
        browser.close()

    save_gif(frames, OUTPUT_GIF)
    save_mp4(frames, OUTPUT_MP4)
    print("Done.")


if __name__ == "__main__":
    main()
