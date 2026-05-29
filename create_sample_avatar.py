"""
Creates a styled placeholder avatar.jpg when a real photo is not available.
Replace avatar.jpg with an actual photo for best results.
"""
from PIL import Image, ImageDraw, ImageFont
import os

def make_placeholder_avatar(path="avatar.jpg"):
    size = 600
    img  = Image.new("RGB", (size, size), (15, 30, 60))
    draw = ImageDraw.Draw(img)

    # Gradient background circle
    for r in range(size // 2, 0, -1):
        t = r / (size // 2)
        col = (
            int(15 + (52 - 15) * (1 - t)),
            int(30 + (152 - 30) * (1 - t)),
            int(60 + (219 - 60) * (1 - t)),
        )
        draw.ellipse(
            [size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r],
            fill=col,
        )

    # Initials
    try:
        font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        if not os.path.exists(font_path):
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        font = ImageFont.truetype(font_path, 220)
    except Exception:
        font = ImageFont.load_default()

    text  = "MC"
    bbox  = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) // 2, (size - th) // 2 - 20), text,
              font=font, fill=(201, 162, 39))

    # Gold ring border
    draw.ellipse([10, 10, size - 10, size - 10],
                 outline=(201, 162, 39), width=8)

    img.save(path, quality=95)
    print(f"Placeholder avatar saved to {path}")
    print("Replace with a real photo for best results.")


if __name__ == "__main__":
    make_placeholder_avatar(
        os.path.join(os.path.dirname(__file__), "avatar.jpg")
    )
