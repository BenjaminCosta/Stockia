#!/usr/bin/env python3
"""
FooDI-ML: Filter Argentine products for B2B supermarket/distributor catalog.

Run from project root:
    python scripts/foodi/filter_foodi_ar.py --limit 50
    python scripts/foodi/filter_foodi_ar.py --limit 300

Output: data/foodi/foodi_ar_selected.csv
"""

import argparse
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────
CSV_PATH = Path("data/foodi/glovo-foodi-ml-dataset.csv")
OUTPUT_PATH = Path("data/foodi/foodi_ar_selected.csv")
CHUNK_SIZE = 50_000
DEFAULT_LIMIT = 50


# ── Normalization ─────────────────────────────────────────────────────────────

def strip_accents(text: str) -> str:
    """Remove diacritics: á→a, é→e, ñ→n, ü→u, etc."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def normalize_product_name(name: str) -> str:
    """
    Canonical key for deduplication and matching.

    Rules:
    - lowercase, no accents
    - decimal comma/dot removed from numbers: 2,25 → 225 / 2.25 → 225
    - unit normalization:
        '1 litro' / '1 lt' / '1 l'  → '1l'
        '500 ml'                     → '500ml'
        '1 kg' / '1 kilo'            → '1kg'
        '500 gramos'                 → '500g'
    - collapse whitespace, strip non-alphanumeric chars (keep dash)
    """
    if not isinstance(name, str):
        return ""

    text = name.lower().strip()
    text = strip_accents(text)

    # Strip decimal separator from numbers FIRST: 2,25 → 225, 2.25 → 225
    text = re.sub(r"(\d+)[,.](\d+)", lambda m: m.group(1) + m.group(2), text)

    # Unit normalization (must come after decimal strip)
    text = re.sub(r"(\d+)\s*litros?\b",    r"\1l",   text)
    text = re.sub(r"(\d+)\s*lts?\b",       r"\1l",   text)
    text = re.sub(r"(\d+)\s+l\b",          r"\1l",   text)   # space guard: avoid "el"
    text = re.sub(r"(\d+)\s*mililitros?\b", r"\1ml",  text)
    text = re.sub(r"(\d+)\s+ml\b",         r"\1ml",  text)
    text = re.sub(r"(\d+)ml\b",            r"\1ml",  text)
    text = re.sub(r"(\d+)\s*kilogr?amos?\b", r"\1kg", text)
    text = re.sub(r"(\d+)\s*kilos?\b",     r"\1kg",  text)
    text = re.sub(r"(\d+)\s+kg\b",         r"\1kg",  text)
    text = re.sub(r"(\d+)\s*gramos?\b",    r"\1g",   text)
    text = re.sub(r"(\d+)\s*grs?\b",       r"\1g",   text)
    text = re.sub(r"(\d+)\s+g\b",          r"\1g",   text)

    # Remove special characters (keep alphanumeric, space, dash)
    text = re.sub(r"[^\w\s\-]", " ", text)

    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def extract_unit(name: str) -> str:
    """Extract the first measure/unit found in the product name."""
    if not isinstance(name, str):
        return ""
    patterns = [
        r"\d+[,.]?\d*\s*(?:litros?|lts?)\b",
        r"\d+[,.]?\d*\s*l\b",
        r"\d+[,.]?\d*\s*(?:mililitros?|ml)\b",
        r"\d+[,.]?\d*\s*(?:kilogr?amos?|kilos?|kg)\b",
        r"\d+[,.]?\d*\s*(?:gramos?|grs?|g)\b",
        r"\d+\s*x\s*\d+[,.]?\d*\s*(?:ml|g|kg|l)\b",
        r"\d+\s*(?:unidades?|un\.?)\b",
    ]
    name_lower = name.lower()
    for pattern in patterns:
        m = re.search(pattern, name_lower)
        if m:
            return m.group(0).strip()
    return ""


# ── Exclusion rules ───────────────────────────────────────────────────────────
# Sections that belong to restaurants / prepared food / bakery / combos.
# Match as substrings (lowercase).

EXCLUDED_SECTION_SUBSTRINGS: list[str] = [
    "pizza", "empanada", "hamburguesa", "burger",
    "sushi", "rolls de",
    "parrilla", "asado",
    "plato principal", "platos caliente", "plato caliente",
    "menu del dia", "menú del día", "almuerzo", "cena ejecutiva",
    "para armar", "combo",
    "rotiser", "pollos rostiz",
    "comidas listas", "comidas preparadas",
    "sandwich", "lomito", "pancho", "minutas",
    "entradas calientes",
    "postres",
    "tarta salada", "tarta dulce", "tartas",
    "facturas", "medialunas",
    "pastelería", "pasteleria",
    "confitería", "confiteria",
    "helados artesanal",
    "wraps", "wok ",
    "panadería", "panaderia",
    "milanesas",
    "picadas", "tapas y picadas",
    "desayuno para armar",
    "carne fresca", "cortes de carne",
    "fiambre",
    "pollo rostizado", "pollo entero",
    "pescados y mariscos frescos",
    "salsas caseras",
    "delivery",
]

# Product name substrings that indicate prepared food / restaurant item.
# Padded with spaces to avoid false positives (e.g. avoid matching "plato" in "chocolate").
EXCLUDED_PRODUCT_SUBSTRINGS: list[str] = [
    " menú ", " menu ", " combo ", " porción ", " porcion ",
    "para armar", "por persona", "para 2 ", "para dos",
    " plato ", "plato del",
    "hamburguesa", " pizza ", "empanada",
    " sushi", "milanesa de pollo", "milanesa napolitana", "milanesa de carne",
    " tarta ", "medialunas", "factura dulce",
    "choripan", "choripán",
    "bondiola a", "bife de ", "asado de ", "churrasco",
    "pollo entero", "pata muslo", "pechuga de pollo",
    "sorrentino", "canelone", "lasagna", "lasaña",
    "guiso de", "estofado de", "locro", "puchero",
    "almuerzo ejecutivo", "cena ejecutiva",
    "pollo rostizado",
]


def is_excluded(product_name: str, section: str) -> bool:
    """Returns True if the product is prepared food / restaurant / menu item."""
    name_lower = (product_name or "").lower()
    section_lower = (section or "").lower()

    for kw in EXCLUDED_SECTION_SUBSTRINGS:
        if kw in section_lower:
            return True

    name_padded = f" {name_lower} "
    for kw in EXCLUDED_PRODUCT_SUBSTRINGS:
        if kw in name_padded:
            return True

    return False


# ── Category detection ────────────────────────────────────────────────────────
# Rules: first match wins. Priority order: mascotas > bebidas > lacteos >
# limpieza > perfumeria > snacks > almacen > otros.
#
# Each tuple: (category_id, [list of keyword substrings])
# Keywords are matched against: product_name + collection_section + product_description
# (all lowercased, accents removed)

CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("mascotas", [
        "mascota", "petshop", "pet shop",
        "perro ", "gato ", " gatos", " perros",
        "croqueta", "pedigree", "purina", "whiskas",
        "royal canin", "eukanuba", " iams ", "felix ",
        "friskies", "proplan", "pro plan",
        "arena para gato", "arena sanitaria",
        "alimento para gato", "alimento para perro",
        "snack para perro", "snack para gato",
        "accesorios para mascota",
    ]),
    ("bebidas", [
        # section-level
        "bebidas", "gaseosas", "cervezas", "aguas", "vinos", "espirituosas",
        "jugos y nectares", "energizantes", "bebidas sin alcohol",
        # product-level
        "agua mineral", "agua con gas", "agua sin gas", "agua saborizada",
        "soda agua", " soda ", "gaseosa", " cerveza", "birra",
        " vino tinto", " vino blanco", " vino rose", " vino rosé",
        " sidra", "fernet", "whisky", "whiskey", "vodka", " gin ", " ron ",
        " rum ", "tónica", "tonica", "bebida energizante", "energizante",
        "isotónico", "isotonica", "jugo de ", "jugos de ", "limonada",
        "naranjada", "sprite", "coca cola", "coca-cola", "pepsi",
        "fanta", "seven up", " 7up", "manaos", "cunnington", "torasso",
        " tang ", "clight", " ades ", " levite", "villavicencio",
        "aquarius", "powerade", "gatorade", "monster energy",
        "red bull", "speed energy", "te helado", "mate cocido bolsita",
        "jugo en polvo", "bebida de soja",
    ]),
    ("lacteos", [
        # section-level
        "lácteos", "lacteos", "yogures", "quesos", "refrigerados",
        # product-level
        "leche entera", "leche descremada", "leche semidescremada",
        "leche larga vida", "leche en polvo", "leche chocolatada",
        "leche uht",
        "yogur ", "yogurt", "yogur bebible",
        "queso cremoso", "queso tybo", "queso cuartirolo",
        "queso reggianito", "queso sardo", "queso port salut",
        "queso mozzarella", "queso en barra", "queso rallado",
        "queso untable", "queso fresco",
        " manteca ", "crema de leche", "ricota", "dulce de leche",
        "la serenisima", "la serenísima", "sancor", "danone",
        "tregar", "ilolay", "casancrem", "finlandia queso",
    ]),
    ("limpieza", [
        # section-level
        "limpieza", "hogar", "limpieza del hogar", "cuidado del hogar",
        "papel e higiene", "papel higienico",
        # product-level
        "detergente lavavajilla", "detergente ropa", "detergente liquido",
        "lavandina", "jabón en polvo", "jabon en polvo",
        "suavizante para ropa", "limpiador multiuso", "limpiador de piso",
        "desengrasante", "limpiavidrios", "quitamanchas",
        "esponja de cocina", "esponja de baño", "virulana", "scotch brite",
        "trapo de piso", "trapo rejilla",
        "bolsa de basura", "bolsas de basura",
        "rollo de cocina", "papel de cocina",
        "papel higiénico", "papel higienico",
        "toallita húmeda", "toallitas húmedas",
        "pañuelo desechable", "pañuelos de papel",
        "servilleta de papel", "servilletas de papel",
        "fabuloso ", " cif ", " flash ", "ayudín", "ayudin",
        "magistral", "domestos", " vim ", "pato clabel",
        "mister músculo", "mister musculo",
        "ariel polvo", "ariel liquido", "ariel líquido",
        "persil ", "skip polvo", "ala detergente",
        "ace blanqueador", "harpic",
    ]),
    ("perfumeria", [
        # section-level
        "perfumería", "perfumeria", "higiene personal", "cuidado personal",
        "cuidado del cabello", "cuidado de la piel",
        # product-level
        "shampoo", "champú", "champu",
        "acondicionador para", "balsamo para cabello",
        "desodorante roll", "desodorante aerosol", "desodorante en barra",
        "crema corporal", "loción corporal", "locion corporal",
        "gel de ducha", "jabón de tocador", "jabon de tocador",
        "pasta dental", "cepillo de dientes", "enjuague bucal",
        "hilo dental", "protector solar", "bronceador",
        "base de maquillaje", "rimel", "labial",
        "perfume ", " colonia ", "after shave",
        "dove shampoo", "dove desodorante", "dove jabon",
        "sedal shampoo", "sedal acondicionador",
        "pantene", "head & shoulders", "head shoulders",
        "rexona", " axe ", "nivea crema", "nivea desodorante",
        "garnier ", "neutrogena", "johnsons baby",
        "palmolive", "colgate", "oral-b", "oral b", "listerine",
        "gillette", "gilette", "venus gillette",
    ]),
    ("snacks", [
        # section-level
        "snacks", "golosinas", "galletitas", "snacks y golosinas",
        # product-level
        "galletitas dulces", "galletitas saladas", "galletitas de arroz",
        "alfajor", "alfajores",
        "papas fritas snack", "papas fritas de paquete", "papas fritas bolsa",
        "palitos salados", " maní tostado", "mani tostado",
        "chizitos", "pochoclo", "caramelo", "gomitas", "golosinas",
        "chocolate con leche", "chocolate amargo", "tableta de chocolate",
        "barra de cereal", "barrita de cereal",
        "turron", "turrón", "frutos secos mix", "nueces peladas",
        "almendras peladas", "pasas de uva",
        "criollitas", "oreo ", "toddy ", " tita ", "mantecol",
        "bon o bon", "rhodesia", "cabsha", "cofler",
        "milka ", "kit kat", "kinder bueno",
        "ramitas snack", " snack ",
    ]),
    ("almacen", [
        # section-level
        "almacén", "almacen", "secos", "despensa", "pastas", "arroces",
        "aceites y vinagres", "conservas", "salsas y condimentos",
        "desayuno y merienda", "infusiones", "cereales",
        # product-level
        "arroz blanco", "arroz integral", "arroz largo fino",
        "fideos spaghetti", "fideos tallarín", "fideos tallarin",
        "fideos moñito", "fideos tirabuzón", "fideos cabello",
        "fideos secos", "pasta seca",
        "harina 0000", "harina 000", "harina integral", "harina de maiz",
        "aceite de girasol", "aceite de maiz", "aceite de oliva", "aceite de soja",
        "vinagre de alcohol", "vinagre de manzana", "vinagre blanco",
        "sal entrefina", "sal fina", "sal gruesa",
        "azúcar molida", "azucar molida", "azucar refinada", "azucar impalpable",
        "polenta instantanea", "polenta ",
        "porotos negros", "porotos aduki", "lentejas ", "garbanzos ",
        "arvejas secas", "arvejas en lata",
        "tomate triturado", "tomate perita", "puré de tomate", "pure de tomate",
        "salsa de tomate", "salsa napolitana",
        "mayonesa ", "ketchup ", "mostaza ",
        "mermelada de ", "dulce de membrillo",
        " miel ", "miel de abeja",
        "yerba mate", " yerba ",
        "café molido", "cafe molido", "café en grano", "cafe instantaneo",
        "te verde", "te negro", "te de manzanilla", "infusión",
        "avena arrollada", "granola ", "copos de maiz", "corn flakes",
        "pan lactal", "pan de molde", "pan de salvado",
        "caldo de verdura", "caldo de pollo", "caldo de carne", "caldito",
        "gelatina sin sabor", "gelatina con sabor",
        "pimienta molida", " comino", "orégano seco", "aji molido",
        "pimentón", "pimenton", "condimento para ",
        "atún al natural", "atun al natural", "atún en aceite",
        "sardinas en lata", "caballa en aceite",
        "aceitunas verdes", "aceitunas negras", "pepinillos",
        "maicena ", "fecula de maiz",
        "polvo de hornear", "levadura seca",
        "esencia de vainilla", "cacao amargo", "cacao en polvo",
    ]),
]


def detect_category(product_name: str, section: str, description: str) -> str:
    """
    Returns categoryId based on keyword matching.
    Priority: mascotas > bebidas > lacteos > limpieza > perfumeria > snacks > almacen > otros
    """
    combined = strip_accents(
        " ".join([
            (product_name or "").lower(),
            (section or "").lower(),
            (description or "").lower(),
        ])
    )

    for category_id, keywords in CATEGORY_RULES:
        for kw in keywords:
            if strip_accents(kw) in combined:
                return category_id

    return "otros"


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Filter FooDI-ML AR products for B2B catalog"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Max products to select (default: {DEFAULT_LIMIT})",
    )
    args = parser.parse_args()

    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found: {CSV_PATH}")
        print("  Run from project root after downloading the dataset.")
        sys.exit(1)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"[INFO] Reading {CSV_PATH} in chunks of {CHUNK_SIZE:,} rows...")
    print(f"[INFO] Target: up to {args.limit} unique products (AR, no prepared food)\n")

    total_rows = 0
    ar_total = 0
    excluded_total = 0
    no_s3_total = 0
    seen_normalized: set[str] = set()
    selected: list[dict] = []

    done = False

    for chunk in pd.read_csv(CSV_PATH, chunksize=CHUNK_SIZE, low_memory=False):
        if done:
            break

        total_rows += len(chunk)

        # Filter AR
        ar_chunk = chunk[chunk["country_code"] == "AR"].copy()
        ar_total += len(ar_chunk)

        for _, row in ar_chunk.iterrows():
            product_name = str(row.get("product_name", "") or "")
            section = str(row.get("collection_section", "") or "")
            description = str(row.get("product_description", "") or "")
            s3_path = str(row.get("s3_path", "") or "")

            # Skip rows without s3_path (no image to download)
            if not s3_path or s3_path == "nan":
                no_s3_total += 1
                continue

            # Skip prepared food / restaurant items
            if is_excluded(product_name, section):
                excluded_total += 1
                continue

            # Skip very short names
            normalized = normalize_product_name(product_name)
            if not normalized or len(normalized) < 3:
                continue

            # Deduplicate by normalized name
            if normalized in seen_normalized:
                continue
            seen_normalized.add(normalized)

            category_id = detect_category(product_name, section, description)

            selected.append(
                {
                    "product_name": product_name,
                    "normalized_name": normalized,
                    "category_id": category_id,
                    "unit": extract_unit(product_name),
                    "city_code": str(row.get("city_code", "") or ""),
                    "store_name": str(row.get("store_name", "") or ""),
                    "collection_section": section,
                    "product_description": description,
                    "s3_path": s3_path,
                    "country_code": "AR",
                }
            )

            if len(selected) >= args.limit:
                done = True
                break

        print(
            f"  Read: {total_rows:>9,}  |  AR: {ar_total:>7,}  |  "
            f"Excluded: {excluded_total:>6,}  |  Selected: {len(selected):>5,}",
            end="\r",
            flush=True,
        )

    print()  # newline after \r

    # Final trim (safety)
    selected = selected[: args.limit]

    # ── Summary ───────────────────────────────────────────────────────────────
    cat_counts = Counter(p["category_id"] for p in selected)

    print(f"\n{'='*62}")
    print("FILTER RESULTS")
    print(f"{'='*62}")
    print(f"  Total CSV rows read      : {total_rows:>10,}")
    print(f"  AR rows found            : {ar_total:>10,}")
    print(f"  Skipped (no s3_path)     : {no_s3_total:>10,}")
    print(f"  Excluded (food/menu)     : {excluded_total:>10,}")
    print(f"  Unique after dedup       : {len(seen_normalized):>10,}")
    print(f"  Selected (limit={args.limit:<5})   : {len(selected):>10,}")

    print(f"\n  Category breakdown:")
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        bar = "█" * min(cnt, 30)
        print(f"    {cat:<12}  {cnt:3}  {bar}")

    df_out = pd.DataFrame(selected)
    df_out.to_csv(OUTPUT_PATH, index=False)

    print(f"\n[OK] Saved {len(df_out)} products → {OUTPUT_PATH}")
    print("     Next step: python scripts/foodi/download_foodi_images.py --limit 50")


if __name__ == "__main__":
    main()
