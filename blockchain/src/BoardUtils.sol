// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IBoard.sol";

library BoardUtils {
    // Auto-generated topology

    function getHexagonVertices(uint8 hexId) internal pure returns (uint8[6] memory) {
        if (hexId == 0) return [0, 1, 2, 3, 4, 5];
        if (hexId == 1) return [6, 7, 0, 5, 8, 9];
        if (hexId == 2) return [10, 11, 6, 9, 12, 13];
        if (hexId == 3) return [14, 15, 16, 17, 2, 1];
        if (hexId == 4) return [18, 19, 14, 1, 0, 7];
        if (hexId == 5) return [20, 21, 18, 7, 6, 11];
        if (hexId == 6) return [22, 23, 20, 11, 10, 24];
        if (hexId == 7) return [25, 26, 27, 28, 16, 15];
        if (hexId == 8) return [29, 30, 25, 15, 14, 19];
        if (hexId == 9) return [31, 32, 29, 19, 18, 21];
        if (hexId == 10) return [33, 34, 31, 21, 20, 23];
        if (hexId == 11) return [35, 36, 33, 23, 22, 37];
        if (hexId == 12) return [38, 39, 40, 26, 25, 30];
        if (hexId == 13) return [41, 42, 38, 30, 29, 32];
        if (hexId == 14) return [43, 44, 41, 32, 31, 34];
        if (hexId == 15) return [45, 46, 43, 34, 33, 36];
        if (hexId == 16) return [47, 48, 49, 39, 38, 42];
        if (hexId == 17) return [50, 51, 47, 42, 41, 44];
        if (hexId == 18) return [52, 53, 50, 44, 43, 46];
        return [0,0,0,0,0,0];
    }

    function getHexagonEdges(uint8 hexId) internal pure returns (uint8[6] memory) {
        if (hexId == 0) return [0, 1, 2, 3, 4, 5];
        if (hexId == 1) return [6, 7, 5, 8, 9, 10];
        if (hexId == 2) return [11, 12, 10, 13, 14, 15];
        if (hexId == 3) return [16, 17, 18, 19, 1, 20];
        if (hexId == 4) return [21, 22, 20, 0, 7, 23];
        if (hexId == 5) return [24, 25, 23, 6, 12, 26];
        if (hexId == 6) return [27, 28, 26, 11, 29, 30];
        if (hexId == 7) return [31, 32, 33, 34, 17, 35];
        if (hexId == 8) return [36, 37, 35, 16, 22, 38];
        if (hexId == 9) return [39, 40, 38, 21, 25, 41];
        if (hexId == 10) return [42, 43, 41, 24, 28, 44];
        if (hexId == 11) return [45, 46, 44, 27, 47, 48];
        if (hexId == 12) return [49, 50, 51, 31, 37, 52];
        if (hexId == 13) return [53, 54, 52, 36, 40, 55];
        if (hexId == 14) return [56, 57, 55, 39, 43, 58];
        if (hexId == 15) return [59, 60, 58, 42, 46, 61];
        if (hexId == 16) return [62, 63, 64, 49, 54, 65];
        if (hexId == 17) return [66, 67, 65, 53, 57, 68];
        if (hexId == 18) return [69, 70, 68, 56, 60, 71];
        return [0,0,0,0,0,0];
    }

    function getAdjacentVertices(uint8 vertexId) internal pure returns (uint8[] memory) {
        uint8[] memory neighbors;
        if (vertexId == 0) { neighbors = new uint8[](3); neighbors[0]=1;neighbors[1]=5;neighbors[2]=7; return neighbors; }
        if (vertexId == 1) { neighbors = new uint8[](3); neighbors[0]=0;neighbors[1]=2;neighbors[2]=14; return neighbors; }
        if (vertexId == 2) { neighbors = new uint8[](3); neighbors[0]=1;neighbors[1]=3;neighbors[2]=17; return neighbors; }
        if (vertexId == 3) { neighbors = new uint8[](2); neighbors[0]=2;neighbors[1]=4; return neighbors; }
        if (vertexId == 4) { neighbors = new uint8[](2); neighbors[0]=3;neighbors[1]=5; return neighbors; }
        if (vertexId == 5) { neighbors = new uint8[](3); neighbors[0]=0;neighbors[1]=8;neighbors[2]=4; return neighbors; }
        if (vertexId == 6) { neighbors = new uint8[](3); neighbors[0]=9;neighbors[1]=11;neighbors[2]=7; return neighbors; }
        if (vertexId == 7) { neighbors = new uint8[](3); neighbors[0]=0;neighbors[1]=18;neighbors[2]=6; return neighbors; }
        if (vertexId == 8) { neighbors = new uint8[](2); neighbors[0]=9;neighbors[1]=5; return neighbors; }
        if (vertexId == 9) { neighbors = new uint8[](3); neighbors[0]=8;neighbors[1]=12;neighbors[2]=6; return neighbors; }
        if (vertexId == 10) { neighbors = new uint8[](3); neighbors[0]=24;neighbors[1]=11;neighbors[2]=13; return neighbors; }
        if (vertexId == 11) { neighbors = new uint8[](3); neighbors[0]=10;neighbors[1]=20;neighbors[2]=6; return neighbors; }
        if (vertexId == 12) { neighbors = new uint8[](2); neighbors[0]=9;neighbors[1]=13; return neighbors; }
        if (vertexId == 13) { neighbors = new uint8[](2); neighbors[0]=10;neighbors[1]=12; return neighbors; }
        if (vertexId == 14) { neighbors = new uint8[](3); neighbors[0]=1;neighbors[1]=19;neighbors[2]=15; return neighbors; }
        if (vertexId == 15) { neighbors = new uint8[](3); neighbors[0]=16;neighbors[1]=25;neighbors[2]=14; return neighbors; }
        if (vertexId == 16) { neighbors = new uint8[](3); neighbors[0]=17;neighbors[1]=28;neighbors[2]=15; return neighbors; }
        if (vertexId == 17) { neighbors = new uint8[](2); neighbors[0]=16;neighbors[1]=2; return neighbors; }
        if (vertexId == 18) { neighbors = new uint8[](3); neighbors[0]=19;neighbors[1]=21;neighbors[2]=7; return neighbors; }
        if (vertexId == 19) { neighbors = new uint8[](3); neighbors[0]=18;neighbors[1]=29;neighbors[2]=14; return neighbors; }
        if (vertexId == 20) { neighbors = new uint8[](3); neighbors[0]=11;neighbors[1]=21;neighbors[2]=23; return neighbors; }
        if (vertexId == 21) { neighbors = new uint8[](3); neighbors[0]=18;neighbors[1]=20;neighbors[2]=31; return neighbors; }
        if (vertexId == 22) { neighbors = new uint8[](3); neighbors[0]=24;neighbors[1]=37;neighbors[2]=23; return neighbors; }
        if (vertexId == 23) { neighbors = new uint8[](3); neighbors[0]=33;neighbors[1]=20;neighbors[2]=22; return neighbors; }
        if (vertexId == 24) { neighbors = new uint8[](2); neighbors[0]=10;neighbors[1]=22; return neighbors; }
        if (vertexId == 25) { neighbors = new uint8[](3); neighbors[0]=26;neighbors[1]=30;neighbors[2]=15; return neighbors; }
        if (vertexId == 26) { neighbors = new uint8[](3); neighbors[0]=40;neighbors[1]=25;neighbors[2]=27; return neighbors; }
        if (vertexId == 27) { neighbors = new uint8[](2); neighbors[0]=26;neighbors[1]=28; return neighbors; }
        if (vertexId == 28) { neighbors = new uint8[](2); neighbors[0]=16;neighbors[1]=27; return neighbors; }
        if (vertexId == 29) { neighbors = new uint8[](3); neighbors[0]=32;neighbors[1]=19;neighbors[2]=30; return neighbors; }
        if (vertexId == 30) { neighbors = new uint8[](3); neighbors[0]=25;neighbors[1]=29;neighbors[2]=38; return neighbors; }
        if (vertexId == 31) { neighbors = new uint8[](3); neighbors[0]=32;neighbors[1]=34;neighbors[2]=21; return neighbors; }
        if (vertexId == 32) { neighbors = new uint8[](3); neighbors[0]=41;neighbors[1]=29;neighbors[2]=31; return neighbors; }
        if (vertexId == 33) { neighbors = new uint8[](3); neighbors[0]=34;neighbors[1]=36;neighbors[2]=23; return neighbors; }
        if (vertexId == 34) { neighbors = new uint8[](3); neighbors[0]=33;neighbors[1]=43;neighbors[2]=31; return neighbors; }
        if (vertexId == 35) { neighbors = new uint8[](2); neighbors[0]=36;neighbors[1]=37; return neighbors; }
        if (vertexId == 36) { neighbors = new uint8[](3); neighbors[0]=33;neighbors[1]=35;neighbors[2]=45; return neighbors; }
        if (vertexId == 37) { neighbors = new uint8[](2); neighbors[0]=35;neighbors[1]=22; return neighbors; }
        if (vertexId == 38) { neighbors = new uint8[](3); neighbors[0]=42;neighbors[1]=30;neighbors[2]=39; return neighbors; }
        if (vertexId == 39) { neighbors = new uint8[](3); neighbors[0]=40;neighbors[1]=49;neighbors[2]=38; return neighbors; }
        if (vertexId == 40) { neighbors = new uint8[](2); neighbors[0]=26;neighbors[1]=39; return neighbors; }
        if (vertexId == 41) { neighbors = new uint8[](3); neighbors[0]=32;neighbors[1]=42;neighbors[2]=44; return neighbors; }
        if (vertexId == 42) { neighbors = new uint8[](3); neighbors[0]=41;neighbors[1]=38;neighbors[2]=47; return neighbors; }
        if (vertexId == 43) { neighbors = new uint8[](3); neighbors[0]=34;neighbors[1]=44;neighbors[2]=46; return neighbors; }
        if (vertexId == 44) { neighbors = new uint8[](3); neighbors[0]=41;neighbors[1]=50;neighbors[2]=43; return neighbors; }
        if (vertexId == 45) { neighbors = new uint8[](2); neighbors[0]=36;neighbors[1]=46; return neighbors; }
        if (vertexId == 46) { neighbors = new uint8[](3); neighbors[0]=43;neighbors[1]=52;neighbors[2]=45; return neighbors; }
        if (vertexId == 47) { neighbors = new uint8[](3); neighbors[0]=48;neighbors[1]=42;neighbors[2]=51; return neighbors; }
        if (vertexId == 48) { neighbors = new uint8[](2); neighbors[0]=49;neighbors[1]=47; return neighbors; }
        if (vertexId == 49) { neighbors = new uint8[](2); neighbors[0]=48;neighbors[1]=39; return neighbors; }
        if (vertexId == 50) { neighbors = new uint8[](3); neighbors[0]=51;neighbors[1]=44;neighbors[2]=53; return neighbors; }
        if (vertexId == 51) { neighbors = new uint8[](2); neighbors[0]=50;neighbors[1]=47; return neighbors; }
        if (vertexId == 52) { neighbors = new uint8[](2); neighbors[0]=53;neighbors[1]=46; return neighbors; }
        if (vertexId == 53) { neighbors = new uint8[](2); neighbors[0]=50;neighbors[1]=52; return neighbors; }
        return neighbors;
    }

    function getAdjacentEdges(uint8 edgeId) internal pure returns (uint8[] memory) {
        uint8[] memory neighbors;
        if (edgeId == 0) { neighbors = new uint8[](4); neighbors[0]=1;neighbors[1]=20;neighbors[2]=5;neighbors[3]=7; return neighbors; }
        if (edgeId == 1) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=2;neighbors[2]=19;neighbors[3]=20; return neighbors; }
        if (edgeId == 2) { neighbors = new uint8[](3); neighbors[0]=3;neighbors[1]=1;neighbors[2]=19; return neighbors; }
        if (edgeId == 3) { neighbors = new uint8[](2); neighbors[0]=2;neighbors[1]=4; return neighbors; }
        if (edgeId == 4) { neighbors = new uint8[](3); neighbors[0]=8;neighbors[1]=3;neighbors[2]=5; return neighbors; }
        if (edgeId == 5) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=8;neighbors[2]=4;neighbors[3]=7; return neighbors; }
        if (edgeId == 6) { neighbors = new uint8[](4); neighbors[0]=10;neighbors[1]=12;neighbors[2]=7;neighbors[3]=23; return neighbors; }
        if (edgeId == 7) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=5;neighbors[2]=6;neighbors[3]=23; return neighbors; }
        if (edgeId == 8) { neighbors = new uint8[](3); neighbors[0]=9;neighbors[1]=4;neighbors[2]=5; return neighbors; }
        if (edgeId == 9) { neighbors = new uint8[](3); neighbors[0]=8;neighbors[1]=10;neighbors[2]=13; return neighbors; }
        if (edgeId == 10) { neighbors = new uint8[](4); neighbors[0]=9;neighbors[1]=12;neighbors[2]=13;neighbors[3]=6; return neighbors; }
        if (edgeId == 11) { neighbors = new uint8[](4); neighbors[0]=26;neighbors[1]=12;neighbors[2]=29;neighbors[3]=15; return neighbors; }
        if (edgeId == 12) { neighbors = new uint8[](4); neighbors[0]=10;neighbors[1]=26;neighbors[2]=11;neighbors[3]=6; return neighbors; }
        if (edgeId == 13) { neighbors = new uint8[](3); neighbors[0]=9;neighbors[1]=10;neighbors[2]=14; return neighbors; }
        if (edgeId == 14) { neighbors = new uint8[](2); neighbors[0]=13;neighbors[1]=15; return neighbors; }
        if (edgeId == 15) { neighbors = new uint8[](3); neighbors[0]=11;neighbors[1]=29;neighbors[2]=14; return neighbors; }
        if (edgeId == 16) { neighbors = new uint8[](4); neighbors[0]=17;neighbors[1]=35;neighbors[2]=20;neighbors[3]=22; return neighbors; }
        if (edgeId == 17) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=18;neighbors[2]=35;neighbors[3]=34; return neighbors; }
        if (edgeId == 18) { neighbors = new uint8[](3); neighbors[0]=17;neighbors[1]=34;neighbors[2]=19; return neighbors; }
        if (edgeId == 19) { neighbors = new uint8[](3); neighbors[0]=1;neighbors[1]=18;neighbors[2]=2; return neighbors; }
        if (edgeId == 20) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=1;neighbors[2]=16;neighbors[3]=22; return neighbors; }
        if (edgeId == 21) { neighbors = new uint8[](4); neighbors[0]=25;neighbors[1]=22;neighbors[2]=38;neighbors[3]=23; return neighbors; }
        if (edgeId == 22) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=20;neighbors[2]=21;neighbors[3]=38; return neighbors; }
        if (edgeId == 23) { neighbors = new uint8[](4); neighbors[0]=25;neighbors[1]=21;neighbors[2]=6;neighbors[3]=7; return neighbors; }
        if (edgeId == 24) { neighbors = new uint8[](4); neighbors[0]=25;neighbors[1]=26;neighbors[2]=28;neighbors[3]=41; return neighbors; }
        if (edgeId == 25) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=41;neighbors[2]=21;neighbors[3]=23; return neighbors; }
        if (edgeId == 26) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=11;neighbors[2]=12;neighbors[3]=28; return neighbors; }
        if (edgeId == 27) { neighbors = new uint8[](4); neighbors[0]=28;neighbors[1]=44;neighbors[2]=30;neighbors[3]=47; return neighbors; }
        if (edgeId == 28) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=26;neighbors[2]=27;neighbors[3]=44; return neighbors; }
        if (edgeId == 29) { neighbors = new uint8[](3); neighbors[0]=11;neighbors[1]=30;neighbors[2]=15; return neighbors; }
        if (edgeId == 30) { neighbors = new uint8[](3); neighbors[0]=27;neighbors[1]=29;neighbors[2]=47; return neighbors; }
        if (edgeId == 31) { neighbors = new uint8[](4); neighbors[0]=32;neighbors[1]=51;neighbors[2]=35;neighbors[3]=37; return neighbors; }
        if (edgeId == 32) { neighbors = new uint8[](3); neighbors[0]=33;neighbors[1]=51;neighbors[2]=31; return neighbors; }
        if (edgeId == 33) { neighbors = new uint8[](2); neighbors[0]=32;neighbors[1]=34; return neighbors; }
        if (edgeId == 34) { neighbors = new uint8[](3); neighbors[0]=17;neighbors[1]=18;neighbors[2]=33; return neighbors; }
        if (edgeId == 35) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=17;neighbors[2]=37;neighbors[3]=31; return neighbors; }
        if (edgeId == 36) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=52;neighbors[2]=37;neighbors[3]=38; return neighbors; }
        if (edgeId == 37) { neighbors = new uint8[](4); neighbors[0]=35;neighbors[1]=36;neighbors[2]=52;neighbors[3]=31; return neighbors; }
        if (edgeId == 38) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=36;neighbors[2]=21;neighbors[3]=22; return neighbors; }
        if (edgeId == 39) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=41;neighbors[2]=43;neighbors[3]=55; return neighbors; }
        if (edgeId == 40) { neighbors = new uint8[](4); neighbors[0]=36;neighbors[1]=39;neighbors[2]=38;neighbors[3]=55; return neighbors; }
        if (edgeId == 41) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=25;neighbors[2]=43;neighbors[3]=39; return neighbors; }
        if (edgeId == 42) { neighbors = new uint8[](4); neighbors[0]=58;neighbors[1]=43;neighbors[2]=44;neighbors[3]=46; return neighbors; }
        if (edgeId == 43) { neighbors = new uint8[](4); neighbors[0]=41;neighbors[1]=42;neighbors[2]=58;neighbors[3]=39; return neighbors; }
        if (edgeId == 44) { neighbors = new uint8[](4); neighbors[0]=42;neighbors[1]=27;neighbors[2]=28;neighbors[3]=46; return neighbors; }
        if (edgeId == 45) { neighbors = new uint8[](3); neighbors[0]=48;neighbors[1]=61;neighbors[2]=46; return neighbors; }
        if (edgeId == 46) { neighbors = new uint8[](4); neighbors[0]=42;neighbors[1]=45;neighbors[2]=44;neighbors[3]=61; return neighbors; }
        if (edgeId == 47) { neighbors = new uint8[](3); neighbors[0]=48;neighbors[1]=27;neighbors[2]=30; return neighbors; }
        if (edgeId == 48) { neighbors = new uint8[](2); neighbors[0]=45;neighbors[1]=47; return neighbors; }
        if (edgeId == 49) { neighbors = new uint8[](4); neighbors[0]=64;neighbors[1]=50;neighbors[2]=52;neighbors[3]=54; return neighbors; }
        if (edgeId == 50) { neighbors = new uint8[](3); neighbors[0]=64;neighbors[1]=49;neighbors[2]=51; return neighbors; }
        if (edgeId == 51) { neighbors = new uint8[](3); neighbors[0]=32;neighbors[1]=50;neighbors[2]=31; return neighbors; }
        if (edgeId == 52) { neighbors = new uint8[](4); neighbors[0]=49;neighbors[1]=36;neighbors[2]=37;neighbors[3]=54; return neighbors; }
        if (edgeId == 53) { neighbors = new uint8[](4); neighbors[0]=65;neighbors[1]=57;neighbors[2]=54;neighbors[3]=55; return neighbors; }
        if (edgeId == 54) { neighbors = new uint8[](4); neighbors[0]=65;neighbors[1]=52;neighbors[2]=53;neighbors[3]=49; return neighbors; }
        if (edgeId == 55) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=57;neighbors[2]=53;neighbors[3]=39; return neighbors; }
        if (edgeId == 56) { neighbors = new uint8[](4); neighbors[0]=57;neighbors[1]=58;neighbors[2]=60;neighbors[3]=68; return neighbors; }
        if (edgeId == 57) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=68;neighbors[2]=53;neighbors[3]=55; return neighbors; }
        if (edgeId == 58) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=42;neighbors[2]=43;neighbors[3]=60; return neighbors; }
        if (edgeId == 59) { neighbors = new uint8[](3); neighbors[0]=60;neighbors[1]=61;neighbors[2]=71; return neighbors; }
        if (edgeId == 60) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=58;neighbors[2]=59;neighbors[3]=71; return neighbors; }
        if (edgeId == 61) { neighbors = new uint8[](3); neighbors[0]=59;neighbors[1]=45;neighbors[2]=46; return neighbors; }
        if (edgeId == 62) { neighbors = new uint8[](3); neighbors[0]=65;neighbors[1]=67;neighbors[2]=63; return neighbors; }
        if (edgeId == 63) { neighbors = new uint8[](2); neighbors[0]=64;neighbors[1]=62; return neighbors; }
        if (edgeId == 64) { neighbors = new uint8[](3); neighbors[0]=49;neighbors[1]=50;neighbors[2]=63; return neighbors; }
        if (edgeId == 65) { neighbors = new uint8[](4); neighbors[0]=62;neighbors[1]=67;neighbors[2]=53;neighbors[3]=54; return neighbors; }
        if (edgeId == 66) { neighbors = new uint8[](3); neighbors[0]=67;neighbors[1]=68;neighbors[2]=70; return neighbors; }
        if (edgeId == 67) { neighbors = new uint8[](3); neighbors[0]=65;neighbors[1]=66;neighbors[2]=62; return neighbors; }
        if (edgeId == 68) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=57;neighbors[2]=66;neighbors[3]=70; return neighbors; }
        if (edgeId == 69) { neighbors = new uint8[](2); neighbors[0]=70;neighbors[1]=71; return neighbors; }
        if (edgeId == 70) { neighbors = new uint8[](3); neighbors[0]=66;neighbors[1]=68;neighbors[2]=69; return neighbors; }
        if (edgeId == 71) { neighbors = new uint8[](3); neighbors[0]=59;neighbors[1]=60;neighbors[2]=69; return neighbors; }
        return neighbors;
    }

    function getVertexEdges(uint8 vertexId) internal pure returns (uint8[] memory) {
        uint8[] memory edges;
        if (vertexId == 0) { edges = new uint8[](3); edges[0]=0;edges[1]=5;edges[2]=7; return edges; }
        if (vertexId == 1) { edges = new uint8[](3); edges[0]=0;edges[1]=1;edges[2]=20; return edges; }
        if (vertexId == 2) { edges = new uint8[](3); edges[0]=1;edges[1]=2;edges[2]=19; return edges; }
        if (vertexId == 3) { edges = new uint8[](2); edges[0]=2;edges[1]=3; return edges; }
        if (vertexId == 4) { edges = new uint8[](2); edges[0]=3;edges[1]=4; return edges; }
        if (vertexId == 5) { edges = new uint8[](3); edges[0]=8;edges[1]=4;edges[2]=5; return edges; }
        if (vertexId == 6) { edges = new uint8[](3); edges[0]=10;edges[1]=12;edges[2]=6; return edges; }
        if (vertexId == 7) { edges = new uint8[](3); edges[0]=23;edges[1]=6;edges[2]=7; return edges; }
        if (vertexId == 8) { edges = new uint8[](2); edges[0]=8;edges[1]=9; return edges; }
        if (vertexId == 9) { edges = new uint8[](3); edges[0]=9;edges[1]=10;edges[2]=13; return edges; }
        if (vertexId == 10) { edges = new uint8[](3); edges[0]=11;edges[1]=29;edges[2]=15; return edges; }
        if (vertexId == 11) { edges = new uint8[](3); edges[0]=26;edges[1]=11;edges[2]=12; return edges; }
        if (vertexId == 12) { edges = new uint8[](2); edges[0]=13;edges[1]=14; return edges; }
        if (vertexId == 13) { edges = new uint8[](2); edges[0]=14;edges[1]=15; return edges; }
        if (vertexId == 14) { edges = new uint8[](3); edges[0]=16;edges[1]=20;edges[2]=22; return edges; }
        if (vertexId == 15) { edges = new uint8[](3); edges[0]=16;edges[1]=17;edges[2]=35; return edges; }
        if (vertexId == 16) { edges = new uint8[](3); edges[0]=17;edges[1]=18;edges[2]=34; return edges; }
        if (vertexId == 17) { edges = new uint8[](2); edges[0]=18;edges[1]=19; return edges; }
        if (vertexId == 18) { edges = new uint8[](3); edges[0]=25;edges[1]=21;edges[2]=23; return edges; }
        if (vertexId == 19) { edges = new uint8[](3); edges[0]=38;edges[1]=21;edges[2]=22; return edges; }
        if (vertexId == 20) { edges = new uint8[](3); edges[0]=24;edges[1]=26;edges[2]=28; return edges; }
        if (vertexId == 21) { edges = new uint8[](3); edges[0]=24;edges[1]=25;edges[2]=41; return edges; }
        if (vertexId == 22) { edges = new uint8[](3); edges[0]=27;edges[1]=30;edges[2]=47; return edges; }
        if (vertexId == 23) { edges = new uint8[](3); edges[0]=27;edges[1]=28;edges[2]=44; return edges; }
        if (vertexId == 24) { edges = new uint8[](2); edges[0]=29;edges[1]=30; return edges; }
        if (vertexId == 25) { edges = new uint8[](3); edges[0]=35;edges[1]=37;edges[2]=31; return edges; }
        if (vertexId == 26) { edges = new uint8[](3); edges[0]=32;edges[1]=51;edges[2]=31; return edges; }
        if (vertexId == 27) { edges = new uint8[](2); edges[0]=32;edges[1]=33; return edges; }
        if (vertexId == 28) { edges = new uint8[](2); edges[0]=33;edges[1]=34; return edges; }
        if (vertexId == 29) { edges = new uint8[](3); edges[0]=40;edges[1]=36;edges[2]=38; return edges; }
        if (vertexId == 30) { edges = new uint8[](3); edges[0]=36;edges[1]=37;edges[2]=52; return edges; }
        if (vertexId == 31) { edges = new uint8[](3); edges[0]=41;edges[1]=43;edges[2]=39; return edges; }
        if (vertexId == 32) { edges = new uint8[](3); edges[0]=40;edges[1]=55;edges[2]=39; return edges; }
        if (vertexId == 33) { edges = new uint8[](3); edges[0]=42;edges[1]=44;edges[2]=46; return edges; }
        if (vertexId == 34) { edges = new uint8[](3); edges[0]=42;edges[1]=43;edges[2]=58; return edges; }
        if (vertexId == 35) { edges = new uint8[](2); edges[0]=48;edges[1]=45; return edges; }
        if (vertexId == 36) { edges = new uint8[](3); edges[0]=61;edges[1]=45;edges[2]=46; return edges; }
        if (vertexId == 37) { edges = new uint8[](2); edges[0]=48;edges[1]=47; return edges; }
        if (vertexId == 38) { edges = new uint8[](3); edges[0]=49;edges[1]=52;edges[2]=54; return edges; }
        if (vertexId == 39) { edges = new uint8[](3); edges[0]=64;edges[1]=49;edges[2]=50; return edges; }
        if (vertexId == 40) { edges = new uint8[](2); edges[0]=50;edges[1]=51; return edges; }
        if (vertexId == 41) { edges = new uint8[](3); edges[0]=57;edges[1]=53;edges[2]=55; return edges; }
        if (vertexId == 42) { edges = new uint8[](3); edges[0]=65;edges[1]=53;edges[2]=54; return edges; }
        if (vertexId == 43) { edges = new uint8[](3); edges[0]=56;edges[1]=58;edges[2]=60; return edges; }
        if (vertexId == 44) { edges = new uint8[](3); edges[0]=56;edges[1]=57;edges[2]=68; return edges; }
        if (vertexId == 45) { edges = new uint8[](2); edges[0]=59;edges[1]=61; return edges; }
        if (vertexId == 46) { edges = new uint8[](3); edges[0]=59;edges[1]=60;edges[2]=71; return edges; }
        if (vertexId == 47) { edges = new uint8[](3); edges[0]=65;edges[1]=67;edges[2]=62; return edges; }
        if (vertexId == 48) { edges = new uint8[](2); edges[0]=62;edges[1]=63; return edges; }
        if (vertexId == 49) { edges = new uint8[](2); edges[0]=64;edges[1]=63; return edges; }
        if (vertexId == 50) { edges = new uint8[](3); edges[0]=66;edges[1]=68;edges[2]=70; return edges; }
        if (vertexId == 51) { edges = new uint8[](2); edges[0]=66;edges[1]=67; return edges; }
        if (vertexId == 52) { edges = new uint8[](2); edges[0]=69;edges[1]=71; return edges; }
        if (vertexId == 53) { edges = new uint8[](2); edges[0]=69;edges[1]=70; return edges; }
        return edges;
    }

    function getEdgeVertices(uint8 edgeId) internal pure returns (uint8[2] memory) {
        if (edgeId == 0) return [0, 1];
        if (edgeId == 1) return [1, 2];
        if (edgeId == 2) return [2, 3];
        if (edgeId == 3) return [3, 4];
        if (edgeId == 4) return [4, 5];
        if (edgeId == 5) return [0, 5];
        if (edgeId == 6) return [6, 7];
        if (edgeId == 7) return [0, 7];
        if (edgeId == 8) return [8, 5];
        if (edgeId == 9) return [8, 9];
        if (edgeId == 10) return [9, 6];
        if (edgeId == 11) return [10, 11];
        if (edgeId == 12) return [11, 6];
        if (edgeId == 13) return [9, 12];
        if (edgeId == 14) return [12, 13];
        if (edgeId == 15) return [10, 13];
        if (edgeId == 16) return [14, 15];
        if (edgeId == 17) return [16, 15];
        if (edgeId == 18) return [16, 17];
        if (edgeId == 19) return [17, 2];
        if (edgeId == 20) return [1, 14];
        if (edgeId == 21) return [18, 19];
        if (edgeId == 22) return [19, 14];
        if (edgeId == 23) return [18, 7];
        if (edgeId == 24) return [20, 21];
        if (edgeId == 25) return [18, 21];
        if (edgeId == 26) return [11, 20];
        if (edgeId == 27) return [22, 23];
        if (edgeId == 28) return [20, 23];
        if (edgeId == 29) return [24, 10];
        if (edgeId == 30) return [24, 22];
        if (edgeId == 31) return [25, 26];
        if (edgeId == 32) return [26, 27];
        if (edgeId == 33) return [27, 28];
        if (edgeId == 34) return [16, 28];
        if (edgeId == 35) return [25, 15];
        if (edgeId == 36) return [29, 30];
        if (edgeId == 37) return [25, 30];
        if (edgeId == 38) return [19, 29];
        if (edgeId == 39) return [32, 31];
        if (edgeId == 40) return [32, 29];
        if (edgeId == 41) return [21, 31];
        if (edgeId == 42) return [33, 34];
        if (edgeId == 43) return [34, 31];
        if (edgeId == 44) return [33, 23];
        if (edgeId == 45) return [35, 36];
        if (edgeId == 46) return [33, 36];
        if (edgeId == 47) return [37, 22];
        if (edgeId == 48) return [35, 37];
        if (edgeId == 49) return [38, 39];
        if (edgeId == 50) return [40, 39];
        if (edgeId == 51) return [40, 26];
        if (edgeId == 52) return [38, 30];
        if (edgeId == 53) return [41, 42];
        if (edgeId == 54) return [42, 38];
        if (edgeId == 55) return [32, 41];
        if (edgeId == 56) return [43, 44];
        if (edgeId == 57) return [41, 44];
        if (edgeId == 58) return [34, 43];
        if (edgeId == 59) return [45, 46];
        if (edgeId == 60) return [43, 46];
        if (edgeId == 61) return [36, 45];
        if (edgeId == 62) return [48, 47];
        if (edgeId == 63) return [48, 49];
        if (edgeId == 64) return [49, 39];
        if (edgeId == 65) return [42, 47];
        if (edgeId == 66) return [50, 51];
        if (edgeId == 67) return [51, 47];
        if (edgeId == 68) return [50, 44];
        if (edgeId == 69) return [52, 53];
        if (edgeId == 70) return [50, 53];
        if (edgeId == 71) return [52, 46];
        return [0,0];
    }
}
