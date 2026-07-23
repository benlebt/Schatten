#!/usr/bin/env python3
"""Convert Schatten scene PNGs to compact WebP files without resizing."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageChops


def convert_image(source: Path, quality: int, delete_source: bool) -> tuple[int, int]:
    target = source.with_suffix(".webp")
    temporary = target.with_suffix(".webp.part")
    original_size = source.stat().st_size

    with Image.open(source) as image:
        image.load()
        original_dimensions = image.size
        original_alpha = image.getchannel("A").copy() if "A" in image.getbands() else None
        has_transparency = (
            original_alpha is not None and original_alpha.getextrema()[0] < 255
        )
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if original_alpha is not None else "RGB")
        image.save(
            temporary,
            format="WEBP",
            quality=quality,
            method=6,
            alpha_quality=100,
            exact=True,
        )

    with Image.open(temporary) as encoded:
        encoded.load()
        if encoded.size != original_dimensions:
            raise RuntimeError(
                f"Dimension mismatch for {source}: {encoded.size} != {original_dimensions}"
            )
        if has_transparency:
            if "A" not in encoded.getbands():
                raise RuntimeError(f"Alpha channel missing for {source}")
            encoded_alpha = encoded.getchannel("A")
            if ImageChops.difference(original_alpha, encoded_alpha).getbbox() is not None:
                raise RuntimeError(f"Alpha channel mismatch for {source}")

    os.replace(temporary, target)
    if delete_source:
        source.unlink()
    return original_size, target.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "root",
        nargs="?",
        type=Path,
        default=Path("assets/scenes"),
        help="Directory containing scene PNG files",
    )
    parser.add_argument("--quality", type=int, default=84)
    parser.add_argument("--delete-source", action="store_true")
    args = parser.parse_args()

    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")

    sources = sorted(args.root.rglob("*.png"))
    if not sources:
        print("No PNG scene images found.")
        return

    original_total = 0
    encoded_total = 0
    for index, source in enumerate(sources, start=1):
        original_size, encoded_size = convert_image(
            source, args.quality, args.delete_source
        )
        original_total += original_size
        encoded_total += encoded_size
        if index % 25 == 0 or index == len(sources):
            print(f"Converted {index}/{len(sources)}")

    saving = 100.0 * (1.0 - encoded_total / original_total)
    print(
        f"{original_total / 1024 / 1024:.1f} MiB -> "
        f"{encoded_total / 1024 / 1024:.1f} MiB "
        f"({saving:.1f}% smaller, quality={args.quality})"
    )


if __name__ == "__main__":
    main()
