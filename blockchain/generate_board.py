
import json

# Hexagon layout (q, r) for standard Catan (radius 2)
# Row by row numbering 0-18
hex_coords = [
    (0, -2), (1, -2), (2, -2),       # Row 0: 0-2
    (-1, -1), (0, -1), (1, -1), (2, -1), # Row 1: 3-6
    (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), # Row 2: 7-11
    (-2, 1), (-1, 1), (0, 1), (1, 1),    # Row 3: 12-15
    (-2, 2), (-1, 2), (0, 2)         # Row 4: 16-18
]

# Map (q, r) to Hex ID
hex_map = {coords: i for i, coords in enumerate(hex_coords)}

# Vertex offsets from hex center (q, r)
# 0: Top, 1: Top-Right, 2: Bottom-Right, 3: Bottom, 4: Bottom-Left, 5: Top-Left
# In axial, corners are shared.
# Let's define vertices by their relation to hexes.
# A vertex is defined by the 3 hexes it touches (or 1 or 2 if on edge).
# Actually, simpler: define vertices as (q, r, direction) normalized.
# Direction 0 (Top) of (q,r) is same as Direction 4 (Bottom-Left) of (q+1, r-1) ? No.

# Let's use a standard coordinate system for vertices.
# Dual grid?
# Let's just iterate hexes and assign vertex IDs to unique coordinates.
# Vertex coordinates can be fractional hex coordinates.
# Top of (0,0) is (0, -0.5)?

# Alternative:
# Vertices are at (q + 1/3, r + 1/3) type offsets.
# Let's use a "Vertex Map" to assign IDs.
# Key: tuple of sorted hex IDs touching this vertex?
# Or Key: (q, r, corner_index 0-5)
# But we need to normalize.
# Corner 0 of (q,r) == Corner 4 of (q, r-1) == Corner 2 of (q+1, r-1) ?
# Let's verify adjacency.
# Neighbors of (q,r):
# 0: (q, r-1)
# 1: (q+1, r-1)
# 2: (q+1, r)
# 3: (q, r+1)
# 4: (q-1, r+1)
# 5: (q-1, r)

# Vertex 0 of (q,r) touches (q,r), (q+1, r-1), (q, r-1).
# Vertex 1 of (q,r) touches (q,r), (q+1, r), (q+1, r-1).
# ...

# Let's generate all 6 corners for each hex, normalize them, and assign IDs.
vertices = {} # Key: Canonical representation, Value: ID
next_vertex_id = 0

# Edges: Key: Canonical representation, Value: ID
edges = {}
next_edge_id = 0

# Data structures for Solidity
hex_vertices = [[] for _ in range(19)]
hex_edges = [[] for _ in range(19)]
vertex_edges = [] # Will fill later
edge_vertices = [] # Will fill later

# Helper to normalize vertex
# A vertex is shared by up to 3 hexes.
# Let's represent a vertex by the set of hex coordinates it touches?
# Or just use (q, r, corner) and a normalization function.
# Normalization:
# Corner 0 (Top) of (q,r) -> touches (q,r), (q,r-1), (q+1,r-1).
#   Canonical: Min(HexCoords) + "BottomRight" of that one?
#   Let's just use floating point coordinates for uniqueness.
#   Center (q,r).
#   Corner 0: (q, r-2/3) ? No.
#   Let's use (x, y) with basis vectors.
#   x = q + r/2
#   y = r * sqrt(3)/2
#   This is for drawing.
#   For topology:
#   Corner 0: (q, r, 0)
#   Equivalences:
#   (q, r, 0) == (q, r-1, 4) == (q+1, r-1, 2) ?
#   Let's check neighbors again.
#   Dir 0 is Top.
#   Neighbor 0 is (q, r-1). Bottom-Left of (q, r-1) is 4. Correct.
#   Neighbor 1 is (q+1, r-1). Bottom-Left of (q+1, r-1) is 4. Wait.
#   Top-Right of (q,r) is 1.
#   Neighbor 1 is (q+1, r-1). Bottom of (q+1, r-1) is 3.
#   Neighbor 2 is (q+1, r). Top-Left of (q+1, r) is 5.

# Let's define equivalences map.
# (q, r, c) -> canonical (q, r, c)
def get_canonical_vertex(q, r, c):
    candidates = []
    # Self
    candidates.append((q, r, c))
    
    if c == 0: # Top
        candidates.append((q, r-1, 4)) # Bottom Left of Top Neighbor
        candidates.append((q+1, r-1, 2)) # Bottom Right of Top-Right Neighbor? No.
        # Neighbor 1 is (q+1, r-1). Its Bottom Left is 4.
        # Let's trace carefully.
        # Hex (0,0). Top is shared with (0,-1) Bottom-Left? No.
        # (0,-1) is Top-Left neighbor? No.
        # Neighbors:
        # 0: (0, -1) [Top-Leftish in axial?] No, (0,-1) is +r axis? No.
        # Axial: q is East, r is South-East.
        # Neighbors:
        # +q: East (1, 0)
        # +r: South-East (0, 1)
        # -q: West (-1, 0)
        # -r: North-West (0, -1)
        # +q-r: North-East (1, -1)
        # -q+r: South-West (-1, 1)
        
        # Corners (0 is Top, clockwise):
        # 0 (Top): Shared by (q,r), (0,-1) [NW], (1,-1) [NE]
        #   (q, r, 0) == (q, r-1, 2) [SE corner of NW] == (q+1, r-1, 4) [SW corner of NE]
        pass
    # This is getting complicated.
    # Simpler approach:
    # Just generate points in 2D space.
    # Hex center: C = q * (sqrt(3), 0) + r * (sqrt(3)/2, 1.5)
    # Vertices are at distance 1 from C at angles 30, 90, 150...
    # Round coordinates to epsilon to find unique ones.
    import math
    cx = q * math.sqrt(3) + r * math.sqrt(3)/2
    cy = r * 1.5
    
    angle_deg = 30 + 60 * c # 30, 90, 150, 210, 270, 330
    angle_rad = math.radians(angle_deg)
    vx = cx + math.cos(angle_rad)
    vy = cy + math.sin(angle_rad)
    
    # Round to avoid float issues
    return (round(vx, 3), round(vy, 3))

def get_canonical_edge(q, r, e):
    # Edge e is between corner e and (e+1)%6
    v1 = get_canonical_vertex(q, r, e)
    v2 = get_canonical_vertex(q, r, (e+1)%6)
    # Sort to make canonical
    return tuple(sorted((v1, v2)))

# Generate all
for i, (q, r) in enumerate(hex_coords):
    # Vertices
    for c in range(6):
        v_can = get_canonical_vertex(q, r, c)
        if v_can not in vertices:
            vertices[v_can] = next_vertex_id
            next_vertex_id += 1
        vid = vertices[v_can]
        hex_vertices[i].append(vid)
        
    # Edges
    for e in range(6):
        e_can = get_canonical_edge(q, r, e)
        if e_can not in edges:
            edges[e_can] = next_edge_id
            next_edge_id += 1
        eid = edges[e_can]
        hex_edges[i].append(eid)

# Now we have mappings.
# Build adjacency tables.
num_vertices = next_vertex_id
num_edges = next_edge_id

# print(f"Vertices: {num_vertices}, Edges: {num_edges}")
# Should be 54 and 72 for standard board.

vertex_edges_map = [set() for _ in range(num_vertices)]
edge_vertices_map = [set() for _ in range(num_edges)]
vertex_neighbors = [set() for _ in range(num_vertices)]
edge_neighbors = [set() for _ in range(num_edges)]

for i in range(19):
    h_verts = hex_vertices[i]
    h_edges = hex_edges[i]
    
    for j in range(6):
        v = h_verts[j]
        e = h_edges[j]     # Edge j starts at vertex j
        e_prev = h_edges[(j-1)%6] # Edge j-1 ends at vertex j
        
        vertex_edges_map[v].add(e)
        vertex_edges_map[v].add(e_prev)
        
        edge_vertices_map[e].add(v)
        edge_vertices_map[e].add(h_verts[(j+1)%6])
        
        # Vertex neighbors (connected by edges)
        vertex_neighbors[v].add(h_verts[(j+1)%6])
        vertex_neighbors[v].add(h_verts[(j-1)%6])

# Edge neighbors (connected by vertices)
for e in range(num_edges):
    vs = list(edge_vertices_map[e])
    for v in vs:
        for other_e in vertex_edges_map[v]:
            if other_e != e:
                edge_neighbors[e].add(other_e)

# Output Solidity Code
with open("src/BoardUtils.sol", "w") as f:
    f.write("// SPDX-License-Identifier: MIT\n")
    f.write("pragma solidity ^0.8.20;\n\n")
    f.write("import \"./IBoard.sol\";\n\n")
    f.write("library BoardUtils {\n")
    f.write("    // Auto-generated topology\n\n")
    
    f.write("    function getHexagonVertices(uint8 hexId) internal pure returns (uint8[6] memory) {\n")
    f.write("        if (hexId == 0) return " + str(hex_vertices[0]).replace('[', '[').replace(']', ']') + ";\n")
    for i in range(1, 19):
        f.write(f"        if (hexId == {i}) return {hex_vertices[i]};\n")
    f.write("        return [0,0,0,0,0,0];\n")
    f.write("    }\n\n")
    
    f.write("    function getHexagonEdges(uint8 hexId) internal pure returns (uint8[6] memory) {\n")
    f.write("        if (hexId == 0) return " + str(hex_edges[0]).replace('[', '[').replace(']', ']') + ";\n")
    for i in range(1, 19):
        f.write(f"        if (hexId == {i}) return {hex_edges[i]};\n")
    f.write("        return [0,0,0,0,0,0];\n")
    f.write("    }\n\n")
    
    f.write("    function getAdjacentVertices(uint8 vertexId) internal pure returns (uint8[] memory) {\n")
    f.write("        uint8[] memory neighbors;\n")
    f.write("        if (vertexId == 0) { neighbors = new uint8[](" + str(len(vertex_neighbors[0])) + "); " + "".join([f"neighbors[{k}]={v};" for k,v in enumerate(vertex_neighbors[0])]) + " return neighbors; }\n")
    for i in range(1, num_vertices):
        f.write(f"        if (vertexId == {i}) {{ neighbors = new uint8[]({len(vertex_neighbors[i])}); " + "".join([f"neighbors[{k}]={v};" for k,v in enumerate(vertex_neighbors[i])]) + " return neighbors; }\n")
    f.write("        return neighbors;\n")
    f.write("    }\n\n")
    
    f.write("    function getAdjacentEdges(uint8 edgeId) internal pure returns (uint8[] memory) {\n")
    f.write("        uint8[] memory neighbors;\n")
    f.write("        if (edgeId == 0) { neighbors = new uint8[](" + str(len(edge_neighbors[0])) + "); " + "".join([f"neighbors[{k}]={v};" for k,v in enumerate(edge_neighbors[0])]) + " return neighbors; }\n")
    for i in range(1, num_edges):
        f.write(f"        if (edgeId == {i}) {{ neighbors = new uint8[]({len(edge_neighbors[i])}); " + "".join([f"neighbors[{k}]={v};" for k,v in enumerate(edge_neighbors[i])]) + " return neighbors; }\n")
    f.write("        return neighbors;\n")
    f.write("    }\n\n")
    
    f.write("    function getVertexEdges(uint8 vertexId) internal pure returns (uint8[] memory) {\n")
    f.write("        uint8[] memory edges;\n")
    f.write("        if (vertexId == 0) { edges = new uint8[](" + str(len(vertex_edges_map[0])) + "); " + "".join([f"edges[{k}]={v};" for k,v in enumerate(vertex_edges_map[0])]) + " return edges; }\n")
    for i in range(1, num_vertices):
        f.write(f"        if (vertexId == {i}) {{ edges = new uint8[]({len(vertex_edges_map[i])}); " + "".join([f"edges[{k}]={v};" for k,v in enumerate(vertex_edges_map[i])]) + " return edges; }\n")
    f.write("        return edges;\n")
    f.write("    }\n\n")
    
    f.write("    function getEdgeVertices(uint8 edgeId) internal pure returns (uint8[2] memory) {\n")
    f.write("        if (edgeId == 0) return " + str(list(edge_vertices_map[0])).replace('[', '[').replace(']', ']') + ";\n")
    for i in range(1, num_edges):
        f.write(f"        if (edgeId == {i}) return {list(edge_vertices_map[i])};\n")
    f.write("        return [0,0];\n")
    f.write("    }\n")
    f.write("}\n")
