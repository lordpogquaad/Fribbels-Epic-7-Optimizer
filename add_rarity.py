import json
import csv

HERODATA_PATH = r"1. App\1. Master\2. Data\cache\herodata.json"
INPUT_CSV     = "heroes.csv"
OUTPUT_CSV    = "heroes_with_rarity.csv"

with open(HERODATA_PATH, encoding="utf-8") as f:
    herodata = json.load(f)

rarity_map = {name: entry["rarity"] for name, entry in herodata.items() if "rarity" in entry}

unmatched = []

with open(INPUT_CSV, newline="", encoding="utf-8") as infile, \
     open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as outfile:

    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    for i, row in enumerate(reader):
        if i == 0:
            # Header row — insert "Rarity" after "Name"
            writer.writerow([row[0], "Rarity"] + row[1:])
        else:
            name = row[0]
            rarity = rarity_map.get(name, "")
            if rarity == "":
                unmatched.append(name)
            writer.writerow([name, rarity] + row[1:])

print(f"Done. Written to {OUTPUT_CSV}")
if unmatched:
    print(f"\n{len(unmatched)} heroes not found in herodata.json (rarity left blank):")
    for name in unmatched:
        print(f"  - {name}")
else:
    print("All heroes matched successfully.")
