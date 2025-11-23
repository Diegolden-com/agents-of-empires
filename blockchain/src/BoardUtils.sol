// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IBoard.sol";

library BoardUtils {
    // Auto-generated topology

    function getHexagonVertices(uint8 hexId) internal pure returns (uint8[6] memory) {
        if (hexId == 0) return [0, 1, 2, 3, 4, 5];
        if (hexId == 1) return [6, 7, 8, 9, 1, 10];
        if (hexId == 2) return [11, 12, 13, 14, 7, 15];
        if (hexId == 3) return [3, 16, 17, 18, 19, 20];
        if (hexId == 4) return [9, 21, 22, 23, 16, 2];
        if (hexId == 5) return [14, 24, 25, 26, 21, 8];
        if (hexId == 6) return [27, 28, 29, 30, 24, 13];
        if (hexId == 7) return [18, 31, 32, 33, 34, 35];
        if (hexId == 8) return [23, 36, 37, 38, 31, 17];
        if (hexId == 9) return [26, 39, 40, 41, 36, 22];
        if (hexId == 10) return [30, 42, 43, 44, 39, 25];
        if (hexId == 11) return [45, 46, 47, 48, 42, 29];
        if (hexId == 12) return [38, 49, 50, 51, 52, 32];
        if (hexId == 13) return [41, 53, 54, 55, 49, 37];
        if (hexId == 14) return [44, 56, 57, 58, 53, 40];
        if (hexId == 15) return [48, 59, 60, 61, 56, 43];
        if (hexId == 16) return [55, 62, 63, 64, 65, 50];
        if (hexId == 17) return [58, 66, 67, 68, 62, 54];
        if (hexId == 18) return [61, 69, 70, 71, 66, 57];
        return [0,0,0,0,0,0];
    }

    function getHexagonEdges(uint8 hexId) internal pure returns (uint8[6] memory) {
        if (hexId == 0) return [0, 1, 2, 3, 4, 5];
        if (hexId == 1) return [6, 7, 8, 9, 10, 11];
        if (hexId == 2) return [12, 13, 14, 15, 16, 17];
        if (hexId == 3) return [18, 19, 20, 21, 22, 23];
        if (hexId == 4) return [24, 25, 26, 27, 28, 29];
        if (hexId == 5) return [30, 31, 32, 33, 34, 35];
        if (hexId == 6) return [36, 37, 38, 39, 40, 41];
        if (hexId == 7) return [42, 43, 44, 45, 46, 47];
        if (hexId == 8) return [48, 49, 50, 51, 52, 53];
        if (hexId == 9) return [54, 55, 56, 57, 58, 59];
        if (hexId == 10) return [60, 61, 62, 63, 64, 65];
        if (hexId == 11) return [66, 67, 68, 69, 70, 71];
        if (hexId == 12) return [72, 73, 74, 75, 76, 77];
        if (hexId == 13) return [78, 79, 80, 81, 82, 83];
        if (hexId == 14) return [84, 85, 86, 87, 88, 89];
        if (hexId == 15) return [90, 91, 92, 93, 94, 95];
        if (hexId == 16) return [96, 97, 98, 99, 100, 101];
        if (hexId == 17) return [102, 103, 104, 105, 106, 107];
        if (hexId == 18) return [108, 109, 110, 111, 112, 113];
        return [0,0,0,0,0,0];
    }

    function getAdjacentVertices(uint8 vertexId) internal pure returns (uint8[] memory) {
        uint8[] memory neighbors;
        if (vertexId == 0) { neighbors = new uint8[](2); neighbors[0]=1;neighbors[1]=5; return neighbors; }
        if (vertexId == 1) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=9;neighbors[2]=2;neighbors[3]=10; return neighbors; }
        if (vertexId == 2) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=1;neighbors[2]=3;neighbors[3]=9; return neighbors; }
        if (vertexId == 3) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=2;neighbors[2]=4;neighbors[3]=20; return neighbors; }
        if (vertexId == 4) { neighbors = new uint8[](2); neighbors[0]=3;neighbors[1]=5; return neighbors; }
        if (vertexId == 5) { neighbors = new uint8[](2); neighbors[0]=0;neighbors[1]=4; return neighbors; }
        if (vertexId == 6) { neighbors = new uint8[](2); neighbors[0]=10;neighbors[1]=7; return neighbors; }
        if (vertexId == 7) { neighbors = new uint8[](4); neighbors[0]=8;neighbors[1]=14;neighbors[2]=6;neighbors[3]=15; return neighbors; }
        if (vertexId == 8) { neighbors = new uint8[](4); neighbors[0]=9;neighbors[1]=21;neighbors[2]=14;neighbors[3]=7; return neighbors; }
        if (vertexId == 9) { neighbors = new uint8[](4); neighbors[0]=8;neighbors[1]=1;neighbors[2]=2;neighbors[3]=21; return neighbors; }
        if (vertexId == 10) { neighbors = new uint8[](2); neighbors[0]=1;neighbors[1]=6; return neighbors; }
        if (vertexId == 11) { neighbors = new uint8[](2); neighbors[0]=12;neighbors[1]=15; return neighbors; }
        if (vertexId == 12) { neighbors = new uint8[](2); neighbors[0]=11;neighbors[1]=13; return neighbors; }
        if (vertexId == 13) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=27;neighbors[2]=12;neighbors[3]=14; return neighbors; }
        if (vertexId == 14) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=8;neighbors[2]=13;neighbors[3]=7; return neighbors; }
        if (vertexId == 15) { neighbors = new uint8[](2); neighbors[0]=11;neighbors[1]=7; return neighbors; }
        if (vertexId == 16) { neighbors = new uint8[](4); neighbors[0]=17;neighbors[1]=2;neighbors[2]=3;neighbors[3]=23; return neighbors; }
        if (vertexId == 17) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=18;neighbors[2]=31;neighbors[3]=23; return neighbors; }
        if (vertexId == 18) { neighbors = new uint8[](4); neighbors[0]=17;neighbors[1]=19;neighbors[2]=35;neighbors[3]=31; return neighbors; }
        if (vertexId == 19) { neighbors = new uint8[](2); neighbors[0]=18;neighbors[1]=20; return neighbors; }
        if (vertexId == 20) { neighbors = new uint8[](2); neighbors[0]=19;neighbors[1]=3; return neighbors; }
        if (vertexId == 21) { neighbors = new uint8[](4); neighbors[0]=8;neighbors[1]=9;neighbors[2]=26;neighbors[3]=22; return neighbors; }
        if (vertexId == 22) { neighbors = new uint8[](4); neighbors[0]=26;neighbors[1]=36;neighbors[2]=21;neighbors[3]=23; return neighbors; }
        if (vertexId == 23) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=17;neighbors[2]=36;neighbors[3]=22; return neighbors; }
        if (vertexId == 24) { neighbors = new uint8[](4); neighbors[0]=25;neighbors[1]=13;neighbors[2]=14;neighbors[3]=30; return neighbors; }
        if (vertexId == 25) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=26;neighbors[2]=30;neighbors[3]=39; return neighbors; }
        if (vertexId == 26) { neighbors = new uint8[](4); neighbors[0]=25;neighbors[1]=21;neighbors[2]=22;neighbors[3]=39; return neighbors; }
        if (vertexId == 27) { neighbors = new uint8[](2); neighbors[0]=28;neighbors[1]=13; return neighbors; }
        if (vertexId == 28) { neighbors = new uint8[](2); neighbors[0]=27;neighbors[1]=29; return neighbors; }
        if (vertexId == 29) { neighbors = new uint8[](4); neighbors[0]=42;neighbors[1]=28;neighbors[2]=45;neighbors[3]=30; return neighbors; }
        if (vertexId == 30) { neighbors = new uint8[](4); neighbors[0]=24;neighbors[1]=25;neighbors[2]=42;neighbors[3]=29; return neighbors; }
        if (vertexId == 31) { neighbors = new uint8[](4); neighbors[0]=32;neighbors[1]=17;neighbors[2]=18;neighbors[3]=38; return neighbors; }
        if (vertexId == 32) { neighbors = new uint8[](4); neighbors[0]=33;neighbors[1]=52;neighbors[2]=38;neighbors[3]=31; return neighbors; }
        if (vertexId == 33) { neighbors = new uint8[](2); neighbors[0]=32;neighbors[1]=34; return neighbors; }
        if (vertexId == 34) { neighbors = new uint8[](2); neighbors[0]=33;neighbors[1]=35; return neighbors; }
        if (vertexId == 35) { neighbors = new uint8[](2); neighbors[0]=18;neighbors[1]=34; return neighbors; }
        if (vertexId == 36) { neighbors = new uint8[](4); neighbors[0]=41;neighbors[1]=37;neighbors[2]=22;neighbors[3]=23; return neighbors; }
        if (vertexId == 37) { neighbors = new uint8[](4); neighbors[0]=41;neighbors[1]=36;neighbors[2]=38;neighbors[3]=49; return neighbors; }
        if (vertexId == 38) { neighbors = new uint8[](4); neighbors[0]=32;neighbors[1]=49;neighbors[2]=37;neighbors[3]=31; return neighbors; }
        if (vertexId == 39) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=25;neighbors[2]=26;neighbors[3]=44; return neighbors; }
        if (vertexId == 40) { neighbors = new uint8[](4); neighbors[0]=41;neighbors[1]=44;neighbors[2]=53;neighbors[3]=39; return neighbors; }
        if (vertexId == 41) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=37;neighbors[2]=36;neighbors[3]=53; return neighbors; }
        if (vertexId == 42) { neighbors = new uint8[](4); neighbors[0]=48;neighbors[1]=43;neighbors[2]=29;neighbors[3]=30; return neighbors; }
        if (vertexId == 43) { neighbors = new uint8[](4); neighbors[0]=48;neighbors[1]=42;neighbors[2]=56;neighbors[3]=44; return neighbors; }
        if (vertexId == 44) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=40;neighbors[2]=43;neighbors[3]=39; return neighbors; }
        if (vertexId == 45) { neighbors = new uint8[](2); neighbors[0]=29;neighbors[1]=46; return neighbors; }
        if (vertexId == 46) { neighbors = new uint8[](2); neighbors[0]=45;neighbors[1]=47; return neighbors; }
        if (vertexId == 47) { neighbors = new uint8[](2); neighbors[0]=48;neighbors[1]=46; return neighbors; }
        if (vertexId == 48) { neighbors = new uint8[](4); neighbors[0]=43;neighbors[1]=42;neighbors[2]=59;neighbors[3]=47; return neighbors; }
        if (vertexId == 49) { neighbors = new uint8[](4); neighbors[0]=50;neighbors[1]=37;neighbors[2]=38;neighbors[3]=55; return neighbors; }
        if (vertexId == 50) { neighbors = new uint8[](4); neighbors[0]=65;neighbors[1]=49;neighbors[2]=51;neighbors[3]=55; return neighbors; }
        if (vertexId == 51) { neighbors = new uint8[](2); neighbors[0]=50;neighbors[1]=52; return neighbors; }
        if (vertexId == 52) { neighbors = new uint8[](2); neighbors[0]=32;neighbors[1]=51; return neighbors; }
        if (vertexId == 53) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=41;neighbors[2]=58;neighbors[3]=54; return neighbors; }
        if (vertexId == 54) { neighbors = new uint8[](4); neighbors[0]=58;neighbors[1]=53;neighbors[2]=62;neighbors[3]=55; return neighbors; }
        if (vertexId == 55) { neighbors = new uint8[](4); neighbors[0]=62;neighbors[1]=49;neighbors[2]=50;neighbors[3]=54; return neighbors; }
        if (vertexId == 56) { neighbors = new uint8[](4); neighbors[0]=57;neighbors[1]=43;neighbors[2]=44;neighbors[3]=61; return neighbors; }
        if (vertexId == 57) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=58;neighbors[2]=66;neighbors[3]=61; return neighbors; }
        if (vertexId == 58) { neighbors = new uint8[](4); neighbors[0]=57;neighbors[1]=66;neighbors[2]=53;neighbors[3]=54; return neighbors; }
        if (vertexId == 59) { neighbors = new uint8[](2); neighbors[0]=48;neighbors[1]=60; return neighbors; }
        if (vertexId == 60) { neighbors = new uint8[](2); neighbors[0]=59;neighbors[1]=61; return neighbors; }
        if (vertexId == 61) { neighbors = new uint8[](4); neighbors[0]=56;neighbors[1]=57;neighbors[2]=60;neighbors[3]=69; return neighbors; }
        if (vertexId == 62) { neighbors = new uint8[](4); neighbors[0]=68;neighbors[1]=55;neighbors[2]=54;neighbors[3]=63; return neighbors; }
        if (vertexId == 63) { neighbors = new uint8[](2); neighbors[0]=64;neighbors[1]=62; return neighbors; }
        if (vertexId == 64) { neighbors = new uint8[](2); neighbors[0]=65;neighbors[1]=63; return neighbors; }
        if (vertexId == 65) { neighbors = new uint8[](2); neighbors[0]=64;neighbors[1]=50; return neighbors; }
        if (vertexId == 66) { neighbors = new uint8[](4); neighbors[0]=57;neighbors[1]=58;neighbors[2]=67;neighbors[3]=71; return neighbors; }
        if (vertexId == 67) { neighbors = new uint8[](2); neighbors[0]=66;neighbors[1]=68; return neighbors; }
        if (vertexId == 68) { neighbors = new uint8[](2); neighbors[0]=67;neighbors[1]=62; return neighbors; }
        if (vertexId == 69) { neighbors = new uint8[](2); neighbors[0]=61;neighbors[1]=70; return neighbors; }
        if (vertexId == 70) { neighbors = new uint8[](2); neighbors[0]=69;neighbors[1]=71; return neighbors; }
        if (vertexId == 71) { neighbors = new uint8[](2); neighbors[0]=66;neighbors[1]=70; return neighbors; }
        return neighbors;
    }

    function getAdjacentEdges(uint8 edgeId) internal pure returns (uint8[] memory) {
        uint8[] memory neighbors;
        if (edgeId == 0) { neighbors = new uint8[](4); neighbors[0]=1;neighbors[1]=10;neighbors[2]=5;neighbors[3]=9; return neighbors; }
        if (edgeId == 1) { neighbors = new uint8[](6); neighbors[0]=0;neighbors[1]=2;neighbors[2]=9;neighbors[3]=10;neighbors[4]=28;neighbors[5]=29; return neighbors; }
        if (edgeId == 2) { neighbors = new uint8[](6); neighbors[0]=1;neighbors[1]=3;neighbors[2]=18;neighbors[3]=23;neighbors[4]=28;neighbors[5]=29; return neighbors; }
        if (edgeId == 3) { neighbors = new uint8[](4); neighbors[0]=18;neighbors[1]=2;neighbors[2]=4;neighbors[3]=23; return neighbors; }
        if (edgeId == 4) { neighbors = new uint8[](2); neighbors[0]=3;neighbors[1]=5; return neighbors; }
        if (edgeId == 5) { neighbors = new uint8[](2); neighbors[0]=0;neighbors[1]=4; return neighbors; }
        if (edgeId == 6) { neighbors = new uint8[](4); neighbors[0]=16;neighbors[1]=11;neighbors[2]=7;neighbors[3]=15; return neighbors; }
        if (edgeId == 7) { neighbors = new uint8[](6); neighbors[0]=34;neighbors[1]=35;neighbors[2]=6;neighbors[3]=8;neighbors[4]=15;neighbors[5]=16; return neighbors; }
        if (edgeId == 8) { neighbors = new uint8[](6); neighbors[0]=34;neighbors[1]=35;neighbors[2]=7;neighbors[3]=9;neighbors[4]=24;neighbors[5]=29; return neighbors; }
        if (edgeId == 9) { neighbors = new uint8[](6); neighbors[0]=0;neighbors[1]=1;neighbors[2]=8;neighbors[3]=10;neighbors[4]=24;neighbors[5]=29; return neighbors; }
        if (edgeId == 10) { neighbors = new uint8[](4); neighbors[0]=0;neighbors[1]=1;neighbors[2]=11;neighbors[3]=9; return neighbors; }
        if (edgeId == 11) { neighbors = new uint8[](2); neighbors[0]=10;neighbors[1]=6; return neighbors; }
        if (edgeId == 12) { neighbors = new uint8[](2); neighbors[0]=17;neighbors[1]=13; return neighbors; }
        if (edgeId == 13) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=41;neighbors[2]=12;neighbors[3]=14; return neighbors; }
        if (edgeId == 14) { neighbors = new uint8[](6); neighbors[0]=35;neighbors[1]=40;neighbors[2]=41;neighbors[3]=13;neighbors[4]=15;neighbors[5]=30; return neighbors; }
        if (edgeId == 15) { neighbors = new uint8[](6); neighbors[0]=35;neighbors[1]=6;neighbors[2]=7;neighbors[3]=14;neighbors[4]=16;neighbors[5]=30; return neighbors; }
        if (edgeId == 16) { neighbors = new uint8[](4); neighbors[0]=17;neighbors[1]=7;neighbors[2]=6;neighbors[3]=15; return neighbors; }
        if (edgeId == 17) { neighbors = new uint8[](2); neighbors[0]=16;neighbors[1]=12; return neighbors; }
        if (edgeId == 18) { neighbors = new uint8[](6); neighbors[0]=2;neighbors[1]=3;neighbors[2]=19;neighbors[3]=23;neighbors[4]=27;neighbors[5]=28; return neighbors; }
        if (edgeId == 19) { neighbors = new uint8[](6); neighbors[0]=18;neighbors[1]=20;neighbors[2]=53;neighbors[3]=52;neighbors[4]=27;neighbors[5]=28; return neighbors; }
        if (edgeId == 20) { neighbors = new uint8[](6); neighbors[0]=42;neighbors[1]=47;neighbors[2]=19;neighbors[3]=52;neighbors[4]=21;neighbors[5]=53; return neighbors; }
        if (edgeId == 21) { neighbors = new uint8[](4); neighbors[0]=42;neighbors[1]=20;neighbors[2]=22;neighbors[3]=47; return neighbors; }
        if (edgeId == 22) { neighbors = new uint8[](2); neighbors[0]=21;neighbors[1]=23; return neighbors; }
        if (edgeId == 23) { neighbors = new uint8[](4); neighbors[0]=3;neighbors[1]=18;neighbors[2]=2;neighbors[3]=22; return neighbors; }
        if (edgeId == 24) { neighbors = new uint8[](6); neighbors[0]=33;neighbors[1]=34;neighbors[2]=8;neighbors[3]=9;neighbors[4]=25;neighbors[5]=29; return neighbors; }
        if (edgeId == 25) { neighbors = new uint8[](6); neighbors[0]=33;neighbors[1]=34;neighbors[2]=58;neighbors[3]=24;neighbors[4]=26;neighbors[5]=59; return neighbors; }
        if (edgeId == 26) { neighbors = new uint8[](6); neighbors[0]=27;neighbors[1]=48;neighbors[2]=53;neighbors[3]=25;neighbors[4]=58;neighbors[5]=59; return neighbors; }
        if (edgeId == 27) { neighbors = new uint8[](6); neighbors[0]=48;neighbors[1]=18;neighbors[2]=19;neighbors[3]=53;neighbors[4]=26;neighbors[5]=28; return neighbors; }
        if (edgeId == 28) { neighbors = new uint8[](6); neighbors[0]=1;neighbors[1]=2;neighbors[2]=18;neighbors[3]=19;neighbors[4]=27;neighbors[5]=29; return neighbors; }
        if (edgeId == 29) { neighbors = new uint8[](6); neighbors[0]=1;neighbors[1]=2;neighbors[2]=8;neighbors[3]=9;neighbors[4]=24;neighbors[5]=28; return neighbors; }
        if (edgeId == 30) { neighbors = new uint8[](6); neighbors[0]=35;neighbors[1]=39;neighbors[2]=40;neighbors[3]=14;neighbors[4]=15;neighbors[5]=31; return neighbors; }
        if (edgeId == 31) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=65;neighbors[2]=64;neighbors[3]=39;neighbors[4]=40;neighbors[5]=30; return neighbors; }
        if (edgeId == 32) { neighbors = new uint8[](6); neighbors[0]=64;neighbors[1]=65;neighbors[2]=33;neighbors[3]=54;neighbors[4]=59;neighbors[5]=31; return neighbors; }
        if (edgeId == 33) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=34;neighbors[2]=54;neighbors[3]=24;neighbors[4]=25;neighbors[5]=59; return neighbors; }
        if (edgeId == 34) { neighbors = new uint8[](6); neighbors[0]=33;neighbors[1]=35;neighbors[2]=7;neighbors[3]=8;neighbors[4]=24;neighbors[5]=25; return neighbors; }
        if (edgeId == 35) { neighbors = new uint8[](6); neighbors[0]=34;neighbors[1]=7;neighbors[2]=8;neighbors[3]=14;neighbors[4]=15;neighbors[5]=30; return neighbors; }
        if (edgeId == 36) { neighbors = new uint8[](2); neighbors[0]=41;neighbors[1]=37; return neighbors; }
        if (edgeId == 37) { neighbors = new uint8[](4); neighbors[0]=38;neighbors[1]=36;neighbors[2]=70;neighbors[3]=71; return neighbors; }
        if (edgeId == 38) { neighbors = new uint8[](6); neighbors[0]=65;neighbors[1]=37;neighbors[2]=70;neighbors[3]=71;neighbors[4]=39;neighbors[5]=60; return neighbors; }
        if (edgeId == 39) { neighbors = new uint8[](6); neighbors[0]=65;neighbors[1]=38;neighbors[2]=40;neighbors[3]=60;neighbors[4]=30;neighbors[5]=31; return neighbors; }
        if (edgeId == 40) { neighbors = new uint8[](6); neighbors[0]=39;neighbors[1]=41;neighbors[2]=13;neighbors[3]=14;neighbors[4]=30;neighbors[5]=31; return neighbors; }
        if (edgeId == 41) { neighbors = new uint8[](4); neighbors[0]=40;neighbors[1]=36;neighbors[2]=13;neighbors[3]=14; return neighbors; }
        if (edgeId == 42) { neighbors = new uint8[](6); neighbors[0]=43;neighbors[1]=47;neighbors[2]=51;neighbors[3]=20;neighbors[4]=21;neighbors[5]=52; return neighbors; }
        if (edgeId == 43) { neighbors = new uint8[](6); neighbors[0]=42;neighbors[1]=44;neighbors[2]=77;neighbors[3]=76;neighbors[4]=51;neighbors[5]=52; return neighbors; }
        if (edgeId == 44) { neighbors = new uint8[](4); neighbors[0]=45;neighbors[1]=43;neighbors[2]=76;neighbors[3]=77; return neighbors; }
        if (edgeId == 45) { neighbors = new uint8[](2); neighbors[0]=44;neighbors[1]=46; return neighbors; }
        if (edgeId == 46) { neighbors = new uint8[](2); neighbors[0]=45;neighbors[1]=47; return neighbors; }
        if (edgeId == 47) { neighbors = new uint8[](4); neighbors[0]=42;neighbors[1]=20;neighbors[2]=21;neighbors[3]=46; return neighbors; }
        if (edgeId == 48) { neighbors = new uint8[](6); neighbors[0]=26;neighbors[1]=49;neighbors[2]=53;neighbors[3]=57;neighbors[4]=58;neighbors[5]=27; return neighbors; }
        if (edgeId == 49) { neighbors = new uint8[](6); neighbors[0]=48;neighbors[1]=50;neighbors[2]=83;neighbors[3]=82;neighbors[4]=57;neighbors[5]=58; return neighbors; }
        if (edgeId == 50) { neighbors = new uint8[](6); neighbors[0]=72;neighbors[1]=77;neighbors[2]=49;neighbors[3]=82;neighbors[4]=83;neighbors[5]=51; return neighbors; }
        if (edgeId == 51) { neighbors = new uint8[](6); neighbors[0]=72;neighbors[1]=42;neighbors[2]=43;neighbors[3]=77;neighbors[4]=50;neighbors[5]=52; return neighbors; }
        if (edgeId == 52) { neighbors = new uint8[](6); neighbors[0]=42;neighbors[1]=43;neighbors[2]=51;neighbors[3]=19;neighbors[4]=20;neighbors[5]=53; return neighbors; }
        if (edgeId == 53) { neighbors = new uint8[](6); neighbors[0]=48;neighbors[1]=19;neighbors[2]=20;neighbors[3]=52;neighbors[4]=26;neighbors[5]=27; return neighbors; }
        if (edgeId == 54) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=33;neighbors[2]=64;neighbors[3]=55;neighbors[4]=59;neighbors[5]=63; return neighbors; }
        if (edgeId == 55) { neighbors = new uint8[](6); neighbors[0]=64;neighbors[1]=54;neighbors[2]=56;neighbors[3]=89;neighbors[4]=88;neighbors[5]=63; return neighbors; }
        if (edgeId == 56) { neighbors = new uint8[](6); neighbors[0]=78;neighbors[1]=83;neighbors[2]=55;neighbors[3]=88;neighbors[4]=89;neighbors[5]=57; return neighbors; }
        if (edgeId == 57) { neighbors = new uint8[](6); neighbors[0]=78;neighbors[1]=48;neighbors[2]=49;neighbors[3]=83;neighbors[4]=56;neighbors[5]=58; return neighbors; }
        if (edgeId == 58) { neighbors = new uint8[](6); neighbors[0]=48;neighbors[1]=49;neighbors[2]=25;neighbors[3]=26;neighbors[4]=59;neighbors[5]=57; return neighbors; }
        if (edgeId == 59) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=33;neighbors[2]=58;neighbors[3]=54;neighbors[4]=25;neighbors[5]=26; return neighbors; }
        if (edgeId == 60) { neighbors = new uint8[](6); neighbors[0]=65;neighbors[1]=69;neighbors[2]=38;neighbors[3]=70;neighbors[4]=39;neighbors[5]=61; return neighbors; }
        if (edgeId == 61) { neighbors = new uint8[](6); neighbors[0]=69;neighbors[1]=70;neighbors[2]=94;neighbors[3]=60;neighbors[4]=62;neighbors[5]=95; return neighbors; }
        if (edgeId == 62) { neighbors = new uint8[](6); neighbors[0]=63;neighbors[1]=84;neighbors[2]=89;neighbors[3]=61;neighbors[4]=94;neighbors[5]=95; return neighbors; }
        if (edgeId == 63) { neighbors = new uint8[](6); neighbors[0]=64;neighbors[1]=84;neighbors[2]=54;neighbors[3]=55;neighbors[4]=89;neighbors[5]=62; return neighbors; }
        if (edgeId == 64) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=65;neighbors[2]=54;neighbors[3]=55;neighbors[4]=31;neighbors[5]=63; return neighbors; }
        if (edgeId == 65) { neighbors = new uint8[](6); neighbors[0]=32;neighbors[1]=64;neighbors[2]=38;neighbors[3]=39;neighbors[4]=60;neighbors[5]=31; return neighbors; }
        if (edgeId == 66) { neighbors = new uint8[](2); neighbors[0]=67;neighbors[1]=71; return neighbors; }
        if (edgeId == 67) { neighbors = new uint8[](2); neighbors[0]=66;neighbors[1]=68; return neighbors; }
        if (edgeId == 68) { neighbors = new uint8[](4); neighbors[0]=90;neighbors[1]=67;neighbors[2]=69;neighbors[3]=95; return neighbors; }
        if (edgeId == 69) { neighbors = new uint8[](6); neighbors[0]=68;neighbors[1]=70;neighbors[2]=90;neighbors[3]=60;neighbors[4]=61;neighbors[5]=95; return neighbors; }
        if (edgeId == 70) { neighbors = new uint8[](6); neighbors[0]=37;neighbors[1]=69;neighbors[2]=38;neighbors[3]=71;neighbors[4]=60;neighbors[5]=61; return neighbors; }
        if (edgeId == 71) { neighbors = new uint8[](4); neighbors[0]=38;neighbors[1]=66;neighbors[2]=37;neighbors[3]=70; return neighbors; }
        if (edgeId == 72) { neighbors = new uint8[](6); neighbors[0]=73;neighbors[1]=77;neighbors[2]=81;neighbors[3]=82;neighbors[4]=51;neighbors[5]=50; return neighbors; }
        if (edgeId == 73) { neighbors = new uint8[](6); neighbors[0]=100;neighbors[1]=101;neighbors[2]=72;neighbors[3]=74;neighbors[4]=81;neighbors[5]=82; return neighbors; }
        if (edgeId == 74) { neighbors = new uint8[](4); neighbors[0]=73;neighbors[1]=75;neighbors[2]=100;neighbors[3]=101; return neighbors; }
        if (edgeId == 75) { neighbors = new uint8[](2); neighbors[0]=74;neighbors[1]=76; return neighbors; }
        if (edgeId == 76) { neighbors = new uint8[](4); neighbors[0]=75;neighbors[1]=43;neighbors[2]=44;neighbors[3]=77; return neighbors; }
        if (edgeId == 77) { neighbors = new uint8[](6); neighbors[0]=72;neighbors[1]=43;neighbors[2]=44;neighbors[3]=76;neighbors[4]=50;neighbors[5]=51; return neighbors; }
        if (edgeId == 78) { neighbors = new uint8[](6); neighbors[0]=79;neighbors[1]=83;neighbors[2]=87;neighbors[3]=56;neighbors[4]=57;neighbors[5]=88; return neighbors; }
        if (edgeId == 79) { neighbors = new uint8[](6); neighbors[0]=106;neighbors[1]=107;neighbors[2]=78;neighbors[3]=80;neighbors[4]=87;neighbors[5]=88; return neighbors; }
        if (edgeId == 80) { neighbors = new uint8[](6); neighbors[0]=96;neighbors[1]=101;neighbors[2]=106;neighbors[3]=107;neighbors[4]=79;neighbors[5]=81; return neighbors; }
        if (edgeId == 81) { neighbors = new uint8[](6); neighbors[0]=96;neighbors[1]=101;neighbors[2]=72;neighbors[3]=73;neighbors[4]=80;neighbors[5]=82; return neighbors; }
        if (edgeId == 82) { neighbors = new uint8[](6); neighbors[0]=72;neighbors[1]=73;neighbors[2]=81;neighbors[3]=50;neighbors[4]=49;neighbors[5]=83; return neighbors; }
        if (edgeId == 83) { neighbors = new uint8[](6); neighbors[0]=78;neighbors[1]=49;neighbors[2]=50;neighbors[3]=82;neighbors[4]=56;neighbors[5]=57; return neighbors; }
        if (edgeId == 84) { neighbors = new uint8[](6); neighbors[0]=85;neighbors[1]=94;neighbors[2]=89;neighbors[3]=93;neighbors[4]=62;neighbors[5]=63; return neighbors; }
        if (edgeId == 85) { neighbors = new uint8[](6); neighbors[0]=112;neighbors[1]=113;neighbors[2]=84;neighbors[3]=86;neighbors[4]=93;neighbors[5]=94; return neighbors; }
        if (edgeId == 86) { neighbors = new uint8[](6); neighbors[0]=102;neighbors[1]=107;neighbors[2]=112;neighbors[3]=113;neighbors[4]=85;neighbors[5]=87; return neighbors; }
        if (edgeId == 87) { neighbors = new uint8[](6); neighbors[0]=102;neighbors[1]=107;neighbors[2]=78;neighbors[3]=79;neighbors[4]=86;neighbors[5]=88; return neighbors; }
        if (edgeId == 88) { neighbors = new uint8[](6); neighbors[0]=78;neighbors[1]=79;neighbors[2]=55;neighbors[3]=87;neighbors[4]=56;neighbors[5]=89; return neighbors; }
        if (edgeId == 89) { neighbors = new uint8[](6); neighbors[0]=84;neighbors[1]=55;neighbors[2]=56;neighbors[3]=88;neighbors[4]=62;neighbors[5]=63; return neighbors; }
        if (edgeId == 90) { neighbors = new uint8[](4); neighbors[0]=91;neighbors[1]=68;neighbors[2]=69;neighbors[3]=95; return neighbors; }
        if (edgeId == 91) { neighbors = new uint8[](2); neighbors[0]=90;neighbors[1]=92; return neighbors; }
        if (edgeId == 92) { neighbors = new uint8[](4); neighbors[0]=113;neighbors[1]=91;neighbors[2]=108;neighbors[3]=93; return neighbors; }
        if (edgeId == 93) { neighbors = new uint8[](6); neighbors[0]=108;neighbors[1]=113;neighbors[2]=84;neighbors[3]=85;neighbors[4]=92;neighbors[5]=94; return neighbors; }
        if (edgeId == 94) { neighbors = new uint8[](6); neighbors[0]=84;neighbors[1]=85;neighbors[2]=93;neighbors[3]=61;neighbors[4]=62;neighbors[5]=95; return neighbors; }
        if (edgeId == 95) { neighbors = new uint8[](6); neighbors[0]=68;neighbors[1]=69;neighbors[2]=62;neighbors[3]=90;neighbors[4]=61;neighbors[5]=94; return neighbors; }
        if (edgeId == 96) { neighbors = new uint8[](6); neighbors[0]=97;neighbors[1]=101;neighbors[2]=105;neighbors[3]=106;neighbors[4]=80;neighbors[5]=81; return neighbors; }
        if (edgeId == 97) { neighbors = new uint8[](4); neighbors[0]=96;neighbors[1]=105;neighbors[2]=106;neighbors[3]=98; return neighbors; }
        if (edgeId == 98) { neighbors = new uint8[](2); neighbors[0]=97;neighbors[1]=99; return neighbors; }
        if (edgeId == 99) { neighbors = new uint8[](2); neighbors[0]=98;neighbors[1]=100; return neighbors; }
        if (edgeId == 100) { neighbors = new uint8[](4); neighbors[0]=73;neighbors[1]=74;neighbors[2]=99;neighbors[3]=101; return neighbors; }
        if (edgeId == 101) { neighbors = new uint8[](6); neighbors[0]=96;neighbors[1]=100;neighbors[2]=73;neighbors[3]=74;neighbors[4]=80;neighbors[5]=81; return neighbors; }
        if (edgeId == 102) { neighbors = new uint8[](6); neighbors[0]=103;neighbors[1]=107;neighbors[2]=111;neighbors[3]=112;neighbors[4]=86;neighbors[5]=87; return neighbors; }
        if (edgeId == 103) { neighbors = new uint8[](4); neighbors[0]=112;neighbors[1]=104;neighbors[2]=102;neighbors[3]=111; return neighbors; }
        if (edgeId == 104) { neighbors = new uint8[](2); neighbors[0]=105;neighbors[1]=103; return neighbors; }
        if (edgeId == 105) { neighbors = new uint8[](4); neighbors[0]=104;neighbors[1]=97;neighbors[2]=106;neighbors[3]=96; return neighbors; }
        if (edgeId == 106) { neighbors = new uint8[](6); neighbors[0]=96;neighbors[1]=97;neighbors[2]=105;neighbors[3]=107;neighbors[4]=79;neighbors[5]=80; return neighbors; }
        if (edgeId == 107) { neighbors = new uint8[](6); neighbors[0]=102;neighbors[1]=106;neighbors[2]=79;neighbors[3]=80;neighbors[4]=86;neighbors[5]=87; return neighbors; }
        if (edgeId == 108) { neighbors = new uint8[](4); neighbors[0]=113;neighbors[1]=93;neighbors[2]=92;neighbors[3]=109; return neighbors; }
        if (edgeId == 109) { neighbors = new uint8[](2); neighbors[0]=108;neighbors[1]=110; return neighbors; }
        if (edgeId == 110) { neighbors = new uint8[](2); neighbors[0]=109;neighbors[1]=111; return neighbors; }
        if (edgeId == 111) { neighbors = new uint8[](4); neighbors[0]=112;neighbors[1]=110;neighbors[2]=102;neighbors[3]=103; return neighbors; }
        if (edgeId == 112) { neighbors = new uint8[](6); neighbors[0]=102;neighbors[1]=103;neighbors[2]=111;neighbors[3]=113;neighbors[4]=85;neighbors[5]=86; return neighbors; }
        if (edgeId == 113) { neighbors = new uint8[](6); neighbors[0]=108;neighbors[1]=112;neighbors[2]=85;neighbors[3]=86;neighbors[4]=92;neighbors[5]=93; return neighbors; }
        return neighbors;
    }

    function getVertexEdges(uint8 vertexId) internal pure returns (uint8[] memory) {
        uint8[] memory edges;
        if (vertexId == 0) { edges = new uint8[](2); edges[0]=0;edges[1]=5; return edges; }
        if (vertexId == 1) { edges = new uint8[](4); edges[0]=0;edges[1]=1;edges[2]=10;edges[3]=9; return edges; }
        if (vertexId == 2) { edges = new uint8[](4); edges[0]=1;edges[1]=2;edges[2]=28;edges[3]=29; return edges; }
        if (vertexId == 3) { edges = new uint8[](4); edges[0]=18;edges[1]=2;edges[2]=3;edges[3]=23; return edges; }
        if (vertexId == 4) { edges = new uint8[](2); edges[0]=3;edges[1]=4; return edges; }
        if (vertexId == 5) { edges = new uint8[](2); edges[0]=4;edges[1]=5; return edges; }
        if (vertexId == 6) { edges = new uint8[](2); edges[0]=11;edges[1]=6; return edges; }
        if (vertexId == 7) { edges = new uint8[](4); edges[0]=16;edges[1]=15;edges[2]=6;edges[3]=7; return edges; }
        if (vertexId == 8) { edges = new uint8[](4); edges[0]=8;edges[1]=34;edges[2]=35;edges[3]=7; return edges; }
        if (vertexId == 9) { edges = new uint8[](4); edges[0]=8;edges[1]=9;edges[2]=29;edges[3]=24; return edges; }
        if (vertexId == 10) { edges = new uint8[](2); edges[0]=10;edges[1]=11; return edges; }
        if (vertexId == 11) { edges = new uint8[](2); edges[0]=17;edges[1]=12; return edges; }
        if (vertexId == 12) { edges = new uint8[](2); edges[0]=12;edges[1]=13; return edges; }
        if (vertexId == 13) { edges = new uint8[](4); edges[0]=40;edges[1]=41;edges[2]=13;edges[3]=14; return edges; }
        if (vertexId == 14) { edges = new uint8[](4); edges[0]=35;edges[1]=30;edges[2]=14;edges[3]=15; return edges; }
        if (vertexId == 15) { edges = new uint8[](2); edges[0]=16;edges[1]=17; return edges; }
        if (vertexId == 16) { edges = new uint8[](4); edges[0]=27;edges[1]=18;edges[2]=19;edges[3]=28; return edges; }
        if (vertexId == 17) { edges = new uint8[](4); edges[0]=19;edges[1]=20;edges[2]=53;edges[3]=52; return edges; }
        if (vertexId == 18) { edges = new uint8[](4); edges[0]=42;edges[1]=20;edges[2]=21;edges[3]=47; return edges; }
        if (vertexId == 19) { edges = new uint8[](2); edges[0]=21;edges[1]=22; return edges; }
        if (vertexId == 20) { edges = new uint8[](2); edges[0]=22;edges[1]=23; return edges; }
        if (vertexId == 21) { edges = new uint8[](4); edges[0]=24;edges[1]=25;edges[2]=34;edges[3]=33; return edges; }
        if (vertexId == 22) { edges = new uint8[](4); edges[0]=25;edges[1]=26;edges[2]=59;edges[3]=58; return edges; }
        if (vertexId == 23) { edges = new uint8[](4); edges[0]=48;edges[1]=26;edges[2]=27;edges[3]=53; return edges; }
        if (vertexId == 24) { edges = new uint8[](4); edges[0]=40;edges[1]=39;edges[2]=30;edges[3]=31; return edges; }
        if (vertexId == 25) { edges = new uint8[](4); edges[0]=32;edges[1]=65;edges[2]=64;edges[3]=31; return edges; }
        if (vertexId == 26) { edges = new uint8[](4); edges[0]=32;edges[1]=33;edges[2]=59;edges[3]=54; return edges; }
        if (vertexId == 27) { edges = new uint8[](2); edges[0]=41;edges[1]=36; return edges; }
        if (vertexId == 28) { edges = new uint8[](2); edges[0]=36;edges[1]=37; return edges; }
        if (vertexId == 29) { edges = new uint8[](4); edges[0]=70;edges[1]=37;edges[2]=38;edges[3]=71; return edges; }
        if (vertexId == 30) { edges = new uint8[](4); edges[0]=65;edges[1]=60;edges[2]=38;edges[3]=39; return edges; }
        if (vertexId == 31) { edges = new uint8[](4); edges[0]=51;edges[1]=42;edges[2]=43;edges[3]=52; return edges; }
        if (vertexId == 32) { edges = new uint8[](4); edges[0]=43;edges[1]=44;edges[2]=77;edges[3]=76; return edges; }
        if (vertexId == 33) { edges = new uint8[](2); edges[0]=44;edges[1]=45; return edges; }
        if (vertexId == 34) { edges = new uint8[](2); edges[0]=45;edges[1]=46; return edges; }
        if (vertexId == 35) { edges = new uint8[](2); edges[0]=46;edges[1]=47; return edges; }
        if (vertexId == 36) { edges = new uint8[](4); edges[0]=48;edges[1]=49;edges[2]=58;edges[3]=57; return edges; }
        if (vertexId == 37) { edges = new uint8[](4); edges[0]=49;edges[1]=50;edges[2]=83;edges[3]=82; return edges; }
        if (vertexId == 38) { edges = new uint8[](4); edges[0]=72;edges[1]=50;edges[2]=51;edges[3]=77; return edges; }
        if (vertexId == 39) { edges = new uint8[](4); edges[0]=64;edges[1]=63;edges[2]=54;edges[3]=55; return edges; }
        if (vertexId == 40) { edges = new uint8[](4); edges[0]=56;edges[1]=89;edges[2]=88;edges[3]=55; return edges; }
        if (vertexId == 41) { edges = new uint8[](4); edges[0]=56;edges[1]=57;edges[2]=83;edges[3]=78; return edges; }
        if (vertexId == 42) { edges = new uint8[](4); edges[0]=69;edges[1]=60;edges[2]=61;edges[3]=70; return edges; }
        if (vertexId == 43) { edges = new uint8[](4); edges[0]=94;edges[1]=61;edges[2]=62;edges[3]=95; return edges; }
        if (vertexId == 44) { edges = new uint8[](4); edges[0]=89;edges[1]=84;edges[2]=62;edges[3]=63; return edges; }
        if (vertexId == 45) { edges = new uint8[](2); edges[0]=66;edges[1]=71; return edges; }
        if (vertexId == 46) { edges = new uint8[](2); edges[0]=66;edges[1]=67; return edges; }
        if (vertexId == 47) { edges = new uint8[](2); edges[0]=67;edges[1]=68; return edges; }
        if (vertexId == 48) { edges = new uint8[](4); edges[0]=90;edges[1]=68;edges[2]=69;edges[3]=95; return edges; }
        if (vertexId == 49) { edges = new uint8[](4); edges[0]=72;edges[1]=73;edges[2]=82;edges[3]=81; return edges; }
        if (vertexId == 50) { edges = new uint8[](4); edges[0]=73;edges[1]=74;edges[2]=100;edges[3]=101; return edges; }
        if (vertexId == 51) { edges = new uint8[](2); edges[0]=74;edges[1]=75; return edges; }
        if (vertexId == 52) { edges = new uint8[](2); edges[0]=75;edges[1]=76; return edges; }
        if (vertexId == 53) { edges = new uint8[](4); edges[0]=88;edges[1]=87;edges[2]=78;edges[3]=79; return edges; }
        if (vertexId == 54) { edges = new uint8[](4); edges[0]=80;edges[1]=106;edges[2]=107;edges[3]=79; return edges; }
        if (vertexId == 55) { edges = new uint8[](4); edges[0]=80;edges[1]=81;edges[2]=96;edges[3]=101; return edges; }
        if (vertexId == 56) { edges = new uint8[](4); edges[0]=93;edges[1]=84;edges[2]=85;edges[3]=94; return edges; }
        if (vertexId == 57) { edges = new uint8[](4); edges[0]=112;edges[1]=113;edges[2]=85;edges[3]=86; return edges; }
        if (vertexId == 58) { edges = new uint8[](4); edges[0]=102;edges[1]=107;edges[2]=86;edges[3]=87; return edges; }
        if (vertexId == 59) { edges = new uint8[](2); edges[0]=90;edges[1]=91; return edges; }
        if (vertexId == 60) { edges = new uint8[](2); edges[0]=91;edges[1]=92; return edges; }
        if (vertexId == 61) { edges = new uint8[](4); edges[0]=108;edges[1]=113;edges[2]=92;edges[3]=93; return edges; }
        if (vertexId == 62) { edges = new uint8[](4); edges[0]=96;edges[1]=97;edges[2]=106;edges[3]=105; return edges; }
        if (vertexId == 63) { edges = new uint8[](2); edges[0]=97;edges[1]=98; return edges; }
        if (vertexId == 64) { edges = new uint8[](2); edges[0]=98;edges[1]=99; return edges; }
        if (vertexId == 65) { edges = new uint8[](2); edges[0]=99;edges[1]=100; return edges; }
        if (vertexId == 66) { edges = new uint8[](4); edges[0]=112;edges[1]=111;edges[2]=102;edges[3]=103; return edges; }
        if (vertexId == 67) { edges = new uint8[](2); edges[0]=104;edges[1]=103; return edges; }
        if (vertexId == 68) { edges = new uint8[](2); edges[0]=104;edges[1]=105; return edges; }
        if (vertexId == 69) { edges = new uint8[](2); edges[0]=108;edges[1]=109; return edges; }
        if (vertexId == 70) { edges = new uint8[](2); edges[0]=109;edges[1]=110; return edges; }
        if (vertexId == 71) { edges = new uint8[](2); edges[0]=110;edges[1]=111; return edges; }
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
        if (edgeId == 7) return [8, 7];
        if (edgeId == 8) return [8, 9];
        if (edgeId == 9) return [9, 1];
        if (edgeId == 10) return [1, 10];
        if (edgeId == 11) return [10, 6];
        if (edgeId == 12) return [11, 12];
        if (edgeId == 13) return [12, 13];
        if (edgeId == 14) return [13, 14];
        if (edgeId == 15) return [14, 7];
        if (edgeId == 16) return [15, 7];
        if (edgeId == 17) return [11, 15];
        if (edgeId == 18) return [16, 3];
        if (edgeId == 19) return [16, 17];
        if (edgeId == 20) return [17, 18];
        if (edgeId == 21) return [18, 19];
        if (edgeId == 22) return [19, 20];
        if (edgeId == 23) return [3, 20];
        if (edgeId == 24) return [9, 21];
        if (edgeId == 25) return [21, 22];
        if (edgeId == 26) return [22, 23];
        if (edgeId == 27) return [16, 23];
        if (edgeId == 28) return [16, 2];
        if (edgeId == 29) return [9, 2];
        if (edgeId == 30) return [24, 14];
        if (edgeId == 31) return [24, 25];
        if (edgeId == 32) return [25, 26];
        if (edgeId == 33) return [26, 21];
        if (edgeId == 34) return [8, 21];
        if (edgeId == 35) return [8, 14];
        if (edgeId == 36) return [27, 28];
        if (edgeId == 37) return [28, 29];
        if (edgeId == 38) return [29, 30];
        if (edgeId == 39) return [24, 30];
        if (edgeId == 40) return [24, 13];
        if (edgeId == 41) return [27, 13];
        if (edgeId == 42) return [18, 31];
        if (edgeId == 43) return [32, 31];
        if (edgeId == 44) return [32, 33];
        if (edgeId == 45) return [33, 34];
        if (edgeId == 46) return [34, 35];
        if (edgeId == 47) return [18, 35];
        if (edgeId == 48) return [36, 23];
        if (edgeId == 49) return [36, 37];
        if (edgeId == 50) return [37, 38];
        if (edgeId == 51) return [38, 31];
        if (edgeId == 52) return [17, 31];
        if (edgeId == 53) return [17, 23];
        if (edgeId == 54) return [26, 39];
        if (edgeId == 55) return [40, 39];
        if (edgeId == 56) return [40, 41];
        if (edgeId == 57) return [41, 36];
        if (edgeId == 58) return [36, 22];
        if (edgeId == 59) return [26, 22];
        if (edgeId == 60) return [42, 30];
        if (edgeId == 61) return [42, 43];
        if (edgeId == 62) return [43, 44];
        if (edgeId == 63) return [44, 39];
        if (edgeId == 64) return [25, 39];
        if (edgeId == 65) return [25, 30];
        if (edgeId == 66) return [45, 46];
        if (edgeId == 67) return [46, 47];
        if (edgeId == 68) return [48, 47];
        if (edgeId == 69) return [48, 42];
        if (edgeId == 70) return [42, 29];
        if (edgeId == 71) return [45, 29];
        if (edgeId == 72) return [49, 38];
        if (edgeId == 73) return [49, 50];
        if (edgeId == 74) return [50, 51];
        if (edgeId == 75) return [51, 52];
        if (edgeId == 76) return [32, 52];
        if (edgeId == 77) return [32, 38];
        if (edgeId == 78) return [41, 53];
        if (edgeId == 79) return [53, 54];
        if (edgeId == 80) return [54, 55];
        if (edgeId == 81) return [49, 55];
        if (edgeId == 82) return [49, 37];
        if (edgeId == 83) return [41, 37];
        if (edgeId == 84) return [56, 44];
        if (edgeId == 85) return [56, 57];
        if (edgeId == 86) return [57, 58];
        if (edgeId == 87) return [58, 53];
        if (edgeId == 88) return [40, 53];
        if (edgeId == 89) return [40, 44];
        if (edgeId == 90) return [48, 59];
        if (edgeId == 91) return [59, 60];
        if (edgeId == 92) return [60, 61];
        if (edgeId == 93) return [56, 61];
        if (edgeId == 94) return [56, 43];
        if (edgeId == 95) return [48, 43];
        if (edgeId == 96) return [62, 55];
        if (edgeId == 97) return [62, 63];
        if (edgeId == 98) return [64, 63];
        if (edgeId == 99) return [64, 65];
        if (edgeId == 100) return [65, 50];
        if (edgeId == 101) return [50, 55];
        if (edgeId == 102) return [58, 66];
        if (edgeId == 103) return [66, 67];
        if (edgeId == 104) return [67, 68];
        if (edgeId == 105) return [68, 62];
        if (edgeId == 106) return [54, 62];
        if (edgeId == 107) return [58, 54];
        if (edgeId == 108) return [69, 61];
        if (edgeId == 109) return [69, 70];
        if (edgeId == 110) return [70, 71];
        if (edgeId == 111) return [66, 71];
        if (edgeId == 112) return [57, 66];
        if (edgeId == 113) return [57, 61];
        return [0,0];
    }
}
