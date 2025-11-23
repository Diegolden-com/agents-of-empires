// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BoardUtils} from "../src/BoardUtils.sol";

contract BoardUtilsTest is Test {
    // Since BoardUtils is currently a skeleton, we just test that it compiles and returns data.
    // In a real implementation, we would test specific adjacency.

    function test_GetHexagonVertices() public {
        // Just calling the function to ensure it doesn't revert
        // BoardUtils is a library, but we can't call internal functions directly in tests easily 
        // without a harness, or if they are public. 
        // Since I defined them as internal in the skeleton, I need a harness.
    }
}

contract BoardUtilsHarness {
    function getHexagonVertices(uint8 hexId) external pure returns (uint8[6] memory) {
        return BoardUtils.getHexagonVertices(hexId);
    }

    function getAdjacentVertices(uint8 vertexId) external pure returns (uint8[] memory) {
        return BoardUtils.getAdjacentVertices(vertexId);
    }
}

contract BoardUtilsTestWithHarness is Test {
    BoardUtilsHarness public harness;

    function setUp() public {
        harness = new BoardUtilsHarness();
    }

    function test_GetHexagonVertices() public {
        uint8[6] memory vertices = harness.getHexagonVertices(0);
        // Hex 0 vertices should be [0, 1, 2, 3, 4, 5] based on generation logic
        // Actually, let's verify what the script generated.
        // Based on script:
        // Hex 0 is (0, -2). Vertices generated sequentially.
        // Should be 0, 1, 2, 3, 4, 5.
        assertEq(vertices[0], 0);
        assertEq(vertices[1], 1);
        assertEq(vertices[2], 2);
        assertEq(vertices[3], 3);
        assertEq(vertices[4], 4);
        assertEq(vertices[5], 5);
    }

    function test_GetAdjacentVertices() public {
        uint8[] memory neighbors = harness.getAdjacentVertices(0);
        // Based on generated code: vertex 0 neighbors are [1, 5, 7]
        assertEq(neighbors.length, 3);
        assertEq(neighbors[0], 1);
        assertEq(neighbors[1], 5);
        assertEq(neighbors[2], 7);
    }
}


