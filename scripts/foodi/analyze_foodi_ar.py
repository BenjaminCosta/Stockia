#!/usr/bin/env python3
"""
FooDI-ML: Analyze Argentine products in the dataset.

Run from project root:
    python scripts/foodi/analyze_foodi_ar.py

Outputs:
  - Total rows / AR rows / rows with s3_path
  - Top 30 collection_section for AR
  - Top 20 store_name for AR
  - 15 sample products with s3_path
"""

import sys
from pathlib import Path

import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────
CSV_PATH = Path("data/foodi/glovo-foodi-ml-dataset.csv")
CHUNK_SIZE = 50_000


def main() -> None:
    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found: {CSV_PATH}")
        print("  Expected path: data/foodi/glovo-foodi-ml-dataset.csv")
        print("  Run this script from the project root.")
        sys.exit(1)

    print(f"[INFO] Reading {CSV_PATH} in chunks of {CHUNK_SIZE:,} rows...")

    total_rows = 0
    ar_chunks: list[pd.DataFrame] = []

    for chunk in pd.read_csv(CSV_PATH, chunksize=CHUNK_SIZE, low_memory=False):
        total_rows += len(chunk)
        ar_chunk = chunk[chunk["country_code"] == "AR"]
        if len(ar_chunk) > 0:
            ar_chunks.append(ar_chunk)
        ar_so_far = sum(len(c) for c in ar_chunks)
        print(
            f"  Rows read: {total_rows:>9,}  |  AR found: {ar_so_far:>7,}",
            end="\r",
            flush=True,
        )

    print()  # newline after \r

    if not ar_chunks:
        print("[ERROR] No AR rows found in dataset.")
        sys.exit(1)

    df = pd.concat(ar_chunks, ignore_index=True)

    # ── Totals ────────────────────────────────────────────────────────────────
    print(f"\n{'='*62}")
    print("TOTALS")
    print(f"{'='*62}")
    print(f"  Total rows in dataset  : {total_rows:>10,}")
    print(f"  Total AR rows          : {len(df):>10,}")
    print(f"  AR rows with s3_path   : {df['s3_path'].notna().sum():>10,}")
    print(f"  Unique city_codes (AR) : {df['city_code'].nunique():>10,}")
    city_list = sorted(df["city_code"].dropna().unique().tolist())
    print(f"  City codes             : {city_list}")

    # ── collection_section ────────────────────────────────────────────────────
    print(f"\n{'='*62}")
    print("TOP 30 collection_section (AR)")
    print(f"{'='*62}")
    top_sections = df["collection_section"].value_counts().head(30)
    for section, count in top_sections.items():
        print(f"  {count:6,}  {section}")

    # ── store_name ────────────────────────────────────────────────────────────
    print(f"\n{'='*62}")
    print("TOP 20 store_name (AR)")
    print(f"{'='*62}")
    top_stores = df["store_name"].value_counts().head(20)
    for store, count in top_stores.items():
        print(f"  {count:6,}  {store}")

    # ── HIER distribution (if column exists) ──────────────────────────────────
    if "HIER" in df.columns:
        print(f"\n{'='*62}")
        print("TOP 20 HIER values (AR)")
        print(f"{'='*62}")
        top_hier = df["HIER"].value_counts().head(20)
        for hier, count in top_hier.items():
            print(f"  {count:6,}  {hier}")

    # ── Sample products ───────────────────────────────────────────────────────
    print(f"\n{'='*62}")
    print("SAMPLE: 15 products with s3_path")
    print(f"{'='*62}")
    sample_cols = ["product_name", "collection_section", "city_code", "store_name", "s3_path"]
    available = [c for c in sample_cols if c in df.columns]
    sample = df[available].dropna(subset=["s3_path"]).head(15)

    for i, (_, row) in enumerate(sample.iterrows(), 1):
        print(f"\n  [{i:02}] {row.get('product_name', 'N/A')}")
        print(f"       section : {row.get('collection_section', 'N/A')}")
        print(f"       city    : {row.get('city_code', 'N/A')}")
        print(f"       store   : {row.get('store_name', 'N/A')}")
        print(f"       s3_path : {row.get('s3_path', 'N/A')}")

    print(f"\n[DONE] Analysis complete.")


if __name__ == "__main__":
    main()
