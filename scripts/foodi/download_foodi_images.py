#!/usr/bin/env python3
"""
FooDI-ML: Download and process images for selected AR products.
Generates TypeScript catalog file for manual review.

Run from project root:
    python scripts/foodi/download_foodi_images.py --limit 50

Reads:  data/foodi/foodi_ar_selected.csv
Writes: public/products/foodi-ar/<slug>.webp
        src/data/masterProducts.foodi.ts   (override with --output)

NOTE: The project uses lib/data/ for services. You may want:
  --output lib/data/masterProducts.foodi.ts
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

import pandas as pd
from PIL import Image
from slugify import slugify

# ── Config ────────────────────────────────────────────────────────────────────
SELECTED_CSV = Path("data/foodi/foodi_ar_selected.csv")
IMAGES_DIR = Path("public/products/foodi-ar")
DEFAULT_TS_OUTPUT = Path("lib/data/masterProducts.foodi.ts")  # matches project lib/ structure
DEFAULT_LIMIT = 50
IMAGE_SIZE = 512
DOWNLOAD_TIMEOUT_SECS = 30
S3_BUCKET = "s3://glovo-products-dataset-d1c9720d"  # FooDI-ML public bucket


# ── Image helpers ─────────────────────────────────────────────────────────────

def download_s3_image(s3_path: str, dest: Path, timeout: int = DOWNLOAD_TIMEOUT_SECS) -> bool:
    """
    Download a single image from S3.
    Uses: aws s3 cp --no-sign-request <s3_path> <dest>
    Returns True on success.
    """
    try:
        result = subprocess.run(
            ["aws", "s3", "cp", "--no-sign-request", s3_path, str(dest)],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode == 0 and dest.exists() and dest.stat().st_size > 0
    except subprocess.TimeoutExpired:
        return False
    except FileNotFoundError:
        print("\n[ERROR] 'aws' CLI not found.")
        print("  Install with: brew install awscli")
        sys.exit(1)


def process_image_to_webp(src: Path, dest: Path, size: int = IMAGE_SIZE) -> bool:
    """
    Resize image to fit within <size>x<size>, centered on white background.
    Saves as .webp (quality 85).
    Returns True on success.
    """
    try:
        with Image.open(src) as img:
            # Handle transparency
            img = img.convert("RGBA")

            # White background canvas
            canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))

            # Scale to fit, maintaining aspect ratio
            img_copy = img.copy()
            img_copy.thumbnail((size, size), Image.LANCZOS)

            # Center paste
            x = (size - img_copy.width) // 2
            y = (size - img_copy.height) // 2
            canvas.paste(img_copy, (x, y), img_copy)

            # Save as WebP (RGB — no transparency needed in final)
            canvas.convert("RGB").save(dest, "webp", quality=85, method=4)
        return True
    except Exception as e:
        print(f"\n  [WARN] Image processing failed: {e}")
        return False


# ── Slug helpers ──────────────────────────────────────────────────────────────

def make_unique_slug(name: str, seen_slugs: set[str]) -> str:
    """Generate a unique URL-safe slug, appending a counter on collision."""
    base = slugify(name, allow_unicode=False, separator="-") or "product"
    # Trim very long slugs
    if len(base) > 80:
        base = base[:80].rstrip("-")

    slug = base
    counter = 1
    while slug in seen_slugs:
        slug = f"{base}-{counter}"
        counter += 1

    seen_slugs.add(slug)
    return slug


# ── TypeScript generation ─────────────────────────────────────────────────────

def build_ts_product(
    row: dict,
    slug: str,
    image_ok: bool,
) -> dict:
    """Build the TypeScript product object from a selected CSV row."""
    product_id = f"foodi-ar-{slug}"
    image_url = f"/products/foodi-ar/{slug}.webp" if image_ok else ""
    image_status = "needs_review" if image_ok else "missing"

    normalized = str(row.get("normalized_name", "") or "")

    # Aliases: normalized name + version without unit
    aliases: list[str] = []
    if normalized:
        aliases.append(normalized)
        no_units = re.sub(r"\d+\s*(?:ml|g|kg|l)\b", "", normalized).strip()
        no_units = re.sub(r"\s+", " ", no_units).strip()
        if no_units and no_units != normalized:
            aliases.append(no_units)

    return {
        "id": product_id,
        "name": str(row.get("product_name", "") or ""),
        "normalizedName": normalized,
        "brand": "",  # to be filled during review
        "categoryId": str(row.get("category_id", "otros") or "otros"),
        "unit": str(row.get("unit", "") or ""),
        "aliases": aliases,
        "imageUrl": image_url,
        "imageSource": "foodi_ml",
        "imageStatus": image_status,
        "source": {
            "dataset": "FooDI-ML",
            "countryCode": "AR",
            "cityCode": str(row.get("city_code", "") or ""),
            "storeName": str(row.get("store_name", "") or ""),
            "s3Path": str(row.get("s3_path", "") or ""),
        },
        "status": "review",
    }


def products_to_ts(products: list[dict]) -> str:
    """
    Serialize list of product dicts into a TypeScript module.
    Uses JSON serialization for safe string escaping.
    Output uses FoodiSeedProduct from lib/types.ts for type safety.
    """
    header = """\
// AUTO-GENERATED by scripts/foodi/download_foodi_images.py
// Source: FooDI-ML dataset (Glovo) — AR products
// imageStatus "needs_review" — manual review required before production use
//
// To approve a product: change status → "approved" and imageStatus → "approved"
// To reject:            change status → "rejected"
//
// Seed Firestore: open /admin/catalogo → click "Importar FooDI-ML"

import type { FoodiSeedProduct } from '@/lib/types'

export const foodiArProducts: FoodiSeedProduct[] = [
"""

    entries: list[str] = []
    for p in products:
        serialized = json.dumps(p, ensure_ascii=False, indent=2)
        # Indent each line 2 extra spaces (for array item indentation)
        indented = "\n".join("  " + line for line in serialized.split("\n"))
        entries.append(indented)

    body = ",\n".join(entries)

    return header + body + "\n]\n"


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download FooDI-ML images and generate TypeScript catalog"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Max products to process (default: {DEFAULT_LIMIT})",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_TS_OUTPUT),
        help=f"TypeScript output path (default: {DEFAULT_TS_OUTPUT})",
    )
    args = parser.parse_args()

    if not SELECTED_CSV.exists():
        print(f"[ERROR] Selected CSV not found: {SELECTED_CSV}")
        print("  Run first: python scripts/foodi/filter_foodi_ar.py --limit 50")
        sys.exit(1)

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    ts_output = Path(args.output)
    ts_output.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(SELECTED_CSV)
    df = df.head(args.limit)
    total = len(df)

    print(f"[INFO] Processing {total} products (limit={args.limit})")
    print(f"[INFO] Images → {IMAGES_DIR}/")
    print(f"[INFO] TypeScript → {ts_output}")
    print()

    ok_count = 0
    fail_count = 0
    skip_count = 0
    cached_count = 0
    ts_products: list[dict] = []
    seen_slugs: set[str] = set()

    for i, (_, row) in enumerate(df.iterrows(), 1):
        product_name = str(row.get("product_name", "") or "")
        s3_path = str(row.get("s3_path", "") or "")
        slug = make_unique_slug(product_name, seen_slugs)
        image_dest = IMAGES_DIR / f"{slug}.webp"

        prefix = f"  [{i:3}/{total}]"
        name_preview = product_name[:48].ljust(48)
        print(f"{prefix} {name_preview}", end="  ", flush=True)

        # No s3_path
        if not s3_path or s3_path == "nan":
            print("SKIP  (no s3_path)")
            skip_count += 1
            ts_products.append(build_ts_product(row.to_dict(), slug, False))
            continue

        # Already downloaded
        if image_dest.exists() and image_dest.stat().st_size > 0:
            print("CACHED")
            cached_count += 1
            ok_count += 1
            ts_products.append(build_ts_product(row.to_dict(), slug, True))
            continue

        # Download to temp file
        # s3_path from CSV is relative (e.g. "dataset/FILE.png") — prepend bucket
        s3_full = f"{S3_BUCKET}/{s3_path}" if not s3_path.startswith("s3://") else s3_path
        s3_suffix = Path(s3_path).suffix or ".jpg"
        with tempfile.NamedTemporaryFile(suffix=s3_suffix, delete=False) as tmp:
            tmp_path = Path(tmp.name)

        downloaded = download_s3_image(s3_full, tmp_path)

        if not downloaded:
            print("FAIL  (download error)")
            fail_count += 1
            tmp_path.unlink(missing_ok=True)
            ts_products.append(build_ts_product(row.to_dict(), slug, False))
            continue

        # Convert to webp
        processed = process_image_to_webp(tmp_path, image_dest)
        tmp_path.unlink(missing_ok=True)

        if processed:
            size_kb = image_dest.stat().st_size // 1024
            print(f"OK    ({size_kb} KB)")
            ok_count += 1
        else:
            print("FAIL  (image processing error)")
            fail_count += 1

        ts_products.append(build_ts_product(row.to_dict(), slug, processed))

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'='*62}")
    print("DOWNLOAD RESULTS")
    print(f"{'='*62}")
    print(f"  Total processed     : {total}")
    print(f"  Images OK (new)     : {ok_count - cached_count}")
    print(f"  Images OK (cached)  : {cached_count}")
    print(f"  Images failed       : {fail_count}")
    print(f"  Skipped (no path)   : {skip_count}")
    print(f"  Success rate        : {ok_count}/{total} ({100*ok_count//total if total else 0}%)")

    # ── Generate TypeScript ───────────────────────────────────────────────────
    ts_content = products_to_ts(ts_products)
    ts_output.write_text(ts_content, encoding="utf-8")

    print(f"\n[OK] TypeScript catalog → {ts_output}")
    print(f"[OK] Images             → {IMAGES_DIR}/")
    print()
    print("     Next steps:")
    print("     1. Review images in public/products/foodi-ar/")
    print("     2. Review TypeScript in", ts_output)
    print("     3. Fill in 'brand' fields where identifiable")
    print("     4. Change status → 'approved' for products to use")


if __name__ == "__main__":
    main()
