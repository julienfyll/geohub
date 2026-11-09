"""
Data Ingestion Pipeline for GeoHub using Python & uv
Downloads GeoNames cities dataset, normalizes names, categorizes by scale (FR, EU, WORLD),
and compiles an optimized SQLite database with spatial bounding boxes and indexes.
"""

import os
import sys
import zipfile
import urllib.request
import sqlite3
import unicodedata
import re

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
DB_PATH = os.path.join(DATA_DIR, "geohub.db")
GEONAMES_URL = "https://download.geonames.org/export/dump/cities5000.zip"
ZIP_PATH = os.path.join(DATA_DIR, "cities5000.zip")
TXT_NAME = "cities5000.txt"

# European country ISO codes
EUROPE_COUNTRIES = {
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE",
    "CH", "UA", "GB", "VA"
}

def normalize_text(text: str) -> str:
    """Normalize text: strip accents, lower-case, replace dashes with spaces."""
    nfkd = unicodedata.normalize('NFKD', text)
    no_accents = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', no_accents)
    return ' '.join(cleaned.lower().split())

def download_data():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(ZIP_PATH):
        print(f"Downloading GeoNames dataset from {GEONAMES_URL}...")
        urllib.request.urlretrieve(GEONAMES_URL, ZIP_PATH)
        print("Download complete.")
    else:
        print(f"Zip file already present at {ZIP_PATH}.")

def process_and_seed_db():
    print(f"Initializing SQLite database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create tables
    cursor.execute("DROP TABLE IF EXISTS cities;")
    cursor.execute("""
        CREATE TABLE cities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            normalized_name TEXT NOT NULL,
            country_code TEXT NOT NULL,
            continent TEXT,
            scale TEXT NOT NULL,          -- 'fr', 'eu', 'world'
            population INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            timezone TEXT
        );
    """)

    cursor.execute("CREATE INDEX idx_cities_scale_pop ON cities (scale, population DESC);")
    cursor.execute("CREATE INDEX idx_cities_country ON cities (country_code);")
    cursor.execute("CREATE INDEX idx_cities_continent ON cities (continent);")
    cursor.execute("CREATE INDEX idx_cities_normalized_name ON cities (normalized_name);")
    cursor.execute("CREATE INDEX idx_cities_lat_lon ON cities (latitude, longitude);")

    # Table for city alternate names (French names, exonyms, transliterations)
    cursor.execute("DROP TABLE IF EXISTS city_aliases;")
    cursor.execute("""
        CREATE TABLE city_aliases (
            city_id TEXT NOT NULL,
            alias TEXT NOT NULL,
            normalized_alias TEXT NOT NULL,
            scale TEXT NOT NULL,
            population INTEGER NOT NULL
        );
    """)

    # Table for pre-generated daily challenges & seeds
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_challenges (
            date TEXT NOT NULL,
            scale TEXT NOT NULL,
            seed_city_id TEXT NOT NULL,
            radii_json TEXT NOT NULL,
            PRIMARY KEY (date, scale)
        );
    """)

    print(f"Extracting and parsing {TXT_NAME}...")
    records = []
    alias_records = []
    seen_aliases = set()

    with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
        with zf.open(TXT_NAME) as f:
            for line_bytes in f:
                line = line_bytes.decode('utf-8', errors='ignore').strip()
                if not line:
                    continue
                parts = line.split('\t')
                if len(parts) < 18:
                    continue

                geoname_id = parts[0]
                name = parts[1]
                raw_alts = parts[3].split(',') if parts[3] else []
                lat = float(parts[4])
                lon = float(parts[5])
                feature_code = parts[7]
                country_code = parts[8].upper()
                pop = int(parts[14])
                timezone = parts[17]

                if pop <= 0:
                    continue

                # Filter out borough / arrondissement sections (PPLX)
                if feature_code == "PPLX" or re.search(r'^(Paris|Lyon|Marseille)\s+\d+', name, re.IGNORECASE):
                    continue

                norm_name = normalize_text(name)

                # Assign scales:
                # 'fr': French cities (Metropolitan France & Corsica filter: lat 41-52, lon -5 to 10)
                # 'eu': European countries (for Russia, strictly European Russia west of Urals: lon <= 60.0)
                # 'world': Globally all cities >= 25k pop
                assigned_scales = []
                if country_code == "FR" and (41.0 <= lat <= 51.5) and (-5.5 <= lon <= 10.0):
                    cid = f"fr_{geoname_id}"
                    records.append((cid, name, norm_name, country_code, "fr", pop, lat, lon, timezone))
                    assigned_scales.append((cid, "fr"))
                
                is_european = (country_code in EUROPE_COUNTRIES)
                if country_code == "RU" and lon > 60.0:
                    is_european = False

                if is_european and pop >= 15000:
                    cid = f"eu_{geoname_id}"
                    records.append((cid, name, norm_name, country_code, "eu", pop, lat, lon, timezone))
                    assigned_scales.append((cid, "eu"))

                if pop >= 25000:
                    cid = f"world_{geoname_id}"
                    records.append((cid, name, norm_name, country_code, "world", pop, lat, lon, timezone))
                    assigned_scales.append((cid, "world"))

                # Parse alternate names (French, local, exonyms)
                if assigned_scales and raw_alts:
                    JUNK_NICKNAMES = {
                        "ville lumiere", "paname", "pantruche", "cite des papes",
                        "saint jean sur mer", "rochefort des vignes", "rochefort la vigne"
                    }
                    for raw_alt in raw_alts:
                        alt = raw_alt.strip()
                        if not alt or len(alt) < 2:
                            continue
                        # Skip 3-letter airport codes (CDG, ORY, PAR, MRS, etc.)
                        if len(alt) == 3 and alt.isupper() and alt.isalpha():
                            continue
                        norm_alt = normalize_text(alt)
                        if not norm_alt or len(norm_alt) < 2 or norm_alt in JUNK_NICKNAMES:
                            continue
                        if norm_alt == norm_name:
                            continue
                        if not re.match(r'^[a-z0-9\s\-]+$', norm_alt):
                            continue

                        for cid, scale in assigned_scales:
                            pair = (cid, norm_alt)
                            if pair not in seen_aliases:
                                seen_aliases.add(pair)
                                alias_records.append((cid, alt, norm_alt, scale, pop))

    print(f"Inserting {len(records)} city entries into SQLite...")
    cursor.executemany("""
        INSERT INTO cities (id, name, normalized_name, country_code, scale, population, latitude, longitude, timezone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, records)

    print(f"Inserting {len(alias_records)} alias entries into SQLite...")
    cursor.executemany("""
        INSERT INTO city_aliases (city_id, alias, normalized_alias, scale, population)
        VALUES (?, ?, ?, ?, ?);
    """, alias_records)

    cursor.execute("CREATE INDEX idx_city_aliases_lookup ON city_aliases (scale, normalized_alias, population DESC);")

    conn.commit()

    # Verification counts
    for scale in ['fr', 'eu', 'world']:
        cursor.execute("SELECT count(*), max(population), min(population) FROM cities WHERE scale = ?", (scale,))
        count, max_p, min_p = cursor.fetchone()
        print(f"Scale '{scale}': {count} cities | Max pop: {max_p:,} | Min pop: {min_p:,}")

    conn.close()
    print("Database built successfully!")

if __name__ == "__main__":
    download_data()
    process_and_seed_db()
