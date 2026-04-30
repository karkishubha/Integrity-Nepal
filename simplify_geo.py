"""
Simplify province.geojson by keeping every Nth point in each ring.
Reduces ~140,000 points to ~3,500 — still very detailed at 720px scale.
"""
import json, math, os

def rdp(points, epsilon):
    """Ramer-Douglas-Peucker line simplification."""
    if len(points) < 3:
        return points
    # Find the point with the maximum distance from the line start->end
    start, end = points[0], points[-1]
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    norm = math.hypot(dx, dy)
    if norm == 0:
        # start == end, keep all
        dists = [math.hypot(p[0]-start[0], p[1]-start[1]) for p in points]
    else:
        dists = [abs(dx*(start[1]-p[1]) - (start[0]-p[0])*dy) / norm for p in points]
    
    max_dist = max(dists)
    max_idx = dists.index(max_dist)
    
    if max_dist > epsilon:
        left = rdp(points[:max_idx+1], epsilon)
        right = rdp(points[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [start, end]

def simplify_ring(ring, epsilon=0.003):
    """Simplify a coordinate ring, preserving closure."""
    if len(ring) < 4:
        return ring
    simplified = rdp(ring[:-1], epsilon)  # exclude closing point
    if len(simplified) < 3:
        return ring  # fallback: don't simplify
    return simplified + [simplified[0]]  # re-close

def simplify_geojson(input_path, output_path, epsilon=0.003):
    with open(input_path, encoding='utf-8') as f:
        data = json.load(f)
    
    total_before = 0
    total_after = 0
    
    for feature in data['features']:
        geom = feature['geometry']
        name = feature['properties'].get('PR_NAME', '?')
        
        if geom['type'] == 'Polygon':
            before = sum(len(r) for r in geom['coordinates'])
            geom['coordinates'] = [simplify_ring(ring, epsilon) for ring in geom['coordinates']]
            after = sum(len(r) for r in geom['coordinates'])
        elif geom['type'] == 'MultiPolygon':
            before = sum(len(r) for poly in geom['coordinates'] for r in poly)
            geom['coordinates'] = [
                [simplify_ring(ring, epsilon) for ring in poly]
                for poly in geom['coordinates']
            ]
            after = sum(len(r) for poly in geom['coordinates'] for r in poly)
        else:
            before = after = 0
        
        total_before += before
        total_after += after
        print(f"  {name}: {before} -> {after} pts ({100*after//before if before else 0}% kept)")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    
    size_before = os.path.getsize(input_path)
    size_after = os.path.getsize(output_path)
    print(f"\nTotal points: {total_before} -> {total_after}")
    print(f"File size: {size_before//1024}KB -> {size_after//1024}KB")
    print(f"Output: {output_path}")

if __name__ == '__main__':
    base = r'C:\Users\Anuj Bhusal\Desktop\Integrity-Nepal'
    simplify_geojson(
        os.path.join(base, 'province.geojson'),
        os.path.join(base, 'backend', 'app', 'data', 'nepal_provinces.geojson'),
        epsilon=0.003  # ~300m tolerance, invisible at 720px map scale
    )
