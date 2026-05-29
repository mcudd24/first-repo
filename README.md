# Real Estate Video Avatar Generator

Generate a polished **34-second 1280×720 MP4** real estate marketing video with an animated presenter avatar overlay.

## Scenes

| # | Scene | Duration |
|---|-------|----------|
| 1 | Intro — brand & agent name | 4.5s |
| 2 | Property hero — price & address | 6.5s |
| 3 | Property details — feature cards | 7.0s |
| 4 | Neighborhood & lifestyle | 6.5s |
| 5 | Meet your agent — large avatar + bio | 6.5s |
| 6 | CTA — call-to-action + contact | 5.5s |

Crossfade transitions between all scenes.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Place your headshot photo as avatar.jpg in this directory
cp /path/to/your/photo.jpg avatar.jpg

# 3. Edit agent details in generate_video.py (AGENT_NAME, PHONE, EMAIL, ADDRESS, PRICE)

# 4. Generate the video
python generate_video.py
# → real_estate_video.mp4
```

## Using a Placeholder Avatar

If you don't have a photo yet:

```bash
python create_sample_avatar.py   # creates a styled initials avatar
python generate_video.py
```

## Customization

Edit the constants near the bottom of `generate_video.py`:

```python
AGENT_NAME = "Your Name"
PHONE      = "(555) 000-0000"
EMAIL      = "you@domain.com"
ADDRESS    = "123 Main Street"
PRICE      = "$1,500,000"
```

## Output

`real_estate_video.mp4` — 1280×720, 30fps, H.264, ~1.5 MB
