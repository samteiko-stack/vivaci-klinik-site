#!/usr/bin/env python3
"""Build homepage floating map image from OpenStreetMap tiles (self-hosted)."""

from __future__ import annotations

import io
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reference" / "webflow-export" / "images" / "hitta-oss-map.webp"

# Vivaci Klinik — Solna Centrum, Torg 3
LAT, LON = 59.3634, 18.0009
ZOOM = 13
TILE = 256
CROP = 320
# Pin colors (Vivaci text + white ring for contrast on map)
PIN_FILL = (21, 25, 13)
PIN_RING = (255, 255, 255)


def fetch_tile(z: int, x: int, y: int) -> Image.Image:
    url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    req = urllib.request.Request(url, headers={"User-Agent": "VivaciSiteMapBuild/1.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return Image.open(io.BytesIO(res.read())).convert("RGB")


def latlon_to_world_px(lat: float, lon: float, zoom: int) -> tuple[float, float]:
    n = 2**zoom
    x = (lon + 180) / 360 * n * TILE
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n * TILE
    return x, y


def draw_map_pin(img: Image.Image, x: float, y: float) -> None:
    """Lucide-style map pin; tip at (x, y)."""
    d = ImageDraw.Draw(img)
    head_r = 8
    head_cy = y - head_r - 5
    head_cx = x
    d.ellipse(
        (
            head_cx - head_r,
            head_cy - head_r,
            head_cx + head_r,
            head_cy + head_r,
        ),
        fill=PIN_FILL,
        outline=PIN_RING,
        width=2,
    )
    d.polygon(
        [
            (head_cx, y),
            (head_cx - 7, head_cy + head_r - 3),
            (head_cx + 7, head_cy + head_r - 3),
        ],
        fill=PIN_FILL,
        outline=PIN_RING,
    )
    # Inner dot
    d.ellipse(
        (head_cx - 3, head_cy - 3, head_cx + 3, head_cy + 3),
        fill=PIN_RING,
    )


def main() -> None:
    px, py = latlon_to_world_px(LAT, LON, ZOOM)
    half = CROP / 2
    origin_x = int(px - half)
    origin_y = int(py - half)
    end_x = origin_x + CROP
    end_y = origin_y + CROP

    tile_x0 = origin_x // TILE
    tile_y0 = origin_y // TILE
    tile_x1 = (end_x + TILE - 1) // TILE
    tile_y1 = (end_y + TILE - 1) // TILE

    canvas = Image.new("RGB", (CROP, CROP))
    for ty in range(tile_y0, tile_y1 + 1):
        for tx in range(tile_x0, tile_x1 + 1):
            tile = fetch_tile(ZOOM, tx, ty)
            dest_x = tx * TILE - origin_x
            dest_y = ty * TILE - origin_y
            canvas.paste(tile, (dest_x, dest_y))

    pin_x = px - origin_x
    pin_y = py - origin_y
    draw_map_pin(canvas, pin_x, pin_y)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "WEBP", quality=88)
    print(f"Wrote {OUT.relative_to(ROOT)} (zoom {ZOOM}, pin at {pin_x:.1f},{pin_y:.1f})")


if __name__ == "__main__":
    main()
