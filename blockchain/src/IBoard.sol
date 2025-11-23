// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBoard {
    // Board Topology Constants
    // Hexagons: 19 (0-18)
    // Vertices: 54 (0-53) - Intersections
    // Edges: 72 (0-71) - Paths

    /**
     * @notice Get the 6 vertices surrounding a hexagon
     * @param hexId The ID of the hexagon (0-18)
     * @return vertices Array of 6 vertex IDs
     */
    function getHexagonVertices(uint8 hexId) external pure returns (uint8[6] memory vertices);

    /**
     * @notice Get the 6 edges surrounding a hexagon
     * @param hexId The ID of the hexagon (0-18)
     * @return edges Array of 6 edge IDs
     */
    function getHexagonEdges(uint8 hexId) external pure returns (uint8[6] memory edges);

    /**
     * @notice Get adjacent vertices for a given vertex (connected by an edge)
     * @param vertexId The ID of the vertex (0-53)
     * @return adjacentVertices Array of 2 or 3 adjacent vertex IDs
     */
    function getAdjacentVertices(uint8 vertexId) external pure returns (uint8[] memory adjacentVertices);

    /**
     * @notice Get adjacent edges for a given edge (connected by a vertex)
     * @param edgeId The ID of the edge (0-71)
     * @return adjacentEdges Array of 2, 3, or 4 adjacent edge IDs
     */
    function getAdjacentEdges(uint8 edgeId) external pure returns (uint8[] memory adjacentEdges);

    /**
     * @notice Get the edges connected to a vertex
     * @param vertexId The ID of the vertex (0-53)
     * @return connectedEdges Array of 2 or 3 edge IDs
     */
    function getVertexEdges(uint8 vertexId) external pure returns (uint8[] memory connectedEdges);

    /**
     * @notice Get the vertices connected by an edge
     * @param edgeId The ID of the edge (0-71)
     * @return connectedVertices Array of 2 vertex IDs
     */
    function getEdgeVertices(uint8 edgeId) external pure returns (uint8[2] memory connectedVertices);
}
