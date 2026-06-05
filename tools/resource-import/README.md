# HandiCare Resource Import

Pipeline d'import de ressources pour Casablanca.

## Important

Pour une production stable et conforme, utilisez Google Places API. Le script Playwright est prévu pour une collecte limitée, avec validation humaine, délais et volumes réduits.

## Installation

```powershell
cd tools/resource-import
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
```

## 1. Collecte

```powershell
python scrape_google_maps.py --queries queries.json --out data/raw_resources.json
```

## 2. Nettoyage + exports

Génère JSON, CSV, SQL et rapport PDF.

```powershell
python clean_export_resources.py --input data/raw_resources.json --out-dir data/clean
```

## 3. Import MySQL

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="handicare"
$env:DB_USER="root"
$env:DB_PASSWORD="1234"
python import_mysql.py --input data/clean/resources_clean.json
```

Les ressources importées ont `verified=false` pour rester vérifiables par l'admin avant validation complète.
