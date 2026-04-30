"""
Simulate exactly what the frontend does:
1. Get geojson PR_NAME values
2. Run toCanonicalProvinceName on them
3. Check if they match heatmap region names
"""

# Heatmap data (from API)
heatmap_regions = [
    {"region": "Koshi Province", "count": 55, "intensity": "Medium"},
    {"region": "Madhesh Province", "count": 51, "intensity": "Medium"},
    {"region": "Bagmati Province", "count": 113, "intensity": "High"},
    {"region": "Gandaki Province", "count": 22, "intensity": "Low"},
    {"region": "Lumbini Province", "count": 62, "intensity": "Medium"},
    {"region": "Karnali Province", "count": 12, "intensity": "Low"},
    {"region": "Sudurpashchim Province", "count": 9, "intensity": "Low"},
]

# Alias map (from regions.ts)
ALIASES = {
    'Province 1': 'Koshi Province',
    'Province 2': 'Madhesh Province',
    'Bagmati': 'Bagmati Province',
    'Gandaki': 'Gandaki Province',
    'Lumbini': 'Lumbini Province',
    'Karnali': 'Karnali Province',
    'Sudurpaschim': 'Sudurpashchim Province',
    'Province No 1': 'Koshi Province',
    'Province No 2': 'Madhesh Province',
    'Province No 5': 'Lumbini Province',
    'Bagmati Pradesh': 'Bagmati Province',
    'Gandaki Pradesh': 'Gandaki Province',
    'Karnali Pradesh': 'Karnali Province',
    'Sudurpashchim Pradesh': 'Sudurpashchim Province',
}

def to_canonical(name):
    return ALIASES.get(name.strip(), name.strip()) if name else ''

# GeoJSON PR_NAME values
geojson_names = [
    'Province No 1',
    'Province No 2',
    'Bagmati Pradesh',
    'Gandaki Pradesh',
    'Province No 5',
    'Karnali Pradesh',
    'Sudurpashchim Pradesh',
]

# Build counts map (what frontend does)
counts = {r['region']: r for r in heatmap_regions}

print("=== LINKAGE CHECK ===")
print(f"{'GeoJSON PR_NAME':<25} {'Canonical':<25} {'Found in heatmap?':<20} {'Count':<10} {'Intensity'}")
print("-" * 95)
all_matched = True
for raw_name in geojson_names:
    canonical = to_canonical(raw_name)
    match = counts.get(canonical)
    found = match is not None
    if not found:
        all_matched = False
    count = match['count'] if match else 'NOT FOUND'
    intensity = match['intensity'] if match else 'NOT FOUND'
    status = "✓" if found else "✗ BROKEN"
    print(f"{raw_name:<25} {canonical:<25} {status:<20} {str(count):<10} {intensity}")

print()
if all_matched:
    print("✓ ALL 7 provinces matched correctly!")
    print("→ The data linkage is CORRECT.")
    print("→ The rendering bug must be in the D3/SVG layer.")
else:
    print("✗ Some provinces did NOT match — data linkage broken.")

print()
print("=== WHAT FRONTEND RENDERS ===")
for raw_name in geojson_names:
    canonical = to_canonical(raw_name)
    match = counts.get(canonical)
    intensity = match['intensity'] if match else 'Low'
    color_map = {'Low': '#f5d76e', 'Medium': '#f59e0b', 'High': '#ef4444'}
    color = color_map[intensity]
    print(f"  {raw_name} → {canonical} → intensity={intensity} → fill={color}")
