
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
# Let's use a \"Vertex Map\" to assign IDs.
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

# Helper to get vertex in cubic coordinates
# This MUST match the logic in lib/board-generator.ts exactly!
def get_canonical_vertex(q, r, corner_index):
    """
    Get vertex cubic coordinates for a hex corner.
    Matches TypeScript getHexVertices() function.
    """
    # Double the hex coordinates (as in TypeScript)
    hq = q * 2
    hr = r * 2
    hs = (-q - r) * 2  # s = -q - r
    
    # Corner offsets (matching TypeScript exactly)
    offsets = [
        (1, -1, 0),   # 0: Top (NE)
        (1, 0, -1),   # 1: Top-right (E)
        (0, 1, -1),   # 2: Bottom-right (SE)
        (-1, 1, 0),   # 3: Bottom (SW)
        (-1, 0, 1),   # 4: Bottom-left (W)
        (0, -1, 1),   # 5: Top-left (NW)
    ]
    
    offset = offsets[corner_index]
    vq = hq + offset[0]
    vr = hr + offset[1]
    vs = hs + offset[2]
    
    # Return as tuple for use as dict key
    return (vq, vr, vs)


def get_canonical_edge(q, r, edge_index):
    """Get edge as a tuple of two vertex cubic coordinates."""
    v1 = get_canonical_vertex(q, r, edge_index)
    v2 = get_canonical_vertex(q, r, (edge_index + 1) % 6)
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

# print(f\"Vertices: {num_vertices}, Edges: {num_edges}\")
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
with open("blockchain/src/BoardUtils.sol", "w") as f:
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

# Output TypeScript Code
with open("lib/board-utils.ts", "w") as f:
    f.write("// Ported from blockchain/src/BoardUtils.sol\n\n")
    f.write("export const BoardUtils = {\n")
    
    # getHexagonVertices
    f.write("    getHexagonVertices(hexId: number): number[] {\n")
    f.write("        if (hexId === 0) return " + str(hex_vertices[0]) + ";\n")
    for i in range(1, 19):
        f.write(f"        if (hexId === {i}) return {hex_vertices[i]};\n")
    f.write("        return [0, 0, 0, 0, 0, 0];\n")
    f.write("    },\n\n")

    # getHexagonEdges
    f.write("    getHexagonEdges(hexId: number): number[] {\n")
    f.write("        if (hexId === 0) return " + str(hex_edges[0]) + ";\n")
    for i in range(1, 19):
        f.write(f"        if (hexId === {i}) return {hex_edges[i]};\n")
    f.write("        return [0, 0, 0, 0, 0, 0];\n")
    f.write("    },\n\n")

    # getAdjacentVertices
    f.write("    getAdjacentVertices(vertexId: number): number[] {\n")
    f.write("        if (vertexId === 0) return " + str(list(vertex_neighbors[0])) + ";\n")
    for i in range(1, num_vertices):
        f.write(f"        if (vertexId === {i}) return {list(vertex_neighbors[i])};\n")
    f.write("        return [];\n")
    f.write("    },\n\n")

    # getAdjacentEdges
    f.write("    getAdjacentEdges(edgeId: number): number[] {\n")
    f.write("        if (edgeId === 0) return " + str(list(edge_neighbors[0])) + ";\n")
    for i in range(1, num_edges):
        f.write(f"        if (edgeId === {i}) return {list(edge_neighbors[i])};\n")
    f.write("        return [];\n")
    f.write("    },\n\n")

    # getVertexEdges
    f.write("    getVertexEdges(vertexId: number): number[] {\n")
    f.write("        if (vertexId === 0) return " + str(list(vertex_edges_map[0])) + ";\n")
    for i in range(1, num_vertices):
        f.write(f"        if (vertexId === {i}) return {list(vertex_edges_map[i])};\n")
    f.write("        return [];\n")
    f.write("    }\n")
    f.write("};\n")

# Output Vertex Coordinates for board-generator.ts
# This is the key piece: export the SAME vertex IDs with their cubic coordinates
with open("lib/vertex-coordinates.ts", "w") as f:
    f.write("// Auto-generated vertex coordinate mapping\n")
    f.write("// This ensures Python and TypeScript use the SAME vertex IDs\n\n")
    f.write("export interface VertexCoordinate {\n")
    f.write("  id: number;\n")
    f.write("  q: number;\n")
    f.write("  r: number;\n")
    f.write("  s: number;\n")
    f.write("}\n\n")
    f.write("export const VERTEX_COORDINATES: VertexCoordinate[] = [\n")
    
    # Create list of vertices sorted by ID
    # vertices dict has (q, r, s) tuples as keys and IDs as values
    vertex_list = [(vid, coord[0], coord[1], coord[2]) for coord, vid in vertices.items()]
    vertex_list.sort(key=lambda x: x[0])  # Sort by ID
    
    for vid, q, r, s in vertex_list:
        f.write(f"  {{ id: {vid}, q: {q}, r: {r}, s: {s} }},\n")
    
    f.write("];\n")
