"""
Debug: Check winding order and understand the rendering issue.
The giant yellow square means one polygon fills the entire bounding box.
This typically happens when:
1. Winding order is reversed (exterior ring becomes fill, everything else is cutout)
2. The coordinate order is [lon, lat] vs [lat, lon]
"""
import json

data = json.load(open(r'C:\Users\Anuj Bhusal\Desktop\Integrity-Nepal\backend\app\data\nepal_provinces.geojson'))

for f in data['features']:
    geom = f['geometry']
    props = f['properties']
    coords = geom['coordinates']
    
    if geom['type'] == 'Polygon':
        ring = coords[0]
        # Check winding order using shoelace formula
        # Positive = counterclockwise (GeoJSON spec = exterior ring)
        # Negative = clockwise (GeoJSON spec = interior/hole)
        n = len(ring)
        area = sum(
            (ring[i][0] * ring[(i+1) % n][1]) - (ring[(i+1) % n][0] * ring[i][1])
            for i in range(n)
        ) / 2
        winding = "CCW (exterior, correct)" if area > 0 else "CW (may be hole/reversed)"
        print(f"{props['PR_NAME']}: {n} pts, signed_area={area:.2f}, winding={winding}")
        print(f"  First 3 pts: {ring[:3]}")
        print(f"  Check: lon range=[{min(p[0] for p in ring):.2f},{max(p[0] for p in ring):.2f}] lat range=[{min(p[1] for p in ring):.2f},{max(p[1] for p in ring):.2f}]")
        print()
