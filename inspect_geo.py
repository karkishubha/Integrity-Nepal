import json

data = json.load(open(r'C:\Users\Anuj Bhusal\Desktop\Integrity-Nepal\backend\app\data\nepal_provinces.geojson'))
print('Type:', data['type'])
print('BBox:', data.get('bbox'))
print('Number of features:', len(data['features']))
print()

all_lons = []
all_lats = []

for f in data['features']:
    props = f['properties']
    geom = f['geometry']
    geom_type = geom['type']
    coords = geom['coordinates']
    
    # Flatten coords to get bounds
    def flatten(c, depth=0):
        if depth == 0 and not isinstance(c[0], list):
            return [c]
        result = []
        for item in c:
            result.extend(flatten(item, depth-1 if depth > 0 else 0))
        return result

    if geom_type == 'Polygon':
        ring = coords[0]
        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
    elif geom_type == 'MultiPolygon':
        lons = [pt[0] for poly in coords for ring in poly for pt in ring]
        lats = [pt[1] for poly in coords for ring in poly for pt in ring]
    else:
        lons, lats = [], []
    
    all_lons.extend(lons)
    all_lats.extend(lats)
    
    if lons and lats:
        print(f'  PR_NAME={props["PR_NAME"]} | geom={geom_type} | lon=[{min(lons):.3f},{max(lons):.3f}] | lat=[{min(lats):.3f},{max(lats):.3f}]')

if all_lons and all_lats:
    print()
    print(f'TOTAL BBOX: lon=[{min(all_lons):.3f},{max(all_lons):.3f}] lat=[{min(all_lats):.3f},{max(all_lats):.3f}]')
    print(f'Width: {max(all_lons)-min(all_lons):.3f} deg | Height: {max(all_lats)-min(all_lats):.3f} deg')
